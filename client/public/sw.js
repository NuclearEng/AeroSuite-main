self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('aerosuite-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        // Add other assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
