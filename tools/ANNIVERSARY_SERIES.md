# 10 Years with Miku — series conventions

- The special page has two independent sequences. Do not derive the next number from the combined artwork count or the source filename.
- **SP01, SP02…**: RANHI's personal experiences and imagined life with Miku.
- **01, 02…**: illustrations inspired by memorable songs from these ten years.
- SP01 is **与你的相遇便是最好的礼物** / **君に出会えたことが最高のプレゼント**, dated 2026-10-27 on the supplied artwork. Retain the attribution to あさひクロイ and the description as a recreation, not an original composition.
- Song 01 is **千本樱 / 千本桜 / Senbonzakura**. The finished square illustration replaces the silhouette teaser, dated 2026-11-11 on the supplied artwork. Keep cherry-blossom and pinwheel decoration outside the image; do not tint or crop the finished illustration.
- The song series is planned as square, album-cover-style illustrations. Keep the original square image fully visible in the sleeve UI; the vinyl is decorative, not a playback control. Preserve the separate SP layout for personal stories.
- Later SP scenes are ideas, not fixed numbered announcements. Only assign new entries when the user supplies or confirms them.
- Keep each language's copy in its existing locale JSON file; SP01 uses the `sp01*` UI keys. Preserve user-specified titles exactly.
- Keep artwork uncropped; use English, hyphenated asset names with the sequence prefix, responsive WebP sizes and an explicit aspect ratio.
- Completed anniversary works also appear in the general archive and the latest four homepage cards, with a project badge and a link back to the special page. Keep the separate series numbers on the badges. Archive and home dates use YYYY.MM. Senbonzakura uses RANHI's supplied personal reflections in four languages; distinguish those reflections from the original creators' intentions. SP01's archive description reuses its two special-page paragraphs, including the attribution to あさひクロイ.
- Only display music/P and costume design credits in the Senbonzakura panel, retaining the original-song and official-costume links. Verified reference credits: music/lyrics 黒うさP, original art and 壱ノ桜・桜花 costume 一斗まる, original MV 三重の人, guitar hajime, vocals 初音ミク; original upload 2011-09-17. References: https://info.miku.sega.jp/3245 and https://nagano-ueda.gr.jp/event-archive/senbonsakura-matsuri-archive/ . Original video: https://www.nicovideo.jp/watch/sm15630734 . Use the revised source `MR01 千本樱.png` (5000 × 5000), not the earlier `MR01 千本樱1.png`.
- Run `node tools/test_anniversary_series.cjs` and the existing localization, routes, music and logo tests after updates.

- Song 02 is **DECORATOR**, currently a teaser with a geometric placeholder cover, not a completed illustration. Keep it on the special page only until final artwork is supplied. Song album panels alternate artwork left/right by figure order; on narrow screens show the artwork first.
- DECORATOR credits: music/lyrics **kz (livetune)**; **オレンジブロッサム** costume by **Nidy-2D-**. Keep the same two-row credits layout as Senbonzakura. SEGA source: https://info.miku.sega.jp/4643 ; original MV: https://www.youtube.com/watch?v=zweVJrnE1uY .
