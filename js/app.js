// Familiekokeboka – fase 1. Ren JS, ingen avhengigheter.
import { addItems } from './shopping.js';

const $app = document.getElementById('app');
const state = { recipes: new Map(), cat: 'Alle', q: '', mild: load('mild', false), profiles: [] };

function load(k, d) { try { const v = localStorage.getItem('kb_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }
function save(k, v) { try { localStorage.setItem('kb_' + k, JSON.stringify(v)); } catch {} }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Data ---------- */
async function loadAll() {
  const ids = await (await fetch('data/index.json')).json();
  const list = await Promise.all(ids.map((id) =>
    fetch(`data/recipes/${id}.json`).then((r) => r.json()).catch(() => null)));
  list.filter(Boolean).forEach((r) => state.recipes.set(r.id, r));
  state.profiles = await fetch('data/profiles.json').then((r) => r.json()).catch(() => []);
}
const categories = () => ['Alle', ...new Set([...state.recipes.values()].map((r) => r.category))];

/* ---------- Skjerm våken ---------- */
let wake = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wake) {
      wake = await navigator.wakeLock.request('screen');
      wake.addEventListener('release', () => { wake = null; });
    } else if (!on && wake) { await wake.release(); wake = null; }
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && location.hash.startsWith('#/r/')) keepAwake(true);
});

/* ---------- Hjelpere ---------- */
function hue(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function pic(r, cls = '', emoji = null) {
  const h = hue(r.id);
  const style = `--h1:hsl(${h} 55% 38%);--h2:hsl(${(h + 40) % 360} 45% 16%)${r.imagePos ? `;--pos:${esc(r.imagePos)}` : ''}`;
  const img = r.image ? `<img src="${esc(r.image)}" alt="" loading="lazy">` : '';
  return `<div class="pic ${r.image ? 'photo ' : ''}${cls}" style="${style}">${r.image ? '' : `<span class="emoji">${emoji ?? r.emoji ?? '🍽️'}</span>`}${img}</div>`;
}
function timeText(r) {
  const t = r.time || {};
  const f = (m) => (m >= 60 ? `${Math.floor(m / 60)} t${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
  return t.active ? `${f(t.active)} aktiv` + (t.total && t.total > t.active ? ` · ${f(t.total)} totalt` : '') : '';
}
function badge(r) { return r.status === 'testet' ? '<span class="badge ok">Testet</span>' : '<span class="badge">Kladd</span>'; }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* ---------- Visninger ---------- */
function viewHome() {
  keepAwake(false);
  const q = state.q.trim().toLowerCase();
  const items = [...state.recipes.values()]
    .filter((r) => state.cat === 'Alle' || r.category === state.cat)
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title, 'nb'));
  $app.innerHTML = `
    <div class="top"><h1>🍳 Familiekokeboka</h1>
      <input id="q" class="search" type="search" placeholder="Søk etter rett …" value="${esc(state.q)}"></div>
    <div class="chips">${categories().map((c) => `<button class="chip ${c === state.cat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    <div class="scroll"><div class="grid">${items.map((r, i) => `
      <button class="card" style="animation-delay:${Math.min(i, 12) * 35}ms" data-id="${r.id}">
        ${pic(r, '')}
        <div class="meta"><h3>${esc(r.title)}${badge(r)}</h3>
        <div class="sub">${esc(r.category)}${timeText(r) ? ' · ' + esc(timeText(r)) : ''}</div></div>
      </button>`).join('') || '<p class="center">Ingen retter funnet.</p>'}</div></div>`;
  $app.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { state.cat = b.dataset.cat; viewHome(); });
  $app.querySelectorAll('[data-id]').forEach((b) => b.onclick = () => (location.hash = `#/r/${b.dataset.id}`));
  const qi = document.getElementById('q');
  qi.oninput = () => { state.q = qi.value; const pos = qi.selectionStart; viewHome(); const n = document.getElementById('q'); n.focus(); n.setSelectionRange(pos, pos); };
}

function linkOrText(s) {
  const r = state.recipes.get(s);
  return r ? `<button class="link go" data-go="${r.id}">${r.emoji ?? '🍽️'} ${esc(r.title)}</button>` : `<span class="link">${esc(s)}</span>`;
}

function ingredientHtml(r) {
  let last = null, out = '';
  for (const i of r.ingredients) {
    if (i.group && i.group !== last) { out += `<li style="display:block;border:0;padding-top:16px"><b style="color:var(--accent2)">${esc(i.group)}</b></li>`; last = i.group; }
    let name = esc(i.name), note = '', cls = '';
    if (state.mild && i.spicy) {
      if (i.alt) { name = esc(i.alt.name); note = `<small>Mild versjon – i stedet for ${esc(i.name)}</small>`; }
      else { cls = 'skip'; note = '<small>Hopp over i mild versjon</small>'; }
    } else {
      if (i.alt && i.spicy) note += `<small>Mild: ${esc(i.alt.name)}</small>`;
      if (i.note) note += `<small>${esc(i.note)}</small>`;
    }
    const qty = state.mild && i.spicy && i.alt ? i.alt.qty : i.qty;
    const q = qty ? esc(qty) : '<span class="missing">mengde mangler</span>';
    const tags = (i.optional ? '<span class="tag">kan sløyfes</span>' : '') + (i.spicy && !state.mild ? '<span class="tag hot">🌶 sterk</span>' : '');
    out += `<li><span class="q">${q}</span><span class="n ${cls}">${name}${tags}${note}</span></li>`;
  }
  return out;
}

function viewRecipe(id) {
  const r = state.recipes.get(id);
  if (!r) return (location.hash = '#/');
  keepAwake(true);
  const p = r.pairs || {};
  const hasSpicy = r.ingredients.some((i) => i.spicy);
  $app.innerHTML = `
    <div class="top"><button class="btn small" id="back">← Tilbake</button><h1>${esc(r.title)}${badge(r)}</h1>
      <button class="btn small" id="shop">🛒 Handleliste</button></div>
    <div class="recipe">
      <div class="hero">${pic(r)}
        <div class="facts"><span class="fact">👥 ${esc(r.servings)}</span><span class="fact">⏱ ${esc(timeText(r))}</span><span class="fact">${esc(r.category)}</span></div>
      </div>
      <div class="body">
        ${r.intro ? `<p style="font-size:22px;line-height:1.4">${esc(r.intro)}</p>` : ''}
        ${r.headsUp ? `<div class="panel warn"><h2>⏰ Husk først</h2><p>${esc(r.headsUp)}</p></div>` : ''}
        ${r.tips?.length ? `<div class="panel"><h2>💡 Tips</h2><ul>${r.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
        ${r.uses?.length ? `<div class="panel"><h2>🔗 Bruker disse grunnoppskriftene</h2><div class="links">${r.uses.map(linkOrText).join('')}</div></div>` : ''}
        <div class="panel"><h2>🛒 Ingredienser</h2>
          ${hasSpicy ? `<div class="toggle" id="mild"><div class="sw ${state.mild ? 'on' : ''}"></div><span>Mild versjon (Iselin og Rakel)</span></div>` : ''}
          <ul class="ing">${ingredientHtml(r)}</ul></div>
        ${(p.drink || p.starter || p.dessert || p.side) ? `<div class="panel"><h2>🍽️ Passer til</h2>
          ${p.drink ? `<div class="row"><b>Drikke</b><div class="links">${p.drink.map(linkOrText).join('')}</div></div>` : ''}
          ${p.starter ? `<div class="row"><b>Forrett</b><div class="links">${p.starter.map(linkOrText).join('')}</div></div>` : ''}
          ${p.side ? `<div class="row"><b>Tilbehør</b><div class="links">${p.side.map(linkOrText).join('')}</div></div>` : ''}
          ${p.dessert ? `<div class="row"><b>Dessert</b><div class="links">${p.dessert.map(linkOrText).join('')}</div></div>` : ''}</div>` : ''}
        ${r.source ? `<p style="color:var(--muted);font-size:17px">Kilde: ${esc(r.source.type)}${r.source.url ? ' – ' + esc(r.source.url) : ''}</p>` : ''}
      </div>
    </div>
    <div class="startbar"><button class="btn primary" id="start">▶ Start matlagingen</button></div>`;
  document.getElementById('back').onclick = () => (location.hash = '#/');
  document.getElementById('start').onclick = () => (location.hash = `#/r/${id}/s/0`);
  document.getElementById('shop').onclick = () => openShop(r);
  const m = document.getElementById('mild');
  if (m) m.onclick = () => { state.mild = !state.mild; save('mild', state.mild); viewRecipe(id); };
  $app.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => (location.hash = `#/r/${b.dataset.go}`));
}

/* ---------- Handleliste-dialog ---------- */
function shopCandidates(r, mild) {
  // Rettens egne ingredienser + ingredienser fra grunnoppskrifter den bruker
  const out = [];
  const add = (recipe, ings) => ings.forEach((i) => {
    let name = i.name, qty = i.qty || '';
    if (mild && i.spicy) { if (!i.alt) return; name = i.alt.name; qty = i.alt.qty || ''; }
    out.push({ name, qty, optional: !!i.optional, source: recipe.title, base: recipe.id !== r.id });
  });
  add(r, r.ingredients.filter((i) => !/\(se .+\)$/.test(i.name)));
  (r.uses || []).forEach((u) => { const b = state.recipes.get(u); if (b) add(b, b.ingredients); });
  return out;
}

function openShop(r) {
  const profiles = state.profiles.length ? state.profiles : [{ id: 'x', name: 'Familien', mild: false }];
  let pid = load('profile', profiles[0].id);
  if (!profiles.some((p) => p.id === pid)) pid = profiles[0].id;
  let checked = null, cands = [];
  const ov = document.createElement('div');
  ov.className = 'overlay';
  document.body.appendChild(ov);

  const rebuild = () => {
    const p = profiles.find((x) => x.id === pid);
    cands = shopCandidates(r, p.mild);
    checked = cands.map((c) => !c.optional);
    paint();
  };
  const paint = () => {
    const p = profiles.find((x) => x.id === pid);
    let last = null, rows = '';
    cands.forEach((c, i) => {
      if (c.source !== last) { rows += `<div class="grp">${c.base ? '🔗 ' : ''}${esc(c.source)}</div>`; last = c.source; }
      rows += `<button class="srow ${checked[i] ? 'on' : ''}" data-i="${i}"><span class="box">${checked[i] ? '✓' : ''}</span>
        <span class="t">${c.qty ? `<b>${esc(c.qty)}</b> ` : ''}${esc(c.name)}${c.optional ? '<span class="tag">kan sløyfes</span>' : ''}</span></button>`;
    });
    const n = checked.filter(Boolean).length;
    ov.innerHTML = `<div class="dialog">
      <div class="dhead"><h2>🛒 Handleliste – ${esc(r.title)}</h2><button class="btn small" id="dx">✕</button></div>
      <div class="who">${profiles.map((x) => `<button class="chip ${x.id === pid ? 'on' : ''}" data-p="${x.id}">${esc(x.name)}</button>`).join('')}</div>
      <p class="hint">Fjern hake på det dere allerede har.${p.mild ? ' Mild versjon er valgt for ' + esc(p.name) + '.' : ''}</p>
      <div class="srows">${rows}</div>
      <div class="dfoot"><button class="btn primary" id="dok" ${n ? '' : 'disabled'}>Legg til ${n} ${n === 1 ? 'vare' : 'varer'}</button></div></div>`;
    ov.querySelector('#dx').onclick = () => ov.remove();
    ov.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { pid = b.dataset.p; save('profile', pid); rebuild(); });
    ov.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const i = +b.dataset.i; checked[i] = !checked[i]; const st = ov.querySelector('.srows').scrollTop; paint(); ov.querySelector('.srows').scrollTop = st; });
    ov.querySelector('#dok').onclick = () => {
      const p2 = profiles.find((x) => x.id === pid);
      const picked = cands.filter((_, i) => checked[i]).map((c) => ({ label: c.qty && !/^etter smak$/.test(c.qty) ? `${c.qty} ${c.name}` : c.name, by: p2.name }));
      addItems(picked); ov.remove();
      toast(`🛒 ${picked.length} varer lagt i handlelisten`);
    };
  };
  rebuild();
}

let timerHandle = null;
function viewStep(id, n) {
  const r = state.recipes.get(id);
  if (!r) return (location.hash = '#/');
  keepAwake(true);
  const steps = r.steps, last = steps.length; // n === last → ferdig rett
  const done = n >= last;
  const s = steps[Math.min(n, last - 1)];
  const anim = done ? 'serve' : (s.anim || 'none');
  const text = done ? 'Ferdig! Server og nyt. 🎉' : s.text;
  const stage = done ? pic(r, 'stage finish a-serve') : pic({ ...r, image: s.image || null, id: r.id + n }, `stage a-${anim}`, s.icon || r.emoji);
  $app.innerHTML = `
    <div class="steps">
      <div class="stephead"><button class="btn small" id="x">✕ Avslutt</button>
        <div class="dots">${[...Array(last + 1)].map((_, i) => `<i class="${i < n ? 'done' : i === n ? 'cur' : ''}"></i>`).join('')}</div>
        <span style="font-size:22px;font-weight:700">${done ? 'Ferdig' : `Steg ${n + 1} av ${last}`}</span></div>
      <div class="stagewrap" id="stagewrap">${stage}</div>
      <div class="stext"><span class="n">${done ? r.title : 'Steg ' + (n + 1)}</span><p>${esc(text)}</p>
        ${!done && s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>
      <div class="navbar">
        <button class="btn" id="prev" ${n === 0 ? 'disabled' : ''}>← Forrige</button>
        <button class="btn replay" id="replay">↻ Igjen</button>
        ${!done && s.timer ? `<button class="btn timer" id="timer">⏲ ${s.timer} min</button>` : ''}
        <button class="btn primary" id="next">${done ? '✓ Til forsiden' : n === last - 1 ? 'Ferdig rett →' : 'Neste →'}</button>
      </div>
    </div>`;
  const go = (k) => (location.hash = `#/r/${id}/s/${k}`);
  document.getElementById('x').onclick = () => (location.hash = `#/r/${id}`);
  document.getElementById('prev').onclick = () => go(n - 1);
  document.getElementById('next').onclick = () => (done ? (location.hash = '#/') : go(n + 1));
  document.getElementById('replay').onclick = () => {
    const el = document.querySelector('.stage'); if (!el) return;
    const c = el.className; el.className = 'pic stage'; void el.offsetWidth; el.className = c;
  };
  const t = document.getElementById('timer');
  if (t) t.onclick = () => startTimer(t, s.timer);
  // Sveip
  const w = document.getElementById('stagewrap'); let x0 = null;
  w.ontouchstart = (e) => (x0 = e.touches[0].clientX);
  w.ontouchend = (e) => {
    if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (dx < -60) (done ? null : go(n + 1)); else if (dx > 60 && n > 0) go(n - 1);
  };
}

function startTimer(btn, min) {
  clearInterval(timerHandle);
  let left = min * 60;
  const tick = () => {
    const m = String(Math.floor(left / 60)).padStart(2, '0'), s = String(left % 60).padStart(2, '0');
    btn.textContent = `⏲ ${m}:${s}`;
    if (left-- <= 0) { clearInterval(timerHandle); btn.textContent = '⏰ Ferdig!'; toast('⏰ Tiden er ute!'); try { navigator.vibrate?.([300, 150, 300]); } catch {} }
  };
  tick(); timerHandle = setInterval(tick, 1000);
}

/* ---------- Ruting ---------- */
function route() {
  clearInterval(timerHandle);
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'r' && h[1] && h[2] === 's') viewStep(h[1], parseInt(h[3], 10) || 0);
  else if (h[0] === 'r' && h[1]) viewRecipe(h[1]);
  else viewHome();
}
window.addEventListener('hashchange', route);

(async function init() {
  $app.innerHTML = '<p class="center">Laster kokeboka …</p>';
  try { await loadAll(); } catch { $app.innerHTML = '<p class="center">Kunne ikke laste oppskriftene.</p>'; return; }
  route();
  if ('serviceWorker' in navigator) {
    // Ny versjon av appen tok over: last siden på nytt én gang så man ser siste versjon med en gang
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloaded) { reloaded = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
