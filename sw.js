const CACHE_NAME = 'pixel-pwa-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.webmanifest',
  'crypto-js.min.js',
  'turndown.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'tailwind.min.css',
  'fonts.css',
  'assets/press-start-2p.ttf',
  'assets/material-symbols-outlined.ttf',
  'app.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
