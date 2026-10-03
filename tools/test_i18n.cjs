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
  const select = {
    value: "", attrs: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    addEventListener(key, fn) { this[key] = fn; },
  };
  const theme = { textContent: "", setAttribute() {} };
  const context = {
    URL, console: { warn() {} },
    window: { addEventListener(key, fn) { listeners[key] = fn; } },
    document: {
      currentScript: { src: "https://example.test/ranhi-portfolio/i18n.js?v=test" },
      documentElement: { lang: "en", dataset: { theme: "auto" } },
      querySelector(selector) {
        if (selector === "[data-language-select]") return select;
        if (selector === "[data-theme-toggle]") return theme;
        return null;
      },
      querySelectorAll(selector) { return selector === "[data-language-select]" ? [select] : []; },
      addEventListener(name, fn) { if (name === "DOMContentLoaded") ready = fn; },
    },
    navigator: { languages: preferred, language: preferred[0] },
    localStorage: {
      getItem() { if (options.blockedStorage) throw new Error("Blocked"); return saved; },
      setItem(key, value) { if (options.blockedStorage) throw new Error("Blocked"); saved = value; },
    },
    async fetch(url) {
      assert.ok(url.pathname.startsWith("/ranhi-portfolio/locales/"));
      const locale = path.basename(url.pathname, ".json");
      if (options.gates?.[locale]) await options.gates[locale];
      if (options.missing?.includes(locale)) return { ok: false, status: 404 };
      const data = structuredClone(resources[locale]);
      if (options.missingKey && locale !== "en") delete data.ui[options.missingKey];
      return { ok: true, json: async () => data };
    },
  };
  vm.runInNewContext(source, context);
  ready();
  return { context, select, theme, listeners, stored: () => saved,
    change(value) { select.value = value; select.change({ target: select }); },
  };
}

async function main() {
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
    for (const section of ["ui", "types", "artworkNotes"]) {
      assert.deepEqual(Object.keys(resource[section]).sort(), Object.keys(resources.en[section]).sort(), locale + "/" + section);
      assert.ok(Object.values(resource[section]).every((value) => typeof value === "string" && value.trim()), locale);
    }
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
    for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(resources.en.ui[key], key);
    if (page === "works") {
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
  console.log("PASS: four dictionaries, all bindings and notes, language matching, persistence, legacy preferences, blocked storage, resource/key fallback, request races, globe UI and three A/B switches.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
