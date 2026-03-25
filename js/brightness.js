'use strict';

import state from './state.js';
import { clamp } from './commands.js';

export function updateBrightnessDisplay() {
  const brightnessVal = document.getElementById('brightness-val');
  const brightnessBar = document.getElementById('brightness-bar');
  if (brightnessVal) brightnessVal.textContent = `${state.totalBrightness}%`;
  if (brightnessBar) brightnessBar.style.width = `${state.totalBrightness}%`;
}

export function recalcBrightness() {
  // During sequence playback, use the pattern step's original brightness as base
  // with the incrementally-accumulated button offset (immune to stale BLE packets).
  // Outside sequence, use commandedBright with delta from baselines.
  const base = (state.sequencePlaying && state.originalBrightness.length > 0)
    ? state.originalBrightness[state.sequenceIndex]
    : state.commandedBright;

  let adjustment;
  if (state.sequencePlaying) {
    adjustment = state.seqBrightnessOffset;
  } else {
    const netSteps = (state.lastBtn2 - state.baseBtn2) - (state.lastBtn1 - state.baseBtn1);
    adjustment = netSteps * 5;
  }
  state.totalBrightness = clamp(base + adjustment, 0, 100);
  updateBrightnessDisplay();
}
