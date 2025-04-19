self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('bot-hub-cache-v3').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/icon.png',
                'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.min.js'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    // Bypass Firebase requests
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
        event.respondWith(fetch(event.request));
        return;
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});
