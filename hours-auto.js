/* Càlcul automàtic de les hores reals a partir d'Entrada i Sortida. */
(function(){
  function minutes(value){
    if(!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
    const parts=value.split(':').map(Number);
    return parts[0]*60+parts[1];
  }

  function calculateDayHours(){
    const start=document.getElementById('dayStart');
    const end=document.getElementById('dayEnd');
    const hours=document.getElementById('dayHours');
    if(!start||!end||!hours) return;

    const a=minutes(start.value), b=minutes(end.value);
    if(a===null||b===null){
      hours.value='';
      if(typeof window.updateHint==='function') window.updateHint();
      return;
    }

    let diff=b-a;
    if(diff<0) diff+=24*60; // torn nocturn que passa per mitjanit

    hours.value=(diff/60).toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1');
    if(typeof window.updateHint==='function') window.updateHint();
  }

  function install(){
    const start=document.getElementById('dayStart');
    const end=document.getElementById('dayEnd');
    const hours=document.getElementById('dayHours');
    if(!start||!end||!hours) return;

    start.addEventListener('input',calculateDayHours);
    start.addEventListener('change',calculateDayHours);
    end.addEventListener('input',calculateDayHours);
    end.addEventListener('change',calculateDayHours);

    // Les hores passen a ser automàtiques: no cal escriure-les a mà.
    hours.readOnly=true;
    hours.setAttribute('aria-readonly','true');
    hours.title='Calculades automàticament a partir de l\'entrada i la sortida';

    if(typeof window.shiftChanged==='function' && !window.__autoHoursShiftWrapped){
      const original=window.shiftChanged;
      window.shiftChanged=function(){
        original.apply(this,arguments);
        calculateDayHours();
      };
      window.__autoHoursShiftWrapped=true;
    }

    // En obrir un registre existent, recalcula també les hores segons els horaris guardats.
    if(start.value && end.value) calculateDayHours();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();
