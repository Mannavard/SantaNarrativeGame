"""Makes the shipped web images (WebP) from the sources in art/. Run: python tools/prep_images.py   (needs Pillow + numpy)

  art/sound-on.png, sound-off.png, findings-icon.png  -> public/img/ui/*.webp           (black background -> transparency)
  art/card-back.png, card-back-2.png                  -> public/img/findings/back[-2]-{sm,lg}.webp   (faded)
  art/finding-<key>.png                               -> public/img/findings/<key>-{sm,lg}.webp      (cropped to the gold frame)
  any PNG still in public/img/ and public/img/ui/     -> the same name as .webp, the PNG is removed
       (tools/prep_gift.py and slice_sheet.py write PNGs: run this one after them)

All cards come out the same size, 2:3. `sm` is for phones, `lg` for everything else (game.js picks one: CARD_SIZE)."""
import glob, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ART, UI, FIND = 'art/', 'public/img/ui/', 'public/img/findings/'
CARD = {'sm': (360, 540), 'lg': (540, 810)}       # phone grid card ~95 css px, the flying one up to 220 css px
NIGHT = np.array([8, 14, 26.])

def webp(im, path, q=86):
    im.save(path, 'WEBP', quality=q, alpha_quality=90, method=6); print(f'{path:44s} {im.size[0]}x{im.size[1]}  {os.path.getsize(path)//1024} KB')

def black_to_alpha(img, bg=16):
    """Glow on a dark background -> RGBA: alpha = the light's brightness, colour = the light itself (looks the same over black)."""
    a = np.clip(np.asarray(img.convert('RGB')).astype(float) - bg, 0, None)
    m = a.max(axis=2, keepdims=True)
    rgb = np.where(m > 0, a / np.maximum(m, 1e-6) * 255, 0)
    return Image.fromarray(np.dstack([rgb, m * 255 / 239]).clip(0, 255).astype('uint8'), 'RGBA')

def card_mask(rgb, thr):
    """The card = everything the dark background cannot reach from the picture's corners. Returns (mask, bbox)."""
    m = Image.fromarray(((np.asarray(rgb).max(axis=2) > thr) * 255).astype('uint8')).copy()   # copy: fromarray images are read-only
    for pt in ((0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)):
        ImageDraw.floodfill(m, pt, 128)
    card = (np.asarray(m) != 128)
    ys, xs = np.where(card)
    mask = Image.fromarray((card * 255).astype('uint8')).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1))
    return mask, (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

def fade(rgb, f, grey, tint):
    a = NIGHT + (np.asarray(rgb).astype(float) - NIGHT) * f
    lum = a.mean(axis=2, keepdims=True); a = a * (1 - grey) + lum * grey * np.array(tint)
    return Image.fromarray(a.clip(0, 255).astype('uint8'))

def card(src, name, thr, look=None):
    rgb = Image.open(ART + src).convert('RGB')
    mask, box = card_mask(rgb, thr)
    if look: rgb = look(rgb)
    im = rgb.convert('RGBA'); im.putalpha(mask); im = im.crop(box)
    for sz, wh in CARD.items():                                   # every card is squeezed to exactly 2:3
        webp(im.resize(wh, Image.LANCZOS), f'{FIND}{name}-{sz}.webp', 84 if sz == 'sm' else 86)

# corner buttons: shown at 58 css px (46 on phones) -> 160 px covers 3x screens
for src, dst, box in (('sound-on.png', 'sound-on', (40, 25, 522, 445)), ('sound-off.png', 'sound-off', (40, 25, 522, 445)),
                      ('findings-icon.png', 'findings', (205, 190, 975, 1010))):
    im = black_to_alpha(Image.open(ART + src).crop(box)); im.thumbnail((160, 160), Image.LANCZOS); webp(im, f'{UI}{dst}.webp', 90)

# card backs: A golden, B colourful vintage (the one in use), both faded so a closed card stays quiet
card('card-back.png', 'back', 60, lambda c: fade(c, 0.52, 0.25, [1.0, 0.95, 0.85]))
card('card-back-2.png', 'back-2', 12, lambda c: fade(c, 0.50, 0.75, [1.0, 0.97, 0.90]))
# card faces: the order of CONFIG.findings
for key in ('wind', 'branch', 'globe', 'star'):
    if os.path.exists(f'{ART}finding-{key}.png'): card(f'finding-{key}.png', key, 110)

# leftover PNGs (stepper frames, gift) -> WebP of the same size
for p in glob.glob('public/img/*.png') + glob.glob(UI + '*.png'):
    if os.path.getsize(p) < 4096: continue                        # tiny ones (heart.png) are smaller as PNG
    webp(Image.open(p).convert('RGBA'), p[:-4] + '.webp', 90); os.remove(p)
