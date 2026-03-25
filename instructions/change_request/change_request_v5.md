# Brightness Control Logic: BLE Differential Implementation

This document outlines the simplified logic for calculating and applying real-time brightness adjustments based on physical button press counts received via the BLE protocol.

---

## 1. Core Logic & Variables

The system relies on a **differential calculation**. Instead of tracking incremental state changes, we calculate the current brightness based on the total cumulative counts of the left and right buttons.

### Variables
| Variable | Description | Source |
| :--- | :--- | :--- |
| `B_default` | The initial brightness value | Pattern Builder Config |
| `C_left` | Cumulative "Up" button presses | BLE Protocol (`button_left`) |
| `C_right` | Cumulative "Down" button presses | BLE Protocol (`button_right`) |
| `S_value` | Increment/Decrement step size | Fixed at **5%** |

---

## 2. The Calculation

The final brightness percentage is determined by the net difference between the two button counters, scaled by the step value, and added to the baseline.

### Formula
$$Brightness_{final} = B_{default} + ((C_{left} - C_{right}) \times 5)$$

### Constraints
To ensure the UI and hardware remain within operational limits, the value must be clamped:
* **Minimum:** 0%
* **Maximum:** 100%

---

## 3. Integration Workflow

### Step 1: Initialization
Upon loading a pattern, the UI brightness card displays the `B_default` value. The system begins listening for BLE notifications defined in `@instructions/02_ble_protocol.md`.

### Step 2: Detection
Whenever a BLE packet is received where `button_count` (left or right) has changed:
1. Parse the new `C_left` and `C_right` values.
2. Re-run the differential formula.

### Step 3: UI Update
The brightness card in the UI updates immediately to reflect the new percentage. 

### Step 4: Real-time Application
The calculated `Brightness_final` is sent back to the hardware controller instantly to adjust the physical LEDs/lamp output.

---

## 4. Example Scenario

* **Initial State:** Pattern Builder sets brightness to **50%**.
* **Action:** User presses the Left Button 4 times and the Right Button 1 time.
* **Calculation:**
    * Net Step: $4 - 1 = 3$
    * Adjustment: $3 \times 5\% = 15\%$
    * **Final Result:** $50\% + 15\% = 65\%$

---

> **Implementation Note:** Ensure that if the BLE connection is lost and restored, the calculation uses the most recent cumulative counts to maintain synchronization between the physical device and the UI.