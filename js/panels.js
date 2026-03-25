'use strict';

import state from './state.js';
import { buildBC, buildF1, bytesToHex, sendCommand, clamp } from './commands.js';
import { toast } from './toast.js';
import { clearActivePreset } from './ui.js';

// BC PANEL
export function updateBcPreview() {
  const bcDuration = document.getElementById('bc-duration');
  const bcColor = document.getElementById('bc-color');
  const bcFrequency = document.getElementById('bc-frequency');
  const bcBrightness = document.getElementById('bc-brightness');
  const bcPreview = document.getElementById('bc-preview');
  const bcDurLbl = document.getElementById('bc-duration-label');
  const bcFreqLbl = document.getElementById('bc-frequency-label');
  const bcBrightLbl = document.getElementById('bc-brightness-label');

  const dur   = clamp(parseInt(bcDuration.value) || 0, 0, 65535);
  const color = parseInt(bcColor.value);
  const freq  = parseInt(bcFrequency.value);
  const br    = clamp(parseInt(bcBrightness.value) || 0, 0, 100);
  const cmd   = buildBC(dur, color, freq, br);
  bcPreview.textContent = bytesToHex(cmd);
  bcDurLbl.textContent = `${bcDuration.value}s`;
  bcFreqLbl.textContent = freq === 0 ? 'Steady' : `${freq} Hz`;
  bcBrightLbl.textContent = `${bcBrightness.value}%`;
}

export function initBcPanel() {
  const bcDuration = document.getElementById('bc-duration');
  const bcColor = document.getElementById('bc-color');
  const bcFrequency = document.getElementById('bc-frequency');
  const bcBrightness = document.getElementById('bc-brightness');
  const bcSend = document.getElementById('bc-send');

  [bcDuration, bcColor, bcFrequency, bcBrightness].forEach(el => {
    el.addEventListener('input', updateBcPreview);
  });

  bcSend.addEventListener('click', async () => {
    const dur   = clamp(parseInt(bcDuration.value) || 0, 0, 65535);
    const color = parseInt(bcColor.value);
    const freq  = parseInt(bcFrequency.value);
    const br    = clamp(parseInt(bcBrightness.value) || 0, 0, 100);
    const cmd   = buildBC(dur, color, freq, br);
    const ok = await sendCommand(cmd);
    if (ok) {
      clearActivePreset();
      toast('BC command sent', 'success');
    }
  });
}

// F1 PANEL
export function updateF1Preview() {
  const f1Color = document.getElementById('f1-color');
  const f1Start = document.getElementById('f1-start');
  const f1End = document.getElementById('f1-end');
  const f1Step = document.getElementById('f1-step');
  const f1Mode = document.getElementById('f1-mode');
  const f1Interval = document.getElementById('f1-interval');
  const f1Cycles = document.getElementById('f1-cycles');
  const f1Preview = document.getElementById('f1-preview');
  const f1StartLbl = document.getElementById('f1-start-label');
  const f1EndLbl = document.getElementById('f1-end-label');
  const f1StepLbl = document.getElementById('f1-step-label');
  const f1IntLbl = document.getElementById('f1-interval-label');
  const f1CycLbl = document.getElementById('f1-cycles-label');

  const color    = parseInt(f1Color.value);
  const startB   = clamp(parseInt(f1Start.value) || 0, 0, 100);
  const endB     = clamp(parseInt(f1End.value) || 0, 0, 100);
  const step     = clamp(parseInt(f1Step.value) || 1, 1, 100);
  const mode     = parseInt(f1Mode.value);
  const interval = clamp(parseInt(f1Interval.value) || 0, 0, 65535);
  const cycles   = clamp(parseInt(f1Cycles.value) || 0, 0, 65535);
  const cmd      = buildF1(color, startB, endB, step, mode, interval, cycles);
  f1Preview.textContent = bytesToHex(cmd);
  f1StartLbl.textContent = `${f1Start.value}%`;
  f1EndLbl.textContent   = `${f1End.value}%`;
  f1StepLbl.textContent  = `${f1Step.value}%`;
  f1IntLbl.textContent   = `${f1Interval.value}ms`;
  f1CycLbl.textContent   = f1Cycles.value;
}

export function initF1Panel() {
  const f1Color = document.getElementById('f1-color');
  const f1Start = document.getElementById('f1-start');
  const f1End = document.getElementById('f1-end');
  const f1Step = document.getElementById('f1-step');
  const f1Mode = document.getElementById('f1-mode');
  const f1Interval = document.getElementById('f1-interval');
  const f1Cycles = document.getElementById('f1-cycles');
  const f1Send = document.getElementById('f1-send');

  [f1Color, f1Start, f1End, f1Step, f1Mode, f1Interval, f1Cycles].forEach(el => {
    el.addEventListener('input', updateF1Preview);
  });

  f1Send.addEventListener('click', async () => {
    const color    = parseInt(f1Color.value);
    const startB   = clamp(parseInt(f1Start.value) || 0, 0, 100);
    const endB     = clamp(parseInt(f1End.value) || 0, 0, 100);
    const step     = clamp(parseInt(f1Step.value) || 1, 1, 100);
    const mode     = parseInt(f1Mode.value);
    const interval = clamp(parseInt(f1Interval.value) || 0, 0, 65535);
    const cycles   = clamp(parseInt(f1Cycles.value) || 0, 0, 65535);
    const cmd      = buildF1(color, startB, endB, step, mode, interval, cycles);
    const ok = await sendCommand(cmd);
    if (ok) {
      clearActivePreset();
      toast('F1 breathing command sent', 'success');
    }
  });
}

// CUSTOM HEX PANEL
function parseHexInput(raw) {
  const tokens = raw.trim().replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const bytes  = [];
  for (const token of tokens) {
    const clean = token.replace(/^0x/i, '');
    if (!/^[0-9a-fA-F]{1,2}$/.test(clean)) {
      return { ok: false, error: `Invalid token: "${token}"` };
    }
    bytes.push(parseInt(clean, 16));
  }
  if (bytes.length === 0) return { ok: false, error: 'Enter at least one byte' };
  if (bytes.length > 64)  return { ok: false, error: 'Max 64 bytes allowed' };
  return { ok: true, bytes };
}

function updateHexPreview() {
  const hexInput = document.getElementById('hex-input');
  const hexParsed = document.getElementById('hex-parsed');
  const hexByteCount = document.getElementById('hex-byte-count');
  const hexError = document.getElementById('hex-error');
  const hexSend = document.getElementById('hex-send');

  const raw = hexInput.value;
  if (!raw.trim()) {
    hexParsed.textContent    = '\u2014';
    hexByteCount.textContent = '0 bytes';
    hexError.hidden          = true;
    hexError.textContent     = '';
    hexSend.disabled         = true;
    return;
  }

  const result = parseHexInput(raw);
  if (!result.ok) {
    hexParsed.textContent    = '\u2014';
    hexByteCount.textContent = '0 bytes';
    hexError.textContent     = result.error;
    hexError.hidden          = false;
    hexSend.disabled         = true;
  } else {
    hexParsed.textContent    = result.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    hexByteCount.textContent = `${result.bytes.length} byte${result.bytes.length !== 1 ? 's' : ''}`;
    hexError.hidden          = true;
    hexError.textContent     = '';
    hexSend.disabled         = !state.writeChar;
  }
}

export function initHexPanel() {
  const hexInput = document.getElementById('hex-input');
  const hexClear = document.getElementById('hex-clear');
  const hexParsed = document.getElementById('hex-parsed');
  const hexByteCount = document.getElementById('hex-byte-count');
  const hexError = document.getElementById('hex-error');
  const hexSend = document.getElementById('hex-send');

  hexInput.addEventListener('input', updateHexPreview);

  hexClear.addEventListener('click', () => {
    hexInput.value           = '';
    hexParsed.textContent    = '\u2014';
    hexByteCount.textContent = '0 bytes';
    hexError.hidden          = true;
    hexSend.disabled         = true;
    hexInput.focus();
  });

  document.querySelectorAll('.hex-example').forEach(btn => {
    btn.addEventListener('click', () => {
      hexInput.value = btn.dataset.hex;
      updateHexPreview();
      hexInput.focus();
    });
  });

  hexSend.addEventListener('click', async () => {
    const result = parseHexInput(hexInput.value);
    if (!result.ok) { toast(result.error, 'error'); return; }
    const cmd = new Uint8Array(result.bytes);
    const ok  = await sendCommand(cmd);
    if (ok) {
      clearActivePreset();
      toast(`Sent ${result.bytes.length} bytes: ${hexParsed.textContent}`, 'success');
    }
  });
}
