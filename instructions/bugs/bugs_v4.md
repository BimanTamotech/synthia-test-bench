# Bugs v4 — Slider UI Issues

**Date:** 2026-03-25
**Related CR:** `change_request_v6.md` (Slider Conversion)

---

## B-14: BC Frequency Still a Dropdown

**Severity:** Medium
**Status:** Open

**Symptom:** The BC panel Frequency control is still a `<select>` dropdown with only two options (Steady, 10Hz), while all other numeric inputs in Manual Control and Breathing Effect panels were converted to sliders in CR v6.

**Root cause:** CR v6 intentionally skipped Frequency because it was a `<select>` not a text box. However, the user expects all numeric controls to be sliders for consistency.

**Fix:** Replace `<select id="bc-frequency">` with `<input type="range" min="0" max="255" value="10">` and add a value label. Display "Steady" when value is 0, otherwise show `{value} Hz`.

**File:** `index.html` — BC panel HTML (line ~384) + JS DOM refs and `updateBcPreview()`

---

## B-15: Slider Track Not Visible

**Severity:** Medium
**Status:** Open

**Symptom:** Range slider track bars are nearly invisible against the dark card backgrounds. The slider thumb is visible but the track it slides along blends into the background, making it hard to see the slider's position range.

**Root cause:** The CSS track color `#334155` (slate-700) has insufficient contrast against `bg-gray-900` / `bg-gray-800` card backgrounds. The disabled track color `#1e293b` is nearly identical to the page background `bg-gray-950`. Additionally, Firefox `-moz-range-track` and `-moz-range-thumb` styles are completely missing, so sliders may not render correctly in Firefox.

**Fix:**
1. Brighten active track: `#334155` -> `#475569` (slate-600)
2. Brighten disabled track: `#1e293b` -> `#334155` (slate-700)
3. Add Firefox `-moz-range-track` and `-moz-range-thumb` equivalents

**File:** `index.html` — CSS `<style>` block (lines 65-83)

---

## Summary

| Bug | Severity | Root Cause | Impact |
|-----|----------|------------|--------|
| B-14 | Medium | Frequency left as `<select>` during CR v6 slider conversion | Inconsistent UI, limited frequency options |
| B-15 | Medium | Track color too close to background, missing Firefox styles | Sliders appear as just a floating dot with no visible track |
