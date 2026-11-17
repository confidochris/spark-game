"""Turn a face picture on a plain white background into game-ready PNGs.

Usage (from the spark-game folder):
    python3 tools/process-faces.py art/source/chris-source.jpg chris
    python3 tools/process-faces.py art/source/shelley-source.jpg shelley
    python3 tools/process-faces.py --preview

Writes art/<name>-1024.png, art/<name>-256.png, art/<name>-128.png (transparent)
and copies the 256 version to public/characters/<name>.png (what the game loads).
--preview rebuilds art/faces-preview.png from whatever faces exist.
Needs Python 3 with Pillow:  pip install pillow
"""
import sys, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ART, PUB = ROOT / 'art', ROOT / 'public' / 'characters'

def cut_out(img):
    img = img.convert('RGB')
    w, h = img.size
    marker = img.copy()
    # Paint the background magenta from every border point (flood fill keeps
    # white eyes and teeth inside the outline untouched).
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w - 1, h // 2), (w // 2, h - 1)]:
        ImageDraw.floodfill(marker, (x, y), (255, 0, 255), thresh=60)
    px = marker.load()
    mask = Image.new('L', (w, h), 255)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == (255, 0, 255):
                mp[x, y] = 0
    mask = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = img.convert('RGBA')
    out.putalpha(mask)
    return out

def square(img, pad=0.04):
    box = img.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    img = img.crop(box)
    side = int(max(img.size) * (1 + pad * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2), img)
    return canvas

def process(src, name):
    ART.mkdir(exist_ok=True); PUB.mkdir(parents=True, exist_ok=True)
    face = square(cut_out(Image.open(src)))
    for size in (1024, 256, 128):
        face.resize((size, size), Image.LANCZOS).save(ART / f'{name}-{size}.png')
    shutil.copy(ART / f'{name}-256.png', PUB / f'{name}.png')
    print('wrote', name)

def preview():
    names = [n for n in ('chris', 'shelley') if (ART / f'{n}-1024.png').exists()]
    W, H = 520 * len(names) + 40, 640
    bg = Image.new('RGBA', (W, H), (7, 28, 18, 255))
    d = ImageDraw.Draw(bg)
    try:
        font = ImageFont.truetype('DejaVuSans-Bold.ttf', 40)
    except OSError:
        font = ImageFont.load_default()
    for i, n in enumerate(names):
        cx = 40 + 520 * i + 240
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((cx - 230, 40, cx + 230, 500), fill=(243, 193, 78, 120))
        bg = Image.alpha_composite(bg, glow.filter(ImageFilter.GaussianBlur(30)))
        face = Image.open(ART / f'{n}-1024.png').resize((440, 440), Image.LANCZOS)
        bg.alpha_composite(face, (cx - 220, 50))
        d = ImageDraw.Draw(bg)
        d.text((cx, 560), n.upper(), fill=(243, 193, 78), font=font, anchor='mm')
    bg.convert('RGB').save(ART / 'faces-preview.png')
    print('wrote art/faces-preview.png')

if __name__ == '__main__':
    if sys.argv[1:] == ['--preview']:
        preview()
    else:
        process(sys.argv[1], sys.argv[2]); preview()
