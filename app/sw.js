// Offline-cache: nettet først (alltid ferskt når man er på nett), lagret kopi når nettet er borte.
// Bump CACHE-navnet når filer under SHELL endres, så gamle kopier slettes.
const CACHE = 'kokebok-v8';
const SHELL = [
  './', './index.html', './css/style.css', './js/app.js', './js/shopping.js', './js/firebase-config.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/cart.svg', './data/index.json', './data/profiles.json',
  './handleliste/index.html', './handleliste/app.js', './handleliste/manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' = hopp over nettleserens HTTP-cache, hent alltid ferske filer
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      // no-cache = spør serveren om filen er endret, selv om GitHub Pages sier "gjenbruk i 10 min"
      const net = fetch(e.request, { cache: 'no-cache' }).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      });
      if (!cached) return net;
      // Har vi en lagret kopi: vent maks 4 sek på nettet, ellers bruk kopien (treg eller ingen forbindelse)
      return Promise.race([net, new Promise((_, rej) => setTimeout(rej, 4000))]).catch(() => cached);
    })
  );
});
