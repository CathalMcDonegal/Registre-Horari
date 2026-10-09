const CACHE='registre-horari-v57';
const APP_SHELL=['./','./index.html','./manifest.json','./hours-auto.js'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(APP_SHELL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

async function injectAutoHours(response){
  if(!response||!response.ok)return response;
  const text=await response.text();
  if(text.includes('hours-auto.js'))return new Response(text,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html;charset=UTF-8'}});
  const injected=text.replace(/<\/body>/i,'<script src="./hours-auto.js"></script></body>');
  return new Response(injected,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'text/html;charset=UTF-8'}});
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isNavigation=event.request.mode==='navigate';
  const isIndex=url.pathname.endsWith('/index.html');
  const isAppShell=isNavigation||isIndex||url.pathname.endsWith('/manifest.json');
  if(isAppShell){
    event.respondWith(
      fetch(event.request)
        .then(async response=>{
          const finalResponse=(isNavigation||isIndex)?await injectAutoHours(response):response;
          const copy=finalResponse.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return finalResponse;
        })
        .catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(cached=>cached||fetch(event.request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      }))
      .catch(()=>caches.match('./index.html'))
  );
});
