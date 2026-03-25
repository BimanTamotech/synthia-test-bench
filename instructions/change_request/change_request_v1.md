# Change Request v1 — Bug Fixes & UX Improvements

**Date:** 2026-03-11
**Status:** Implemented
**Based on:** Change Request v0 (features CR-01 – CR-04)

---

## MR-01: Fix "Commanded: 0%" Bug

**Problem:** The `#brightness-detail` element always displayed `Commanded: 0%` regardless of the brightness value sent.

**Root cause:** In `sendCommand()`, `commandedBright` was captured as `commandedBright = currentBright` at the moment of the call. However, at all call sites (`bcSend`, preset buttons, pattern builder), `currentBright` is updated **after** `sendCommand` returns. So `commandedBright` always captured the stale previous brightness, not the intended value.

**Fix:** For `0xBC` commands, read the actual brightness directly from the command byte (`cmd[5]`) instead of from `currentBright`:
```js
commandedBright = (cmd[0] === 0xBC) ? cmd[5] : currentBright;
```

**File changed:** `index.html` — `sendCommand()` function.

---

## MR-02: Pattern Builder — Frequency Free-Text Input

**Problem:** The frequency field in each pattern row was a dropdown with only two options (10Hz / Steady). Users could not specify arbitrary frequency values.

**Fix:** Replaced the `<select>` with `<input type="number" min="0" max="255" placeholder="Hz">`. Value `0` = Steady, `10` = 10Hz, other values are passed directly as the frequency byte.

**File changed:** `index.html` — `renderPatternRow()` function.

---

## MR-03: Pattern Builder — Column Headers

**Problem:** The pattern rows had no column labels, making it unclear which field was Color, Frequency, Duration, or Brightness.

**Fix:** Added a static header row above `#pattern-rows` with labels: `#`, `Color`, `Freq (Hz)`, `Dur (s)`, `Bright %`.

**File changed:** `index.html` — Pattern Builder HTML section.

---

## Instruction File Updates

| File | Change |
|---|---|
| `03_ui_requirements.md` | Update Section 9 (Pattern Builder): frequency field → free-text number, note column headers |
| `04_implementation_plan.md` | Update Phase 11 checkbox for frequency field type |
