# 03 – UI Requirements & Design Spec

## Design System

| Property       | Value                            |
|----------------|----------------------------------|
| Framework      | Tailwind CSS                     |
| Theme          | Dark (dark backgrounds, light text) |
| Font           | System / Tailwind default        |
| Layout         | Responsive single-page app       |

---

## Page Sections

### 1. Header / Connection Bar

- App title: **Synthia Controller**
- **Connect** button → triggers BLE scan filtered to device name `"Synthia"`
- **Disconnect** button (shown after connected)
- Connection status indicator (e.g. green dot = connected, grey = disconnected)

---

### 2. Status Dashboard

Displayed only when connected. Updates every 1 second from the Notify characteristic.

| Field          | Display Format         |
|----------------|------------------------|
| Battery        | Percentage + icon      |
| Button 1 Count | Numeric counter        |
| Button 2 Count | Numeric counter        |
| Current Brightness | Percentage display |

---

### 3. Preset Controls

Four large buttons for one-tap lighting:

| Button Label         | Command Sent                          |
|----------------------|---------------------------------------|
| Blue / 10% / 10Hz / 5min  | `0xBC 0x01 0x2C 0x01 0x0A 0x0A` |
| Red / 10% / 10Hz / 5min   | `0xBC 0x01 0x2C 0x00 0x0A 0x0A` |
| White / 10% / 10Hz / 5min | `0xBC 0x01 0x2C 0x02 0x0A 0x0A` |
| OFF                        | `0xBC 0x00 0x01 0x04 0x00 0x00` |

- Highlight the active preset when selected
- Disable all preset buttons when disconnected

---

### 4. Manual BC Panel

A form panel for sending custom `0xBC` commands:

| Field       | Input Type | Notes                                |
|-------------|-----------|--------------------------------------|
| Duration    | Number    | Seconds (0–65535)                    |
| Color       | Dropdown  | Red / Blue / White / Green / Off     |
| Frequency   | Dropdown  | Steady (0x00) / 10Hz (0x0A)         |
| Brightness  | Slider or Number | 0–100%                        |
| Send Button | Button    | Builds and sends the hex command     |

Show the generated hex string for transparency (e.g., `BC 01 2C 01 0A 0A`).

> **Implementation note:** The hex preview is rendered as a monospace badge in the **top-right corner of the panel header** (element `#bc-preview`), not below the form fields. It updates live on every input change. The visual result satisfies the live-preview requirement.

---

### 5. Manual F1 Panel (Breathing Effect)

A form panel for sending custom `0xF1` commands:

| Field          | Input Type | Notes                                      |
|----------------|-----------|---------------------------------------------|
| Color          | Dropdown  | Red / Blue / White / Green / Off            |
| Start Bright   | Number    | 0–100%                                      |
| End Bright     | Number    | 0–100%                                      |
| Step           | Number    | % per step                                  |
| Mode           | Dropdown  | Loop Up/Down (0x01) / Loop Up (0x00)       |
| Interval (ms)  | Number    | Milliseconds per step (0–65535)             |
| Cycles         | Number    | Total cycles (0–65535)                      |
| Send Button    | Button    | Builds and sends the hex command            |

Show the generated hex string before sending.

> **Implementation note:** The F1 hex preview is similarly rendered as a monospace badge in the **top-right corner of the F1 panel header** (element `#f1-preview`), updating live on every input change.

---

### 6. Brightness Adaptive Control (Visual Feedback)

- Display current brightness as a progress bar or large percentage
- Automatically update when Button1 or Button2 is pressed on the device
- Show last adjustment direction (+5% / -5%) as a transient label

---

### 7. Command Timer

- Displayed in the dashboard (always visible when connected).
- When a `0xBC` command is sent: countdown from `durationSec` to `00:00`, then show **Expired** with a pulsing red animation.
- When a `0xF1` or custom hex command is sent: count up as elapsed time.
- Format: `MM:SS` (e.g. `04:59`).
- Timer resets and restarts on each new command send.
- Timer stops and clears on BLE disconnect.
- Element: `#cmd-timer-row` inside the dashboard grid.

---

### 8. Relative Brightness Display

- Shown below the brightness progress bar.
- Displays: `Commanded: X% | +Y% from buttons` (or `−Y%`, hidden if delta is zero).
- Tracks the brightness value at the time of the last command send and the cumulative button-press delta since then.
- Element: `#brightness-detail`.

---

### 9. Pattern Builder

A sequencing panel for defining and playing multi-step `0xBC` lighting patterns.

**Row fields:**

| Field      | Input Type | Notes                            |
|------------|-----------|----------------------------------|
| #          | Label     | Auto-numbered (1, 2, 3…)                            |
| Color      | Dropdown  | Red / Blue / White / Green / Off                    |
| Frequency  | Number    | Hz as integer (0 = Steady, 10 = 10Hz, any value OK) |
| Duration   | Number    | Seconds (1–65535)                                   |
| Brightness | Number    | 0–100%                                              |
| Delete     | Button    | Removes row, re-numbers remainder                   |

A static header row (`#`, `Color`, `Freq (Hz)`, `Dur (s)`, `Bright %`) is displayed above the rows.

**Controls:**

| Element             | Behaviour                                                    |
|---------------------|--------------------------------------------------------------|
| Add Row             | Append a new row with default values                         |
| Play                | Execute rows in sequence; active row highlighted in indigo   |
| Stop                | Halt sequence immediately                                    |
| Progress label      | `Pattern N of M`                                             |
| Progress bar        | Fills proportionally as steps complete                       |
| Global Offset badge | Shows `Offset: ±X%` during playback; hidden when 0          |

**Global Brightness Offset (during playback):**
- Button 1 press → `globalBrightOffset += 5`
- Button 2 press → `globalBrightOffset -= 5`
- Effective brightness per step = `clamp(row.brightness + globalBrightOffset, 0, 100)`
- Resets to 0 on Play or sequence end/stop.

**Elements:** `#pattern-rows`, `#pattern-empty`, `#pattern-add`, `#seq-play`, `#seq-stop`, `#seq-progress-row`, `#seq-progress-label`, `#seq-progress-bar`, `#global-offset-badge`.

---

## UX Rules

1. All interactive controls must be **disabled** when BLE is disconnected.
2. Show a **toast/alert** on connection failure or write error.
3. The hex command preview must update **live** as form fields change.
4. Brightness is clamped: never below 0% or above 100%.
5. The active preset button should remain **highlighted** until a different command is sent.
