// ===========================================================================
// Road color palette + track-shape constants
// ===========================================================================

var COLORS = {
  SKY: '#72D7EE',
  FOG: '#3a7d34',
  LIGHT: { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC' },
  DARK:  { road: '#696969', grass: '#009A00', rumble: '#BBBBBB' },
  START: { road: '#DDDDDD', grass: '#10AA10', rumble: '#DDDDDD' }
};

var ROAD = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL:   { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE:  { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
};
