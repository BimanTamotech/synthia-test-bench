'use strict';

import { NORDIC_UART_SERVICE, TX_WRITE_CHAR, RX_NOTIFY_CHAR } from './constants.js';
import state from './state.js';
import { buildBC, clamp } from './commands.js';
import { recalcBrightness } from './brightness.js';
import { toast } from './toast.js';
import { setConnected } from './ui.js';

export function setConnectScanning(scanning) {
  const btnConnect = document.getElementById('btn-connect');
  const btnConnectLabel = document.getElementById('btn-connect-label');
  btnConnect.disabled = scanning;
  if (scanning) {
    btnConnectLabel.innerHTML = '<span class="btn-spinner"></span>Scanning\u2026';
  } else {
    btnConnectLabel.textContent = 'Connect';
  }
}

export async function connectDevice() {
  if (!navigator.bluetooth) {
    document.getElementById('no-ble-warning').hidden = false;
    toast('Web Bluetooth not supported', 'error');
    return;
  }

  setConnectScanning(true);
  try {
    toast('Scanning for device\u2026', 'info');
    state.bleDevice = await navigator.bluetooth.requestDevice({
      filters: [{ name: 'Synthia' }, { name: 'VS-Shift' }],
      optionalServices: [NORDIC_UART_SERVICE],
    });

    state.bleDevice.addEventListener('gattserverdisconnected', onDisconnected);

    const server  = await state.bleDevice.gatt.connect();
    const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
    state.writeChar = await service.getCharacteristic(TX_WRITE_CHAR);

    const notifChar = await service.getCharacteristic(RX_NOTIFY_CHAR);
    await notifChar.startNotifications();
    notifChar.addEventListener('characteristicvaluechanged', onNotify);

    setConnected(true);
    toast(`Connected to ${state.bleDevice.name}`, 'success');
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      toast(`Connection failed: ${err.message}`, 'error');
    }
    state.bleDevice = null;
    state.writeChar = null;
  } finally {
    setConnectScanning(false);
  }
}

export function disconnectDevice() {
  if (state.bleDevice && state.bleDevice.gatt.connected) {
    state.bleDevice.gatt.disconnect();
  }
}

function onDisconnected() {
  state.writeChar = null;
  setConnected(false);
  toast('Device disconnected', 'warning');
}

function onNotify(event) {
  const data = event.target.value;
  if (data.byteLength < 4) return;

  const header = data.getUint8(0);
  if (header !== 0xCC) return;

  const battery  = data.getUint8(1);
  const btn1     = data.getUint8(2);
  const btn2     = data.getUint8(3);
  const battPct  = Math.round((battery / 0x64) * 100);

  const batteryVal = document.getElementById('battery-val');
  const btn1Val = document.getElementById('btn1-val');
  const btn2Val = document.getElementById('btn2-val');

  batteryVal.textContent = `${battPct}%`;
  btn1Val.textContent    = btn1;
  btn2Val.textContent    = btn2;

  // Battery color
  const battColor = battPct > 50 ? 'text-green-400' : battPct > 20 ? 'text-yellow-400' : 'text-red-400';
  document.getElementById('battery-icon').className = `w-5 h-5 ${battColor}`;

  // Brightness calculation from button counts
  if (!state.hasReceivedFirstNotify) {
    state.lastBtn1 = btn1;
    state.lastBtn2 = btn2;
    state.baseBtn1 = btn1;
    state.baseBtn2 = btn2;
    state.hasReceivedFirstNotify = true;
    return;
  }

  const prevTotal = state.totalBrightness;
  state.lastBtn1 = btn1;
  state.lastBtn2 = btn2;
  recalcBrightness();

  // Update sequence brightness label if playing
  if (state.sequencePlaying) {
    const lbl = document.getElementById('seq-brightness-label');
    if (lbl) lbl.textContent = `Brightness: ${state.totalBrightness}%`;
  }

  // Adaptive re-send
  if (state.totalBrightness !== prevTotal) {
    if (state.sequencePlaying) {
      state.seqBrightnessOffset = ((state.lastBtn2 - state.baseBtn2) - (state.lastBtn1 - state.baseBtn1)) * 5;
      state.patterns.forEach((p, i) => {
        p.brightness = clamp(state.originalBrightness[i] + state.seqBrightnessOffset, 0, 100);
      });
      document.querySelectorAll('#pattern-rows .row-bright').forEach((input, i) => {
        input.value = state.patterns[i].brightness;
      });
      const p = state.patterns[state.sequenceIndex];
      if (p) {
        const cmd = buildBC(p.duration, p.color, p.freq, state.totalBrightness);
        state.writeChar.writeValueWithoutResponse(cmd).catch(() => {});
      }
    } else if (state.lastActiveCmd && state.writeChar) {
      const cmd = new Uint8Array(state.lastActiveCmd);
      cmd[5] = state.totalBrightness;
      state.writeChar.writeValueWithoutResponse(cmd).catch(() => {});
    }
  }
}
