# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Chicken Cart — a pseudo-3D ("Mode 7"-style) kart racer running entirely in the browser on an HTML5 canvas. **Pure vanilla JS, no build step, no dependencies, no package.json.** The pseudo-3D road projection is based on the classic Jake Gordon "OutRun-style" technique.

## Running & testing

- **Run:** open `index.html` in a browser. It is written to work from `file://` (that is the reason for the no-modules constraint below), so double-clicking the file works.
- **No build, lint, or test tooling exists.** There is nothing to compile and no test suite. "Testing" means loading the page and watching the JS console for errors.

## Critical constraint: plain scripts, load order matters

There are **no ES modules**. Every file in `js/` is a plain `<script>` loaded in sequence from `index.html`, sharing one global scope. This is deliberate so the game runs from `file://` (ES modules are blocked by CORS on `file://`).

Consequences when editing:
- **State lives on the single global `CK` object** (defined in `globals.js`). Helper functions (`clamp`, `project`, `findSegment`, `forwardGap`, …) are declared as bare globals.
- **Adding a new `js/*.js` file requires adding a `<script>` tag to `index.html` in the correct order** — a file may only reference globals defined by scripts loaded before it. Current order: `globals → util → colors → sprites → track → player → ai → items → render → hud → input → touch → game`.
- `CK.C` holds tunable constants; the ones initialized to `null` are **derived in `CK.init()`** (e.g. `maxSpeed`, `cameraDepth`, `playerZ`). Change the formula there, not the literal.

## Architecture (the parts that span files)

**Game loop & state machine** (`game.js`): `CK.init` runs on window load → builds sprites, calls `CK.restart`, starts `requestAnimationFrame`. The loop is a **fixed timestep of 1/60s** (`STEP`): real frame delta is accumulated and `CK.update(STEP)` is called in a catch-up `while`, then `CK.render()` once. State is `CK.state ∈ {INTRO, COUNTDOWN, RACING, FINISHED}` (`STATE` enum). `update` only advances physics during `RACING`; `INTRO` (flaming title, `introTimer`) and `COUNTDOWN` (`countdown` → "GO!") just tick their timers. Each state has a matching `render*` method in `hud.js`.

**Coordinate model** (shared by everything): the track is a loop of fixed-length **segments** (`CK.C.segmentLength` z-units each). A racer's position is `z` = distance along the track (wraps at `CK.trackLength`) plus `x`/`offset` = lateral position where `-1..1` is on the road and `±2` is the edge. `player.z` is the **car's** position; the **camera sits `playerZ` behind it** — important when reasoning about render.js.

**Track model** (`track.js`): tracks are built procedurally by appending segments via `addRoad`/`addStraight`/`addCurve`/`addHill`. The three courses are `buildTrack0/1/2`, registered in the `CK.tracks` array with per-track tuning (`aiMul` AI speed multiplier, `trophy`, optional `forwardEggs`). `CK.trackIndex` selects the current one; `nextRace` advances it. **To add a track: write a `buildTrackN` and push an entry to `CK.tracks`.** `ROAD`/`COLORS` constants live in `colors.js`.

**Racers & race logic** (`ai.js`): `CK.racers = [player, ...CK.cars]`. Lap-aware distance helpers — `trackProgress(r)` (monotonic, accounts for laps), `forwardGap(a,b)` (signed shortest gap around the loop), `checkLapCrossing` (detects the z-wrap) — are defined here and used by player, items, and standings. AI behavior: racing-line steering toward upcoming curve, player-dodging, head-turn animation, and **graduated rubber-banding** (speed multiplied based on distance behind/ahead of the player).

**Segment occupancy is a manual data structure.** Each segment has a `.cars` array; racers and in-flight eggs are registered into the segment they occupy, and **when something moves between segments you must `splice` it out of the old segment's `.cars` and `push` into the new one.** This pattern recurs in `ai.js` (AI movement), `items.js` (forward eggs), and is what `render.js` iterates to draw and depth-sort moving objects. Forget the splice/push and sprites render in the wrong segment or duplicate.

**Items** (`items.js`): powerup boxes (`faster`/`invincible`/`egg`-ammo, cycled via `BOX_TYPES`), mud hazards (the environmental "slower" effect), and the egg weapon. Two egg behaviors: `spawnEgg` drops behind the owner and only hits racers **behind** the drop point (`dropperProgress`); `shootEgg` (Track-3 `forwardEggs` AI) launches forward with velocity `vz`. Player score lives on `player.score` and is adjusted here.

**Rendering** (`render.js`): pseudo-3D. `project()` (in `util.js`) maps world points to screen. The road is filled **near→far**, tracking `maxy` so hills correctly clip (occlude) road behind them. Sprites/cars are then drawn **far→near** (painter's algorithm) so nearer objects overdraw. The player kart is drawn last, fixed at bottom-center, with jump arc, shadow, and lean/look animation. HUD overlays are drawn by `hud.js` at the end.

**Sprites** (`sprites.js`): no image files. Sprites are **ASCII-art grids** (arrays of equal-length strings, one char per pixel) rasterized to off-screen canvases by `makeSprite(grid, palette)` during `CK.buildSprites()` (called once in init). A palette maps each character to a color (`null` = transparent). `kartPalette(color)` recolors the shared kart/player grids per racer; `turnGrid` shifts head rows to make the chicken "look" left/right. **To add art: define a grid + palette and register the result under `CK.sprites` in `buildSprites`.**

**Input** (`input.js`, `touch.js`): WASD drive, Space jump, E drop egg, Enter restart (when `FINISHED`), Tab toggles the controls overlay. Held movement keys set booleans on `CK.keys`; one-shot actions call into `CK`/state directly. `touch.js` mirrors all of this for touch devices: it sets `CK.isTouch`, adds a `touch` class to `<body>` (revealing the `#touch-controls` buttons defined in `index.html`), and wires those buttons to the same `CK.keys`/actions — held buttons via touchstart/touchend, taps for jump/egg, and a canvas tap to advance on the results screen. HUD text branches on `CK.isTouch` to show touch- vs keyboard-appropriate hints.
