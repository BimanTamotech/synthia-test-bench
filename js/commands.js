'use strict';

import state from './state.js';
import { startTimer } from './timer.js';
import { toast } from './toast.js';
import { recalcBrightness } from './brightness.js';

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function buildBC(durationSec, colorCode, frequency, brightPct) {
  const dur  = clamp(Math.round(durationSec), 0, 65535);
  const high = Math.floor(dur / 256);
  const low  = dur % 256;
  const br   = clamp(Math.round(brightPct), 0, 100);
  return new Uint8Array([0xBC, high, low, colorCode, frequency, br]);
}

export function buildF1(colorCode, startBright, endBright, step, mode, intervalMs, cycles) {
  const iHigh = Math.floor(clamp(intervalMs, 0, 65535) / 256);
  const iLow  = clamp(intervalMs, 0, 65535) % 256;
  const cHigh = Math.floor(clamp(cycles, 0, 65535) / 256);
  const cLow  = clamp(cycles, 0, 65535) % 256;
  return new Uint8Array([
    0xF1,
    colorCode,
    clamp(startBright, 0, 100),
    clamp(endBright,   0, 100),
    clamp(step, 1, 100),
    mode,
    iHigh, iLow,
    cHigh, cLow,
  ]);
}

export function bytesToHex(arr) {
  return Array.from(arr).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

export async function sendCommand(cmd) {
  if (!state.writeChar) { toast('Not connected', 'error'); return false; }
  if (cmd[0] === 0xBC) {
    startTimer(cmd[1] * 256 + cmd[2]);
  } else {
    startTimer(null);
  }
  try {
    await state.writeChar.writeValueWithoutResponse(cmd);
    if (cmd[0] === 0xBC) {
      // During sequence, don't overwrite commandedBright or reset baselines —
      // the offset from buttons must persist across pattern steps (B-10 fix)
      if (!state.sequencePlaying) {
        state.commandedBright = cmd[5];
        state.baseBtn1 = state.lastBtn1;
        state.baseBtn2 = state.lastBtn2;
      }
      state.lastActiveCmd = new Uint8Array(cmd);
      recalcBrightness();
    }
    return true;
  } catch (err) {
    toast(`Write failed: ${err.message}`, 'error');
    return false;
  }
}
