// Recuperació definitiva del Service Worker.
// No intercepta cap petició i s'autodesregistra per evitar pantalles blanques o bloquejos.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.registration.unregister())
  );
});

// Intencionadament no hi ha cap fetch handler: totes les peticions passen directament
// a GitHub Pages.