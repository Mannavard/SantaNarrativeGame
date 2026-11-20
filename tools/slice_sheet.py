#!/usr/bin/env python3
"""Cut the progress-bar sheet into transparent PNGs in img/ui/.

Usage:  python3 tools/slice_sheet.py path/to/sheet.webp [--unit 256]

The sheet may be on a white background or already transparent:
  top row     6 frames:  tree, lights, snow globe, people, gift, and the "?" frame      -> step1..5.png, locked.png
  bottom row  5 pieces:  left cap, 3 middle pieces, right cap                           -> line-left.png, line-mid1..3.png, line-right.png
Pieces are found automatically (gaps of white between them). Everything is scaled by ONE factor so that a frame is
`unit` pixels high; the ornaments keep their size relative to the frames.   Requires: pip install pillow
"""
import sys, os
from collections import deque
from PIL import Image, ImageFilter

def arg(n, d=None): return sys.argv[sys.argv.index(n) + 1] if n in sys.argv else d
if len(sys.argv) < 2 or sys.argv[1].startswith('--'): sys.exit(__doc__)
unit = int(arg('--unit', '256'))
src = Image.open(sys.argv[1]); W, H = src.size
has_alpha = src.mode in ('RGBA', 'LA', 'PA') and src.convert('RGBA').split()[3].getextrema()[0] < 16   # already transparent: use it as is
im = src.convert('RGBA' if has_alpha else 'RGB'); px = im.load()
bg = bytearray(W * H)
if has_alpha:
    ap0 = im.split()[3].load()
    for y in range(H):
        for x in range(W):
            if ap0[x, y] < 20: bg[y*W+x] = 1
else:                                                                  # white background: remove what is connected to the border
    bgc = lambda p: min(p) >= 232 and max(p) - min(p) <= 22            # near-white, almost no colour
    q = deque()
    def seed(x, y):
        if bgc(px[x, y]) and not bg[y*W+x]: bg[y*W+x] = 1; q.append((x, y))
    for x in range(W): seed(x, 0); seed(x, H - 1)
    for y in range(H): seed(0, y); seed(W - 1, y)
    while q:
        x, y = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < W and 0 <= ny < H and not bg[ny*W+nx] and bgc(px[nx, ny]): bg[ny*W+nx] = 1; q.append((nx, ny))

def bands(has, gap):
    """has[i] -> bool; returns [(start,end)] runs of True separated by at least `gap` False"""
    out, start, last = [], None, None
    for i, v in enumerate(has):
        if v:
            if start is None: start = i
            elif i - last > gap: out.append((start, last + 1)); start = i
            last = i
    if start is not None: out.append((start, last + 1))
    return out

rows = [any(not bg[y*W+x] for x in range(W)) for y in range(H)]
rbands = bands(rows, 14)
if len(rbands) != 2: sys.exit(f'expected 2 rows (frames + ornaments), found {len(rbands)} - check the sheet')
pieces = []
for (y0, y1), want in zip(rbands, (6, 5)):
    cols = [any(not bg[y*W+x] for y in range(y0, y1)) for x in range(W)]
    cb = bands(cols, 22)
    if len(cb) != want: sys.exit(f'expected {want} pieces in the row at y={y0}, found {len(cb)}: {cb}')
    for (x0, x1) in cb:
        ys = [y for y in range(y0, y1) if any(not bg[y*W+x] for x in range(x0, x1))]
        pieces.append((x0, ys[0], x1, ys[-1] + 1))

def cut(box):
    x0, y0, x1, y1 = box; c = im.crop(box)
    if has_alpha:                                                       # keep the art's own transparency untouched
        return c.crop(c.split()[3].point(lambda v: 255 if v > 20 else 0).getbbox())
    a = Image.new('L', c.size, 255); ap = a.load()
    for y in range(y1 - y0):
        for x in range(x1 - x0):
            if bg[(y0+y)*W + x0 + x]: ap[x, y] = 0
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))   # shave the light halo, soften the edge
    o = c.convert('RGBA'); o.putalpha(a); return o.crop(o.getbbox())

cuts = [cut(b) for b in pieces]
heights = sorted(c.height for c in cuts[:6]); f = unit / heights[len(heights) // 2]          # one scale for everything
names = ['step1', 'step2', 'step3', 'step4', 'step5', 'locked', 'line-left', 'line-mid1', 'line-mid2', 'line-mid3', 'line-right']
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img', 'ui'); os.makedirs(out, exist_ok=True)
for name, c in zip(names, cuts):
    c = c.resize((max(1, round(c.width * f)), max(1, round(c.height * f))), Image.LANCZOS)
    dst = os.path.join(out, name + '.png'); c.save(dst, optimize=True)
    print(f'{name:11s} {c.size[0]:4d}x{c.size[1]:<4d} {os.path.getsize(dst)//1024:3d} KB')
print('scale', round(f, 4), '-> img/ui/')
