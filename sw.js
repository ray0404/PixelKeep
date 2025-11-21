const CACHE_NAME = 'pixel-pwa-cache-v2';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.webmanifest',
  'crypto-js.min.js',
  'turndown.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Merriweather:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js',
  'https://fonts.gstatic.com/s/pressstart2p/v15/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2',
  'https://fonts.gstatic.com/s/materialsymbolsoutlined/v169/kJF1BvYX7BgnkSr3PzllTyE5YcMOMlrwqBuflv32RR4.woff2'
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
