/* Millores de la pantalla d'inici: Avui, Pròxim i Accions pendents. */
(function(){
  'use strict';
  function S(){try{return state}catch(e){return null}}
  function esc(v){try{return escapeHtml(v==null?'':String(v))}catch(e){return String(v==null?'':v).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}}
  function observation(r){
    if(!r)return '';
    return String(r.observacions ?? r.observacio ?? r.observación ?? r.observacion ?? r.notes ?? r.nota ?? '').trim();
  }
  function iconLabel(r){
    if(!r?.noteIcon)return '';
    return r.noteIcon==='red_plus'?'➕':String(r.noteIcon);
  }
  function dayLabel(d){return d?`${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`:''}
  function trialPaid(j){return !!(j?.cobrament||j?.cobrat||j?.paid||j?.pagat)}
  function trialHeld(j){return !!(j?.celebrat||j?.held||j?.celebratJudici)}
  function trialTime(j){
    const t=String(j?.hora||j?.time||'').trim();
    if(!t)return '';
    return t.replace(/^([0-2]\d):([0-5]\d)$/, '$1.$2h');
  }
  function trialDate(j){
    if(!j?.data)return '';
    const parts=String(j.data).split('-').map(Number);
    if(parts.length===3&&parts.every(Number.isFinite)){
      const d=new Date(parts[0],parts[1]-1,parts[2]);
      return dayLabel(d);
    }
    return String(j.data);
  }
  function trialDetail(j){
    const parts=[];
    if(j?.jutjat)parts.push(String(j.jutjat));
    if(j?.sala)parts.push(`sala ${String(j.sala)}`);
    if(j?.procediment)parts.push(`dil. ${String(j.procediment)}`);
    if(j?.agents)parts.push(String(j.agents));
    return parts.join(', ');
  }
  function renderTrialRow(j,i,pendingLabel){
    const top=['⚖️',trialDate(j),trialTime(j)].filter(Boolean).join(' ');
    const detail=trialDetail(j)||pendingLabel||'';
    return `<div class="row" onclick="openTrial(${i})" style="cursor:pointer"><div class="grow"><strong>${esc(top)}</strong><small>${esc(detail)}</small></div><span class="chip warn">Per cobrar</span></div>`;
  }

  function addSpecialFields(){
    if(document.getElementById('specialPayFields'))return;
    const work=document.getElementById('workFields');
    if(!work)return;
    const wrap=document.createElement('div');
    wrap.id='specialPayFields';
    wrap.innerHTML='<div class="check"><input type="checkbox" id="daySpecialPay"><label for="daySpecialPay">Aquest dia té cobrament especial</label></div><div class="check" id="daySpecialPaidWrap" style="display:none"><input type="checkbox" id="daySpecialPaid"><label for="daySpecialPaid">Cobrament especial cobrat</label></div>';
    work.appendChild(wrap);
    const special=document.getElementById('daySpecialPay');
    const paidWrap=document.getElementById('daySpecialPaidWrap');
    special.addEventListener('change',function(){paidWrap.style.display=this.checked?'block':'none';if(!this.checked)document.getElementById('daySpecialPaid').checked=false;});
  }

  function patchDay(){
    addSpecialFields();
    if(!window.openDay||window.__homeDayPatched)return;
    const originalOpen=window.openDay;
    window.openDay=function(k){
      originalOpen.apply(this,arguments);
      const st=S(),r=st?.registres?.[k]||{};
      const special=document.getElementById('daySpecialPay'),paid=document.getElementById('daySpecialPaid'),wrap=document.getElementById('daySpecialPaidWrap');
      if(special){special.checked=!!r.pagamentEspecial;if(wrap)wrap.style.display=special.checked?'block':'none'}
      if(paid)paid.checked=!!r.pagamentEspecialCobrat;
    };
    const originalSave=window.saveDay;
    window.saveDay=function(){
      const special=!!document.getElementById('daySpecialPay')?.checked;
      const paid=special&&!!document.getElementById('daySpecialPaid')?.checked;
      originalSave.apply(this,arguments);
      const st=S(),k=typeof editingDay!=='undefined'?editingDay:null;
      if(k&&st?.registres?.[k]){
        st.registres[k].pagamentEspecial=special;
        st.registres[k].pagamentEspecialCobrat=paid;
        try{save()}catch(e){}
        try{renderAll()}catch(e){}
      }
    };
    window.__homeDayPatched=true;
  }

  function renderDayIconRow(k,r,clickable=true){
    const d=typeof parseKey==='function'?parseKey(k):null;
    const label=dayLabel(d)||k;
    const icon=iconLabel(r);
    const obs=observation(r);
    if(!icon)return '';
    return `<div class="row" ${clickable?`onclick="openDay('${k}')" style="cursor:pointer"`:''}><div class="grow"><strong>${esc(icon)} ${esc(label)}</strong><small>${esc(obs||'')}</small></div></div>`;
  }

  function renderTodayExtras(){
    const st=S(),box=document.getElementById('todayCard');
    if(!st||!box||typeof todayKey!=='function')return;
    const old=box.querySelector('[data-home-today-extra]');
    if(old)old.remove();
    const k=todayKey(),r=st.registres?.[k];
    if(!r?.noteIcon)return;
    const html=renderDayIconRow(k,r,false);
    if(!html)return;
    const wrap=document.createElement('div');
    wrap.setAttribute('data-home-today-extra','1');
    wrap.innerHTML='<div class="card-title">Avui</div>'+html;
    box.appendChild(wrap);
  }

  function renderUpcomingOnly(){
    const st=S(),box=document.getElementById('upcoming');
    if(!st||!box||typeof todayKey!=='function')return;
    const today=todayKey();
    const trials=st.judicis.map((j,i)=>({...j,i})).filter(j=>j.data&&j.data>today&&!trialHeld(j)).sort((a,b)=>(a.data+(a.hora||'')).localeCompare(b.data+(b.hora||''))).slice(0,5);
    const icons=[];
    for(let i=1;i<61;i++){
      const d=new Date();d.setDate(d.getDate()+i);const k=typeof key==='function'?key(d):'';const r=st.registres[k];
      if(r?.noteIcon)icons.push({d,k,r});
    }
    let html=trials.map(j=>{
      const top=['⚖️',trialDate(j),trialTime(j)].filter(Boolean).join(' ');
      return `<div class="row" onclick="openTrial(${j.i})"><div class="grow"><strong>${esc(top)}</strong><small>${esc(trialDetail(j))}</small></div><span class="chip ${trialPaid(j)?'ok':'warn'}">${trialPaid(j)?'Cobrat':'Pendent'}</span></div>`;
    }).join('');
    html+=icons.slice(0,5).map(o=>renderDayIconRow(o.k,o.r,true)).join('');
    box.innerHTML=html||'<div class="empty">No hi ha judicis ni dies programats.</div>';
  }

  function renderPendingOnly(){
    const st=S(),box=document.getElementById('alerts');
    if(!st||!box)return;
    const items=[];
    st.judicis.forEach((j,i)=>{
      if(trialHeld(j)&&!trialPaid(j))items.push(renderTrialRow(j,i,'Pendent de cobrament'));
    });
    Object.entries(st.registres||{}).forEach(([k,r])=>{
      /* Les hores extres NO són una acció pendent. Només s'hi mostra el dia si l'usuari ha marcat explícitament cobrament especial. */
      if(r?.pagamentEspecial&&!r?.pagamentEspecialCobrat){
        const d=typeof parseKey==='function'?parseKey(k):null;
        const label=dayLabel(d)||k;
        const obs=observation(r);
        items.push(`<div class="row" onclick="openDay('${k}')" style="cursor:pointer"><div class="grow"><strong>💶 ${esc(label)}</strong><small>${esc(obs||'Cobrament especial pendent')}</small></div><span class="chip warn">Per cobrar</span></div>`);
      }
    });
    box.innerHTML=items.length?items.join(''):'<div class="empty">Tot al dia.</div>';
  }

  function patchHome(){
    if(!window.renderHome||window.__homeSectionsPatched)return;
    const original=window.renderHome;
    window.renderHome=function(){
      original.apply(this,arguments);
      renderUpcomingOnly();
      renderPendingOnly();
      setTimeout(renderTodayExtras,0);
    };
    window.__homeSectionsPatched=true;
    renderUpcomingOnly();renderPendingOnly();setTimeout(renderTodayExtras,0);
  }

  function boot(){
    patchDay();patchHome();
    setTimeout(()=>{patchDay();patchHome();renderUpcomingOnly();renderPendingOnly();renderTodayExtras()},0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
