#!/usr/bin/env python3
"""Draw the placeholder heart (img/heart.png) in the red/gold palette of the gift.
Replace img/heart.png with anything you like (transparent PNG, roughly square) - the page just shows it."""
import os
from PIL import Image
M = ["..###...###..",
     ".#####.#####.",
     "#############",
     "#############",
     "#############",
     "#############",
     ".###########.",
     "..#########..",
     "...#######...",
     "....#####....",
     ".....###.....",
     "......#......"]
OUT, BASE, SHADE, HI, GOLD = (92, 12, 18), (216, 38, 42), (166, 22, 34), (255, 112, 86), (255, 214, 130)
H, W = len(M), len(M[0])
fill = lambda x, y: 0 <= x < W and 0 <= y < H and M[y][x] == '#'
im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for y in range(H):
    for x in range(W):
        if not fill(x, y): continue
        edge = not (fill(x-1, y) and fill(x+1, y) and fill(x, y-1) and fill(x, y+1))
        if edge: c = OUT
        elif (x, y) in ((2, 2), (3, 2), (2, 3), (8, 2)): c = GOLD
        elif x + y < 7: c = HI
        elif x + y > 13: c = SHADE
        else: c = BASE
        im.putpixel((x, y), c + (255,))
im = im.resize((W * 20, H * 20), Image.NEAREST)
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'img', 'heart.png')
os.makedirs(os.path.dirname(dst), exist_ok=True); im.save(dst, optimize=True)
print('saved', dst, im.size)
