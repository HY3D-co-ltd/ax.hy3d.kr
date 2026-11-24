const dialog = document.querySelector(".wbs-image-dialog");
const expandedImage = dialog.querySelector("img");
const closeButton = dialog.querySelector("[data-close-image]");

document.querySelectorAll("[data-wbs-image]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    expandedImage.src = link.href;
    expandedImage.alt = link.querySelector("img").alt;
    dialog.showModal();
    dialog.querySelector(".wbs-image-scroll").scrollTo(0, 0);
  });
});

closeButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  const isOutside = event.clientX < bounds.left || event.clientX > bounds.right
    || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (isOutside) dialog.close();
});
