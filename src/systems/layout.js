// ============================================================================
//  layout.js: works out the game's size and a few device facts
// ============================================================================
import { LAYOUT } from '../config.js';

/**
 * Phones (tall screens) get a game 540 pixels wide; computers (wide screens)
 * get a game 600 pixels tall. The other side matches the window's shape,
 * so Phaser's "Scale FIT" fills the screen with no black bars.
 */
export function computeGameSize(w = window.innerWidth, h = window.innerHeight) {
  const aspect = Math.max(0.3, w / Math.max(1, h));
  if (aspect < 1) {
    const width = LAYOUT.portraitWidth;
    const height = Math.round(Math.min(1300, Math.max(760, width / aspect)));
    return { width, height, portrait: true };
  }
  const height = LAYOUT.landscapeHeight;
  const width = Math.round(Math.min(1200, Math.max(760, height * aspect)));
  return { width, height, portrait: false };
}

// ---- Sharp graphics on every screen ---------------------------------------
// The game is laid out in "logical" pixels (540 wide on phones, 600 tall on
// computers). To look sharp on high-resolution (Retina) screens, the canvas
// is made RES times bigger, and each scene's camera zooms in by RES.
// RES is worked out once at startup from the screen's pixel density.
// Change MAX_RES to 1 to turn this off (faster on old phones, but blurrier).
const MAX_RES = 3;

function pickResolution() {
  if (typeof window === 'undefined') return 1;
  const logical = computeGameSize();
  const dpr = window.devicePixelRatio || 1;
  // how many real screen pixels each logical pixel covers
  const wanted = (dpr * window.innerWidth) / logical.width;
  return Math.min(MAX_RES, Math.max(1, Math.ceil(wanted * 4) / 4));
}

export const RES = pickResolution();

/** The logical size of the game (what all the layout code uses). */
export function view(scene) {
  return { width: scene.scale.width / RES, height: scene.scale.height / RES };
}

/** Every scene calls this first: zoom its camera so logical pixels fill the canvas. */
export function setupCamera(scene) {
  const cam = scene.cameras.main;
  cam.setOrigin(0, 0);
  cam.setZoom(RES);
  return cam;
}

/** True on phones and tablets (anything with a touch screen). */
export function isTouchDevice() {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia?.('(pointer: coarse)').matches)
  );
}

/** True if the player asked their device for less motion. */
export function prefersReducedMotion() {
  return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Format seconds as m:ss (for example 75.4 -> "1:15"). */
export function formatTime(seconds) {
  if (seconds == null || !isFinite(seconds)) return '--:--';
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
