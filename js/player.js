// ===========================================================================
// Player physics: steering, accel/brake, centrifugal pull, off-road penalty.
// player.z is the camera position; the player sprite sits playerZ ahead of it.
// ===========================================================================

// Ease `speed` toward a (possibly lowered) cap with forward momentum/inertia.
// When over the cap, the chicken DRAGS down gradually (dragDecel) instead of
// snapping, so involuntary slowdowns (mud / 'slower' / egg-spin) feel smooth.
// `braking` overspeed (the player actively braking) is left to the caller and
// stays responsive. Always clamps the lower bound at 0 and the absolute ceiling.
function applyDragToCap(speed, cap, dt) {
  var C = CK.C;
  if (speed > cap) {
    speed -= C.dragDecel * dt;   // gentle bleed toward the lowered cap
    if (speed < cap) speed = cap; // don't overshoot below the cap
  }
  // Absolute ceiling: the fastest anyone should ever travel. Never cut below the
  // caller's own cap (AI catch-up rubber-banding can exceed maxSpeed * 1.4).
  var ceiling = Math.max(C.maxSpeed * 1.4, cap);
  if (speed > ceiling) speed = ceiling;
  return clamp(speed, 0, ceiling);
}

CK.updatePlayer = function (dt) {
  var C = CK.C, p = CK.player, k = CK.keys;
  var playerSegment = findSegment(p.z);
  var speedPercent = p.speed / C.maxSpeed;

  // lateral steering momentum: input ramps in/out so it doesn't snap, but
  // stays snappy enough (steerEase) that steering never feels laggy.
  var steerTarget = (k.left ? -1 : 0) + (k.right ? 1 : 0);
  if (p.steer === undefined) p.steer = 0;
  p.steer += (steerTarget - p.steer) * Math.min(1, C.steerEase * dt);
  var dx = dt * 2 * speedPercent; // steering rate scales with speed
  var startZ = p.z;

  // accelerate / brake / coast
  if (k.up)        p.speed = accelerate(p.speed, C.accel, dt);
  else if (k.down) p.speed = accelerate(p.speed, C.breaking, dt);
  else             p.speed = accelerate(p.speed, C.decel, dt);

  // steering (eased via p.steer)
  p.x += dx * p.steer;

  // centrifugal pull outward on curves
  p.x -= dx * speedPercent * playerSegment.curve * C.centrifugal;

  // determine top speed from powerups / status effects
  var topSpeed = C.maxSpeed;
  if (p.powerup === 'faster') topSpeed = C.maxSpeed * 1.4;
  if (p.powerup === 'slower') topSpeed = Math.min(topSpeed, C.maxSpeed * 0.55);
  if (p.spinTimer > 0) {
    topSpeed = Math.min(topSpeed, C.maxSpeed * 0.25);
    p.x += Math.sin(p.spinTimer * 25) * 0.06; // wobble while spun
  }

  // off-road penalty
  if ((p.x < -1 || p.x > 1) && p.speed > C.offRoadLimit) {
    p.speed = accelerate(p.speed, C.offRoadDecel, dt);
  }

  p.x = clamp(p.x, -2, 2);
  // Intentional braking (S key) stays responsive; involuntary slowdowns ease.
  if (k.down) {
    p.speed = clamp(p.speed, 0, topSpeed);
  } else {
    p.speed = applyDragToCap(p.speed, topSpeed, dt);
  }
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
