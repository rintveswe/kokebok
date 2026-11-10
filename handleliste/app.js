// Handlelisten. Deler liste med familie-appen gjennom ../js/shopping.js.
// Rammen tegnes én gang. Etterpå byttes bare det som endrer seg, slik at skrivefeltet
// beholder fokus og listen beholder plassen sin når noen andre i familien endrer noe.
import { loadItems, addItems, toggle, remove, clearDone, clearAll, onChange, getStatus } from '../js/shopping.js';
import { esc, icons, icon, toast, closeOverlay } from '../js/ui.js';

const $app = document.getElementById('app');
const $ = (s) => $app.querySelector(s);
const COLORS = { Rino: '#8FBF9F', Iselin: '#E0A15E', Fia: '#B79AD6', Rakel: '#E58CA5', Hugo: '#7FB2DA' };
const lget = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const plural = (n) => `${n} ${n === 1 ? 'vare' : 'varer'}`;

let profiles = [];
let who = lget('kb_user', 'Rino');
let seen = null;       // id → handlet? fra forrige opptegning. null = første gang.
let reveal = false;    // rull til varen som nettopp ble lagt til

function frame() {
  $app.innerHTML = `<div class="list-app">
    <aside class="side">
      <h1 class="wordmark"><small>Familie</small>Handleliste</h1>
      <div class="orn"><i></i></div>
      <p class="label dim cap">Hvem handler?</p>
      <div class="who" id="who"></div>
      <div class="side-foot">
        <p class="sync" id="sync" role="status"><i></i><span></span></p>
        <a class="pill quiet" href="../index.html">${icons.book}Kokeboka</a>
      </div>
    </aside>
    <main class="main">
      <header>
        <div><p class="label">Å handle</p><h2 id="head"></h2></div>
        <form class="add" id="f">
          <label class="field"><input id="n" placeholder="Legg til vare …" aria-label="Legg til vare" autocomplete="off" enterkeyhint="done"></label>
          <button class="icon-btn solid" type="submit" aria-label="Legg til">${icons.plus}</button>
        </form>
      </header>
      <div class="items first" id="list"></div>
      <footer>
        <p class="label dim" id="sum"></p>
        <button class="btn ghost" id="cd">Fjern handlet</button>
        <button class="btn ghost" id="ca">Tøm alt</button>
      </footer>
    </main></div>`;

  const inp = $('#n');
  $('#f').onsubmit = (e) => {
    e.preventDefault();
    const v = inp.value.trim(); if (!v) return;
    const before = loadItems().length;
    inp.value = ''; reveal = true;
    addItems([{ label: v, by: who }]);
    if (loadItems().length === before) toast('Står allerede på listen');
    inp.focus();
  };
  $('#who').onclick = (e) => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    who = b.dataset.w; lset('kb_user', who);
    $app.querySelectorAll('[data-w]').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  };
  $('#list').onclick = (e) => {
    const t = e.target.closest('[data-t]'), d = e.target.closest('[data-d]');
    if (t) toggle(Number(t.dataset.t));
    else if (d) remove(Number(d.dataset.d));
  };
  $('#cd').onclick = () => { const n = loadItems().filter((i) => i.done).length; clearDone(); toast(`${plural(n)} fjernet`); };
  $('#ca').onclick = confirmClear;
}

function row(i, n) {
  const cls = seen ? (!seen.has(i.id) ? 'in' : seen.get(i.id) !== !!i.done ? 'moved' : '') : '';
  return `<div class="item ${i.done ? 'done' : ''} ${cls}" data-id="${i.id}" style="--i:${Math.min(n, 14)}">
    <button class="tick ${i.done ? 'on' : ''}" data-t="${i.id}" role="checkbox" aria-checked="${!!i.done}"><span class="check">${icons.check}</span><span class="t">${esc(i.label)}</span></button>
    ${i.user ? `<span class="by" style="--c:${COLORS[i.user] || '#A99F90'}"><i></i>${esc(i.user)}</span>` : ''}
    <button class="icon-btn bare" data-d="${i.id}" aria-label="Slett ${esc(i.label)}">${icons.close}</button></div>`;
}

/** Tegner alt som kan endre seg: hvem, synk, overskrift, liste og knapper. */
function paint() {
  const items = loadItems();
  const todo = items.filter((i) => !i.done), done = items.filter((i) => i.done);

  const names = profiles.length ? profiles.map((p) => p.name) : ['Rino'];
  const whoKey = names.join('|');
  const $who = $('#who');
  if ($who.dataset.k !== whoKey) {
    $who.dataset.k = whoKey;
    $who.innerHTML = names.map((n) => `<button class="${n === who ? 'on' : ''}" data-w="${esc(n)}" aria-pressed="${n === who}" style="--c:${COLORS[n] || '#A99F90'}"><span>${esc(n)}</span><i></i></button>`).join('');
  }

  const st = getStatus();
  $('#sync').className = `sync ${st}`;
  $('#sync span').textContent = { ok: 'Synkronisert', offline: 'Offline – synkes senere', local: 'Kobler til …' }[st];

  $('#head').textContent = todo.length ? plural(todo.length) : 'Ingenting å handle';
  $('#sum').textContent = items.length ? `${done.length} av ${items.length} handlet` : '';
  $('#cd').disabled = !done.length;
  $('#ca').disabled = !items.length;

  // Husk hvor hver rad sto, slik at de kan gli på plass etterpå i stedet for å hoppe
  const $list = $('#list');
  const was = new Map();
  if (seen && !calm) $list.querySelectorAll('.item').forEach((el) => was.set(el.dataset.id, el.getBoundingClientRect().top));
  const top = $list.scrollTop;

  let n = 0;
  $list.innerHTML = `${todo.length ? todo.map((i) => row(i, n++)).join('')
    : `<div class="state">${icon('cart', 'big')}<h2>Listen er tom.</h2><p>Skriv inn en vare over, eller legg til fra en oppskrift i kokeboka.</p></div>`}
    ${done.length ? `<p class="sec label dim">Handlet (${done.length})</p>${done.map((i) => row(i, n++)).join('')}` : ''}`;
  $list.scrollTop = top;

  const fresh = $list.querySelector('.item.in');
  if (reveal && fresh) fresh.scrollIntoView({ block: 'nearest' });
  reveal = false;

  const h = $list.clientHeight;
  $list.querySelectorAll('.item').forEach((el) => {
    const old = was.get(el.dataset.id); if (old === undefined) return;
    const dy = old - el.getBoundingClientRect().top;
    if (Math.abs(dy) < 2 || Math.abs(dy) > h * 1.5) return;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });

  if (seen) $list.classList.remove('first');
  seen = new Map(items.map((i) => [i.id, !!i.done]));
}

/** Egen dialog i stedet for nettleserens: samme spørsmål, samme virkning. */
function confirmClear() {
  const ov = document.createElement('div');
  ov.className = 'overlay center';
  ov.innerHTML = `<div class="scrim"></div>
    <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dq">
      <h2 id="dq">Tømme hele handlelisten for alle?</h2>
      <p>Alle varene forsvinner, også for resten av familien.</p>
      <div class="row"><button class="btn ghost" id="no">Avbryt</button><button class="btn solid" id="yes">Tøm alt</button></div>
    </div>`;
  document.body.appendChild(ov);
  const close = () => closeOverlay(ov);
  ov.querySelector('.scrim').onclick = close;
  ov.querySelector('#no').onclick = close;
  ov.querySelector('#yes').onclick = () => { clearAll(); close(); toast('Listen er tømt'); };
  ov.querySelector('#no').focus();
}
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(document.querySelector('.overlay')); });

frame();
paint();
onChange(paint);
fetch('../data/profiles.json').then((r) => r.json()).then((p) => { profiles = p; paint(); }).catch(() => {});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
