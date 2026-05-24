// ===========================================================================
// Track: segment data model, builders, looping circuit, item placement.
// ===========================================================================

CK.segments = [];
CK.trackLength = 0;

function findSegment(z) {
  return CK.segments[Math.floor(z / CK.C.segmentLength) % CK.segments.length];
}

function lastY() {
  return CK.segments.length === 0 ? 0 : CK.segments[CK.segments.length - 1].p2.world.y;
}

function addSegment(curve, y) {
  var n = CK.segments.length;
  CK.segments.push({
    index: n,
    p1: { world: { y: lastY(), z: n * CK.C.segmentLength }, camera: {}, screen: {} },
    p2: { world: { y: y, z: (n + 1) * CK.C.segmentLength }, camera: {}, screen: {} },
    curve: curve,
    sprites: [],
    cars: [],
    color: Math.floor(n / CK.C.rumbleLength) % 2 ? COLORS.DARK : COLORS.LIGHT
  });
}

function addRoad(enter, hold, leave, curve, y) {
  var startY = lastY();
  var endY = startY + (y * CK.C.segmentLength);
  var total = enter + hold + leave;
  var n;
  for (n = 0; n < enter; n++) addSegment(easeIn(0, curve, n / enter), easeInOut(startY, endY, n / total));
  for (n = 0; n < hold; n++)  addSegment(curve, easeInOut(startY, endY, (enter + n) / total));
  for (n = 0; n < leave; n++) addSegment(easeInOut(curve, 0, n / leave), easeInOut(startY, endY, (enter + hold + n) / total));
}

function addStraight(num) {
  num = num || ROAD.LENGTH.MEDIUM;
  addRoad(num, num, num, 0, 0);
}

function addHill(num, height) {
  num = num || ROAD.LENGTH.MEDIUM;
  height = height || ROAD.HILL.MEDIUM;
  addRoad(num, num, num, 0, height);
}

function addCurve(num, curve, height) {
  num = num || ROAD.LENGTH.MEDIUM;
  curve = curve || ROAD.CURVE.MEDIUM;
  height = height || ROAD.HILL.NONE;
  addRoad(num, num, num, curve, height);
}

function addSCurves() {
  var L = ROAD.LENGTH, C = ROAD.CURVE, H = ROAD.HILL;
  addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.EASY, H.NONE);
  addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, C.MEDIUM, H.MEDIUM);
  addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, C.EASY, -H.LOW);
  addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.EASY, H.MEDIUM);
  addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.MEDIUM, -H.MEDIUM);
}

function addLowRollingHills(num, height) {
  var L = ROAD.LENGTH, H = ROAD.HILL;
  num = num || L.SHORT;
  height = height || H.LOW;
  addRoad(num, num, num, 0, height / 2);
  addRoad(num, num, num, 0, -height);
  addRoad(num, num, num, 0, height);
  addRoad(num, num, num, 0, 0);
  addRoad(num, num, num, 0, height / 2);
  addRoad(num, num, num, 0, 0);
}

// --- Track 1: Sunny Sprint (~45s race, ~675 seg/lap) ---
function buildTrack0() {
  var L = ROAD.LENGTH, C = ROAD.CURVE, H = ROAD.HILL;
  addStraight(L.SHORT);                    // 75
  addCurve(L.MEDIUM, C.EASY, H.NONE);      // 150
  addStraight(L.SHORT);                    // 75
  addCurve(L.MEDIUM, -C.MEDIUM, H.LOW);    // 150
  addHill(L.SHORT, H.MEDIUM);              // 75
  addCurve(L.SHORT, C.EASY, H.NONE);       // 75
  addStraight(L.SHORT);                    // 75
}

// --- Track 2: Rolling Ranch (~70s race, ~975 seg/lap) ---
function buildTrack1() {
  var L = ROAD.LENGTH, C = ROAD.CURVE, H = ROAD.HILL;
  addStraight(L.SHORT);                    // 75
  addCurve(L.MEDIUM, C.EASY, H.NONE);      // 150
  addHill(L.MEDIUM, H.MEDIUM);             // 150
  addCurve(L.LONG, -C.MEDIUM, H.NONE);     // 300
  addStraight(L.SHORT);                    // 75
  addCurve(L.MEDIUM, C.HARD, H.NONE);      // 150
  addStraight(L.SHORT);                    // 75
}

// --- Track 3: Mountain Madness (~105s race, ~1425 seg/lap) ---
function buildTrack2() {
  var L = ROAD.LENGTH, C = ROAD.CURVE, H = ROAD.HILL;
  addStraight(L.SHORT);                    // 75
  addCurve(L.MEDIUM, C.EASY, H.NONE);      // 150
  addHill(L.MEDIUM, H.MEDIUM);             // 150
  addCurve(L.LONG, C.MEDIUM, H.LOW);       // 300
  addStraight(L.MEDIUM);                   // 150
  addCurve(L.LONG, -C.MEDIUM, H.MEDIUM);   // 300
  addHill(L.MEDIUM, -H.MEDIUM);            // 150
  addCurve(L.MEDIUM, C.HARD, H.NONE);      // 150
}

CK.tracks = [
  { name: 'Sunny Sprint',     build: buildTrack0, aiMul: 1.00, trophy: 'bronze' },
  { name: 'Rolling Ranch',    build: buildTrack1, aiMul: 1.15, trophy: 'silver' },
  { name: 'Mountain Madness', build: buildTrack2, aiMul: 1.05, trophy: 'gold', forwardEggs: true }
];

CK.buildTrack = function () {
  CK.segments = [];
  CK.tracks[CK.trackIndex].build();

  // Finish/start band at the beginning of the loop.
  for (var s = 0; s < CK.C.rumbleLength; s++) CK.segments[s].color = COLORS.START;

  CK.trackLength = CK.segments.length * CK.C.segmentLength;

  CK.placeRoadsideSprites();
  CK.placeItems();
};

CK.placeRoadsideSprites = function () {
  var segs = CK.segments, n = segs.length, i;
  for (i = 12; i < n; i += randInt(2, 8)) {
    var side = Math.random() < 0.5 ? -1 : 1;
    segs[i].sprites.push({ source: CK.sprites.tree, offset: side * rand(1.3, 3.5) });
  }
  // Checkered signs flanking the start/finish line.
  segs[3].sprites.push({ source: CK.sprites.banner, offset: -1.7 });
  segs[3].sprites.push({ source: CK.sprites.banner, offset: 1.7 });
};
