# 04 – Implementation Plan

## Deliverable

A single `index.html` file (optionally with an inline `<script>` and Tailwind CDN) that implements the full Synthia BLE controller.

---

## Phase 1 – Project Scaffold

**Goal:** Working HTML skeleton with Tailwind CSS loaded.

- [x] Create `index.html` with Tailwind CDN via `<script src="https://cdn.tailwindcss.com">`
- [x] Set dark background, basic page layout (header, main sections)
- [x] Add placeholder sections for all 6 UI panels

---

## Phase 2 – BLE Connection Layer

**Goal:** Connect and disconnect from the Synthia device.

- [x] Implement `connectDevice()` using `navigator.bluetooth.requestDevice()`
  - Filter: `{ name: 'Synthia' }`
  - Optional services: `[NORDIC_UART_SERVICE]` *(Note: implementation correctly uses the full UUID string `6e400001-b5a3-f393-e0a9-e50e24dcca9e`, not the short form `0x0100` referenced in earlier drafts)*
- [x] On connect: get primary service `NORDIC_UART_SERVICE`, retrieve Write and Notify characteristics
- [x] Implement `disconnectDevice()` and handle `gattserverdisconnected` event
- [x] Update UI state (enable/disable controls) on connect/disconnect

```js
// Pseudocode
const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const TX_WRITE_CHAR       = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const RX_NOTIFY_CHAR      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const device = await navigator.bluetooth.requestDevice({
  filters: [{ name: 'Synthia' }],
  optionalServices: [NORDIC_UART_SERVICE]
});
const server = await device.gatt.connect();
const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
const writeChar  = await service.getCharacteristic(TX_WRITE_CHAR);
const notifyChar = await service.getCharacteristic(RX_NOTIFY_CHAR);
```

---

## Phase 3 – Write Command Builder

**Goal:** Functions to build and send `0xBC` and `0xF1` byte arrays.

- [x] `buildBC(durationSec, colorCode, frequency, brightnessPercent)` → `Uint8Array`
  - `durationHigh = Math.floor(durationSec / 256)`
  - `durationLow = durationSec % 256`
  - `brightnessHex = Math.round(brightnessPercent)`
- [x] `buildF1(color, startBright, endBright, step, mode, intervalMs, cycles)` → `Uint8Array`
- [x] `sendCommand(uint8Array)` → writes to Write characteristic

---

## Phase 4 – Preset Controls

**Goal:** Four buttons that send pre-built `0xBC` commands.

- [x] Define preset config object:
  ```js
  const PRESETS = {
    blue:  { duration: 300, color: 0x01, freq: 0x0A, bright: 10 },
    red:   { duration: 300, color: 0x00, freq: 0x0A, bright: 10 },
    white: { duration: 300, color: 0x02, freq: 0x0A, bright: 10 },
    off:   { duration: 1,   color: 0x04, freq: 0x00, bright: 0  },
  };
  ```
- [x] On click: call `buildBC(...)` then `sendCommand(...)`
- [x] Track `activePreset` state; highlight active button

---

## Phase 5 – Notify Listener & Adaptive Brightness

**Goal:** Parse incoming 1-second notifications; adjust brightness on button press.

- [x] Start notifications on Notify characteristic
- [x] Parse payload: `[0xCC, battery, btn1Count, btn2Count]`
- [x] Update dashboard: battery %, button counts
- [x] Compare `btn1Count` and `btn2Count` to previous values:
  - Increment detected on btn1 → `currentBrightness = clamp(currentBrightness + 5, 0, 100)`
  - Increment detected on btn2 → `currentBrightness = clamp(currentBrightness - 5, 0, 100)`
  - If brightness changed → re-send active `0xBC` command with new brightness

---

## Phase 6 – Manual BC Panel

**Goal:** Form UI that builds and sends custom `0xBC` commands.

- [x] Form fields: Duration (number), Color (select), Frequency (select), Brightness (range 0–100)
- [x] Live hex preview updates as fields change
- [x] Send button calls `buildBC(...)` + `sendCommand(...)`

---

## Phase 7 – Manual F1 Panel

**Goal:** Form UI that builds and sends custom `0xF1` commands.

- [x] Form fields: Color, Start Bright, End Bright, Step, Mode, Interval (ms), Cycles
- [x] Live hex preview
- [x] Send button calls `buildF1(...)` + `sendCommand(...)`

---

## Phase 8 – Polish & Error Handling

- [x] Disable all controls when disconnected
- [x] Toast notifications for: connection errors, write errors, disconnection
- [x] Clamp and validate all numeric inputs before command build
- [~] Test on Chrome/Edge (Web Bluetooth is not supported in Firefox/Safari) *(browser warning banner is implemented; physical device testing status unknown)*

---

## File Structure

```
synthia_controller_v2/
├── index.html              ← Single deliverable file
└── instructions/
    ├── 01_project_overview.md
    ├── 02_ble_protocol.md
    ├── 03_ui_requirements.md
    └── 04_implementation_plan.md
```

---

## Phase 9 – Command Timer (CR-01)

- [ ] Add state: `timerInterval`, `timerStartTime`, `timerDurationSec`, `timerExpired`
- [ ] Add `formatMMSS(sec)`, `startTimer(durationSec)`, `stopTimer()` functions
- [ ] Add CSS: `@keyframes pulse-red` + `.timer-expired`
- [ ] Add `#cmd-timer-row` card to dashboard grid
- [ ] Call `startTimer(durationSec)` from `sendCommand()` for `0xBC`; `startTimer(null)` for others
- [ ] Stop timer on disconnect in `setConnected(false)`

---

## Phase 10 – Relative Brightness Display (CR-02)

- [ ] Add state: `commandedBright`, `baseBtn1`, `baseBtn2`
- [ ] In `sendCommand()`: capture `commandedBright = currentBright`, `baseBtn1 = lastBtn1`, `baseBtn2 = lastBtn2`
- [ ] Add `updateBrightnessDetailUI()` — computes delta, renders `#brightness-detail`
- [ ] Call `updateBrightnessDetailUI()` from `updateBrightnessUI()` and from `onNotify()`
- [ ] Add `#brightness-detail` element below `#brightness-bar` in HTML

---

## Phase 11 – Pattern Builder (CR-03)

- [ ] Add state: `patterns[]`, `sequencePlaying`, `sequenceIndex`, `sequenceTimeout`
- [ ] Add Pattern Builder HTML section with `#pattern-rows`, `#pattern-empty`, `#pattern-add`, `#seq-play`, `#seq-stop`, `#seq-progress-row`
- [ ] Implement `addPattern()`, `syncPatternFromRow()`, `reindexPatternRows()`, `setPatternRowsDisabled()`
- [ ] Implement `playSequence()`, `sendCurrentPattern()`, `nextPattern()`, `updateSeqProgress()`, `finishSequence()`, `stopSequence()`
- [ ] Add `.pattern-row-active` CSS class (indigo highlight)
- [ ] Extend `setConnected()` to include new control elements

---

## Phase 12 – Global Brightness Offset During Sequence (CR-04)

- [ ] Add state: `globalBrightOffset`
- [ ] In `onNotify()`: when `sequencePlaying`, accumulate offset instead of re-sending preset
- [ ] In `sendCurrentPattern()`: apply `clamp(pattern.brightness + globalBrightOffset, 0, 100)`
- [ ] Add `updateGlobalOffsetBadge()` — renders `#global-offset-badge`
- [ ] Reset `globalBrightOffset` to 0 on `playSequence()` and `finishSequence()`/`stopSequence()`

---

## Open Questions / Items to Confirm

| # | Status   | Question                                                         | Impact          |
|---|----------|------------------------------------------------------------------|-----------------|
| 1 | RESOLVED | ~~What are the exact UUIDs for Write and Notify characteristics?~~ UUIDs confirmed via nRF Connect: Service `6e400001-b5a3-f393-e0a9-e50e24dcca9e`, Write `6e400002-…`, Notify `6e400003-…` | Phase 2 blocker |
| 2 | OPEN     | Does `0xAC` mode require any parameters?                        | AC panel scope  |
| 3 | RESOLVED | ~~What is the brightness byte encoding?~~ Confirmed as raw integer percentage (0–100), sent as a single byte. `buildBC()` uses `Math.round(brightnessPercent)` directly. | Phase 3 accuracy |
| 4 | OPEN     | Should the app persist last-used settings across sessions?      | UX decision     |
