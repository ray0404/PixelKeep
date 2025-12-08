importScripts('https://cdn.jsdelivr.net/npm/idb@7/build/umd.js');
importScripts('crypto-js.min.js');

const CACHE_NAME = 'pixel-pwa-cache-v4';
const OFFLINE_URL = 'index.html';
const DB_NAME = 'PixelPWADatabase';
let sessionPassword = null;

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

// --- 1. Key Management ---
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_PASSWORD') {
        sessionPassword = event.data.password;
    }
});

// --- 2. Helper: Decrypt Image ---
async function getDecryptedImage(id) {
    if (!sessionPassword) {
        // Request password from clients if lost (e.g. SW restart)
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage({ type: 'REQUEST_PASSWORD' }));
        throw new Error("Locked");
    }

    const db = await idb.openDB(DB_NAME, 4); // Match your DB version
    const record = await db.get('images', id);

    if (!record) throw new Error("Image not found");

    // Decrypt
    try {
        const bytes = CryptoJS.AES.decrypt(record.data, sessionPassword);

        // Check if it decrypted to a Data URL string (Old Format compatibility)
        // We try to convert to string first to check if it starts with data:image
        // However, converting random binary bytes to UTF8 string might be messy if it's not a string.
        // But CryptoJS decrypt returns WordArray.
        // If we stored it as string (old format), bytes is WordArray of that string.

        // Optimization: Try to distinguish.
        // Old format: data is encrypted string of "data:image..."
        // New format: data is encrypted WordArray of binary.

        // Let's try converting to string first.
        try {
            const str = bytes.toString(CryptoJS.enc.Utf8);
            if (str && str.startsWith('data:image')) {
                const response = await fetch(str);
                return await response.blob();
            }
        } catch (e) {
            // Not a string or conversion failed, likely binary
        }

        // It is likely binary data (New Format)
        const u8arr = convertWordArrayToUint8Array(bytes);
        // If record.mimeType is missing (old data that wasn't string?), default to png or similar?
        // But old data IS string. So if we are here, it must be new data which has mimeType.
        return new Blob([u8arr], { type: record.mimeType || 'image/png' });

    } catch (e) {
        console.error("Decryption fail", e);
        throw e;
    }
}

function convertWordArrayToUint8Array(wordArray) {
    const len = wordArray.sigBytes;
    const words = wordArray.words;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return u8;
}

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

  // --- Virtual Server for Images ---
  if (url.pathname.startsWith('/secure-img/')) {
      const id = url.pathname.split('/')[2];

      event.respondWith(async function() {
          try {
              // Try to get image
              const blob = await getDecryptedImage(id);
              // Return generic 200 OK response with the image blob
              return new Response(blob, {
                  status: 200,
                  headers: {
                      'Content-Type': blob.type,
                      'Cache-Control': 'public, max-age=31536000' // Cache in memory/disk by browser logic
                  }
              });
          } catch (err) {
              // Return a placeholder "broken image" or "locked" icon
              if (err.message === "Locked") {
                  return new Response("Locked", { status: 401 });
              }
              return new Response("Not found", { status: 404 });
          }
      }());
      return;
  }

  // --- Virtual Server for Audio ---
  if (url.pathname.startsWith('/secure-audio/')) {
      const id = url.pathname.split('/')[2];

      event.respondWith(async function() {
          try {
              const blob = await getDecryptedAudio(id);
              return new Response(blob, {
                  status: 200,
                  headers: {
                      'Content-Type': blob.type,
                      'Cache-Control': 'public, max-age=31536000'
                  }
              });
          } catch (err) {
               if (err.message === "Locked") {
                  return new Response("Locked", { status: 401 });
              }
              return new Response("Not found", { status: 404 });
          }
      }());
      return;
  }

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
