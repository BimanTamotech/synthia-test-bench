'use strict';

import { PRESETS, PRESET_ACTIVE_CLASSES } from './constants.js';
import state from './state.js';
import { buildBC, sendCommand } from './commands.js';
import { connectDevice, disconnectDevice } from './ble.js';
import { clearActivePreset } from './ui.js';
import { updateBcPreview, initBcPanel, updateF1Preview, initF1Panel, initHexPanel } from './panels.js';
import { addPattern, playSequence, stopSequence, globalStop } from './patterns.js';

// Pattern builder buttons
document.getElementById('pattern-add').addEventListener('click', addPattern);
document.getElementById('seq-play').addEventListener('click', playSequence);
document.getElementById('seq-stop').addEventListener('click', stopSequence);
document.getElementById('global-stop').addEventListener('click', globalStop);

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const key = btn.dataset.preset;
    const p   = PRESETS[key];
    if (!p) return;

    const cmd = buildBC(p.duration, p.color, p.freq, p.bright);
    const ok  = await sendCommand(cmd);
    if (!ok) return;

    clearActivePreset();
    state.activePreset = key;
    if (PRESET_ACTIVE_CLASSES[key]) {
      btn.classList.add(PRESET_ACTIVE_CLASSES[key]);
    }
  });
});

// Connection buttons
document.getElementById('btn-connect').addEventListener('click', connectDevice);
document.getElementById('btn-disconnect').addEventListener('click', disconnectDevice);

// Initialize panels
initBcPanel();
initF1Panel();
initHexPanel();

// Initial preview render
updateBcPreview();
updateF1Preview();

// BLE support check
if (!navigator.bluetooth) {
  document.getElementById('no-ble-warning').hidden = false;
}
