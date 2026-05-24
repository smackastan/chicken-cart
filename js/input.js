// ===========================================================================
// Keyboard input. Movement: WASD. Space = jump. E = drop egg. Enter = restart.
// ===========================================================================

CK.keys = { up: false, down: false, left: false, right: false };
CK.showControls = false;

window.addEventListener('keydown', function (e) {
  switch (e.code) {
    case 'KeyW': CK.keys.up = true; break;
    case 'KeyS': CK.keys.down = true; break;
    case 'KeyA': CK.keys.left = true; break;
    case 'KeyD': CK.keys.right = true; break;
    case 'Space': if (CK.state === STATE.RACING) CK.jump(); break;
    case 'KeyE': if (CK.state === STATE.RACING) CK.dropEgg(); break;
    case 'Enter': if (CK.state === STATE.FINISHED) CK.nextRace(); break;
    case 'Tab': CK.showControls = !CK.showControls; break;
  }
  // stop Space from scrolling and Tab from moving focus
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
});

window.addEventListener('keyup', function (e) {
  switch (e.code) {
    case 'KeyW': CK.keys.up = false; break;
    case 'KeyS': CK.keys.down = false; break;
    case 'KeyA': CK.keys.left = false; break;
    case 'KeyD': CK.keys.right = false; break;
  }
});
