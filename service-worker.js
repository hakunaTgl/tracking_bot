const CACHE_NAME = 'smart-hub-cache-v8';
const urlsToCache = ['/', '/index.html', '/styles.css', '/app.js', '/bot-worker.js', '/manifest.json'];

self.addEventListener('install', event => {
  console.log('Service Worker v8 installing');
  event.waitUntil(
