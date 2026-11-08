# 10 Years with Miku — series conventions

- The special page has two independent sequences. Do not derive the next number from the combined artwork count or the source filename.
- **SP01, SP02…**: RANHI's personal experiences and imagined life with Miku.
- **01, 02…**: illustrations inspired by memorable songs from these ten years.
- SP01 is **与你的相遇便是最好的礼物** / **君に出会えたことが最高のプレゼント**, dated 2026-10-27 on the supplied artwork. Retain the attribution to あさひクロイ and the description as a recreation, not an original composition.
- Song 01 is planned as **千本樱 / 千本桜 / Senbonzakura**. A transparent silhouette teaser has been supplied; keep it clearly marked as a preview in progress, with no invented completion date.
- The song series is planned as square, album-cover-style illustrations. Keep the original square image fully visible in the sleeve UI; the vinyl is decorative, not a playback control. Preserve the separate SP layout for personal stories.
- Later SP scenes are ideas, not fixed numbered announcements. Only assign new entries when the user supplies or confirms them.
- Keep each language's copy in its existing locale JSON file; SP01 uses the `sp01*` UI keys. Preserve user-specified titles exactly.
- Keep artwork uncropped; use English, hyphenated asset names with the sequence prefix, responsive WebP sizes and an explicit aspect ratio.
- The homepage and general works archive are separate from this special-page series. Do not add anniversary works there without a request.
- Run `node tools/test_anniversary_series.cjs` and the existing localization, routes, music and logo tests after updates.
