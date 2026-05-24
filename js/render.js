// ===========================================================================
// Pseudo-3D rendering: project segments, fill the road, draw scaled sprites.
// ===========================================================================

function polygon(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function rumbleWidth(w, lanes) { return w / Math.max(6, 2 * lanes); }
function laneMarkerWidth(w, lanes) { return w / Math.max(32, 8 * lanes); }

function renderFog(ctx, x, y, width, height, fog) {
  if (fog < 1) {
    ctx.globalAlpha = (1 - fog);
    ctx.fillStyle = COLORS.FOG;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  }
}

function renderSegment(ctx, x1, y1, w1, x2, y2, w2, fog, color) {
  var C = CK.C;
  var r1 = rumbleWidth(w1, C.lanes), r2 = rumbleWidth(w2, C.lanes);
  var l1 = laneMarkerWidth(w1, C.lanes), l2 = laneMarkerWidth(w2, C.lanes);

  ctx.fillStyle = color.grass;
  ctx.fillRect(0, y2, C.width, y1 - y2);

  polygon(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
  polygon(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
  polygon(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

  if (color.lane) {
    var lw1 = w1 * 2 / C.lanes, lw2 = w2 * 2 / C.lanes;
    var lx1 = x1 - w1 + lw1, lx2 = x2 - w2 + lw2;
    for (var lane = 1; lane < C.lanes; lx1 += lw1, lx2 += lw2, lane++) {
      polygon(ctx, lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, color.lane);
    }
  }

  renderFog(ctx, 0, y1, C.width, y2 - y1, fog);
}

// Draw a pre-rasterized sprite scaled into the pseudo-3D scene.
function renderSprite(ctx, sprite, scale, destX, destY, offsetX, offsetY, clipY) {
  var C = CK.C;
  var destW = sprite.w * scale * (C.width / 2) * C.spriteScale * C.roadWidth;
  var destH = sprite.h * scale * (C.width / 2) * C.spriteScale * C.roadWidth;
  if (destW < 0.5 || destW > C.width * 3) return; // cull invisible / camera-clipping blow-ups

  destX += destW * (offsetX || 0);
  destY += destH * (offsetY || 0);

  var clipH = clipY ? Math.max(0, destY + destH - clipY) : 0;
  if (clipH >= destH) return;

  ctx.drawImage(
    sprite.img,
    0, 0, sprite.w, sprite.h - (sprite.h * clipH / destH),
    Math.round(destX), Math.round(destY), Math.round(destW), Math.round(destH - clipH)
  );
}

function renderPlayer(ctx, speedPercent, scale, destX, destY, steer, spinning) {
  var C = CK.C, S = CK.sprites.player;
  var bounce = (1.5 * Math.random() * speedPercent * C.resolution) * (Math.random() < 0.5 ? -1 : 1);
  var spr;
  if (spinning) spr = (Math.floor(CK.t * 20) % 2) ? S.left : S.right;
  else if (steer < 0) spr = S.left;
  else if (steer > 0) spr = S.right;
  else spr = S.straight;
  renderSprite(ctx, spr, scale, destX, destY + bounce, -0.5, -1, 0);
}

function drawCloud(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, 7);
  ctx.arc(x + r * 0.4, y - r * 0.2, r * 0.4, 0, 7);
  ctx.arc(x + r * 0.8, y, r * 0.5, 0, 7);
  ctx.fill();
}

function drawBackground(ctx) {
  var C = CK.C;
  ctx.fillStyle = COLORS.SKY;
  ctx.fillRect(0, 0, C.width, C.height);

  ctx.fillStyle = '#FFF3B0';
  ctx.beginPath();
  ctx.arc(C.width * 0.8, C.height * 0.22, 40, 0, 7);
  ctx.fill();

  var off = (CK.player.z * 0.00004) % 1;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (var i = 0; i < 3; i++) {
    var cx = (((i * 0.4) - off + 1) % 1) * C.width;
    drawCloud(ctx, cx, 55 + i * 32, 50 + i * 12);
  }
}

CK.render = function () {
  var C = CK.C, ctx = CK.ctx;
  ctx.imageSmoothingEnabled = false;

  // The camera sits playerZ behind the player's car (player.z = the car).
  var cameraZ = increase(CK.player.z - C.playerZ, 0, CK.trackLength);

  var baseSegment = findSegment(cameraZ);
  var basePercent = percentRemaining(cameraZ, C.segmentLength);
  var playerSegment = findSegment(CK.player.z);
  var playerPercent = percentRemaining(CK.player.z, C.segmentLength);
  var playerY = interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);

  var maxy = C.height;
  var x = 0;
  var dx = -(baseSegment.curve * basePercent);
  var n, i, segment, car, s;

  drawBackground(ctx);

  // ---- project + fill road (near -> far) ----
  for (n = 0; n < C.drawDistance; n++) {
    segment = CK.segments[(baseSegment.index + n) % CK.segments.length];
    segment.looped = segment.index < baseSegment.index;
    segment.fog = exponentialFog(n / C.drawDistance, C.fogDensity);
    segment.clip = maxy;

    var camZ = cameraZ - (segment.looped ? CK.trackLength : 0);
    project(segment.p1, (CK.player.x * C.roadWidth) - x, playerY + C.cameraHeight, camZ, C.cameraDepth, C.width, C.height, C.roadWidth);
    project(segment.p2, (CK.player.x * C.roadWidth) - x - dx, playerY + C.cameraHeight, camZ, C.cameraDepth, C.width, C.height, C.roadWidth);

    x += dx;
    dx += segment.curve;

    if (segment.p1.camera.z <= C.cameraDepth ||  // behind the camera
        segment.p2.screen.y >= segment.p1.screen.y || // back-face
        segment.p2.screen.y >= maxy) {            // hidden behind a hill
      continue;
    }

    renderSegment(ctx,
      segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w,
      segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w,
      segment.fog, segment.color);

    maxy = segment.p2.screen.y;
  }

  // ---- sprites + cars (far -> near so near overdraws far) ----
  for (n = C.drawDistance - 1; n > 0; n--) {
    segment = CK.segments[(baseSegment.index + n) % CK.segments.length];

    for (i = 0; i < segment.cars.length; i++) {
      car = segment.cars[i];
      var cs = interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
      var cx = interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (cs * car.offset * C.roadWidth * C.width / 2);
      var cy = interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
      // eggs render 1.6x so they're easy to spot on the road
      renderSprite(ctx, car.sprite, car.isEgg ? cs * 1.6 : cs, cx, cy, -0.5, -1, segment.clip);
    }

    for (i = 0; i < segment.sprites.length; i++) {
      s = segment.sprites[i];
      if (s.item && s.item.active === false) continue;
      var ss = segment.p1.screen.scale;
      var sx = segment.p1.screen.x + (ss * s.offset * C.roadWidth * C.width / 2);
      renderSprite(ctx, s.source, ss, sx, segment.p1.screen.y, -0.5, -1, segment.clip);
    }
  }

  // ---- player kart (fixed at bottom-center) ----
  var pInvis = isInvincible(CK.player);
  var camY = interpolate(playerSegment.p1.camera.y, playerSegment.p2.camera.y, playerPercent);
  var groundY = (C.height / 2) - (C.cameraDepth / C.playerZ * camY * C.height / 2);

  // jump arc + ground shadow
  var jumpH = 0;
  if (CK.player.jumpTimer > 0) {
    var pr = 1 - CK.player.jumpTimer / C.jumpDuration;
    jumpH = Math.sin(pr * Math.PI) * C.height * 0.20;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    var shW = 150 * (1 - jumpH / (C.height * 0.20) * 0.5);
    ctx.ellipse(C.width / 2, groundY - 6, shW, 16, 0, 0, 7);
    ctx.fill();
  }

  // steering leans the chicken; if not steering, it looks at the nearest racer alongside
  var steer = CK.keys.left ? -1 : CK.keys.right ? 1 : 0;
  if (steer === 0) {
    var bestDz = C.segmentLength * 5;
    for (var li = 0; li < CK.racers.length; li++) {
      var o = CK.racers[li];
      if (o.isPlayer) continue;
      var dzz = Math.abs(forwardGap(CK.player.z, o.z));
      if (dzz < bestDz && Math.abs(o.offset - CK.player.x) > 0.15) {
        steer = o.offset < CK.player.x ? -1 : 1;
        bestDz = dzz;
      }
    }
  }

  if (!(pInvis && Math.floor(CK.t * 15) % 2)) {
    renderPlayer(ctx,
      CK.player.speed / C.maxSpeed,
      C.cameraDepth / C.playerZ,
      C.width / 2,
      groundY - jumpH,
      steer,
      CK.player.spinTimer > 0);
  }

  // dropped eggs fall below the camera view, so show a screen-space toss out the back
  if (CK.player.eggTossTimer > 0) {
    var tp = 1 - CK.player.eggTossTimer / 0.5;
    var egg = CK.sprites.egg;
    var es = (1.0 + tp * 1.2);
    var ew = egg.w * es * 4, eh = egg.h * es * 4;
    var ex = C.width / 2 + CK.player.eggTossX * 130 - ew / 2;
    var ey = (groundY - 180 - eh) + tp * 150;  // pops out above the kart's tail, then drops away
    ctx.globalAlpha = Math.max(0, 1 - tp * 0.7);
    ctx.drawImage(egg.img, 0, 0, egg.w, egg.h, Math.round(ex), Math.round(ey), Math.round(ew), Math.round(eh));
    ctx.globalAlpha = 1;
  }

  CK.hud.render(ctx);
};
