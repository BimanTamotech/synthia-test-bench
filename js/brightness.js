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
  const adjustment = ((state.lastBtn2 - state.baseBtn2) - (state.lastBtn1 - state.baseBtn1)) * 5;
  state.totalBrightness = clamp(state.commandedBright + adjustment, 0, 100);
  updateBrightnessDisplay();
}
