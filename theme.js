(() => {
  const key = "ranhi-theme";
  const saved = localStorage.getItem(key) || "auto";
  document.documentElement.dataset.theme = saved;

  const introKey = "ranhi-home-intro-seen";
  const isHome =
    /(?:^|\/)index\.html$/.test(location.pathname) ||
    location.pathname.endsWith("/");
  let playHomeIntro = false;
  try {
    playHomeIntro =
      isHome &&
      !sessionStorage.getItem(introKey) &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (playHomeIntro)
      document.documentElement.classList.add("home-intro-pending");
  } catch {
    /* Storage can be unavailable in strict privacy modes. */
  }

  const labels = { auto: "AUTO", dark: "DARK", light: "LIGHT" };
  const order = ["auto", "dark", "light"];

  function updateButton(theme) {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    button.textContent = `THEME / ${labels[theme]}`;
    button.setAttribute(
      "aria-label",
      `Colour theme: ${labels[theme]}. Activate to change.`,
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    // First visit: show the cover before revealing the interface.
    if (playHomeIntro) {
      try {
        sessionStorage.setItem(introKey, "1");
      } catch {
        /* Animation still works without storage. */
      }
      window.setTimeout(() => {
        document.documentElement.classList.add("home-intro-revealing");
        window.setTimeout(() => {
          document.documentElement.classList.remove(
            "home-intro-pending",
            "home-intro-revealing",
          );
        }, 920);
      }, 1000);
    }
    const header = document.querySelector(".site-header--overlay");
    if (header) {
      const updateHeader = () =>
        header.classList.toggle("is-scrolled", window.scrollY > 24);
      updateHeader();
      window.addEventListener("scroll", updateHeader, { passive: true });
      window.addEventListener("pageshow", updateHeader);
    }
    // Only the cover / selected-work boundary snaps; the rest stays native.
    const hero = document.querySelector(".home-page .hero");
    const selected = document.querySelector(".home-page .selected");
    if (hero && selected) {
      let animating = false;
      let lastInput = 0;
      let locked = false;
      let gesture = 0;
      let touchStart = null;
      const destination = () =>
        selected.getBoundingClientRect().top +
        window.scrollY -
        (header?.offsetHeight || 0);
      const eligible = (delta) => {
        // Short screens retain native scrolling so no cover content is skipped.
        if (hero.offsetHeight > window.innerHeight + 8) return false;
        const y = window.scrollY;
        const boundary = destination();
        return delta > 0 ? y < boundary - 2 : y > 2 && y <= boundary + 8;
      };
      const snap = (delta) => {
        const start = window.scrollY;
        const end = delta > 0 ? destination() : 0;
        const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 520;
        const began = performance.now();
        animating = locked = true;
        const frame = (now) => {
          const progress = duration ? Math.min(1, (now - began) / duration) : 1;
          const ease = 1 - Math.pow(1 - progress, 3);
          window.scrollTo({
            top: start + (end - start) * ease,
            behavior: "instant",
          });
          if (progress < 1) requestAnimationFrame(frame);
          else animating = false;
        };
        requestAnimationFrame(frame);
      };
      window.addEventListener(
        "wheel",
        (event) => {
          if (
            event.ctrlKey ||
            event.shiftKey ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY) ||
            !event.deltaY
          )
            return;
          const now = performance.now();
          const idle = now - lastInput > 180;
          if (!animating && idle) locked = false;
          if (idle) gesture = 0;
          lastInput = now;
          if (locked || animating) {
            event.preventDefault();
            return;
          }
          if (!eligible(event.deltaY)) return;
          event.preventDefault();
          const delta =
            event.deltaY *
            (event.deltaMode === 1
              ? 16
              : event.deltaMode === 2
                ? innerHeight
                : 1);
          gesture =
            Math.sign(gesture) === Math.sign(delta) ? gesture + delta : delta;
          if (Math.abs(gesture) >= 8) {
            snap(delta);
            gesture = 0;
          }
        },
        { passive: false },
      );
      window.addEventListener(
        "touchstart",
        (event) => {
          touchStart =
            event.touches.length === 1
              ? {
                  x: event.touches[0].clientX,
                  y: event.touches[0].clientY,
                  handled: false,
                }
              : null;
        },
        { passive: true },
      );
      window.addEventListener(
        "touchmove",
        (event) => {
          if (!touchStart || event.touches.length !== 1) return;
          const delta = touchStart.y - event.touches[0].clientY;
          if (
            Math.abs(delta) < 18 ||
            Math.abs(event.touches[0].clientX - touchStart.x) > Math.abs(delta)
          )
            return;
          if (animating || touchStart.handled) {
            event.preventDefault();
            return;
          }
          if (eligible(delta)) {
            event.preventDefault();
            touchStart.handled = true;
            snap(delta);
          }
        },
        { passive: false },
      );
      window.addEventListener(
        "touchend",
        () => {
          touchStart = null;
        },
        { passive: true },
      );
    }
    let theme = document.documentElement.dataset.theme || "auto";
    updateButton(theme);
    document
      .querySelector("[data-theme-toggle]")
      ?.addEventListener("click", () => {
        theme = order[(order.indexOf(theme) + 1) % order.length];
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(key, theme);
        updateButton(theme);
      });

    const revealTitles = document.querySelectorAll(
      ".section h2, .page-intro h1, .detail-info h2",
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTitles.forEach((title) =>
        title.classList.add("reveal-title", "is-visible"),
      );
    } else {
      const titleObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            titleObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
      );
      revealTitles.forEach((title) => {
        title.classList.add("reveal-title");
        titleObserver.observe(title);
      });
    }
  });
})();
