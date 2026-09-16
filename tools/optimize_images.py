from pathlib import Path
from PIL import Image

SOURCE = Path('.source-art')
DESTINATION = Path('images')
DESTINATION.mkdir(exist_ok=True)

MAPPING = {
    '初音ミク　奇跡の挨拶': 'cover-the-new-mirai.webp',
    '未来有你2026A': 'miku-with-you-2026-a.webp',
    '未来有你2026B': 'miku-with-you-2026-b.webp',
    '魔法未来2026': 'magical-mirai-2026.webp',
    'MIKU 19TH A': 'station-no-19-a.webp',
    'MIKU 19TH B': 'station-no-19-b.webp',
    '日清UFO 初音未来': 'gets-sucked-in.webp',
    'HIKARI': 'hikari.webp',
    '初音未来V6': 'the-new-mirai.webp',
    '云端之上 初音未来': 'above-the-clouds.webp',
    '初音未来 花词VerB': 'flower-terms.webp',
    '公式服立绘征稿活动展示': 'miku-rin-luka-meiko-character-art.webp',
    'SYLPHIETTE': 'a-place-for-the-two-of-us.webp',
    'ROXY': 'the-first-step.webp',
    'MIKU AND TETO': 'miku-and-teto.webp',
}

for original, output in MAPPING.items():
    source = next(path for path in SOURCE.glob('*.png') if path.name.startswith(original))
    image = Image.open(source).convert('RGB')
    # Preserve dimensions and aspect ratio; lossless-ish quality is intentional for artwork.
    image.save(DESTINATION / output, 'WEBP', quality=92, method=6)
    print(f'{source.name} -> {output} ({image.size[0]}x{image.size[1]})')
