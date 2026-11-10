// Felles logikk for de tre designretningene: data, ruting og hjelpere. Ingen visuell kode her.
// Samme data og samme regler som dagens app (js/app.js) – bare utseendet er forskjellig per retning.
const ROOT = new URL('../', import.meta.url); // app/

export const state = { recipes: new Map(), list: [], cat: 'Alle', q: '', mild: load('mild', false), last: null };

export function load(k, d) { try { const v = localStorage.getItem('kb_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }
export function save(k, v) { try { localStorage.setItem('kb_' + k, JSON.stringify(v)); } catch {} }
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const img = (r) => (r.image ? new URL(r.image, ROOT).href : null);
export const oldApp = (hash) => new URL('index.html', ROOT).href + hash;
export const shopUrl = new URL('handleliste/', ROOT).href;
export const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)} t${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
export const pad = (n) => String(n).padStart(2, '0');

async function loadAll() {
  const ids = await (await fetch(new URL('data/index.json', ROOT))).json();
  const list = await Promise.all(ids.map((id) => fetch(new URL(`data/recipes/${id}.json`, ROOT)).then((r) => r.json()).catch(() => null)));
  state.list = list.filter(Boolean);
  state.list.forEach((r) => state.recipes.set(r.id, r));
}

export function cats() {
  const m = new Map();
  state.list.forEach((r) => m.set(r.category, (m.get(r.category) || 0) + 1));
  return [{ name: 'Alle', n: state.list.length }, ...[...m].map(([name, n]) => ({ name, n }))];
}

export function filtered() {
  const q = state.q.trim().toLowerCase();
  return state.list
    .filter((r) => state.cat === 'Alle' || r.category === state.cat)
    .filter((r) => !q || r.title.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title, 'nb'));
}

/** Ingredienser gruppert, med mild versjon regnet ut (samme regler som dagens app). */
export function ingredients(r) {
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
/** Løpenummer i alfabetisk innholdsliste (01, 02 …) – likt på forside og rettside. */
export const number = (r) => pad([...state.list].sort((a, b) => a.title.localeCompare(b.title, 'nb')).indexOf(r) + 1);
export const hasSpicy = (r) => r.ingredients.some((i) => i.spicy);

const ref = (s) => { const r = state.recipes.get(s); return r ? { id: r.id, title: r.title, emoji: r.emoji } : { title: s }; };
export function pairs(r) {
  const p = r.pairs || {};
  return [['drink', 'Drikke'], ['starter', 'Forrett'], ['side', 'Tilbehør'], ['dessert', 'Dessert']]
    .filter(([k]) => p[k]?.length).map(([k, label]) => ({ label, items: p[k].map(ref) }));
}
export const uses = (r) => (r.uses || []).map(ref);

export function timeFacts(r) {
  const t = r.time || {};
  return { active: t.active ? fmt(t.active) : null, total: t.total && t.total > (t.active || 0) ? fmt(t.total) : null };
}

/* Ikoner: enkle streker, arver tekstfarge. */
const ic = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icons = {
  back: ic('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  next: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  search: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
  cart: ic('<path d="M3 4h2.5l2.2 10.5h10.2L20 7H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>'),
  clock: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  people: ic('<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.6-3.2 2.7-5 5.5-5s4.9 1.8 5.5 5"/><path d="M16 5.8a3 3 0 010 5.4M17.5 14.3c1.6.7 2.6 2.3 3 4.7"/>'),
  steps: ic('<path d="M5 6h14M5 12h14M5 18h9"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  chili: ic('<path d="M15 6c2 .5 3.5 2 3.5 4.5 0 5-5 9-13 9 5-2 6.5-5 7-9 .3-2.5 1-4 2.5-4.5z"/><path d="M15 6c0-1.5.8-2.5 2-3"/>'),
  play: ic('<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>'),
};

/* Ruting med myk overgang (View Transitions der nettleseren støtter det). */
export function start({ home, recipe }) {
  const app = document.getElementById('app');
  let first = true;
  const draw = () => {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    const r = h[0] === 'r' ? state.recipes.get(h[1]) : null;
    if (r) { state.last = r.id; recipe(app, r); }
    else {
      home(app);
      // På vei tilbake: bildet «lander» i kortet det kom fra
      const m = state.last && app.querySelector(`a[data-r="${state.last}"] [data-vt]`);
      if (m) { m.style.viewTransitionName = 'hero'; m.scrollIntoView({ block: 'nearest', inline: 'nearest' }); setTimeout(() => (m.style.viewTransitionName = ''), 700); }
    }
  };
  const render = () => {
    if (first || !document.startViewTransition) { first = false; draw(); return; }
    // Sikkerhetsnett: tegner nettleseren ingen bilder akkurat nå (skjult fane, skjerm som våkner),
    // blir overgangen hengende. Da bytter vi skjerm uten animasjon i stedet for å stå fast.
    let done = false;
    const once = () => { if (!done) { done = true; draw(); } };
    const t = document.startViewTransition(once);
    t.ready.catch(() => {}); t.finished.catch(() => {});
    setTimeout(once, 350);
  };
  app.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-r]');
    const m = a && a.querySelector('[data-vt]');
    if (m) m.style.viewTransitionName = 'hero';
  });
  addEventListener('hashchange', render);
  app.innerHTML = '<p class="loading">Henter oppskriftene …</p>';
  loadAll().then(render).catch(() => { app.innerHTML = '<p class="loading">Fikk ikke hentet oppskriftene. Sjekk nettet og prøv igjen.</p>'; });
}
