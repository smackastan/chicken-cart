// ===========================================================================
// Chicken Cart - car sound effects (CK.carSfx)
//
// Chiptune / 8-bit driving effects, driven each frame by input + speed:
//   1. a tire SCREECH on the rising edge of brake (and a held-brake retrigger)
//   2. a tire CHIRP on the rising edge of steer left/right
//   2b. a repeating CRUNCH while riding off the track on the grass (|x| > 1)
// plus two one-shot impact effects fired by gameplay (items.js):
//   3. SMASH! - a punchy collision crunch (car/chicken hit)
//   4. squish - a wet splat (pothole/mud hit)
//
// Plain script, shares the global CK object (no modules, runs from file://).
// Builds on the read-only audio core in audio.js (CK.sound.*). Everything is
// guarded; audio must never break gameplay, so nothing here ever throws.
//
// A single requestAnimationFrame loop runs from script load. It idles
// harmlessly (only tracking key edges) until CK.sound.ready() is true, then
// fires the brake/turn one-shots on input edges.
// ===========================================================================

CK.carSfx = CK.carSfx || {};

(function () {
  'use strict';

  // ---- Tunables ------------------------------------------------------------
  var BRAKE_SPEED_MIN  = 0.25;       // need this speed% to screech on the brakes
  var BRAKE_FREQ_HI    = 1800;       // bandpass sweep start (Hz)
  var BRAKE_FREQ_LO    = 300;        // bandpass sweep end (Hz)
  var BRAKE_DUR        = 0.42;       // screech length (s)
  var BRAKE_Q          = 5;          // bandpass resonance
  var BRAKE_GAIN       = 0.22;       // screech volume
  var BRAKE_COOLDOWN   = 0.40;       // re-screech interval while held (s)

  var TURN_SPEED_MIN   = 0.20;       // need this speed% to screech on a turn
  var TURN_FREQ_HI     = 1200;       // bandpass sweep start (Hz)
  var TURN_FREQ_LO     = 500;        // bandpass sweep end (Hz)
  var TURN_DUR         = 0.14;       // screech length (s)
  var TURN_Q           = 3.5;        // bandpass resonance (soft, not harsh)
  var TURN_GAIN        = 0.09;       // screech volume (intentionally low/subtle)
  var TURN_COOLDOWN    = 0.45;       // debounce so direction changes don't spam (s)

  var OFFROAD_SPEED_MIN = 0.08;      // need a little speed to crunch on the grass
  var OFFROAD_FREQ_LO   = 450;       // crunch noise band (Hz) — randomized per hit
  var OFFROAD_FREQ_HI   = 950;       // so it sounds gritty, not tonal
  var OFFROAD_DUR       = 0.08;      // each crunch burst length (s)
  var OFFROAD_Q         = 1.6;       // grungy resonance
  var OFFROAD_GAIN      = 0.15;      // crunch volume

  // ---- Internal state ------------------------------------------------------
  // previous-frame key snapshot for rising-edge detection
  var prev = { up: false, down: false, left: false, right: false };

  // cooldown timestamps (audio-clock seconds) so a held key doesn't spam
  var lastBrakeAt  = -1e9;
  var lastTurnAt   = -1e9;
  var lastCrunchAt = -1e9;

  // -- Tire screech (braking) ------------------------------------------------
  function screech(now) {
    try {
      CK.sound.noise({
        start:   now,
        dur:     BRAKE_DUR,
        type:    'bandpass',
        freq:    BRAKE_FREQ_HI,
        sweepTo: BRAKE_FREQ_LO, // sweep DOWN as the tires lock up
        q:       BRAKE_Q,
        gain:    BRAKE_GAIN,
        attack:  0.005
      });
    } catch (e) {}
    lastBrakeAt = now;
  }

  // -- Tire screech (steering) -----------------------------------------------
  function chirp(now) {
    try {
      // Small, soft tire screech: a short bandpass-noise sweep gently DOWN.
      // Low gain + modest Q keep it subtle so changing direction isn't harsh.
      CK.sound.noise({
        start:   now,
        dur:     TURN_DUR,
        type:    'bandpass',
        freq:    TURN_FREQ_HI,
        sweepTo: TURN_FREQ_LO,   // gentle downward sweep
        q:       TURN_Q,
        gain:    TURN_GAIN,
        attack:  0.006           // slightly soft attack = not a sharp click
      });
    } catch (e) {}
    lastTurnAt = now;
  }

  // -- Off-road crunch (riding on the grass) ---------------------------------
  // A short gravelly noise burst; the trigger logic repeats it so it reads as a
  // continuous crunch. Randomized band keeps each crunch gritty, not tonal.
  function crunch(now) {
    try {
      var f = OFFROAD_FREQ_LO + Math.random() * (OFFROAD_FREQ_HI - OFFROAD_FREQ_LO);
      CK.sound.noise({
        start:   now,
        dur:     OFFROAD_DUR,
        type:    'bandpass',
        freq:    f,
        sweepTo: f * 0.6,   // a touch of downward grit
        q:       OFFROAD_Q,
        gain:    OFFROAD_GAIN,
        attack:  0.002
      });
    } catch (e) {}
    lastCrunchAt = now;
  }

  // -- Edge/trigger handling: brake screech + turn chirp ---------------------
  function updateTriggers(now) {
    var k = CK.keys || prev;
    var p = CK.player || {};
    var maxSpeed = (CK.C && CK.C.maxSpeed) ? CK.C.maxSpeed : 1;
    var pct = maxSpeed > 0 ? (p.speed > 0 ? p.speed : 0) / maxSpeed : 0;
    var racing = (CK.state === STATE.RACING);

    // Brake: fire on the rising edge at speed; retrigger on a cooldown while
    // held so the screech sustains, naturally fading as speed bleeds off.
    if (racing && k.down && pct > BRAKE_SPEED_MIN) {
      var brakeEdge = !prev.down;            // false -> true this frame
      var brakeRepeat = (now - lastBrakeAt) >= BRAKE_COOLDOWN;
      if (brakeEdge || brakeRepeat) screech(now);
    }

    // Turn: fire on the rising edge of either steer key at speed; soft repeat
    // on a cooldown while held. Cooldown is shared so left+right don't double up.
    var steerNow  = !!(k.left || k.right);
    var steerPrev = !!(prev.left || prev.right);
    if (racing && steerNow && pct > TURN_SPEED_MIN) {
      var turnEdge = !steerPrev;             // started steering this frame
      var turnRepeat = (now - lastTurnAt) >= TURN_COOLDOWN;
      if (turnEdge || turnRepeat) chirp(now);
    }

    // Off-road: a repeating gravelly CRUNCH while riding on the grass (|x| > 1),
    // unless airborne (jumping clears it). Crunches faster the faster you go.
    var offRoad = Math.abs(p.x || 0) > 1;
    var airborne = (p.jumpTimer || 0) > 0;
    if (racing && offRoad && !airborne && pct > OFFROAD_SPEED_MIN) {
      var interval = clamp(0.16 - pct * 0.10, 0.05, 0.16);
      if ((now - lastCrunchAt) >= interval) crunch(now);
    }
  }

  // -- Snapshot the current keys for next frame's edge detection -------------
  function snapshotKeys() {
    var k = CK.keys;
    if (!k) return;
    prev.up    = !!k.up;
    prev.down  = !!k.down;
    prev.left  = !!k.left;
    prev.right = !!k.right;
  }

  // -- Main loop: idles harmlessly until audio is ready ----------------------
  function frame() {
    try {
      if (CK.sound && CK.sound.ready && CK.sound.ready()) {
        var now = CK.sound.time();
        updateTriggers(now);
      }
      // Always track key edges, even when audio isn't ready, so the first
      // post-unlock frame doesn't fire a spurious screech/chirp from a held key.
      snapshotKeys();
    } catch (e) {
      // Never let a bad frame kill the loop (or the game).
    }
    try { window.requestAnimationFrame(frame); } catch (e) {}
  }

  // ---- One-shot impact SFX (fired by gameplay, e.g. items.js) --------------

  // SMASH! - punchy collision CRUNCH: broadband noise burst + low impact thud,
  // with a tiny high noise tick on top for bite.
  CK.carSfx.smash = function () {
    try {
      if (!CK.sound || !CK.sound.ready || !CK.sound.ready()) return;
      var bus = CK.sound.sfxBus();
      var now = CK.sound.time();

      // Broadband crunch: lowpass noise burst with a fast decay.
      CK.sound.noise({
        start:   now,
        dur:     0.18,
        type:    'lowpass',
        freq:    2200,
        sweepTo: 400,    // dull out as it decays
        q:       0.7,
        gain:    0.30,
        attack:  0.001,  // instant snap = impact
        bus:     bus
      });

      // Low impact "thud": square gliding down for body/weight.
      CK.sound.tone({
        freq:    140,
        glideTo: 50,
        start:   now,
        dur:     0.16,
        type:    'square',
        gain:    0.26,
        attack:  0.001,
        bus:     bus
      });

      // Tiny high noise tick for extra bite right at the hit.
      CK.sound.noise({
        start:   now,
        dur:     0.05,
        type:    'highpass',
        freq:    4000,
        q:       0.7,
        gain:    0.12,
        attack:  0.001,
        bus:     bus
      });
    } catch (e) {}
  };

  // squish - wet SPLAT: soft-attack lowpass noise sweeping DOWN, plus a quick
  // downward "bloop" tone underneath. Reads as a muddy squish.
  CK.carSfx.squish = function () {
    try {
      if (!CK.sound || !CK.sound.ready || !CK.sound.ready()) return;
      var bus = CK.sound.sfxBus();
      var now = CK.sound.time();

      // Wet noise body: lowpass noise sweeping down from bright to dull.
      CK.sound.noise({
        start:   now,
        dur:     0.22,
        type:    'lowpass',
        freq:    800,
        sweepTo: 120,    // sweep DOWN = squelchy/wet
        q:       0.8,
        gain:    0.22,
        attack:  0.03,   // soft attack = squishy, not a sharp hit
        bus:     bus
      });

      // Downward "bloop" tone for the gloopy character.
      CK.sound.tone({
        freq:    300,
        glideTo: 90,
        start:   now,
        dur:     0.20,
        type:    'triangle',
        gain:    0.14,
        attack:  0.01,
        bus:     bus
      });
    } catch (e) {}
  };

  // ---- One-shot pickup SFX (fired by gameplay, e.g. items.js) --------------

  // boost - satisfying ACCELERATION / power-up for the speed-up box: a sawtooth
  // tone gliding UP in pitch, layered with a short upward noise "whoosh".
  CK.carSfx.boost = function () {
    try {
      if (!CK.sound || !CK.sound.ready || !CK.sound.ready()) return;
      var bus = CK.sound.sfxBus();
      var now = CK.sound.time();

      // Rising tone = "speeding up" energy.
      CK.sound.tone({
        freq:    220,
        glideTo: 880,
        start:   now,
        dur:     0.30,
        type:    'sawtooth',
        gain:    0.20,
        attack:  0.006,
        bus:     bus
      });

      // Upward filtered-noise whoosh for extra "rush".
      CK.sound.noise({
        start:   now,
        dur:     0.28,
        type:    'bandpass',
        freq:    400,
        sweepTo: 2600,   // sweep UP = whoosh of acceleration
        q:       1.2,
        gain:    0.10,
        attack:  0.01,
        bus:     bus
      });
    } catch (e) {}
  };

  // pickupEgg - short, bright, pleasant "got ammo" blip: a quick two-note
  // ascending arpeggio (square). Friendly, modest, ~0.15s total.
  CK.carSfx.pickupEgg = function () {
    try {
      if (!CK.sound || !CK.sound.ready || !CK.sound.ready()) return;
      var bus = CK.sound.sfxBus();
      var now = CK.sound.time();

      // Two-note rise: G5 -> C6 (cheerful little pickup).
      CK.sound.tone({
        freq:   784,           // G5
        start:  now,
        dur:    0.07,
        type:   'square',
        gain:   0.16,
        attack: 0.004,
        bus:    bus
      });
      CK.sound.tone({
        freq:   1047,          // C6
        start:  now + 0.07,
        dur:    0.08,
        type:   'square',
        gain:   0.16,
        attack: 0.004,
        bus:    bus
      });
    } catch (e) {}
  };

  // pickupInvincible - distinct shimmering "POWER!" cue, clearly different from
  // the egg blip: a quick 3-note ascending sparkle (triangle), brighter/higher.
  CK.carSfx.pickupInvincible = function () {
    try {
      if (!CK.sound || !CK.sound.ready || !CK.sound.ready()) return;
      var bus = CK.sound.sfxBus();
      var now = CK.sound.time();

      // Three-note bright sparkle: C6 -> E6 -> G6 (major triad rising = magic).
      var notes = [1047, 1319, 1568]; // C6, E6, G6
      for (var i = 0; i < notes.length; i++) {
        CK.sound.tone({
          freq:   notes[i],
          start:  now + i * 0.06,
          dur:    0.10,
          type:   'triangle',
          gain:   0.15,
          attack: 0.004,
          bus:    bus
        });
      }
    } catch (e) {}
  };

  // Start the loop now; it self-gates on CK.sound.ready().
  try {
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(frame);
    }
  } catch (e) {}
})();
