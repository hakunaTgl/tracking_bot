const CACHE_NAME = 'smart-hub-cache-v10';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json', '/icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => !cacheWhitelist.includes(cacheName) && caches.delete(cacheName)))));
});