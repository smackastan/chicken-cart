// ===========================================================================
// AI racers + shared race logic (standings, lap crossing, progress helpers).
// ===========================================================================

// Monotonic race distance (handles laps + the wrap seam).
function trackProgress(r) {
  return r.lap * CK.trackLength + r.z;
}

// Signed shortest gap a-b around the loop, in (-L/2, L/2].
function forwardGap(aZ, bZ) {
  var d = aZ - bZ, L = CK.trackLength;
  while (d > L / 2) d -= L;
  while (d < -L / 2) d += L;
  return d;
}

// Detect a finish-line crossing by watching for the z wrap.
function checkLapCrossing(r, prevZ) {
  if (prevZ > r.z && (prevZ - r.z) > CK.trackLength / 2) {
    r.lap++;
    if (r.lap >= CK.C.totalLaps && !r.finished) {
      r.finished = true;
      r.finishOrder = CK.finishCounter++;
      if (r.isPlayer) CK.onPlayerFinish();
    }
  }
}

CK.buildRacers = function () {
  var C = CK.C;
  CK.cars = [];
  for (var i = 0; i < C.aiCount; i++) {
    var z = increase((i + 1) * C.segmentLength * 1.5, 0, CK.trackLength);
    var car = {
      isPlayer: false,
      id: i,
      z: z,
      offset: (i % 2 ? -0.45 : 0.45) + rand(-0.05, 0.05),
      speed: 0,
      lap: 0,
      finished: false,
      finishOrder: 0,
      position: i + 2,
      spinTimer: 0,
      mudTimer: 0,
      eggCooldown: rand(2, 5),
      shootCooldown: rand(2, 5),
      look: 'straight',
      percent: percentRemaining(z, C.segmentLength)
    };
    // chicken identity from the visuals agent's racer roster
    car.spriteSet = CK.sprites.racers[i];
    car.name = car.spriteSet.name;
    car.scale = car.spriteSet.scale;
    car.evil = car.spriteSet.evil;
    // per-car behavior flags from the roster
    car.big = car.spriteSet.big;
    car.throwsHats = car.spriteSet.throwsHats;
    car.swerver = car.spriteSet.swerver;
    car.jumper = car.spriteSet.jumper;
    // jumper hop bookkeeping (Peewee hops ~once a second)
    car.jumpCd = Math.random();
    car.hopTimer = 0;
    // Every chicken (Big Carl included) tops out at 125% of the player's base
    // top speed — uniform across the field. The dynamic rubber-banding below
    // still lets them surge or ease off to stay in the pack around you.
    car.baseMax = C.maxSpeed * 1.25;
    car.sprite = car.spriteSet.straight;
    CK.cars.push(car);
    findSegment(car.z).cars.push(car);
  }
  CK.racers = [CK.player].concat(CK.cars);
};

CK.updateAI = function (dt) {
  var C = CK.C;
  var playerProgress = trackProgress(CK.player);
  var playerCarZ = CK.player.z;

  for (var n = 0; n < CK.cars.length; n++) {
    var car = CK.cars[n];
    if (car.finished) continue;

    var oldSeg = findSegment(car.z);
    var lookahead = CK.segments[(oldSeg.index + 6) % CK.segments.length];

    // 1) follow the racing line: steer toward the inside of the upcoming curve
    var target = clamp(-lookahead.curve * 0.6, -0.85, 0.85);

    // 2) dodge the player if close in z and overlapping in x
    var dz = forwardGap(playerCarZ, car.z);
    if (Math.abs(dz) < C.segmentLength * 4 && Math.abs(CK.player.x - car.offset) < 0.6) {
      target += (car.offset <= CK.player.x ? -0.5 : 0.5);
      target = clamp(target, -0.95, 0.95);
    }

    if (car.swerver) {
      // Chicky weaves back and forth across the road continuously instead of
      // tracking the racing line.
      car.offset = Math.sin(CK.t * 3 + car.id) * 0.8;
    } else {
      car.offset += clamp(target - car.offset, -dt * 2.0, dt * 2.0);
      car.offset = clamp(car.offset, -1.1, 1.1);
    }

    // turn the head to look at the nearest racer alongside this one
    var look = 'straight', bestDz = C.segmentLength * 5;
    for (var L = 0; L < CK.racers.length; L++) {
      var o = CK.racers[L];
      if (o === car) continue;
      var dzz = Math.abs(forwardGap(car.z, o.z));
      var oLat = o.isPlayer ? o.x : o.offset;
      if (dzz < bestDz && Math.abs(oLat - car.offset) > 0.15) {
        look = oLat < car.offset ? 'left' : 'right';
        bestDz = dzz;
      }
    }
    car.look = look;
    car.sprite = car.spriteSet[look];

    // Shoot projectiles FORWARD at the player when they're ahead and roughly in
    // line. Gated to forwardEggs tracks OR evil cars OR hat-throwers (Cornelius,
    // who pelts the player with hats on every track). items.js picks the sprite.
    if (CK.tracks[CK.trackIndex].forwardEggs || car.evil || car.throwsHats) {
      if (car.shootCooldown > 0) {
        car.shootCooldown -= dt;
      } else {
        var gp = forwardGap(CK.player.z, car.z); // > 0 means the player is ahead of this car
        if (gp > C.segmentLength * 1.5 && gp < C.segmentLength * 14 &&
            Math.abs(CK.player.x - car.offset) < 0.8) {
          CK.shootEgg(car);
          // evil cars reload faster, so they pelt the player more relentlessly;
          // hat-throwers use a normal shoot cooldown.
          car.shootCooldown = car.evil ? rand(1.2, 2.5) : rand(2.5, 5);
        }
      }
    }

    // Jumper (Peewee) hops about once a second; render.js lifts the sprite.
    if (car.jumper) {
      car.jumpCd -= dt;
      if (car.jumpCd <= 0) { car.hopTimer = 0.5; car.jumpCd = 1.0; }
      if (car.hopTimer > 0) car.hopTimer -= dt;
    }

    // drop an egg to defend when a racer is closing in just behind, on a similar line
    if (car.eggCooldown > 0) {
      car.eggCooldown -= dt;
    } else {
      for (var e = 0; e < CK.racers.length; e++) {
        var foe = CK.racers[e];
        if (foe === car) continue;
        var gap = forwardGap(car.z, foe.z); // > 0 means foe is behind this car
        var foeLat = foe.isPlayer ? foe.x : foe.offset;
        if (gap > C.segmentLength * 0.6 && gap < C.segmentLength * 6 &&
            Math.abs(foeLat - car.offset) < 0.7) {
          CK.spawnEgg(car);
          // evil cars drop defensive eggs more often too
          car.eggCooldown = car.evil ? rand(1.2, 2.5) : rand(2.5, 5);
          break;
        }
      }
    }

    // 3) speed with graduated rubber-banding + status effects.
    // behind > 0 means the player is ahead of this AI (AI is trailing).
    var topSpeed = car.baseMax;
    var behind = playerProgress - trackProgress(car);
    if (behind > C.segmentLength * 15) topSpeed *= 1.28;       // far behind -> charge to catch up
    else if (behind > C.segmentLength * 5) topSpeed *= 1.14;   // a bit behind -> push
    else if (behind < -C.segmentLength * 15) topSpeed *= 0.82; // far ahead -> ease off
    else if (behind < -C.segmentLength * 5) topSpeed *= 0.93;  // slightly ahead -> relax

    // BIG CARL is erratic: he randomly SURGES forward, then suddenly SLAMS to a
    // crawl — his speed jumps instantly at each switch so it reads as a lurch.
    if (car.big) {
      if (car.burstCd == null) { car.burstCd = rand(0.4, 1.2); car.bursting = false; }
      car.burstCd -= dt;
      if (car.burstCd <= 0) {
        car.bursting = !car.bursting;
        car.burstCd = car.bursting ? rand(0.5, 1.3) : rand(0.4, 1.0);
        car.speed = car.bursting ? car.baseMax * 1.6 : C.maxSpeed * 0.28; // sudden jump
      }
      topSpeed = car.bursting ? car.baseMax * 1.6 : C.maxSpeed * 0.28;
    }

    if (Math.abs(car.offset) > 1) topSpeed = Math.min(topSpeed, C.offRoadLimit * 1.5);
    if (car.mudTimer > 0) { topSpeed = Math.min(topSpeed, C.maxSpeed * 0.45); car.mudTimer -= dt; }
    if (car.spinTimer > 0) {
      topSpeed = Math.min(topSpeed, C.maxSpeed * 0.25);
      car.spinTimer -= dt;
      car.offset += Math.sin(car.spinTimer * 25) * 0.05;
    }

    car.speed = accelerate(car.speed, car.speed < topSpeed ? C.accel : C.decel * 0.5, dt);
    // Ease toward the (possibly lowered) cap with momentum instead of snapping,
    // so AI cars don't jolt to a stop on mud / 'slower' / egg-spin either.
    car.speed = applyDragToCap(car.speed, topSpeed, dt);

    var startZ = car.z;
    car.z = increase(car.z, dt * car.speed, CK.trackLength);
    car.percent = percentRemaining(car.z, C.segmentLength);

    var newSeg = findSegment(car.z);
    if (oldSeg !== newSeg) {
      var idx = oldSeg.cars.indexOf(car);
      if (idx >= 0) oldSeg.cars.splice(idx, 1);
      newSeg.cars.push(car);
    }

    checkLapCrossing(car, startZ);

    // No chicken can ever trail the player by more than 30 feet — they all stay
    // glued to your tail. Done AFTER lap-crossing + segment re-bucketing to avoid
    // false lap detection. Invisible because they're behind the camera. Sets
    // car.lap explicitly so trackProgress stays consistent after re-placement.
    if (CK.state === STATE.RACING && !car.finished && !CK.player.finished) {
      var behindD = trackProgress(CK.player) - trackProgress(car); // > 0 = car behind
      if (behindD > C.aiLeash) {
        var targetProgress = Math.max(0, trackProgress(CK.player) - C.aiLeash);
        var prevSeg = findSegment(car.z);
        car.lap = Math.floor(targetProgress / CK.trackLength);
        car.z = targetProgress - car.lap * CK.trackLength;
        car.percent = percentRemaining(car.z, C.segmentLength);
        var leashSeg = findSegment(car.z);
        if (prevSeg !== leashSeg) {
          var pi = prevSeg.cars.indexOf(car);
          if (pi >= 0) prevSeg.cars.splice(pi, 1);
          leashSeg.cars.push(car);
        }
        car.speed = Math.max(car.speed, CK.player.speed);
      }
    }
  }
};

CK.computeStandings = function () {
  CK.racers.sort(function (a, b) {
    if (a.finished && b.finished) return a.finishOrder - b.finishOrder;
    if (a.finished) return -1;
    if (b.finished) return 1;
    return trackProgress(b) - trackProgress(a);
  });
  for (var i = 0; i < CK.racers.length; i++) CK.racers[i].position = i + 1;
};
