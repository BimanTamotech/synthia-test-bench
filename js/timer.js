'use strict';

import state from './state.js';

export function formatMMSS(sec) {
  const m = Math.floor(Math.abs(sec) / 60).toString().padStart(2, '0');
  const s = (Math.abs(sec) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function startTimer(durationSec) {
  stopTimer();
  state.timerExpired = false;
  state.timerDurationSec = durationSec;
  state.timerStartTime = Date.now();
  const el = document.getElementById('cmd-timer-value');
  if (el) el.classList.remove('timer-expired');
  state.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.timerStartTime) / 1000);
    const el = document.getElementById('cmd-timer-value');
    if (!el) return;
    if (state.timerDurationSec !== null) {
      const remaining = state.timerDurationSec - elapsed;
      if (remaining <= 0) {
        el.textContent = 'Expired';
        el.classList.add('timer-expired');
        state.timerExpired = true;
        stopTimer();
      } else {
        el.textContent = formatMMSS(remaining);
      }
    } else {
      el.textContent = formatMMSS(elapsed);
    }
  }, 1000);
}

export function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}
