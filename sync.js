/* Registre Horari — comptes d'usuari + sincronització entre dispositius (Firebase Auth + Firestore).
   Cada usuari només llegeix/escriu usuaris/{uid}/dades/estat (regles de Firestore). */
(function(){
'use strict';
const API=window.RHSync={};
const cfg=window.FIREBASE_CONFIG||{};
const configured=!!cfg.apiKey&&!/^PEGA/.test(cfg.apiKey);
const OWNER_KEY=KEY+'.owner', SYNCED_KEY=KEY+'.lastSynced', BK_PREFIX='registreHorariSyncBackup-';
const $=id=>document.getElementById(id);
const hasSDK=typeof firebase!=='undefined'&&firebase.auth&&firebase.firestore;

function lockErr(t){const e=$('lockError');if(e)e.textContent=t||''}
function hideLock(){$('lockScreen')?.classList.add('hidden')}
function showLock(){$('lockScreen')?.classList.remove('hidden')}
function setStatus(t){const e=$('syncStatus');if(e)e.textContent=t}
function authMsg(e){
  const m={'auth/invalid-credential':'Correu o contrasenya incorrectes','auth/wrong-password':'Contrasenya incorrecta','auth/user-not-found':'No existeix cap compte amb aquest correu','auth/invalid-email':'Correu no vàlid','auth/email-already-in-use':'Aquest correu ja té un compte. Prem «Entrar».','auth/weak-password':'La contrasenya ha de tenir almenys 6 caràcters','auth/network-request-failed':'Sense connexió','auth/too-many-requests':'Massa intents. Torna-ho a provar d\'aquí una estona'};
  return m[e&&e.code]||('Error: '+((e&&(e.code||e.message))||''));
}

if(!configured){
  // Mode local (sense Firebase): es manté la contrasenya antiga de l'index.html.
  API.configured=false;API.login=API.register=API.reset=API.logout=API.syncNow=()=>{};
  return;
}
API.configured=true;

if(!hasSDK){
  // Sense carregar l'SDK (p. ex. primer ús sense connexió): si ja hi havia un compte en aquest dispositiu, deixa entrar en local.
  if(localStorage.getItem(OWNER_KEY)){hideLock()}else{lockErr('Cal connexió per iniciar sessió la primera vegada.')}
  API.login=API.register=API.reset=API.logout=API.syncNow=()=>{};
  return;
}

firebase.initializeApp(cfg);
const auth=firebase.auth(), db=firebase.firestore();
try{db.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
let uid=null, docRef=null, unsub=null, pushTimer=null, applying=false;

function creds(){
  const email=($('lockEmail')?.value||'').trim(), pass=$('lockInput')?.value||'';
  if(!email||!pass){lockErr('Escriu el correu i la contrasenya');return null}
  return {email,pass};
}
API.login=async function(){const c=creds();if(!c)return;lockErr('');try{await auth.signInWithEmailAndPassword(c.email,c.pass)}catch(e){lockErr(authMsg(e))}};
API.register=async function(){const c=creds();if(!c)return;lockErr('');try{await auth.createUserWithEmailAndPassword(c.email,c.pass)}catch(e){lockErr(authMsg(e))}};
API.reset=async function(){
  const email=($('lockEmail')?.value||'').trim();if(!email){lockErr('Escriu primer el teu correu');return}
  try{await auth.sendPasswordResetEmail(email);lockErr('T\'hem enviat un correu per restablir la contrasenya')}catch(e){lockErr(authMsg(e))}
};

function backupLocal(){
  try{
    const raw=localStorage.getItem(KEY);if(!raw)return;
    localStorage.setItem(BK_PREFIX+Date.now(),raw);
    const ks=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(BK_PREFIX))ks.push(k)}
    ks.sort().slice(0,-3).forEach(k=>localStorage.removeItem(k));
  }catch(e){}
}
function stamp(ms){return new Date(ms).toLocaleTimeString('ca',{hour:'2-digit',minute:'2-digit'})}
function okStatus(ms){setStatus('Sincronitzat ✓ '+stamp(ms||Date.now()))}

function applyRemote(d){
  let raw;try{raw=JSON.parse(d.json)}catch(e){return false}
  const lastSynced=Number(localStorage.getItem(SYNCED_KEY))||0;
  if(localStorage.getItem(KEY)&&(state._savedAt||0)>lastSynced)backupLocal(); // canvis locals sense pujar: es guarda còpia
  applying=true;try{applyRemoteState(raw)}finally{applying=false}
  localStorage.setItem(SYNCED_KEY,String(d.savedAt||0));
  okStatus(d.savedAt);return true;
}
async function push(){
  if(!docRef)return;
  const payload=JSON.stringify(state), savedAt=state._savedAt||Date.now();
  try{
    await docRef.set({json:payload,savedAt,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    localStorage.setItem(SYNCED_KEY,String(savedAt));okStatus(savedAt);
  }catch(e){setStatus('Error de sincronització — es tornarà a provar')}
}
function schedulePush(){
  if(!docRef||applying)return;
  clearTimeout(pushTimer);pushTimer=setTimeout(push,1200);setStatus('Pendent de sincronitzar…');
}
API.syncNow=async function(){
  if(!docRef)return;setStatus('Sincronitzant…');
  try{
    const snap=await docRef.get({source:'server'});
    if(snap.exists&&(snap.data().savedAt||0)>(state._savedAt||0)){applyRemote(snap.data());toast('Dades sincronitzades')}
    else await push();
  }catch(e){setStatus('Sense connexió — els canvis es guarden en local')}
};
function startListener(){
  if(unsub)unsub();
  unsub=docRef.onSnapshot(snap=>{
    if(snap.metadata.hasPendingWrites||!snap.exists)return;
    const d=snap.data();
    if((d.savedAt||0)>(state._savedAt||0)){if(applyRemote(d))toast('Dades sincronitzades')}
    else if((d.savedAt||0)===(state._savedAt||0))okStatus(d.savedAt);
  },()=>{});
}
async function initialSync(){
  setStatus('Sincronitzant…');
  try{
    const snap=await docRef.get();
    const hasLocal=!!localStorage.getItem(KEY), localSaved=hasLocal?(state._savedAt||0):0;
    if(snap.exists){
      const d=snap.data();
      if((d.savedAt||0)>=localSaved){if(localSaved&&(d.savedAt||0)>localSaved&&localSaved>(Number(localStorage.getItem(SYNCED_KEY))||0))backupLocal();applyRemote(d)}
      else await push();
    }else if(hasLocal){await push()}
    else setStatus('Compte creat. Les dades es pujaran en desar el primer registre.');
  }catch(e){setStatus('Sense connexió — els canvis es guarden en local')}
  startListener();
}

// Hook sobre save(): cada canvi real programa una pujada.
const origSave=window.save;
window.save=function(){
  const before=state._savedAt;const r=origSave.apply(this,arguments);
  if(state._savedAt!==before)schedulePush();
  return r;
};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&pushTimer){clearTimeout(pushTimer);pushTimer=null;push()}});
window.addEventListener('online',()=>{if(docRef)API.syncNow()});

API.logout=async function(){
  if(!confirm('Tancar sessió? Les dades es queden al teu compte i es tornaran a carregar en entrar.'))return;
  clearTimeout(pushTimer);
  if(navigator.onLine)await Promise.race([push(),new Promise(r=>setTimeout(r,4000))]);
  if((Number(localStorage.getItem(SYNCED_KEY))||0)<(state._savedAt||0)&&!confirm('Hi ha canvis sense sincronitzar que es perdran. Tancar sessió igualment?'))return;
  if(unsub)unsub();
  [KEY,KEY+'.latest',OWNER_KEY,SYNCED_KEY].forEach(k=>localStorage.removeItem(k));
  await auth.signOut();location.reload();
};

auth.onAuthStateChanged(user=>{
  if(!user){
    if(unsub){unsub();unsub=null}
    uid=null;docRef=null;$('accountCard')&&($('accountCard').style.display='none');showLock();return;
  }
  uid=user.uid;
  docRef=db.collection('usuaris').doc(uid).collection('dades').doc('estat');
  // Aïllament: si aquest navegador tenia dades d'un altre compte, es guarden a part i no es barregen.
  const owner=localStorage.getItem(OWNER_KEY);
  if(owner&&owner!==uid){
    backupLocal();
    [KEY,KEY+'.latest',SYNCED_KEY].forEach(k=>localStorage.removeItem(k));
    state=defaultState();renderAll();
  }
  localStorage.setItem(OWNER_KEY,uid);
  const em=$('syncEmail');if(em)em.textContent=user.email||'—';
  const card=$('accountCard');if(card)card.style.display='';
  lockErr('');const li=$('lockInput');if(li)li.value='';
  hideLock();
  initialSync();
});
})();
