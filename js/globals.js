// ===========================================================================
// Chicken Cart - global namespace + tunable constants
// State lives on CK.*  |  helper functions are declared globally (plain scripts).
// ===========================================================================

var CK = {};

// Game states
var STATE = {
  INTRO: 'intro',        // flaming title screen before the countdown
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished'
};

// Tunable constants. Values marked `null` are derived in CK.init().
CK.C = {
  width: 1024,
  height: 576,

  segmentLength: 200,   // world z units per road segment
  rumbleLength: 3,      // segments per color band
  roadWidth: 2000,      // half-width of the road in world units
  lanes: 3,

  cameraHeight: 1800,   // camera height above the road (higher = more top-down angle)
  fieldOfView: 100,     // degrees
  cameraDepth: null,    // = 1 / tan(fov/2)
  playerZ: null,        // = cameraHeight * cameraDepth (camera->player distance)
  drawDistance: 220,    // segments rendered ahead
  fogDensity: 5,

  spriteScale: 0.3 / 19, // 19 = kart sprite pixel width -> kart ~30% of road width

  maxSpeed: null,       // = segmentLength / (1/60)
  accel: null,
  breaking: null,
  decel: null,
  offRoadDecel: null,
  offRoadLimit: null,
  centrifugal: 0.3,     // outward pull on curves
  resolution: null,     // = height / 480 (bounce scaling)

  jumpDuration: 0.65,   // seconds airborne after a hop
  jumpRecharge: 0.35,   // cooldown before you can jump again

  introDuration: 10,    // seconds of flaming title before the countdown
  topSpeedMph: 70,      // speedometer reading at full base speed

  totalLaps: 3,
  aiCount: 10
};
