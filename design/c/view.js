// Retning C – «Lyst kjøkken»: lys skandinavisk stil. Luft, dempede farger og buen som fast form.
import { state, start, save, esc, img, cats, filtered, ingredients, hasSpicy, pairs, uses, timeFacts, icons, oldApp, shopUrl } from '../core.js';

// Én dempet farge per kategori – brukes som bakgrunn i buen når retten mangler bilde.
const COLORS = { Mexicansk: '#E9B44C', 'Pizza og brød': '#E08D6D', Bakst: '#EAC9B0', 'Saus og tilbehør': '#B9C7A6', Pasta: '#F0D9A4', 'Fast food': '#E7A9A0', Asiatisk: '#A5BFD0', Dessert: '#F2C6C2', 'One pan': '#9DB8A8' };
const color = (c) => COLORS[c] || '#D9D2C5';
const arch = (r) => (r.image
  ? `<img src="${img(r)}" alt="" style="object-position:${esc(r.imagePos || '50% 50%')}">`
  : `<span class="plate"><span>${r.emoji || ''}</span></span>`);

function home(app) {
  app.innerHTML = `
  <div class="home">
    <header class="top">
      <div><p class="logo"><i></i>familiekokeboka</p><h1>Hva skal vi lage i dag?</h1></div>
      <label class="search">${icons.search}<input id="q" type="search" placeholder="Søk etter oppskrift" value="${esc(state.q)}" autocomplete="off"></label>
      <a class="pill" href="${shopUrl}">${icons.cart}<span>Handleliste</span></a>
    </header>
    <nav class="cats" id="cats" aria-label="Kategorier"></nav>
    <main class="grid" id="grid"></main>
  </div>`;
  const paint = () => {
    app.querySelector('#cats').innerHTML = cats().map((c) =>
      `<button class="${c.name === state.cat ? 'on' : ''}" data-cat="${esc(c.name)}">${c.name === 'Alle' ? '' : `<i style="background:${color(c.name)}"></i>`}${esc(c.name)}<em>${c.n}</em></button>`).join('');
    const items = filtered().sort((a, b) => !!b.image - !!a.image);
    const grid = app.querySelector('#grid');
    grid.innerHTML = items.map((r, i) => {
      const t = timeFacts(r);
      return `<a class="tile" href="#/r/${r.id}" data-r="${r.id}" style="--i:${Math.min(i, 12)}">
        <div class="arch" data-vt style="--c:${color(r.category)}">${arch(r)}</div>
        <h3>${esc(r.title)}</h3>
        <p>${t.active || ''}${r.status === 'testet' ? `<span class="ok">${icons.check}Testet</span>` : '<span>Kladd</span>'}</p>
      </a>`;
    }).join('') || `<div class="empty"><span class="plate"><span>🍽️</span></span><h2>Fant ingen oppskrifter</h2><p>Prøv et annet ord, eller se alt vi har.</p><button id="reset">Vis alle oppskrifter</button></div>`;
    grid.scrollTop = 0;
    app.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { state.cat = b.dataset.cat; paint(); }));
    const reset = app.querySelector('#reset');
    if (reset) reset.onclick = () => { state.q = ''; state.cat = 'Alle'; app.querySelector('#q').value = ''; paint(); };
  };
  paint();
  app.querySelector('#q').oninput = (e) => { state.q = e.target.value; paint(); };
}

const link = (x) => (x.id ? `<a class="chip go" href="#/r/${x.id}">${x.emoji ? `<b>${x.emoji}</b>` : ''}${esc(x.title)}${icons.next}</a>` : `<span class="chip">${esc(x.title)}</span>`);

function recipe(app, r) {
  const t = timeFacts(r), p = pairs(r), u = uses(r);
  const ing = () => ingredients(r).map((g) => `
    <div class="group">${g.name ? `<h4>${esc(g.name)}</h4>` : ''}
    <ul>${g.items.map((i) => `<li class="${i.skip ? 'skip' : ''}">
      <span class="q">${i.qty ? esc(i.qty) : '<em class="missing">mengde mangler</em>'}</span>
      <span class="n">${esc(i.name)}${i.optional ? '<em class="tag">kan sløyfes</em>' : ''}${i.hot ? `<em class="tag hot">${icons.chili}sterk</em>` : ''}${i.notes.map((n) => `<small>${esc(n)}</small>`).join('')}</span>
    </li>`).join('')}</ul></div>`).join('');
  app.innerHTML = `
  <article class="recipe" style="--c:${color(r.category)}">
    <aside class="panel">
      <a class="back" href="#/" aria-label="Tilbake til oversikten">${icons.back}</a>
      <div class="arch ${r.image ? '' : 'none'}" data-vt style="view-transition-name:hero">${arch(r)}</div>
      <dl class="facts">
        <div>${icons.people}<dd>${esc(r.servings)}</dd></div>
        ${t.active ? `<div>${icons.clock}<dd>${t.active}${t.total ? `<small>${t.total} totalt</small>` : ''}</dd></div>` : ''}
        <div>${icons.steps}<dd>${r.steps.length} steg</dd></div>
      </dl>
    </aside>
    <div class="text">
      <div class="scroll">
        <p class="chips"><span class="chip cat"><i></i>${esc(r.category)}</span><span class="chip ${r.status === 'testet' ? 'ok' : ''}">${r.status === 'testet' ? `${icons.check}Testet` : 'Kladd – ikke prøvd ennå'}</span></p>
        <h1>${esc(r.title)}</h1>
        ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ''}
        ${r.headsUp ? `<aside class="headsup">${icons.clock}<p><b>Husk først</b>${esc(r.headsUp)}</p></aside>` : ''}
        <section class="ing">
          <header><h2>Ingredienser</h2>
            ${hasSpicy(r) ? `<button class="mild ${state.mild ? 'on' : ''}" id="mild" role="switch" aria-checked="${state.mild}"><span>Mild versjon<small>for Iselin og Rakel</small></span><i></i></button>` : ''}</header>
          <div id="ing" class="groups">${ing()}</div>
        </section>
        ${r.tips?.length ? `<section><h2>Tips</h2><ul class="tips">${r.tips.map((x) => `<li>${icons.check}<span>${esc(x)}</span></li>`).join('')}</ul></section>` : ''}
        ${u.length ? `<section><h2>Grunnoppskrifter</h2><div class="chiprow">${u.map(link).join('')}</div></section>` : ''}
        ${p.length ? `<section><h2>Passer til</h2><dl class="pairs">${p.map((x) => `<div><dt>${x.label}</dt><dd class="chiprow">${x.items.map(link).join('')}</dd></div>`).join('')}</dl></section>` : ''}
        ${r.source ? `<p class="source">Kilde: ${esc(r.source.type)}${r.source.url ? ' – ' + esc(r.source.url) : ''}</p>` : ''}
      </div>
      <footer class="actions">
        <a class="btn ghost" href="${oldApp(`#/r/${r.id}`)}">${icons.cart}<span>Handleliste</span></a>
        <a class="btn solid" href="${oldApp(`#/r/${r.id}/s/0`)}"><i>${icons.play}</i><span>Start matlagingen</span></a>
      </footer>
    </div>
  </article>`;
  const m = app.querySelector('#mild');
  if (m) m.onclick = () => { state.mild = !state.mild; save('mild', state.mild); m.classList.toggle('on', state.mild); m.setAttribute('aria-checked', state.mild); app.querySelector('#ing').innerHTML = ing(); };
}

start({ home, recipe });
