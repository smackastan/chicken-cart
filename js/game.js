// ===========================================================================
// Game wiring: init, fixed-timestep loop, game states, restart.
// ===========================================================================

CK.init = function () {
  var canvas = document.getElementById('game');
  CK.canvas = canvas;
  CK.ctx = canvas.getContext('2d');
  CK.ctx.imageSmoothingEnabled = false;

  var C = CK.C;
  C.cameraDepth = 1 / Math.tan((C.fieldOfView / 2) * Math.PI / 180);
  C.playerZ = C.cameraHeight * C.cameraDepth;
  C.maxSpeed = C.segmentLength / (1 / 60);
  C.accel = C.maxSpeed / 5;
  C.breaking = -C.maxSpeed;
  C.decel = -C.maxSpeed / 5;
  C.offRoadDecel = -C.maxSpeed / 2;
  C.offRoadLimit = C.maxSpeed / 4;
  C.resolution = C.height / 480;

  CK.trackIndex = 0;
  CK.trophiesWon = [false, false, false]; // persists across the session
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
    z: 0, x: 0, speed: 0,
    lap: 0, finished: false, finishOrder: 0, position: 1,
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
  CK.state = STATE.COUNTDOWN;
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
