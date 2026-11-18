// ============================================================================
//  config.js: the game's "settings panel"
// ----------------------------------------------------------------------------
//  Most numbers you might want to tweak live here, in one place.
//  Change a value, save the file, and the browser reloads with the change.
// ============================================================================

// ---- Colors (Foundation of Hope "Keyhole" palette) -------------------------
// Phaser wants colors as numbers like 0xRRGGBB. CSS-style strings ('#RRGGBB')
// are used for text.
export const COLORS = {
  bg: 0x051c12, // the darkest green, behind everything
  deep: 0x07291a, // panels and buttons
  forest: 0x12553a, // button faces
  wall: 0x1b6a45, // maze walls
  wallEdge: 0x2e8a5c, // wall outline
  floor: 0x05200f, // maze floor
  lime: 0x9bd65b, // discoveries, highlights
  sky: 0x6ed0e8, // data dots
  gold: 0xf2c14e, // gifts, keyhole, Spark's ring
  goldLight: 0xffe7a3,
  goldDark: 0xb8862a,
  cream: 0xf6f8f1,
  soft: 0xe3ece6,
  fog: 0x03150c, // the darkness
};

// The same colors as text-friendly strings.
export const CSS = {
  bg: '#051C12',
  deep: '#07291A',
  lime: '#9BD65B',
  sky: '#6ED0E8',
  gold: '#F2C14E',
  goldLight: '#FFE7A3',
  cream: '#F6F8F1',
  soft: '#E3ECE6',
  muted: '#C7D6CD',
};

// ---- Fonts ----------------------------------------------------------------
// No downloaded fonts (so the game works offline). These use fonts already on
// the player's computer or phone.
export const FONTS = {
  heading: 'Georgia, "Times New Roman", serif',
  label: '"Barlow Semi Condensed", "Arial Narrow", "Roboto Condensed", "Helvetica Neue", Arial, sans-serif',
};

// ---- Maze ------------------------------------------------------------------
export const TILE = 40; // size of one maze square, in pixels

// ---- Spark (the player) ------------------------------------------------------
export const PLAYER = {
  speed: 5.5, // squares per second (5.5 squares = 220 pixels per second)
  calmSpeedFactor: 0.7, // Calm mode runs at 70% speed
  hitRadius: 24, // how close Static has to get to touch Spark (pixels)
  stunTime: 0.45, // seconds Spark is dazed after touching Static
  safeTime: 1.6, // seconds of protection after a hit
};

// ---- Light (Spark's glow) ----------------------------------------------------
// Each level can override these in levels.js (look for "light:"). These are
// the defaults. From level 2 on the glow drains, and if it shrinks to
// "outAt" Spark runs out of light and loses a life.
//   Seconds of light with no pickups = (start - outAt) / fadePerSecond
//   e.g. level 2: (150 - 26) / 6 = about 21 seconds
// To make the game easier, lower fadePerSecond in levels.js (or raise
// giftRefill here). To make it harder, raise fadePerSecond.
export const LIGHT = {
  max: 150, // biggest glow, in pixels
  min: 0, // the glow never shrinks below this (Calm mode uses calmMin)
  start: 150, // glow at the start of a level (and after losing a life)
  fadePerSecond: 0, // how fast the glow shrinks, in pixels per second (0 = never)
  outAt: 26, // at this size the light is gone: you lose a life
  warnAt: 60, // below this the meter flashes red and a warning shows
  giftRefill: 55, // how much a gold gift ($) brightens the glow
  hitLoss: 40, // Calm mode only: how much touching Static dims the glow
  calmFadeFactor: 0.5, // Calm mode drains at half speed...
  calmMin: 62, // ...and never runs out (the glow stops shrinking here)
  fogAlpha: 0.95, // darkness of unexplored fog (0 = clear, 1 = black)
  memoryAlpha: 0.7, // darkness of places you have already seen
};

// ---- Lives ---------------------------------------------------------------------
// Touching Static or running out of light costs one heart. Spark goes back
// to the level start; discoveries and gifts you already found stay found.
// At 0 hearts the level restarts ("Try again").
export const LIVES = {
  start: 3, // hearts at the start of a run
  invulnerableTime: 2.0, // seconds Spark flashes and can't be hurt after losing a life
  respawnDelay: 0.7, // seconds of pause before Spark reappears at the start
  calmUnlimited: true, // Calm mode: no hearts, Static just pushes you back
};

// ---- Characters ----------------------------------------------------------------
// Pictures live in public/characters/. To swap a face, replace the PNG
// (square, transparent background, 256x256 is plenty) and keep the file name.
export const CHARACTERS = ['Dark hair and glasses', 'Sand-colored hijab', 'Silver hair and beard', 'Silver bob and glasses', 'Locs and lab coat', 'Red hair and denim'].map((name, i) => ({
  id: 'researcher' + i, name, file: 'characters/researcher' + i + '.webp',
}));
export const FACE_SIZE = 38; // how big the face is in the maze (a square is 40)

// ---- Hazards -------------------------------------------------------------------
export const HAZARDS = {
  surgeSeconds: 4,
  returnSeconds: 7,
  staticSpeed: 3.0, // Static blobs move this many squares per second (levels.js can override)
  calmHazardFactor: 0.6, // in Calm mode, hazards and doors run 40% slower
  doorOpenTime: 3.5, // seconds a Closing Door stays open
  doorClosedTime: 2.5, // seconds it stays shut
};

// ---- Scoring -------------------------------------------------------------------
export const SCORE = {
  dot: 10, // each blue data dot
  gift: 250, // each gold gift
  discovery: 500, // each discovery (lime clue key)
  timeBonusPerSecond: 25, // points for every second under the par time
};

// ---- Layout --------------------------------------------------------------------
// The game picks its size from the screen shape: tall (phones) or wide
// (computers). Phaser then scales it to fit the window ("Scale FIT").
export const LAYOUT = {
  portraitWidth: 540, // game width on phones (height is worked out)
  landscapeHeight: 600, // game height on computers (width is worked out)
  hudHeightPortrait: 128,
  hudHeightLandscape: 96,
  controlsHeight: 300, // room for the touch d-pad at the bottom (phones)
};

// ---- Links & text ----------------------------------------------------------------
export const GAME_TITLE = 'SPARK';
export const GAME_SUBTITLE = 'The Missing Signal';
// Where the "Help fund the next breakthrough" button goes. It opens in a new tab.
export const GIVE_URL = 'https://annualfund.walkforhope.com/#give';

// The key used to save progress in the browser (localStorage).
export const SAVE_KEY = 'spark-game-save-v1';

// Turn on to show extra info (like the tile grid) while you build levels.
export const DEBUG = false;
