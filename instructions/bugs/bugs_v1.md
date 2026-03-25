# Bugs v1 — Synthia Controller v2

**Date:** 2026-03-11

---

## B-06: Brightness Card Not Updated Immediately When Pattern Builder Sends a Command

**Severity:** High
**Status:** Fixed

**Symptom:** When the Pattern Builder plays a sequence, the brightness card (`#brightness-val`, `#brightness-bar`, `#brightness-detail`) continues to show the previous step's brightness value until the next BLE notify packet arrives. If notify packets are infrequent, the card can lag behind the actual commanded brightness by several seconds.

**Root cause:** `sendCurrentPattern()` calls `sendCommand(cmd)` which updates `commandedBright`, `baseBtn1`, and `baseBtn2`, but does NOT update `currentBright` or refresh any brightness UI. The card update only happens inside `onNotify`, so it is delayed until the next notify fires.

**Fix:** Make `sendCurrentPattern` async and immediately update `currentBright` and the brightness UI after `sendCommand` resolves:
```js
async function sendCurrentPattern() {
  ...
  const ok = await sendCommand(cmd);
  if (ok) {
    currentBright = effBright;
    updateBrightnessUI(0);
    updateBrightnessDetailUI();
  }
  sequenceTimeout = setTimeout(() => nextPattern(), p.duration * 1000);
}
```

**File changed:** `index.html` — `sendCurrentPattern()` function.

---

## B-07: Current Pattern Step Not Re-Sent When Buttons Pressed During Sequence

**Severity:** Medium
**Status:** Fixed

**Symptom:** While a sequence is playing, pressing physical buttons accumulates `globalBrightOffset` and future steps use the offset. However, the **currently playing** step is NOT re-sent with the updated brightness — the device continues running the original commanded brightness for the rest of that step's duration.

**Root cause:** The adaptive re-send block in `onNotify` is guarded by `!sequencePlaying`, so it is entirely skipped during sequence play. The only mechanism for the current step to get a brightness update would be the next call to `sendCurrentPattern`, which only runs after the full step duration has elapsed.

**Fix:** Add a lightweight re-send for the active pattern step during sequence play, using a direct `writeValueWithoutResponse` (does NOT restart the timer or reset the commanded baseline):
```js
// Inside onNotify, after updating globalBrightOffset:
if (sequencePlaying && (btn1Pressed > 0 || btn2Pressed > 0) && writeChar && sequenceIndex < patterns.length) {
  const p = patterns[sequenceIndex];
  const effBright = clamp(p.brightness + globalBrightOffset, 0, 100);
  const resendCmd = buildBC(p.duration, p.color, p.freq, effBright);
  writeChar.writeValueWithoutResponse(resendCmd).catch(() => {});
}
```

**File changed:** `index.html` — `onNotify()` function.

---

## B-08: Pattern Builder Columns Break Words / Inconsistent Widths

**Severity:** Low
**Status:** Fixed

**Symptom:** The column headers in the Pattern Builder (e.g., "Freq (Hz)", "Dur (s)", "Bright %") wrap mid-word or split across two lines on narrower viewports, misaligning with the input fields below them.

**Root cause:** Header `<span>` elements lack `whitespace-nowrap`, allowing the browser to break at spaces inside labels like "Freq (Hz)" → "Freq" / "(Hz)". Additionally the delete-button column had only `w-4` in the header but the row button is slightly wider.

**Fix:** Add `whitespace-nowrap` to all header spans and increase the delete-column header width from `w-4` to `w-6` to match the row button:
```html
<div class="flex items-center gap-2 px-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
  <span class="w-5 text-right shrink-0 whitespace-nowrap">#</span>
  <span class="flex-1 whitespace-nowrap">Color</span>
  <span class="flex-1 whitespace-nowrap">Freq (Hz)</span>
  <span class="w-16 shrink-0 whitespace-nowrap">Dur (s)</span>
  <span class="w-16 shrink-0 whitespace-nowrap">Bright %</span>
  <span class="w-6 shrink-0"></span>
</div>
```
Row inputs also gain `shrink-0` so they never collapse below their declared width.

**File changed:** `index.html` — Pattern Builder HTML and `renderPatternRow()`.

---

## Test Cases — Relative Brightness via Button Presses

These cases verify that the brightness card value and detail text update correctly as button 1 (increase) and button 2 (decrease) are pressed.

Assume device starts with btn1=0, btn2=0 (clean connect). User sends **Blue preset** (brightness=10%).

| Step | Action | btn1 | btn2 | Expected `currentBright` | Expected `#brightness-detail` |
|------|--------|------|------|--------------------------|-------------------------------|
| TC-01 | Connect + send Blue preset | 0 | 0 | 10% | `Commanded: 10%` |
| TC-02 | Press btn1 once (+5%) | 1 | 0 | 15% | `Commanded: 10% \| +5% from buttons` |
| TC-03 | Press btn1 again (+5%) | 2 | 0 | 20% | `Commanded: 10% \| +10% from buttons` |
| TC-04 | Press btn1 three more times | 5 | 0 | 35% | `Commanded: 10% \| +25% from buttons` |
| TC-05 | Press btn2 once (−5%) | 5 | 1 | 30% | `Commanded: 10% \| +20% from buttons` |
| TC-06 | Press btn2 again (−5%) | 5 | 2 | 25% | `Commanded: 10% \| +15% from buttons` |
| TC-07 | Press btn2 five times total | 5 | 5 | 10% | `Commanded: 10%` |
| TC-08 | Press btn2 two more times (would go negative) | 5 | 7 | 0% | `Commanded: 10% \| −10% from buttons` (clamped to 0%) |
| TC-09 | Send Blue preset again (resets baseline) | 5 | 7 | 10% | `Commanded: 10%` |
| TC-10 | Press btn1 once | 6 | 7 | 15% | `Commanded: 10% \| +5% from buttons` |

**Invariant:** `currentBright = clamp(commandedBright + (lastBtn1 − baseBtn1 − (lastBtn2 − baseBtn2)) × 5, 0, 100)`.
The card value should always match this formula. The `#brightness-detail` text should show `Commanded: X%` when delta=0, or `Commanded: X% | ±Y% from buttons` otherwise.

---

## Test Cases — Pattern Builder with Button Brightness Adjustment

Sequence: 2 rows — Row 1: Blue 30s 50%, Row 2: Red 30s 80%.

| Step | Action | Expected brightness card | Expected pattern sends |
|------|--------|--------------------------|------------------------|
| PB-01 | Press Play | Card shows 50% immediately | BC cmd with bright=50 |
| PB-02 | Press btn1 once during Row 1 | Card shows 55%, globalOffset=+5 | Current row re-sent with bright=55 |
| PB-03 | Row 1 finishes → Row 2 starts | Card shows 85%, globalOffset=+5 | BC cmd with bright=85 (80+5) |
| PB-04 | Press btn2 twice during Row 2 | Card shows 75%, globalOffset=−5 | Current row re-sent with bright=75 |
| PB-05 | Sequence ends | globalOffset resets to 0 | Badge hidden |
