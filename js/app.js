// Familiekokeboka. Ren JS, ingen avhengigheter.
// Tre skjermer: menyen (#/), rettsiden (#/r/<id>) og steg for steg (#/r/<id>/s/<n>).
import { addItems } from './shopping.js';
import { esc, icons, icon, toast, load, save, closeOverlay } from './ui.js';

const $app = document.getElementById('app');
const $ = (sel, root = $app) => root.querySelector(sel);
const state = { recipes: new Map(), list: [], no: new Map(), cat: 'Alle', q: '', mild: load('mild', false), profiles: [], last: null, homeScroll: null };

/* ---------- Data ---------- */
async function loadAll() {
  const ids = await (await fetch('data/index.json')).json();
  const list = await Promise.all(ids.map((id) =>
    fetch(`data/recipes/${id}.json`).then((r) => r.json()).catch(() => null)));
  state.list = list.filter(Boolean);
  state.recipes = new Map(state.list.map((r) => [r.id, r]));
  // Rettens faste nummer på menyen (Nº) følger alfabetet.
  [...state.list].sort(byTitle).forEach((r, i) => state.no.set(r.id, String(i + 1).padStart(2, '0')));
  state.profiles = await fetch('data/profiles.json').then((r) => r.json()).catch(() => []);
}
const byTitle = (a, b) => a.title.localeCompare(b.title, 'nb');

function categories() {
  const m = new Map();
  state.list.forEach((r) => m.set(r.category, (m.get(r.category) || 0) + 1));
  return [{ name: 'Alle', n: state.list.length }, ...[...m].map(([name, n]) => ({ name, n }))];
}
function filtered() {
  const q = state.q.trim().toLowerCase();
  return state.list
    .filter((r) => state.cat === 'Alle' || r.category === state.cat)
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort(byTitle);
}

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
const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)} t${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
function timeFacts(r) {
  const t = r.time || {};
  return { active: t.active ? fmt(t.active) : null, total: t.active && t.total && t.total > t.active ? fmt(t.total) : null };
}
const emojiOf = (r) => esc(r.emoji || '🍽️');
const dish = (emoji, cls = '') => `<span class="dish${cls ? ' ' + cls : ''}"><span>${emoji}</span></span>`;
/** Bildet av retten – eller en tallerken med rettens symbol når bildet mangler. */
const media = (r) => (r.image
  ? `<img src="${esc(r.image)}" alt="" data-emoji="${emojiOf(r)}" style="object-position:${esc(r.imagePos || '50% 50%')}">`
  : dish(emojiOf(r)));
const status = (r) => (r.status === 'testet' ? '<em class="tag ok">Testet</em>' : '<em class="tag">Kladd</em>');

// Et bilde som ikke lar seg hente (f.eks. uten nett første gang) byttes med tallerkenen.
$app.addEventListener('error', (e) => {
  const im = e.target;
  if (im.tagName !== 'IMG' || im.dataset.emoji === undefined) return;
  const plate = im.closest('.plate-photo');
  if (plate) { plate.outerHTML = dish(esc(im.dataset.emoji), 'a-serve'); return; }
  im.closest('.photo')?.classList.remove('photo');
  im.outerHTML = dish(esc(im.dataset.emoji));
}, true);

/* ---------- Menyen ---------- */
function viewHome(from) {
  keepAwake(false);
  $app.innerHTML = `
  <div class="home">
    <aside class="rail">
      <h1 class="wordmark"><small>Familie</small>Kokeboka</h1>
      <p class="orn"><i></i></p>
      <div class="cats-wrap"><nav id="cats" class="hide-scroll" aria-label="Kategorier">${categories().map((c) =>
        `<button class="${c.name === state.cat ? 'on' : ''}" data-cat="${esc(c.name)}"><span>${esc(c.name === 'Alle' ? 'Hele menyen' : c.name)}</span><em>${c.n}</em></button>`).join('')}</nav></div>
      <p class="motto">Åpent hver dag.<br>Bordet er alltid ledig.</p>
    </aside>
    <main class="stage">
      <header>
        <div><p class="label" id="label"></p><h2 id="heading"></h2></div>
        <label class="field search">${icons.search}<input id="q" type="search" enterkeyhint="search" placeholder="Søk etter en rett" value="${esc(state.q)}" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="clear" id="clear" type="button" aria-label="Tøm søket" ${state.q ? '' : 'hidden'}>${icons.close}</button></label>
        <a class="pill" href="handleliste/index.html">${icons.cart}<span>Handleliste</span></a>
      </header>
      <div class="row hide-scroll" id="row"></div>
      <footer><span id="count"></span><i class="bar"><b id="bar"></b></i><span id="hint">Sveip for flere</span></footer>
    </main>
  </div>`;
  const row = $('#row'), bar = $('#bar'), q = $('#q'), clear = $('#clear'), cats = $('#cats');

  const progress = () => {
    const more = row.scrollWidth - row.clientWidth;
    const seen = !row.querySelector('.card') ? 0 : row.scrollWidth ? Math.min(1, (row.scrollLeft + row.clientWidth) / row.scrollWidth) : 1;
    bar.style.transform = `scaleX(${seen})`;
    $('#hint').classList.toggle('off', more - row.scrollLeft < 8);
  };
  let tick = 0;
  row.onscroll = () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; progress(); }); };

  const paint = (still) => {
    // Retter med bilde først – bildene skal lede an. Nummeret (Nº) følger fortsatt alfabetet.
    const items = filtered().sort((a, b) => !!b.image - !!a.image), term = state.q.trim();
    $('#label').textContent = term ? (state.cat === 'Alle' ? 'Søk i hele menyen' : `Søk i ${state.cat}`) : 'Menyen';
    $('#heading').textContent = term ? `«${term}»` : state.cat === 'Alle' ? 'Alle retter' : state.cat;
    $('#count').textContent = `${items.length} ${items.length === 1 ? 'rett' : 'retter'}`;
    row.classList.toggle('still', !!still);
    row.innerHTML = items.map((r, i) => {
      const t = timeFacts(r);
      const time = t.active ? [t.active, t.total && `${t.total} totalt`].filter(Boolean).join(' · ') : `${r.steps.length} steg`;
      return `<a class="card ${r.image ? 'photo' : ''}" href="#/r/${esc(r.id)}" data-r="${esc(r.id)}" style="--i:${Math.min(i, 8)}">
        <div class="media">${media(r)}</div>
        ${status(r)}
        <div class="cap"><p class="no label">Nº ${state.no.get(r.id)}<span>${esc(r.category)}</span></p><h3>${esc(r.title)}</h3>
          <p class="meta">${icons.clock}<span>${esc(time)}</span></p></div>
      </a>`;
    }).join('') || `<div class="state">${icon('search', 'big')}<h2>Ingen retter passer til søket</h2>
      <p>Prøv et annet ord, eller bla i hele menyen.</p><button class="pill" id="reset">Vis hele menyen</button></div>`;
    row.scrollLeft = 0; row.scrollTop = 0; progress();
  };
  const setCat = (name) => {
    state.cat = name;
    cats.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.cat === name));
  };

  cats.onclick = (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b || b.dataset.cat === state.cat) return;
    setCat(b.dataset.cat); paint();
    b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  q.oninput = () => { state.q = q.value; clear.hidden = !q.value; paint(true); };
  q.onkeydown = (e) => { if (e.key === 'Enter') q.blur(); };
  clear.onclick = (e) => { e.preventDefault(); q.value = ''; state.q = ''; clear.hidden = true; paint(true); q.focus(); };
  row.onclick = (e) => {
    if (e.target.closest('#reset')) { state.q = ''; q.value = ''; clear.hidden = true; setCat('Alle'); paint(); return; }
    // Bildet i kortet «løftes» over til rettsiden
    const m = e.target.closest('.card')?.querySelector('.media');
    if (m) m.style.viewTransitionName = 'hero';
  };

  const back = from && from.kind !== 'home';
  paint(back);
  cats.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (back && state.homeScroll) { row.scrollLeft = state.homeScroll.x; row.scrollTop = state.homeScroll.y; progress(); }
  if (from?.kind === 'recipe' && state.last) {
    // På vei tilbake: bildet «lander» i kortet det kom fra
    const m = [...row.querySelectorAll('.card')].find((c) => c.dataset.r === state.last)?.querySelector('.media');
    if (m) { m.style.viewTransitionName = 'hero'; setTimeout(() => (m.style.viewTransitionName = ''), 700); }
  }
}

/* ---------- Rettsiden ---------- */
/** Ingredienser gruppert, med mild versjon regnet ut. */
function ingredients(r) {
  const groups = [];
  for (const i of r.ingredients) {
    const key = i.group || '';
    let g = groups[groups.length - 1];
    if (!g || g.name !== key) { g = { name: key, items: [] }; groups.push(g); }
    const it = { name: i.name, qty: i.qty, notes: [], optional: !!i.optional, hot: !!i.spicy && !state.mild, skip: false };
    if (state.mild && i.spicy) {
      if (i.alt) { it.name = i.alt.name; it.qty = i.alt.qty; it.notes.push(`Mild versjon – i stedet for ${i.name}`); }
      else { it.skip = true; it.notes.push('Hopp over i mild versjon'); }
    } else {
      if (i.alt && i.spicy) it.notes.push(`Mild: ${i.alt.name}`);
      if (i.note) it.notes.push(i.note);
    }
    g.items.push(it);
  }
  return groups;
}
const ingredientHtml = (r) => ingredients(r).map((g) => `
  ${g.name ? `<h4>${esc(g.name)}</h4>` : ''}
  <ul>${g.items.map((i) => `<li class="${i.skip ? 'skip' : ''}">
    <p><span class="n">${esc(i.name)}</span><i></i><span class="q">${i.qty ? esc(i.qty) : '<em class="missing">mengde mangler</em>'}</span></p>
    ${i.optional || i.hot || i.notes.length ? `<small>${i.optional ? '<em class="tag">kan sløyfes</em>' : ''}${i.hot ? `<em class="tag hot">${icons.chili}sterk</em>` : ''}${i.notes.length ? `<span>${i.notes.map(esc).join(' · ')}</span>` : ''}</small>` : ''}
  </li>`).join('')}</ul>`).join('');

function linkOrText(s) {
  const r = state.recipes.get(s);
  return r ? `<a class="ref pill quiet" href="#/r/${esc(r.id)}">${esc(r.title)}${icons.next}</a>` : `<span class="ref">${esc(s)}</span>`;
}

function viewRecipe(id, from) {
  const r = state.recipes.get(id);
  keepAwake(true);
  state.last = id;
  const t = timeFacts(r), p = r.pairs || {};
  const pairs = [['drink', 'Drikke'], ['starter', 'Forrett'], ['side', 'Tilbehør'], ['dessert', 'Dessert']].filter(([k]) => p[k]?.length);
  const hasSpicy = r.ingredients.some((i) => i.spicy);
  $app.innerHTML = `
  <article class="recipe hide-scroll">
    <div class="lead">
      <figure class="hero ${r.image ? 'photo' : ''}">${media(r)}</figure>
      <dl class="facts">
        <div><dd>${esc(r.servings)}</dd><dt>Porsjoner</dt></div>
        ${t.active ? `<div><dd>${t.active}</dd><dt>Aktiv tid</dt></div>` : ''}
        ${t.total ? `<div><dd>${t.total}</dd><dt>Totalt</dt></div>` : ''}
        <div><dd>${r.steps.length}</dd><dt>Steg</dt></div>
      </dl>
      <a class="back icon-btn" href="#/" aria-label="Tilbake til menyen">${icons.back}</a>
    </div>
    <div class="text">
      <div class="scroll">
        <p class="kicker label"><i></i><span>Nº ${state.no.get(r.id)} · ${esc(r.category)}</span><i></i>${status(r)}</p>
        <h1>${esc(r.title)}</h1>
        ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ''}
        ${r.headsUp ? `<aside class="headsup">${icons.clock}<div><h3 class="label">Før du begynner</h3><p>${esc(r.headsUp)}</p></div></aside>` : ''}
        <section class="ing">
          <header><h2 class="label">Ingredienser</h2>
            ${hasSpicy ? `<button class="switch ${state.mild ? 'on' : ''}" id="mild" role="switch" aria-checked="${state.mild}"><span>Mild versjon<small>Iselin og Rakel</small></span><i></i></button>` : ''}</header>
          <div id="ing">${ingredientHtml(r)}</div>
        </section>
        ${r.tips?.length ? `<section><h2 class="label">Kjøkkenets tips</h2><ol class="tips">${r.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
        ${r.uses?.length ? `<section><h2 class="label">Grunnoppskrifter</h2><div class="refs">${r.uses.map(linkOrText).join('')}</div></section>` : ''}
        ${pairs.length ? `<section><h2 class="label">Passer til</h2><dl class="pairs">${pairs.map(([k, label]) => `<div><dt>${label}</dt><dd>${p[k].map(linkOrText).join('')}</dd></div>`).join('')}</dl></section>` : ''}
        ${r.source ? `<p class="source">Kilde: ${esc(r.source.type)}${r.source.url ? ' – ' + esc(r.source.url) : ''}</p>` : ''}
      </div>
      <footer class="actions">
        <button class="btn ghost big" id="shop">${icons.cart}<span>Handleliste</span></button>
        <a class="btn solid big" id="start" href="#/r/${esc(r.id)}/s/0"><span>Start matlagingen</span>${icons.next}</a>
      </footer>
    </div>
  </article>`;
  $('#shop').onclick = () => openShop(r);
  const m = $('#mild');
  if (m) m.onclick = () => {
    state.mild = !state.mild; save('mild', state.mild);
    m.classList.toggle('on', state.mild); m.setAttribute('aria-checked', state.mild);
    const box = $('#ing');
    box.innerHTML = ingredientHtml(r);
    box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
  };
  if (from?.kind === 'home') {
    const hero = $('.hero');
    hero.style.viewTransitionName = 'hero';
    setTimeout(() => (hero.style.viewTransitionName = ''), 700);
  }
}

/* ---------- Handleliste-skuffen ---------- */
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
  if (document.querySelector('.overlay')) return;
  const profiles = state.profiles.length ? state.profiles : [{ id: 'x', name: 'Familien', mild: false }];
  let pid = load('profile', profiles[0].id);
  if (!profiles.some((p) => p.id === pid)) pid = profiles[0].id;
  let checked = [], cands = [];
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="scrim"></div>
    <aside class="sheet shop" role="dialog" aria-modal="true" aria-label="Handleliste for ${esc(r.title)}">
      <header><div><p class="label">Handleliste</p><h2>${esc(r.title)}</h2></div>
        <button class="icon-btn" id="dx" aria-label="Lukk">${icons.close}</button></header>
      <div class="body">
        <p class="label dim">Hvem legger til?</p>
        <div class="who">${profiles.map((x) => `<button class="chip" data-p="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div>
        <p class="hint" id="hint"></p>
        <div id="rows"></div>
      </div>
      <footer><button class="btn solid big" id="dok"></button></footer>
    </aside>`;
  document.body.appendChild(ov);
  const rows = $('#rows', ov), ok = $('#dok', ov);
  const profile = () => profiles.find((x) => x.id === pid);

  const count = () => {
    const n = checked.filter(Boolean).length;
    ok.textContent = `Legg til ${n} ${n === 1 ? 'vare' : 'varer'}`;
    ok.disabled = !n;
  };
  const rebuild = (swap) => {
    const p = profile();
    cands = shopCandidates(r, p.mild);
    checked = cands.map((c) => !c.optional);
    ov.querySelectorAll('[data-p]').forEach((b) => b.classList.toggle('on', b.dataset.p === pid));
    $('#hint', ov).textContent = `Fjern hake på det dere allerede har.${p.mild ? ` Mild versjon er valgt for ${p.name}.` : ''}`;
    let last = null, html = '';
    cands.forEach((c, i) => {
      if (c.source !== last) { html += `<h4 class="label">${c.base ? icons.link : ''}${esc(c.source)}</h4>`; last = c.source; }
      html += `<button class="srow ${checked[i] ? 'on' : ''}" data-i="${i}" role="checkbox" aria-checked="${checked[i]}"><span class="check">${icons.check}</span>
        <span class="t">${c.qty ? `<b>${esc(c.qty)}</b> ` : ''}${esc(c.name)}${c.optional ? '<em class="tag">kan sløyfes</em>' : ''}</span></button>`;
    });
    rows.innerHTML = html;
    if (swap) { rows.classList.remove('swap'); void rows.offsetWidth; rows.classList.add('swap'); }
    count();
  };

  ov.onclick = (e) => {
    if (e.target.closest('#dx') || e.target.classList.contains('scrim')) return closeOverlay(ov);
    const who = e.target.closest('[data-p]');
    if (who) { if (who.dataset.p !== pid) { pid = who.dataset.p; save('profile', pid); rebuild(true); } return; }
    const row = e.target.closest('[data-i]');
    if (row) {
      const i = +row.dataset.i; checked[i] = !checked[i];
      row.classList.toggle('on', checked[i]); row.setAttribute('aria-checked', checked[i]);
      return count();
    }
    if (e.target.closest('#dok')) {
      const by = profile().name;
      const picked = cands.filter((_, i) => checked[i]).map((c) => ({ label: c.qty && !/^etter smak$/.test(c.qty) ? `${c.qty} ${c.name}` : c.name, by }));
      addItems(picked); closeOverlay(ov);
      toast(`${picked.length} ${picked.length === 1 ? 'vare' : 'varer'} lagt i handlelisten`, 'cart');
    }
  };
  rebuild(false);
}

/* ---------- Steg for steg ---------- */
let timerHandle = null;
const stepOf = (r, n) => { const last = r.steps.length, done = n >= last; return { last, done, s: r.steps[Math.min(n, last - 1)] }; };

function stageHtml(r, n) {
  const { done, s } = stepOf(r, n);
  if (done) return r.image ? `<div class="plate-photo"><img src="${esc(r.image)}" alt="" data-emoji="${emojiOf(r)}" style="object-position:${esc(r.imagePos || '50% 50%')}"></div>` : dish(emojiOf(r), 'a-serve');
  return s.image
    ? `<div class="medal photo"><img src="${esc(s.image)}" alt=""></div>`
    : `<div class="medal a-${esc(s.anim || 'none')}"><span>${esc(s.icon || r.emoji || '🍽️')}</span></div>`;
}
function sayHtml(r, n, dir) {
  const { done, s } = stepOf(r, n);
  return `<div class="say-in ${dir}">
    <p class="stepno label"><span>${done ? esc(r.title) : `Steg ${n + 1}`}</span><i></i></p>
    <p class="t ${done ? 'fin' : ''}" data-xl="${!done && s.text.length <= 70 ? 1 : 0}">${esc(done ? 'Ferdig! Server og nyt.' : s.text)}</p>
    ${!done && s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
  </div>`;
}
/** Krymper instruksjonen trinnvis hvis den ikke får plass – teksten skal aldri kuttes. */
function fit() {
  const say = $('.say'), t = say?.querySelector('.t');
  if (!t) return;
  const sizes = ['s1', 's2', 's3'];
  t.classList.remove(...sizes);
  t.classList.toggle('xl', t.dataset.xl === '1');
  for (const c of ['', ...sizes]) {
    if (say.scrollHeight <= say.clientHeight + 1) break;
    t.classList.remove('xl', ...sizes);
    if (c) t.classList.add(c);
  }
}
addEventListener('resize', fit);
document.fonts?.ready.then(fit);

/** Fyller steg-skjermen med steg n. Brukes både første gang og når man blar. */
function paintStep(r, n, dir) {
  const { last, done, s } = stepOf(r, n);
  $app.querySelectorAll('.segs i').forEach((el, i) => { el.className = i < n ? 'done' : i === n ? 'cur' : ''; });
  $('.count').innerHTML = `<b>${Math.min(n + 1, last)}</b>av ${last}`;
  const stage = $('.cook-stage');
  stage.classList.toggle('fin', done);
  stage.innerHTML = stageHtml(r, n);
  $('.say').innerHTML = sayHtml(r, n, dir);
  fit();
  $('#prev').disabled = n === 0;
  const timer = $('#timer');
  timer.hidden = done || !s.timer;
  timer.className = 'btn ghost big timer';
  timer.innerHTML = `${icons.timer}<span>${done || !s.timer ? '' : esc(s.timer) + ' min'}</span>`;
  $('#next').innerHTML = done ? `<span>Til forsiden</span>${icons.check}` : `<span>${n === last - 1 ? 'Ferdig rett' : 'Neste'}</span>${icons.next}`;
}

function viewCook(id, n) {
  const r = state.recipes.get(id);
  keepAwake(true);
  state.last = id;
  $app.innerHTML = `
  <div class="cook">
    <header class="cook-top">
      <a class="pill quiet" id="quit" href="#/r/${esc(id)}">${icons.close}<span>Avslutt</span></a>
      <div class="prog"><p class="label dim">${esc(r.title)}</p><div class="segs" aria-hidden="true">${r.steps.map(() => '<i><b></b></i>').join('')}</div></div>
      <p class="count" aria-live="polite"></p>
    </header>
    <main class="cook-main" id="swipe">
      <div class="cook-stage" aria-hidden="true"></div>
      <div class="say"></div>
    </main>
    <nav class="cook-nav" aria-label="Steg">
      <button class="btn ghost big" id="prev">${icons.back}<span>Forrige</span></button>
      <button class="btn ghost big" id="replay">${icons.replay}<span>Igjen</span></button>
      <button class="btn ghost big timer" id="timer"></button>
      <button class="btn solid big next" id="next"></button>
    </nav>
  </div>`;
  paintStep(r, n, 'again');
  // Knappene leser alltid steget fra adressen, så de virker likt etter at man har bladd.
  const here = () => { const c = parse(); return { n: Math.min(c.n, r.steps.length), ...stepOf(r, Math.min(c.n, r.steps.length)) }; };
  const go = (k) => (location.hash = `#/r/${id}/s/${k}`);
  $('#prev').onclick = () => { const c = here(); if (c.n > 0) go(c.n - 1); };
  $('#next').onclick = () => { const c = here(); c.done ? (location.hash = '#/') : go(c.n + 1); };
  $('#replay').onclick = () => {
    const el = $('.cook-stage').firstElementChild; if (!el) return;
    const c = el.className; el.className = c.replace(/\ba-\S+/, ''); void el.offsetWidth; el.className = c;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  };
  $('#timer').onclick = () => { const c = here(); if (!c.done && c.s.timer) startTimer($('#timer'), c.s.timer); };
  // Sveip
  const w = $('#swipe'); let x0 = null, y0 = 0;
  w.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  w.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dy) > Math.abs(dx)) return;
    const c = here();
    if (dx < -60) { if (!c.done) go(c.n + 1); } else if (dx > 60 && c.n > 0) go(c.n - 1);
  }, { passive: true });
}

function startTimer(btn, min) {
  clearInterval(timerHandle);
  let left = min * 60;
  const label = btn.querySelector('span');
  btn.classList.remove('done'); btn.classList.add('run');
  const tick = () => {
    const m = String(Math.floor(left / 60)).padStart(2, '0'), s = String(left % 60).padStart(2, '0');
    label.textContent = `${m}:${s}`;
    if (left-- <= 0) {
      clearInterval(timerHandle);
      btn.classList.remove('run'); btn.classList.add('done');
      label.textContent = 'Ferdig!'; toast('Tiden er ute!', 'bell');
      try { navigator.vibrate?.([300, 150, 300]); } catch {}
    }
  };
  tick(); timerHandle = setInterval(tick, 1000);
}

/* ---------- Ruting ---------- */
function parse() {
  const h = location.hash.replace(/^#\/?/, '').split('/');
  if (h[0] === 'r' && h[1] && h[2] === 's') return { kind: 'cook', id: h[1], n: Math.max(0, parseInt(h[3], 10) || 0) };
  if (h[0] === 'r' && h[1]) return { kind: 'recipe', id: h[1] };
  return { kind: 'home' };
}
const depth = { home: 0, recipe: 1, cook: 2 };
const calm = matchMedia('(prefers-reduced-motion: reduce)');
let cur = null, from = null;

function draw() {
  if (cur.kind === 'home') viewHome(from);
  else if (cur.kind === 'recipe') viewRecipe(cur.id, from);
  else viewCook(cur.id, Math.min(cur.n, state.recipes.get(cur.id).steps.length));
}

function route() {
  clearInterval(timerHandle);
  const next = parse();
  if (next.kind !== 'home' && !state.recipes.has(next.id)) { location.replace('#/'); return; }
  closeOverlay(document.querySelector('.overlay'));
  const prev = cur;
  // Blar man mellom steg i samme rett, byttes bare innholdet – rammen står stille.
  if (prev?.kind === 'cook' && next.kind === 'cook' && prev.id === next.id && $('.cook')) {
    const r = state.recipes.get(next.id), n = Math.min(next.n, r.steps.length);
    cur = next;
    paintStep(r, n, n >= Math.min(prev.n, r.steps.length) ? 'fwd' : 'back');
    return;
  }
  if (prev?.kind === 'home') { const row = $('#row'); if (row) state.homeScroll = { x: row.scrollLeft, y: row.scrollTop }; }
  if (prev?.kind === 'recipe' && next.kind === 'home') { const hero = $('.hero'); if (hero) hero.style.viewTransitionName = 'hero'; }
  from = prev; cur = next;
  if (!prev || !document.startViewTransition || calm.matches) { draw(); return; }
  document.documentElement.dataset.nav = depth[next.kind] < depth[prev.kind] ? 'back' : 'fwd';
  // Sikkerhetsnett: tegner nettleseren ingen bilder akkurat nå (skjult fane, skjerm som våkner),
  // blir overgangen hengende. Da bytter vi skjerm uten animasjon i stedet for å stå fast.
  let done = false;
  const once = () => { if (!done) { done = true; draw(); } };
  const t = document.startViewTransition(once);
  t.ready.catch(() => {}); t.finished.catch(() => {});
  setTimeout(once, 350);
}
addEventListener('hashchange', route);

// Tastatur: piltaster blar i steg-modus, Escape lukker skuffen eller går ett nivå opp.
addEventListener('keydown', (e) => {
  if (e.target.matches?.('input,textarea')) return;
  const ov = document.querySelector('.overlay');
  if (e.key === 'Escape') {
    if (ov) return closeOverlay(ov);
    if (cur?.kind === 'cook') location.hash = `#/r/${cur.id}`;
    else if (cur?.kind === 'recipe') location.hash = '#/';
    return;
  }
  if (ov || cur?.kind !== 'cook') return;
  if (e.key === 'ArrowRight') $('#next')?.click();
  if (e.key === 'ArrowLeft') $('#prev')?.click();
});

/* ---------- Oppstart ---------- */
async function init() {
  $app.innerHTML = `<div class="state"><h1 class="wordmark"><small>Familie</small>Kokeboka</h1><i class="loader"><b></b></i><p>Henter oppskriftene …</p></div>`;
  try { await loadAll(); if (!state.list.length) throw new Error('tom'); }
  catch {
    $app.innerHTML = `<div class="state">${icon('cloche', 'big')}<h2>Fikk ikke hentet oppskriftene</h2><p>Sjekk nettet og prøv igjen.</p><button class="pill" id="retry">Prøv igjen</button></div>`;
    $('#retry').onclick = init;
    return;
  }
  route();
}

init();
if ('serviceWorker' in navigator) {
  // Ny versjon av appen tok over: last siden på nytt én gang så man ser siste versjon med en gang
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
