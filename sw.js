const CACHE='registre-horari-v60';

// Versió de recuperació: elimina les versions antigues del Service Worker
// i deixa que GitHub Pages serveixi l'HTML directament, sense modificar-lo.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navegacions sempre des de xarxa. No toquem ni reconstruïm l'HTML.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Recursos normals: xarxa primer, memòria cau només com a reserva.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
