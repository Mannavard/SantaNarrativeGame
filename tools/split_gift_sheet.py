#!/usr/bin/env python3
"""Cut ONE transparent sheet (open box on the left, lid with the bow on the right) into
   public/img/gift-body.png and public/img/gift-lid.png.

Usage:  python3 tools/split_gift_sheet.py art/gift-sheet-berries.png [--width 420]
   --width  width of the saved box in px (default 420; the game shows it ~150 px wide in a 1536 px frame, so this is retina-sharp).
            The lid is scaled by the same factor, so the two keep their relative size.
For sheets drawn on a white background use tools/prep_gift.py instead.   Requires: pip install pillow
"""
import sys, os
from PIL import Image

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

if len(sys.argv) < 2 or sys.argv[1].startswith('--'): sys.exit(__doc__)
src, width = sys.argv[1], int(arg('--width', 420))
im = Image.open(src).convert('RGBA'); W, H = im.size
a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)       # ignore the faint glow when looking for the two pieces
cols = [a.crop((x, 0, x + 1, H)).getbbox() is not None for x in range(W)]
# the widest empty run of columns between the two pieces is the cut
runs, start = [], None
for x, filled in enumerate(cols + [True]):
    if not filled and start is None: start = x
    if filled and start is not None: runs.append((x - start, start, x)); start = None
inner = [r for r in runs if r[1] > 0 and r[2] < W]
if not inner: sys.exit('could not find the gap between the box and the lid')
_, g0, g1 = max(inner); cut = (g0 + g1) // 2

def piece(box):
    p = im.crop(box); return p.crop(p.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())
body, lid = piece((0, 0, cut, H)), piece((cut, 0, W, H))
k = width / body.width
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img'); os.makedirs(out, exist_ok=True)
for name, sp in (('body', body), ('lid', lid)):
    r = sp.resize((round(sp.width * k), round(sp.height * k)), Image.LANCZOS)
    dst = os.path.join(out, f'gift-{name}.png'); r.save(dst, optimize=True)
    print('saved', os.path.normpath(dst), r.size, os.path.getsize(dst) // 1024, 'KB')
bw, bh, lw, lh = body.width, body.height, lid.width, lid.height
print(f'\nlid/box width {lw / bw:.2f}, lid/box height {lh / bh:.2f}  (check CONFIG.gift lidFit / rim by eye: ?debug, JUMP TO V)')
