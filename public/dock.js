export function createSharedDock({reduceMotion, mount = document.body, sources = document.querySelector('#dock-contact-icons').content}) {
  const root=document.createElement('div');
  root.className='shared-dock';root.setAttribute('role','group');root.setAttribute('aria-label','macOS Dock');
  const systems=document.createElement('div');systems.className='dock-systems';root.append(systems);
  const apps=['RedNote','WhatsApp','LinkedIn','Finder','WeChat','Outlook','Notion'];
  for(const name of apps){
    const slot=name==='Finder' ? document.createElement('div') : sources.querySelector(`[aria-label="${name}"]`).cloneNode(true);
    slot.className='dock-slot';slot.dataset.app=name.toLowerCase();
    const visual=document.createElement('span');visual.className='dock-visual';
    if(name==='Finder') visual.innerHTML='<img src="./assets/dock/finder.png" alt="Finder" draggable="false">';
    else visual.append(slot.querySelector('.contact-art'));
    slot.append(visual);systems.append(slot);
  }
  mount.append(root);
  const destinations={rednote:'https://xhslink.cn/o/23OcevUExeD',whatsapp:'https://wa.me/8619111305492',linkedin:'https://www.linkedin.com/in/nicole-xu1',outlook:'mailto:nicolexxu1@outlook.com'};
  if (mount === document.body) {
    destinations.finder = '#work-preview';
    destinations.notion = 'https://educated-hide-c1b.notion.site/Nicole-Xu-41685c3fcce9816ebacdca8f70abb6d2?source=copy_link';
  }
  for(const [app,url] of Object.entries(destinations)){
    const button=root.querySelector(`[data-app="${app}"]`),link=document.createElement('a');
    for(const attr of button.attributes) if(!['type','aria-disabled','title'].includes(attr.name))link.setAttribute(attr.name,attr.value);
    link.href=url;if(url.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}
    link.append(...button.childNodes);button.replaceWith(link);
  }
  const wechat=root.querySelector('[data-app="wechat"]');wechat.removeAttribute('aria-disabled');wechat.title='Copy WeChat ID';
  const feedback=document.createElement('div');feedback.className='dock-copy-feedback';feedback.setAttribute('role','status');feedback.hidden=true;root.append(feedback);
  let feedbackTimer;
  wechat.addEventListener('click',async()=>{
    clearTimeout(feedbackTimer);
    try {await navigator.clipboard.writeText('nicolexu77');feedback.textContent='已复制';feedback.hidden=false;feedbackTimer=setTimeout(()=>feedback.hidden=true,2200);}
    catch {feedback.replaceChildren();const label=document.createElement('label');label.textContent='复制失败，请手动复制 ';const field=document.createElement('input');field.value='nicolexu77';field.readOnly=true;field.setAttribute('aria-label','WeChat ID');label.append(field);feedback.append(label);feedback.hidden=false;field.focus();field.select();}
  });
  const slots=[...root.querySelectorAll('.dock-slot')];
  let pointer=null, frame=0, locked=false;
  function reset(){pointer=null;slots.forEach(slot=>{slot.style.setProperty('--dock-scale',1);slot.style.setProperty('--dock-shift','0px');});}
  function magnify(){
    frame=0;if(!pointer||locked||reduceMotion.matches)return;
    const visible=slots;
    const weights=visible.map(slot=>{const rect=slot.getBoundingClientRect();const distance=Math.abs(pointer-(rect.left+rect.width/2));return Math.exp(-Math.pow(distance/72,2))*(innerHeight<=840?.35:.55);});
    const extras=weights.map(w=>w*(innerHeight<=840?34:44)),total=extras.reduce((a,b)=>a+b,0);let accumulated=0;
    visible.forEach((slot,i)=>{slot.style.setProperty('--dock-scale',1+weights[i]);slot.style.setProperty('--dock-shift',`${accumulated+extras[i]/2-total/2}px`);accumulated+=extras[i];});
  }
  root.addEventListener('pointermove',event=>{if(event.pointerType==='touch')return;pointer=event.clientX;if(!frame)frame=requestAnimationFrame(magnify);});
  root.addEventListener('pointerleave',reset);
  reduceMotion.addEventListener('change',reset);
  return {root, finder:systems.querySelector('[data-app="finder"] img'),
    update(heroProgress){
      locked=heroProgress>.08&&heroProgress<1;
      if(locked)reset();
      if(frame===0&&pointer)frame=requestAnimationFrame(magnify);
    }
  };
}
