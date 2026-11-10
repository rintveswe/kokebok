// Felles småting for kokeboka og handlelisten: ikoner, varsel og lagring.

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function load(k, d) { try { const v = localStorage.getItem('kb_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }
export function save(k, v) { try { localStorage.setItem('kb_' + k, JSON.stringify(v)); } catch {} }

/* Ikoner: én strekvekt, runde ender, arver tekstfargen. Tegnet i 24×24. */
const ic = (d, cls = '') => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const paths = {
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  cart: '<path d="M3 4h2.5l2.2 10.5h10.2L20 7H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5M12 3v3M18.5 6.5l1.2-1.2"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 004 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  replay: '<path d="M4.5 12a7.5 7.5 0 107.5-7.5H7"/><path d="M10 1.5l-3 3 3 3"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.5h9.2L17.5 7M10 11v5M14 11v5"/>',
  chili: '<path d="M15 6c2 .5 3.5 2 3.5 4.5 0 5-5 9-13 9 5-2 6.5-5 7-9 .3-2.5 1-4 2.5-4.5z"/><path d="M15 6c0-1.5.8-2.5 2-3"/>',
  link: '<path d="M10.5 13.5a4 4 0 005.7 0l2.6-2.6a4 4 0 00-5.7-5.7L12 6.3"/><path d="M13.5 10.5a4 4 0 00-5.7 0l-2.6 2.6a4 4 0 005.7 5.7L12 17.7"/>',
  book: '<path d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2zM12 6.5v13"/>',
  cloche: '<path d="M3 17.5h18M5 17.5a7 7 0 0114 0M12 10.5v-2"/><circle cx="12" cy="7.3" r="1.2"/>',
};
export const icons = Object.fromEntries(Object.entries(paths).map(([k, d]) => [k, ic(d)]));
export const icon = (name, cls) => ic(paths[name], cls);

/** Lite varsel nederst på skjermen. Forsvinner av seg selv. */
export function toast(msg, name = 'check') {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `${icons[name] || ''}<span>${esc(msg)}</span>`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2900);
}

/** Lukker en skuff/dialog med animasjon før den fjernes. */
export function closeOverlay(ov) {
  if (!ov || ov.classList.contains('out')) return;
  ov.classList.add('out');
  setTimeout(() => ov.remove(), 230);
}
