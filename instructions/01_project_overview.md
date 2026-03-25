# 01 – Project Overview

## Objective

Build a web-based Bluetooth controller for the **Synthia** LED device. The app runs in the browser using the **Web Bluetooth API** and allows users to:

- Connect to the Synthia device via BLE
- Send lighting commands (fixed, manual, breathing patterns)
- Monitor battery level and button presses in real time
- Adjust LED brightness adaptively via physical buttons on the device

---

## Device Identity

| Property        | Value                                                  |
|-----------------|--------------------------------------------------------|
| Advertising Name | `Synthia`                                             |
| Service UUID    | `6e400001-b5a3-f393-e0a9-e50e24dcca9e` (Nordic UART) |

> **Note:** An earlier draft listed this as `0x0100`. The correct UUID is the full 128-bit Nordic UART Service UUID confirmed via nRF Connect on the physical device. The short form `0x0100` is not used anywhere in the implementation.

---

## Key Features

| Feature                | Description                                                  |
|------------------------|--------------------------------------------------------------|
| Connection Management  | Scan and connect to BLE device named "Synthia"               |
| Preset Controls        | One-tap presets for common lighting states                   |
| Adaptive Brightness    | Physical buttons on device adjust brightness by ±5%          |
| Real-time Monitoring   | Live dashboard: battery %, button1 count, button2 count      |
| Manual BC Panel        | Custom hex input for `0xBC` (manual control) commands        |
| Manual F1 Panel        | Custom hex input for `0xF1` (breathing effect) commands      |
| Command Timer          | Countdown (0xBC) or elapsed (other) timer shown in dashboard |
| Relative Brightness    | Shows commanded brightness + delta from button presses       |
| Pattern Builder        | Multi-step lighting sequence with play/stop and progress bar |

---

## Preset Definitions

| Preset Label       | Color | Brightness | Frequency | Duration |
|--------------------|-------|-----------|-----------|----------|
| Blue 10% 10Hz 5min | Blue  | 10%       | 10Hz      | 5 min    |
| Red 10% 10Hz 5min  | Red   | 10%       | 10Hz      | 5 min    |
| White 10% 10Hz 5min| White | 10%       | 10Hz      | 5 min    |
| OFF                | Off   | —         | —         | —        |

---

## Tech Stack

- **Frontend**: HTML + Tailwind CSS (dark theme)
- **BLE API**: Web Bluetooth API (Chrome/Edge)
- **No backend** required — all communication is client-side
