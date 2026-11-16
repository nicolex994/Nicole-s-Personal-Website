const contactSection = document.querySelector('#contact');
const reduceContactMotion = matchMedia('(prefers-reduced-motion: reduce)');
contactSection.querySelector('.contact-top').addEventListener('click', () => {
  window.scrollTo({ top:0, behavior:reduceContactMotion.matches ? 'instant' : 'smooth' });
});
document.querySelector('a.contact[href="#contact"]').addEventListener('click', event => {
  event.preventDefault();
  contactSection.scrollIntoView({ behavior:reduceContactMotion.matches ? 'instant' : 'smooth' });
  history.replaceState(null,'','#contact');
});
