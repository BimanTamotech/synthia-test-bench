'use strict';

import state from './state.js';
import { buildBC, sendCommand, clamp } from './commands.js';
import { toast } from './toast.js';

export function addPattern() {
  const i = state.patterns.length;
  state.patterns.push({ color: 0x01, freq: 0x0A, duration: 30, brightness: 50 });
  renderPatternRow(i);
  reindexPatternRows();
  document.getElementById('pattern-empty').classList.add('hidden');
}

export function renderPatternRow(i) {
  const container = document.getElementById('pattern-rows');
  const row = document.createElement('div');
  row.dataset.index = i;
  row.className = 'flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-sm';
  row.innerHTML = `
    <span class="row-num text-slate-400 font-mono w-5 shrink-0 text-right">${i+1}</span>
    <select class="row-color flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs">
      <option value="1" selected>Blue</option>
      <option value="0">Red</option>
      <option value="2">White</option>
      <option value="3">Green</option>
      <option value="4">Off</option>
    </select>
    <input type="number" class="row-freq w-20 shrink-0 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" placeholder="Hz" value="10" min="0" max="255" title="Frequency (0=Steady, 10=10Hz)" />
    <input type="number" class="row-dur w-16 shrink-0 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" placeholder="Dur(s)" value="30" min="1" max="65535" />
    <input type="number" class="row-bright w-20 shrink-0 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs" placeholder="%" value="50" min="0" max="100" />
    <button class="pattern-delete-btn w-6 shrink-0 text-slate-500 hover:text-red-400 transition text-lg leading-none">\u00D7</button>
  `;
  row.querySelectorAll('select, input').forEach(el => {
    el.addEventListener('change', () => syncPatternFromRow(row));
  });
  row.querySelector('.pattern-delete-btn').addEventListener('click', () => deletePatternRow(row));
  container.appendChild(row);
}

export function syncPatternFromRow(row) {
  const i = parseInt(row.dataset.index);
  state.patterns[i] = {
    color: parseInt(row.querySelector('.row-color').value),
    freq: parseInt(row.querySelector('.row-freq').value),
    duration: parseInt(row.querySelector('.row-dur').value) || 1,
    brightness: parseInt(row.querySelector('.row-bright').value) || 0,
  };
}

export function deletePatternRow(row) {
  const i = parseInt(row.dataset.index);
  state.patterns.splice(i, 1);
  row.remove();
  reindexPatternRows();
  if (state.patterns.length === 0) {
    document.getElementById('pattern-empty').classList.remove('hidden');
  }
}

export function reindexPatternRows() {
  const rows = document.querySelectorAll('#pattern-rows [data-index]');
  rows.forEach((row, i) => {
    row.dataset.index = i;
    row.querySelector('.row-num').textContent = i + 1;
  });
}

export function setPatternRowsDisabled(dis) {
  document.querySelectorAll('#pattern-rows select, #pattern-rows input, #pattern-rows button').forEach(el => {
    el.disabled = dis;
  });
}

export function playSequence() {
  if (state.patterns.length === 0) return;
  document.querySelectorAll('#pattern-rows [data-index]').forEach(row => syncPatternFromRow(row));
  state.originalBrightness = state.patterns.map(p => p.brightness);
  state.seqBrightnessOffset = 0;
  state.baseBtn1 = state.lastBtn1;
  state.baseBtn2 = state.lastBtn2;
  state.sequencePlaying = true;
  state.sequenceIndex = 0;
  document.getElementById('seq-progress-row').classList.remove('hidden');
  document.getElementById('seq-play').disabled = true;
  document.getElementById('seq-stop').disabled = false;
  setPatternRowsDisabled(true);
  document.getElementById('pattern-add').disabled = true;
  sendCurrentPattern();
}

export async function sendCurrentPattern() {
  if (!state.sequencePlaying || state.sequenceIndex >= state.patterns.length) { finishSequence(); return; }
  document.querySelectorAll('#pattern-rows [data-index]').forEach(row => {
    row.classList.remove('pattern-row-active');
  });
  const activeRow = document.querySelector(`#pattern-rows [data-index="${state.sequenceIndex}"]`);
  if (activeRow) activeRow.classList.add('pattern-row-active');
  updateSeqProgress();
  const p = state.patterns[state.sequenceIndex];
  const effectiveBright = clamp(state.originalBrightness[state.sequenceIndex] + state.seqBrightnessOffset, 0, 100);
  const cmd = buildBC(p.duration, p.color, p.freq, effectiveBright);
  await sendCommand(cmd);
  const lbl = document.getElementById('seq-brightness-label');
  if (lbl) lbl.textContent = `Brightness: ${state.totalBrightness}%`;
  state.sequenceTimeout = setTimeout(() => nextPattern(), p.duration * 1000);
}

export function nextPattern() {
  state.sequenceIndex++;
  if (state.sequenceIndex >= state.patterns.length) { finishSequence(); return; }
  sendCurrentPattern();
}

export function updateSeqProgress() {
  const label = document.getElementById('seq-progress-label');
  const bar = document.getElementById('seq-progress-bar');
  if (label) label.textContent = `Pattern ${state.sequenceIndex + 1} of ${state.patterns.length}`;
  if (bar) bar.style.width = `${((state.sequenceIndex) / state.patterns.length) * 100}%`;
}

export function finishSequence() {
  state.sequencePlaying = false;
  state.seqBrightnessOffset = 0;
  state.baseBtn1 = state.lastBtn1;
  state.baseBtn2 = state.lastBtn2;
  if (state.sequenceTimeout) { clearTimeout(state.sequenceTimeout); state.sequenceTimeout = null; }
  document.querySelectorAll('#pattern-rows [data-index]').forEach(row => row.classList.remove('pattern-row-active'));
  const bar = document.getElementById('seq-progress-bar');
  if (bar) bar.style.width = '100%';
  const label = document.getElementById('seq-progress-label');
  if (label) label.textContent = `Done \u2014 ${state.patterns.length} of ${state.patterns.length}`;
  document.getElementById('seq-play').disabled = false;
  document.getElementById('seq-stop').disabled = true;
  setPatternRowsDisabled(false);
  document.getElementById('pattern-add').disabled = false;
}

export function stopSequence() {
  state.sequencePlaying = false;
  state.seqBrightnessOffset = 0;
  state.baseBtn1 = state.lastBtn1;
  state.baseBtn2 = state.lastBtn2;
  if (state.sequenceTimeout) { clearTimeout(state.sequenceTimeout); state.sequenceTimeout = null; }
  if (state.writeChar) {
    const offCmd = buildBC(0, 0x04, 0x00, 0);
    state.writeChar.writeValueWithoutResponse(offCmd).catch(() => {});
  }
  document.querySelectorAll('#pattern-rows [data-index]').forEach(row => row.classList.remove('pattern-row-active'));
  const seqProgressRow = document.getElementById('seq-progress-row');
  if (seqProgressRow) seqProgressRow.classList.add('hidden');
  const seqPlay = document.getElementById('seq-play');
  const seqStop = document.getElementById('seq-stop');
  const patternAdd = document.getElementById('pattern-add');
  if (seqPlay) seqPlay.disabled = false;
  if (seqStop) seqStop.disabled = true;
  setPatternRowsDisabled(false);
  if (patternAdd) patternAdd.disabled = false;
}

export function globalStop() {
  stopSequence();
  if (state.writeChar) {
    const offCmd = buildBC(0, 0x04, 0x00, 0);
    state.writeChar.writeValueWithoutResponse(offCmd).catch(() => {});
  }
  toast('Stopped \u2014 LED off', 'info');
}
