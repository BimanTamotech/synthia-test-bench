# Bugs v0 — Synthia Controller v2

**Date:** 2026-03-11

---

## B-01: Delta Overwrite — Both Buttons Firing in Same Notification

**Severity:** High
**Status:** Fixed

**Symptom:** When button 1 and button 2 both increment in a single `0xCC` notify packet (e.g. device batches two presses), only the button 2 change is applied. The button 1 brightness increase is silently lost.

**Root cause:**
```js
// BUG: second if overwrites delta from first if
let delta = 0;
if (newBtn1 > lastBtn1) { delta = (newBtn1 - lastBtn1) * 5; }
if (newBtn2 > lastBtn2) { delta = -(newBtn2 - lastBtn2) * 5; }  // ← clobbers btn1 delta
```

**Fix:** Compute net delta from both buttons simultaneously:
```js
const btn1Delta = Math.max(0, newBtn1 - lastBtn1);
const btn2Delta = Math.max(0, newBtn2 - lastBtn2);
const delta = (btn1Delta - btn2Delta) * 5;
```

---

## B-02: First Notification Spurious Brightness Jump

**Severity:** High
**Status:** Fixed

**Symptom:** When the user connects to a device that already has non-zero button counts (e.g. btn1=5, btn2=4 from prior use), the first notify packet causes a large spurious brightness delta. With the B-01 overwrite bug also present, this typically manifests as a large negative jump (currentBright → 0), then the user sends a preset and sees 10% but button counts 5/4 are already the baseline — so subsequent button presses show no change.

**Root cause:** `lastBtn1` and `lastBtn2` are initialized to `0` in JS state but the device's actual counts may be non-zero at connect time. The first notification computes `delta = (deviceCount - 0) * 5` producing a large unintended brightness change.

**Fix:** On the first notification after connecting, snapshot the current device counts as the baseline without computing any delta:
```js
if (!hasReceivedFirstNotify) {
  hasReceivedFirstNotify = true;
  lastBtn1 = btn1;
  lastBtn2 = btn2;
  baseBtn1 = btn1;
  baseBtn2 = btn2;
  // update dashboard display only, no brightness change
  return;
}
```
Reset `hasReceivedFirstNotify = false` on disconnect.

---

## B-03: Adaptive Re-send Resets Commanded Baseline and Timer

**Severity:** Medium
**Status:** Fixed

**Symptom:** Every time a physical button is pressed on the device, the adaptive brightness logic calls `sendCommand()` to re-send the active BC command with updated brightness. This has two unintended side effects:
1. **Timer restarts** — the countdown resets to the full original duration on every button press.
2. **Commanded baseline resets** — `commandedBright`, `baseBtn1`, `baseBtn2` are updated on every button press, so `#brightness-detail` always shows "Commanded: X% | 0% from buttons" (delta is always 0).

**Root cause:** Adaptive re-send went through the full `sendCommand()` which unconditionally calls `startTimer()` and resets the commanded baseline.

**Fix:** Adaptive re-send uses a lightweight direct write (`writeChar.writeValueWithoutResponse`) that does NOT restart the timer and does NOT reset the commanded baseline. Only user-initiated sends (presets, BC panel, F1 panel, custom hex, pattern builder) go through `sendCommand()`.

---

## B-05: Brightness UI Not Updating — Incremental Accumulation Drift

**Severity:** High
**Status:** Fixed

**Symptom:** After connecting and sending a preset, pressing physical buttons does not update the brightness display. The UI always shows the original commanded brightness (e.g. 10%) regardless of how many times buttons are pressed.

**Root cause:** The incremental approach `currentBright += delta` can silently diverge when:
- The first-notify guard (B-02) snapshots `baseBtn1/baseBtn2` from the device's current counts but the preset is sent before the first notify fires (so `baseBtn1=0`, not the device's actual counts)
- This causes `totalBtnDelta` to be offset by the device's pre-existing counts, making every per-packet `delta` equal to 0 in the common case
- Additionally, calling `updateBrightnessUI(0)` unconditionally at the end of `onNotify` after `updateBrightnessUI(delta)` inside the `if (delta !== 0)` block serves no useful purpose and can mask the update

**Fix:** Replace incremental accumulation with a total-delta recomputation:
```js
// After updating lastBtn1/lastBtn2:
const totalBtnDelta = ((lastBtn1 - baseBtn1) - (lastBtn2 - baseBtn2)) * 5;
const newBright = clamp(commandedBright + totalBtnDelta, 0, 100);
currentBright = newBright;
```
`currentBright` is now always `commandedBright + net presses since last user command`. It cannot drift because it never accumulates — every notify recomputes from the stable baseline (`commandedBright`, `baseBtn1`, `baseBtn2`) set by `sendCommand()`.

---

## B-04: Expected Behavior After All Fixes

After connecting and sending Blue preset (brightness=10%):

| Action | btn1 | btn2 | currentBright | commandedBright | Detail shown |
|--------|------|------|---------------|-----------------|--------------|
| Connect (device has btn1=3, btn2=2 already) | 3 | 2 | 10% | 10% | Commanded: 10% |
| Send Blue preset | 3 | 2 | 10% | 10% | Commanded: 10% |
| Press btn1 once | 4 | 2 | 15% | 10% | Commanded: 10% \| +5% from buttons |
| Press btn1 again | 5 | 2 | 20% | 10% | Commanded: 10% \| +10% from buttons |
| Press btn2 once | 5 | 3 | 15% | 10% | Commanded: 10% \| +5% from buttons |
| Press btn2 again | 5 | 4 | 10% | 10% | Commanded: 10% |
| Press btn1 once more | 6 | 4 | 15% | 10% | Commanded: 10% \| +5% from buttons |
