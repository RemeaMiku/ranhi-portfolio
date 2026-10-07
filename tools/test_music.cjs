const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "anniversary-music.js"), "utf8");
function boot() {
  const events = {}, windowEvents = {};
  let click, settle, reject;
  const audio = {
    paused: true, currentTime: 42, calls: 0,
    addEventListener(name, fn) { events[name] = fn; },
    play() {
      this.calls++;
      return new Promise((resolve, fail) => {
        settle = () => { this.paused = false; events.playing(); resolve(); };
        reject = fail;
      });
    },
    pause() { this.paused = true; events.pause(); },
  };
  const button = {
    hidden: true, dataset: {}, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, fn) { click = fn; },
  };
  const error = { hidden: true };
  const player = { querySelector: (selector) => ({
    audio, "[data-music-toggle]": button, "[data-music-error]": error,
  })[selector] };
  vm.runInNewContext(source, {
    document: { querySelector: () => player },
    window: { addEventListener(name, fn) { windowEvents[name] = fn; } },
  });
  return { audio, button, error, events, windowEvents,
    click: () => click(), settle: () => settle(), reject: () => reject(new Error("Unavailable")),
  };
}
async function main() {
  const state = boot();
  assert.equal(state.audio.calls, 0, "Never autoplay");
  assert.equal(state.button.hidden, false);
  assert.equal(state.audio.hidden, true);
  const playing = state.click();
  assert.equal(state.button.attributes["aria-busy"], "true");
  state.settle();
  await playing;
  assert.equal(state.button.dataset.state, "playing");
  await state.click();
  assert.equal(state.audio.paused, true);
  assert.equal(state.button.dataset.state, "paused");
  assert.equal(state.audio.currentTime, 42, "Pause keeps the playback position");
  const resume = state.click();
  state.settle();
  await resume;
  state.windowEvents.pagehide();
  assert.equal(state.audio.paused, true);
  const rapid = state.click();
  await state.click();
  state.reject();
  await rapid;
  assert.equal(state.button.dataset.state, "paused");
  assert.equal(state.error.hidden, true, "Cancelling a pending play is not a load error");
  const failed = state.click();
  state.reject();
  await failed;
  assert.equal(state.error.hidden, false);
  assert.equal(state.button.dataset.state, "paused");
  const retry = state.click();
  assert.equal(state.error.hidden, true);
  state.settle();
  await retry;
  state.events.error();
  assert.equal(state.error.hidden, false);
  assert.equal(state.audio.paused, true);
  const html = fs.readFileSync(path.join(root, "10-years-with-miku/index.html"), "utf8");
  const audioTag = html.match(/<audio[^>]+>/)[0];
  assert.ok(audioTag.includes('preload="none"'));
  assert.ok(/\sloop\b/.test(audioTag), "Native loop repeats the track");
  assert.ok(/\scontrols\b/.test(audioTag), "Native controls remain available without JavaScript");
  assert.ok(!/\sautoplay\b/.test(audioTag));
  for (const page of ["index.html", "works/index.html", "about/index.html", "contact/index.html"]) {
    assert.ok(!fs.readFileSync(path.join(root, page), "utf8").includes("anniversary-music.js"));
  }
  console.log("PASS: opt-in music, play/pause/resume, native looping, rapid cancellation, retry and navigation cleanup.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
