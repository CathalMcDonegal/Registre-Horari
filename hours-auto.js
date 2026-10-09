/* Torns fixos + càlcul automàtic d'hores i acumulades. */
(function(){
  const FIXED={
    mati:{id:'mati',nom:'Matí',abbr:'M',hores:7.5,inici:'07:00',fi:'14:30'},
    tarda:{id:'tarda',nom:'Tarda',abbr:'T',hores:7.5,inici:'14:30',fi:'22:00'},
    nit:{id:'nit',nom:'Nit',abbr:'N',hores:9,inici:'22:00',fi:'07:00'},
    cs_dia:{id:'cs_dia',nom:'Cap de setmana / festiu Dia',abbr:'Dia 12h',hores:12,inici:'07:00',fi:'19:00'},
    cs_nit:{id:'cs_nit',nom:'Cap de setmana / festiu Nit',abbr:'Nit 12h',hores:12,inici:'19:00',fi:'07:00'}
  };
  function appState(){try{return state}catch(e){return null}}
  function minutes(value){if(!value||!/^\d{1,2}:\d{2}$/.test(value))return null;const p=value.split(':').map(Number);return p[0]*60+p[1]}
  function elapsed(start,end){const a=minutes(start),b=minutes(end);if(a===null||b===null)return null;let d=b-a;if(d<0)d+=1440;return d/60}
  function fmt(h){return Number(h.toFixed(2)).toString()}
  function fixedShift(id){const base=FIXED[id];if(!base)return null;const st=appState(),current=st&&Array.isArray(st.torns)?st.torns.find(x=>x.id===id):null;return {...base,color:current?.color||base.color}}
  function normalizeStoredData(){
    if(localStorage.getItem('__registre_fixed_shifts_v2')==='1')return false;
    let changed=false;
    ['registreHorariMossos','registreHorariMossos.latest'].forEach(key=>{try{
      const raw=localStorage.getItem(key);if(!raw)return;const data=JSON.parse(raw);if(!data||typeof data!=='object')return;
      if(Array.isArray(data.torns)){data.torns=data.torns.map(t=>FIXED[t.id]?{...t,...FIXED[t.id]}:t);changed=true}
      if(data.registres&&typeof data.registres==='object')Object.values(data.registres).forEach(r=>{if(r?.tipus!=='treball')return;const s=FIXED[r.torn];if(!s)return;const h=elapsed(r.entrada,r.sortida);r.hores=h!==null?h:s.hores;changed=true});
      localStorage.setItem(key,JSON.stringify(data));
    }catch(e){}});
    localStorage.setItem('__registre_fixed_shifts_v2','1');return changed;
  }
  function normalizeRuntimeData(){
    const st=appState();if(!st?.registres)return;
    let changed=false;
    Object.values(st.registres).forEach(r=>{if(r?.tipus!=='treball')return;const s=FIXED[r.torn];if(!s)return;const h=elapsed(r.entrada,r.sortida);if(h!==null&&Number(r.hores)!==h){r.hores=h;changed=true}});
    if(changed&&typeof window.save==='function')window.save();
  }
  function applyFixedShiftConfig(){
    if(typeof window.getShift==='function'&&!window.__fixedShiftWrapped){const originalGetShift=window.getShift;window.getShift=function(id){return fixedShift(id)||originalGetShift(id)};window.__fixedShiftWrapped=true}
    if(typeof window.defaultShiftHours==='function'&&!window.__fixedHoursWrapped){window.defaultShiftHours=function(s){return FIXED[s?.id]?.hores??Number(s?.hores)||0};window.__fixedHoursWrapped=true}
    if(typeof window.shiftChanged==='function'&&!window.__fixedShiftChangedWrapped){const original=window.shiftChanged;window.shiftChanged=function(){original.apply(this,arguments);const id=document.getElementById('dayShift')?.value,s=FIXED[id];if(s){document.getElementById('dayStart').value=s.inici;document.getElementById('dayEnd').value=s.fi;calculateDayHours()}};window.__fixedShiftChangedWrapped=true}
  }
  function calculateDayHours(){const start=document.getElementById('dayStart'),end=document.getElementById('dayEnd'),hours=document.getElementById('dayHours');if(!start||!end||!hours)return;const h=elapsed(start.value,end.value);hours.value=h===null?'':fmt(h);if(typeof window.updateHint==='function')window.updateHint()}
  function installCalc(){
    if(window.__fixedCalcInstalled)return;
    window.calc=function(){
      const st=appState()||{},records=st.registres||{};let worked=0,accExtra=0,vac=0,pers=0,blue=0,gnp=0,gnit=0,extra=0,accUsed=0;
      for(const r of Object.values(records)){
        if(!r?.tipus)continue;
        if(r.tipus==='treball'){
          const s=FIXED[r.torn]||((typeof window.getShift==='function')?window.getShift(r.torn):null),hrRaw=elapsed(r.entrada,r.sortida),hr=hrRaw!==null?hrRaw:Number(r.hores)||Number(s?.hores)||0,base=Number(s?.hores)||0;
          if(r.torn==='festa')worked-=hr;else{worked+=hr;accExtra+=Math.max(0,hr-base)}
          if(s&&typeof window.isNightShift==='function'&&window.isNightShift(s)&&typeof window.nightHoursForRecord==='function')gnit+=window.nightHoursForRecord(r,s)
        }else if(r.tipus==='vacances')vac+=Number(r.horesConcepte)||0;
        else if(r.tipus==='dies_blaus'){const h=Number(r.horesConcepte)||0;blue+=h;worked+=h}
        else if(r.tipus==='assumptes'){const h=Number(r.horesConcepte)||0;pers+=h;worked+=h}
        else if(r.tipus==='baixa')worked+=Number(r.horesConcepte)||0;
        else if(r.tipus==='guardia_np')gnp+=Number(r.horesConcepte)||0;
        else if(r.tipus==='hores_acum')accUsed+=Number(r.horesConcepte)||7.5;
        else if(r.tipus==='hores_extres')extra+=Number(r.horesConcepte)||0;
      }
      const num=h=>Number((Number(h)||0).toFixed(2)),expected=typeof window.expectedToDate==='function'?window.expectedToDate():0,annual=Number(st.horesAnuals)||0;
      return {worked:num(worked),remaining:num(annual-worked),saldo:num(worked-expected),expected:num(expected),progress:annual?Math.max(0,Math.min(100,worked/annual*100)):0,accum:num((Number(st.acumTotals)||0)+accExtra-accUsed),vac:num(vac),pers:num(pers),blue:num(blue),gnp:num(gnp),gnit:num(gnit),extra:num(extra),accExtra:num(accExtra),accUsed:num(accUsed)};
    };
    window.__fixedCalcInstalled=true;
  }
  function install(){
    if(normalizeStoredData()){location.reload();return}
    applyFixedShiftConfig();installCalc();normalizeRuntimeData();
    const start=document.getElementById('dayStart'),end=document.getElementById('dayEnd'),hours=document.getElementById('dayHours');
    if(!start||!end||!hours)return;
    ['input','change'].forEach(ev=>{start.addEventListener(ev,calculateDayHours);end.addEventListener(ev,calculateDayHours)});
    hours.readOnly=true;hours.setAttribute('aria-readonly','true');hours.title='Calculades automàticament a partir de l\'entrada i la sortida';
    if(start.value&&end.value)calculateDayHours();
    if(typeof window.renderAll==='function')window.renderAll();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
