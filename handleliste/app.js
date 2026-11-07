import { loadItems, addItems, toggle, remove, clearDone, clearAll } from '../js/shopping.js';

const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let items = loadItems();

function row(i) {
  const meta = [i.recipes?.length ? i.recipes.join(', ') : '', i.by ? `av ${i.by}` : ''].filter(Boolean).join(' · ');
  return `<div class="item ${i.done ? 'done' : ''}" data-id="${i.id}">
    <button class="chk" data-t="${i.id}" aria-label="Kryss av">${i.done ? '✓' : ''}</button>
    <button class="txt" data-t="${i.id}">${i.qty ? `<span class="q">${esc(i.qty)}</span> ` : ''}${esc(i.name)}${meta ? `<small>${esc(meta)}</small>` : ''}</button>
    <button class="del" data-d="${i.id}" aria-label="Slett">✕</button></div>`;
}

function render() {
  const todo = items.filter((i) => !i.done), done = items.filter((i) => i.done);
  $app.innerHTML = `<div class="wrap">
    <div class="top"><h1>🛒 Handleliste</h1><a class="btn small" href="../index.html" style="text-decoration:none;color:inherit">🍳 Kokebok</a></div>
    <form class="add" id="f"><input id="n" placeholder="Legg til vare …" autocomplete="off"><button class="btn primary small" type="submit">＋</button></form>
    <div class="list">
      ${todo.length ? todo.map(row).join('') : '<p class="center" style="padding:40px 0">Listen er tom. 🎉</p>'}
      ${done.length ? `<div class="sec">Handlet (${done.length})</div>${done.map(row).join('')}` : ''}
    </div>
    <div class="foot">
      <button class="btn" id="cd" ${done.length ? '' : 'disabled'}>Fjern handlet</button>
      <button class="btn" id="ca" ${items.length ? '' : 'disabled'}>Tøm alt</button>
    </div></div>`;
  document.getElementById('f').onsubmit = (e) => {
    e.preventDefault();
    const v = document.getElementById('n').value.trim(); if (!v) return;
    items = addItems([{ name: v }]); render(); document.getElementById('n').focus();
  };
  $app.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { items = toggle(b.dataset.t); render(); });
  $app.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { items = remove(b.dataset.d); render(); });
  document.getElementById('cd').onclick = () => { items = clearDone(); render(); };
  document.getElementById('ca').onclick = () => { if (confirm('Tømme hele handlelisten?')) { items = clearAll(); render(); } };
}
window.addEventListener('storage', () => { items = loadItems(); render(); });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
