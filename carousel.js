
const carousel = document.querySelector('.hero-carousel');
const viewport = carousel.querySelector('.carousel-viewport');
const slides = [...carousel.querySelectorAll('.hero-slide')];
const status = carousel.querySelector('.carousel-status');
let current = 0;
let scrollTimer;
let autoTimer;
let touching = false;
let manuallyPaused = false;
let onScreen = true;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function scheduleAdvance() {
  clearTimeout(autoTimer);
  if (reducedMotion.matches || document.hidden || !onScreen || touching || manuallyPaused || viewport.querySelector('a:focus')) return;
  autoTimer = setTimeout(() => {
    viewport.scrollTo({ left: ((current + 1) % slides.length) * viewport.clientWidth, behavior: 'smooth' });
  }, 3000);
}

function updateCurrent() {
  const index = Math.round(viewport.scrollLeft / viewport.clientWidth);
  current = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((slide, index) => { slide.inert = index !== current; });
  status.textContent = slides[current].getAttribute('aria-label');
  scheduleAdvance();
}

viewport.addEventListener('scroll', () => {
  clearTimeout(autoTimer);
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(updateCurrent, 120);
}, { passive: true });

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
  const next = Math.max(0, Math.min(current + step, slides.length - 1));
  viewport.scrollTo({ left: next * viewport.clientWidth, behavior: 'instant' });
  updateCurrent();
});

new ResizeObserver(() => {
  viewport.scrollTo({ left: current * viewport.clientWidth, behavior: 'instant' });
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

carousel.classList.add('is-ready');
updateCurrent();
