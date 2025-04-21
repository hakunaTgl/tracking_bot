const CACHE_NAME = 'smart-hub-cache-v2';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.json', '/icon.png'];

self.addEventListener('install', event => {
  console.log('Service Worker installing');
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('gstatic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.map(cacheName => !cacheWhitelist.includes(cacheName) && caches.delete(cacheName)))));
});
