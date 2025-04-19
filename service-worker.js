<xaiArtifact artifact_id="10e73b61-63c7-4a98-aa82-4bb4b61a32d1" artifact_version_id="c0718dc3-0f21-4a32-ac18-2dd9edec5ca7" title="service-worker.js" contentType="application/javascript">
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('bot-hub-cache-v2').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/manifest.json',
                '/icon.png'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});
