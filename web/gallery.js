const initScreenshotGallery = () => {
  const grid = document.querySelector("[data-screenshot-gallery]");
  if (grid == null) {
    return;
  }

  const thumbs = Array.from(grid.querySelectorAll("[data-gallery-index]"));
  if (thumbs.length === 0) {
    return;
  }

  const lightbox = document.getElementById("screenshot-lightbox");
  const lightboxImage = lightbox?.querySelector(".lightbox-image");
  const lightboxCaption = lightbox?.querySelector(".lightbox-caption");
  const lightboxCounter = lightbox?.querySelector(".lightbox-counter");
  const closeButton = lightbox?.querySelector(".lightbox-close");
  const prevButton = lightbox?.querySelector(".lightbox-prev");
  const nextButton = lightbox?.querySelector(".lightbox-next");

  if (
    lightbox == null ||
    lightboxImage == null ||
    lightboxCaption == null ||
    lightboxCounter == null ||
    closeButton == null ||
    prevButton == null ||
    nextButton == null
  ) {
    return;
  }

  let activeIndex = 0;
  let lastFocusedElement = null;

  const getSlide = (index) => {
    const thumb = thumbs[index];
    if (thumb == null) {
      return null;
    }

    const image = thumb.querySelector("img");
    if (image == null) {
      return null;
    }

    const figure = thumb.closest("figure");
    const caption = figure?.querySelector("figcaption");

    return {
      src: image.currentSrc || image.src,
      alt: image.alt,
      caption: caption?.textContent?.trim() ?? "",
    };
  };

  const renderSlide = (index) => {
    const slide = getSlide(index);
    if (slide == null) {
      return;
    }

    activeIndex = index;
    lightboxImage.src = slide.src;
    lightboxImage.alt = slide.alt;
    lightboxCaption.textContent = slide.caption;
    lightboxCounter.textContent = `${index + 1} / ${thumbs.length}`;
    lightbox.setAttribute("aria-label", slide.caption);
    prevButton.disabled = thumbs.length <= 1;
    nextButton.disabled = thumbs.length <= 1;
  };

  const openLightbox = (index) => {
    lastFocusedElement = document.activeElement;
    renderSlide(index);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImage.removeAttribute("src");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  };

  const showPrevious = () => {
    const nextIndex = (activeIndex - 1 + thumbs.length) % thumbs.length;
    renderSlide(nextIndex);
  };

  const showNext = () => {
    const nextIndex = (activeIndex + 1) % thumbs.length;
    renderSlide(nextIndex);
  };

  thumbs.forEach((thumb, index) => {
    thumb.addEventListener("click", () => {
      openLightbox(index);
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  prevButton.addEventListener("click", showPrevious);
  nextButton.addEventListener("click", showNext);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initScreenshotGallery);
} else {
  initScreenshotGallery();
}
