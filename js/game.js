// ===========================================================================
// Game wiring: init, fixed-timestep loop, game states, restart.
// ===========================================================================

// Score persistence. localStorage can throw under some file:// contexts, so
// every access is wrapped in try/catch and falls back gracefully.
CK.SCORES_KEY = 'chickenCart.scores';
CK.MAX_SCORES = 100;

CK.loadScores = function () {
  CK.scores = [];
  try {
    var raw = window.localStorage.getItem(CK.SCORES_KEY);
    if (raw) {
      var arr = JSON.parse(raw);
      if (Object.prototype.toString.call(arr) === '[object Array]') {
        CK.scores = arr.filter(function (n) { return typeof n === 'number' && isFinite(n); });
      }
    }
  } catch (e) {
    CK.scores = [];
  }
};

CK.saveScores = function () {
  try {
    window.localStorage.setItem(CK.SCORES_KEY, JSON.stringify(CK.scores));
  } catch (e) {
    // ignore: persistence is best-effort
  }
};

CK.init = function () {
  var canvas = document.getElementById('game');
  CK.canvas = canvas;
  CK.ctx = canvas.getContext('2d');
  CK.ctx.imageSmoothingEnabled = false;

  var C = CK.C;
  C.cameraDepth = 1 / Math.tan((C.fieldOfView / 2) * Math.PI / 180);
  C.playerZ = C.cameraHeight * C.cameraDepth;
  C.maxSpeed = C.segmentLength / (1 / 60) * C.speedScale;
  C.accel = C.maxSpeed / 5;
  C.breaking = -C.maxSpeed;
  C.decel = -C.maxSpeed / 5;
  C.offRoadDecel = -C.maxSpeed / 2;
  C.offRoadLimit = C.maxSpeed / 4;
  C.dragDecel = C.maxSpeed * C.dragDecelMul;
  C.resolution = C.height / 480;

  // feet -> world-units conversion from the speed scale, then Diablo's max leash:
  // he can never trail the player by more than 25 feet.
  // Every chicken is leashed to stay within 30 feet behind the player.
  C.aiLeash = 30 * (C.maxSpeed / (C.topSpeedMph * 5280 / 3600));

  CK.trackIndex = 0;
  CK.trophiesWon = [false, false, false]; // persists across the session
  CK.loadScores();                        // past run scores from localStorage
  CK.buildSprites();
  CK.restart();

  CK.last = performance.now();
  CK.acc = 0;
  CK.t = 0;
  requestAnimationFrame(CK.frame);
};

CK.restart = function () {
  CK.player = {
    isPlayer: true,
    z: 0, x: 0, speed: 0, steer: 0,
    lap: 0, finished: false, finishOrder: 0, position: 1,
    lastHitBy: null,
    powerup: null, powerupTimer: 0,
    spinTimer: 0,
    eggs: 3, eggCooldown: 0, eggTossTimer: 0, eggTossX: 0,
    jumpTimer: 0, jumpCooldown: 0,
    splatTimer: 0,
    score: 0
  };
  CK.eggs = [];
  CK.finishCounter = 0;

  CK.buildTrack();
  CK.buildRacers();

  CK.awarded = false;
  CK.lastScore = null;   // cleared until this race finishes (HUD highlight)
  CK.outcome = null;
  CK.winner = null;
  CK.cutsceneStart = 0;
  CK.state = STATE.INTRO;
  CK.introTimer = CK.C.introDuration;
  CK.countdown = 3.0;
};

CK.onPlayerFinish = function () {
  CK.state = STATE.FINISHED;
};

// Advance to the next track (wrapping) and start a fresh race.
CK.nextRace = function () {
  CK.trackIndex = (CK.trackIndex + 1) % CK.tracks.length;
  CK.restart();
};

var STEP = 1 / 60;

CK.update = function (dt) {
  if (CK.state === STATE.INTRO) {
    CK.introTimer -= dt;
    if (CK.introTimer <= 0) CK.state = STATE.COUNTDOWN;
    return;
  }
  if (CK.state === STATE.COUNTDOWN) {
    CK.countdown -= dt;
    if (CK.countdown <= -0.8) CK.state = STATE.RACING;
    return;
  }
  if (CK.state === STATE.RACING) {
    CK.updatePlayer(dt);
    CK.updateAI(dt);
    CK.updateItems(dt);
    CK.computeStandings();

    // award the track's rooster trophy if the player wins (finishes 1st)
    if (CK.player.finished && !CK.awarded) {
      CK.awarded = true;
      if (CK.player.position === 1) CK.trophiesWon[CK.trackIndex] = true;

      // Persist this run's score (once per race, guarded by !CK.awarded above).
      // Keep CK.scores sorted DESC and capped, and remember it for the HUD.
      CK.lastScore = CK.player.score;
      if (!CK.scores) CK.scores = [];
      CK.scores.push(CK.player.score);
      CK.scores.sort(function (a, b) { return b - a; });
      if (CK.scores.length > CK.MAX_SCORES) CK.scores.length = CK.MAX_SCORES;
      CK.saveScores();

      // Determine the results-screen outcome (positions are fresh here) and
      // capture the moment of finishing for hud.js cutscenes. On a loss,
      // CK.racers[0] is the winning AI chicken (racers are sorted by standing).
      CK.outcome = (CK.player.position === 1) ? 'win' : 'lose';
      CK.winner = (CK.player.position === 1) ? null : CK.racers[0];
      CK.cutsceneStart = CK.t;
    }
  }
};

CK.frame = function (now) {
  var dt = Math.min(1, (now - CK.last) / 1000);
  CK.last = now;
  CK.acc += dt;
  CK.t += dt;
  while (CK.acc >= STEP) {
    CK.update(STEP);
    CK.acc -= STEP;
  }
  CK.render();
  requestAnimationFrame(CK.frame);
};

window.addEventListener('load', CK.init);
