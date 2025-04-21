const CACHE_NAME = 'smart-hub-cache-v4';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json', '/icon.png'];

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
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).catch(err => console.error('Cache cleanup error:', err))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('gstatic.com') || event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('chart.js')) {
    event.respondWith(fetch(event.request).catch(err => console.error('Fetch error:', err)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(err => {
        console.error('Fetch fallback error:', err);
        return new Response('Offline mode: Unable to fetch resource');
      });
    })
  );
});
