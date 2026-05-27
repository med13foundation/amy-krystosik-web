(function(root){
  const CALENDLY_BASE='https://calendly.com/amykrystosik/30min';

  function buildCalendlyNote(values){
    const type=(values.type||'').trim();
    const org=(values.org||'').trim();
    const detail=(values.detail||'').trim();
    const lines=['What I need: '+type];
    if(org) lines.push('Organization: '+org);
    if(detail) lines.push('Decision & deadline: '+detail);
    return lines.join('\n');
  }

  function buildCalendlyHref(values){
    const name=(values.name||'').trim();
    const note=buildCalendlyNote(values);
    const params=[];
    if(name) params.push('name='+encodeURIComponent(name));
    params.push('a1='+encodeURIComponent(note));
    return CALENDLY_BASE+'?'+params.join('&');
  }

  function fieldValue(doc,id){
    const field=doc.getElementById(id);
    return field ? field.value.trim() : '';
  }

  function initReveal(doc){
    const items=doc.querySelectorAll('.reveal');
    if(!root.IntersectionObserver){
      items.forEach(function(el){el.classList.add('in');});
      return;
    }
    const obs=new root.IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    },{threshold:0.12,rootMargin:'0px 0px -40px 0px'});
    items.forEach(function(el){obs.observe(el);});
  }

  function initIntakeForm(doc){
    const form=doc.getElementById('intakeForm');
    if(!form) return;

    form.addEventListener('submit',function(ev){
      ev.preventDefault();
      if(!form.reportValidity()) return;

      const values={
        name:fieldValue(doc,'f-name'),
        org:fieldValue(doc,'f-org'),
        type:fieldValue(doc,'f-type'),
        detail:fieldValue(doc,'f-detail')
      };

      root.location.href=buildCalendlyHref(values);
    });
  }

  function init(doc){
    initReveal(doc);
    initIntakeForm(doc);
  }

  root.IntakePage={
    buildCalendlyHref:buildCalendlyHref,
    buildCalendlyNote:buildCalendlyNote,
    initIntakeForm:initIntakeForm,
    initReveal:initReveal,
    init:init
  };

  if(typeof document!=='undefined'){
    init(document);
  }
})(typeof window!=='undefined' ? window : globalThis);
