# Change Request v0 — Synthia Controller v2

**Date:** 2026-03-11
**Status:** Approved
**Target File:** `index.html`

---

## CR-01: Command Timer

**Request:** Add a timer that starts whenever any command is sent to the device.

**Behaviour:**
- `0xBC` commands: countdown from the command's `durationSec` to 0, then display "Expired" with a pulsing red animation.
- `0xF1` and custom hex commands: count up as elapsed time.
- Display format: `MM:SS` (e.g. `04:59`) in a new dashboard card row.
- Timer resets and restarts each time a new command is sent.
- Timer stops on BLE disconnect.

**UI element:** `#cmd-timer-row` in the dashboard grid.

---

## CR-02: Relative Brightness Display

**Request:** Show brightness as a relative change since the last command was sent, in addition to the absolute current value.

**Behaviour:**
- When a command is sent, record `commandedBright` (the brightness value at send time) and the current `btn1Count` / `btn2Count` as `baseBtn1` / `baseBtn2`.
- On every notify update, compute `relativeDelta = (currentBtn1 - baseBtn1 - (currentBtn2 - baseBtn2)) * 5` (%).
- Display below the brightness bar: `Commanded: X% | +Y% from buttons` (or `−Y%` if negative, or nothing if zero).

**UI element:** `#brightness-detail` — a small text line below `#brightness-bar`.

---

## CR-03: Pattern Builder

**Request:** Add a Pattern Builder section that lets the user define a sequence of `0xBC` lighting steps and play them in order.

**Behaviour:**
- Each row in the sequence defines: Color, Frequency, Duration (seconds), Brightness (%).
- **Add Row** button appends a new row with default values.
- Each row has a delete button; rows are re-numbered on delete.
- **Play** button starts executing the sequence from row 1:
  - Sends the `0xBC` command for the current row.
  - Waits for the row's `duration` seconds (using `setTimeout`).
  - Advances to the next row; repeats until all rows are done.
  - Active row is highlighted in indigo.
- **Stop** button halts the sequence at any point.
- A progress indicator shows `Pattern N of M` and a progress bar.
- Play/Stop/Add Row buttons disable when BLE is disconnected.
- All row inputs are disabled while a sequence is playing.

**UI elements:** `#pattern-rows`, `#pattern-empty`, `#pattern-add`, `#seq-play`, `#seq-stop`, `#seq-progress-row`, `#seq-progress-label`, `#seq-progress-bar`.

---

## CR-04: Global Brightness Offset During Sequence

**Request:** While a sequence is playing, physical button presses on the device should adjust the brightness of all remaining pattern steps globally.

**Behaviour:**
- On each new `Button1_Count` increment during playback: `globalBrightOffset += 5`.
- On each new `Button2_Count` increment during playback: `globalBrightOffset -= 5`.
- Before sending each pattern step, effective brightness = `clamp(pattern.brightness + globalBrightOffset, 0, 100)`.
- `globalBrightOffset` resets to 0 when Play is pressed or sequence finishes/stops.
- An offset badge `#global-offset-badge` shows the current offset (e.g. `Offset: −10%`). Hidden when offset is 0.

**UI element:** `#global-offset-badge` — displayed in the Pattern Builder panel header area.

---

## Instruction File Updates

| File | Change |
|---|---|
| `01_project_overview.md` | Add CR-01, CR-02, CR-03 to Key Features table |
| `03_ui_requirements.md` | Add sections 7 (Timer), 8 (Brightness Detail), 9 (Pattern Builder) |
| `04_implementation_plan.md` | Add Phases 9–12 for each CR |
