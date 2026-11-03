// Service Worker de recuperació: no intercepta ni modifica cap petició.
// Es manté temporalment per substituir versions anteriors que podien bloquejar l'app.
const CACHE='registre-horari-recovery-v65';
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
// Sense fetch handler: totes les peticions passen directament a GitHub Pages.
