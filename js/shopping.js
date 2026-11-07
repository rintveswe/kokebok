// Delt handlelistelagring. Brukes av både kokeboka og handlelisteappen (samme opprinnelse).
// Senere kan load/save byttes ut med Firestore uten å endre resten av koden.
const KEY = 'kb_shopping_v1';

export function loadItems() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
export function saveItems(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Legg til varer. Samme vare som ikke er krysset av slås sammen (mengder settes sammen). */
export function addItems(list) {
  const items = loadItems();
  for (const n of list) {
    const key = n.name.trim().toLowerCase();
    const ex = items.find((i) => !i.done && i.name.trim().toLowerCase() === key);
    if (ex) {
      if (n.qty) ex.qty = ex.qty ? `${ex.qty} + ${n.qty}` : n.qty;
      if (n.recipe && !ex.recipes.includes(n.recipe)) ex.recipes.push(n.recipe);
    } else {
      items.push({ id: uid(), name: n.name.trim(), qty: n.qty || '', recipes: n.recipe ? [n.recipe] : [], by: n.by || '', done: false, t: Date.now() });
    }
  }
  saveItems(items);
  return items;
}
export function toggle(id) { const a = loadItems(); const i = a.find((x) => x.id === id); if (i) i.done = !i.done; saveItems(a); return a; }
export function remove(id) { const a = loadItems().filter((x) => x.id !== id); saveItems(a); return a; }
export function clearDone() { const a = loadItems().filter((x) => !x.done); saveItems(a); return a; }
export function clearAll() { saveItems([]); return []; }
