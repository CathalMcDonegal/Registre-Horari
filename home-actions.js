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
    const k=todayKey(),r=st.registres?.[k];
    if(!r?.noteIcon)return;
    const html=renderDayIconRow(k,r,false);
    if(!html)return;
    const wrap=document.createElement('div');
    wrap.className='section';
    wrap.innerHTML='<div class="card-title">Avui</div>'+html;
    box.appendChild(wrap);
  }

  function renderUpcomingOnly(){
    const st=S(),box=document.getElementById('upcoming');
    if(!st||!box||typeof todayKey!=='function')return;
    const today=todayKey();
    const trials=st.judicis.map((j,i)=>({...j,i})).filter(j=>j.data&&j.data>today&&!j.celebrat).sort((a,b)=>(a.data+(a.hora||'')).localeCompare(b.data+(b.hora||''))).slice(0,5);
    const icons=[];
    for(let i=1;i<61;i++){
      const d=new Date();d.setDate(d.getDate()+i);const k=typeof key==='function'?key(d):'';const r=st.registres[k];
      if(r?.noteIcon)icons.push({d,k,r});
    }
    let html=trials.map(j=>`<div class="row" onclick="openTrial(${j.i})"><div class="grow"><strong>⚖️ ${esc(j.jutjat||'Judici')} · ${j.hora||''}</strong><small>${j.data} · ${esc(j.procediment||'')}</small></div><span class="chip ${j.cobrament?'ok':'warn'}">${j.cobrament?'Cobrat':'Pendent'}</span></div>`).join('');
    html+=icons.slice(0,5).map(o=>renderDayIconRow(o.k,o.r,true)).join('');
    box.innerHTML=html||'<div class="empty">No hi ha judicis ni dies programats.</div>';
  }

  function renderPendingOnly(){
    const st=S(),box=document.getElementById('alerts');
    if(!st||!box)return;
    const items=[];
    st.judicis.forEach((j,i)=>{
      if(j.celebrat&&!j.cobrament){items.push(`<div class="row" onclick="openTrial(${i})" style="cursor:pointer"><div class="grow"><strong>⚖️ ${esc(j.jutjat||'Judici')} · ${j.data||'sense data'}</strong><small>Pendent de cobrament</small></div><span class="chip warn">Per cobrar</span></div>`)}
    });
    Object.entries(st.registres||{}).forEach(([k,r])=>{
      /* Les hores extres NO són una acció pendent. Només s'hi mostra el dia si l'usuari ha marcat explícitament cobrament especial. */
      if(r?.pagamentEspecial&&!r?.pagamentEspecialCobrat){
        const d=typeof parseKey==='function'?parseKey(k):null;
        const label=dayLabel(d)||k;
        items.push(`<div class="row" onclick="openDay('${k}')" style="cursor:pointer"><div class="grow"><strong>💶 ${label} · Cobrament especial</strong><small>Pendent de cobrament</small></div><span class="chip warn">Per cobrar</span></div>`);
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
