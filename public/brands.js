const section = document.querySelector('#brands');
const stage = section.querySelector('.brands-stage');
const carousel = section.querySelector('.brands-carousel');
const cards = [...section.querySelectorAll('.brand-card')];
const status = section.querySelector('#brands-current');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const count = cards.length;
const indicators = [...section.querySelectorAll('[data-brand-index]')];
const mod = (n, m) => ((n % m) + m) % m;
const clamp = n => Math.max(0, Math.min(1,n));
const smooth = n => n*n*(3-2*n);
let position = 2, target = 2, frame = 0, scrollPhase = 0, lastScrollPhase = 0;
let drag = null, wheelTimer;
function announce() { status.textContent = cards[mod(Math.round(target),count)].getAttribute('aria-label'); }
function paint() {
  indicators.forEach((button,index)=>button.setAttribute('aria-current',String(index===mod(Math.round(position),count))));
  const top = section.getBoundingClientRect().top;
  const spread = reduced.matches ? 1 : smooth(clamp((innerHeight*.3-top)/(innerHeight*.35)));
  const width = cards[0].offsetWidth;
  const gap = width+50;
  const radius = carousel.clientWidth * .88;
  const centerY = Math.min(stage.clientHeight*.63,stage.clientHeight-205);
  cards.forEach((card,index) => {
    // Recycle only beyond the clipped left/right edges, preserving the eight-brand order.
    const distance = mod(index-position+count/2,count)-count/2;
    const angle = distance*gap/radius;
    const x = distance*20*(1-spread) + Math.sin(angle)*radius*spread;
    const y = centerY + (1-Math.cos(angle))*radius*spread + (1-spread)*(Math.abs(distance)*4);
    const rotation = distance*3*(1-spread) + angle*180/Math.PI*spread;
    card.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rotation}deg)`;
    card.style.zIndex = String(10-Math.round(Math.abs(distance)*2));
  });
}
function tick() {
  frame = 0;
  const difference = target-position;
  position = reduced.matches || Math.abs(difference)<.001 ? target : position+difference*.18;
  paint();
  if (position!==target) frame=requestAnimationFrame(tick);
}
function schedule() { if (!frame) frame=requestAnimationFrame(tick); }
function scroll() {
  const top=section.getBoundingClientRect().top;
  scrollPhase=clamp(-top/Math.max(1,section.offsetHeight-innerHeight))*1.65;
  target+=scrollPhase-lastScrollPhase;
  lastScrollPhase=scrollPhase;
  schedule();
}
function step(direction) { target=Math.round(target)+direction; announce(); schedule(); }
indicators.forEach(button=>button.addEventListener('click',()=>{
  const current=mod(Math.round(target),count);
  step(mod(Number(button.dataset.brandIndex)-current+count/2,count)-count/2);
}));
carousel.addEventListener('keydown',event=>{
  if (event.key==='ArrowLeft'||event.key==='ArrowRight') {event.preventDefault();step(event.key==='ArrowRight'?1:-1);}
});
carousel.addEventListener('pointerdown',event=>{
  if (event.button!==0 || event.target.closest('.brand-explore')) return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,start:target,moved:false};
  carousel.setPointerCapture(event.pointerId);
});
carousel.addEventListener('pointermove',event=>{
  if (!drag||event.pointerId!==drag.id) return;
  const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
  if (!drag.moved&&Math.abs(dx)<Math.max(6,Math.abs(dy)*1.15)) return;
  drag.moved=true;carousel.classList.add('is-dragging');
  target=drag.start-dx/(cards[0].offsetWidth+50);
  if (!reduced.matches) position=target;
  schedule();
});
function release(event) {
  if (!drag||event.pointerId!==drag.id) return;
  if (drag.moved) target=Math.round(target);
  drag=null;carousel.classList.remove('is-dragging');announce();schedule();
}
carousel.addEventListener('pointerup',release);
carousel.addEventListener('pointercancel',release);
carousel.addEventListener('lostpointercapture',release);
carousel.addEventListener('wheel',event=>{
  // Vertical wheel input remains native page scrolling; horizontal gestures browse indefinitely.
  const horizontal=Math.abs(event.deltaX)>Math.abs(event.deltaY)||event.shiftKey;
  if (!horizontal) return;
  event.preventDefault();
  const unit=event.deltaMode===1?16:event.deltaMode===2?innerWidth:1;
  target+=(event.shiftKey?event.deltaY:event.deltaX)*unit/(cards[0].offsetWidth+50);
  schedule();clearTimeout(wheelTimer);
  wheelTimer=setTimeout(()=>{target=Math.round(target);announce();schedule();},160);
},{passive:false});
addEventListener('scroll',scroll,{passive:true});
addEventListener('resize',schedule);
reduced.addEventListener('change',schedule);
scroll();announce();
