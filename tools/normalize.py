#!/usr/bin/env python3
"""Fit stage images into the common 1536x1024 frame (scaled to width, padded with black at the bottom)
and save them as img/stageN.webp.

Usage:  python3 tools/normalize.py path/to/1.webp path/to/2.webp ...
        (files are numbered in the order given: 1st -> stage1, 2nd -> stage2, ...)
        python3 tools/normalize.py --start 4 path/to/new4.webp path/to/new5.webp   # continue numbering from 4
Requires: pip install pillow
"""
import sys, os
from PIL import Image
LW, LH = 1536, 1024
args = sys.argv[1:]
start = 1
if args and args[0] == '--start':
    start = int(args[1]); args = args[2:]
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img')
os.makedirs(out, exist_ok=True)
for i, p in enumerate(args):
    im = Image.open(p).convert('RGB')
    s = LW / im.width
    im = im.resize((LW, round(im.height * s)), Image.LANCZOS)
    canvas = Image.new('RGB', (LW, LH), (0, 0, 0))
    canvas.paste(im.crop((0, 0, LW, min(im.height, LH))), (0, 0))
    dst = os.path.join(out, f'stage{start + i}.webp')
    canvas.save(dst, quality=88, method=6)
    print(p, '->', dst, os.path.getsize(dst) // 1024, 'KB')
