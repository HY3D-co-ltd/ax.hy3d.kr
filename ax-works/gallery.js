const viewer = document.querySelector('.ax-viewer');
const captures = Array.from(document.querySelectorAll('.capture-link'));

if (typeof viewer?.showModal === 'function' && captures.length) {
  const image = viewer.querySelector('#viewer-image');
  const title = viewer.querySelector('#viewer-title');
  const description = viewer.querySelector('#viewer-description');
  const count = viewer.querySelector('#viewer-count');
  const original = viewer.querySelector('[data-original]');
  let current = 0;

  function display(index) {
    current = (index + captures.length) % captures.length;
    const capture = captures[current];
    const thumbnail = capture.querySelector('img');
    image.src = capture.href;
    image.alt = thumbnail.alt;
    title.textContent = capture.closest('figure').querySelector('figcaption strong').textContent;
    description.textContent = thumbnail.alt;
    count.textContent = `${current + 1} / ${captures.length}`;
    original.href = capture.href;
  }

  captures.forEach((capture, index) => {
    capture.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      display(index);
      viewer.showModal();
      viewer.querySelector('[data-close]').focus();
    });
  });
  viewer.querySelector('[data-close]').addEventListener('click', () => viewer.close());
  viewer.querySelector('[data-prev]').addEventListener('click', () => display(current - 1));
  viewer.querySelector('[data-next]').addEventListener('click', () => display(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      display(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
}
