'use strict';

// BLE CONSTANTS
export const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const TX_WRITE_CHAR       = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const RX_NOTIFY_CHAR      = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// COLOR MAP
export const COLOR = { RED: 0x00, BLUE: 0x01, WHITE: 0x02, GREEN: 0x03, OFF: 0x04 };
export const FREQ  = { STEADY: 0x00, HZ10: 0x0A };

// PRESETS
export const PRESETS = {
  blue:  { duration: 300, color: COLOR.BLUE,  freq: FREQ.HZ10,   bright: 10 },
  red:   { duration: 300, color: COLOR.RED,   freq: FREQ.HZ10,   bright: 10 },
  white: { duration: 300, color: COLOR.WHITE, freq: FREQ.HZ10,   bright: 10 },
  off:   { duration: 1,   color: COLOR.OFF,   freq: FREQ.STEADY, bright: 0  },
};

// PRESET ACTIVE CLASSES
export const PRESET_ACTIVE_CLASSES = {
  blue:  'preset-active-blue',
  red:   'preset-active-red',
  white: 'preset-active-white',
  off:   'preset-active-off',
};
export const ALL_ACTIVE_CLASSES = Object.values(PRESET_ACTIVE_CLASSES);
