import {content} from './content.js?v=section-order-3';
import {cosoriCase} from './gtm-cosori-data.js?v=final-copy-1';
// Reuse homepage navigation data and styles without initializing homepage animations.
const nav=document.querySelector('#case-navigation');
const pill=document.createElement('span');pill.className='navigation-active-pill';pill.ariaHidden='true';nav.append(pill);
for(const item of content.navigation){const link=document.createElement('a');link.className='navigation-item';link.href=`./${item.target}`;link.textContent=item.label;if(item.target==='#work-preview')link.setAttribute('aria-current','location');nav.append(link);}
function placePill(){const link=nav.querySelector('[aria-current]');nav.style.setProperty('--active-left',`${link.offsetLeft}px`);nav.style.setProperty('--active-width',`${link.offsetWidth}px`);}
new ResizeObserver(placePill).observe(nav);document.fonts.ready.then(placePill);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const asset=file=>`./assets/gtm-cosori/${file}`;
const stack = document.querySelector('#gtm-strategy-cards');
const cards = [...stack.querySelectorAll('.gtm-stack-card')];
const header = document.querySelector('.site-header');
let frame = 0;
let stages = [];

function measureStack() {
  const base = Math.max(115, header.getBoundingClientRect().bottom + 16);
  let offset = 0;
  stages = cards.map((card, index) => {
    const row = card.parentElement;
    // Tall cards scroll until their final line is visible before they pin.
    const pin = Math.min(base + index * Math.min(38, innerHeight * .04),
                         innerHeight - card.offsetHeight - 24);
    row.style.setProperty('--pin-top', pin + 'px');
    const start = offset - pin;
    offset += row.offsetHeight;
    return {card, start, length: row.offsetHeight};
  });
  stack.style.setProperty('--last-row-height', stages[stages.length - 1].length + 'px');
  schedule();
}

function drawStack() {
  frame = 0;
  const travel = -stack.getBoundingClientRect().top;
  stages.forEach(({card, start, length}, index) => {
    const progress = Math.max(0, Math.min(1, (travel - start) / length));
    const scale = reduced.matches ? 1 : 1 - (cards.length - index) * .035 * progress;
    card.style.setProperty('--scale', scale);
  });
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(drawStack);
}
const stackObserver = new ResizeObserver(measureStack);
cards.forEach(card => stackObserver.observe(card));
stackObserver.observe(header);
addEventListener('scroll', schedule, {passive:true});
addEventListener('resize', measureStack);
reduced.addEventListener('change', measureStack);
measureStack();
const names=['Countdown','Event','Press & creators','Follow-up email'];const tabs=document.querySelector('.gtm-stages');
tabs.innerHTML=names.map((n,i)=>`<button type="button" role="tab" id="tab-${n.toLowerCase().replace(' & ', '-').replace(' ','-')}" aria-controls="panel-${n.toLowerCase().replace(' & ', '-').replace(' ','-')}" aria-selected="${i===0}" tabindex="${i===0?0:-1}">${n}</button>`).join('');
const tabButtons=[...tabs.children];let panelAnimation;
function selectTab(i,focus=false){panelAnimation?.cancel();tabButtons.forEach((b,j)=>{const active=i===j;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=!active;});const panel=document.getElementById(tabButtons[i].getAttribute('aria-controls'));if(!reduced.matches)panelAnimation=panel.animate([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:190,easing:'ease-out'});if(focus)tabButtons[i].focus();}
tabButtons.forEach((b,i)=>{b.addEventListener('click',()=>selectTab(i));b.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%names.length;if(e.key==='ArrowLeft')next=(i+names.length-1)%names.length;if(e.key==='Home')next=0;if(e.key==='End')next=names.length-1;if(next!==undefined){e.preventDefault();selectTab(next,true);}});});
const days = [57, 62, 58, 64, 63];
const carousel = document.querySelector('.gtm-carousel');
const track = carousel.querySelector('.gtm-countdown-track');
const dayTabs = document.querySelector('.gtm-countdown-tabs');
let day = 0;
let gesture = null;
dayTabs.innerHTML = days.map((_, i) => `<button type="button">T−${5-i}</button>`).join('');
track.innerHTML = days.map((id, i) =>
  `<figure class="gtm-countdown-card"><img draggable="false" src="${asset('img'+id+'.jpg')}" alt="COSORI countdown artwork for T−${5-i}"></figure>`
).join('');

function markDay(index) {
  day = Math.max(0, Math.min(days.length - 1, index));
  [...dayTabs.children].forEach((button, i) => button.setAttribute('aria-pressed', i === day));
  [...track.children].forEach((card, i) => card.classList.toggle('is-selected', i === day));
}
function centerOffset(index) {
  const card = track.children[index];
  return (carousel.clientWidth - card.offsetWidth) / 2 - card.offsetLeft;
}
function snapDay(index) {
  gesture = null;
  carousel.classList.remove('is-dragging');
  markDay(index);
  track.style.transform = `translateX(${centerOffset(day)}px)`;
}
[...dayTabs.children].forEach((button, i) => button.onclick = () => snapDay(i));
carousel.addEventListener('keydown', event => {
  const target = {ArrowLeft: day - 1, ArrowRight: day + 1, Home: 0, End: days.length - 1}[event.key];
  if (target !== undefined) {
    event.preventDefault();
    snapDay(target);
  }
});
carousel.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return;
  const offset = track.getBoundingClientRect().left - carousel.getBoundingClientRect().left;
  gesture = {id: event.pointerId, start: event.clientX, offset};
  carousel.setPointerCapture(event.pointerId);
  carousel.classList.add('is-dragging');
  track.style.transform = `translateX(${offset}px)`;
});
carousel.addEventListener('pointermove', event => {
  if (!gesture || event.pointerId !== gesture.id) return;
  const raw = gesture.offset + event.clientX - gesture.start;
  const bounded = Math.max(centerOffset(days.length - 1), Math.min(centerOffset(0), raw));
  track.style.transform = `translateX(${bounded + (raw - bounded) * .22}px)`;
  markDay(Math.round((centerOffset(0) - bounded) / (centerOffset(0) - centerOffset(1))));
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  carousel.addEventListener(type, event => {
    if (gesture && gesture.id === event.pointerId) snapDay(day);
  });
}
new ResizeObserver(() => { if (carousel.clientWidth) snapDay(day); }).observe(carousel);
snapDay(0);
document.querySelector('.gtm-feed').innerHTML=[218,219,225,226,227,228].map((n,i)=>`<img src="${asset(`img${n}.jpg`)}" alt="COSORI campaign feed tile ${i+1}" loading="lazy">`).join('');
for(const item of cosoriCase.outcomes){const block=document.createElement('div');for(const [tag,text] of [['h3',item.title],['p',item.detail],['small',item.note]]){const node=document.createElement(tag);node.textContent=text;block.append(node);}document.querySelector('#gtm-results').append(block);}
