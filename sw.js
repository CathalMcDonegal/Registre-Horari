// Service Worker de Registre Horari + Firebase Cloud Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
const firebaseConfig={apiKey:'AIzaSyAi9dPYVv__GO0F4vyO1MDvgCLGh0DPjEc',authDomain:'registre-horari-36ec6.firebaseapp.com',projectId:'registre-horari-36ec6',storageBucket:'registre-horari-36ec6.firebasestorage.app',messagingSenderId:'464581283179',appId:'1:464581283179:web:7f830e4195f910088ed02e'};
try{firebase.initializeApp(firebaseConfig);const messaging=firebase.messaging();messaging.onBackgroundMessage(payload=>{const n=payload.notification||{};self.registration.showNotification(n.title||'Registre Horari',{body:n.body||'Tens un registre programat per demà.',icon:'app-icon.png',badge:'app-icon.png',tag:payload.data?.tag||'registre-horari-event',data:{url:'https://cathalmcdonegal.github.io/Registre-Horari/'}})});}catch(e){console.error('FCM SW',e)}
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus'in c)return c.focus()}return clients.openWindow('https://cathalmcdonegal.github.io/Registre-Horari/')}))});
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
