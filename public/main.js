import {categories} from './work-case-data.js';
import { createFinderGenie } from './genie.js?v=portrait-layer';
import { createSharedDock } from './dock.js?v=1c9441d46b';
import { content } from './content.js?v=home-glass-1';

for (const node of document.querySelectorAll('[data-content]')) {
  node.textContent = content[node.dataset.content] ?? '';
}
// Enable only destinations that exist in this preview.
const navigation = document.querySelector('#navigation-items');
const activePill = document.createElement('span');
activePill.className = 'navigation-active-pill';
activePill.setAttribute('aria-hidden', 'true');
navigation.append(activePill);
const navigationTargets = [];
for (const item of content.navigation) {
  const target = document.getElementById(item.target.slice(1));
  const link = document.createElement(target ? 'a' : 'span');
  link.className = 'navigation-item';
  link.textContent = item.label;
  if (target) {
    link.href = item.target;
    navigationTargets.push({ link, target });
  } else {
    link.setAttribute('role', 'link');
    link.setAttribute('aria-disabled', 'true');
    link.tabIndex = 0;
    link.dataset.target = item.target;
    link.title = `${item.label} — not yet available`;
  }
  navigation.append(link);
}
function updateNavigation() {
  const line=Math.min(innerHeight*.3,180);
  const current=navigationTargets.find(item=>{
    const rect=item.target.getBoundingClientRect();
    return rect.top<=line && rect.bottom>line;
  });
  for (const item of navigationTargets) {
    if (item === current) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  }
  activePill.hidden = !current;
  if (current) {
    navigation.style.setProperty('--active-left', `${current.link.offsetLeft}px`);
    navigation.style.setProperty('--active-width', `${current.link.offsetWidth}px`);
  }
}
new ResizeObserver(updateNavigation).observe(navigation);
document.fonts.ready.then(updateNavigation);

// Only the glass changes geometry; the title and portrait fade as one foreground.
const stage = document.querySelector('.hero-composition');
const hero = document.querySelector('.hero');
const cover = document.querySelector('.cover-content');
const cue = document.querySelector('.scroll-cue');
const workSpace = document.querySelector('.work-space');
const projectNote = document.querySelector('.project-note');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = value => Math.min(1, Math.max(0, value));
const smooth = value => value * value * (3 - 2 * value);
const sharedDock=createSharedDock({reduceMotion});
const finderGenie = createFinderGenie({stage, windowNode:stage.querySelector('.glass-window'), dock:sharedDock.root, finderTarget:sharedDock.finder, reduceMotion});
let pending = false;
function updateGlass() {
  const traveled = Math.max(0, -hero.getBoundingClientRect().top);
  const progress = clamp(traveled / Math.max(1, hero.offsetHeight - innerHeight));
  const coverOpacity = 1 - smooth(clamp((progress - .06) / .58));
  stage.style.setProperty('--glass-progress', reduceMotion.matches ? 0 : smooth(progress));
  stage.style.setProperty('--cover-opacity', coverOpacity);
  sharedDock.update(progress);
  finderGenie.update(progress, coverOpacity > 0);
  document.documentElement.style.setProperty('--cue-opacity', 1 - clamp(traveled / 160));
  cover.inert = !reduceMotion.matches && coverOpacity < .05;
  cue.inert = traveled >= 160;
  updateNavigation();
  pending = false;
}
addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateGlass); } }, { passive: true });
addEventListener('resize', updateGlass);
reduceMotion.addEventListener('change', updateGlass);
updateGlass();

// Preview on focus or hover; open the independent case study on click.
const folderCards = [...document.querySelectorAll('.folder-card')];
const noteCopy = document.querySelector('.note-copy');
const categoryTitle = document.querySelector('#category-title');
const summaries = [
  "A launch is attention you earn before launch day. I help plan how a message travels, from the first teaser to a live event in Frankfurt.",
  "Creators can put a brand in front of people who would never search for it. I handle the program behind that: the brief, the schedule, the creators, and the content.",
  "A brand is what people remember after the ad is gone. I build it in daily work: the positioning, the copy, the social calendar, and one look across every channel.",
  "The best product ideas start as small complaints. I listen for them, turn them into requirements, and work with R&D until they ship."
];
let selectedCategory = 0;
let noteTimer;
function showSelectedCategory() {
  categoryTitle.textContent = folderCards[selectedCategory].querySelector('.folder-caption > span').textContent;
  noteCopy.querySelector('p').textContent = summaries[selectedCategory];
  noteCopy.classList.remove('is-changing');
}
function selectCategory(index) {
  if (index === selectedCategory) return;
  selectedCategory = index;
  folderCards.forEach((card, i) => card.setAttribute('aria-pressed', String(i === index)));
  clearTimeout(noteTimer);
  if (reduceMotion.matches) {
    showSelectedCategory();
  } else {
    noteCopy.classList.add('is-changing');
    noteTimer = setTimeout(showSelectedCategory, 110);
  }
}
folderCards.forEach((card, index) => {
  card.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') selectCategory(index); });
  card.addEventListener('focus', () => selectCategory(index));
  card.setAttribute('aria-label', `${categories[index].name}: open case study`);
  card.addEventListener('click', () => { selectCategory(index); const category = categories[index];
    const pages = {'go-to-market':'./gtm-cosori.html?v=nov14-cases', 'influencer-social':'./influencer-social.html?v=nov14-cases', branding:'./branding.html?v=nov14-cases', 'product-marketing':'./product-marketing.html?v=nov14-cases'};
    location.href = pages[category.slug]; });
  card.addEventListener('keydown', event => {
    const steps = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 };
    let next;
    if (event.key in steps) next = (index + steps[event.key] + folderCards.length) % folderCards.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = folderCards.length - 1;
    else return;
    event.preventDefault();
    folderCards[next].focus();
  });
});
reduceMotion.addEventListener('change', () => { clearTimeout(noteTimer); showSelectedCategory(); });

// Fit the entire laptop around its existing screen center, including the front lip.
const workScreen = document.querySelector('.work-stage > .work-space');
const workStage = workScreen.parentElement;
const base = workScreen.querySelector('.macbook-base');
function fitWorkScreen() {
  if (getComputedStyle(workScreen).position !== 'absolute') {
    workScreen.style.removeProperty('--device-fit');
    return;
  }
  const screenStyle = getComputedStyle(workScreen);
  const baseStyle = getComputedStyle(base);
  const centerY = parseFloat(screenStyle.top);
  const bottomFromCenter = parseFloat(screenStyle.borderTopWidth) + parseFloat(baseStyle.top)
    + parseFloat(baseStyle.height) - workScreen.offsetHeight / 2;
  const available = workStage.clientHeight - centerY - 14;
  workScreen.style.setProperty('--device-fit', Math.min(1, available / bottomFromCenter));
}
const deviceObserver = new ResizeObserver(fitWorkScreen);
deviceObserver.observe(workStage);
deviceObserver.observe(workScreen);
