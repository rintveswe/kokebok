// Retning A – «Magasinet»: redaksjonell stil. Papir, blekk og én signalfarge.
import { state, start, save, esc, img, cats, filtered, ingredients, hasSpicy, pairs, uses, timeFacts, number, icons, oldApp, shopUrl } from '../core.js';

const meta = (r) => { const t = timeFacts(r); return [r.category, t.active, t.total && `${t.total} totalt`].filter(Boolean).join(' · '); };
const status = (r) => `<i class="st ${r.status === 'testet' ? 'ok' : ''}" title="${r.status === 'testet' ? 'Testet' : 'Kladd'}"></i>`;

function home(app) {
  const feat = state.list.find((r) => r.image) || state.list[new Date().getDate() % state.list.length];
  const t = timeFacts(feat);
  app.innerHTML = `
  <div class="home">
    <header class="mast">
      <h1 class="wordmark">Familie<i>kokeboka</i></h1>
      <p class="mast-meta"><b>${state.list.length} oppskrifter</b><span>Laget hjemme, prøvd på familien</span></p>
      <label class="search">${icons.search}<input id="q" type="search" placeholder="Søk i kokeboka" value="${esc(state.q)}" autocomplete="off"></label>
      <a class="tool" href="${shopUrl}">${icons.cart}<span>Handleliste</span></a>
    </header>
    <nav class="sections" id="cats" aria-label="Kategorier"></nav>
    <main class="spread">
      <a class="feature" href="#/r/${feat.id}" data-r="${feat.id}">
        <figure data-vt>${feat.image ? `<img src="${img(feat)}" alt="" style="object-position:${esc(feat.imagePos || '50% 50%')}">` : `<span class="initial">${esc(feat.title[0])}</span>`}</figure>
        <div class="coverline">
          <p class="kicker"><span>På forsiden</span>${esc(feat.category)}</p>
          <h2>${esc(feat.title)}</h2>
          <p class="facts">${[t.active && `${t.active} aktiv`, t.total && `${t.total} totalt`, `${feat.steps.length} steg`].filter(Boolean).map(esc).join('<i></i>')}</p>
        </div>
      </a>
      <section class="index">
        <header><h2 id="heading"></h2><p class="legend"><i class="st ok"></i>Testet <i class="st"></i>Kladd</p></header>
        <ol id="list"></ol>
      </section>
    </main>
  </div>`;
  const paint = () => {
    app.querySelector('#cats').innerHTML = cats().map((c) =>
      `<button class="${c.name === state.cat ? 'on' : ''}" data-cat="${esc(c.name)}">${esc(c.name)}<sup>${c.n}</sup></button>`).join('');
    const items = filtered();
    app.querySelector('#heading').innerHTML = state.q.trim() ? `Treff på <i>«${esc(state.q.trim())}»</i>` : state.cat === 'Alle' ? 'Innhold' : esc(state.cat);
    // Nummeret er rettens faste «sidetall» – det samme i et filtrert utvalg og på rettsiden.
    app.querySelector('#list').innerHTML = items.map((r, i) => `
      <li style="--i:${Math.min(i, 16)}"><a href="#/r/${r.id}" data-r="${r.id}">
        <span class="no">${number(r)}</span>
        <span class="t"><b>${esc(r.title)}</b><small>${status(r)}${esc(meta(r))}</small></span>
        <span class="th" data-vt>${r.image ? `<img src="${img(r)}" alt="" style="object-position:${esc(r.imagePos || '50% 50%')}">` : `<span>${r.emoji || ''}</span>`}</span>
      </a></li>`).join('') || `<li class="empty"><p>Ingen oppskrifter passer til søket.</p><button id="reset">Vis alle oppskrifter</button></li>`;
    app.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { state.cat = b.dataset.cat; paint(); app.querySelector('#list').scrollTop = 0; }));
    const reset = app.querySelector('#reset');
    if (reset) reset.onclick = () => { state.q = ''; state.cat = 'Alle'; app.querySelector('#q').value = ''; paint(); };
  };
  paint();
  app.querySelector('#q').oninput = (e) => { state.q = e.target.value; paint(); };
}

const link = (x) => (x.id ? `<a class="ref go" href="#/r/${x.id}">${esc(x.title)} ${icons.next}</a>` : `<span class="ref">${esc(x.title)}</span>`);

function recipe(app, r) {
  const t = timeFacts(r), p = pairs(r), u = uses(r), no = number(r);
  const ing = () => ingredients(r).map((g) => `
    ${g.name ? `<h4>${esc(g.name)}</h4>` : ''}
    <ul>${g.items.map((i) => `<li class="${i.skip ? 'skip' : ''}">
      <span class="q">${i.qty ? esc(i.qty) : '<em class="missing">mengde mangler</em>'}</span>
      <span class="n">${esc(i.name)}${i.optional ? '<em class="tag">kan sløyfes</em>' : ''}${i.hot ? '<em class="tag hot">sterk</em>' : ''}${i.notes.map((n) => `<small>${esc(n)}</small>`).join('')}</span>
    </li>`).join('')}</ul>`).join('');
  app.innerHTML = `
  <article class="recipe">
    <figure class="plate ${r.image ? '' : 'none'}" data-vt style="view-transition-name:hero">
      ${r.image ? `<img src="${img(r)}" alt="">` : `<span class="initial">${esc(r.title[0])}</span><span class="stamp">${r.emoji || ''}</span>`}
    </figure>
    <a class="back" href="#/" aria-label="Tilbake til innhold">${icons.back}<span>Innhold</span></a>
    <div class="text">
      <div class="scroll">
        <p class="kicker"><span>Nr. ${no}</span>${esc(r.category)}<em>${r.status === 'testet' ? 'Testet' : 'Kladd – ikke prøvd ennå'}</em></p>
        <h1>${esc(r.title)}</h1>
        ${r.intro ? `<p class="standfirst">${esc(r.intro)}</p>` : ''}
        <dl class="specs">
          <div><dt>Porsjoner</dt><dd>${esc(r.servings)}</dd></div>
          ${t.active ? `<div><dt>Aktiv tid</dt><dd>${t.active}</dd></div>` : ''}
          ${t.total ? `<div><dt>Totalt</dt><dd>${t.total}</dd></div>` : ''}
          <div><dt>Steg</dt><dd>${r.steps.length}</dd></div>
        </dl>
        <div class="cols">
          <section class="ing">
            <header><h2>Ingredienser</h2>
              ${hasSpicy(r) ? `<button class="mild ${state.mild ? 'on' : ''}" id="mild" role="switch" aria-checked="${state.mild}"><i></i><span>Mild versjon<small>Iselin og Rakel</small></span></button>` : ''}</header>
            <div id="ing">${ing()}</div>
          </section>
          <section class="side">
            ${r.headsUp ? `<aside class="headsup"><h3>Husk først</h3><p>${esc(r.headsUp)}</p></aside>` : ''}
            ${r.tips?.length ? `<h2>Tips</h2><ol class="tips">${r.tips.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
            ${u.length ? `<h2>Grunnoppskrifter</h2><div class="refs">${u.map(link).join('')}</div>` : ''}
            ${p.length ? `<h2>Passer til</h2><dl class="pairs">${p.map((x) => `<div><dt>${x.label}</dt><dd>${x.items.map(link).join('')}</dd></div>`).join('')}</dl>` : ''}
            ${r.source ? `<p class="source">Kilde: ${esc(r.source.type)}${r.source.url ? ' – ' + esc(r.source.url) : ''}</p>` : ''}
          </section>
        </div>
      </div>
      <footer class="actions">
        <a class="btn ghost" href="${oldApp(`#/r/${r.id}`)}">${icons.cart}<span>Handleliste</span></a>
        <a class="btn solid" href="${oldApp(`#/r/${r.id}/s/0`)}"><span>Start matlagingen</span><small>${r.steps.length} steg</small>${icons.next}</a>
      </footer>
    </div>
  </article>`;
  const m = app.querySelector('#mild');
  if (m) m.onclick = () => { state.mild = !state.mild; save('mild', state.mild); m.classList.toggle('on', state.mild); m.setAttribute('aria-checked', state.mild); app.querySelector('#ing').innerHTML = ing(); };
}

start({ home, recipe });
