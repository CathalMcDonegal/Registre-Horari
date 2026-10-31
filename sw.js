// Service worker: xarxa primer, i còpia en memòria cau per funcionar sense connexió.
const CACHE='registre-horari-v3';
const CORE=['./','index.html','manifest.json','sync.js','firebase-config.js','icon-192.png','icon-512.png','apple-touch-icon.png','icons/app-icon.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const mine=u.origin===location.origin, sdk=u.hostname==='www.gstatic.com'&&u.pathname.includes('/firebasejs/');
  if(!mine&&!sdk)return; // Firestore/Auth van directes a la xarxa
  e.respondWith(fetch(r).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy))}
    return res;
  }).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))));
});
