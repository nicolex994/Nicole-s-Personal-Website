const about = document.querySelector('#about-me');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const photoMap = about.querySelector('.memory-map');
let expanded = null;

function closePhoto() {
  if (!expanded || expanded.closing) return;
  expanded.closing = true;
  const {thumb, viewer, animation} = expanded;
  thumb.setAttribute('aria-expanded', 'false');
  thumb.focus({preventScroll:true});
  const remove = () => {
    viewer.remove();
    if (expanded?.viewer === viewer) expanded = null;
  };
  if (!animation || reduced.matches) { remove(); return; }
  animation.onfinish = remove;
  animation.reverse();
}

function openPhoto(thumb) {
  if (expanded?.thumb === thumb) { closePhoto(); return; }
  if (expanded) {
    expanded.thumb.setAttribute('aria-expanded', 'false');
    expanded.animation?.cancel();
    expanded.viewer.remove();
  }
  const viewer = document.createElement('button');
  viewer.type = 'button';
  viewer.className = 'travel-enlarged';
  viewer.setAttribute('aria-label', 'Close ' + thumb.getAttribute('aria-label'));
  viewer.append(thumb.querySelector('img').cloneNode(true));
  const location = document.createElement('span');
  location.className = 'travel-location';
  location.textContent = thumb.closest('.travel-place').dataset.title;
  viewer.append(location);
  // Size the bare photo within the visible portion of About, in section coordinates.
  const bounds = about.getBoundingClientRect();
  const top = Math.max(16, 16 - bounds.top);
  const bottom = Math.min(bounds.height - 16, innerHeight - bounds.top - 16);
  const height = Math.min(Math.max(1, bottom - top), (bounds.width - 32) * 4 / 3, innerHeight * .83);
  viewer.style.height = height + 'px';
  viewer.style.width = height * .75 + 'px';
  viewer.style.left = (bounds.width - height * .75) / 2 + 'px';
  viewer.style.top = (top + bottom - height) / 2 + 'px';
  about.append(viewer);
  const start = thumb.getBoundingClientRect();
  const end = viewer.getBoundingClientRect();
  const x = start.left + start.width/2 - end.left - end.width/2;
  const y = start.top + start.height/2 - end.top - end.height/2;
  const origin = 'translate('+x+'px,'+y+'px) scale('+start.width/end.width+','+start.height/end.height+')';
  const animation = reduced.matches ? null : viewer.animate([
    {transform:origin,clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'},
    {offset:.42,transform:'translate('+x*.54+'px,'+y*.54+'px) scale(.59,.78)',clipPath:'polygon(1% 0,99% 0,81% 100%,19% 100%)'},
    {transform:'none',clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'}
  ],{duration:380,easing:'cubic-bezier(.25,.7,.3,1)',fill:'both'});
  expanded = {thumb, viewer, animation};
  thumb.setAttribute('aria-expanded','true');
  viewer.addEventListener('click',closePhoto);
  viewer.focus({preventScroll:true});
}
photoMap.querySelectorAll('.travel-thumb').forEach(thumb=>thumb.addEventListener('click',()=>openPhoto(thumb)));
about.addEventListener('keydown',event=>{if(event.key==='Escape' && expanded)closePhoto();});
// A new viewport invalidates the stored thumbnail-to-photo geometry.
addEventListener('resize', () => {
  if (!expanded) return;
  const {viewer, thumb, animation} = expanded;
  animation?.cancel();
  viewer.remove();
  expanded = null;
  thumb.setAttribute('aria-expanded','false');
  thumb.focus({preventScroll:true});
});
if(!reduced.matches) about.dataset.motion='true';
const observer=new IntersectionObserver(entries=>{
 if(entries.some(entry=>entry.isIntersecting)){about.classList.add('is-visible');observer.disconnect();}
},{threshold:.15});
observer.observe(about);
const audio = about.querySelector('audio');
const play = about.querySelector('[data-music="play"]');
const progress = about.querySelector('.about-progress');
const elapsed = about.querySelector('.elapsed');
const remaining = about.querySelector('.remaining');
const live = about.querySelector('.about-player-live');

function playbackState(message) {
  const playing = !audio.paused && !audio.ended && !audio.error;
  play.textContent = playing ? '' : '▶';
  play.setAttribute('aria-pressed', String(playing));
  play.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' Mack the Knife (Live)');
  live.classList.toggle('brands-sr', !audio.error && !message.startsWith('Unable'));
  live.textContent = message;
}
// A local blob stays fully seekable even on static previews without byte-range support.
let trackRequest;
function loadTrack() {
  if (!trackRequest) {
    trackRequest = fetch(audio.dataset.track).then(async response => {
      if (!response.ok) throw new Error('Track unavailable');
      audio.src = URL.createObjectURL(await response.blob());
    }).catch(error => { trackRequest = null; throw error; });
  }
  return trackRequest;
}
const trackObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  trackObserver.disconnect();
  loadTrack().catch(() => playbackState('Unable to load · tap to retry'));
}, {rootMargin:'300px'});
trackObserver.observe(play);

let scrubbing = false;
function paintProgress(percent) {
  progress.style.setProperty('--progress', percent + '%');
  progress.setAttribute('aria-valuetext', Math.round(percent) + ' percent');
  const seconds = Number.isFinite(audio.duration) ? audio.duration * percent / 100 : 0;
  const clock = value => Math.floor(value / 60) + ':' + String(Math.floor(value % 60)).padStart(2, '0');
  elapsed.textContent = clock(seconds);
  remaining.textContent = Number.isFinite(audio.duration) ? '−' + clock(Math.max(0, audio.duration - seconds)) : '−–:––';
  progress.setAttribute('aria-valuetext', elapsed.textContent);
}
function updateProgress() {
  progress.disabled = !Number.isFinite(audio.duration) || !!audio.error;
  if (scrubbing || audio.seeking) return;
  const percent = progress.disabled ? 0 : audio.currentTime / audio.duration * 100;
  progress.value = percent;
  paintProgress(percent);
}
play.addEventListener('click', async () => {
  if (!audio.paused) { audio.pause(); return; }
  try {
    await loadTrack();
    if (audio.error) audio.load();
    await audio.play();
  } catch (error) {
    if (error.name !== 'AbortError') playbackState('Unable to play · tap to retry');
  }
});
audio.addEventListener('playing', () => playbackState('Playing'));
audio.addEventListener('pause', () => playbackState(audio.ended ? 'Finished' : 'Paused'));
audio.addEventListener('ended', () => playbackState('Finished'));
audio.addEventListener('error', () => { playbackState('Unable to play · tap to retry'); updateProgress(); });
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('seeked', updateProgress);
progress.addEventListener('pointerdown', () => { scrubbing = true; });
progress.addEventListener('input', () => paintProgress(progress.valueAsNumber));
progress.addEventListener('change', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = progress.valueAsNumber * audio.duration / 100;
  scrubbing = false;
});
progress.addEventListener('pointerup', () => { scrubbing = false; });
progress.addEventListener('pointercancel', () => { scrubbing = false; updateProgress(); });
about.querySelector('[data-music="previous"]').addEventListener('click', () => {
  if (Number.isFinite(audio.duration)) audio.currentTime = 0;
});
const volume = about.querySelector('.volume');
const mute = about.querySelector('.mute');
let lastVolume = 1;
function syncVolume() {
  const silent = audio.muted || audio.volume === 0;
  if (!silent) lastVolume = audio.volume;
  volume.value = silent ? 0 : Math.round(audio.volume * 100);
  mute.setAttribute('aria-pressed', String(silent));
  mute.setAttribute('aria-label', silent ? 'Restore volume' : 'Mute');
}
volume.addEventListener('input', () => {
  if (!audio.muted && audio.volume > 0) lastVolume = audio.volume;
  audio.volume = volume.valueAsNumber / 100;
  audio.muted = audio.volume === 0;
  syncVolume();
});
mute.addEventListener('click', () => {
  if (audio.muted || audio.volume === 0) {
    audio.volume = lastVolume;
    audio.muted = false;
  } else audio.muted = true;
  syncVolume();
});
audio.addEventListener('volumechange', syncVolume);
syncVolume();

const hoverMotion = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
for (const bubble of about.querySelectorAll('.about-bubble')) {
  bubble.addEventListener('pointermove', event => {
    if (!hoverMotion.matches || event.pointerType === 'touch') return;
    const box = bubble.getBoundingClientRect();
    bubble.style.setProperty('--follow-x', ((event.clientX - box.left) / box.width - .5) * 4 + 'px');
    bubble.style.setProperty('--follow-y', (-3 + (event.clientY - box.top) / box.height * 2) + 'px');
  });
  bubble.addEventListener('pointerleave', () => {
    bubble.style.removeProperty('--follow-x');
    bubble.style.removeProperty('--follow-y');
  });
}
if (audio.error) playbackState('Unable to play · tap to retry');
updateProgress();
// Store dragged coordinates in the About section, never in the global viewport.
const pet = about.querySelector('.about-cat');
const petHome = document.createComment('Desktop pet home');
pet.before(petHome);
let held = null;
function placePet(x, y) {
  const rect = pet.getBoundingClientRect();
  pet.style.left = Math.max(0, Math.min(about.clientWidth - rect.width, x)) + 'px';
  pet.style.top = Math.max(0, Math.min(about.clientHeight - rect.height, y)) + 'px';
}
function detachPet() {
  if (pet.classList.contains('is-roaming')) return;
  const rect = pet.getBoundingClientRect();
  pet.style.width = rect.width + 'px';
  pet.classList.add('is-roaming');
  about.append(pet);
  const bounds=about.getBoundingClientRect();
  placePet(rect.left-bounds.left, rect.top-bounds.top);
  pet.focus({preventScroll:true});
}
pet.addEventListener('pointerdown', event => {
  if (held || event.button !== 0) return;
  const rect = pet.getBoundingClientRect();
  held = {id:event.pointerId, x:event.clientX - rect.left, y:event.clientY - rect.top};
  detachPet();
  pet.setPointerCapture(event.pointerId);
  pet.classList.add('is-held');
});
pet.addEventListener('pointermove', event => {
  if (held?.id === event.pointerId) { const bounds=about.getBoundingClientRect();placePet(event.clientX - held.x-bounds.left, event.clientY - held.y-bounds.top); }
});
function releasePet() { held = null; pet.classList.remove('is-held'); }
pet.addEventListener('pointerup', releasePet);
pet.addEventListener('pointercancel', releasePet);
pet.addEventListener('lostpointercapture', releasePet);
pet.addEventListener('keydown', event => {
  if (event.key === 'Home' || event.key === 'Escape') {
    event.preventDefault();
    if (held) pet.releasePointerCapture(held.id);
    petHome.after(pet);
    pet.classList.remove('is-roaming');
    pet.removeAttribute('style');
    pet.focus();
    return;
  }
  const step = event.shiftKey ? 32 : 12;
  const moves = {ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step]};
  if (!moves[event.key]) return;
  event.preventDefault();
  detachPet();
  const rect = pet.getBoundingClientRect();
  const [dx, dy] = moves[event.key];
  const bounds=about.getBoundingClientRect();
  placePet(rect.left-bounds.left + dx, rect.top-bounds.top + dy);
});
addEventListener('resize', () => {
  if (pet.classList.contains('is-roaming')) {
    const rect = pet.getBoundingClientRect();
    const bounds=about.getBoundingClientRect();
    placePet(rect.left-bounds.left, rect.top-bounds.top);
  }
});
