// ===========================================================================
// Chicken Cart - music (CK.music)  |  chiptune engine, synthesized only
//
// Plain script (no modules, runs from file://). Shares the global CK object and
// builds ENTIRELY on the read-only audio core in audio.js:
//   CK.sound.ready()    -> bool (ctx exists AND running; false before gesture)
//   CK.sound.time()     -> audio-clock seconds (0 if unavailable)
//   CK.sound.musicBus() -> GainNode for MUSIC (must be passed to every tone)
//   CK.sound.tone(opts) -> one note  | CK.sound.noise(opts) -> noise burst
//
// Four looping 8-bit songs, swapped by a state watcher:
//   intro -> 'intro'  | racing -> 'race'  | countdown -> silence
//   finished -> 'win' (outcome==='win') / 'lose' (outcome==='loseToDiablo')
//
// A standard Web Audio look-ahead scheduler keeps the loop SEAMLESS: notes are
// scheduled slightly ahead of the audio clock and the step index wraps to 0
// without ever stopping. Everything is guarded; nothing here throws.
// ===========================================================================

CK.music = CK.music || {};

(function () {
  'use strict';

  // -- Note name -> frequency (equal temperament, A4 = 440Hz) -----------------
  // Names like 'C4','A#3','F5'. Returns 0 for a rest (null / 'R' / '-').
  var SEMITONE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
                   'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function nf(name) {
    if (!name || name === 'R' || name === '-') return 0;
    var m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) return 0;
    var semis = SEMITONE[m[1]];
    if (semis == null) return 0;
    var octave = parseInt(m[2], 10);
    // MIDI note number, then frequency relative to A4 (MIDI 69).
    var midi = semis + (octave + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Convenience: convert an array of names to frequencies once (build time).
  function freqs(names) {
    var out = [];
    for (var i = 0; i < names.length; i++) out.push(nf(names[i]));
    return out;
  }

  // ==========================================================================
  // SONGS
  //
  // A song = { stepDur (seconds per step), lead[], bass[], drums[] }.
  // lead/bass are parallel arrays of frequencies (0 = rest), one per step; the
  // three voices share the same length so the loop wraps cleanly. drums[] holds
  // a code per step: '' none, 'k' kick, 's' snare, 'h' hat.
  //
  // length(seconds) = steps * stepDur. We pick step counts so race ~= 20s.
  // ==========================================================================

  // ---- INTRO: "Pop Goes the Weasel" (traditional folk, public domain) --------
  // The familiar playful melody in C major, ending on the classic "...and POP!
  // goes the weasel" cadence. step = one eighth note @ 0.20s -> 150 BPM dotted
  // feel; 32 steps * 0.20s = 6.4000s seamless loop (covers the ~10s title
  // screen by looping). Bouncy octave bass + light groove to match the style.
  // Melody (eighths): | C C D D E G E . | C C D D E . E . |  (verse)
  //                   | C F A G F D B . | C C . . C . . . |  (...POP! goes...)
  var INTRO = {
    stepDur: 0.20,
    lead: freqs([
      // "All around the mulberry bush, the monkey chased the weasel"
      'C5', 'C5', 'D5', 'D5', 'E5', 'G5', 'E5', 'R',
      'C5', 'C5', 'D5', 'D5', 'E5', 'R',  'E5', 'R',
      // "A penny for a spool of thread, a penny for a needle"
      'C5', 'F5', 'A5', 'G5', 'F5', 'D5', 'B4', 'R',
      // "That's the way the money goes, ...POP! goes the weasel!"
      'C5', 'C5', 'R',  'A5', 'C5', 'R',  'R',  'R'
    ]),
    bass: freqs([
      'C3', 'G2', 'C3', 'G2', 'C3', 'G2', 'C3', 'G2',
      'C3', 'G2', 'C3', 'G2', 'C3', 'G2', 'C3', 'G2',
      'F2', 'C3', 'F2', 'G2', 'F2', 'G2', 'G2', 'G2',
      'C3', 'G2', 'C3', 'F2', 'C3', 'G2', 'C3', 'G2'
    ]),
    drums: ['k', 'h', 's', 'h', 'k', 'h', 's', 'h',
            'k', 'h', 's', 'h', 'k', 'h', 's', 'h',
            'k', 'h', 's', 'h', 'k', 'h', 's', 'h',
            'k', 'h', 's', 'k', 'k', 'h', 's', 'h']
  };

  // ---- RACE: Beethoven Symphony No. 5 in C minor, Op. 67, 1st mvt -------------
  //          (Allegro con brio) -- composed 1808, long PUBLIC DOMAIN.
  // The most famous opening in music: the four-note "short-short-short-LONG"
  // Fate motif -- G-G-G-Eb, then a step lower F-F-F-D (in C minor) -- here as a
  // driving, urgent race anthem. The arrangement opens with the bare motif, then
  // develops it the way the first movement does: the motif is repeated, sequenced
  // up and down the C-minor scale, climbs in a rising fugato-style chain, and is
  // hammered home before the loop wraps straight back into the opening G-G-G-Eb.
  // Square lead carries the motif; an octave-bouncing triangle bass holds the
  // C-minor harmony (Cm tonic, G/G7 dominant, Ab/Fm/Eb supports); a light drum
  // groove drives without burying the melody. Key: C minor. step = one sixteenth
  // @ 0.15625s -> 96 BPM quarter note. 24 bars * 16 = 384 steps;
  // 384 * 0.15625 = 60.0000s. The step index wraps to 0 with no gap -> seamless
  // 60.0000s loop. lead/bass/drums are all exactly 384 long.
  var RACE = (function () {
    var stepDur = 0.15625; // 0.625s quarter note -> 96 BPM; 1 step = one 16th
    var L = [], B = [], D = [];

    // --- Lead: faithful transcription of the Fate motif and its development,
    // 16 steps per bar. The three "short" notes are eighth notes (note + 'R' for
    // a crisp staccato attack); the "LONG" note is held over several steps by
    // repeating its name. 'R' = rest. Each motif statement = G G G Eb----- style:
    // three quick stabs on the upbeat, then the long fall a step or third below.

    // Bars 1-2: the bare iconic motif, twice.
    // Bar 1: rest-G G G | Eb (held) -- "short short short LONG"
    var leadA1 = ['R',  'R',  'G4', 'R', 'G4', 'R', 'G4', 'R',
                  'Eb4','Eb4','Eb4','Eb4','Eb4','Eb4','R',  'R'];
    // Bar 2: rest-F F F | D (held) -- the answering statement a step lower
    var leadA2 = ['R',  'R',  'F4', 'R', 'F4', 'R', 'F4', 'R',
                  'D4', 'D4', 'D4', 'D4', 'D4', 'D4', 'R',  'R'];

    // Bars 3-4: the motif begins to develop -- restated and pushed upward, the
    // long note now climbing (the famous repetition that builds tension).
    // Bar 3: G G G | Eb (held), restated tighter
    var leadA3 = ['G4', 'R', 'G4', 'R', 'G4', 'R', 'Eb4','R',
                  'F4', 'R', 'F4', 'R', 'F4', 'R', 'D4', 'R'];
    // Bar 4: the motif climbs -- Eb-D-C runs up into a held G (rising answer)
    var leadA4 = ['G4', 'R', 'G4', 'R', 'G4', 'R', 'Ab4','R',
                  'G4', 'G4', 'G4', 'G4', 'F4', 'F4', 'R',  'R'];

    // Bars 5-8: rising sequence of the motif up the C-minor scale -- each
    // statement starts a step higher, building the way the development climbs.
    // Bar 5: Ab Ab Ab | F (held) -- sequence up
    var leadB1 = ['R',  'R',  'Ab4','R', 'Ab4','R', 'Ab4','R',
                  'F4', 'F4', 'F4', 'F4', 'F4', 'F4', 'R',  'R'];
    // Bar 6: Bb Bb Bb | G (held)
    var leadB2 = ['R',  'R',  'Bb4','R', 'Bb4','R', 'Bb4','R',
                  'G4', 'G4', 'G4', 'G4', 'G4', 'G4', 'R',  'R'];
    // Bar 7: C C C | Ab (held) -- motif now an octave up from the opening
    var leadB3 = ['R',  'R',  'C5', 'R', 'C5', 'R', 'C5', 'R',
                  'Ab4','Ab4','Ab4','Ab4','Ab4','Ab4','R',  'R'];
    // Bar 8: D D D | Bb (held) -- top of the climb, leaning on the dominant
    var leadB4 = ['R',  'R',  'D5', 'R', 'D5', 'R', 'D5', 'R',
                  'Bb4','Bb4','Bb4','Bb4','Bb4','Bb4','R',  'R'];

    // Bars 9-12: high restatement of the head motif up the octave (mirrors the
    // opening so the form stays recognizable mid-loop), then a turn back down.
    // Bar 9: rest-G G G | Eb (held), octave up
    var leadC1 = ['R',  'R',  'G5', 'R', 'G5', 'R', 'G5', 'R',
                  'Eb5','Eb5','Eb5','Eb5','Eb5','Eb5','R',  'R'];
    // Bar 10: rest-F F F | D (held), octave up
    var leadC2 = ['R',  'R',  'F5', 'R', 'F5', 'R', 'F5', 'R',
                  'D5', 'D5', 'D5', 'D5', 'D5', 'D5', 'R',  'R'];
    // Bar 11: descending chain  Eb D C Bb | Ab G F Eb (16th run from the motif)
    var leadC3 = ['Eb5','D5', 'C5', 'Bb4','Ab4','G4', 'F4', 'Eb4',
                  'D4', 'R',  'D4', 'R',  'G4', 'R',  'G4', 'R'];
    // Bar 12: C C C | (held G->) -> motif lands, pivoting to the dominant G
    var leadC4 = ['C5', 'R', 'C5', 'R', 'C5', 'R', 'C5', 'R',
                  'G4', 'G4', 'G4', 'G4', 'G4', 'G4', 'R',  'R'];

    // Bars 13-16: the driving development -- the motif tossed between octaves and
    // hammered as repeated stabs, the famous insistent passage of the Allegro.
    // Bar 13: G G G G | G G G G (relentless dominant pedal stabs)
    var leadD1 = ['G5', 'R', 'G5', 'R', 'G5', 'R', 'G5', 'R',
                  'G4', 'R', 'G4', 'R', 'G4', 'R', 'G4', 'R'];
    // Bar 14: Ab Ab Ab | G (held) -- the leaning Neapolitan-ish push down to G
    var leadD2 = ['Ab5','R', 'Ab5','R', 'Ab5','R', 'G5', 'R',
                  'F5', 'R', 'F5', 'R', 'Eb5','R', 'D5', 'R'];
    // Bar 15: C C C | Eb (held) -- the motif again, restated up high
    var leadD3 = ['R',  'R',  'C5', 'R', 'C5', 'R', 'C5', 'R',
                  'Eb5','Eb5','Eb5','Eb5','D5', 'D5', 'R',  'R'];
    // Bar 16: G G G | G (held) -- big dominant arrival (half cadence)
    var leadD4 = ['R',  'R',  'G5', 'R', 'G5', 'R', 'G5', 'R',
                  'G5', 'G5', 'G5', 'G5', 'G5', 'G5', 'R',  'R'];

    // Bars 17-20: recapitulation feel -- the motif returns in the home register,
    // sequenced once more then driven toward the cadence.
    var leadE1 = leadA1;            // bare motif: G G G | Eb
    var leadE2 = leadA2;            // answer:     F F F | D
    // Bar 19: rising run rebuilding tension  Eb F G Ab | Bb C D Eb
    var leadE3 = ['Eb4','F4','G4', 'Ab4','Bb4','C5', 'D5', 'Eb5',
                  'D5', 'R', 'C5', 'R',  'Bb4','R',  'R',  'R'];
    // Bar 20: C C C | (long G) -> the motif lands and pivots to the dominant
    var leadE4 = ['C5', 'R', 'C5', 'R', 'C5', 'R', 'C5', 'R',
                  'G4', 'G4', 'G4', 'G4', 'G4', 'G4', 'R',  'R'];

    // Bars 21-24: final hammering of the Fate motif and a strong perfect cadence
    // (G7 -> Cm) that rounds the loop straight back into bar 1's opening motif.
    // Bar 21: G G G | Eb (held) -- the motif, fortissimo restatement
    var leadF1 = leadA1;
    // Bar 22: F F F | D (held)
    var leadF2 = leadA2;
    // Bar 23: descending drive  Eb D C Bb | Ab G F Eb  into the cadence
    var leadF3 = ['Eb5','D5', 'C5', 'Bb4','Ab4','G4', 'F4', 'Eb4',
                  'D4', 'R',  'F4', 'R',  'D4', 'R',  'R',  'R'];
    // Bar 24 final: G G G | C (held) -> dominant->tonic close, then wrap to bar 1
    var leadF4 = ['G4', 'R', 'G4', 'R', 'G4', 'R', 'G4', 'R',
                  'C4', 'C4', 'C4', 'C4', 'C4', 'C4', 'R',  'R'];

    // Octave-bouncing bass: root on the downbeat eighth, octave-up on the next.
    function bassBar(lo, hi) {
      var r = [];
      for (var i = 0; i < 16; i++) {
        if (i % 4 === 0) r.push(lo);
        else if (i % 4 === 2) r.push(hi);
        else r.push('-');
      }
      return r;
    }
    // Four-on-the-floor kick, backbeat snare on 2 & 4, hats on the offbeats.
    function drumBar() {
      var r = [];
      for (var i = 0; i < 16; i++) {
        if (i % 4 === 0) r.push('k');
        else if (i % 2 === 1) r.push('h');
        else r.push('');
      }
      r[4] = 's'; r[12] = 's';
      return r;
    }

    // 24-bar form. Harmony follows the theme in C minor: C = tonic (Cm), G = the
    // dominant (G/G7), with Ab / Eb / Bb / F supporting the rising development
    // sequence, all resolving G -> C at the end so the loop wraps cleanly.
    var leads = [leadA1, leadA2, leadA3, leadA4,
                 leadB1, leadB2, leadB3, leadB4,
                 leadC1, leadC2, leadC3, leadC4,
                 leadD1, leadD2, leadD3, leadD4,
                 leadE1, leadE2, leadE3, leadE4,
                 leadF1, leadF2, leadF3, leadF4];
    var bassLo = ['C2', 'C2', 'C2', 'C2', 'F2', 'G1', 'C2', 'G1',
                  'C2', 'C2', 'G1', 'C2', 'G1', 'G1', 'C2', 'G1',
                  'C2', 'C2', 'C2', 'G1', 'C2', 'C2', 'C2', 'G1'];
    var bassHi = ['C3', 'C3', 'C3', 'G2', 'F2', 'G2', 'C3', 'G2',
                  'C3', 'C3', 'G2', 'C3', 'G2', 'G2', 'C3', 'G2',
                  'C3', 'C3', 'G2', 'G2', 'C3', 'C3', 'G2', 'G2'];

    for (var bar = 0; bar < 24; bar++) {
      L = L.concat(leads[bar]);
      B = B.concat(bassBar(bassLo[bar], bassHi[bar]));
      D = D.concat(drumBar());
    }

    return { stepDur: stepDur, lead: freqs(L), bass: freqs(B), drums: D };
  })();

  // ---- WIN: "The Star-Spangled Banner" (J.S. Smith ~1773 / Key 1814) ---------
  // The U.S. national anthem -- tune ("To Anacreon in Heaven") and Key's lyrics
  // are both long PUBLIC DOMAIN, so this faithful instrumental chiptune
  // transcription of the melody is fine (no lyrics; it's just the tune). In C
  // major, the recognizable first strain: "O say can you see, by the dawn's
  // early light, / What so proudly we hailed at the twilight's last gleaming."
  // The waltz (3/4) is laid on a 16th-note grid (1 step = one 16th, 12 steps =
  // one 3/4 bar) so the dotted "O--say" / "what--so" figures land exactly.
  // step = 0.14s 16th -> dotted-quarter (one bar pulse) ~= 71 BPM, a stately
  // anthem tempo. 84 steps * 0.14s = 11.7600s -> seamless ~11.8s loop that
  // wraps cleanly from the cadence back to the "O say" pickup. Square lead
  // carries the tune; a root-note triangle bass + light oom-pah-pah waltz
  // groove (kick on beat 1, hats on beats 2 & 3) support without overpowering.
  var WIN = (function () {
    var stepDur = 0.14; // one 16th note; 12 steps = one 3/4 bar (one bar pulse)

    // -- Melody as [note, sixteenth-count] pairs. A held note repeats its freq
    //    across its steps (each step retriggers a 0.9-step blip -> reads as a
    //    sustained anthem note). 'R' = rest. Durations sum to 84 (= 7 bars * 12).
    var mel = [
      // "O  say  can  you see   by   the dawn's ear-  ly  light  [breath]"
      ['G4', 3], ['E4', 1], ['C4', 4], ['E4', 2], ['G4', 2],   // bar 1 (12)
      ['C5', 6], ['B4', 2], ['A4', 2], ['G4', 2],              // bar 2.. C5 spans the downbeat
      ['F4', 4], ['E4', 4], ['R', 4],                          // "-ly light" + breath
      // "What so   proud-ly  we  hailed at the twi-light's last gleam-ing"
      ['G4', 3], ['G4', 1], ['E4', 4], ['C4', 4],              // "what so proud-ly"
      ['G4', 3], ['E4', 1], ['C4', 4], ['E4', 2], ['G4', 2],   // "we hailed at-the twi-light's"
      ['C5', 6], ['B4', 2], ['A4', 2], ['G4', 2],              // "last gleam-ing.."
      ['F4', 4], ['E4', 4], ['R', 4]                           // resolve + breath -> loop
    ];

    // Expand the melody to one frequency-name per 16th step.
    var L = [];
    for (var m = 0; m < mel.length; m++) {
      for (var r = 0; r < mel[m][1]; r++) L.push(mel[m][0]);
    }

    // -- Bass: one root per 3/4 bar, sounded on the downbeat of each bar and
    //    re-struck on beat 3 (oom .. pah) for a gentle waltz pulse. Roots follow
    //    the anthem's harmony: I  V  IV/V  I  | I  V  IV/V  ... back to I.
    // 7 bars (12 steps each = 84). beats fall at step 0,4,8 within each bar.
    var roots = ['C2', 'G2', 'C2', 'C2', 'C2', 'G2', 'C2'];
    var B = [];
    for (var bar = 0; bar < 7; bar++) {
      var root = roots[bar];
      for (var s = 0; s < 12; s++) {
        if (s === 0 || s === 8) B.push(root); // beat 1 (oom) + beat 3 (pah)
        else B.push('-');
      }
    }

    // -- Drums: classic 3/4 oom-pah-pah. Kick on beat 1, hats on beats 2 & 3,
    //    a soft snare backbeat on beat 2 -- light enough not to bury the tune.
    var D = [];
    for (var bar2 = 0; bar2 < 7; bar2++) {
      for (var s2 = 0; s2 < 12; s2++) {
        if (s2 === 0) D.push('k');        // beat 1
        else if (s2 === 4) D.push('s');   // beat 2 backbeat
        else if (s2 === 8) D.push('h');   // beat 3
        else D.push('');
      }
    }

    return { stepDur: stepDur, lead: freqs(L), bass: freqs(B), drums: D };
  })();

  // ---- LOSE: ominous D-minor theme, ~5.4s loop (18 steps @ 0.3s) ------------
  // Brooding, evil, slow. Minor + tritone-ish tension as Diablo steals the girl.
  var LOSE = {
    stepDur: 0.30,
    lead: freqs([
      'D4', 'R', 'F4', 'R', 'E4', 'R', 'D4', 'R',
      'A4', 'R', 'G#4', 'R', 'A4', 'R', 'F4', 'D4', 'R', 'R'
    ]),
    bass: freqs([
      'D2', 'D2', 'D2', 'D2', 'A1', 'A1', 'A1', 'A1',
      'Bb1', 'Bb1', 'A1', 'A1', 'D2', 'D2', 'D2', 'D2', 'A1', 'A1'
    ]),
    drums: ['k', '', '', '', 's', '', '', '',
            'k', '', '', '', 's', '', '', 'k', '', 's']
  };

  var SONGS = { intro: INTRO, race: RACE, win: WIN, lose: LOSE };

  // ==========================================================================
  // VOICE GAINS (kept modest so three voices + drums never clip)
  // ==========================================================================
  var LEAD_GAIN = 0.18;
  var BASS_GAIN = 0.16;

  // ==========================================================================
  // LOOK-AHEAD SCHEDULER
  // ==========================================================================
  var SCHEDULE_AHEAD = 0.12; // seconds: how far ahead of the clock we schedule
  var TICK_MS = 25;          // how often the scheduler runs

  var current = null;        // name of the song currently playing (or null)
  var song = null;           // the active song object
  var step = 0;              // next step index to schedule
  var nextNoteTime = 0;      // absolute audio-clock time of the next step
  var schedTimer = null;     // setInterval handle for the scheduler

  // Schedule every voice for one step at time `when`.
  function scheduleStep(s, idx, when) {
    try {
      var bus = CK.sound.musicBus();
      if (!bus) return; // no context yet -> nothing to route to
      var sd = s.stepDur;

      // LEAD (bright square pulse). Slightly shorter than the step for a
      // chiptune "blip" with a tiny gap between notes.
      var lf = s.lead[idx];
      if (lf > 0) {
        CK.sound.tone({
          freq: lf, start: when, dur: sd * 0.9, type: 'square',
          gain: LEAD_GAIN, attack: 0.006, bus: bus
        });
      }

      // BASS (rounder triangle, full step so the low end stays continuous).
      var bf = s.bass[idx];
      if (bf > 0) {
        CK.sound.tone({
          freq: bf, start: when, dur: sd * 0.95, type: 'triangle',
          gain: BASS_GAIN, attack: 0.006, bus: bus
        });
      }

      // DRUMS (noise bursts on the music bus).
      var d = s.drums ? s.drums[idx] : '';
      if (d === 'k') {
        // Kick: short low-passed thump.
        CK.sound.noise({
          start: when, dur: 0.10, gain: 0.20, attack: 0.002,
          type: 'lowpass', freq: 220, sweepTo: 60, bus: bus
        });
      } else if (d === 's') {
        // Snare: bright band-passed crack.
        CK.sound.noise({
          start: when, dur: 0.12, gain: 0.16, attack: 0.001,
          type: 'bandpass', freq: 1800, q: 0.8, bus: bus
        });
      } else if (d === 'h') {
        // Hat: very short high-passed tick.
        CK.sound.noise({
          start: when, dur: 0.04, gain: 0.08, attack: 0.001,
          type: 'highpass', freq: 7000, bus: bus
        });
      }
    } catch (e) {
      // A single failed step must never break the loop.
    }
  }

  // The scheduler tick: schedule any steps whose time falls inside the window.
  function tick() {
    try {
      if (!song) return;                 // nothing playing -> idle
      if (!CK.sound.ready()) return;     // wait for the gesture unlock

      var now = CK.sound.time();
      if (!now) return;

      // If we just (re)started, anchor the first note a hair ahead of now.
      if (nextNoteTime < now) {
        nextNoteTime = now + 0.06;
      }

      // Schedule everything due within the look-ahead window. The step index
      // WRAPS to 0 without stopping -> seamless, gapless loop.
      var guard = 0;
      while (nextNoteTime < now + SCHEDULE_AHEAD && guard < 256) {
        scheduleStep(song, step, nextNoteTime);
        nextNoteTime += song.stepDur;
        step = (step + 1) % song.lead.length;
        guard++;
      }
    } catch (e) {
      // Never throw out of the timer.
    }
  }

  function ensureTimer() {
    try {
      if (schedTimer == null) schedTimer = setInterval(tick, TICK_MS);
    } catch (e) {}
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  // Start a song from its beginning. No-op if already playing that song, or if
  // the name is unknown. Safe to call before audio is ready (it'll begin once
  // the scheduler tick sees CK.sound.ready()).
  CK.music.play = function (name) {
    try {
      if (!name || !SONGS[name]) return;
      if (current === name && song) return; // already playing this track
      current = name;
      song = SONGS[name];
      step = 0;
      nextNoteTime = 0; // re-anchored to "now" on the next tick
      ensureTimer();
    } catch (e) {}
  };

  // Stop scheduling NEW notes. Already-scheduled notes ring out naturally
  // (their tails are short), so this is gapless on its own.
  CK.music.stop = function () {
    try {
      current = null;
      song = null;
      step = 0;
      nextNoteTime = 0;
    } catch (e) {}
  };

  // Expose the note helper (handy for any future tuning / debugging).
  CK.music.noteFreq = nf;

  // ==========================================================================
  // STATE WATCHER  -> maps CK.state / CK.outcome to the desired track
  // ==========================================================================

  function desiredTrack() {
    try {
      var st = CK.state;
      if (st === STATE.INTRO) return 'intro';
      if (st === STATE.RACING) return 'race';
      if (st === STATE.COUNTDOWN) return null; // brief -> silence
      if (st === STATE.FINISHED) {
        if (CK.outcome === 'win') return 'win';
        if (CK.outcome === 'lose') return 'lose';
        return null; // unset finish -> no music
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function watch() {
    try {
      // Until audio is unlocked there's nothing to do; keep the loop alive so
      // it springs into action the moment the first gesture lands.
      if (CK.sound && CK.sound.ready()) {
        var want = desiredTrack();
        if (want !== current) {
          if (want) CK.music.play(want);
          else CK.music.stop();
        }
      }
    } catch (e) {
      // Watcher must never throw.
    }
    try { requestAnimationFrame(watch); } catch (e) {
      // If rAF is unavailable, fall back to the interval so it still runs.
      try { setTimeout(watch, 100); } catch (e2) {}
    }
  }

  // ==========================================================================
  // BOOT: start the scheduler timer + watcher now. Both harmlessly idle until
  // CK.sound.ready() returns true (i.e. after the first user gesture).
  // ==========================================================================
  ensureTimer();
  try {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(watch);
    else setTimeout(watch, 100);
  } catch (e) {
    try { setTimeout(watch, 100); } catch (e2) {}
  }
})();
