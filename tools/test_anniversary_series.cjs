const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "10-years-with-miku/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "anniversary.css"), "utf8");
for (const id of ["series", "special-series", "song-series", "sp01"]) {
  assert.equal(html.split('id="' + id + '"').length - 1, 1, id);
}
assert.ok(html.includes('aria-controls="special-series"'));
assert.ok(html.includes('aria-controls="song-series"'));
assert.ok(!html.includes('href="#special-series"'));
assert.ok(!html.includes('href="#song-series"'));
assert.equal((html.match(/class="anniversary-artwork"/g) || []).length, 1);
assert.ok(html.includes('datetime="2026-10-27"'));
assert.ok(html.includes('width="2560" height="1785"'));
const song = html.split('id="song-series"')[1].split("</section>")[0];
assert.ok(song.includes('class="series-teaser"'));
assert.ok(song.includes('data-i18n="seriesTeaser"'), "Identify the supplied silhouette as a teaser, not a finished illustration");
assert.ok(song.includes('01-senbonzakura-teaser.webp'));
assert.ok(fs.statSync(path.join(root, "images/01-senbonzakura-teaser.webp")).size > 0);
assert.ok(css.includes("height: auto; object-fit: contain"));
for (const suffix of ["", "-1280"]) {
  assert.ok(fs.statSync(path.join(root, "images", "sp01-meeting-you-is-the-greatest-gift" + suffix + ".webp")).size > 0);
}
const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]);
for (const locale of ["en", "ja", "zh-Hans", "zh-Hant"]) {
  const { ui } = JSON.parse(fs.readFileSync(path.join(root, "locales", locale + ".json")));
  for (const key of keys) assert.ok(ui[key]?.trim(), locale + "/" + key);
  assert.ok(ui.sp01Credit.includes("あさひクロイ"));
  assert.equal(ui.seriesSpNext, undefined);
  assert.equal(ui.seriesSongNext, undefined);
}
const hans = JSON.parse(fs.readFileSync(path.join(root, "locales/zh-Hans.json"))).ui;
const ja = JSON.parse(fs.readFileSync(path.join(root, "locales/ja.json"))).ui;
assert.equal(hans.sp01Title, "与你的相遇便是最好的礼物");
assert.equal(ja.sp01Title, "君に出会えたことが最高のプレゼント");
console.log("PASS: SP01 artwork, exact titles, four-language credits and song 01 silhouette teaser.");
