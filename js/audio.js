// ===========================================================================
// Chicken Cart - audio (Web Audio API, synthesized; NO external asset files)
//
// Self-contained: shares the global CK object (plain script, no modules, runs
// from file://). Exposes CK.sound with a lazily-created AudioContext and a
// guarded CK.sound.evilLaugh() that never throws.
// ===========================================================================

CK.sound = CK.sound || {};

(function () {
  'use strict';

  var ctx = null;        // shared AudioContext, created on first use
  var unlocked = false;  // becomes true once a user gesture has resumed it

  // -- Lazily create (and best-effort resume) the shared AudioContext --------
  function getCtx() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;          // no Web Audio support -> no-op
        ctx = new AC();
      }
      // Browsers start contexts "suspended" until a gesture; nudge it awake.
      if (ctx.state === 'suspended' && ctx.resume) {
        // resume() returns a promise that may reject; swallow it.
        try { ctx.resume().catch(function () {}); } catch (e) {}
      }
      return ctx;
    } catch (e) {
      return null;
    }
  }
  // Exposed for other scripts that may want the shared context.
  CK.sound.getContext = getCtx;

  // -- One-time gesture unlock: create/resume on first interaction -----------
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    getCtx(); // create + resume now that we're inside a user gesture
    try {
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    } catch (e) {}
  }
  try {
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  } catch (e) {
    // Fallback for very old browsers that dislike the options object.
    try {
      window.addEventListener('keydown', unlock);
      window.addEventListener('pointerdown', unlock);
      window.addEventListener('touchstart', unlock);
    } catch (e2) {}
  }

  // -- Evil chicken cackle ---------------------------------------------------
  // 5 quick "heh/ha" bursts. Overall pitch trends DOWNWARD (villainous). Each
  // burst: a sharp waveform (square/saw) with a fast in-burst pitch drop plus a
  // little vibrato wobble (squawky chicken character), shaped by a snappy
  // attack/decay gain envelope so every "ha" is punchy and distinct.
  CK.sound.evilLaugh = function () {
    try {
      var ac = getCtx();
      // If we couldn't get a context, or it's not actually running yet (called
      // before any user gesture), bail gracefully rather than throw.
      if (!ac || ac.state !== 'running') return;

      var t0 = ac.currentTime + 0.02; // tiny lead-in so scheduling is clean

      // Moderate master so we never blast the player.
      var master = ac.createGain();
      master.gain.value = 0.22;
      master.connect(ac.destination);

      // Start of each "ha", and its peak pitch — trending downward overall.
      var bursts = [
        { at: 0.00, freq: 520, dur: 0.16 }, // heh
        { at: 0.20, freq: 470, dur: 0.15 }, // heh
        { at: 0.40, freq: 410, dur: 0.16 }, // ha
        { at: 0.62, freq: 350, dur: 0.18 }, // haa
        { at: 0.88, freq: 290, dur: 0.34 }  // haaaa (longer, sinister tail)
      ];

      for (var i = 0; i < bursts.length; i++) {
        scheduleBurst(ac, master, t0 + bursts[i].at, bursts[i].freq, bursts[i].dur,
                      i === bursts.length - 1);
      }
    } catch (e) {
      // Audio must never break gameplay.
    }
  };

  // One "ha": sharp osc + fast pitch drop + vibrato, snappy gain envelope.
  function scheduleBurst(ac, master, start, freq, dur, isLast) {
    try {
      var end = start + dur;

      var osc = ac.createOscillator();
      // Sawtooth = bright/buzzy for the comedic-evil chicken squawk.
      osc.type = isLast ? 'square' : 'sawtooth';

      // Fast downward pitch drop within the burst (the "ha" falling tone).
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), end);

      // Vibrato/wobble -> squawky character (LFO modulating the osc frequency).
      var lfo = ac.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 28; // fast wobble
      var lfoGain = ac.createGain();
      lfoGain.gain.value = freq * 0.06; // wobble depth scales with pitch
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Snappy gain envelope: quick attack, short decay -> punchy, distinct.
      var g = ac.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(1.0, start + 0.012); // fast attack
      g.gain.exponentialRampToValueAtTime(0.0001, end);        // short decay

      osc.connect(g);
      g.connect(master);

      osc.start(start);
      lfo.start(start);
      osc.stop(end + 0.02);
      lfo.stop(end + 0.02);
    } catch (e) {
      // Ignore a single failed burst.
    }
  }

  // ==========================================================================
  // Shared audio core — primitives that music.js (CK.music) and sfx.js
  // (CK.carSfx) build on. Everything is safe/guarded and routes through one of
  // two buses so a single master controls music vs. effects volume.
  // ==========================================================================

  var musicGain = null, sfxGain = null;

  function bus(which) {
    var ac = getCtx();
    if (!ac) return null;
    if (which === 'music') {
      if (!musicGain) { musicGain = ac.createGain(); musicGain.gain.value = 0.30; musicGain.connect(ac.destination); }
      return musicGain;
    }
    if (!sfxGain) { sfxGain = ac.createGain(); sfxGain.gain.value = 0.40; sfxGain.connect(ac.destination); }
    return sfxGain;
  }

  CK.sound.musicBus = function () { return bus('music'); };
  CK.sound.sfxBus   = function () { return bus('sfx'); };

  // currentTime of the shared context (0 if unavailable) and a readiness check.
  CK.sound.time  = function () { var ac = getCtx(); return ac ? ac.currentTime : 0; };
  CK.sound.ready = function () { var ac = getCtx(); return !!(ac && ac.state === 'running'); };

  // Schedule a single chiptune note/blip. opts:
  //   freq, start (default now), dur (s), type ('square'|'sawtooth'|'triangle'|'sine'),
  //   gain (peak), attack (s), bus (GainNode; default sfx), glideTo (freq to ramp to),
  //   vibratoHz, vibratoDepth. Returns {osc,gain} or null. Never throws.
  CK.sound.tone = function (o) {
    try {
      var ac = getCtx();
      if (!ac || ac.state !== 'running') return null;
      o = o || {};
      var start = o.start != null ? o.start : ac.currentTime;
      var dur   = o.dur   != null ? o.dur   : 0.15;
      var end   = start + dur;

      var osc = ac.createOscillator();
      osc.type = o.type || 'square';
      var f = Math.max(20, o.freq || 440);
      osc.frequency.setValueAtTime(f, start);
      if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glideTo), end);

      var g = ac.createGain();
      var peak = o.gain != null ? o.gain : 0.2;
      var atk = o.attack != null ? o.attack : 0.008;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + atk);
      g.gain.exponentialRampToValueAtTime(0.0001, end);

      osc.connect(g);
      g.connect(o.bus || bus('sfx'));

      if (o.vibratoHz) {
        var lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = o.vibratoHz;
        var lg = ac.createGain(); lg.gain.value = o.vibratoDepth || (f * 0.03);
        lfo.connect(lg); lg.connect(osc.frequency);
        lfo.start(start); lfo.stop(end + 0.03);
      }
      osc.start(start); osc.stop(end + 0.03);
      return { osc: osc, gain: g };
    } catch (e) { return null; }
  };

  // Schedule a filtered white-noise burst (percussion / skid / screech). opts:
  //   start, dur, gain, attack, type (filter: 'highpass'|'lowpass'|'bandpass'),
  //   freq, q, sweepTo (filter freq ramp target), bus. Returns {src} or null.
  CK.sound.noise = function (o) {
    try {
      var ac = getCtx();
      if (!ac || ac.state !== 'running') return null;
      o = o || {};
      var start = o.start != null ? o.start : ac.currentTime;
      var dur   = o.dur   != null ? o.dur   : 0.2;
      var end   = start + dur;

      var n = Math.max(1, Math.floor(ac.sampleRate * dur));
      var buf = ac.createBuffer(1, n, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource(); src.buffer = buf;

      var filt = ac.createBiquadFilter(); filt.type = o.type || 'highpass';
      filt.frequency.setValueAtTime(o.freq || 1000, start);
      if (o.sweepTo) filt.frequency.exponentialRampToValueAtTime(Math.max(40, o.sweepTo), end);
      if (o.q != null) filt.Q.value = o.q;

      var g = ac.createGain();
      var peak = o.gain != null ? o.gain : 0.2;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + (o.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, end);

      src.connect(filt); filt.connect(g); g.connect(o.bus || bus('sfx'));
      src.start(start); src.stop(end + 0.03);
      return { src: src };
    } catch (e) { return null; }
  };
})();
