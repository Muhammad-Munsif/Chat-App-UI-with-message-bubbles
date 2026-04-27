// sw.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open('wavechat-v1').then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});