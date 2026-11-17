import { sized } from '../systems/textures.js';
import { view, RES } from '../systems/layout.js';
// ============================================================================
//  widgets.js: reusable bits of interface (text, buttons, pills, stars)
// ----------------------------------------------------------------------------
//  Every scene uses these so the whole game looks the same.
// ============================================================================
import { COLORS, CSS, FONTS } from '../config.js';
import { Sound } from '../systems/sound.js';

/** Text with the game's look. size is in pixels. */
export function label(scene, x, y, text, opts = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: opts.heading ? FONTS.heading : FONTS.label,
    fontSize: `${opts.size || 18}px`,
    fontStyle: opts.bold === false ? 'normal' : opts.italic ? 'italic bold' : 'bold',
    color: opts.color || CSS.cream,
    align: opts.align || 'center',
    wordWrap: opts.wrap ? { width: opts.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: opts.lineSpacing ?? 4,
    resolution: RES, // sharper text on phones
  });
  if (opts.letterSpacing) t.setLetterSpacing(opts.letterSpacing);
  t.setOrigin(opts.originX ?? 0.5, opts.originY ?? 0.5);
  return t;
}

/** Draw a rounded rectangle "pill" or panel into a Graphics object. */
export function panel(g, x, y, w, h, opts = {}) {
  const r = opts.radius ?? Math.min(h / 2, 22);
  g.fillStyle(opts.fill ?? COLORS.deep, opts.alpha ?? 0.92);
  g.fillRoundedRect(x, y, w, h, r);
  if (opts.stroke !== null) {
    g.lineStyle(opts.strokeWidth ?? 2, opts.stroke ?? COLORS.soft, opts.strokeAlpha ?? 0.28);
    g.strokeRoundedRect(x, y, w, h, r);
  }
  return g;
}

/**
 * A tappable button. Returns a Container you can move around.
 *   opts.primary  gold button (the main choice)
 *   opts.icon     texture key of an icon to show instead of / beside text
 */
export function button(scene, x, y, w, h, text, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (hover, down) => {
    g.clear();
    const primary = opts.primary;
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, Math.min(h / 2, 20));
    const fill = primary ? (hover ? COLORS.goldLight : COLORS.gold) : hover ? 0x1b6a45 : COLORS.forest;
    g.fillStyle(fill, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + (down ? 3 : 0), w, h, Math.min(h / 2, 20));
    g.lineStyle(2, primary ? COLORS.goldLight : COLORS.soft, primary ? 1 : 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2 + (down ? 3 : 0), w, h, Math.min(h / 2, 20));
  };
  draw(false, false);
  c.add(g);
  if (opts.icon) {
    const icon = sized(scene.add.image(text ? -w / 2 + 28 : 0, 0, opts.icon), opts.iconSize || 26, opts.iconSize || 26);
    c.add(icon);
    c.icon = icon;
  }
  if (text) {
    const t = label(scene, opts.icon ? 12 : 0, 0, text, {
      size: opts.size || 22,
      color: opts.primary ? CSS.deep : CSS.cream,
      letterSpacing: 1.5,
    });
    c.add(t);
    c.text = t;
  }
  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerover', () => draw(true, false));
  zone.on('pointerout', () => draw(false, false));
  zone.on('pointerdown', () => draw(true, true));
  zone.on('pointerup', () => {
    draw(true, false);
    Sound.unlock();
    Sound.click();
    onClick();
  });
  c.setSize(w, h);
  c.zone = zone;
  c.redraw = draw;
  return c;
}

/** A row of 3 stars. earned = how many are gold. Returns the images. */
export function starRow(scene, x, y, earned, size = 40, gap = 10) {
  const imgs = [];
  for (let i = 0; i < 3; i++) {
    const sx = x + (i - 1) * (size + gap);
    const img = sized(scene.add.image(sx, y, i < earned ? 'star' : 'starEmpty'), size, size);
    imgs.push(img);
  }
  return imgs;
}

/** A soft vertical background used by the menu screens. */
export function menuBackground(scene) {
  const { width: W, height: H } = view(scene);
  scene.cameras.main.setBackgroundColor(CSS.bg);
  const g = scene.add.graphics();
  // faint maze grid
  g.lineStyle(1, COLORS.lime, 0.05);
  for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
  for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);
  return g;
}

/** Menu screens simply redraw themselves when the window changes shape. */
export function restartOnResize(scene, data) {
  const handler = () => scene.scene.restart(data);
  scene.scale.on('resize', handler);
  scene.events.once('shutdown', () => scene.scale.off('resize', handler));
}

/**
 * Center a screen's content vertically: moves everything created after
 * `startIndex` (in the scene's display list) so the block from top to
 * `bottom` sits in the middle. Returns how far things moved.
 */
export function centerVertically(scene, startIndex, top, bottom) {
  const H = view(scene).height;
  const dy = Math.max(0, Math.round((H - (bottom - top)) / 2 - top));
  if (dy > 0) scene.children.list.slice(startIndex).forEach((o) => (o.y += dy));
  return dy;
}
