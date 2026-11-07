import { loadItems, addItems, toggle, remove, clearDone, clearAll, onChange, getStatus } from '../js/shopping.js';

const $app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COLORS = { Rino: '#2ecc8e', Iselin: '#e67e22', Fia: '#9b59b6', Rakel: '#e91e63', Hugo: '#3498db' };
const lget = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

let profiles = [];
let who = lget('kb_user', 'Rino');
let typing = '';

function row(i) {
  return `<div class="item ${i.done ? 'done' : ''}">
    <button class="chk" data-t="${i.id}" aria-label="Kryss av">${i.done ? '✓' : ''}</button>
    <button class="txt" data-t="${i.id}">${esc(i.label)}</button>
    <span class="utag" style="background:${COLORS[i.user] || '#888'}">${esc(i.user || '')}</span>
    <button class="del" data-d="${i.id}" aria-label="Slett">✕</button></div>`;
}

function render() {
  const items = loadItems();
  const todo = items.filter((i) => !i.done), done = items.filter((i) => i.done);
  const st = { ok: ['#2ecc8e', 'Synkronisert'], offline: ['#e67e22', 'Offline – synkes senere'], local: ['#888', 'Kobler til …'] }[getStatus()];
  $app.innerHTML = `<div class="wrap">
    <div class="top"><h1>🛒 Handleliste</h1><a class="btn small" href="../index.html" style="text-decoration:none;color:inherit">🍳 Kokebok</a></div>
    <div class="sync"><i style="background:${st[0]}"></i>${st[1]}</div>
    <div class="who">${(profiles.length ? profiles.map((p) => p.name) : ['Rino']).map((n) => `<button class="chip ${n === who ? 'on' : ''}" data-w="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <form class="add" id="f"><input id="n" placeholder="Legg til vare …" autocomplete="off" value="${esc(typing)}"><button class="btn primary small" type="submit">＋</button></form>
    <div class="list">
      ${todo.length ? todo.map(row).join('') : '<p class="center" style="padding:40px 0">Listen er tom. 🎉</p>'}
      ${done.length ? `<div class="sec">Handlet (${done.length})</div>${done.map(row).join('')}` : ''}
    </div>
    <div class="foot">
      <button class="btn" id="cd" ${done.length ? '' : 'disabled'}>Fjern handlet</button>
      <button class="btn" id="ca" ${items.length ? '' : 'disabled'}>Tøm alt</button>
    </div></div>`;
  const inp = document.getElementById('n');
  inp.oninput = () => { typing = inp.value; };
  document.getElementById('f').onsubmit = (e) => {
    e.preventDefault();
    const v = inp.value.trim(); if (!v) return;
    typing = ''; addItems([{ label: v, by: who }]); inp.focus();
  };
  $app.querySelectorAll('[data-w]').forEach((b) => b.onclick = () => { who = b.dataset.w; lset('kb_user', who); render(); });
  $app.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => toggle(Number(b.dataset.t)));
  $app.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => remove(Number(b.dataset.d)));
  document.getElementById('cd').onclick = () => clearDone();
  document.getElementById('ca').onclick = () => { if (confirm('Tømme hele handlelisten for alle?')) clearAll(); };
}

onChange(render);
fetch('../data/profiles.json').then((r) => r.json()).then((p) => { profiles = p; render(); }).catch(() => {});
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
