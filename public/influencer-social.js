import {content} from './content.js?v=section-order-3';
// Reuse homepage navigation data and styles without initializing homepage animations.
const nav=document.querySelector('#case-navigation');
const pill=document.createElement('span');pill.className='navigation-active-pill';pill.ariaHidden='true';nav.append(pill);
for(const item of content.navigation){const link=document.createElement('a');link.className='navigation-item';link.href=`./${item.target}`;link.textContent=item.label;if(item.target==='#work-preview')link.setAttribute('aria-current','location');nav.append(link);}
function placePill(){const link=nav.querySelector('[aria-current]');nav.style.setProperty('--active-left',`${link.offsetLeft}px`);nav.style.setProperty('--active-width',`${link.offsetWidth}px`);}
new ResizeObserver(placePill).observe(nav);document.fonts.ready.then(placePill);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

const rail = document.querySelector('.rail');
const [previous, next] = document.querySelectorAll('.arrows button');
function step(direction) {
  const pitch = rail.children[1].offsetLeft - rail.children[0].offsetLeft;
  rail.scrollBy({left: direction * pitch, behavior: reduced.matches ? 'instant' : 'smooth'});
}
function syncControls() {
  previous.disabled = rail.scrollLeft <= 1;
  next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1;
}
previous.onclick = () => step(-1);
next.onclick = () => step(1);
rail.addEventListener('scroll', syncControls, {passive:true});
new ResizeObserver(syncControls).observe(rail);
rail.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  step(event.key === 'ArrowLeft' ? -1 : 1);
});
let drag;
rail.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0) return;
  drag = {x:event.clientX, left:rail.scrollLeft};
  rail.classList.add('dragging');
  rail.setPointerCapture(event.pointerId);
});
rail.addEventListener('pointermove', event => {
  if (drag) rail.scrollLeft = drag.left + drag.x - event.clientX;
});
rail.addEventListener('lostpointercapture', () => {
  drag = null;
  rail.classList.remove('dragging');
});

const reveal = new IntersectionObserver(entries => {
  let sequence = 0;
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    if (!reduced.matches) {
      entry.target.style.setProperty('--enter-delay', Math.min(sequence++, 3) * 45 + 'ms');
      entry.target.classList.add('enter-once');
    }
    reveal.unobserve(entry.target);
  }
}, {threshold: 0.12});
document.querySelectorAll('main section h2, .organic h3, .impressions, .secondary-results, .ring .metrics > div, .distribution').forEach(node => reveal.observe(node));
