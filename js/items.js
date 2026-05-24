// ===========================================================================
// Powerups (faster / slower / invincible), mud hazards, and the egg weapon.
// ===========================================================================

CK.boxes = [];
CK.hazards = [];
CK.eggs = [];

// Cooldowns (seconds) so impact SFX don't retrigger every frame while
// overlapping. Decremented by dt at the top of CK.updateItems.
var smashCd = 0, squishCd = 0;

function isInvincible(r) {
  return r.powerup === 'invincible' && r.powerupTimer > 0;
}

// Box types in placement order. (No slow box — only potholes slow you now.)
var BOX_TYPES = ['faster', 'egg', 'invincible', 'faster', 'egg', 'invincible'];

function applyPowerup(r, type) {
  r.powerup = type;
  if (type === 'faster') {
    r.powerupTimer = 3.5;
    r.speed = Math.max(r.speed, CK.C.maxSpeed); // instant kick
  } else if (type === 'invincible') {
    r.powerupTimer = 5;
    r.spinTimer = 0;
  } else if (type === 'slower') {
    r.powerupTimer = 2.5;
  }
}

CK.placeItems = function () {
  CK.boxes = [];
  CK.hazards = [];
  var C = CK.C, segs = CK.segments, n = segs.length, i;

  // powerup boxes around the loop, each marked with the effect it grants
  var picked = 0;
  for (i = 20; i < n - 20; i += randInt(18, 32)) {
    var boxOff = rand(-0.6, 0.6);
    var type = BOX_TYPES[picked % BOX_TYPES.length];
    picked++;
    var box = {
      offset: boxOff,
      z: i * C.segmentLength + C.segmentLength / 2,
      type: type,
      active: true,
      respawn: 0
    };
    CK.boxes.push(box);
    segs[i].sprites.push({ source: CK.sprites.boxes[type], offset: boxOff, item: box });
  }

  // mud / oil hazards (the "slower" environmental effect)
  for (i = 45; i < n - 20; i += randInt(28, 50)) {
    var mudOff = rand(-0.7, 0.7);
    CK.hazards.push({ offset: mudOff, z: i * C.segmentLength + C.segmentLength / 2 });
    segs[i].sprites.push({ source: CK.sprites.mud, offset: mudOff });
  }
};

// Spawn an egg just behind `owner` (a racer). Used by both the player and AI.
CK.spawnEgg = function (owner) {
  var C = CK.C;
  var lateral = owner.isPlayer ? owner.x : owner.offset;
  var z = increase(owner.z - C.segmentLength * 0.8, 0, CK.trackLength);
  var egg = {
    z: z,
    offset: lateral,
    life: 12,
    dropperProgress: trackProgress(owner),
    owner: owner,
    // hat-throwers (Cornelius) fling top hats; everyone else lays eggs. Hats spin
    // out racers exactly like eggs (isEgg stays true).
    sprite: (owner && owner.throwsHats && CK.sprites.hat) ? CK.sprites.hat : CK.sprites.egg,
    percent: percentRemaining(z, C.segmentLength),
    isEgg: true,
    dead: false
  };
  CK.eggs.push(egg);
  findSegment(z).cars.push(egg);
  return egg;
};

// Shoot an egg FORWARD from `owner` (used by Track-3 AI to pelt racers ahead).
CK.shootEgg = function (owner) {
  var C = CK.C;
  var lateral = owner.isPlayer ? owner.x : owner.offset;
  var z = increase(owner.z + C.segmentLength * 0.5, 0, CK.trackLength);
  var egg = {
    z: z,
    offset: lateral,
    life: 6,
    owner: owner,
    forward: true,
    vz: C.maxSpeed * 1.25,
    dropperProgress: trackProgress(owner),
    // hat-throwers (Cornelius) shoot top hats; everyone else shoots eggs. Hats
    // spin out racers exactly like eggs (isEgg stays true).
    sprite: (owner && owner.throwsHats && CK.sprites.hat) ? CK.sprites.hat : CK.sprites.egg,
    percent: percentRemaining(z, C.segmentLength),
    isEgg: true,
    dead: false
  };
  CK.eggs.push(egg);
  findSegment(z).cars.push(egg);
  return egg;
};

CK.dropEgg = function () {
  var p = CK.player;
  if (p.eggs <= 0 || p.eggCooldown > 0 || CK.state !== STATE.RACING) return;
  CK.spawnEgg(p);
  p.eggs--;
  p.eggCooldown = 0.8;
  p.eggTossTimer = 0.5;   // screen-space toss animation so you SEE the drop
  p.eggTossX = p.x;
};

CK.updateItems = function (dt) {
  var C = CK.C, p = CK.player;
  var playerCarZ = p.z;
  var airborne = p.jumpTimer > 0;
  var i, j;

  // Bleed down impact-SFX cooldowns.
  if (smashCd > 0) smashCd -= dt;
  if (squishCd > 0) squishCd -= dt;

  // Bleed down per-car "angry" timers (e.g. Diablo fuming after a hit).
  // Created lazily on the car object, so guard for undefined.
  if (CK.cars) {
    for (i = 0; i < CK.cars.length; i++) {
      var ac = CK.cars[i];
      if (ac && ac.angryTimer > 0) ac.angryTimer -= dt;
    }
  }

  // powerup boxes (player only)
  for (i = 0; i < CK.boxes.length; i++) {
    var box = CK.boxes[i];
    if (!box.active) {
      box.respawn -= dt;
      if (box.respawn <= 0) box.active = true;
      continue;
    }
    if (Math.abs(forwardGap(playerCarZ, box.z)) < C.segmentLength &&
        Math.abs(p.x - box.offset) < 0.5) {
      if (box.type === 'egg') {
        p.eggs = Math.min(p.eggs + 2, 9);   // ammo box: +2 eggs
        if (CK.carSfx && CK.carSfx.pickupEgg) CK.carSfx.pickupEgg();
      } else {
        if (box.type === 'faster') {
          p.score += 1;
          if (CK.carSfx && CK.carSfx.boost) CK.carSfx.boost();
        } else if (box.type === 'invincible') {
          p.score += 2;
          if (CK.carSfx && CK.carSfx.pickupInvincible) CK.carSfx.pickupInvincible();
        }
        applyPowerup(p, box.type);
      }
      box.active = false;
      box.respawn = 6;
    }
  }

  // mud hazards (affect player + AI)
  for (i = 0; i < CK.hazards.length; i++) {
    var h = CK.hazards[i];
    if (!isInvincible(p) && !airborne &&
        Math.abs(forwardGap(playerCarZ, h.z)) < C.segmentLength &&
        Math.abs(p.x - h.offset) < 0.45) {
      p.powerup = 'slower';
      p.powerupTimer = Math.max(p.powerupTimer, 1.5);
      // Wet splat when the player slogs through mud/a pothole.
      if (squishCd <= 0 && CK.carSfx && CK.carSfx.squish) {
        CK.carSfx.squish();
        squishCd = 0.7;
      }
    }
    for (j = 0; j < CK.cars.length; j++) {
      var c = CK.cars[j];
      if (Math.abs(forwardGap(c.z, h.z)) < C.segmentLength &&
          Math.abs(c.offset - h.offset) < 0.45) {
        c.mudTimer = Math.max(c.mudTimer, 1.5);
      }
    }
  }

  // Collision CRUNCH when the player overlaps another car/chicken (sound only;
  // does NOT change physics/speeds). Cooldown-gated so it fires once per hit.
  if (smashCd <= 0 && CK.carSfx && CK.carSfx.smash) {
    for (j = 0; j < CK.cars.length; j++) {
      var col = CK.cars[j];
      if (col.finished) continue;
      if (Math.abs(forwardGap(p.z, col.z)) < C.segmentLength * 0.6 &&
          Math.abs(p.x - col.offset) < 0.4) {
        CK.carSfx.smash();
        smashCd = 0.5;
        // Hitting Diablo makes him fume: raise his fist + pour smoke.
        if (col.evil) col.angryTimer = 2.0;
        break;
      }
    }
  }

  // Eggs spin out racers. Dropped eggs hit racers BEHIND the dropper; forward (shot)
  // eggs travel up the track and hit whoever they catch. A hit costs the player -2.
  var anyDead = false;
  for (i = 0; i < CK.eggs.length; i++) {
    var egg = CK.eggs[i];
    egg.life -= dt;
    if (egg.life <= 0) { egg.dead = true; anyDead = true; continue; }

    if (egg.forward) {
      var oldSeg = findSegment(egg.z);
      egg.z = increase(egg.z + egg.vz * dt, 0, CK.trackLength);
      egg.percent = percentRemaining(egg.z, C.segmentLength);
      var newSeg = findSegment(egg.z);
      if (oldSeg !== newSeg) {
        var oi = oldSeg.cars.indexOf(egg);
        if (oi >= 0) oldSeg.cars.splice(oi, 1);
        newSeg.cars.push(egg);
      }
    }

    var ztol = egg.forward ? C.segmentLength * 1.7 : C.segmentLength;
    for (j = 0; j < CK.racers.length; j++) {
      var r = CK.racers[j];
      if (r === egg.owner || r.spinTimer > 0 || isInvincible(r)) continue;
      if (!egg.forward && trackProgress(r) >= egg.dropperProgress) continue; // dropped: behind only
      var rLat = r.isPlayer ? r.x : r.offset;
      if (Math.abs(forwardGap(r.z, egg.z)) < ztol && Math.abs(rLat - egg.offset) < 0.4) {
        r.spinTimer = 1.6;
        // The player egging Diablo makes him fume: raise his fist + pour smoke.
        if (r.evil && egg.owner && egg.owner.isPlayer) r.angryTimer = 2.0;
        if (r.isPlayer) {
          r.score -= 2;
          r.splatTimer = 1.0;
          r.lastHitBy = egg.owner && egg.owner.name ? egg.owner.name : 'a rival';
          // The evil chicken cackles when his egg lands on the player.
          if (egg.owner && egg.owner.evil) {
            if (CK.sound && CK.sound.evilLaugh) CK.sound.evilLaugh();
          }
        }
        egg.dead = true;
        anyDead = true;
        break;
      }
    }
  }

  if (anyDead) {
    for (i = 0; i < CK.eggs.length; i++) {
      if (CK.eggs[i].dead) {
        var seg = findSegment(CK.eggs[i].z);
        var idx = seg.cars.indexOf(CK.eggs[i]);
        if (idx >= 0) seg.cars.splice(idx, 1);
      }
    }
    CK.eggs = CK.eggs.filter(function (e) { return !e.dead; });
  }
};
