
const carousel = document.querySelector(".hero-carousel");
const track = carousel.querySelector(".carousel-track");
const slides = [...carousel.querySelectorAll(".hero-slide")];
const tabs = [...carousel.querySelectorAll("[data-slide]")];
const status = carousel.querySelector(".carousel-status");
let current = 0;

function showSlide(index) {
  current = (index + slides.length) % slides.length;
  track.style.setProperty("--slide-index", current);
  slides.forEach((slide, index) => {
    slide.inert = index !== current;
    tabs[index].setAttribute("aria-pressed", String(index === current));
  });
  status.textContent = slides[current].getAttribute("aria-label");
}

tabs.forEach((tab, index) => tab.addEventListener("click", () => showSlide(index)));
carousel.querySelectorAll("[data-step]").forEach((button) => {
  button.addEventListener("click", () => showSlide(current + Number(button.dataset.step)));
});
carousel.classList.add("is-ready");
