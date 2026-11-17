// ============================================================================
//  textures.js: draws all of the game's pictures with code
// ----------------------------------------------------------------------------
//  There are no image files. Each picture is drawn once at startup on a small
//  canvas (like a sheet of paper) and saved under a name ("key") that the
//  scenes use, e.g. this.add.image(x, y, 'coin').
//  To restyle something, change its drawing function below.
// ============================================================================
import Phaser from 'phaser';
import { TILE } from '../config.js';
import { RES } from './layout.js';

const GOLD_STOPS = [
  [0, '#FFE7A3'],
  [0.5, '#F2C14E'],
  [1, '#B8862A'],
];

// Textures that stay at normal resolution (soft on purpose, or used by
// particles / repeating floors, which don't support high-res textures).
const LOW_RES = new Set(['floor', 'lightBrush', 'memoryBrush', 'particle']);

/**
 * Make a canvas texture, run the drawing function on it, then save it.
 * Drawing code always uses normal (logical) sizes. For sharp screens the
 * canvas is RES times bigger and Phaser is told its resolution, so it still
 * shows at the normal size, just with more detail.
 */
function make(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const res = LOW_RES.has(key) ? 1 : RES;
  const tex = scene.textures.createCanvas(key, Math.ceil(w * res), Math.ceil(h * res));
  const ctx = tex.getContext();
  ctx.save();
  ctx.scale(res, res);
  draw(ctx, w, h);
  ctx.restore();
  tex.source[0].resolution = res;
  tex.refresh();
}

/**
 * Show an image at an exact size in logical pixels (use instead of
 * setDisplaySize, which doesn't know about high-res textures).
 */
export function sized(img, w, h = w) {
  const res = img.frame?.source?.resolution || 1;
  img.setScale((w * res) / img.width, (h * res) / img.height);
  return img;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function goldGradient(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  GOLD_STOPS.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function radial(ctx, cx, cy, r, stops) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function star5(ctx, cx, cy, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

/** A padlock: body + keyhole. open = shackle lifted. */
function padlock(ctx, cx, cy, s, open) {
  ctx.lineWidth = s * 0.16;
  ctx.strokeStyle = '#F2C14E';
  ctx.lineCap = 'round';
  ctx.beginPath();
  const lift = open ? s * 0.32 : 0;
  ctx.arc(cx, cy - s * 0.15 - lift, s * 0.34, Math.PI, 0);
  ctx.lineTo(cx + s * 0.34, cy + s * 0.05 - (open ? lift : 0));
  if (!open) {
    ctx.moveTo(cx - s * 0.34, cy - s * 0.15);
    ctx.lineTo(cx - s * 0.34, cy + s * 0.05);
  }
  ctx.stroke();
  ctx.fillStyle = goldGradient(ctx, cy - s * 0.1, cy + s * 0.6);
  roundRect(ctx, cx - s * 0.5, cy - s * 0.08, s, s * 0.72, s * 0.14);
  ctx.fill();
  ctx.fillStyle = '#07291A';
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.2, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.06, cy + s * 0.24);
  ctx.lineTo(cx + s * 0.06, cy + s * 0.24);
  ctx.lineTo(cx + s * 0.09, cy + s * 0.48);
  ctx.lineTo(cx - s * 0.09, cy + s * 0.48);
  ctx.closePath();
  ctx.fill();
}

export function createTextures(scene) {
  const T = TILE;

  // ---- Spark: a 4-point star of light (no face, no eyes) --------------------
  make(scene, 'spark', 64, 64, (c) => {
    c.fillStyle = radial(c, 32, 32, 32, [
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(233,250,210,0.9)'],
      [0.55, 'rgba(155,214,91,0.35)'],
      [1, 'rgba(155,214,91,0)'],
    ]);
    c.fillRect(0, 0, 64, 64);
    c.fillStyle = '#FFFFFF';
    c.beginPath();
    const p = [[32, 13], [35, 29], [51, 32], [35, 35], [32, 51], [29, 35], [13, 32], [29, 29]];
    p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
    c.fillStyle = '#E9FAD2';
    c.beginPath();
    c.arc(32, 32, 4.5, 0, Math.PI * 2);
    c.fill();
  });

  // Spark's gold orbit ring (drawn separately so it can spin)
  make(scene, 'sparkRing', 64, 64, (c) => {
    c.strokeStyle = '#F2C14E';
    c.lineWidth = 2.4;
    c.beginPath();
    c.ellipse(32, 32, 19, 7.5, 0, 0, Math.PI * 2);
    c.stroke();
  });

  // ---- Maze pieces ----------------------------------------------------------
  make(scene, 'wall', T, T, (c) => {
    c.fillStyle = '#1B6A45';
    roundRect(c, 1, 1, T - 2, T - 2, 6);
    c.fill();
    c.strokeStyle = '#2E8A5C';
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = 'rgba(155,214,91,0.55)';
    roundRect(c, 4, 3, T - 8, 3, 1.5);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(c, 3, T - 6, T - 6, 3, 1.5);
    c.fill();
  });

  make(scene, 'floor', T, T, (c) => {
    c.fillStyle = '#05200F';
    c.fillRect(0, 0, T, T);
    c.strokeStyle = 'rgba(155,214,91,0.07)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(T - 0.5, 0);
    c.lineTo(T - 0.5, T);
    c.moveTo(0, T - 0.5);
    c.lineTo(T, T - 0.5);
    c.stroke();
  });

  make(scene, 'dot', 12, 12, (c) => {
    c.fillStyle = '#6ED0E8';
    c.beginPath();
    c.arc(6, 6, 3.8, 0, Math.PI * 2);
    c.fill();
  });

  // Gold gift: a coin with a $ sign
  make(scene, 'gift', 30, 30, (c) => {
    c.fillStyle = goldGradient(c, 4, 26);
    c.beginPath();
    c.arc(15, 15, 11, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#FFE7A3';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#07291A';
    c.font = 'bold 14px Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('$', 15, 16);
  });

  // Discovery: a lime "clue key" with a soft glow
  make(scene, 'clue', 44, 44, (c) => {
    c.fillStyle = radial(c, 22, 22, 22, [
      [0, 'rgba(233,250,210,0.8)'],
      [0.5, 'rgba(155,214,91,0.3)'],
      [1, 'rgba(155,214,91,0)'],
    ]);
    c.fillRect(0, 0, 44, 44);
    c.strokeStyle = '#9BD65B';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(15, 22, 5, 0, Math.PI * 2);
    c.moveTo(20, 22);
    c.lineTo(32, 22);
    c.moveTo(27, 22);
    c.lineTo(27, 27);
    c.moveTo(31, 22);
    c.lineTo(31, 26);
    c.stroke();
  });

  // The keyhole exit, locked and open
  make(scene, 'lock', 56, 64, (c) => padlock(c, 28, 30, 40, false));
  make(scene, 'lockOpen', 56, 64, (c) => padlock(c, 28, 30, 40, true));

  // Sunburst rays behind the keyhole and on the title screen
  make(scene, 'sunburst', 256, 256, (c) => {
    c.fillStyle = radial(c, 128, 128, 128, [
      [0, 'rgba(255,243,201,0.9)'],
      [0.35, 'rgba(242,193,78,0.35)'],
      [1, 'rgba(242,193,78,0)'],
    ]);
    c.fillRect(0, 0, 256, 256);
    c.strokeStyle = 'rgba(255,231,163,0.8)';
    c.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI * 2) / 16;
      c.lineWidth = i % 2 ? 3 : 5;
      const r0 = 46;
      const r1 = i % 2 ? 84 : 104;
      c.beginPath();
      c.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0);
      c.lineTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
      c.stroke();
    }
  });

  make(scene, 'glow', 128, 128, (c) => {
    c.fillStyle = radial(c, 64, 64, 64, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.45)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(0, 0, 128, 128);
  });

  // ---- Fog brushes --------------------------------------------------------------
  // The light brush is erased from the fog around Spark. Soft edges look nicer.
  make(scene, 'lightBrush', 256, 256, (c) => {
    c.fillStyle = radial(c, 128, 128, 128, [
      [0, 'rgba(255,255,255,1)'],
      [0.6, 'rgba(255,255,255,1)'],
      [0.85, 'rgba(255,255,255,0.55)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(0, 0, 256, 256);
  });
  // A soft square that lifts the fog a little on places you've seen.
  make(scene, 'memoryBrush', T * 2, T * 2, (c) => {
    c.fillStyle = radial(c, T, T, T, [
      [0, 'rgba(255,255,255,1)'],
      [0.5, 'rgba(255,255,255,0.9)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(0, 0, T * 2, T * 2);
  });

  // ---- Static ("noisy data"): 4 frames of flickering squares -----------------
  for (let f = 0; f < 4; f++) {
    make(scene, `static${f}`, 40, 40, (c) => {
      let seed = 7 + f * 31;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 46; i++) {
        const a = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * 15;
        const s = 2 + Math.floor(rnd() * 3);
        c.fillStyle = i % 3 ? 'rgba(227,236,230,0.9)' : 'rgba(110,208,232,0.95)';
        c.fillRect(Math.round(20 + Math.cos(a) * r - s / 2), Math.round(20 + Math.sin(a) * r - s / 2), s, s);
      }
    });
  }

  // ---- Closing Door: gold and green hazard stripes ------------------------------
  const stripes = (c, alpha) => {
    c.save();
    roundRect(c, 2, 2, T - 4, T - 4, 5);
    c.clip();
    c.globalAlpha = alpha;
    c.fillStyle = '#07291A';
    c.fillRect(0, 0, T, T);
    c.fillStyle = '#F2C14E';
    for (let i = -T; i < T * 2; i += 10) {
      c.beginPath();
      c.moveTo(i, 0);
      c.lineTo(i + 5, 0);
      c.lineTo(i + 5 - T, T);
      c.lineTo(i - T, T);
      c.closePath();
      c.fill();
    }
    c.restore();
  };
  make(scene, 'doorClosed', T, T, (c) => {
    stripes(c, 1);
    c.strokeStyle = '#FFE7A3';
    c.lineWidth = 1.5;
    roundRect(c, 2, 2, T - 4, T - 4, 5);
    c.stroke();
  });
  make(scene, 'doorOpen', T, T, (c) => {
    // the open door: faint stripes, so it still reads as a door
    stripes(c, 0.18);
    c.strokeStyle = 'rgba(242,193,78,0.6)';
    c.setLineDash([4, 4]);
    c.lineWidth = 2;
    roundRect(c, 3, 3, T - 6, T - 6, 5);
    c.stroke();
  });

  // ---- Gate: a gold-framed door with a small lock -------------------------------
  make(scene, 'gate', T, T, (c) => {
    c.fillStyle = '#07291A';
    roundRect(c, 2, 2, T - 4, T - 4, 6);
    c.fill();
    c.strokeStyle = goldGradient(c, 0, T);
    c.lineWidth = 3;
    c.stroke();
  });
  make(scene, 'gateOpen', T, T, (c) => {
    c.strokeStyle = 'rgba(242,193,78,0.35)';
    c.lineWidth = 2;
    roundRect(c, 3, 3, T - 6, T - 6, 6);
    c.stroke();
  });

  // ---- Little bits for particles and UI --------------------------------------------
  make(scene, 'particle', 10, 10, (c) => {
    c.fillStyle = '#FFFFFF';
    c.beginPath();
    c.arc(5, 5, 4, 0, Math.PI * 2);
    c.fill();
  });
  make(scene, 'star', 56, 56, (c) => {
    c.fillStyle = goldGradient(c, 4, 52);
    star5(c, 28, 29, 25, 11);
    c.fill();
    c.strokeStyle = '#FFE7A3';
    c.lineWidth = 2;
    c.stroke();
  });
  make(scene, 'starEmpty', 56, 56, (c) => {
    c.strokeStyle = 'rgba(227,236,230,0.4)';
    c.lineWidth = 3;
    star5(c, 28, 29, 24, 10.5);
    c.stroke();
  });

  // ---- Icons ---------------------------------------------------------------------
  // ---- Hearts (lives) ----------------------------------------------------------
  const heartPath = (c) => {
    c.beginPath();
    c.moveTo(16, 28);
    c.bezierCurveTo(4, 20, 1, 13, 4, 8);
    c.bezierCurveTo(7, 3, 14, 3, 16, 9);
    c.bezierCurveTo(18, 3, 25, 3, 28, 8);
    c.bezierCurveTo(31, 13, 28, 20, 16, 28);
    c.closePath();
  };
  make(scene, 'heart', 32, 32, (c) => {
    heartPath(c);
    const g = c.createLinearGradient(0, 4, 0, 28);
    g.addColorStop(0, '#FF8A7A');
    g.addColorStop(1, '#D9434F');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = '#051C12';
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.ellipse(10, 10, 3, 2, -0.6, 0, Math.PI * 2);
    c.fill();
  });
  make(scene, 'heartEmpty', 32, 32, (c) => {
    heartPath(c);
    c.fillStyle = 'rgba(5,28,18,0.6)';
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(169,199,180,0.55)';
    c.stroke();
  });
  // gold rim drawn behind the player's face
  make(scene, 'faceRim', 64, 64, (c) => {
    c.beginPath();
    c.arc(32, 32, 29, 0, Math.PI * 2);
    c.fillStyle = 'rgba(242,193,78,0.35)';
    c.fill();
    c.lineWidth = 3;
    c.strokeStyle = '#F2C14E';
    c.stroke();
  });

  make(scene, 'iconPause', 32, 32, (c) => {
    c.fillStyle = '#E3ECE6';
    roundRect(c, 8, 6, 6, 20, 2);
    c.fill();
    roundRect(c, 18, 6, 6, 20, 2);
    c.fill();
  });
  const speaker = (c) => {
    c.fillStyle = '#E3ECE6';
    c.beginPath();
    c.moveTo(4, 12);
    c.lineTo(10, 12);
    c.lineTo(17, 6);
    c.lineTo(17, 26);
    c.lineTo(10, 20);
    c.lineTo(4, 20);
    c.closePath();
    c.fill();
  };
  make(scene, 'iconSound', 32, 32, (c) => {
    speaker(c);
    c.strokeStyle = '#E3ECE6';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(17, 16, 6, -0.9, 0.9);
    c.stroke();
    c.beginPath();
    c.arc(17, 16, 11, -0.9, 0.9);
    c.stroke();
  });
  make(scene, 'iconMute', 32, 32, (c) => {
    speaker(c);
    c.strokeStyle = '#E3ECE6';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(21, 11);
    c.lineTo(29, 21);
    c.moveTo(29, 11);
    c.lineTo(21, 21);
    c.stroke();
  });
  make(scene, 'iconRestart', 32, 32, (c) => {
    c.strokeStyle = '#E3ECE6';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(16, 17, 9, -Math.PI * 0.35, Math.PI * 1.35);
    c.stroke();
    c.fillStyle = '#E3ECE6';
    c.beginPath();
    c.moveTo(20, 3);
    c.lineTo(26, 10);
    c.lineTo(17, 12);
    c.closePath();
    c.fill();
  });
  make(scene, 'iconArrow', 40, 40, (c) => {
    // an "up" chevron, rotated for the other d-pad buttons
    c.strokeStyle = '#F6F8F1';
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(9, 25);
    c.lineTo(20, 13);
    c.lineTo(31, 25);
    c.stroke();
  });
  make(scene, 'iconLight', 32, 32, (c) => {
    c.fillStyle = radial(c, 16, 16, 16, [
      [0, 'rgba(255,231,163,1)'],
      [0.5, 'rgba(242,193,78,0.6)'],
      [1, 'rgba(242,193,78,0)'],
    ]);
    c.fillRect(0, 0, 32, 32);
  });
}

// Phaser 4 draws a high-resolution texture at its logical size but still
// offsets it by the full pixel size, so HD images drifted up and left.
// This small patch makes the pivot match the drawn size.
for (const Cls of [Phaser.GameObjects.Image, Phaser.GameObjects.Sprite]) {
  Cls.prototype.updateDisplayOrigin = function updateDisplayOrigin() {
    const r = this.frame?.source?.resolution || 1;
    this._displayOriginX = (this.originX * this.width) / r;
    this._displayOriginY = (this.originY * this.height) / r;
    return this;
  };
}
