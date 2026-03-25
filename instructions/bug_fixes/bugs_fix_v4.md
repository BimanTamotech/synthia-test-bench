# Bug Fix v4 — Slider UI Fixes

**Date:** 2026-03-25
**Fixes:** B-14, B-15 from `bugs_v4.md`

---

## Fix B-14: Convert BC Frequency Dropdown to Slider

### HTML Change
Replace the `<select id="bc-frequency">` block with:
```html
<div>
  <div class="flex justify-between mb-1.5">
    <label class="text-xs font-medium text-gray-400">Frequency</label>
    <span id="bc-frequency-label" class="text-xs text-indigo-300 font-mono font-semibold">10 Hz</span>
  </div>
  <input id="bc-frequency" type="range" min="0" max="255" value="10" disabled
    class="w-full disabled:opacity-40"/>
</div>
```

### JS Changes
1. Add DOM ref: `const bcFreqLbl = document.getElementById('bc-frequency-label');`
2. In `updateBcPreview()`, add label update:
   ```js
   bcFreqLbl.textContent = bcFrequency.value == 0 ? 'Steady' : `${bcFrequency.value} Hz`;
   ```
3. No changes needed to `bcSend` click handler — `parseInt(bcFrequency.value)` already returns a number

---

## Fix B-15: Improve Slider Track Visibility + Firefox Support

### CSS Changes
Update existing track/thumb styles and add Firefox equivalents:

**Active track:** `#334155` -> `#475569` (brighter slate-600)
**Disabled track:** `#1e293b` -> `#334155` (visible slate-700)

**Add Firefox styles:**
```css
input[type=range]::-moz-range-track {
  background: #475569;
  height: 6px;
  border-radius: 3px;
  border: none;
}
input[type=range]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6366f1;
  border: none;
  cursor: pointer;
}
input[type=range]:hover::-moz-range-thumb { background: #818cf8; }
input[type=range]:disabled::-moz-range-thumb { background: #475569; cursor: not-allowed; }
input[type=range]:disabled::-moz-range-track { background: #334155; }
```

---

## Verification
- Chrome: all slider tracks clearly visible against dark card backgrounds
- Firefox: sliders render with proper track and thumb styling
- BC Frequency slider shows "Steady" at 0, "{n} Hz" for other values
- All slider value labels update in real-time on drag
