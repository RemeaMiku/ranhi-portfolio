const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "i18n.js"), "utf8");
const locales = ["en", "zh-Hans", "zh-Hant", "ja"];
const resources = Object.fromEntries(locales.map((locale) => [
  locale, JSON.parse(fs.readFileSync(path.join(root, "locales", locale + ".json"), "utf8")),
]));
const flush = () => new Promise((resolve) => setImmediate(resolve));

function boot(preferred, saved = null, options = {}) {
  let ready;
  const listeners = {};
  const timers = new Map();
  const fetched = [];
  const session = options.session || new Map();
  let timerId = 0;
  const select = {
    value: "", attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    addEventListener(key, fn) { this[key] = fn; },
  };
  const theme = { textContent: "", setAttribute() {} };
  const updated = { dateTime: "2026-10-04", textContent: "" };
  const fixedTitles = ["miku-with-you", "magical-mirai", "hikari", "miku-and-teto"];
  const titles = Object.fromEntries(Object.entries(resources.en.artworkTitles).map(([id, title]) => [id, {
    dataset: { artworkTitle: id }, textContent: title, lang: fixedTitles.includes(id) ? "en" : "",
    hasAttribute(name) { return name === "data-title-original" && fixedTitles.includes(id); },
  }]));
  const context = {
    URL, AbortController, console: { warn() {} },
    window: {
      addEventListener(key, fn) { listeners[key] = fn; },
      setTimeout(fn, delay) { timers.set(++timerId, { fn, delay }); return timerId; },
      clearTimeout(id) { timers.delete(id); },
    },
    document: {
      currentScript: { src: "https://" + (options.local ? "localhost" : "example.test") + "/ranhi-portfolio/i18n.js?v=" + (options.version || "test") },
      documentElement: { lang: "en", dataset: { theme: "auto" } },
      querySelector(selector) {
        if (selector === "[data-language-select]") return select;
        if (selector === "[data-theme-toggle]") return theme;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === "[data-language-select]") return [select];
        if (selector === "time[data-last-updated]") return [updated];
        if (selector === "[data-artwork-title]") return Object.values(titles);
        return [];
      },
      addEventListener(name, fn) { if (name === "DOMContentLoaded") ready = fn; },
    },
    navigator: { languages: preferred, language: preferred[0] },
    localStorage: {
      getItem() { if (options.blockedStorage) throw new Error("Blocked"); return saved; },
      setItem(key, value) { if (options.blockedStorage) throw new Error("Blocked"); saved = value; },
    },
    sessionStorage: {
      getItem(key) { if (options.blockedStorage) throw new Error("Blocked"); return session.get(key) || null; },
      setItem(key, value) { if (options.blockedStorage) throw new Error("Blocked"); session.set(key, value); },
    },
    async fetch(url, init) {
      assert.ok(url.pathname.startsWith("/ranhi-portfolio/locales/"));
      const locale = path.basename(url.pathname, ".json");
      fetched.push(locale);
      if (options.gates?.[locale]) await Promise.race([
        options.gates[locale],
        new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new Error("Timeout")), { once: true })),
      ]);
      if (options.missing?.includes(locale)) return { ok: false, status: 404 };
      const data = structuredClone(resources[locale]);
      if (options.missingKey && locale !== "en") delete data.ui[options.missingKey];
      if (options.missingTitle && locale !== "en") delete data.artworkTitles[options.missingTitle];
      if (options.changedEventTitle && locale !== "en") data.artworkTitles["miku-with-you"] = "Do not translate this event";
      return { ok: true, json: async () => data };
    },
  };
  vm.runInNewContext(source, context);
  if (!options.beforeDom) ready();
  return { context, select, theme, updated, titles, listeners, fetched, session, ready, stored: () => saved,
    runTimers(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.fn(); } },
    change(value) { select.value = value; select.change({ target: select }); },
  };
}

async function main() {
  const early = boot(["zh-CN"], null, { beforeDom: true });
  assert.equal(early.context.document.documentElement.lang, "zh-Hans");
  assert.equal(early.context.document.documentElement.dataset.i18nState, "loading");
  assert.deepEqual(early.fetched, ["en", "zh-Hans"], "Downloads begin in the head");
  early.ready();
  await flush();
  assert.equal(early.context.document.documentElement.dataset.i18nState, "ready");
  assert.equal(early.updated.textContent, "2026年10月4日");
  assert.equal(early.titles["moonlight-and-osmanthus"].textContent, "中秋明月 桂影婵娟");
  assert.equal(early.titles["the-new-mirai"].textContent, "新的未来");
  assert.equal(early.titles["the-new-mirai"].lang, "zh-Hans");
  const japaneseTitles = boot(["ja"], null, { changedEventTitle: true });
  await flush();
  for (const [id, expected] of Object.entries({
    "winter-midnight": "Winter Midnight", "the-new-mirai": "新たなミライ",
    "above-the-clouds": "雲の向こうで", "flower-terms": "花詞",
    "place-for-two": "二人の場所", "first-step": "最初の一歩",
    "gets-sucked-in": "吸い込まれちゃった！", "hikari": "HIKARI",
    "miku-with-you": "MIKU WITH YOU 2026", "magical-mirai": "MAGICAL MIRAI 2026",
  })) assert.equal(japaneseTitles.titles[id].textContent, expected);
  assert.equal(japaneseTitles.titles["miku-with-you"].lang, "en");
  japaneseTitles.change("en");
  await flush();
  assert.equal(japaneseTitles.titles["above-the-clouds"].textContent, "Above the Clouds");
  assert.equal(japaneseTitles.titles["gets-sucked-in"].textContent, "Gets Sucked In");
  const missingTitle = boot(["ja"], null, { missingTitle: "above-the-clouds" });
  await flush();
  assert.equal(missingTitle.titles["above-the-clouds"].textContent, "Above the Clouds");
  assert.equal(missingTitle.titles["above-the-clouds"].lang, "en");
  const warm = boot(["zh-CN"], null, { session: early.session });
  await flush();
  assert.equal(warm.context.document.documentElement.lang, "zh-Hans");
  assert.equal(warm.fetched.length, 0, "Page changes use the versioned tab cache");
  const newRelease = boot(["zh-CN"], null, { session: early.session, version: "next" });
  await flush();
  assert.equal(newRelease.fetched.length, 2, "New releases invalidate cached text");
  const localPreview = boot(["zh-CN"], null, { session: early.session, local: true });
  await flush();
  assert.equal(localPreview.fetched.length, 2, "Local edits remain immediately visible");
  const stalled = boot(["ja-JP"], null, { gates: { en: new Promise(() => {}), ja: new Promise(() => {}) } });
  stalled.runTimers(2500);
  await flush();
  assert.equal(stalled.context.document.documentElement.dataset.i18nState, "error");
  assert.equal(stalled.context.document.documentElement.lang, "en");
  assert.equal(stalled.select.attrs["aria-busy"], undefined);
  const watchdog = boot(["ja-JP"], null, { beforeDom: true });
  watchdog.runTimers(3000);
  assert.equal(watchdog.context.document.documentElement.dataset.i18nState, "error");
  const corruptSession = new Map([["ranhi-i18n:/ranhi-portfolio/locales/test:ja", '{"ui":[],"types":{},"artworkNotes":{}}']]);
  const corrupt = boot(["ja-JP"], null, { session: corruptSession });
  await flush();
  assert.ok(corrupt.fetched.includes("ja"));
  const cases = [
    [["zh-CN"], "zh-Hans"], [["zh-SG"], "zh-Hans"], [["zh"], "zh-Hans"],
    [["zh-TW"], "zh-Hant"], [["zh-HK"], "zh-Hant"], [["zh-MO"], "zh-Hant"],
    [["zh-Hant-CN"], "zh-Hant"], [["zh-Hans-TW"], "zh-Hans"],
    [["zh_Hant_HK"], "zh-Hant"], [["ja-JP"], "ja"], [["en-GB"], "en"],
    [["fr-FR", "ja-JP", "en-US"], "ja"], [["de-DE", "fr-FR"], "en"], [[], "en"],
  ];
  for (const [preferred, expected] of cases) {
    const state = boot(preferred);
    await flush();
    assert.equal(state.context.document.documentElement.lang, expected);
    assert.equal(state.select.value, expected);
    assert.equal(state.stored(), null, "Automatic matching must not save a manual choice");
  }
  for (const saved of ["auto", "unsupported"]) {
    const state = boot(["ja-JP"], saved);
    await flush();
    assert.equal(state.select.value, "ja");
  }
  const manual = boot(["ja-JP"], "zh-Hant");
  await flush();
  assert.equal(manual.select.value, "zh-Hant");
  manual.change("en");
  await flush();
  assert.equal(manual.stored(), "en");
  assert.equal(manual.updated.textContent, "October 4, 2026");
  manual.context.navigator.languages = ["zh-CN"];
  manual.listeners.languagechange();
  await flush();
  assert.equal(manual.select.value, "en");
  manual.listeners.storage({ key: "ranhi-language", newValue: "ja" });
  await flush();
  assert.equal(manual.select.value, "ja");
  const noStorage = boot(["ja-JP"], null, { blockedStorage: true });
  await flush();
  noStorage.change("zh-Hans");
  await flush();
  assert.equal(noStorage.select.value, "zh-Hans");
  const missing = boot(["ja-JP"], null, { missing: ["ja"] });
  await flush();
  assert.equal(missing.select.value, "en");
  const missingKey = boot(["ja-JP"], null, { missingKey: "language" });
  await flush();
  assert.equal(missingKey.select.attrs["aria-label"], "Language");
  const offline = boot(["ja-JP"], null, { missing: ["ja", "en"] });
  await flush();
  assert.equal(offline.context.document.documentElement.dataset.i18nState, "error");
  assert.equal(offline.select.attrs["aria-busy"], undefined);
  let release;
  const race = boot(["en"], null, { gates: { ja: new Promise((resolve) => { release = resolve; }) } });
  await flush();
  race.change("ja");
  race.change("zh-Hant");
  await flush();
  release();
  await flush();
  assert.equal(race.select.value, "zh-Hant", "A slow request must not overwrite the latest choice");
  assert.equal(race.context.document.documentElement.lang, "zh-Hant");
  for (const [locale, resource] of Object.entries(resources)) {
    for (const section of ["ui", "types", "artworkTitles", "artworkNotes"]) {
      assert.deepEqual(Object.keys(resource[section]).sort(), Object.keys(resources.en[section]).sort(), locale + "/" + section);
      assert.ok(Object.values(resource[section]).every((value) => typeof value === "string" && value.trim()), locale);
    }
    assert.deepEqual(Object.keys(resource.artworkTitles), Object.keys(resource.artworkNotes));
    // Artist references must not infer gender; fictional characters are separate.
    for (const key of ["storyIntro", "storyClosingTitle", "storyClosingBody"]) {
      assert.ok(!/\b(?:she|her|hers|he|him|his)\b|[她他]|彼女|彼(?!方)/i.test(resource.ui[key]), locale + "/" + key);
    }
    const category = { en: "Illustration", "zh-Hans": "插画", "zh-Hant": "插畫", ja: "イラスト" }[locale];
    for (const [key, value] of Object.entries(resource.types)) {
      assert.ok(key.endsWith(" / Illustration"), key);
      assert.ok(value.endsWith(" / " + category), locale + "/" + key);
    }
  }
  const bindings = vm.runInNewContext("(" + source.match(/const simpleBindings = (\{[\s\S]*?\n    \});/)[1] + ")");
  for (const key of Object.values(bindings)) assert.ok(resources.en.ui[key], "Missing UI binding " + key);
  for (const page of ["index", "works", "about", "contact"]) {
    const html = fs.readFileSync(path.join(root, page + ".html"), "utf8");
    assert.equal((html.match(/<select data-language-select/g) || []).length, 1);
    assert.equal((html.match(/<option /g) || []).length, 4);
    assert.ok(!html.includes('<option value="auto"'));
    assert.ok(html.includes('class="language-icon"'));
    assert.ok(html.includes('>THANK YOU</small>'));
    assert.ok(html.includes('html[data-i18n-state="loading"] body { visibility: hidden; }'));
    assert.ok(/<script src="i18n\.js\?v=[^"]+"><\/script>/.test(html), "Locale boot must run before the body");
    assert.equal((html.match(/data-last-updated datetime="2026-10-04"/g) || []).length, 1);
    for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(resources.en.ui[key], key);
    for (const [, id] of html.matchAll(/data-artwork-title="([^"]+)"/g)) assert.ok(resources.en.artworkTitles[id], id);
    if (page === "index") assert.equal((html.match(/data-artwork-title=/g) || []).length, 4);
    if (page === "works") {
      assert.equal((html.match(/data-artwork-title=/g) || []).length, 14);
      assert.ok(!html.includes('<p lang="zh-CN">中秋明月 桂影婵娟</p>'));
      for (const id of ["miku-with-you", "magical-mirai", "hikari", "miku-and-teto"]) {
        assert.ok(html.includes('data-artwork-title="' + id + '" data-title-original'));
      }
      for (const [, type] of html.matchAll(/<p class="type">([^<]+)<\/p>/g)) {
        assert.ok(resources.en.types[type], "Unmapped work category: " + type);
      }
      for (const [, id] of html.matchAll(/<article class="detail" id="([^"]+)"/g)) assert.ok(resources.en.artworkNotes[id], id);
      assert.equal((html.match(/role="switch"/g) || []).length, 3);
      assert.ok(!html.includes("aria-pressed="));
      for (const [, asset] of html.matchAll(/data-image-[ab]="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(root, asset)), asset);
    }
  }
  assert.ok(!source.includes('bind(".miku-signature'));
  console.log("PASS: localized titles and title fallback, original-name exceptions, pre-paint language gate, versioned session cache, local refresh, timeout/watchdog, localized release date, language matching/fallback, request races and A/B switches.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
