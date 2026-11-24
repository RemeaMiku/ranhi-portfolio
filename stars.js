(() => {
  "use strict";
  const sky = document.createElement("div");
  sky.className = "night-sky";
  sky.setAttribute("aria-hidden", "true");
  // A repeatable scatter avoids a different sky on every page change.
  let seed = 39;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const stars = document.createDocumentFragment();
  const positions = [];
  for (let i = 0; i < 100; i++) {
    const star = document.createElement("i");
    star.className = i % 13 === 0 ? "sky-star sky-star--bright" : "sky-star";
    positions.push({ star, x: random(), y: random(), size: i % 13 === 0 ? 2 : 1 });
    star.style.cssText = `--duration:${5 + random() * 7}s;--delay:${-random() * 12}s;--brightness:${0.6 + random() * 0.35}`;
    stars.append(star);
  }
  for (let i = 0; i < 2; i++) {
    const meteor = document.createElement("i");
    meteor.className = "sky-meteor";
    stars.append(meteor);
  }
  sky.append(stars);
  document.body.prepend(sky);
  // Snap each core to physical pixels instead of blurring a subpixel-sized dot.
  const positionStars = () => {
    const ratio = window.devicePixelRatio || 1;
    const snap = value => Math.round(value * ratio) / ratio;
    for (const { star, x, y, size } of positions) {
      star.style.setProperty("--x", `${snap(x * document.documentElement.clientWidth)}px`);
      star.style.setProperty("--y", `${snap(y * window.innerHeight)}px`);
      star.style.setProperty("--size", `${Math.max(1, Math.round(size * ratio)) / ratio}px`);
    }
  };
  positionStars();
  window.addEventListener("resize", positionStars, { passive: true });
  // Stop background animation in hidden tabs; CSS handles reduced motion.
  const syncVisibility = () => sky.classList.toggle("is-paused", document.hidden);
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
})();
