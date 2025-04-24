const CACHE_NAME = 'smart-hub-cache-v10';
const urlsToCache = ['/', '/index.html', '/app.js'];
const offlinePage = `
<!DOCTYPE html>
<html>
<head>
  <title>Offline</title>
  <style>
    body { font-family: Arial; text-align: center; padding: 50px; background: #1A1A2E; color: #F5F6F5; }
    h1 { font-size: 2em; }
    p { font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>Offline Mode</h1>
  <p>Smart Hub is offline. Actions will sync when you reconnect.</p>
</body>
</html>
`;

self.addEventListener('install', event => {
  console.log('Service Worker v10 installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response(offlinePage, { headers: { 'Content-Type': 'text/html' } });
        }
        return new Response('Resource not available offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  console.log('Syncing pending actions...');
  // Placeholder for offline sync logic
}