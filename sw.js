// Service worker: app-shell cache zodat de app direct opent, ook offline.
// AI-analyses vereisen uiteraard wel netwerk.

const CACHE = 'plantgezondheid-v6';

const SHELL = [
  './',
  './index.html',
  './css/theme.css',
  './js/app.js',
  './js/auth.js',
  './js/db.js',
  './js/camera.js',
  './js/azure.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './vendor/ionic/ionic.esm.js',
  './vendor/ionic/css/ionic.bundle.css',
  './vendor/ionic/css/palettes/dark.system.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // Azure-calls e.d. nooit cachen

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Navigatie: network-first zodat updates direct binnenkomen, offline fallback naar cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Overige eigen assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
