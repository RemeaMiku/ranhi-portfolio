const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const pages = ["", "works/", "about/", "contact/", "10-years-with-miku/"];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const redirect = read("legacy-redirect.js");
const theme = read("theme.js");

// Check both custom domains and GitHub Pages project prefixes.
for (const prefix of ["/", "/ranhi-portfolio/"]) {
  for (const route of pages) {
    const html = read(route + "index.html");
    const pageURL = new URL(prefix + route, "https://example.test");
    for (const key of ["home", "works", "about", "contact"]) {
      assert.equal((html.match(new RegExp('<a [^>]*data-i18n="' + key + '"', "g")) || []).length, 1);
    }
    assert.ok(html.includes('rel="canonical" href="https://ranhi.net/' + route + '"'));
    assert.ok(!html.includes("<base"), "Local fragment links must stay on their own page");
    for (const [, attribute, value] of html.matchAll(/(src|href|data-image-[ab])="([^"]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/)/i.test(value)) continue;
      const url = new URL(value, pageURL);
      assert.ok(url.pathname.startsWith(prefix), value + " must stay inside the site");
      let file = decodeURIComponent(url.pathname.slice(prefix.length));
      if (file.endsWith("/") || !file) file += "index.html";
      assert.ok(fs.existsSync(path.join(root, file)), route + " → " + value);
      if (attribute === "href" && file.endsWith(".html")) {
        assert.ok(!/\.html(?:[?#]|$)/.test(value), "Navigation uses directory URLs");
        if (url.hash) assert.ok(read(file).includes('id="' + url.hash.slice(1) + '"'), value);
      }
    }

    // A slash at the end of a subpage URL must not trigger the homepage entrance.
    for (const pathname of [pageURL.pathname, pageURL.pathname + "index.html"]) {
      const classes = new Set();
      vm.runInNewContext(theme, {
        URL, location: { pathname },
        localStorage: { getItem: () => null },
        sessionStorage: { getItem: () => null },
        document: {
          currentScript: { src: "https://example.test" + prefix + "theme.js" },
          documentElement: { dataset: {}, classList: { add: (name) => classes.add(name) } },
          addEventListener() {},
        },
        window: { matchMedia: () => ({ matches: false }) },
      });
      assert.equal(classes.has("home-intro-pending"), route === "", pathname);
    }
    if (!route) continue;
    const oldPage = read(route.slice(0, -1) + ".html");
    assert.ok(oldPage.includes('data-target="' + route + '"'));
    assert.ok(oldPage.includes('<a href="' + route + '">'));
    assert.ok(!oldPage.includes('class="navlinks"'), "Old pages only contain a redirect");
    for (const [search, hash] of [["", ""], ["?lang=ja&from=bookmark", "#winter-midnight"]]) {
      let destination;
      vm.runInNewContext(redirect, {
        URL,
        document: { currentScript: {
          src: "https://example.test" + prefix + "legacy-redirect.js",
          dataset: { target: route },
        } },
        location: { search, hash, replace: (url) => { destination = url; } },
      });
      assert.equal(destination, pageURL.href + search + hash, "Keep bookmarks, query parameters and history replacement");
    }
  }
}
assert.ok(read("i18n.js").includes('new URL("locales/", scriptURL)'), "Language resources resolve from the shared script");
console.log("PASS: directory navigation, resources, localization bindings, anchors, legacy redirects and homepage detection at root/project prefixes.");
