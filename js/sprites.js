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

// A small flying top hat — Cornelius's projectile. ~10px tall, egg-sized.
// 'H' = hat black crown/brim, 'h' = hat band accent, 'O' = dark outline.
var HAT_PROJECTILE_GRID = [
  "...HHHH...",
  "...HHHH...",
  "...HHHH...",
  "...HHHH...",
  "...hhhh...",
  "OHHHHHHHHO",
  "OHHHHHHHHO",
  "..OOOOOO.."
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

// The chicken girlfriend: a standing sweetheart hen, clearly distinct from the
// racers. Soft lavender/pink feathers, white belly, long eyelashes, rosy cheeks,
// red lipstick, and a flower on her head. No cart — she stands on little feet.
// Palette: F=flower petals, f=flower center, V=lavender feathers, v=lavender shade,
// W=white feathers, R=red comb, L=eyelash/lipstick dark, C=rosy cheek, B=beak,
// E=eye, K=feet/legs.
var GIRLFRIEND_GRID = [
  ".......F.F.F.......",
  "......FFFFFFF......",
  ".......FfFfF.......",
  "........RRR........",
  ".......RRRRR.......",
  "......VVVVVVV......",
  ".....LVVVVVVVL.....",
  ".....VVVVVVVVV.....",
  "....VVEVVVVVEVV....",
  "....VVVVBBVVVVV....",
  "...VVCVVBBVVCVVV...",
  "...VVVVVLLVVVVVV...",
  "..VVVVVVVVVVVVVVV..",
  "..VvVWWWWWWWWWvVV..",
  ".VVvWWWWWWWWWWWvVV.",
  ".VVWWWWWWWWWWWWWVV.",
  ".VVWWWWWWWWWWWWWVV.",
  "..VWWWWWWWWWWWWWV..",
  "..vWWWWWWWWWWWWWv..",
  "...WWWWWWWWWWWWW...",
  "....KK.......KK....",
  "...KKKK.....KKKK..."
];

// A simple plump heart for the cutscenes.
var HEART_GRID = [
  ".HH...HH.",
  "HHHHHHHHH",
  "HHHHHHHHH",
  "HHHHHHHHH",
  ".HHHHHHH.",
  "..HHHHH..",
  "...HHH...",
  "....H...."
];

// A little high-heeled shoe (side profile, toe to the right) for Chicky's
// shoe-shopping scene. 'S' = shoe body, 's' = shoe shade, 'O' = dark outline.
var SHOE_GRID = [
  "..........OO..",
  ".........OSSO.",
  ".OOOO...OSSSO.",
  "OSSSSO.OSSSSO.",
  "OSSSSSSSSSSSO.",
  "OSsssssssssSO.",
  ".OOOOOOOOOOO..",
  ".......O......",
  "......OsO.....",
  "......OsO.....",
  ".....OsO......",
  "...OOOO......."
];

// A shopping bag with handles for Chicky's shoe-shopping scene.
// 'G' = bag body, 'g' = bag shade, 'O' = handle/outline, 'i' = label dot.
var BAG_GRID = [
  "..O.....O..",
  ".O.O...O.O.",
  ".O..O.O..O.",
  "OOOOOOOOOOO",
  "OGGGGGGGGGO",
  "OGGGiGiGGGO",
  "OGGGGGGGGGO",
  "OGgGGGGGgGO",
  "OGgGGGGGgGO",
  "OGgGGGGGgGO",
  "OOOOOOOOOOO"
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

// ---- named racers: per-chicken accessories baked onto the base chicken grid ----
// Accessory chars (added to kartPalette): P=bow pink, H=hat black, h=hat band,
// M=mustache dark, e=angry red eye. All confined to the head rows (top of grid)
// so they ride along when turnGrid shifts the head, and stay clear of the cart.
function racerPalette(color, evil) {
  var pal = kartPalette(color);
  pal['P'] = '#FF6FB5';        // bow pink
  pal['p'] = '#D14E8E';        // bow pink shade
  pal['H'] = '#101014';        // hat black
  pal['h'] = '#8a1212';        // hat band / dark crimson accent
  pal['M'] = '#1a1208';        // mustache dark
  pal['e'] = '#E23B3B';        // angry red eye
  if (evil) {
    // sinister palette: dark, bloodshot feathers + crimson comb
    pal['W'] = '#cfc7c7';
    pal['w'] = '#9a8f8f';
    pal['R'] = '#8a1212';
  }
  return pal;
}

// Overlay accessory pixels onto a row: paint the accessory char wherever it is
// non-'.', otherwise keep the base pixel. (over and base must be equal length.)
function overlayRow(base, over) {
  var out = '';
  for (var x = 0; x < base.length; x++) {
    out += over[x] !== '.' ? over[x] : base[x];
  }
  return out;
}

// Build a racer's grid. We bake face accessories (bow / mustache) onto the base
// chicken FIRST so the head turn carries them along (they sit in the head rows
// 2-7 that turnGrid shifts), then apply the turn, then prepend a top hat (which
// lives above the comb and grows the grid upward; sprites are bottom-anchored so
// ground alignment is preserved). All rows stay 19 wide.
function racerGrid(spec, dir) {
  var g = KART_GRID.slice();

  if (spec.accessory === 'bow') {
    // a hair bow on the forehead: two loops + a center knot, in contrasting pink
    g[2] = overlayRow(g[2], ".......PP.PP.......");
    g[3] = overlayRow(g[3], ".......PPpPP.......");
    g[4] = overlayRow(g[4], ".......PP.PP.......");
  } else if (spec.accessory === 'mustache') {
    // handlebar mustache across the lower face, with angry eyes either side
    g[5] = overlayRow(g[5], ".....e.....e.......");
    g[6] = overlayRow(g[6], "...MM.......MM.....");
    g[7] = overlayRow(g[7], "..MMMMM...MMMMM....");
  }

  if (dir) g = turnGrid(g, dir);

  if (spec.accessory === 'hat') {
    // black top hat above the comb. Hat art is 17 wide; pad each row to the
    // 19-wide grid so all rows stay equal length.
    var crown = '...HHHHHHHHHHH...';
    var band  = '...HhhhhhhhhhH...';
    var brim  = '.HHHHHHHHHHHHHHH.';
    function pad(s) { return '.' + s + '.'; }
    g = [pad(crown), pad(crown), pad(band), pad(brim)].concat(g);
  }

  return g;
}

function makeRacerSprite(spec, color, dir) {
  return makeSprite(racerGrid(spec, dir), racerPalette(color, spec.evil));
}

// Diablo, mid-tantrum: his usual rear-view look (dark crimson body, mustache,
// angry red eyes) but with a clenched fist thrust up over the right side of the
// cart. We bake the mustache + angry eyes onto KART_GRID exactly like the normal
// Diablo (head rows 5-7), then PREPEND four rows above the body holding a dark
// arm ('B' = crimson body color) and a clenched fist ('h' = dark crimson accent
// for knuckle highlights, 'M' = dark outline). The grid grows upward; since
// sprites are bottom-anchored, ground alignment is preserved. All rows are 19
// wide so makeSprite stays happy.
function diabloAngryGrid() {
  var g = KART_GRID.slice();
  // same mustache + angry eyes as the mustache accessory
  g[5] = overlayRow(g[5], ".....e.....e.......");
  g[6] = overlayRow(g[6], "...MM.......MM.....");
  g[7] = overlayRow(g[7], "..MMMMM...MMMMM....");
  // raised fist over the cart's right side (player's view). The fist is a few
  // pixels tall; the arm drops down to meet the body. 19 wide each.
  var fist = [
    ".............MMM...",   // clenched fist top (dark outline)
    "...........MMhhhM..",   // knuckles (crimson highlight)
    "...........MhhhhM..",   // fist body
    "............MBBM..."    // wrist/arm into body
  ];
  return fist.concat(g);
}

function makeDiabloAngry() {
  return makeSprite(diabloAngryGrid(), racerPalette('#3A0E10', true));
}

// The 5 named opponents, in fixed roster order. Each gets a distinct cart color
// (none is the player's cyan #19D3DA), an optional baked-on accessory, a render
// scale, an `evil` flag, and a per-car behavior flag. ai.js copies
// name/scale/evil + the behavior flags onto each AI car.
var RACER_SPECS = [
  { name: 'Chicky',    color: '#F062A8', accessory: 'bow',      scale: 1.0,  evil: false, swerver: true },
  { name: 'Cornelius', color: '#3A6B3A', accessory: 'hat',      scale: 1.0,  evil: false, throwsHats: true },
  { name: 'Peewee',    color: '#F4C20D', accessory: null,       scale: 0.82, evil: false, jumper: true },
  { name: 'BIG CARL',  color: '#FF8C42', accessory: null,       scale: 1.4,  evil: false, big: true },
  { name: 'Diablo',    color: '#3A0E10', accessory: 'mustache', scale: 1.0,  evil: true  }
];

CK.buildSprites = function () {
  var aiColors = ['#E8413A', '#2ECC71', '#3498DB', '#F4C20D', '#9B59B6', '#FF8C42'];
  // each AI kart has straight + look-left/right (head turned, eye on that side)
  var karts = aiColors.map(function (c) {
    return { straight: makeKart(c), left: makeKartTurn(c, -1), right: makeKartTurn(c, 1) };
  });

  // named racers: straight + head-turn variants, with accessories baked in.
  // Behavior flags (swerver/throwsHats/jumper/big) ride along so ai.js can copy
  // them onto each AI car.
  var racers = RACER_SPECS.map(function (spec) {
    return {
      name: spec.name,
      scale: spec.scale,
      evil: spec.evil,
      swerver: !!spec.swerver,
      throwsHats: !!spec.throwsHats,
      jumper: !!spec.jumper,
      big: !!spec.big,
      straight: makeRacerSprite(spec, spec.color, 0),
      left: makeRacerSprite(spec, spec.color, -1),
      right: makeRacerSprite(spec, spec.color, 1)
    };
  });

  var playerColor = '#19D3DA'; // distinct cyan cart for the player
  CK.sprites = {
    karts: karts,
    racers: racers,
    diabloAngry: makeDiabloAngry(),  // raised-fist Diablo for when the player hits him
    player: {
      straight: makeSprite(PLAYER_GRID, kartPalette(playerColor)),
      left: makePlayerTurn(playerColor, -1),
      right: makePlayerTurn(playerColor, 1)
    },
    girlfriend: makeSprite(GIRLFRIEND_GRID, {
      '.': null,
      'F': '#FF8FC8',   // flower petals (pink)
      'f': '#FFE15A',   // flower center (yellow)
      'V': '#C9A7F0',   // lavender feathers
      'v': '#A87FD6',   // lavender shade
      'W': '#FFFFFF',   // white belly feathers
      'R': '#E23B3B',   // red comb
      'L': '#C81E5A',   // eyelashes / lipstick
      'C': '#FF9EC2',   // rosy cheeks
      'B': '#F4B400',   // beak
      'E': '#101014',   // eyes
      'K': '#E89A2B'    // legs / feet
    }),
    heart: makeSprite(HEART_GRID, { '.': null, 'H': '#FF3B6B' }),
    shoe: makeSprite(SHOE_GRID, { '.': null, 'O': '#7a1438', 'S': '#FF4F8B', 's': '#D1376E' }),
    bag: makeSprite(BAG_GRID, { '.': null, 'O': '#3a2a44', 'G': '#FF8FC8', 'g': '#E36FAE', 'i': '#FFE15A' }),
    egg: makeSprite(EGG_GRID, { '.': null, 'O': '#1a1a1a', 'W': '#FFFFFF', 'h': '#CFEFFF' }),
    hat: makeSprite(HAT_PROJECTILE_GRID, { '.': null, 'O': '#000000', 'H': '#101014', 'h': '#8a1212' }),
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
