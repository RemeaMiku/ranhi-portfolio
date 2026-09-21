document.querySelectorAll("[data-variant-switcher]").forEach((switcher) => {
  const image = document.getElementById(switcher.dataset.variantSwitcher);
  const buttons = switcher.querySelectorAll("button");
  if (!image) return;
  const stage = image.parentElement;
  stage.classList.add("variant-stage");
  let pending;
  let running = false;

  async function transition() {
    if (running) return;
    running = true;
    while (pending) {
      const button = pending;
      pending = null;
      if (button.dataset.image === image.getAttribute("src")) continue;
      const next = new Image();
      next.src = button.dataset.image;
      try {
        await next.decode();
      } catch {
        continue;
      }
      // Keep the old picture fully visible until the new one is decoded.
      if (pending && pending !== button) continue;
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      buttons.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      if (!reduceMotion) {
        next.className = "variant-overlay";
        next.alt = "";
        next.setAttribute("aria-hidden", "true");
        stage.append(next);
        // Fade the new layer over an opaque old layer, never through the background.
        const animation = next.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 320,
          easing: "ease-in-out",
          fill: "forwards",
        });
        try {
          await animation.finished;
        } catch {
          /* Finish with the requested image. */
        }
      }
      image.setAttribute("src", button.dataset.image);
      image.setAttribute("alt", button.dataset.alt);
      try {
        await image.decode();
      } catch {
        /* The source was already decoded above. */
      }
      next.remove();
    }
    running = false;
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // Finish the current blend before honoring the latest click; no hard cancellation.
      pending = button;
      void transition();
    });
  });
});
