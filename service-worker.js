self.addEventListener('install', event => {
event.waitUntil(
caches.open('bot-hub-cache-v1').then(cache => {
return cache.addAll([
'/',
'/index.html',
'/manifest.json'
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
