const CACHE_NAME = 'pixel-pwa-cache-v3';
const OFFLINE_URL = 'index.html';

// Assets to strictly pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/crypto-js.min.js',
  '/turndown.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Tailwind & Fonts (Pre-caching these speeds up first paint significantly)
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
  'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Take over immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .catch(err => console.error('Pre-cache failed:', err))
  );
});

self.addEventListener('activate', event => {
  // Claim clients immediately so the user doesn't need to reload to get offline support
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Navigation Requests (HTML) - App Shell Strategy
  // For any navigation (HTML) request, try the network first, fall back to cache.
  // CRITICAL: If both fail, return the cached index.html (SPA Offline Fallback).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 2. Google Fonts & CDNs - Stale While Revalidate
  // Serve from cache immediately, then update cache from network in background
  if (url.origin.includes('fonts.googleapis.com') || 
      url.origin.includes('gstatic.com') || 
      url.origin.includes('cdn.jsdelivr.net') ||
      url.origin.includes('cdn.tailwindcss.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then(networkResponse => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default Strategy: Cache First, Fallback to Network
  // For images, scripts, etc.
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request);
      })
  );
});

// --- Background Sync Handler (As per PWABuilder PDF) ---
// This allows the app to sync data when connectivity returns
self.addEventListener('sync', event => {
  if (event.tag === 'database-sync') {
    event.waitUntil(
      // Your sync logic here. Since logic is inside index.html for now,
      // this mainly wakes up the SW. You can implement specific
      // IndexedDB flushing logic here in the future.
      console.log('Background sync triggered')
    );
  }
});

// --- Push Notification Handler ---
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url || '/' }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
