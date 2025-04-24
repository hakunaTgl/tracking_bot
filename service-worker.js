const CACHE_NAME = 'smart-hub-cache-v15';
const urlsToCache = ['/', '/index.html', '/app.js', '/styles.css', '/smart-ai.js', '/editor.js', '/simplified-ui.js', '/icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.map(name => name !== CACHE_NAME ? caches.delete(name) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request).catch(() => new Response('Offline')))
  );
});