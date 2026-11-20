#!/usr/bin/env python3
"""Cut the gift sprites (drawn on a white background) into transparent PNGs:
   img/gift-body.png (the open box) and img/gift-lid.png (the lid with the bow).

Usage:  python3 tools/prep_gift.py --body path/to/box.webp --lid path/to/lid.webp [--scale 0.5]
Both sprites must come in the same pixel scale (as drawn). Only background connected to the image border is
removed, so cream ribbons inside the sprites are kept.  Requires: pip install pillow
"""
import sys, os
from collections import deque
from PIL import Image, ImageFilter

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def cut(path):
    im = Image.open(path).convert('RGB'); W, H = im.size; px = im.load()
    bgc = lambda p: min(p) >= 232 and max(p) - min(p) <= 22            # near-white, almost no colour
    bg = bytearray(W * H); q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if bgc(px[x, y]) and not bg[y*W+x]: bg[y*W+x] = 1; q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            if bgc(px[x, y]) and not bg[y*W+x]: bg[y*W+x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < W and 0 <= ny < H and not bg[ny*W+nx] and bgc(px[nx, ny]): bg[ny*W+nx] = 1; q.append((nx, ny))
    a = Image.new('L', (W, H), 255); ap = a.load()
    for y in range(H):
        for x in range(W):
            if bg[y*W+x]: ap[x, y] = 0
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))   # shave the light halo, soften
    out = im.convert('RGBA'); out.putalpha(a)
    return out.crop(out.getbbox())

body, lid = arg('--body'), arg('--lid'); scale = float(arg('--scale', '0.5'))
if not (body and lid): sys.exit(__doc__)
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img'); os.makedirs(root, exist_ok=True)
sizes = {}
for name, p in (('body', body), ('lid', lid)):
    sp = cut(p); sizes[name] = sp.size
    sp = sp.resize((round(sp.width * scale), round(sp.height * scale)), Image.LANCZOS)
    dst = os.path.join(root, f'gift-{name}.png'); sp.save(dst, optimize=True)
    print('saved', dst, sp.size, os.path.getsize(dst) // 1024, 'KB')
bw, bh = sizes['body']; lw, lh = sizes['lid']
k = 1.06 * bw / lw                                # lid shrinks a little so it overhangs the box by ~6%
print('\nSuggested CONFIG.gift values (check them by eye, then fine-tune):')
print(f"  lidFit:{{w:1.06,left:-0.03,top:{0.47 - lh * k / bh + 0.02:.3f}}},")
