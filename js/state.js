'use strict';

const state = {
  // BLE
  bleDevice: null,
  writeChar: null,
  activePreset: null,

  // Brightness
  lastBtn1: 0,
  lastBtn2: 0,
  baseBtn1: 0,
  baseBtn2: 0,
  commandedBright: 10,
  totalBrightness: 10,
  lastActiveCmd: null,

  // Command Timer
  timerInterval: null,
  timerStartTime: null,
  timerDurationSec: null,
  timerExpired: false,

  // Pattern Builder
  patterns: [],
  sequencePlaying: false,
  sequenceIndex: 0,
  sequenceTimeout: null,
  originalBrightness: [],
  seqBrightnessOffset: 0,
};

export default state;
