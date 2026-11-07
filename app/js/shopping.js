// Handleliste delt med familie-appen.
// Samme datastruktur som familie-appen: dokumentet familie/data, feltet `shopping`,
// hver vare er { id: number, label: string, done: boolean, user: string }.
// Vi endrer BARE feltet `shopping` (transaksjon + update), aldri resten av dokumentet.
// Lokal kopi + kø gjør at det virker uten nett; køen sendes når nettet er tilbake.
import cfg from './firebase-config.js';

const LIST = 'kb_shop_v2', PEND = 'kb_shop_pending_v2';
const SDK = 'https://www.gstatic.com/firebasejs/10.12.0/';
const listeners = new Set();
let status = 'local'; // local | ok | offline
let fb = null, flushing = false;

const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const emit = () => listeners.forEach((f) => f());

export const onChange = (fn) => listeners.add(fn);
export const getStatus = () => status;
export const loadItems = () => jget(LIST, []);

function applyOp(list, op) {
  switch (op.type) {
    case 'add': {
      const out = [...list];
      for (const it of op.items) {
        const k = it.label.trim().toLowerCase();
        if (!out.some((x) => !x.done && String(x.label).trim().toLowerCase() === k)) {
          out.push({ id: it.id, label: it.label.trim(), done: false, user: it.user });
        }
      }
      return out;
    }
    case 'set': return list.map((x) => (x.id === op.id ? { ...x, done: op.done } : x));
    case 'remove': return list.filter((x) => x.id !== op.id);
    case 'clearDone': return list.filter((x) => !x.done);
    case 'clearAll': return [];
    default: return list;
  }
}

function run(op) {
  jset(LIST, applyOp(loadItems(), op));
  jset(PEND, [...jget(PEND, []), op]);
  emit();
  flush();
  return loadItems();
}

async function flush() {
  if (!fb || flushing) return;
  flushing = true;
  try {
    let pend = jget(PEND, []);
    while (pend.length) {
      const op = pend[0];
      await fb.runTransaction(fb.db, async (tx) => {
        const snap = await tx.get(fb.ref);
        if (!snap.exists()) throw new Error('familie/data finnes ikke');
        tx.update(fb.ref, { shopping: applyOp(snap.data().shopping || [], op) });
      });
      pend = jget(PEND, []).slice(1); jset(PEND, pend);
    }
    if (status !== 'ok') { status = 'ok'; emit(); }
  } catch (e) {
    console.warn('Synk feilet, prøver igjen senere', e);
    status = 'offline'; emit();
  } finally { flushing = false; }
}

async function init() {
  try {
    const [{ initializeApp }, fs] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js')]);
    const db = fs.getFirestore(initializeApp(cfg));
    fb = { db, ref: fs.doc(db, 'familie', 'data'), runTransaction: fs.runTransaction };
    fs.onSnapshot(fb.ref, (snap) => {
      if (!snap.exists()) return;
      const merged = jget(PEND, []).reduce(applyOp, snap.data().shopping || []);
      jset(LIST, merged);
      status = 'ok'; emit();
      if (jget(PEND, []).length) flush();
    }, () => { status = 'offline'; emit(); });
    window.addEventListener('online', flush);
    flush();
  } catch (e) { console.warn('Firebase kunne ikke lastes', e); status = 'offline'; emit(); }
}
window.addEventListener('storage', (e) => { if (e.key === LIST) emit(); });
init();

/* ---- API ---- */
/** list: [{ label, by }] – by = profilnavn (Rino, Iselin, Fia, Rakel, Hugo) */
export function addItems(list) {
  const t = Date.now();
  return run({ type: 'add', items: list.map((l, i) => ({ id: t + i, label: l.label, user: l.by || 'Rino' })) });
}
export function toggle(id) { const x = loadItems().find((i) => i.id === id); return x ? run({ type: 'set', id, done: !x.done }) : loadItems(); }
export function remove(id) { return run({ type: 'remove', id }); }
export function clearDone() { return run({ type: 'clearDone' }); }
export function clearAll() { return run({ type: 'clearAll' }); }
