// ===========================================================================
// Programmatic pixel-art sprites (no external images).
// Each grid is an array of equal-length strings; one char per pixel.
// ===========================================================================

// Rear view: a white chicken (red comb) sitting in a colored cart with wheels.
var KART_GRID = [
  "........RRR........",
  ".......RRRRR.......",
  "......WWWWWWW......",
  ".....WWWWWWWWW.....",
  ".....WWWWWWWWW.....",
  "....WWWWWWWWWWW....",
  "...WWWWWWWWWWWWW...",
  "...WwWWWWWWWWWwW...",
  "..BBBBBBBBBBBBBBB..",
  ".BBBBBBBBBBBBBBBBB.",
  ".BBBBBBBBBBBBBBBBB.",
  ".BbBBBBBBBBBBBBBbB.",
  ".BbBBBBBBBBBBBBBbB.",
  "KKKKbBBBBBBBBBbKKKK",
  "KKKKKbBBBBBBBbKKKKK",
  ".KKKK.BBBBBBB.KKKK.",
  "..KK...BBBBB...KK.."
];

// Bigger egg with a dark outline + highlight so it pops against the gray road.
// The player's chicken: detailed with a multi-point comb, layered feather shading,
// and little wing tips poking out the sides.
var PLAYER_GRID = [
  "......R.R.R........",
  ".....RRRRRRR.......",
  "......WWWWWWW......",
  ".....WWwWWWwWW.....",
  ".....WWWWWWWWW.....",
  "....WWwWWWWWwWW....",
  "...WWWWWWWWWWWWW...",
  "...WwWWWWWWWWWwW...",
  "..WWBBBBBBBBBBBWW..",
  ".WWBBBBBBBBBBBBBWW.",
  ".BBBBBBBBBBBBBBBBB.",
  ".BbBBBBBBBBBBBBBbB.",
  ".BbBBBBBBBBBBBBBbB.",
  "KKKKbBBBBBBBBBbKKKK",
  "KKKKKbBBBBBBBbKKKKK",
  ".KKKK.BBBBBBB.KKKK.",
  "..KK...BBBBB...KK.."
];

var EGG_GRID = [
  "...OOOO...",
  "..OWWWWO..",
  ".OWWWWWWO.",
  ".OWWWWWWO.",
  "OWWWWWWWWO",
  "OWWWhWWWWO",
  "OWWhhWWWWO",
  "OWWWWWWWWO",
  ".OWWWWWWO.",
  ".OWWWWWWO.",
  "..OWWWWO..",
  "...OOOO..."
];

// Powerup boxes marked with what they do. 'B' = box body color, 'i' = white icon.
// FASTER: up arrow.
var BOX_FASTER_GRID = [
  ".OOOOOOOOOO.",
  "OBBBBBBBBBBO",
  "OBBBBiiBBBBO",
  "OBBBiiiiBBBO",
  "OBBiiiiiiBBO",
  "OBiiiiiiiiBO",
  "OBBBiiiiBBBO",
  "OBBBiiiiBBBO",
  "OBBBiiiiBBBO",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  ".OOOOOOOOOO."
];

// INVINCIBLE: star.
var BOX_INV_GRID = [
  ".OOOOOOOOOO.",
  "OBBBBBBBBBBO",
  "OBBBBiiBBBBO",
  "OBBBBiiBBBBO",
  "OBiiiiiiiiBO",
  "OBBiiiiiiBBO",
  "OBBBiiiiBBBO",
  "OBBiiiiiiBBO",
  "OBiiBBBBiiBO",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  ".OOOOOOOOOO."
];

// EGG BOX: a carton holding two eggs (grants +2 eggs).
var BOX_EGG_GRID = [
  ".OOOOOOOOOO.",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  "OBiiBBBBiiBO",
  "OiiiiBBiiiiO",
  "OiiiiBBiiiiO",
  "OBiiBBBBiiBO",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  "OBBBBBBBBBBO",
  ".OOOOOOOOOO."
];

// Mud / oil splat.
var MUD_GRID = [
  "...MMMMMMMM...",
  ".MMMMMMMMMMMM.",
  "MMMMmmMMMMmMMM",
  "MMmMMMMMmMMMMM",
  ".MMMMMMMMMMMM.",
  "...MMMMMMMM..."
];

var TREE_GRID = [
  ".....GGGGGG.....",
  "....GGGGGGGG....",
  "...GGGGGGGGGG...",
  "..GGGGGGGGGGGG..",
  "..GGGGGGGGGGGG..",
  ".GGGGGGGGGGGGGG.",
  ".GGGGGGGGGGGGGG.",
  "GGGGGGGGGGGGGGGG",
  "GGGGGGGGGGGGGGGG",
  ".GGGGGGGGGGGGGG.",
  "..GGGGGGGGGGGG..",
  "...GGGGGGGGGG...",
  ".....GGGGGG.....",
  ".......TT.......",
  ".......TT.......",
  ".......TT.......",
  ".......TT.......",
  ".......TT.......",
  "......TTTT......",
  "......TTTT......"
];

// Rooster trophy (side profile, facing right) on a pedestal. 'M' metal, 'd' shade, 'B' base.
var ROOSTER_GRID = [
  "...............M.M......",
  "..............MMMMM.....",
  "...M...........MMMM.....",
  "..MMM.........MMMMMM....",
  ".MMMMM.......MMMMdMM....",
  "MMMMMMM.....MMMMMMMMM...",
  ".MMMMMMM...MMMMMMMMMMMM.",
  "..MMMMMM..MMMMMMMMMMMMMM",
  "...MMMMMMMMMMMMMMMMMMMd.",
  "...MMMMMMMMMMMMMMMMMM...",
  "....MMMMMMMMMMMMMMMM....",
  "....MMMMMMMMMMMMMMMM....",
  ".....MMMMMMMMMMMMMM.....",
  "......MMMMMMMMMMMM......",
  ".......MMMMMMMMMM.......",
  "........MMMMMMMM........",
  "........M.....M........",
  "........M.....M........",
  ".......WW.....WW.......",
  "......BBBBBBBBBBBB......",
  ".....BBBBBBBBBBBBBB.....",
  "......BBBBBBBBBBBB......",
  "........................",
  "........................"
];

// Checkered start/finish sign on a post.
var BANNER_GRID = [
  "AAHHAAHHAAHHAA",
  "AAHHAAHHAAHHAA",
  "HHAAHHAAHHAAHH",
  "HHAAHHAAHHAAHH",
  "AAHHAAHHAAHHAA",
  "AAHHAAHHAAHHAA",
  "HHAAHHAAHHAAHH",
  "HHAAHHAAHHAAHH",
  "......PP......",
  "......PP......",
  "......PP......",
  "......PP......"
];

function makeSprite(grid, palette) {
  var h = grid.length, w = grid[0].length;
  var cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  var c = cv.getContext('2d');
  for (var y = 0; y < h; y++) {
    var row = grid[y];
    for (var x = 0; x < w; x++) {
      var col = palette[row[x]];
      if (col) {
        c.fillStyle = col;
        c.fillRect(x, y, 1, 1);
      }
    }
  }
  return { img: cv, w: w, h: h };
}

function kartPalette(color) {
  return {
    '.': null,
    'R': '#E23B3B',
    'W': '#FFFFFF',
    'w': '#DDDDDD',
    'B': color,
    'b': shade(color, 0.6),
    'K': '#222222',
    'E': '#000000'
  };
}

function makeKart(color) {
  return makeSprite(KART_GRID, kartPalette(color));
}

// Turn the head toward `dir` (-1 left, +1 right): shift the head rows and add an eye
// on that side, so the chicken appears to look at a neighbor (or lean when steering).
function turnGrid(grid, dir) {
  var g = grid.map(function (row, idx) {
    if (idx >= 2 && idx <= 7) {
      return dir < 0 ? (row.slice(1) + '.') : ('.' + row.slice(0, row.length - 1));
    }
    return row;
  });
  var w = grid[0].length;
  var c = dir < 0 ? 6 : (w - 1 - 6);
  g[4] = g[4].substring(0, c) + 'E' + g[4].substring(c + 1);
  return g;
}

function makeKartTurn(color, dir) {
  return makeSprite(turnGrid(KART_GRID, dir), kartPalette(color));
}

function makePlayerTurn(color, dir) {
  return makeSprite(turnGrid(PLAYER_GRID, dir), kartPalette(color));
}

CK.buildSprites = function () {
  var aiColors = ['#E8413A', '#2ECC71', '#3498DB', '#F4C20D', '#9B59B6', '#FF8C42'];
  // each AI kart has straight + look-left/right (head turned, eye on that side)
  var karts = aiColors.map(function (c) {
    return { straight: makeKart(c), left: makeKartTurn(c, -1), right: makeKartTurn(c, 1) };
  });

  var playerColor = '#19D3DA'; // distinct cyan cart for the player
  CK.sprites = {
    karts: karts,
    player: {
      straight: makeSprite(PLAYER_GRID, kartPalette(playerColor)),
      left: makePlayerTurn(playerColor, -1),
      right: makePlayerTurn(playerColor, 1)
    },
    egg: makeSprite(EGG_GRID, { '.': null, 'O': '#1a1a1a', 'W': '#FFFFFF', 'h': '#CFEFFF' }),
    boxes: {
      faster: makeSprite(BOX_FASTER_GRID, { '.': null, 'O': '#16461f', 'B': '#2ECC71', 'i': '#FFFFFF' }),
      invincible: makeSprite(BOX_INV_GRID, { '.': null, 'O': '#7a5c00', 'B': '#FFD23F', 'i': '#FFFFFF' }),
      egg: makeSprite(BOX_EGG_GRID, { '.': null, 'O': '#3a2a12', 'B': '#C8A26A', 'i': '#FFFFFF' })
    },
    mud: makeSprite(MUD_GRID, { '.': null, 'M': '#5a3a1a', 'm': '#3a2410' }),
    tree: makeSprite(TREE_GRID, { '.': null, 'G': '#1f8b1f', 'g': '#166b16', 'T': '#6b3f1f' }),
    banner: makeSprite(BANNER_GRID, { '.': null, 'A': '#222222', 'H': '#eeeeee', 'P': '#888888' }),
    roosters: {
      bronze: makeSprite(ROOSTER_GRID, { '.': null, 'M': '#CD7F32', 'd': '#6e3f12', 'W': '#9c5e22', 'B': '#8a5a2a' }),
      silver: makeSprite(ROOSTER_GRID, { '.': null, 'M': '#D8D8D8', 'd': '#7a7a7a', 'W': '#a8a8a8', 'B': '#9a9a9a' }),
      gold:   makeSprite(ROOSTER_GRID, { '.': null, 'M': '#FFD23F', 'd': '#a8780a', 'W': '#d9a800', 'B': '#caa200' }),
      locked: makeSprite(ROOSTER_GRID, { '.': null, 'M': '#555555', 'd': '#333333', 'W': '#444444', 'B': '#444444' })
    }
  };
};
