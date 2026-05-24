// ===========================================================================
// Math / helper utilities (declared globally for all other scripts to use)
// ===========================================================================

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function interpolate(a, b, percent) {
  return a + (b - a) * percent;
}

function accelerate(v, accel, dt) {
  return v + accel * dt;
}

// Advance `start` by `increment`, wrapping inside [0, max). Used for lap wrap.
function increase(start, increment, max) {
  var result = start + increment;
  while (result >= max) result -= max;
  while (result < 0) result += max;
  return result;
}

function percentRemaining(n, total) {
  return (n % total) / total;
}

function exponentialFog(distance, density) {
  return 1 / Math.pow(Math.E, distance * distance * density);
}

function easeIn(a, b, percent) {
  return a + (b - a) * Math.pow(percent, 2);
}

function easeOut(a, b, percent) {
  return a + (b - a) * (1 - Math.pow(1 - percent, 2));
}

function easeInOut(a, b, percent) {
  return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function randInt(a, b) {
  return Math.floor(rand(a, b));
}

// Darken a hex color by a factor (0..1). Accepts #rgb or #rrggbb.
function shade(hex, factor) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(function (c) { return c + c; }).join('');
  }
  var r = Math.round(parseInt(hex.substr(0, 2), 16) * factor);
  var g = Math.round(parseInt(hex.substr(2, 2), 16) * factor);
  var b = Math.round(parseInt(hex.substr(4, 2), 16) * factor);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function ordinal(n) {
  var s = ['th', 'st', 'nd', 'rd'];
  var v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Project a world-space point into camera + screen space.
function project(p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) {
  p.camera.x = (p.world.x || 0) - cameraX;
  p.camera.y = (p.world.y || 0) - cameraY;
  p.camera.z = (p.world.z || 0) - cameraZ;
  p.screen.scale = cameraDepth / p.camera.z;
  p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
  p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
  p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
}
