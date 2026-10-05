(() => {
  "use strict";

  // Animation from the supplied transparent preview; use the shared original PNG.
  function animation(ctx, img, makeCanvas) {
    const layer = makeCanvas(1000, 1000), lc = layer.getContext("2d");
    if (!lc) throw new Error("Canvas is unavailable");
    const clamp = (x) => Math.max(0, Math.min(1, x));
    const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
    const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
    let seed = 104;
    const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const particles = Array.from({ length: 74 }, () => ({
      a: rand() * Math.PI * 2, r: 230 + rand() * 220,
      tx: 280 + rand() * 450, ty: 320 + rand() * 240,
      s: 1 + rand() * 2.6, d: rand() * .45, pink: rand() < .13,
    }));
    function star(x, y, r, alpha, color) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x + 1, y - 1, x + r, y);
      ctx.quadraticCurveTo(x + 1, y + 1, x, y + r);
      ctx.quadraticCurveTo(x - 1, y + 1, x - r, y);
      ctx.quadraticCurveTo(x - 1, y - 1, x, y - r);
      ctx.fill();
      ctx.restore();
    }
    return (t) => {
      ctx.clearRect(0, 0, 1000, 1000);
      const burst = smooth((t - .1) / .45) * (1 - smooth((t - .85) / 1.1));
      if (burst > 0) {
        const gradient = ctx.createRadialGradient(500, 450, 12, 500, 450, 300);
        gradient.addColorStop(0, "rgba(110,210,216," + burst * .1 + ")");
        gradient.addColorStop(1, "rgba(110,210,216,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(180, 130, 640, 640);
      }
      for (const p of particles) {
        const u = clamp((t - .12 - p.d) / 1.45), e = ease(u);
        const x = (500 + Math.cos(p.a) * p.r) * (1 - e) + p.tx * e;
        const y = (440 + Math.sin(p.a) * p.r * .72) * (1 - e) + p.ty * e;
        const alpha = smooth(u / .2) * (1 - smooth((u - .55) / .45));
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha * .72;
        ctx.fillStyle = p.pink ? "#ee86a5" : "#6bd3d9";
        ctx.beginPath();
        ctx.arc(x, y, p.s * (1 - u * .5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      const p = ease((t - .5) / 1.9), scale = .96 + .04 * ease((t - .5) / 2.1);
      ctx.save();
      ctx.translate(500, 440);
      ctx.scale(scale, scale);
      ctx.translate(-500, -440);
      if (p > 0) {
        lc.clearRect(0, 0, 1000, 1000);
        lc.globalCompositeOperation = "source-over";
        lc.drawImage(img, 0, 270, 1000, 315, 0, 270, 1000, 315);
        lc.globalCompositeOperation = "destination-in";
        const edge = 210 + p * 640;
        const mask = lc.createLinearGradient(edge - 85, 0, edge, 0);
        mask.addColorStop(0, "rgba(0,0,0,1)");
        mask.addColorStop(1, "rgba(0,0,0,0)");
        lc.fillStyle = mask;
        lc.fillRect(0, 0, 1000, 1000);
        lc.globalCompositeOperation = "source-over";
        ctx.globalAlpha = smooth((t - .5) / .4);
        ctx.shadowColor = "rgba(104,218,224," + (1 - smooth((t - 1.6) / .7)) * .5 + ")";
        ctx.shadowBlur = 16;
        ctx.drawImage(layer, 0, 0);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      const name = smooth((t - 1.65) / .8);
      ctx.globalAlpha = name;
      ctx.drawImage(img, 0, 590, 1000, 65, 0, 590 + 14 * (1 - ease((t - 1.65) / .8)), 1000, 65);
      ctx.globalAlpha = 1;
      const date = smooth((t - 2.05) / .85), ds = .94 + .06 * ease((t - 2.05) / 1.05);
      ctx.save();
      ctx.globalAlpha = date;
      ctx.translate(500, 755 + 18 * (1 - ease((t - 2.05) / .85)));
      ctx.scale(ds, ds);
      ctx.translate(-500, -755);
      ctx.drawImage(img, 0, 680, 1000, 150, 0, 680, 1000, 150);
      ctx.restore();
      // The highlight remains clipped to the original artwork.
      const sweep = clamp((t - 2.65) / .75);
      if (sweep > 0 && sweep < 1) {
        lc.clearRect(0, 0, 1000, 1000);
        lc.drawImage(img, 0, 0);
        lc.globalCompositeOperation = "source-in";
        const x = 180 + sweep * 680;
        const gradient = lc.createLinearGradient(x - 70, 0, x + 70, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(.5, "rgba(255,255,255,.58)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        lc.fillStyle = gradient;
        lc.fillRect(0, 0, 1000, 1000);
        lc.globalCompositeOperation = "source-over";
        ctx.drawImage(layer, 0, 0);
      }
      for (const [x, y, start, size, color] of [
        [714, 323, 2.12, 13, "#74d4da"],
        [656, 469, 2.6, 10, "#ee86a5"],
        [370, 709, 2.72, 8, "#74d4da"],
      ]) {
        const u = clamp((t - start) / .7), alpha = Math.sin(u * Math.PI);
        if (alpha > 0) star(x, y, size * alpha, alpha * .85, color);
      }
    };
  }

  const player = document.querySelector("[data-logo-player]");
  if (!player) return;
  const canvas = player.querySelector("canvas");
  const fallback = player.querySelector("svg");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const image = new Image();
  const makeCanvas = (width, height) => Object.assign(document.createElement("canvas"), { width, height });
  let draw, frame = 0, previous = null, elapsed = 0, visible = false, started = false, finished = false;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = null;
  }
  function showStatic() {
    stop();
    canvas.hidden = true;
    fallback.style.visibility = "";
    player.dataset.state = "static";
  }
  function tick(now) {
    frame = 0;
    if (previous !== null) elapsed += (now - previous) / 1000;
    previous = now;
    try { draw(Math.min(elapsed, 5.5)); }
    catch { finished = true; showStatic(); return; }
    if (elapsed >= 5.5) {
      finished = true;
      showStatic(); // The exact original image is the final frame, with no idle rendering.
      player.dataset.state = "finished";
    } else frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!draw || !visible || document.hidden || reduced.matches || finished || frame ||
      document.documentElement.dataset.i18nState === "loading") return;
    started = true;
    canvas.hidden = false;
    fallback.style.visibility = "hidden";
    player.dataset.state = "playing";
    frame = requestAnimationFrame(tick);
  }
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : resume());
  // Do not spend the opening animation while localization still hides the page.
  const languageReady = new MutationObserver(() => {
    if (document.documentElement.dataset.i18nState === "loading") return;
    languageReady.disconnect();
    resume();
  });
  languageReady.observe(document.documentElement, { attributes: true, attributeFilter: ["data-i18n-state"] });
  reduced.addEventListener("change", () => {
    if (reduced.matches) { finished = started; showStatic(); }
    else resume();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) resume(); else stop();
    }, { threshold: .1 }).observe(player);
  } else visible = true;
  image.onload = () => {
    try {
      const context = canvas.getContext("2d");
      if (!context) return;
      draw = animation(context, image, makeCanvas);
      resume();
    } catch { showStatic(); }
  };
  image.onerror = showStatic;
  image.src = fallback.querySelector("image").getAttribute("href");
})();
