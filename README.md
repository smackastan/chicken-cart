# Chicken Cart 🐔🏎️

A pixel-art kart racing game that runs entirely in the browser — pure HTML5 canvas and vanilla JavaScript, no build step or dependencies.

## ▶️ Play

**[Play it here](https://smackastan.github.io/chicken-cart/)**

Or run it locally by opening `index.html` in any modern browser (it works straight from `file://`).

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` | Drive (accelerate / steer / brake) |
| `Space` | Jump |
| `E` | Drop egg |
| `Enter` | Restart (after finishing) |
| `Tab` | Toggle controls overlay |

## 🛠️ How it works

The game is split into small, plain `<script>` files loaded in order from `index.html` (no ES modules, so it runs from the local filesystem):

- `globals.js` — shared state and constants
- `util.js`, `colors.js` — helpers
- `sprites.js` — pixel-art sprite data
- `track.js` — track layout and geometry
- `player.js`, `ai.js` — player and computer-controlled racers
- `items.js` — eggs and pickups
- `render.js`, `hud.js` — drawing and on-screen UI
- `input.js` — keyboard handling
- `game.js` — main loop and state machine

## License

Personal project — free to play and tinker with.
