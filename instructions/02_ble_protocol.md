# 02 – BLE Protocol Reference

## GATT Characteristics

**Primary Service (Nordic UART):** `6e400001-b5a3-f393-e0a9-e50e24dcca9e`

| Role   | UUID                                       | Properties                    | Direction    | Purpose                      |
|--------|--------------------------------------------|-------------------------------|--------------|------------------------------|
| Write  | `6e400002-b5a3-f393-e0a9-e50e24dcca9e`   | Write, Write Without Response | App → Device | Send lighting commands        |
| Notify | `6e400003-b5a3-f393-e0a9-e50e24dcca9e`   | Notify                        | Device → App | Receive status updates (1/s) |

> Confirmed via nRF Connect on physical device (device UUID: `52ACAD67-4D7D-414C-8213-56783C27087D`).

---

## Write Commands

### Command Mode `0xAC` — Fixed Pattern

> Used for predefined patterns stored on the device. No additional parameters documented yet.

---

### Command Mode `0xBC` — Manual Control

**Structure:**
```
0xBC [Duration_High] [Duration_Low] [Color] [Frequency] [Brightness]
```

| Byte           | Description                                     | Example          |
|----------------|-------------------------------------------------|------------------|
| `0xBC`         | Command mode identifier                         | —                |
| `Duration_High`| High byte of duration in seconds                | `0x00`           |
| `Duration_Low` | Low byte of duration in seconds                 | `0x32` = 50s     |
| `Color`        | LED color code (see table below)                | `0x01` = Blue    |
| `Frequency`    | Blink rate: `0x0A` = 10Hz, `0x00` = Steady     | `0x0A`           |
| `Brightness`   | Brightness as hex % (`0x14` = 20%)              | `0x0A` = 10%     |

**Duration formula:** `Duration_High × 256 + Duration_Low` = seconds

**5 minutes example:** `0x01 0x2C` (1×256+44 = 300s)

**Color codes:**
| Code   | Color |
|--------|-------|
| `0x00` | Red   |
| `0x01` | Blue  |
| `0x02` | White |
| `0x03` | Green |
| `0x04` | Off   |

**Full preset example (Blue / 10% / 10Hz / 5min):**
```
0xBC 0x01 0x2C 0x01 0x0A 0x0A
```

---

### Command Mode `0xF1` — Breathing Effect

**Structure:**
```
0xF1 [Color] [Start_Bright] [End_Bright] [Step] [Mode] [Interval_High] [Interval_Low] [Cycles_High] [Cycles_Low]
```

| Byte            | Description                                                  |
|-----------------|--------------------------------------------------------------|
| `0xF1`          | Command mode identifier                                      |
| `Color`         | Same color codes as `0xBC`                                   |
| `Start_Bright`  | Starting brightness (hex %)                                  |
| `End_Bright`    | Ending brightness (hex %)                                    |
| `Step`          | Brightness increment per step (hex %)                        |
| `Mode`          | `0x01` = Loop Up/Down, `0x00` = Loop Up only                |
| `Interval_High` | High byte of ms-per-step interval                            |
| `Interval_Low`  | Low byte of ms-per-step interval                             |
| `Cycles_High`   | High byte of total cycle count                               |
| `Cycles_Low`    | Low byte of total cycle count                                |

**Interval formula:** `Interval_High × 256 + Interval_Low` = milliseconds per step

---

## Notify Payload (Device → App, every 1 second)

**Structure:**
```
0xCC [Battery] [Button1_Count] [Button2_Count]
```

| Byte            | Description                              | Example           |
|-----------------|------------------------------------------|-------------------|
| `0xCC`          | Header byte                              | —                 |
| `Battery`       | Battery level (`0x64` = 100%)            | `0x64` = 100%     |
| `Button1_Count` | Incremental press count for Button 1     | Increases by 1    |
| `Button2_Count` | Incremental press count for Button 2     | Increases by 1    |

**Battery formula:** `Battery / 0x64 × 100` = percentage

---

## Adaptive Brightness Logic

- On each new `Button1_Count` increment → increase current brightness by **+5%**
- On each new `Button2_Count` increment → decrease current brightness by **-5%**
- Clamp brightness between **0%** and **100%**
- After adjustment, re-send the active `0xBC` command with updated brightness byte

> **Implementation note:** The count fields are cumulative. The implementation computes the delta as `(newCount - lastCount) * 5`, so if multiple presses arrive in a single notification (e.g. count advances by 2), the brightness adjusts by ±10% in one step. This is intentional and handles burst presses correctly.
>
> **Fallback behaviour:** If no named preset is active but the last sent command was a manual `0xBC`, the implementation re-sends that manual command with the updated brightness byte. `0xF1` commands are not re-sent on brightness change.
