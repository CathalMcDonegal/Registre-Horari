/* Millores de la pantalla d'inici: Avui, Pròxim i Accions pendents. */
(function(){
  'use strict';
  function S(){try{return state}catch(e){return null}}
  function esc(v){try{return escapeHtml(v==null?'':String(v))}catch(e){return String(v==null?'':v).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]))}}
  function observation(r){if(!r)return '';return String(r.observacions ?? r.observacio ?? r.observación ?? r.observacion ?? r.notes ?? r.nota ?? '').trim()}
  function iconLabel(r){if(!r?.noteIcon)return '';return r.noteIcon==='red_plus'?'➕':String(r.noteIcon)}
  function dayLabel(d){return d?`${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`:''}

  // Acceptem els noms antics i nous que pot tenir una dada importada/sincronitzada.
  function truthyField(o,keys){return !!keys.some(k=>o && (o[k]===true || o[k]===1 || o[k]==='true' || o[k]==='1' || o[k]==='yes'))}
  function trialPaid(j){return truthyField(j,['cobrament','cobrat','paid','pagat','cobramentCobrat','cobratJudici'])}
  function trialHeld(j){return truthyField(j,['celebrat','held','celebratJudici','realitzat','fet'])}
  function trialTime(j){const t=String(j?.hora||j?.time||j?.horaJudici||'').trim();if(!t)return '';return t.replace(/^([0-2]\d):([0-5]\d)$/, '$1.$2h')}
  function trialDate(j){
    const raw=j?.data||j?.date||j?.dataJudici||'';
    if(!raw)return '';
    const s=String(raw);
    const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m){const d=new Date(+m[1],+m[2]-1,+m[3]);return dayLabel(d)}
    const d=new Date(raw);return isNaN(d)?s:dayLabel(d);
  }
  function trialDetail(j){
    const parts=[];
    const court=j?.jutjat||j?.court||j?.tribunal||'';
    const room=j?.sala||j?.room||'';
    const proc=j?.procediment||j?.proc||j?.procedimentJudicial||'';
    const agents=j?.agents||j?.agentsCitatsa||j?.agent||'';
    if(court)parts.push(String(court));
    if(room)parts.push(`sala ${String(room)}`);
    if(proc)parts.push(`dil. ${String(proc)}`);
    if(agents)parts.push(String(agents));
    return parts.join(', ');
  }
  function renderTrialRow(j,i,pendingLabel){
    const top=['⚖️',trialDate(j),trialTime(j)].filter(Boolean).join(' ');
    const detail=trialDetail(j)||pendingLabel||'';
    return `<div class="row" onclick="openTrial(${i})" style="cursor:pointer"><div class="grow"><strong>${esc(top)}</strong><small>${esc(detail)}</small></div><span class="chip warn">Per cobrar</span></div>`;
  }

  function specialMarked(r){return truthyField(r,['pagamentEspecial','cobramentEspecial','cobroEspecial','cobramentEspecial','specialPayment','paymentSpecial'])}
  function specialPaid(r){return truthyField(r,['pagamentEspecialCobrat','cobramentEspecialCobrat','cobroEspecialCobrat','specialPaymentPaid','paymentSpecialPaid'])}

  function addSpecialFields(){
    if(document.getElementById('specialPayFields'))return;
    const work=document.getElementById('workFields'); if(!work)return;
    const wrap=document.createElement('div');wrap.id='specialPayFields';
    wrap.innerHTML='<div class="check"><input type="checkbox" id="daySpecialPay"><label for="daySpecialPay">Aquest dia té cobrament especial</label></div><div class="check" id="daySpecialPaidWrap" style="display:none"><input type="checkbox" id="daySpecialPaid"><label for="daySpecialPaid">Cobrament especial cobrat</label></div>';
    work.appendChild(wrap);
    const special=document.getElementById('daySpecialPay'),paidWrap=document.getElementById('daySpecialPaidWrap');
    special.addEventListener('change',function(){paidWrap.style.display=this.checked?'block':'none';if(!this.checked)document.getElementById('daySpecialPaid').checked=false;});
  }

  function patchDay(){
    addSpecialFields();
    if(!window.openDay||window.__homeDayPatched)return;
    const originalOpen=window.openDay;
    window.openDay=function(k){
      originalOpen.apply(this,arguments);
      setTimeout(function(){
        const st=S(),r=st?.registres?.[k]||{};
        const special=document.getElementById('daySpecialPay'),paid=document.getElementById('daySpecialPaid'),wrap=document.getElementById('daySpecialPaidWrap');
        if(special){special.checked=specialMarked(r);if(wrap)wrap.style.display=special.checked?'block':'none'}
        if(paid)paid.checked=specialPaid(r);
      },0);
    };
    if(window.saveDay){
      const originalSave=window.saveDay;
      window.saveDay=function(){
        const special=!!document.getElementById('daySpecialPay')?.checked;
        const paid=special&&!!document.getElementById('daySpecialPaid')?.checked;
        originalSave.apply(this,arguments);
        const st=S(),k=typeof editingDay!=='undefined'?editingDay:null;
        if(k!=null&&st?.registres?.[k]){
          st.registres[k].pagamentEspecial=special;
          st.registres[k].pagamentEspecialCobrat=paid;
          try{save()}catch(e){}
          try{renderAll()}catch(e){}
        }
        setTimeout(function(){renderPendingOnly();renderUpcomingOnly()},50);
      };
    }
    window.__homeDayPatched=true;
  }

  function renderDayIconRow(k,r,clickable=true){
    const d=typeof parseKey==='function'?parseKey(k):null;const label=dayLabel(d)||k;const icon=iconLabel(r);const obs=observation(r);if(!icon)return '';
    return `<div class="row" ${clickable?`onclick="openDay('${k}')" style="cursor:pointer"`:''}><div class="grow"><strong>${esc(icon)} ${esc(label)}</strong><small>${esc(obs||'')}</small></div></div>`;
  }
  function renderTodayExtras(){
    const st=S(),box=document.getElementById('todayCard');if(!st||!box||typeof todayKey!=='function')return;
    const old=box.querySelector('[data-home-today-extra]');if(old)old.remove();const k=todayKey(),r=st.registres?.[k];if(!r?.noteIcon)return;const html=renderDayIconRow(k,r,false);if(!html)return;
    const wrap=document.createElement('div');wrap.setAttribute('data-home-today-extra','1');wrap.innerHTML='<div class="card-title">Avui</div>'+html;box.appendChild(wrap);
  }
  function renderUpcomingOnly(){
    const st=S(),box=document.getElementById('upcoming');if(!st||!box||typeof todayKey!=='function')return;const today=todayKey();
    const trials=(Array.isArray(st.judicis)?st.judicis:[]).map((j,i)=>({...j,i})).filter(j=>{const d=j.data||j.date||j.dataJudici;return d&&String(d)>today&&!trialHeld(j)}).sort((a,b)=>String(a.data||a.date||'').localeCompare(String(b.data||b.date||''))).slice(0,5);
    const icons=[];for(let i=1;i<61;i++){const d=new Date();d.setDate(d.getDate()+i);const k=typeof key==='function'?key(d):'';const r=st.registres?.[k];if(r?.noteIcon)icons.push({d,k,r})}
    let html=trials.map(j=>{const top=['⚖️',trialDate(j),trialTime(j)].filter(Boolean).join(' ');return `<div class="row" onclick="openTrial(${j.i})"><div class="grow"><strong>${esc(top)}</strong><small>${esc(trialDetail(j))}</small></div><span class="chip ${trialPaid(j)?'ok':'warn'}">${trialPaid(j)?'Cobrat':'Pendent'}</span></div>`}).join('');
    html+=icons.slice(0,5).map(o=>renderDayIconRow(o.k,o.r,true)).join('');box.innerHTML=html||'<div class="empty">No hi ha judicis ni dies programats.</div>';
  }
  function renderPendingOnly(){
    const st=S(),box=document.getElementById('alerts');if(!st||!box)return;const items=[];
    const trials=Array.isArray(st.judicis)?st.judicis:[];
    trials.forEach((j,i)=>{if(trialHeld(j)&&!trialPaid(j))items.push(renderTrialRow(j,i,'Pendent de cobrament'))});
    Object.entries(st.registres||{}).forEach(([k,r])=>{
      if(specialMarked(r)&&!specialPaid(r)){
        const d=typeof parseKey==='function'?parseKey(k):null;const label=dayLabel(d)||k;const obs=observation(r);
        items.push(`<div class="row" onclick="openDay('${k}')" style="cursor:pointer"><div class="grow"><strong>💶 ${esc(label)}</strong><small>${esc(obs||'Cobrament especial pendent')}</small></div><span class="chip warn">Per cobrar</span></div>`);
      }
    });
    box.innerHTML=items.length?items.join(''):'<div class="empty">Tot al dia.</div>';
  }

  function patchHome(){
    if(window.renderHome&&!window.__homeSectionsPatched){
      const original=window.renderHome;
      window.renderHome=function(){original.apply(this,arguments);renderUpcomingOnly();renderPendingOnly();setTimeout(renderTodayExtras,0)};
      window.__homeSectionsPatched=true;
    }
    renderUpcomingOnly();renderPendingOnly();setTimeout(renderTodayExtras,0);
  }
  function refresh(){try{addSpecialFields();patchDay();patchHome()}catch(e){}}
  function boot(){refresh();setTimeout(refresh,100);setTimeout(refresh,500);setTimeout(refresh,1500);setTimeout(refresh,3000);setTimeout(refresh,6000);setInterval(function(){refresh()},5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
