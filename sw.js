const CACHE='registre-horari-v61';

// Service Worker estable: manté l'HTML servit per GitHub Pages i afegeix
// el motor de càlcul d'hores al final de cada navegació.
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

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(async response => {
        const type = response.headers.get('content-type') || '';
        if (!type.includes('text/html')) return response;

        const html = await response.text();
        if (html.includes('hours-auto.js')) {
          return new Response(html, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }

        const injected = html.replace(
          '</body>',
          '<script src="./hours-auto.js?v=61"></script></body>'
        );

        return new Response(injected, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
