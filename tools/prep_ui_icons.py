"""Makes the shipped UI art from the sources in art/:
   art/sound-on.png, sound-off.png, findings-icon.png -> public/img/ui/   (black background turned into transparency)
   art/card-back.png, card-back-2.png                 -> public/img/findings/back.png (faded gold), back-2.png (colourful)
Run: python tools/prep_ui_icons.py   (needs Pillow + numpy)"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ART, UI, FIND = 'art/', 'public/img/ui/', 'public/img/findings/'

def black_to_alpha(img, bg=16):
    """Glow on a dark background -> RGBA: alpha = the light's brightness, colour = the light itself (looks the same over black)."""
    a = np.clip(np.asarray(img.convert('RGB')).astype(float) - bg, 0, None)
    m = a.max(axis=2, keepdims=True)
    rgb = np.where(m > 0, a / np.maximum(m, 1e-6) * 255, 0)
    return Image.fromarray(np.dstack([rgb, m * 255 / 239]).clip(0, 255).astype('uint8'), 'RGBA')

def icon(src, dst, box, size, pad=0):
    im = black_to_alpha(Image.open(ART + src).crop(box))
    if pad:
        c = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0)); c.paste(im, (pad, pad)); im = c
    im.thumbnail((size, size), Image.LANCZOS); im.save(UI + dst, optimize=True); print(dst, im.size)

icon('sound-on.png', 'sound-on.png', (40, 25, 522, 445), 256)
icon('sound-off.png', 'sound-off.png', (40, 25, 522, 445), 256)
icon('findings-icon.png', 'findings.png', (205, 190, 975, 1010), 256)

# card backs -> 480 px wide, all squeezed to the shape CONFIG/CSS expect (977:1362), transparent outside the card
W, SHAPE = 480, 977 / 1362

def finish(im, mask, name):
    im = im.convert('RGBA'); im.putalpha(mask)
    im = im.resize((W, round(W / SHAPE)), Image.LANCZOS); im.save(FIND + name, optimize=True); print(name, im.size)

# A: golden, faded. Cropped to the outer gold line, corners cut like the frame, the gold fades into the night colour
FADE, GREY, CUT = 0.52, 0.25, 46
im = Image.open(ART + 'card-back.png').convert('RGB').crop((44, 39, 1021, 1401))
a = np.asarray(im).astype(float); night = np.array([8, 14, 26.])
a = night + (a - night) * FADE
lum = a.mean(axis=2, keepdims=True); a = a * (1 - GREY) + lum * GREY * np.array([1.0, 0.95, 0.85])
im = Image.fromarray(a.clip(0, 255).astype('uint8'))
w, h = im.size; k = 4                                             # octagon mask, drawn 4x for smooth edges
mk = Image.new('L', (w * k, h * k), 0)
ImageDraw.Draw(mk).polygon([(CUT*k, 0), ((w-CUT)*k, 0), (w*k, CUT*k), (w*k, (h-CUT)*k), ((w-CUT)*k, h*k), (CUT*k, h*k), (0, (h-CUT)*k), (0, CUT*k)], fill=255)
finish(im, mk.resize((w, h), Image.LANCZOS), 'back.png')

# B: the colourful vintage card, faded the same way (less than A: it has colours to lose). The card is whatever the black background does not reach from the picture's corners
FADE_B, GREY_B = 0.5, 0.75
im = Image.open(ART + 'card-back-2.png').convert('RGB').crop((35, 38, 1028, 1397))
a = np.asarray(im).astype(float); night = np.array([8, 14, 26.])
a = night + (a - night) * FADE_B
lum = a.mean(axis=2, keepdims=True); a = a * (1 - GREY_B) + lum * GREY_B * np.array([1.0, 0.97, 0.9])
im = Image.fromarray(a.clip(0, 255).astype('uint8'))
m = Image.fromarray(((np.asarray(Image.open(ART + 'card-back-2.png').convert('RGB').crop((35, 38, 1028, 1397))).max(axis=2) > 12) * 255).astype('uint8'))
for pt in ((0, 0), (m.width - 1, 0), (0, m.height - 1), (m.width - 1, m.height - 1)):
    ImageDraw.floodfill(m, pt, 128)
m = Image.fromarray(np.where(np.asarray(m) == 128, 0, 255).astype('uint8'))
finish(im, m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8)), 'back-2.png')
