// New sections only: the approved Finder timeline remains in main.js.
const reading = document.querySelector('.reading-section');
const phrases = [...reading.querySelectorAll('.reading-phrase')];
const skills = document.querySelector('.skills-section');
const archive = skills.querySelector('.skill-archive');
const entries = [...skills.querySelectorAll('.skill-entry')];
const chips = entries.map(entry => entry.querySelector('button'));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => n * n * (3 - 2 * n);
let frame = 0;
function updateSections() {
  frame = 0;
  const top = reading.getBoundingClientRect().top;
  const progress = clamp(-top / Math.max(1, reading.offsetHeight - innerHeight));
  reading.style.setProperty('--reading-opacity', reduced.matches ? 1 : ease(clamp((innerHeight - top) / (innerHeight * .65))));
  reading.style.setProperty('--reading-rise', `${reduced.matches ? 0 : 24 * (1 - clamp((innerHeight - top) / innerHeight))}px`);
  phrases.forEach((phrase, i) => {
    const amount = reduced.matches ? 1 : ease(clamp((progress * (phrases.length + .8) - i) / 1.05));

    phrase.style.setProperty('--read', `${amount * 100}%`);
  });
  const entryProgress = reduced.matches ? 1 : clamp((innerHeight * .6 - skills.getBoundingClientRect().top) / (innerHeight * .95));
  const tray = ease(clamp(entryProgress / .24));
  archive.style.setProperty('--tray-opacity', tray);
  archive.style.setProperty('--tray-rise', `${(1 - tray) * 55}px`);
  entries.forEach((entry, i) => {
    const order = (i * 7) % entries.length;
    const p = reduced.matches ? 1 : clamp((entryProgress - .2 - order * .018) / .32);
    // A short downward landing, one small rebound, then a completely stable pose.
    let x, y, rotation;
    const direction = i % 3 - 1;
    if (p < .68) {
      const fall = (p / .68) ** 2;
      x = direction * 58 * (1 - fall);
      y = -160 * (1 - fall) + 5 * fall;
      rotation = (i % 2 ? 13 : -11) * (1 - fall);
    } else {
      const settle = (p - .68) / .32;
      x = 0;
      y = settle < .45 ? 5 - 11 * Math.sin(settle / .45 * Math.PI / 2) : -6 * (1 - ease((settle - .45) / .55));
      rotation = 0;
    }
    entry.style.setProperty('--entry-opacity', clamp(p / .13));
    entry.style.setProperty('--entry-x', `${x}px`);
    entry.style.setProperty('--entry-y', `${y}px`);
    entry.style.setProperty('--entry-rotation', `${rotation}deg`);
    entry.inert = p < .7;
  });
}
function requestUpdate() { if (!frame) frame = requestAnimationFrame(updateSections); }
addEventListener('scroll', requestUpdate, {passive: true});
addEventListener('resize', requestUpdate);
reduced.addEventListener('change', () => { resetNudge(); updateSections(); });
updateSections();
function resetNudge() { chips.forEach(chip => { chip.style.removeProperty('--nudge-x'); chip.style.removeProperty('--nudge-y'); chip.style.removeProperty('--nudge-scale'); }); }
let pointerFrame = 0;
let pointer;
archive.addEventListener('pointermove', event => {
  if (reduced.matches || event.pointerType === 'touch') return;
  pointer = {x: event.clientX, y: event.clientY};
  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    entries.forEach((entry, i) => {
      const rect = entry.getBoundingClientRect();
      const dx = pointer.x - rect.left - rect.width / 2;
      const dy = pointer.y - rect.top - rect.height / 2;
      const influence = Math.pow(clamp(1 - Math.hypot(dx, dy) / 240), 2);
      chips[i].style.setProperty('--nudge-x', `${dx * influence * .16}px`);
      chips[i].style.setProperty('--nudge-y', `${dy * influence * .16 - influence * 5}px`);
      chips[i].style.setProperty('--nudge-scale', 1 + influence * .055);
    });
  });
});
archive.addEventListener('pointerleave', () => { cancelAnimationFrame(pointerFrame); pointerFrame = 0; resetNudge(); });
chips.forEach(chip => {
  chip.addEventListener('focus', () => { if (!reduced.matches) { chip.style.setProperty('--nudge-y', '-6px'); chip.style.setProperty('--nudge-scale', '1.04'); } });
  chip.addEventListener('blur', resetNudge);
  chip.addEventListener('click', () => { const selected = chip.getAttribute('aria-pressed') !== 'true'; chips.forEach(item => item.setAttribute('aria-pressed', String(item === chip && selected))); });
});
