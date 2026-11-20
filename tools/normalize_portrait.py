#!/usr/bin/env python3
"""Fit portrait (phone) stage pictures into ONE common 941x1672 frame and save them as public/img/stageN-portrait.webp.

The pictures are AI-generated, so every one has a slightly different "camera". To keep the clock (which the page draws live on
the picture) and the sill in the same place from stage to stage, each picture is scaled and shifted so that the CENTRE and WIDTH
of the painted clock digits ("00:27:46") match a reference. Whatever the picture does not cover is filled by repeating its edge.

Usage:   python3 tools/normalize_portrait.py N:path:cx:cy:w [N:path:cx:cy:w ...]
         N = stage number (1..5), cx,cy = centre of the clock digits in the source picture (px), w = their width (px)
Example: python3 tools/normalize_portrait.py 1:art/portrait-1-start.png:731.5:1405.5:181 2:art/portrait-2-now.png:732:1404:182
Reference: digits centre (732,1404), width 182 (that is what picture 2 already has). Requires: pip install pillow numpy
"""
import sys, os
import numpy as np
from PIL import Image

FW, FH = 941, 1672
REF_CX, REF_CY, REF_W = 732.0, 1404.0, 182.0
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img')

if len(sys.argv) < 2 or sys.argv[1] in ('-h', '--help'):
    sys.exit(__doc__)
os.makedirs(out_dir, exist_ok=True)
for spec in sys.argv[1:]:
    n, path, cx, cy, w = spec.split(':') if spec.count(':') == 4 else (lambda p: (p[0], ':'.join(p[1:-3]), *p[-3:]))(spec.split(':'))
    cx, cy, w = float(cx), float(cy), float(w)
    im = Image.open(path).convert('RGB')
    s = REF_W / w
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    ox, oy = round(REF_CX - cx * s), round(REF_CY - cy * s)             # where the resized picture's top-left lands in the frame
    x0, y0, x1, y1 = max(0, ox), max(0, oy), min(FW, ox + im.width), min(FH, oy + im.height)
    part = np.array(im.crop((x0 - ox, y0 - oy, x1 - ox, y1 - oy)))
    full = np.pad(part, ((y0, FH - y1), (x0, FW - x1), (0, 0)), mode='edge')   # repeat the edge where the picture does not reach
    dst = os.path.join(out_dir, f'stage{n}-portrait.webp')
    Image.fromarray(full).save(dst, quality=88, method=6)
    gaps = f'top {y0} bottom {FH - y1} left {x0} right {FW - x1}'
    print(f'stage{n}: scale {s:.3f}  offset ({ox},{oy})  filled px: {gaps}  -> {os.path.normpath(dst)} {os.path.getsize(dst) // 1024} KB')
