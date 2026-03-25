# Change Request v3 — Absolute Button-Count Brightness Offset & Pattern Builder Override

**Date:** 2026-03-11
**Status:** Pending
**Target File:** `index.html`

---

## CR-05: Absolute Button-Count Brightness Formula Display

**Request:** Replace the current relative brightness detail text (`Commanded: X% | ±Y% from buttons`) with a formula that shows the raw button-count arithmetic so the user can see exactly how physical button presses translate to a brightness offset.

**Behaviour:**
- On every BLE notify, compute `absoluteOffset = (btn1Count − btn2Count) × 5`.
- Display the formula in `#brightness-detail`:
  - Positive: `Btn1(10) − Btn2(8) = 2 × 5 = +10%`
  - Negative: `Btn1(5) − Btn2(8) = −3 × 5 = −15%`
  - Zero:     `Btn1(7) − Btn2(7) = 0 × 5 = 0%`
- Before the first notify arrives (disconnected state): `#brightness-detail` is blank.
- The main `#brightness-val` number and `#brightness-bar` are **not** changed — they continue to show `currentBright` (= `commandedBright + netBtnAdj`).

**Implementation:**
- Rewrite `updateBrightnessDetailUI()` to compute `(lastBtn1 − lastBtn2) × 5` from the already-available `lastBtn1` / `lastBtn2` variables and format the formula string.
- No new persistent state variables are required.

**UI element:** `#brightness-detail` — existing `<p>` below `#brightness-bar`.

---

## CR-06: Pattern Builder — Absolute Offset Replaces globalBrightOffset

**Request:** Replace the incremental `globalBrightOffset` mechanism (which accumulated button presses since the sequence started and reset on Play/Stop) with the **absolute** `(btn1 − btn2) × 5` offset derived directly from the device's current raw button counts. This ensures all pattern steps are consistently adjusted by the same brightness delta regardless of when Play was pressed.

**Behaviour:**

- Define `absoluteOffset = clamp((lastBtn1 − lastBtn2) × 5, −100, 100)` — computed inline wherever needed; no new persistent variable.
- **`sendCurrentPattern()`:** send each step at `effBright = clamp(p.brightness + absoluteOffset, 0, 100)`.
- **Adaptive re-send during sequence (B-07):** use `absoluteOffset` instead of `globalBrightOffset` so the currently playing step is also updated immediately when buttons are pressed.
- **`#global-offset-badge`:** shows `Offset: +X%` / `Offset: −X%` based on `absoluteOffset`. Hidden when `absoluteOffset = 0`. Updates on every notify during playback.
- **Remove** the `globalBrightOffset` accumulation block from `onNotify` (`globalBrightOffset += btn1Pressed * 5`, etc.) — no longer needed.
- **Remove** the `let globalBrightOffset = 0` variable declaration and all mutation sites.
- **Remove** `globalBrightOffset = 0` resets from `playSequence()`, `finishSequence()`, and `stopSequence()`.

**Examples — offset = +10% (btn1 = 10, btn2 = 8):**

| # | Pattern brightness (set) | Effective brightness sent |
|---|--------------------------|--------------------------|
| 1 | 50% | 60% |
| 2 | 60% | 70% |
| 3 | 95% | 100% (clamped) |
| 4 | 5% | 15% |

**Examples — offset = −15% (btn1 = 5, btn2 = 8):**

| # | Pattern brightness (set) | Effective brightness sent |
|---|--------------------------|--------------------------|
| 1 | 50% | 35% |
| 2 | 10% | 0% (clamped) |

**UI element:** `#global-offset-badge` — existing badge in the Pattern Builder panel header.

---

## Implementation File Map

| File | Area | Change |
|------|------|--------|
| `index.html` | `let globalBrightOffset = 0` declaration | Remove |
| `index.html` | `updateBrightnessDetailUI()` | Rewrite to show `(lastBtn1 − lastBtn2) × 5` formula |
| `index.html` | `updateGlobalOffsetBadge()` | Compute `absoluteOffset` inline; remove `globalBrightOffset` reference |
| `index.html` | `onNotify()` — sequence block | Remove `globalBrightOffset ±=` lines; keep B-07 re-send using `absoluteOffset` |
| `index.html` | `sendCurrentPattern()` | Replace `p.brightness + globalBrightOffset` with `p.brightness + absoluteOffset` |
| `index.html` | `playSequence()` | Remove `globalBrightOffset = 0` reset |
| `index.html` | `finishSequence()` | Remove `globalBrightOffset = 0` reset and `updateGlobalOffsetBadge()` call (badge now auto-updates from onNotify) |
| `index.html` | `stopSequence()` | Remove `globalBrightOffset = 0` reset |

---

## Instruction File Updates

| File | Change |
|------|--------|
| `03_ui_requirements.md` | Update Section 8 (Brightness Detail): formula display spec |
| `03_ui_requirements.md` | Update Section 9 (Pattern Builder): offset source changed to absolute count |
| `04_implementation_plan.md` | Update Phase 10 (CR-04) to reflect removal of `globalBrightOffset` |
