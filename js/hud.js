// ===========================================================================
// HUD: lap / position / speed / eggs / powerup, countdown + results overlays.
// ===========================================================================

CK.hud = {
  render: function (ctx) {
    var C = CK.C, p = CK.player;

    ctx.textBaseline = 'top';

    // lap + score: moved DOWN to sit just below the rearview mirror inset
    // (mirror rect in render.js is mx=12,my=10,mw=300,mh=96 -> bottom at y=106)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LAP ' + Math.min(p.lap + 1, C.totalLaps) + '/' + C.totalLaps, 16, 116);

    // score
    ctx.fillStyle = p.score < 0 ? '#FF7A7A' : '#9CF0FF';
    ctx.fillText('SCORE ' + p.score, 16, 144);

    // position
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText('POS ' + ordinal(p.position) + '/' + CK.racers.length, C.width - 16, 12);

    // active powerup banner
    if (p.powerup && p.powerupTimer > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = p.powerup === 'faster' ? '#3DF59A'
        : p.powerup === 'invincible' ? '#FFD23F' : '#FF5A5A';
      ctx.fillText(p.powerup.toUpperCase() + '  ' + p.powerupTimer.toFixed(1) + 's', C.width / 2, 12);
    }

    // speedometer (base speed reads as ~70 mph; boosts push it higher)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    var mph = Math.round(p.speed / C.maxSpeed * C.topSpeedMph);
    ctx.fillText(mph + ' mph', 16, C.height - 36);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(150, C.height - 34, 160, 16);
    ctx.fillStyle = '#FFD23F';
    ctx.fillRect(152, C.height - 32, 156 * clamp(p.speed / (C.maxSpeed * 1.4), 0, 1), 12);

    // eggs
    ctx.textAlign = 'right';
    ctx.fillStyle = p.eggCooldown > 0 ? '#888' : '#fff';
    ctx.fillText('EGGS x' + p.eggs, C.width - 16, C.height - 36);

    // egg-hit feedback: red flash + SPLAT! (eggs from behind aren't visible, so signal it)
    if (p.splatTimer > 0) {
      ctx.fillStyle = 'rgba(255,60,60,' + (0.35 * p.splatTimer) + ')';
      ctx.fillRect(0, 0, C.width, C.height);
      if (Math.floor(p.splatTimer * 12) % 2) {
        var attacker = CK.player.lastHitBy || 'a rival';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px monospace';
        ctx.fillText('SPLAT!', C.width / 2, C.height / 2 - 60);
        ctx.fillStyle = '#FF5A5A';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('EGGED BY ' + attacker.toUpperCase() + '!  -2', C.width / 2, C.height / 2);
      }
    }

    if (CK.state === STATE.INTRO) this.renderIntro(ctx);
    else if (CK.state === STATE.COUNTDOWN) this.renderCountdown(ctx);
    else if (CK.state === STATE.FINISHED) {
      // play a short cutscene first (win / heartbreak), then the normal results.
      var cs = (CK.outcome === 'win' || CK.outcome === 'lose') &&
               (CK.t - (CK.cutsceneStart || 0)) < 3.5;
      if (cs) this.renderCutscene(ctx);
      else this.renderResults(ctx);
    }

    if (CK.showControls) this.renderControls(ctx);
  },

  // Opening title: "CHICKEN CART" in flaming letters, holding for introDuration
  // seconds and fading out right before the countdown begins.
  renderIntro: function (ctx) {
    var C = CK.C;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, C.width, C.height);

    var t = CK.introTimer, elapsed = C.introDuration - t;
    var alpha = 1;
    if (elapsed < 1.2) alpha = elapsed / 1.2;      // fade in
    if (t < 1.5) alpha = Math.min(alpha, t / 1.5); // fade away just before GO
    alpha = clamp(alpha, 0, 1);

    this.renderFlameTitle(ctx, C.width / 2, C.height * 0.34, alpha);

    // Blinking "press any key / tap to start" prompt — any input begins the race.
    if (Math.floor(CK.t * 1.6) % 2) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(CK.isTouch ? 'TAP TO START' : 'PRESS ANY KEY TO START',
                   C.width / 2, C.height * 0.64);
    }

    this.renderStartHint(ctx); // controls shown at the beginning (stay readable)
  },

  // Warm gradient fill + flickering orange glow + gentle sway = "flaming" text.
  renderFlameTitle: function (ctx, cx, cy, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 92px monospace';

    var words = ['CHICKEN', 'CART'];
    for (var i = 0; i < words.length; i++) {
      var y = cy + i * 96;
      var wob = Math.sin(CK.t * 9 + i * 2) * 3;
      var grad = ctx.createLinearGradient(0, y - 52, 0, y + 52);
      grad.addColorStop(0,    '#fff6c0');
      grad.addColorStop(0.35, '#ffd23f');
      grad.addColorStop(0.7,  '#ff7a18');
      grad.addColorStop(1,    '#c50f06');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,110,0,0.95)';
      ctx.shadowBlur = 28 + 10 * Math.sin(CK.t * 16 + i); // flicker
      ctx.fillText(words[i], cx, y + wob);
      ctx.shadowBlur = 12;                                 // second pass = hotter bloom
      ctx.fillText(words[i], cx, y + wob);
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  },

  // Track name + a control reference, adapting to keyboard or touch.
  renderStartHint: function (ctx) {
    var C = CK.C;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('TRACK ' + (CK.trackIndex + 1) + '/' + CK.tracks.length + ' — ' +
                 CK.tracks[CK.trackIndex].name, C.width / 2, C.height - 118);

    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('CONTROLS', C.width / 2, C.height - 86);

    ctx.fillStyle = '#eee';
    ctx.font = '17px monospace';
    if (CK.isTouch) {
      ctx.fillText('GAS · BRAKE · ◀ ▶ steer · JUMP (clears mud) · EGG',
                   C.width / 2, C.height - 58);
      ctx.fillText('hold the on-screen buttons to steer & accelerate',
                   C.width / 2, C.height - 34);
    } else {
      ctx.fillText('W gas   S brake   A / D steer   SPACE jump   E drop egg',
                   C.width / 2, C.height - 58);
      ctx.fillText('press TAB anytime to see full controls', C.width / 2, C.height - 34);
    }
  },

  renderControls: function (ctx) {
    var C = CK.C;
    var pw = 480, ph = 330, px = (C.width - pw) / 2, py = (C.height - ph) / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#FFD23F';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('CONTROLS', C.width / 2, py + 22);

    var rows = CK.isTouch ? [
      ['GAS', 'accelerate'],
      ['BRAKE', 'brake'],
      ['◀ ▶', 'steer left / right'],
      ['JUMP', 'jump (clears mud)'],
      ['EGG', 'drop egg'],
      ['TAP', 'next track (on results)']
    ] : [
      ['W', 'accelerate'],
      ['S', 'brake'],
      ['A / D', 'steer left / right'],
      ['SPACE', 'jump (clears mud)'],
      ['E', 'drop egg'],
      ['ENTER', 'restart (on results)'],
      ['TAB', 'show / hide controls']
    ];
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    var y = py + 78;
    for (var i = 0; i < rows.length; i++) {
      ctx.fillStyle = '#9CF0FF';
      ctx.fillText(rows[i][0], px + 44, y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(rows[i][1], px + 190, y);
      y += 32;
    }
  },

  renderCountdown: function (ctx) {
    var C = CK.C;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, C.width, C.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 40px monospace';
    ctx.fillText('CHICKEN CART', C.width / 2, 36);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('TRACK ' + (CK.trackIndex + 1) + '/' + CK.tracks.length +
                 ' — ' + CK.tracks[CK.trackIndex].name, C.width / 2, 82);

    var aiMul = CK.tracks[CK.trackIndex].aiMul;
    if (aiMul > 1) {
      ctx.fillStyle = '#FF7A7A';
      ctx.font = '17px monospace';
      ctx.fillText('rivals are ~' + Math.round((aiMul - 1) * 100) + '% faster now · win the ' +
                   CK.tracks[CK.trackIndex].trophy + ' rooster!', C.width / 2, 108);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 130px monospace';
    ctx.textBaseline = 'middle';
    var n = Math.ceil(CK.countdown);
    ctx.fillText(CK.countdown <= 0 ? 'GO!' : ('' + n), C.width / 2, C.height / 2 - 10);

    ctx.textBaseline = 'top';
    ctx.font = '18px monospace';
    ctx.fillStyle = '#eee';
    if (CK.isTouch) {
      ctx.fillText('GAS · BRAKE · ◀ ▶ steer · JUMP · EGG', C.width / 2, C.height - 70);
      ctx.fillStyle = '#FFD23F';
      ctx.fillText('use the on-screen buttons', C.width / 2, C.height - 44);
    } else {
      ctx.fillText('W gas   S brake   A / D steer   SPACE jump   E drop egg', C.width / 2, C.height - 70);
      ctx.fillStyle = '#FFD23F';
      ctx.fillText('press TAB anytime to see controls', C.width / 2, C.height - 44);
    }
  },

  // Short (~3.5s) story beat after the player finishes, before the standings.
  // WIN: the girlfriend walks in and hands you the trophy amid floating hearts.
  // LOSE: the chicken that WON the race takes your girl, with per-winner flair
  //   (Big Carl carries her off, Cornelius tips his hat, Chicky goes shoe
  //   shopping, Diablo drags her off, others lead her away). Branches on
  //   CK.winner's behavior flags.
  // Driven entirely by t = seconds into the clip.
  renderCutscene: function (ctx) {
    var C = CK.C;
    // guard: if the data contract isn't satisfied, fall back to results.
    if (CK.cutsceneStart == null ||
        (CK.outcome !== 'win' && CK.outcome !== 'lose')) {
      this.renderResults(ctx);
      return;
    }

    var t = CK.t - (CK.cutsceneStart || 0);
    ctx.imageSmoothingEnabled = false;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // small easing helpers
    function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function easeOut(x) { x = clamp01(x); return 1 - (1 - x) * (1 - x); }
    function easeIn(x) { x = clamp01(x); return x * x; }
    function lerp(a, b, x) { return a + (b - a) * x; }

    // draw a sprite centered at (cx, cy) at the given scale (handles missing spr).
    function drawSpr(spr, cx, cy, scale) {
      if (!spr || !spr.img) return;
      var w = spr.w * scale, h = spr.h * scale;
      ctx.drawImage(spr.img, 0, 0, spr.w, spr.h,
        Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
    }

    var player = CK.sprites.player && CK.sprites.player.straight;
    var girl = CK.sprites.girlfriend;
    var ground = C.height * 0.78; // feet line for the standing chickens

    if (CK.outcome === 'win') {
      // ---- backdrop: warm celebratory glow ----
      var g = ctx.createLinearGradient(0, 0, 0, C.height);
      g.addColorStop(0, '#2a1f3a');
      g.addColorStop(1, '#120a1c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, C.width, C.height);

      var pScale = 7, gScale = 7;
      var playerX = C.width * 0.36;
      var playerY = ground - player.h * pScale / 2;
      // girlfriend walks in from the right and settles beside you
      var girlX = lerp(C.width + 120, C.width * 0.64, easeOut(t / 1.1));
      var bob = Math.sin(t * 10) * (t < 1.1 ? 6 : 0); // little walk bounce
      var girlY = ground - girl.h * gScale / 2 + bob;

      drawSpr(player, playerX, playerY, pScale);
      drawSpr(girl, girlX, girlY, gScale);

      // trophy travels from her hands into yours between t=1.1 and t=2.4
      var trophyKey = CK.tracks[CK.trackIndex].trophy;
      var trophy = CK.sprites.roosters && CK.sprites.roosters[trophyKey];
      var handoff = easeOut((t - 1.1) / 1.3);
      var fromX = girlX - 30, toX = playerX + 30;
      var trX = lerp(fromX, toX, handoff);
      var trY = ground - 150 - Math.sin(handoff * Math.PI) * 26; // gentle arc
      drawSpr(trophy, trX, trY, 3.2);

      // floating hearts rising up around the couple
      var heart = CK.sprites.heart;
      for (var i = 0; i < 6; i++) {
        var hp = (t * 0.45 + i / 6) % 1;            // 0..1 rising progress
        var hx = C.width * 0.5 + Math.sin(t * 1.5 + i * 1.7) * (90 + i * 14);
        var hy = ground - hp * (C.height * 0.62);
        var hs = 3 + Math.sin(t * 4 + i) * 0.6;
        ctx.save();
        ctx.globalAlpha = clamp01(1 - hp) * 0.95;
        if (heart) drawSpr(heart, hx, hy, hs);
        else { ctx.fillStyle = '#FF3B6B'; ctx.font = 'bold 26px monospace'; ctx.fillText('♥', hx, hy); }
        ctx.restore();
      }

      // text
      var pop = easeOut(t / 0.5); // title pops in
      ctx.save();
      ctx.globalAlpha = pop;
      ctx.fillStyle = '#FFD23F';
      ctx.font = 'bold 64px monospace';
      ctx.shadowColor = 'rgba(255,120,0,0.8)';
      ctx.shadowBlur = 22;
      ctx.fillText('YOU WON!', C.width / 2, 70);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FF6FB5';
      ctx.font = 'bold 40px monospace';
      ctx.fillText('♥', C.width / 2, 124);
      ctx.restore();

      if (t > 2.4) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('She gives you the ' + trophyKey + ' rooster!', C.width / 2, C.height - 56);
      }
    } else {
      // ---- LOSE: the winning chicken takes your girl (per-winner flair) ----
      var winner = CK.winner; // null only if the contract broke; guarded below
      var winnerSpr = winner && winner.spriteSet && winner.spriteSet.straight;
      var winnerScale = (winner && winner.scale) ? winner.scale : 1;

      // helper for the broken heart that hangs over the player on a loss
      function brokenHeart(px, py, startT, dur) {
        if (t <= startT) return;
        var bp = easeOut((t - startT) / (dur || 0.6));
        var heartSpr = CK.sprites.heart;
        ctx.save();
        ctx.globalAlpha = bp;
        if (heartSpr) {
          // draw the heart, then slice a dark jagged crack down the middle
          var hs = 5, hw = heartSpr.w * hs;
          drawSpr(heartSpr, px, py, hs);
          ctx.fillStyle = '#2a0406';
          var crackW = Math.max(2, hw * 0.10);
          ctx.fillRect(Math.round(px - crackW / 2),
                       Math.round(py - heartSpr.h * hs / 2),
                       crackW, heartSpr.h * hs);
        } else {
          ctx.fillStyle = '#7a2030';
          ctx.font = 'bold 56px monospace';
          ctx.fillText('</3', px, py);
        }
        ctx.restore();
      }

      // friendly (Chicky/Cornelius) vs sinister (Diablo/others) backdrop
      var friendly = !!(winner && (winner.swerver || winner.throwsHats));
      var g2 = ctx.createLinearGradient(0, 0, 0, C.height);
      if (friendly) { g2.addColorStop(0, '#241a3a'); g2.addColorStop(1, '#0d0a16'); }
      else          { g2.addColorStop(0, '#2a0d12'); g2.addColorStop(1, '#0a0406'); }
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, C.width, C.height);

      var pScale2 = 7, gScale2 = 7, wScale = 7 * winnerScale;
      var playerX2 = C.width * 0.26;
      var playerY2 = ground - player.h * pScale2 / 2;

      // your chicken: a startled shake early on, then it just sits there sadly
      var shake = t < 1.4 ? Math.sin(t * 40) * 3 : 0;
      drawSpr(player, playerX2 + shake, playerY2, pScale2);

      var girlStart = C.width * 0.52;
      var girlY2 = ground - girl.h * gScale2 / 2;
      var wH = winnerSpr ? winnerSpr.h : girl.h;
      var winnerY = ground - wH * wScale / 2;

      var title1 = '', title2 = '';

      if (winner && winner.big) {
        // ---- BIG CARL: scoops her up and carries her off-screen ----
        title1 = 'BIG CARL CARRIES'; title2 = 'YOUR GIRL OFF!';
        var grabT = 1.4;
        var carlInX = lerp(C.width + 180, girlStart + 90, easeOut(t / grabT));
        var carlX, girlX2, carried = 0;
        if (t < grabT) {
          carlX = carlInX;
          girlX2 = girlStart;
        } else {
          var off = easeIn((t - grabT) / (3.5 - grabT));
          carlX = lerp(girlStart + 90, -220, off);
          girlX2 = carlX - 60;     // tucked just ahead of him
          carried = 1;
        }
        // lift + bob her as if hoisted in his wings
        var lift = carried ? (60 + Math.sin(t * 8) * 8) : 0;
        drawSpr(winnerSpr, carlX, winnerY, wScale);
        drawSpr(girl, girlX2, girlY2 - lift, gScale2);
        brokenHeart(playerX2, playerY2 - player.h * pScale2 / 2 - 36, grabT);

      } else if (winner && winner.throwsHats) {
        // ---- CORNELIUS: slides in beside her and tips his hat, then she
        //      strolls off with him ----
        title1 = 'CORNELIUS'; title2 = 'TIPS HIS HAT!';
        var inT = 1.0, tipStart = 1.0, tipEnd = 2.1, walkStart = 2.4;
        var corX = lerp(C.width + 160, girlStart + 80, easeOut(t / inT));
        var girlX2c = girlStart;
        var walk = 0;
        if (t > walkStart) {
          // both stroll off to the right together
          walk = easeIn((t - walkStart) / (3.5 - walkStart));
          corX = lerp(girlStart + 80, C.width + 200, walk);
          girlX2c = lerp(girlStart, C.width + 120, walk);
        }
        drawSpr(winnerSpr, corX, winnerY, wScale);
        drawSpr(girl, girlX2c, girlY2, gScale2);

        // the hat lifts up off his head and settles back (a gentlemanly tip)
        var hat = CK.sprites.hat;
        if (hat && t > tipStart && t < walkStart) {
          var phase = clamp01((t - tipStart) / (tipEnd - tipStart));
          var up = Math.sin(phase * Math.PI) * 46;        // rise then settle
          var hatScale = 5;
          var hatX = corX;
          var hatY = winnerY - wH * wScale / 2 - 18 - up;
          drawSpr(hat, hatX, hatY, hatScale);
        }

        // gentlemanly hearts float up between them
        var heartC = CK.sprites.heart;
        for (var ci = 0; ci < 5; ci++) {
          var cp = (t * 0.5 + ci / 5) % 1;
          var cx = (corX + girlX2c) / 2 + Math.sin(t * 1.6 + ci * 1.9) * 50;
          var cy = ground - cp * (C.height * 0.5);
          ctx.save();
          ctx.globalAlpha = clamp01(1 - cp) * 0.9;
          if (heartC) drawSpr(heartC, cx, cy, 2.6 + Math.sin(t * 4 + ci) * 0.5);
          ctx.restore();
        }

      } else if (winner && winner.swerver) {
        // ---- CHICKY: happily walks off shoe shopping with your girl ----
        title1 = 'CHICKY TAKES YOUR GIRL'; title2 = 'SHOE SHOPPING!';
        // they pair up early, then stroll off toward the shops (right) together
        var meetT = 1.0, goT = 1.3;
        var chkX = lerp(C.width + 150, girlStart + 80, easeOut(t / meetT));
        var girlX2s = girlStart;
        var stroll = 0;
        if (t > goT) {
          stroll = easeIn((t - goT) / (3.5 - goT));
          chkX = lerp(girlStart + 80, C.width + 200, stroll);
          girlX2s = lerp(girlStart, C.width + 120, stroll);
        }
        var bobC = Math.sin(t * 9) * 5;   // happy bounce as they walk
        var bobG = Math.sin(t * 9 + 1) * 5;
        drawSpr(winnerSpr, chkX, winnerY + bobC, wScale);
        drawSpr(girl, girlX2s, girlY2 + bobG, gScale2);

        // shopping props bobbing along between them
        var shoe = CK.sprites.shoe, bag = CK.sprites.bag;
        var midX = (chkX + girlX2s) / 2;
        if (bag) drawSpr(bag, midX, ground - 70 + bobG, 4.0);
        if (shoe) drawSpr(shoe, girlX2s + 30, ground - 30, 3.2);

        // sparkles + hearts (lighthearted)
        for (var si = 0; si < 7; si++) {
          var sp = (t * 0.55 + si / 7) % 1;
          var sx = midX + Math.sin(t * 1.8 + si * 1.5) * (60 + si * 10);
          var sy = ground - sp * (C.height * 0.55);
          ctx.save();
          ctx.globalAlpha = clamp01(1 - sp) * 0.9;
          if (si % 2 === 0 && CK.sprites.heart) {
            drawSpr(CK.sprites.heart, sx, sy, 2.4);
          } else {
            ctx.fillStyle = '#FFE15A';
            ctx.font = 'bold 22px monospace';
            ctx.fillText('*', sx, sy);
          }
          ctx.restore();
        }

      } else if (winner && winner.evil) {
        // ---- DIABLO: grabs her, drags her off, broken heart over you ----
        title1 = 'DIABLO STOLE'; title2 = 'YOUR GIRL!';
        var grabTd = 1.4;
        var diabloInX = lerp(C.width + 140, girlStart + 70, easeOut(t / grabTd));
        var girlX2d, diabloX;
        if (t < grabTd) {
          girlX2d = girlStart + Math.sin(t * 30) * 2;   // trembling
          diabloX = diabloInX;
        } else {
          var offd = easeIn((t - grabTd) / (3.5 - grabTd));
          diabloX = lerp(girlStart + 70, -160, offd);
          girlX2d = diabloX - 70;                        // dragged ahead of him
        }
        drawSpr(girl, girlX2d, girlY2, gScale2);
        drawSpr(winnerSpr, diabloX, winnerY, wScale);
        brokenHeart(playerX2, playerY2 - player.h * pScale2 / 2 - 36, grabTd);

      } else {
        // ---- GENERIC (Peewee / unknown / winner missing): leads her away ----
        var wname = (winner && winner.name) ? winner.name : 'The winner';
        title1 = wname.toUpperCase() + ' STOLE'; title2 = 'YOUR GIRL!';
        var grabTg = 1.4;
        var inX = lerp(C.width + 150, girlStart + 70, easeOut(t / grabTg));
        var girlX2g, wX;
        if (t < grabTg) {
          girlX2g = girlStart + Math.sin(t * 28) * 2;
          wX = inX;
        } else {
          var offg = easeIn((t - grabTg) / (3.5 - grabTg));
          wX = lerp(girlStart + 70, -160, offg);
          girlX2g = wX - 70;
        }
        drawSpr(girl, girlX2g, girlY2, gScale2);
        if (winnerSpr) drawSpr(winnerSpr, wX, winnerY, wScale);
        brokenHeart(playerX2, playerY2 - player.h * pScale2 / 2 - 36, grabTg);
      }

      // ---- title text (bold, centered, readable on 1024x576) ----
      var pop = easeOut(t / 0.45);
      ctx.save();
      ctx.globalAlpha = pop;
      ctx.fillStyle = friendly ? '#FF6FB5' : '#FF5A5A';
      ctx.font = 'bold 70px monospace';
      ctx.fillText(friendly ? '!' : '!?', C.width / 2, 56);
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(title1, C.width / 2, C.height - 86);
      ctx.fillStyle = friendly ? '#FF6FB5' : '#FF5A5A';
      ctx.fillText(title2, C.width / 2, C.height - 44);
    }

    ctx.textBaseline = 'top';
  },

  renderResults: function (ctx) {
    var C = CK.C, p = CK.player;
    var metalColor = { bronze: '#CD7F32', silver: '#D8D8D8', gold: '#FFD23F' };
    var highlighted = false; // ensures only one leaderboard row gets the "you" marker

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, C.width, C.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('RACE COMPLETE', C.width / 2, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(CK.tracks[CK.trackIndex].name, C.width / 2, 76);

    // standings (left column)
    var lx = 80;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.fillText('You placed ' + ordinal(p.position) + ' of ' + CK.racers.length, lx, 124);
    ctx.font = '20px monospace';
    var y = 162;
    for (var i = 0; i < CK.racers.length; i++) {
      var r = CK.racers[i];
      ctx.fillStyle = r.isPlayer ? '#FFD23F' : '#cccccc';
      ctx.fillText((i + 1) + '.  ' + (r.isPlayer ? 'YOU' : 'CPU ' + (r.id + 1)) +
        (r.finished ? '  ✓' : '  …'), lx, y);
      y += 28;
    }
    ctx.fillStyle = '#9CF0FF';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('Score: ' + p.score, lx, y + 16);

    // TOP 10 leaderboard (center column, in the space freed by the short roster).
    // Sits between the left standings and the trophy (~0.72 width), above the
    // trophy shelf (C.height-118) and the "press ENTER" line at the bottom.
    var scores = CK.scores || [];
    var topX = C.width * 0.40;            // center-left column
    var topY = 124;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFD23F';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('TOP 10 SCORES', topX, topY);

    ctx.font = '20px monospace';
    var rowY = topY + 34;
    for (var s = 0; s < 10; s++) {
      var label = (s + 1) + '.';
      // pad rank label to a fixed width so the score column lines up
      while (label.length < 4) label += ' ';
      if (s < scores.length) {
        var val = scores[s];
        // highlight the row that matches this run's score (first match only)
        var isYou = (CK.lastScore != null && val === CK.lastScore && !highlighted);
        if (isYou) highlighted = true;
        ctx.fillStyle = isYou ? '#FFD23F' : '#9CF0FF';
        ctx.fillText(label + ' ' + val + (isYou ? '   ◄ you' : ''), topX, rowY);
      } else {
        ctx.fillStyle = '#555';
        ctx.fillText(label + ' --', topX, rowY);
      }
      rowY += 26;
    }

    // trophy (right side)
    var metal = CK.tracks[CK.trackIndex].trophy;
    var won = CK.trophiesWon[CK.trackIndex];
    var spr = won ? CK.sprites.roosters[metal] : CK.sprites.roosters.locked;
    var tcx = C.width * 0.72, tcy = 220, sc = 7;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr.img, 0, 0, spr.w, spr.h,
      Math.round(tcx - spr.w * sc / 2), Math.round(tcy - spr.h * sc / 2), spr.w * sc, spr.h * sc);

    ctx.textAlign = 'center';
    var baseY = tcy + spr.h * sc / 2 + 4;
    if (won) {
      ctx.fillStyle = metalColor[metal];
      ctx.font = 'bold 26px monospace';
      ctx.fillText('★ ' + metal.toUpperCase() + ' ROOSTER ★', tcx, baseY);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('1st place — trophy earned!', tcx, baseY + 28);
    } else {
      ctx.fillStyle = '#999';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(metal.toUpperCase() + ' ROOSTER', tcx, baseY);
      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText('Finish 1st to win it!', tcx, baseY + 28);
    }

    // trophy shelf: all three (colored if won, grey if not)
    var gap = 86, startX = C.width / 2 - gap, shelfY = C.height - 118, ssc = 2.4;
    for (var t = 0; t < CK.tracks.length; t++) {
      var s2 = CK.trophiesWon[t] ? CK.sprites.roosters[CK.tracks[t].trophy] : CK.sprites.roosters.locked;
      ctx.drawImage(s2.img, 0, 0, s2.w, s2.h,
        Math.round(startX + t * gap - s2.w * ssc / 2), shelfY, s2.w * ssc, s2.h * ssc);
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px monospace';
    var nextName = CK.tracks[(CK.trackIndex + 1) % CK.tracks.length].name;
    ctx.fillText((CK.isTouch ? 'Tap the screen' : 'Press ENTER') + ' for next track: ' + nextName,
      C.width / 2, C.height - 18);
  }
};
