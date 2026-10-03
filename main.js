document.querySelectorAll("[data-variant-switcher]").forEach((switcher) => {
  const image = document.getElementById(switcher.dataset.variantSwitcher);
  const toggle = switcher.querySelector(".expression-switch");
  if (!image || !toggle) return;
  const stage = image.parentElement;
  stage.classList.add("variant-stage");
  const error = document.createElement("p");
  error.className = "variant-error";
  error.setAttribute("role", "status");
  error.hidden = true;
  switcher.after(error);
  let desiredB = image.getAttribute("src") === toggle.dataset.imageB;
  let running = false;

  const showState = () => toggle.setAttribute("aria-checked", String(desiredB));
  const source = (isB) => isB ? toggle.dataset.imageB : toggle.dataset.imageA;
  showState();

  async function transition() {
    if (running) return;
    running = true;
    try {
      while (source(desiredB) !== image.getAttribute("src")) {
        const targetB = desiredB;
        const next = new Image();
        next.src = source(targetB);
        try {
          await next.decode();
        } catch {
          if (targetB !== desiredB) continue;
          desiredB = image.getAttribute("src") === toggle.dataset.imageB;
          showState();
          error.textContent = toggle.dataset.error || "Could not load this expression. Please try again.";
          error.hidden = false;
          break;
        }
        if (targetB !== desiredB) continue;
        // Crossfade over the original image; rapid clicks queue the latest choice.
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          next.className = "variant-overlay";
          next.alt = "";
          next.setAttribute("aria-hidden", "true");
          stage.append(next);
          const animation = next.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 320,
            easing: "ease-in-out",
            fill: "forwards",
          });
          try { await animation.finished; } catch { /* Finish at the target frame. */ }
        }
        image.setAttribute("src", source(targetB));
        // Read the current translation, even if the language changed mid-blend.
        image.setAttribute("alt", targetB ? toggle.dataset.altB : toggle.dataset.altA);
        try { await image.decode(); } catch { /* Already decoded above. */ }
        next.remove();
      }
    } finally {
      running = false;
    }
  }

  toggle.addEventListener("click", () => {
    desiredB = !desiredB;
    showState();
    error.hidden = true;
    error.textContent = "";
    void transition();
  });
});
