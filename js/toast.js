'use strict';

export function toast(message, type = 'info') {
  const colors = {
    info:    'bg-gray-800 border-gray-700 text-gray-200',
    success: 'bg-green-900/80 border-green-700 text-green-200',
    error:   'bg-red-900/80 border-red-700 text-red-200',
    warning: 'bg-amber-900/80 border-amber-700 text-amber-200',
  };
  const icons = {
    info:    '\u{1F4A1}',
    success: '\u2705',
    error:   '\u274C',
    warning: '\u26A0\uFE0F',
  };

  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border
                  text-sm shadow-xl toast-enter ${colors[type]}`;
  el.innerHTML = `<span class="mt-0.5">${icons[type]}</span><span>${message}</span>`;

  const container = document.getElementById('toast-container');
  container.appendChild(el);

  setTimeout(() => {
    el.classList.remove('toast-enter');
    el.classList.add('toast-exit');
    el.addEventListener('animationend', () => el.remove());
  }, 3500);
}
