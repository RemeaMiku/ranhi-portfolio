const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const page = fs.readFileSync(path.join(root, "contact/index.html"), "utf8");
const links = [
  "mailto:remeamiku@gmail.com",
  "https://www.pixiv.net/users/24701727",
  "https://piapro.jp/RemeaMiku",
  "https://x.com/RemeaMiku",
  "https://www.xiaohongshu.com/user/profile/68975866000000002801ebd7",
  "https://www.instagram.com/ranhi_illust",
  "https://www.threads.com/@ranhi_illust",
  "https://www.tiktok.com/@ranhi_illust",
];
for (const href of links) assert.equal(page.split('href="' + href + '"').length - 1, 1, href);
for (const href of [links[1], links[4]]) {
  const card = page.split('href="' + href + '"')[1].split("</a>")[0];
  assert.ok(/<small(?: lang="en")?>@Ranhi<\/small>/.test(card), href + " displays @Ranhi");
}
for (const tag of page.matchAll(/<a [^>]+>/g)) {
  if (tag[0].includes('href="https:')) {
    assert.ok(tag[0].includes('target="_blank"'));
    assert.ok(tag[0].includes('rel="noopener noreferrer"'));
  }
}
for (const id of ["art-platforms", "social-updates", "wechat-title"]) {
  assert.ok(page.includes('aria-labelledby="' + id + '"'));
  assert.ok(page.includes('id="' + id + '"'));
}
assert.ok(page.includes('download="ranhi-wechat-qr.jpg"'));
assert.ok(page.includes('src="../images/wechat-ranhi-qr.jpg" width="430" height="430"'));
assert.ok(fs.statSync(path.join(root, "images/wechat-ranhi-qr.jpg")).size > 0);
assert.ok(page.includes('<strong lang="en">Ranhi</strong>'));
assert.ok(!page.includes('class="contact-list"'));
const css = fs.readFileSync(path.join(root, "contact.css"), "utf8");
for (const icon of ["pixiv", "piapro", "x", "xiaohongshu", "instagram", "threads", "tiktok", "wechat"]) {
  assert.ok(page.includes('brand-icon--' + icon + '"'), icon);
  assert.ok(css.includes('url("images/social/' + icon + '.svg")'), icon);
  const svg = fs.readFileSync(path.join(root, "images/social", icon + ".svg"), "utf8");
  assert.ok(svg.includes('viewBox="0 0 24 24"'));
  assert.ok(svg.includes("<path "));
  assert.ok(!/<script|onload=|href=/i.test(svg));
}
assert.ok(!/aria-hidden="true">(?:IG|Th|pi|红|♪|P)<\/span>/.test(page), "No text substitutes for brand marks");
for (const locale of ["en", "ja", "zh-Hans", "zh-Hant"]) {
  const ui = JSON.parse(fs.readFileSync(path.join(root, "locales", locale + ".json"), "utf8")).ui;
  for (const key of ["contactEmail", "contactArtPlatforms", "contactSocialPlatforms", "contactWechat",
    "contactNickname", "contactWechatHint", "contactSaveQr", "contactQrAlt"]) assert.ok(ui[key]?.trim(), locale + "/" + key);
}
console.log("PASS: all eight contact links, grouped headings, translated QR card and downloadable original image.");
