
const carousel = document.querySelector('.hero-carousel');
const viewport = carousel.querySelector('.carousel-viewport');
const track = viewport.querySelector('.carousel-track');
const slides = [...carousel.querySelectorAll('.hero-slide')];
const status = carousel.querySelector('.carousel-status');
let current = 0;
let scrollTimer;
let autoTimer;
let touching = false;
let manuallyPaused = false;
let onScreen = true;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function copySlide(slide) {
  const copy = slide.cloneNode(true);
  copy.inert = true;
  return copy;
}

function scrollToSlide(index, behavior = 'instant') {
  // The leading copy puts the first original one viewport from the start.
  viewport.scrollTo({ left: (index + 1) * viewport.clientWidth, behavior });
}

function scheduleAdvance() {
  clearTimeout(autoTimer);
  if (reducedMotion.matches || document.hidden || !onScreen || touching || manuallyPaused || viewport.querySelector('a:focus')) return;
  autoTimer = setTimeout(() => scrollToSlide(current + 1, 'smooth'), 3000);
}

function updateCurrent() {
  const index = Math.round(viewport.scrollLeft / viewport.clientWidth) - 1;
  current = (index + slides.length) % slides.length;
  if (index !== current) scrollToSlide(current);
  slides.forEach((slide, index) => { slide.inert = index !== current; });
  status.textContent = slides[current].getAttribute('aria-label');
  scheduleAdvance();
}

viewport.addEventListener('scroll', () => {
  clearTimeout(autoTimer);
  if (!('onscrollend' in viewport)) {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updateCurrent, 120);
  }
}, { passive: true });
viewport.addEventListener('scrollend', updateCurrent);

viewport.addEventListener('keydown', (event) => {
  if (event.target === viewport && event.code === 'Space') {
    event.preventDefault();
    manuallyPaused = !manuallyPaused;
    scheduleAdvance();
    return;
  }
  if (event.target !== viewport || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const step = event.key === 'ArrowRight' ? 1 : -1;
  scrollToSlide(current + step);
  updateCurrent();
});

new ResizeObserver(() => {
  scrollToSlide(current);
}).observe(viewport);

function updateTouch(event) {
  touching = event.touches.length > 0;
  scheduleAdvance();
}
for (const type of ['touchstart', 'touchend', 'touchcancel']) {
  viewport.addEventListener(type, updateTouch, { passive: true });
}
carousel.addEventListener('focusin', scheduleAdvance);
carousel.addEventListener('focusout', () => setTimeout(scheduleAdvance, 0));
document.addEventListener('visibilitychange', scheduleAdvance);
reducedMotion.addEventListener('change', scheduleAdvance);
new IntersectionObserver(([entry]) => {
  onScreen = entry.isIntersecting;
  scheduleAdvance();
}, { threshold: 0.2 }).observe(carousel);

track.prepend(copySlide(slides[slides.length - 1]));
track.append(copySlide(slides[0]));
carousel.classList.add('is-ready');
scrollToSlide(current);
updateCurrent();
