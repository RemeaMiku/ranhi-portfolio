(() => {
  "use strict";

  // One viewer for every content image outside the homepage.
  const images = [...document.querySelectorAll("main img:not([aria-hidden='true'])")];
  if (!images.length || document.body.dataset.pageTitle === "home") return;

  const viewer = document.createElement("dialog");
  viewer.className = "image-viewer";
  viewer.id = "image-viewer";
  viewer.setAttribute("aria-labelledby", "image-viewer-title");
  viewer.innerHTML = `
    <h2 id="image-viewer-title" class="image-viewer-sr" data-i18n="imageViewerTitle">Full-size image</h2>
    <button class="image-viewer-close" type="button" autofocus>
      <span data-i18n="imageViewerClose">Close</span><span aria-hidden="true">×</span>
    </button>
    <div class="image-viewer-stage"><img alt="" decoding="async" /></div>
    <p class="image-viewer-caption"></p>
  `;
  document.body.append(viewer);
  const fullImage = viewer.querySelector("img");
  const caption = viewer.querySelector(".image-viewer-caption");
  const close = viewer.querySelector(".image-viewer-close");
  let opener;

  function open(image, trigger) {
    if (viewer.open) return;
    opener = trigger;
    // Read on every click so expression B and the current language stay in sync.
    fullImage.src = image.dataset.fullSrc || image.src;
    fullImage.alt = image.alt;
    const title = image.closest("article")?.querySelector("[data-artwork-title], h3, h2")
      || image.closest("figure")?.querySelector("h4");
    caption.textContent = title?.textContent.trim() || image.alt;
    document.documentElement.classList.add("image-viewer-open");
    viewer.showModal();
  }

  close.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer || event.target.closest(".image-viewer-stage")) viewer.close();
  });
  // Native dialog handles Escape and keeps keyboard focus inside the viewer.
  viewer.addEventListener("close", () => {
    document.documentElement.classList.remove("image-viewer-open");
    fullImage.removeAttribute("src");
    opener?.focus({ preventScroll: true });
  });

  function connect(trigger, image) {
    trigger.classList.add("image-zoom-trigger");
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-controls", viewer.id);
    trigger.setAttribute("role", "button");
    trigger.tabIndex = 0;
    if (trigger.tagName === "A") {
      trigger.href = "#image-viewer";
      trigger.removeAttribute("target");
      trigger.removeAttribute("download");
    }
    if (trigger === image) {
      const label = () => trigger.setAttribute("aria-label", image.alt);
      label();
      new MutationObserver(label).observe(image, { attributes: true, attributeFilter: ["alt"] });
    }
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      open(image, trigger);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === " " || (event.key === "Enter" && trigger.tagName !== "A")) {
        event.preventDefault();
        open(image, trigger);
      }
    });
  }

  images.forEach(image => {
    connect(image.closest("a") || image, image);
    // The SP caption's text action opens the same viewer as its image.
    image.closest("figure")?.querySelectorAll("a[data-i18n='seriesViewImage']")
      .forEach(link => connect(link, image));
  });
})();
