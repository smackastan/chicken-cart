// ===========================================================================
// Player physics: steering, accel/brake, centrifugal pull, off-road penalty.
// player.z is the camera position; the player sprite sits playerZ ahead of it.
// ===========================================================================

CK.updatePlayer = function (dt) {
  var C = CK.C, p = CK.player, k = CK.keys;
  var playerSegment = findSegment(p.z);
  var speedPercent = p.speed / C.maxSpeed;
  var dx = dt * 2 * speedPercent; // steering rate scales with speed
  var startZ = p.z;

  // accelerate / brake / coast
  if (k.up)        p.speed = accelerate(p.speed, C.accel, dt);
  else if (k.down) p.speed = accelerate(p.speed, C.breaking, dt);
  else             p.speed = accelerate(p.speed, C.decel, dt);

  // steering
  if (k.left)  p.x -= dx;
  if (k.right) p.x += dx;

  // centrifugal pull outward on curves
  p.x -= dx * speedPercent * playerSegment.curve * C.centrifugal;

  // determine top speed from powerups / status effects
  var topSpeed = C.maxSpeed;
  if (p.powerup === 'faster') topSpeed = C.maxSpeed * 1.4;
  if (p.powerup === 'slower') topSpeed = Math.min(topSpeed, C.maxSpeed * 0.45);
  if (p.spinTimer > 0) {
    topSpeed = Math.min(topSpeed, C.maxSpeed * 0.25);
    p.x += Math.sin(p.spinTimer * 25) * 0.06; // wobble while spun
  }

  // off-road penalty
  if ((p.x < -1 || p.x > 1) && p.speed > C.offRoadLimit) {
    p.speed = accelerate(p.speed, C.offRoadDecel, dt);
  }

  p.x = clamp(p.x, -2, 2);
  p.speed = clamp(p.speed, 0, topSpeed);
  p.z = increase(p.z, dt * p.speed, CK.trackLength);

  // timers
  if (p.powerupTimer > 0) {
    p.powerupTimer -= dt;
    if (p.powerupTimer <= 0) p.powerup = null;
  }
  if (p.spinTimer > 0) p.spinTimer -= dt;
  if (p.eggCooldown > 0) p.eggCooldown -= dt;
  if (p.jumpTimer > 0) p.jumpTimer -= dt;
  if (p.jumpCooldown > 0) p.jumpCooldown -= dt;
  if (p.eggTossTimer > 0) p.eggTossTimer -= dt;
  if (p.splatTimer > 0) p.splatTimer -= dt;

  if (!p.finished) checkLapCrossing(p, startZ);
};

// Hop into the air (used to clear mud puddles). No effect mid-air or on cooldown.
CK.jump = function () {
  var p = CK.player;
  if (CK.state !== STATE.RACING) return;
  if (p.jumpTimer > 0 || p.jumpCooldown > 0) return;
  p.jumpTimer = CK.C.jumpDuration;
  p.jumpCooldown = CK.C.jumpDuration + CK.C.jumpRecharge;
};
