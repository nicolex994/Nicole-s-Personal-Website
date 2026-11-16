import {content} from './content.js?v=section-order-3';
// Reuse homepage navigation data and styles without initializing homepage animations.
const nav=document.querySelector('#case-navigation');
const pill=document.createElement('span');pill.className='navigation-active-pill';pill.ariaHidden='true';nav.append(pill);
for(const item of content.navigation){const link=document.createElement('a');link.className='navigation-item';link.href=`./${item.target}`;link.textContent=item.label;if(item.target==='#work-preview')link.setAttribute('aria-current','location');nav.append(link);}
function placePill(){const link=nav.querySelector('[aria-current]');nav.style.setProperty('--active-left',`${link.offsetLeft}px`);nav.style.setProperty('--active-width',`${link.offsetWidth}px`);}
new ResizeObserver(placePill).observe(nav);document.fonts.ready.then(placePill);
const comparison=document.querySelector('.comparison-view');
const range=comparison.querySelector('input');
function setSplit(value){range.value=value;comparison.style.setProperty('--split',`${value}%`);range.setAttribute('aria-valuetext',`${Math.round(value)}% Before, ${Math.round(100-value)}% After`);}
range.addEventListener('input',()=>setSplit(range.value));
// Pointer capture keeps dragging continuous outside the handle. Vertical touch scroll remains available.
function splitAt(event){const box=comparison.getBoundingClientRect();setSplit(Math.max(0,Math.min(100,(event.clientX-box.left)/box.width*100)));}
range.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();range.setPointerCapture(event.pointerId);splitAt(event);});
range.addEventListener('pointermove',event=>{if(range.hasPointerCapture(event.pointerId))splitAt(event);});
range.addEventListener('pointerup',event=>{if(range.hasPointerCapture(event.pointerId))range.releasePointerCapture(event.pointerId);});
setSplit(50);
// Monthly sheets, 2024. Dated entries use the Levoit fill identified by Calender-V1!P1.
// Product focus comes from the explicitly named Levoit line in each monthly sheet.
const months = [
  {products:'Tower fans and circulating fans', entries:{
    1:'Summer Day · Tower fan and circulating fan showcase',
    13:'Tips for parents and students · Baby air purifier',
    20:'New product · HVAC filter launch',
    27:'Educational content · Entry-level air purifiers'
  }},
  {products:'Core and Vital air purifiers, baby air purifiers, and humidifiers', entries:{
    4:'National Wildlife Day · Purifier showcase and education',
    10:'Starting Fresh · Snowball humidifier preview',
    18:'Educational content · Humidifiers',
    25:'Snowball humidifier countdown · Day 5',26:'Snowball humidifier countdown · Day 4',
    27:'Snowball humidifier countdown · Day 3',28:'Snowball humidifier countdown · Day 2',
    29:'Snowball humidifier countdown · Day 1',30:'Snowball humidifier launch'
  }},
  {products:'Vacuums and air purifiers', entries:{
    7:'Child Health Day · Air purifier education',12:'Sprout purifier countdown · Day 3',
    13:'Sprout purifier countdown · Day 2',14:'Sprout purifier countdown · Day 1',
    15:'New product · Sprout purifier launch',22:'National Women’s Small Business · Vacuum showcase'
  }},
];
const grid = document.querySelector('#grid');
const detail = document.querySelector('#selection');
const formatter = new Intl.DateTimeFormat('en-US', {month:'long',year:'numeric'});
let monthIndex = 0;
let activeDate;
function dismiss() {
  activeDate?.removeAttribute('aria-describedby');
  activeDate = null;
  detail.hidden = true;
}
function showDate(cell, day) {
  if (activeDate === cell) return;
  dismiss();
  activeDate = cell;
  detail.textContent = new Date(2024, monthIndex + 7, day).toLocaleDateString('en-US', {month:'short', day:'numeric'}) + ' · ' + months[monthIndex].entries[day];
  detail.hidden = false;
  cell.setAttribute('aria-describedby', detail.id);
  positionDetail();
}
function positionDetail() {
  if (!activeDate) return;
  const anchor = activeDate.getBoundingClientRect();
  const viewport = scroller.getBoundingClientRect();
  if (anchor.right <= viewport.left || anchor.left >= viewport.right) {
    dismiss();
    return;
  }
  const parent = detail.offsetParent.getBoundingClientRect();
  const x = Math.max(8, Math.min(anchor.left - parent.left + anchor.width / 2 - detail.offsetWidth / 2, parent.width - detail.offsetWidth - 8));
  detail.style.left = x + 'px';
  detail.style.top = (anchor.top - parent.top - detail.offsetHeight - 4) + 'px';
  detail.style.transformOrigin = (anchor.left - parent.left + anchor.width / 2 - x) + 'px bottom';
}
document.addEventListener('pointerdown', event => {
  if (!grid.contains(event.target) || !event.target.closest('button')) dismiss();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });
window.addEventListener('resize', dismiss);
// Short labels summarize the corresponding full entries shown in the tooltip.
const previews = [
  {1:['Fan showcase','showcase'],13:['Baby air purifier','education'],20:['HVAC filter launch','launch'],27:['Air purifier education','education']},
  {4:['Wildlife Day','occasion'],10:['Snowball preview','preview'],18:['Humidifier education','education'],
   25:['Countdown · Day 5','countdown'],26:['Countdown · Day 4','countdown'],27:['Countdown · Day 3','countdown'],
   28:['Countdown · Day 2','countdown'],29:['Countdown · Day 1','countdown'],30:['Snowball launch','launch']},
  {7:['Child Health Day','occasion'],12:['Sprout · Day 3','countdown'],13:['Sprout · Day 2','countdown'],
   14:['Sprout · Day 1','countdown'],15:['Sprout launch','launch'],22:['Vacuum showcase','showcase']}
];
const switcher = document.querySelector('.month-switch');
const scroller = document.querySelector('.calendar-scroll');
scroller.addEventListener('scroll', positionDetail, {passive:true});
const monthButtons = months.map((_, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = new Date(2024, index + 7, 1).toLocaleString('en-US', {month:'long'});
  button.addEventListener('click', () => {
    monthIndex = index;
    scroller.scrollLeft = 0;
    renderMonth();
  });
  switcher.append(button);
  return button;
});
function renderMonth() {
  const month = monthIndex + 7;
  const first = new Date(2024, month, 1);
  document.querySelector('#month').textContent = formatter.format(first);
  dismiss();
  monthButtons.forEach((button,i) => button.setAttribute('aria-pressed', String(i === monthIndex)));
  grid.replaceChildren();
  const entries = months[monthIndex].entries;
  for (let day = 1; day <= new Date(2024, month + 1, 0).getDate(); day++) {
    const cell = document.createElement('span');
    cell.className = 'calendar-day';
    cell.textContent = day;
    if (day === 1) cell.style.gridColumnStart = (first.getDay() + 6) % 7 + 1;
    if (entries[day]) {
      const [keyword, tone] = previews[monthIndex][day];
      cell.dataset.tone = tone;
      const lower = entries[day - 1] && day % 2 === 0;
      cell.dataset.stagger = lower ? 'lower' : 'upper';
      if (lower) cell.style.setProperty('--tag-top', '48px');
      const text = document.createElement('button');
      text.type = 'button';
      text.className = 'calendar-tag';
      text.style.setProperty('--angle', `${[-5,3,-3,5][day % 4]}deg`);
      text.textContent = keyword;
      cell.append(text);
      text.setAttribute('aria-label', formatter.format(first) + ', day ' + day + ': ' + entries[day]);
      text.onpointerenter = event => { if (event.pointerType === 'mouse') showDate(text, day); };
      text.onpointerleave = () => { if (activeDate === text && document.activeElement !== text) dismiss(); };
      text.onfocus = text.onclick = () => showDate(text, day);
      text.onblur = () => { if (activeDate === text) dismiss(); };
    }
    grid.append(cell);
  }

}

renderMonth();

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('brand-arrive');
        observer.unobserve(entry.target);
      }
    }
  });
  document.querySelectorAll('.listing-intro, .results, .calendar, .touch').forEach(node => observer.observe(node));
}

const launch = document.querySelector('.launch-reading');
const entries = [...launch.querySelectorAll('.strategy-detail > div')];
const iconPaths = [
  'M4 6h16v14H4z M4 10h16 M8 4v4 M16 4v4',
  'M3 5h18v14H3z M3 9h18 M6 7h1',
  'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 7h.1',
  'M4 10l2-6h12l2 6 M5 11v9h14v-9 M3 10h18 M9 20v-6h6v6',
  'M4 6h13v9H9l-5 4z M18 9h3v10l-3-2h-5'
];
entries.forEach((entry,index)=>{
  entry.querySelector('dt').insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[index]}"/></svg>`);
});
launch.classList.add('enhanced');
const launchPanel = launch.querySelector('.always');
const title = launchPanel.querySelector('h2');
const words = title.textContent.split(' ').map(text => {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
});
title.replaceChildren(...words.flatMap((word,i)=>i ? [' ',word] : [word]));
const clamp = n => Math.min(1, Math.max(0,n));
const ease = n => n*n*(3-2*n);
function updateLaunch() {
  const style = getComputedStyle(launchPanel);
  const pinned = style.position === 'sticky';
  const travel = launch.offsetHeight - launchPanel.offsetHeight;
  const progress = pinned ? clamp((parseFloat(style.top)-launch.getBoundingClientRect().top)/Math.max(1,travel)) : 1;
  const reading = clamp(progress/.13);
  words.forEach((word,i)=>word.style.setProperty('--read',ease(clamp(reading*words.length-i))*100+'%'));
  const sequence = clamp((progress-.13)/.87)*entries.length;
  const current = Math.min(entries.length-1,Math.floor(sequence));
  const phase = sequence-current;
  const alpha = ease(clamp(Math.min(phase/.16,current===entries.length-1 ? 1 : (1-phase)/.16)));
  entries.forEach((entry,i)=>{
    const visible = !pinned || i===current && alpha>0;
    entry.style.visibility = visible ? 'visible' : 'hidden';
    entry.style.setProperty('--entry',pinned ? alpha : 1);
    entry.setAttribute('aria-hidden',String(!visible));
  });
}
window.addEventListener('scroll',updateLaunch,{passive:true});
window.addEventListener('resize',updateLaunch);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',updateLaunch);
updateLaunch();

const track = document.querySelector('#review-cards');
const cards = [...track.children];
const controls = document.querySelector('.review-dots');
function distanceToStart(card) {
  return card.getBoundingClientRect().left - track.getBoundingClientRect().left -
    parseFloat(getComputedStyle(track).paddingLeft);
}
const buttons = cards.map((card,index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label',`Show card ${index+1} of ${cards.length}`);
  button.setAttribute('aria-controls',track.id);
  button.addEventListener('click',()=>track.scrollBy({
    left:distanceToStart(card),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'
  }));
  controls.append(button);
  return button;
});
function syncCards() {
  const distances = cards.map(card=>Math.abs(distanceToStart(card)));
  const selected = distances.indexOf(Math.min(...distances));
  buttons.forEach((button,i)=>button.setAttribute('aria-current',String(i===selected)));
}
track.addEventListener('scroll',syncCards,{passive:true});
new ResizeObserver(syncCards).observe(track);
syncCards();
