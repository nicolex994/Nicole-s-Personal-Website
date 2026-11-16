// Match the Product Marketing reading sequence using the native scroll position.
const sections = [];
const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => value * value * (3 - 2 * value);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

for (const heading of document.querySelectorAll('[data-reading-title]')) {
  const panel = heading.closest('[data-reading-panel]');
  const range = document.createElement('div');
  range.className = 'case-reading-range';
  panel.before(range);
  range.append(panel);
  const words = [];
  const tokens = heading.textContent.split(/(\s+)/).map(token => {
    if (!token.trim()) return document.createTextNode(token);
    const word = document.createElement('span');
    word.textContent = token;
    words.push(word);
    return word;
  });
  heading.replaceChildren(...tokens);
  sections.push({panel, range, words});
}

let frame = 0;
function render() {
  frame = 0;
  if (reduced.matches) return;
  for (const {panel, range, words} of sections) {
    const distance = range.offsetHeight - panel.offsetHeight;
    const progress = clamp((parseFloat(getComputedStyle(panel).top) - range.getBoundingClientRect().top) / Math.max(1, distance));
    const reading = clamp(progress / .65);
    words.forEach((word, index) => {
      const amount = clamp((reading * (words.length + .8) - index) / 1.05);
      word.style.setProperty('--read', ease(amount) * 100 + '%');
    });
    panel.style.setProperty('--body-opacity', ease(clamp((progress - .65) / .27)));
  }
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(render);
}
const resize = new ResizeObserver(schedule);
for (const {panel} of sections) resize.observe(panel);
window.addEventListener('scroll', schedule, {passive:true});
window.addEventListener('resize', schedule);
reduced.addEventListener('change', schedule);
render();
