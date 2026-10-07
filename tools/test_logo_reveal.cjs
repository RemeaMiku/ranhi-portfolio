const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "logo-reveal.js"), "utf8");

function boot({ reduced = false, loading = false, contextMissing = false } = {}) {
  const frames = new Map(), listeners = {};
  let next = 0, image, intersection, mutation;
  const context = new Proxy({}, { get: (_, key) => key.startsWith("create")
    ? () => ({ addColorStop() {} }) : () => {} });
  const canvas = { hidden: true, getContext: () => contextMissing ? null : context };
  const fallback = { style: {}, querySelector: () => ({ getAttribute: () => "images/10-years-with-miku.png?v=20261004-2" }) };
  const player = { dataset: {}, querySelector: (selector) => selector === "canvas" ? canvas : fallback };
  const preference = { matches: reduced, addEventListener: (_, fn) => { preference.change = fn; } };
  const document = {
    hidden: false, documentElement: { dataset: { i18nState: loading ? "loading" : "ready" } },
    querySelector: (selector) => selector === "[data-logo-player]" ? player : null,
    createElement: () => ({ getContext: () => context }),
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  vm.runInNewContext(source, {
    document, window: { IntersectionObserver: true }, matchMedia: () => preference,
    Image: class { constructor() { image = this; } },
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} disconnect() {} },
    requestAnimationFrame: (fn) => { frames.set(++next, fn); return next; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  return { player, canvas, fallback, preference, document, frames, image,
    visible(value) { intersection([{ isIntersecting: value }]); },
    step(time) { const scheduled = [...frames.values()]; frames.clear(); scheduled.forEach((fn) => fn(time)); },
    tabHidden(value) { document.hidden = value; listeners.visibilitychange(); },
    ready() { document.documentElement.dataset.i18nState = "ready"; mutation(); },
  };
}

const normal = boot();
normal.image.onload();
assert.equal(normal.frames.size, 0, "Wait until the logo enters view");
normal.visible(true);
normal.step(0);
assert.equal(normal.player.dataset.state, "playing");
normal.step(1000);
normal.tabHidden(true);
assert.equal(normal.frames.size, 0, "Pause in a background tab");
normal.tabHidden(false);
normal.step(10000);
assert.equal(normal.player.dataset.state, "playing", "Hidden time does not skip the reveal");
normal.step(15000);
assert.equal(normal.player.dataset.state, "finished");
assert.equal(normal.frames.size, 0, "Stop requesting frames after completion");
assert.equal(normal.canvas.hidden, true);
assert.equal(normal.fallback.style.visibility, "");
normal.visible(false);
normal.visible(true);
normal.tabHidden(true);
normal.tabHidden(false);
assert.equal(normal.frames.size, 0, "Completed animation does not restart on returning");

const interrupted = boot();
interrupted.visible(true);
interrupted.image.onload();
assert.equal(interrupted.frames.size, 1);
interrupted.preference.matches = true;
interrupted.preference.change();
assert.equal(interrupted.frames.size, 0);
assert.equal(interrupted.canvas.hidden, true);
interrupted.preference.matches = false;
interrupted.preference.change();
assert.equal(interrupted.frames.size, 0, "Motion preference changes do not replay a started reveal");

const reduced = boot({ reduced: true });
reduced.visible(true);
reduced.image.onload();
assert.equal(reduced.frames.size, 0);
assert.equal(reduced.canvas.hidden, true);
const waiting = boot({ loading: true });
waiting.visible(true);
waiting.image.onload();
assert.equal(waiting.frames.size, 0, "Wait for localized content to become visible");
waiting.ready();
assert.equal(waiting.frames.size, 1);
waiting.visible(false);
assert.equal(waiting.frames.size, 0, "Pause when scrolled out of view");
for (const missing of [false, true]) {
  const state = boot({ contextMissing: missing });
  state.visible(true);
  if (missing) state.image.onload(); else state.image.onerror();
  assert.equal(state.canvas.hidden, true);
  assert.equal(state.frames.size, 0);
}
const page = fs.readFileSync(path.join(root, "10-years-with-miku/index.html"), "utf8");
assert.ok(page.includes('data-logo-player role="img"'));
assert.ok(!page.includes("data-logo-replay"));
assert.ok(!page.includes("anniversaryReplay"));
assert.ok(!fs.readFileSync(path.join(root, "index.html"), "utf8").includes("logo-reveal.js"));
console.log("PASS: single logo autoplay, no replay control, reduced motion, visibility/localization pause, static fallback and idle rendering.");
