// ===========================================================================
// HUD: lap / position / speed / eggs / powerup, countdown + results overlays.
// ===========================================================================

CK.hud = {
  render: function (ctx) {
    var C = CK.C, p = CK.player;

    ctx.textBaseline = 'top';

    // lap
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LAP ' + Math.min(p.lap + 1, C.totalLaps) + '/' + C.totalLaps, 16, 12);

    // score
    ctx.fillStyle = p.score < 0 ? '#FF7A7A' : '#9CF0FF';
    ctx.fillText('SCORE ' + p.score, 16, 40);

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
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px monospace';
        ctx.fillText('SPLAT!', C.width / 2, C.height / 2 - 60);
        ctx.fillStyle = '#FF5A5A';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('egged!  -2', C.width / 2, C.height / 2);
      }
    }

    if (CK.state === STATE.INTRO) this.renderIntro(ctx);
    else if (CK.state === STATE.COUNTDOWN) this.renderCountdown(ctx);
    else if (CK.state === STATE.FINISHED) this.renderResults(ctx);

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
      ctx.fillText('opponents +' + Math.round((aiMul - 1) * 100) + '% faster · win the ' +
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

  renderResults: function (ctx) {
    var C = CK.C, p = CK.player;
    var metalColor = { bronze: '#CD7F32', silver: '#D8D8D8', gold: '#FFD23F' };

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
