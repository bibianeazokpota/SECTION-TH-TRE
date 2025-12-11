const CACHE = "ucaotheatre-presence-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./offline.html" // page fallback hors-ligne
];

// INSTALLATION DU SERVICE WORKER
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATION ET NETTOYAGE DES ANCIENS CACHES
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH : strategy network-first for app shell, cache-first for other assets
self.addEventListener('fetch', event => {
  const req = event.request;
  // network-first for navigation and core files (HTML/JS/CSS)
  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const shouldNetworkFirst = isSameOrigin && (
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  );

  if (shouldNetworkFirst) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        try {
          const response = await fetch(req);
          if (response && response.status === 200) cache.put(req, response.clone());
          return response;
        } catch (err) {
          const cached = await cache.match(req) || await caches.match('./offline.html');
          return cached;
        }
      })
    );
    return;
  }

  // For other requests, try cache first then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      // optionally cache fetched asset
      return resp;
    })).catch(() => caches.match('./offline.html'))
  );
});
