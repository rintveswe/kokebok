// Retning B – «Kveldsservering»: mørk restaurantstil. Menykort, messing og levende lys.
import { state, start, save, esc, img, cats, filtered, ingredients, hasSpicy, pairs, uses, timeFacts, number, icons, oldApp, shopUrl } from '../core.js';

const media = (r) => (r.image
  ? `<img src="${img(r)}" alt="" style="object-position:${esc(r.imagePos || '50% 50%')}">`
  : `<span class="dish"><span>${r.emoji || ''}</span></span>`);

function home(app) {
  app.innerHTML = `
  <div class="home">
    <aside class="rail">
      <h1 class="wordmark"><small>Familie</small>Kokeboka</h1>
      <p class="orn"><i></i></p>
      <nav id="cats" aria-label="Kategorier"></nav>
      <p class="motto">Åpent hver dag.<br>Bordet er alltid ledig.</p>
    </aside>
    <main class="stage">
      <header>
        <div><p class="label" id="label"></p><h2 id="heading"></h2></div>
        <label class="search">${icons.search}<input id="q" type="search" placeholder="Søk etter en rett" value="${esc(state.q)}" autocomplete="off"></label>
        <a class="round" href="${shopUrl}" aria-label="Handleliste">${icons.cart}<span>Handleliste</span></a>
      </header>
      <div class="row" id="row"></div>
      <footer><span id="count"></span><i class="bar"><b id="bar"></b></i><span>Sveip for flere</span></footer>
    </main>
  </div>`;
  const row = app.querySelector('#row'), bar = app.querySelector('#bar');
  const progress = () => { bar.style.transform = `scaleX(${Math.min(1, (row.scrollLeft + row.clientWidth) / row.scrollWidth)})`; };
  let tick = 0;
  row.onscroll = () => { if (!tick) tick = requestAnimationFrame(() => { tick = 0; progress(); }); };
  const paint = () => {
    app.querySelector('#cats').innerHTML = cats().map((c) =>
      `<button class="${c.name === state.cat ? 'on' : ''}" data-cat="${esc(c.name)}"><span>${esc(c.name === 'Alle' ? 'Hele menyen' : c.name)}</span><em>${c.n}</em></button>`).join('');
    // Retter med bilde først – bildene skal lede an. Nummeret (Nº) følger fortsatt alfabetet.
    const items = filtered().sort((a, b) => !!b.image - !!a.image), q = state.q.trim();
    app.querySelector('#label').textContent = q ? 'Søk' : 'Menyen';
    app.querySelector('#heading').textContent = q ? `«${q}»` : state.cat === 'Alle' ? 'Alle retter' : state.cat;
    app.querySelector('#count').textContent = `${items.length} ${items.length === 1 ? 'rett' : 'retter'}`;
    row.innerHTML = items.map((r, i) => {
      const t = timeFacts(r);
      return `<a class="card ${r.image ? 'photo' : ''}" href="#/r/${r.id}" data-r="${r.id}" style="--i:${Math.min(i, 8)}">
        <div class="media" data-vt>${media(r)}</div>
        <span class="st ${r.status === 'testet' ? 'ok' : ''}">${r.status === 'testet' ? 'Testet' : 'Kladd'}</span>
        <div class="cap"><p class="no">Nº ${number(r)}<span>${esc(r.category)}</span></p><h3>${esc(r.title)}</h3>
          <p class="meta">${icons.clock}${[t.active, t.total && `${t.total} totalt`].filter(Boolean).join(' · ')}</p></div>
      </a>`;
    }).join('') || `<div class="empty"><p>Ingen retter passer til søket.</p><button id="reset">Vis hele menyen</button></div>`;
    row.scrollLeft = 0; progress();
    app.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { state.cat = b.dataset.cat; paint(); }));
    const reset = app.querySelector('#reset');
    if (reset) reset.onclick = () => { state.q = ''; state.cat = 'Alle'; app.querySelector('#q').value = ''; paint(); };
  };
  paint();
  app.querySelector('#q').oninput = (e) => { state.q = e.target.value; paint(); };
}

const link = (x) => (x.id ? `<a class="ref go" href="#/r/${x.id}">${esc(x.title)}${icons.next}</a>` : `<span class="ref">${esc(x.title)}</span>`);

function recipe(app, r) {
  const t = timeFacts(r), p = pairs(r), u = uses(r);
  const ing = () => ingredients(r).map((g) => `
    ${g.name ? `<h4><span>${esc(g.name)}</span></h4>` : ''}
    <ul>${g.items.map((i) => `<li class="${i.skip ? 'skip' : ''}">
      <p><span class="n">${esc(i.name)}</span><i></i><span class="q">${i.qty ? esc(i.qty) : '<em class="missing">mengde mangler</em>'}</span></p>
      ${i.optional || i.hot || i.notes.length ? `<small>${i.optional ? '<em class="tag">kan sløyfes</em>' : ''}${i.hot ? `<em class="tag hot">${icons.chili}sterk</em>` : ''}${i.notes.map(esc).join(' · ')}</small>` : ''}
    </li>`).join('')}</ul>`).join('');
  app.innerHTML = `
  <article class="recipe">
    <figure class="hero ${r.image ? 'photo' : ''}" data-vt style="view-transition-name:hero">${media(r)}</figure>
    <dl class="facts">
      <div><dd>${esc(r.servings)}</dd><dt>Porsjoner</dt></div>
      ${t.active ? `<div><dd>${t.active}</dd><dt>Aktiv tid</dt></div>` : ''}
      ${t.total ? `<div><dd>${t.total}</dd><dt>Totalt</dt></div>` : ''}
      <div><dd>${r.steps.length}</dd><dt>Steg</dt></div>
    </dl>
    <a class="back" href="#/" aria-label="Tilbake til menyen">${icons.back}</a>
    <div class="text">
      <div class="scroll">
        <p class="kicker"><i></i><span>Nº ${number(r)} · ${esc(r.category)}</span><i></i><em class="${r.status === 'testet' ? 'ok' : ''}">${r.status === 'testet' ? 'Testet' : 'Kladd'}</em></p>
        <h1>${esc(r.title)}</h1>
        ${r.intro ? `<p class="intro">${esc(r.intro)}</p>` : ''}
        ${r.headsUp ? `<aside class="headsup">${icons.clock}<div><h3>Før du begynner</h3><p>${esc(r.headsUp)}</p></div></aside>` : ''}
        <section class="ing">
          <header><h2>Ingredienser</h2>
            ${hasSpicy(r) ? `<button class="mild ${state.mild ? 'on' : ''}" id="mild" role="switch" aria-checked="${state.mild}"><span>Mild versjon<small>Iselin og Rakel</small></span><i></i></button>` : ''}</header>
          <div id="ing">${ing()}</div>
        </section>
        ${r.tips?.length ? `<section><h2>Kjøkkenets tips</h2><ol class="tips">${r.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` : ''}
        ${u.length ? `<section><h2>Grunnoppskrifter</h2><div class="refs">${u.map(link).join('')}</div></section>` : ''}
        ${p.length ? `<section><h2>Passer til</h2><dl class="pairs">${p.map((x) => `<div><dt>${x.label}</dt><dd>${x.items.map(link).join('')}</dd></div>`).join('')}</dl></section>` : ''}
        ${r.source ? `<p class="source">Kilde: ${esc(r.source.type)}${r.source.url ? ' – ' + esc(r.source.url) : ''}</p>` : ''}
      </div>
      <footer class="actions">
        <a class="btn ghost" href="${oldApp(`#/r/${r.id}`)}">${icons.cart}<span>Handleliste</span></a>
        <a class="btn solid" href="${oldApp(`#/r/${r.id}/s/0`)}"><span>Start matlagingen</span>${icons.next}</a>
      </footer>
    </div>
  </article>`;
  const m = app.querySelector('#mild');
  if (m) m.onclick = () => { state.mild = !state.mild; save('mild', state.mild); m.classList.toggle('on', state.mild); m.setAttribute('aria-checked', state.mild); app.querySelector('#ing').innerHTML = ing(); };
}

start({ home, recipe });
