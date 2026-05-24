// ===========================================================================
// Touch controls for phones / tablets (e.g. the GitHub Pages build opened in a
// mobile browser). On-screen buttons map to the same CK.keys / actions as the
// keyboard. The buttons live in #touch-controls (index.html) and are revealed
// by the `touch` class added to <body> below.
// ===========================================================================

CK.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

(function () {
  if (!CK.isTouch) return;
  document.body.classList.add('touch');

  // Held button: press sets a flag / release clears it (steering, gas, brake).
  function hold(id, on, off) {
    var el = document.getElementById(id);
    if (!el) return;
    var press = function (e) { e.preventDefault(); el.classList.add('pressed'); on(); };
    var release = function (e) { e.preventDefault(); el.classList.remove('pressed'); off(); };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('touchend', release, { passive: false });
    el.addEventListener('touchcancel', release, { passive: false });
  }

  // One-shot button: fires on press (jump, drop egg).
  function tap(id, fn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', function (e) {
      e.preventDefault(); el.classList.add('pressed'); fn();
    }, { passive: false });
    var clear = function (e) { e.preventDefault(); el.classList.remove('pressed'); };
    el.addEventListener('touchend', clear, { passive: false });
    el.addEventListener('touchcancel', clear, { passive: false });
  }

  var k = CK.keys;
  hold('btn-left',  function () { k.left = true; },  function () { k.left = false; });
  hold('btn-right', function () { k.right = true; }, function () { k.right = false; });
  hold('btn-gas',   function () { k.up = true; },    function () { k.up = false; });
  hold('btn-brake', function () { k.down = true; },  function () { k.down = false; });
  tap('btn-jump', function () { if (CK.state === STATE.RACING) CK.jump(); });
  tap('btn-egg',  function () { if (CK.state === STATE.RACING) CK.dropEgg(); });

  // No Enter key on phones: tap the screen on the results screen for the next track.
  var canvas = document.getElementById('game');
  if (canvas) {
    canvas.addEventListener('touchstart', function (e) {
      if (CK.state === STATE.FINISHED) { e.preventDefault(); CK.nextRace(); }
    }, { passive: false });
  }
})();
