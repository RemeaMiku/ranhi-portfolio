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
assert.ok(!song.includes("ILLUSTRATION / SONG MEMORIES"));
assert.ok(song.includes('id="song01"'));
assert.ok(!song.includes('seriesTeaser'), "The completed illustration must no longer be marked as a teaser");
assert.ok(song.includes('width="2560" height="2560"'));
assert.ok(song.includes('datetime="2026-11-11"'));
assert.ok(/01-senbonzakura-1280\.webp(?:\?[^\s"]+)? 1280w/.test(song));
assert.ok(!css.includes('mask-image: url("images/01-senbonzakura-teaser.webp")'), "The old silhouette mask must not obscure the completed artwork");
for (const suffix of ["", "-1280"]) {
  assert.ok(fs.statSync(path.join(root, "images", "01-senbonzakura" + suffix + ".webp")).size > 0);
}
assert.ok(css.includes("height: auto; object-fit: contain"));
for (const suffix of ["", "-1280"]) {
  assert.ok(fs.statSync(path.join(root, "images", "sp01-meeting-you-is-the-greatest-gift" + suffix + ".webp")).size > 0);
}
const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]);
for (const locale of ["en", "ja", "zh-Hans", "zh-Hant"]) {
  const { ui } = JSON.parse(fs.readFileSync(path.join(root, "locales", locale + ".json")));
  for (const key of keys) assert.ok(ui[key]?.trim(), locale + "/" + key);
  assert.ok(ui.song01Alt?.trim(), locale + "/song01Alt");
  assert.ok(ui.sp01Credit.includes("あさひクロイ"));
  assert.equal(ui.seriesSpNext, undefined);
  assert.equal(ui.seriesSongNext, undefined);
}
const hans = JSON.parse(fs.readFileSync(path.join(root, "locales/zh-Hans.json"))).ui;
const ja = JSON.parse(fs.readFileSync(path.join(root, "locales/ja.json"))).ui;
assert.equal(hans.sp01Title, "与你的相遇便是最好的礼物");
assert.equal(ja.sp01Title, "君に出会えたことが最高のプレゼント");
console.log("PASS: SP01 and finished song 01 artwork, responsive assets, exact titles and four-language text.");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const archive = fs.readFileSync(path.join(root, "works/index.html"), "utf8");
const latest = [...home.matchAll(/class="work-card[^\"]*" href="works\/#([^\"]+)"/g)].map(match => match[1]);
assert.deepEqual(latest, ["senbonzakura", "meeting-you-is-the-greatest-gift", "rain-and-hydrangeas", "winter-midnight"]);
for (const id of latest.slice(0, 2)) {
  const entry = archive.split('id="' + id + '"')[1].split("</article>")[0];
  assert.ok(entry.includes("anniversary-work-badge"));
  if (id === "senbonzakura") {
    assert.ok(entry.includes('class="notes notes--paragraphs"'));
    assert.ok(entry.includes('<dd>2026.11</dd>'));
    assert.ok(!entry.includes('2026.11.11'));
  } else {
    assert.ok(entry.includes('class="notes notes--paragraphs"'));
    for (const locale of ["en", "ja", "zh-Hans", "zh-Hant"]) {
      const dictionary = JSON.parse(fs.readFileSync(path.join(root, "locales", locale + ".json")));
      assert.equal(dictionary.artworkNotes[id], dictionary.ui.sp01Note1 + "\n\n" + dictionary.ui.sp01Note2);
      assert.ok(dictionary.artworkNotes[id].includes("あさひクロイ"));
    }
    assert.ok(entry.includes('<dd>2026.10</dd>'));
  }
}
