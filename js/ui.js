'use strict';

import state from './state.js';
import { ALL_ACTIVE_CLASSES } from './constants.js';
import { stopTimer } from './timer.js';
import { stopSequence } from './patterns.js';

export function clearActivePreset() {
  state.activePreset = null;
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove(...ALL_ACTIVE_CLASSES));
}

export function setConnected(connected) {
  const btnConnect = document.getElementById('btn-connect');
  const btnDisconnect = document.getElementById('btn-disconnect');
  const statusDot = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');
  const dashboard = document.getElementById('dashboard');
  const disconnectedState = document.getElementById('disconnected-state');
  const brightnessVal = document.getElementById('brightness-val');
  const brightnessBar = document.getElementById('brightness-bar');
  const batteryVal = document.getElementById('battery-val');
  const btn1Val = document.getElementById('btn1-val');
  const btn2Val = document.getElementById('btn2-val');

  btnConnect.hidden    =  connected;
  btnDisconnect.hidden = !connected;
  document.getElementById('global-stop').hidden = !connected;
  statusDot.className  = `w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
    connected ? 'bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.5)]' : 'bg-gray-600'
  }`;
  statusLabel.textContent = connected ? `Connected \u00B7 ${state.bleDevice?.name ?? ''}` : 'Disconnected';
  dashboard.classList.toggle('hidden', !connected);
  disconnectedState.classList.toggle('hidden', connected);

  const presetBtns = document.querySelectorAll('.preset-btn');
  const controls = [
    ...presetBtns,
    document.getElementById('bc-duration'),
    document.getElementById('bc-color'),
    document.getElementById('bc-frequency'),
    document.getElementById('bc-brightness'),
    document.getElementById('bc-send'),
    document.getElementById('f1-color'),
    document.getElementById('f1-start'),
    document.getElementById('f1-end'),
    document.getElementById('f1-step'),
    document.getElementById('f1-mode'),
    document.getElementById('f1-interval'),
    document.getElementById('f1-cycles'),
    document.getElementById('f1-send'),
    document.getElementById('hex-input'),
    document.getElementById('hex-clear'),
    document.getElementById('hex-send'),
    ...document.querySelectorAll('.hex-example'),
    document.getElementById('pattern-add'),
    document.getElementById('seq-play'),
  ];
  controls.forEach(el => { if (el) el.disabled = !connected; });

  if (!connected) {
    clearActivePreset();
    batteryVal.textContent    = '\u2014';
    brightnessVal.textContent = '\u2014';
    brightnessBar.style.width = '0%';
    btn1Val.textContent       = '\u2014';
    btn2Val.textContent       = '\u2014';
    // Reset brightness state
    state.lastBtn1 = 0;
    state.lastBtn2 = 0;
    state.baseBtn1 = 0;
    state.baseBtn2 = 0;
    state.commandedBright = 10;
    state.totalBrightness = 10;
    state.hasReceivedFirstNotify = false;
    state.lastActiveCmd = null;
    state.originalBrightness = [];
    state.seqBrightnessOffset = 0;
    // Stop timer on disconnect
    stopTimer();
    const timerEl = document.getElementById('cmd-timer-value');
    if (timerEl) { timerEl.textContent = '--:--'; timerEl.classList.remove('timer-expired'); }
    // Stop sequence on disconnect
    stopSequence();
  }
}
