import {content} from './content.js?v=section-order-3';
// Reuse homepage navigation data and styles without initializing homepage animations.
const nav=document.querySelector('#case-navigation');
const pill=document.createElement('span');pill.className='navigation-active-pill';pill.ariaHidden='true';nav.append(pill);
for(const item of content.navigation){const link=document.createElement('a');link.className='navigation-item';link.href=`./${item.target}`;link.textContent=item.label;if(item.target==='#work-preview')link.setAttribute('aria-current','location');nav.append(link);}
function placePill(){const link=nav.querySelector('[aria-current]');nav.style.setProperty('--active-left',`${link.offsetLeft}px`);nav.style.setProperty('--active-width',`${link.offsetWidth}px`);}
new ResizeObserver(placePill).observe(nav);document.fonts.ready.then(placePill);

const ecosystem = document.querySelector('.ecosystem');
const stage = ecosystem.querySelector('.experience-stage');
const track = stage.querySelector('.screen-track');
// As on the homepage, each text unit has its own eased share of the reading range.
const clamp = value => Math.max(0, Math.min(1, value));
const readings = Array.from(document.querySelectorAll('.pm-headline, .feature-list h3'), heading => {
  const words = heading.textContent.split(/(\s+)/).map(part => {
    if (!part.trim()) return document.createTextNode(part);
    const word = document.createElement('span');
    word.textContent = part;
    word.className = 'read-word';
    return word;
  });
  heading.replaceChildren(...words);
  const panel = heading.closest('.feature-pair, .experience-stage, .pm-section');
  const evidence = panel.querySelector(':scope > .market-evidence, :scope > .proof-grid');
  return {panel, evidence, range: panel.parentElement, words: Array.from(heading.children)};
});
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let frame = 0;
function renderScreens() {
  frame = 0;
  if (!reducedMotion.matches) {
    for (const {panel, evidence, range, words} of readings) {
      const top = parseFloat(getComputedStyle(panel).top);
      const travel = range.offsetHeight - panel.offsetHeight;
      const progress = Number.isFinite(top) && travel > 0
        ? clamp((top - range.getBoundingClientRect().top) / travel)
        : 1;
      const titleProgress = evidence ? clamp(progress / .65) : progress;
      if (evidence) {
        const reveal = clamp((progress - .65) / .27);
        panel.style.setProperty('--evidence-opacity', reveal * reveal * (3 - 2 * reveal));
      }
      words.forEach((word, index) => {
        const amount = clamp((titleProgress * (words.length + .8) - index) / 1.05);
        const eased = amount * amount * (3 - 2 * amount);
        word.style.setProperty('--read', `${eased * 100}%`);
      });
    }
  }
  if (getComputedStyle(stage).position !== 'sticky') return;
  const distance = ecosystem.offsetHeight - stage.offsetHeight;
  const progress = Math.min(1, Math.max(0,
    (parseFloat(getComputedStyle(stage).top) - ecosystem.getBoundingClientRect().top) / distance));
  const position = progress * (track.children.length - 1);
  const transition = Math.min(1, Math.max(0, (position % 1 - .18) / .64));
  const eased = transition * transition * (3 - 2 * transition);
  track.style.setProperty('--screen-offset', `${-100 * (Math.floor(position) + eased)}%`);
}
function scheduleRender() {
  if (!frame) frame = requestAnimationFrame(renderScreens);
}
reducedMotion.addEventListener('change', scheduleRender);
window.addEventListener('resize', scheduleRender);
window.addEventListener('scroll', scheduleRender, {passive:true});
new ResizeObserver(scheduleRender).observe(stage);
scheduleRender();
