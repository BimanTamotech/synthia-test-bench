# Bugs v3 — Brightness Calculation Logic

**Date:** 2026-03-12
**Related CR:** `change_request_v4.md` (CR-07 through CR-10)

---

## B-10: Pattern Builder Double-Counts Button Offset in commandedBright

**Severity:** Critical
**Status:** Fixed

**Symptom:** When a Pattern Builder sequence plays, the brightness drifts higher or lower than expected. After the sequence, brightness values are wrong because `commandedBright` has been corrupted with an offset-adjusted value.

**Root cause:** `sendCurrentPattern()` computes `effBright = clamp(p.brightness + btnOffset, 0, 100)` and passes it to `sendCommand()`. Inside `sendCommand()`, line `commandedBright = cmd[5]` stores `effBright` (which already includes the button offset) as the new commanded brightness. On the next `recalcBrightness()` call, the formula `commandedBright + (lastBtn1 - lastBtn2) * 5` applies the offset a **second time**.

**Example:**
- Pattern step brightness = 30%, btn1=12, btn2=10 → offset = 10%
- `sendCurrentPattern` sends effBright = 40%
- `sendCommand` sets `commandedBright = 40`
- Next `recalcBrightness`: `40 + 10 = 50%` — **should be 40%**
- This compounds on every pattern step and every notify

**Fix:** In `sendCurrentPattern()`, bypass the `commandedBright` tracking by sending the command directly via `writeChar` instead of `sendCommand()`, OR set `commandedBright` to `p.brightness` (the raw pattern value, without offset) after calling `sendCommand()`.

**File:** `index.html` — `sendCurrentPattern()`

---

## B-11: Adaptive Re-send (Non-Sequence) Uses totalBrightness Instead of Re-computing from commandedBright

**Severity:** Medium
**Status:** Fixed

**Symptom:** When buttons are pressed outside of sequence playback, the adaptive re-send sets `cmd[5] = totalBrightness`. If `totalBrightness` was previously corrupted by B-10 or by any rounding drift, the re-sent command carries the wrong brightness.

**Root cause:** Line 1085: `cmd[5] = totalBrightness` uses the derived value. Since this command goes through `writeValueWithoutResponse` directly (not `sendCommand`), it doesn't corrupt `commandedBright` — but it should use a freshly computed value to be safe.

**Fix:** Compute `clamp(commandedBright + (lastBtn1 - lastBtn2) * 5, 0, 100)` inline instead of relying on `totalBrightness`.

**File:** `index.html` — `onNotify()` adaptive re-send block

---

## B-12: sendCommand Calls recalcBrightness Before BLE Write

**Severity:** Low
**Status:** Open

**Symptom:** When a 0xBC command is sent, the brightness UI updates immediately before the device receives the command. If the BLE write fails, the UI shows the new brightness but the device is still at the old value.

**Root cause:** In `sendCommand()`, `commandedBright = cmd[5]` and `recalcBrightness()` are called before `writeValueWithoutResponse()`. If the write throws, `commandedBright` is already changed.

**Fix:** Move `commandedBright` update and `recalcBrightness()` to after the successful BLE write.

**File:** `index.html` — `sendCommand()`

---

## B-13: First-Notify Baseline Returns Early — Skips Initial Brightness Display

**Severity:** Low
**Status:** Open

**Symptom:** On the very first notify after connecting, the brightness detail formula is computed but the function returns early. If a preset was sent before the first notify, the brightness card shows the preset value from `sendCommand`'s `recalcBrightness()` (with btn counts = 0), which is correct. But if no command was sent yet, the display stays at the default 10% without showing the formula.

**Root cause:** The `return` on line 1058 exits `onNotify` after the first-notify baseline, so the adaptive re-send block never runs on the first packet. This is actually intentional (no delta yet), but it means the formula detail is shown once and then the function exits — no further processing.

**Fix:** This is mostly cosmetic but the `return` could be removed since `recalcBrightness()` already handles the case where btn1=lastBtn1 and btn2=lastBtn2 (offset is the same, no change triggers).

**File:** `index.html` — `onNotify()` first-notify block

---

## Summary

| Bug | Severity | Root Cause | Impact |
|-----|----------|------------|--------|
| B-10 | Critical | `sendCurrentPattern` → `sendCommand` stores offset-adjusted brightness as `commandedBright` | Double-counted offset, brightness drift |
| B-11 | Medium | Adaptive re-send uses cached `totalBrightness` | Potential stale value in re-sent command |
| B-12 | Low | `commandedBright` updated before BLE write | UI shows value before device confirms |
| B-13 | Low | First-notify `return` skips adaptive re-send | No practical issue, but unnecessary early exit |
