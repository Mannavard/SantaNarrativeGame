# SantaNarrativeGame

A narrative mini-game for a Secret Santa gift: a window, falling snow, a lamp, a clock and five "stops" that open
over five weeks. English / Русский / Română. No backend; progress lives in the visitor's browser. Optional background music.

**Phase 1 (now):** an Angular shell around the finished game.
The game itself is one self-contained script, `public/game/game.js`; its markup is `src/app/app.html`, its styles are
`src/styles.css`, and `src/app/app.ts` starts the script once the view is on the page.
**Phase 2 (when you want it):** split the script into Angular services/components (i18n, clock, scene, stepper, dialogue).

## Run
```bash
npm install
npm start            # http://localhost:4200
```
Debug panel (jump to any stop, switch language, auto-play the whole story): a **`DEBUG` button is on every screen** while `allowDebug` is true: bottom-left on a computer, under the progress bar on the left on a phone (the key `D` works too). `http://localhost:4200/debug.html` (or `?debug`) also skips the start screen.

## Edit
Everything you are likely to change is in the `CONFIG` block at the top of `public/game/game.js`:
dates of the stops and of the Secret Santa (`stops`, `santaAt`), the quiet-moment length, stage pictures, the gift position.
All the text the player reads is in the `TX` dictionary (`en`, `ru`, `ro`) in the same file.

## Pictures (`public/img/`)
All stage pictures are one 1536x1024 frame. Helper scripts (Python 3 + `pip install pillow`):
- Stage picture:  `python3 tools/normalize.py --start 4 path/to/picture.webp`  → `public/img/stage4.webp`, then add its line to `CONFIG.stages`.
- Phone (portrait) pictures: `python3 tools/normalize_portrait.py 1:art/portrait-1-start.png:731.5:1405.5:181 …`  (stage : file : clock-digits centre x : y : width) → `public/img/stageN-portrait.webp`; their lamp / mug / glass / masks are the `p:` block of each stage in `CONFIG.stages`.
- Progress-bar sheet (6 frames + 5 ornaments):  `python3 tools/slice_sheet.py path/to/sheet.webp`  → `public/img/ui/*.png`.
- Gift from one transparent sheet (box left, lid right):  `python3 tools/split_gift_sheet.py art/gift-sheet-berries.png`  → `public/img/gift-body.png`, `gift-lid.png`.
  Or from two white-background pictures:  `python3 tools/prep_gift.py --body box.webp --lid lid.webp`.
  Until these two files exist the gift is simply not shown. Then tune `CONFIG.gift` (`lidFit`, `rim`) by eye. The reveal that rises from the box is `public/img/heart.png` (placeholder, `tools/make_heart.py`).
Keep the same camera in every picture, keep the clock screen dark (the page draws live digits there) and the bottom ~15% dark (the dialogue sits there).

## Findings (secrets in the room)
Small things that answer a click while the player waits between stops (on a computer; not on phones yet): the star on the
little tree, the snow globe, snow on the big tree's branches (one more branch each day from stop II), and a fast swipe of the
cursor through the snow. Each one is a finding: its card flies in, turns over and flies into the cards button (top right),
which opens the collection of six. The lamp just blinks when clicked.
- Art: `public/img/findings/` — `back.png` (shared card back) and one picture per finding (`wind.png`, `branch.png`, `globe.png`,
  `star.png`, `f5.png`, `f6.png`), 2:3, e.g. 400x600. A missing file is drawn as a placeholder.
- Order and file names: `CONFIG.findings`; names on the cards: `TX.<lang>.findings`.
- A new secret: add its entry to `CONFIG.findings.list` and its name to `TX`, then a prop to `PROPS` in `game.js`
  (`click(x,y)` returns true when the click is its and calls `unlockSecret('<key>')`; optional `draw(c,k)`). Slots 5 and 6 are free.
- Testing: the debug panel has a FINDINGS row (unlock any one, open the collection, reset).

## Music
Put the track at `public/audio/music.mp3` (settings in `CONFIG.music`). It starts on the first tap of the start screen and fades in; a button top-right switches it off. No file = no music, no button. Restart `npm start` after adding a new file to `public/`.

## Test without waiting for the dates
`/debug.html` (or `/?debug`): JUMP TO any stop, NEXT DATE, SKIP QUIET MOMENT, FAST, AUTO-PLAY.
URL options: `?now=2026-12-03T12:00`, `?reset`, `?fast`, `?auto`, `?lang=ru|ro|en`.

## Before publishing
Set `allowDebug:false` in `CONFIG` (switches all of the above off) and delete `public/debug.html`.
```bash
npx ng build --base-href /SantaNarrativeGame/      # use your repository name
# publish dist/SantaNarrativeGame/browser, e.g.:  npx angular-cli-ghpages --dir=dist/SantaNarrativeGame/browser
```
The page asks search engines to stay away (`noindex`).
