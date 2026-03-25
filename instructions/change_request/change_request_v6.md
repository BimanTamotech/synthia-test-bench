# Change Request v6 — Pattern Builder Import, Dual BLE Name, Slider Conversion

---

## 1. Import Correct Pattern Builder Logic from index_v2.html

### Problem
The pattern builder logic in `index.html` does not correctly handle brightness adjustments during sequence playback. The correct implementation exists in `index_v2.html`.

### Changes
- Replace pattern builder state variables, adding `originalBrightness[]` and `seqBrightnessOffset`
- Replace `playSequence()`, `sendCurrentPattern()`, `stopSequence()`, `finishSequence()` with v2 versions that:
  - Snapshot each pattern's brightness at sequence start
  - Track cumulative brightness offset from button presses during playback
  - Apply relative offset to each pattern's original brightness
  - Send OFF command on stop
  - Reset baselines on finish/stop
- Update `onNotify()` to compute `seqBrightnessOffset` during sequence and update pattern brightness values + UI
- Add `globalStop()` function and global stop button in UI
- Update `setConnected()` to reset new state variables on disconnect
- Rename progress bar label span from `global-offset-label` to `seq-brightness-label`

---

## 2. Dual BLE Discovery Name Support

### Problem
The app discovery name has changed from "Synthia" to "VS-Shift". Both names must be supported.

### Changes
- Update BLE `requestDevice` filters to: `[{ name: 'Synthia' }, { name: 'VS-Shift' }]`
- Update scanning toast message to be name-agnostic

---

## 3. Convert Text Inputs to Sliders

### Problem
Duration, brightness, interval, and other numeric inputs in Manual Control (0xBC) and Breathing Effect (0xF1) panels use text boxes. These should be sliders for better UX.

### Changes

#### Manual Control (0xBC) Panel
| Field | Current | New | Range |
|:---|:---|:---|:---|
| Duration | `type="number"` | `type="range"` + value label | 0 - 65535 |
| Brightness | Already slider | No change | 0 - 100 |

#### Breathing Effect (0xF1) Panel
| Field | Current | New | Range |
|:---|:---|:---|:---|
| Start Bright | `type="number"` | `type="range"` + value label | 0 - 100 |
| End Bright | `type="number"` | `type="range"` + value label | 0 - 100 |
| Step | `type="number"` | `type="range"` + value label | 1 - 100 |
| Interval | `type="number"` | `type="range"` + value label | 0 - 65535 |
| Cycles | `type="number"` | `type="range"` + value label | 0 - 65535 |

Each slider displays its current value in a label that updates in real-time on input.

---

## Files Modified
- `index.html`
