// Service Worker estable: xarxa primer i injecció segura de funcionalitats.
// En modificar l'HTML eliminem Content-Length/Content-Encoding per evitar pantalles blanques.
const CACHE='registre-horari-v63';
const CORE=['./','index.html','manifest.json','sync.js','firebase-config.js','icon-192.png','icon-512.png','apple-touch-icon.png','app-icon.png'];
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(async res=>{
      const type=res.headers.get('content-type')||'';
      if(!type.includes('text/html'))return res;
      const html=await res.text();
      if(html.includes('home-actions.js'))return new Response(html,{status:res.status,statusText:res.statusText,headers:res.headers});
      const injected=html.replace('</body>','<script src="./hours-auto.js?v=63"></script><script src="./home-actions.js?v=63"></script></body>');
      const headers=new Headers(res.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      headers.set('content-type','text/html; charset=utf-8');
      return new Response(injected,{status:res.status,statusText:res.statusText,headers});
    }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
    return;
  }
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok&&new URL(r.url).origin===location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{})}return res}).catch(()=>caches.match(r)));
});
