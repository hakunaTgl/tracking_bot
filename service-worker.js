const CACHE_NAME = 'smart-hub-cache-v5';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/bot-worker.js', '/manifest.json', '/icon.png'];

self.addEventListener('install', event => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching files');
      return cache.addAll(urlsToCache).catch(err => console.error('Cache add error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('gstatic.com') || event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('chart.js')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('Offline: Unable to fetch external resource', { status: 503 }))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => new Response('Offline: Resource not cached', { status: 503 }));
    })
  );
});
