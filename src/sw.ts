/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();

// 1. Precache all build assets
precacheAndRoute(self.__WB_MANIFEST);

// 2. Cleanup old caches
cleanupOutdatedCaches();

// 3. Cache Google Fonts (Stylesheets)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// 4. Cache Google Fonts (Webfonts)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 5. Cache Images from 'nanobanana-output' or 'public'
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// 6. Handle Share Target POST requests
// Redirects the POST request to the share-target page with query params
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/share-target')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const url = formData.get('url') || '';
        // Note: File handling would typically go here for more complex processing
        // But for now we redirect to the GET handler
        
        const params = new URLSearchParams();
        if(title) params.append('title', title as string);
        if(text) params.append('text', text as string);
        if(url) params.append('url', url as string);

        return Response.redirect(`/share-target?${params.toString()}`, 303);
      })()
    );
  }
});

// 7. Push Notifications Listener
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'PixelKeep Update', body: 'New content available!' };
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options as NotificationOptions)
  );
});

// 8. Notification Click Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open and focus it
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
