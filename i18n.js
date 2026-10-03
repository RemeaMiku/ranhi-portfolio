(() => {
  "use strict";

  const languages = ["en", "zh-Hans", "zh-Hant", "ja"];
  const storageKey = "ranhi-language";
  // Keep resource URLs relative to this script for GitHub Pages subpaths.
  const scriptURL = new URL(document.currentScript.src);
  const resourceRoot = new URL("locales/", scriptURL);
  const resourceVersion = scriptURL.searchParams.get("v") || "1";
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(scriptURL.hostname);
  const sessionKey = (locale) => "ranhi-i18n:" + resourceRoot.pathname + resourceVersion + ":" + locale;
  const validResource = (value) => value && ["ui", "types", "artworkNotes"].every(
    (section) => value[section] && typeof value[section] === "object" &&
      !Array.isArray(value[section]) && Object.values(value[section]).every((text) => typeof text === "string"),
  );
  const cache = new Map();
  let language = "en";
  let dictionary = {};
  let english = {};
  let revision = 0;
  let preference = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (languages.includes(saved)) preference = saved;
  } catch {
    /* The controls also work without browser storage. */
  }

  function resolveLanguage(preferred) {
    for (const value of preferred) {
      const parts = String(value).toLowerCase().replaceAll("_", "-").split("-");
      if (parts[0] === "zh") {
        if (parts.includes("hant")) return "zh-Hant";
        if (parts.includes("hans")) return "zh-Hans";
        return parts.some((part) => ["tw", "hk", "mo"].includes(part))
          ? "zh-Hant" : "zh-Hans";
      }
      if (parts[0] === "ja") return "ja";
      if (parts[0] === "en") return "en";
    }
    return "en";
  }

  const systemLanguage = () => resolveLanguage(
    navigator.languages?.length ? navigator.languages : [navigator.language],
  );
  const translate = (key) => dictionary.ui?.[key] ?? english.ui?.[key] ?? key;

  // Runs in <head>, before any fallback text can be painted.
  document.documentElement.lang = preference || systemLanguage();
  document.documentElement.dataset.i18nState = "loading";
  const revealFallback = window.setTimeout(() => {
    if (document.documentElement.dataset.i18nState !== "loading") return;
    document.documentElement.lang = "en";
    document.documentElement.dataset.i18nState = "error";
  }, 3000);

  function loadResource(locale) {
    if (!cache.has(locale)) {
      // A versioned tab cache makes subsequent page changes network-independent.
      if (!isLocal) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(sessionKey(locale)));
          if (validResource(saved)) {
            const ready = Promise.resolve(saved);
            cache.set(locale, ready);
            return ready;
          }
        } catch { /* Storage is optional; local previews always read the JSON files. */ }
      }
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2500);
      const url = new URL(locale + ".json", resourceRoot);
      url.searchParams.set("v", resourceVersion);
      const request = fetch(url, {
        cache: "no-cache", signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error("Language resource: " + response.status);
        return response.json();
      }).then((resource) => {
        if (!validResource(resource)) {
          throw new Error("Invalid language resource: " + locale);
        }
        if (!isLocal) {
          try { sessionStorage.setItem(sessionKey(locale), JSON.stringify(resource)); }
          catch { /* Keep working when storage is blocked or full. */ }
        }
        return resource;
      }).catch((error) => {
        cache.delete(locale);
        throw error;
      }).finally(() => window.clearTimeout(timeout));
      cache.set(locale, request);
    }
    return cache.get(locale);
  }

  function updateTheme(theme) {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button || !dictionary.ui) return;
    const key = { auto: "themeAuto", dark: "themeDark", light: "themeLight" }[theme] || "themeAuto";
    button.textContent = translate("theme") + " / " + translate(key);
    button.setAttribute("aria-label", button.textContent + ". " + translate("themeHint"));
  }

  const bindings = [];
  function bind(selector, key, prefix = "", attribute = null) {
    document.querySelectorAll(selector).forEach((element) => {
      bindings.push({ element, key, prefix, attribute });
    });
  }
  function setText(element, value) {
    const arrow = element.querySelector(":scope > span[aria-hidden='true']");
    const nodes = value.split("\n").flatMap((line, index) =>
      index ? [document.createElement("br"), document.createTextNode(line)]
        : [document.createTextNode(line)],
    );
    if (arrow) nodes.push(document.createTextNode(" "), arrow);
    element.replaceChildren(...nodes);
  }

  function render() {
    document.documentElement.lang = language;
    for (const { element, key, prefix, attribute } of bindings) {
      const value = prefix + translate(key);
      if (attribute) element.setAttribute(attribute, value);
      else setText(element, value);
    }
    document.querySelectorAll("[data-original-type]").forEach((element) => {
      const key = element.dataset.originalType;
      element.textContent = dictionary.types?.[key] ?? english.types?.[key] ?? key;
    });
    document.querySelectorAll("[data-original-hours]").forEach((element) => {
      element.textContent = element.dataset.originalHours.replace(/\s*h/g, " " + translate("hours"));
    });
    document.querySelectorAll(".work-card").forEach((card) => {
      card.querySelector("img").alt = card.querySelector("h3").textContent + " — " + card.querySelector("p").textContent;
    });
    document.querySelectorAll(".detail").forEach((article) => {
      const notes = article.querySelector(".notes p");
      const localized = dictionary.artworkNotes?.[article.id];
      const fallback = english.artworkNotes?.[article.id];
      if (notes && (localized ?? fallback)) {
        notes.textContent = localized ?? fallback;
        notes.lang = localized ? language : "en";
      }
      const title = article.querySelector("h2").textContent;
      const image = article.querySelector(".detail-image > img");
      const toggle = article.querySelector(".expression-switch");
      if (toggle) {
        toggle.dataset.altA = title + " — " + translate("expression") + " A";
        toggle.dataset.altB = title + " — " + translate("expression") + " B";
        toggle.dataset.error = translate("variantError");
        toggle.setAttribute("aria-label", title + " — " + translate("alternateExpression"));
        image.alt = image.getAttribute("src") === toggle.dataset.imageB
          ? toggle.dataset.altB : toggle.dataset.altA;
      } else {
        image.alt = title + " — " + article.querySelector(".type").textContent;
      }
    });
    const select = document.querySelector("[data-language-select]");
    if (select) select.value = language;
    updateTheme(document.documentElement.dataset.theme || "auto");
    document.querySelectorAll("time[data-last-updated]").forEach((element) => {
      element.textContent = new Intl.DateTimeFormat(language, {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      }).format(new Date(element.dateTime + "T00:00:00Z"));
    });
    const page = document.querySelector(".navlinks [aria-current='page']")?.getAttribute("href");
    const titleKey = {
      "index.html": "portfolio", "works.html": "works",
      "about.html": "about", "contact.html": "contact",
    }[page] || "portfolio";
    document.title = "RANHI — " + translate(titleKey);
  }

  async function changeLanguage(requested) {
    const ticket = ++revision;
    const target = languages.includes(requested) ? requested : systemLanguage();
    const select = document.querySelector("[data-language-select]");
    select?.setAttribute("aria-busy", "true");
    try {
      // Fetch both in parallel; English also supplies any missing individual keys.
      const results = await Promise.allSettled([
        loadResource("en"), loadResource(target),
      ]);
      if (ticket !== revision) return;
      const fallback = results[0].status === "fulfilled" ? results[0].value : null;
      const selected = results[1].status === "fulfilled" ? results[1].value : null;
      if (!selected && !fallback) throw new Error("No language resources available");
      english = fallback || {};
      dictionary = selected || fallback;
      language = selected ? target : "en";
      render();
      document.documentElement.dataset.i18nState = "ready";
    } catch (error) {
      // Keep the existing page usable if a resource cannot be read.
      if (ticket !== revision) return;
      document.documentElement.dataset.i18nState = "error";
      document.documentElement.lang = language;
      if (select) select.value = language;
      console.warn("Could not load translations.", error);
    } finally {
      if (ticket === revision) {
        window.clearTimeout(revealFallback);
        select?.removeAttribute("aria-busy");
      }
    }
  }

  window.RanhiI18n = { resolveLanguage, updateTheme };
  // Start downloads while the HTML is still being parsed, not after it is visible.
  void loadResource("en").catch(() => {});
  void loadResource(preference || systemLanguage()).catch(() => {});
  document.addEventListener("DOMContentLoaded", () => {
    for (const page of ["home", "works", "about", "contact"]) {
      bind(".navlinks a[href='" + (page === "home" ? "index" : page) + ".html']", page);
    }
    const simpleBindings = {
      ".hero-subtitle": "heroTitle",
      ".hero-footer a": "viewWorks",
      ".selected h2": "latestWorks",
      ".selected .text-link": "allWorks",
      ".artist-intro h2": "aboutHeading",
      ".intro-copy": "homeIntro",
      ".artist-intro .text-link": "aboutRanhi",
      ".contact-callout h2": "homeContactTitle",
      ".contact-callout .text-link": "getInTouch",
      ".works-intro h1": "illustration",
      ".works-intro .page-lead": "worksLead",
      ".variant > span": "expressions",
      ".notes > span": "notes",
      ".artist-copy .bio:first-child": "bio1",
      ".artist-copy .bio:last-child": "bio2",
      ".fact:first-child > span": "name",
      ".fact small": "formerly",
      ".fact:nth-child(2) > span": "focus",
      ".fact:nth-child(2) strong": "focusValue",
      ".fact:nth-child(3) > span": "tools",
      ".contact-page h1": "contactTitle",
      ".contact-page .page-lead": "contactLead",
    };
    Object.entries(simpleBindings).forEach(([selector, key]) => bind(selector, key));
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      bindings.push({ element, key: element.dataset.i18n, prefix: "" });
    });
    bind(".navlinks", "navigation", "", "aria-label");
    bind("[data-language-select]", "language", "", "aria-label");
    bind(".hero-background", "cover", "", "aria-label");
    bind(".artist-portrait", "avatar", "", "alt");
    bind(".brand", "home", "RANHI / ", "aria-label");
    bind("meta[name='description']", "portfolio", "RANHI — ", "content");
    if (document.querySelector(".about-page-grid")) {
      bind(".page-intro .page-lead", "aboutLead");
    }
    const social = document.querySelector(".contact-list a[href*='xiaohongshu.com']");
    if (social) {
      social.querySelector("span")?.setAttribute("aria-hidden", "true");
      bind(".contact-list a[href*='xiaohongshu.com']", "xiaohongshu");
    }
    document.querySelectorAll(".type, .work-card > p").forEach((element) => {
      element.dataset.originalType = element.textContent.trim();
    });
    document.querySelectorAll(".detail-info h2, .work-card h3").forEach((element) => {
      element.lang = "en";
    });
    document.querySelectorAll(".detail").forEach((article) => {
      article.querySelectorAll("dt").forEach((element) => {
        const key = element.textContent.trim().toLowerCase();
        bindings.push({ element, key, prefix: "" });
        if (key === "time") {
          element.nextElementSibling.dataset.originalHours = element.nextElementSibling.textContent.trim();
        }
      });
    });
    const select = document.querySelector("[data-language-select]");
    if (select) select.value = preference || systemLanguage();
    select?.addEventListener("change", (event) => {
      if (!languages.includes(event.target.value)) return;
      preference = event.target.value;
      try { localStorage.setItem(storageKey, preference); } catch { /* Session-only choice. */ }
      void changeLanguage(preference);
    });
    window.addEventListener("languagechange", () => {
      if (!preference) void changeLanguage(systemLanguage());
    });
    window.addEventListener("storage", (event) => {
      if (event.key === storageKey || event.key === null) {
        preference = languages.includes(event.newValue) ? event.newValue : null;
        void changeLanguage(preference);
      }
    });
    void changeLanguage(preference);
  });
})();
