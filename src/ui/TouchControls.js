import { sized } from '../systems/textures.js';
import { view, RES } from '../systems/layout.js';
// ============================================================================
//  TouchControls.js: the on-screen d-pad and swipe steering (phones)
// ----------------------------------------------------------------------------
//  - The d-pad works like a joystick: touch anywhere on the ring and slide
//    your thumb; the side your thumb is on is the direction Spark goes.
//  - Or swipe anywhere on the maze. Each swipe = one turn.
// ============================================================================
import { COLORS } from '../config.js';
import { DIRS } from '../game/Maze.js';
import { label } from './widgets.js';

export class TouchControls {
  /**
   * onHold(dir|null): a direction is being held / released
   * onSwipe(dir): a swipe happened
   */
  constructor(scene, { onHold, onSwipe, onRestart, onSound }) {
    this.scene = scene;
    this.onHold = onHold;
    this.onSwipe = onSwipe;
    this.objects = [];
    this.padPointer = null;
    this.swipe = null;
    this.active = null;

    this.handleDown = (p) => this.pointerDown(p);
    this.handleMove = (p) => this.pointerMove(p);
    this.handleUp = (p) => this.pointerUp(p);
    scene.input.on('pointerdown', this.handleDown);
    scene.input.on('pointermove', this.handleMove);
    scene.input.on('pointerup', this.handleUp);
    scene.input.on('pointerupoutside', this.handleUp);
    this.onRestart = onRestart;
    this.onSound = onSound;
  }

  /** Build (or rebuild) the d-pad at the bottom of the screen. */
  layout(showPad) {
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    this.showPad = showPad;
    if (!showPad) return;
    const s = this.scene;
    const { width: W, height: H } = view(s);
    const portrait = H > W;
    this.radius = portrait ? 128 : 100;
    this.cx = portrait ? W / 2 : W - this.radius - 26;
    this.cy = H - this.radius - (portrait ? 26 : 22);

    const add = (o) => {
      o.setScrollFactor(0);
      this.objects.push(o);
      return o;
    };
    // fade behind the controls so the maze doesn't clash with them
    if (portrait) {
      const shade = add(s.add.graphics().setDepth(29));
      for (let i = 0; i < 30; i++) {
        shade.fillStyle(COLORS.bg, (i / 30) * 0.96);
        shade.fillRect(0, H - 300 + i * 4, W, 4);
      }
      shade.fillStyle(COLORS.bg, 0.96);
      shade.fillRect(0, H - 180, W, 180);
    }
    const g = add(s.add.graphics().setDepth(30));
    g.fillStyle(0x0b3a24, 0.85);
    g.fillCircle(this.cx, this.cy, this.radius);
    g.lineStyle(3, COLORS.soft, 0.28);
    g.strokeCircle(this.cx, this.cy, this.radius);
    g.fillStyle(COLORS.deep, 1);
    g.fillCircle(this.cx, this.cy, this.radius * 0.2);
    g.lineStyle(2, COLORS.soft, 0.3);
    g.strokeCircle(this.cx, this.cy, this.radius * 0.2);

    // four buttons
    this.buttons = {};
    const b = this.radius * 0.52;
    const size = this.radius * 0.66;
    const defs = [
      ['up', 0, -b, 0],
      ['down', 0, b, 180],
      ['left', -b, 0, -90],
      ['right', b, 0, 90],
    ];
    for (const [name, dx, dy, angle] of defs) {
      const bg = add(s.add.graphics().setDepth(31));
      const icon = add(sized(s.add.image(this.cx + dx, this.cy + dy, 'iconArrow').setAngle(angle).setDepth(32), size * 0.5, size * 0.5));
      this.buttons[name] = { bg, icon, x: this.cx + dx, y: this.cy + dy, size };
      this.drawButton(name, false);
    }

    // side buttons (portrait only): restart and sound
    if (portrait) {
      const side = (x, key, text, cb) => {
        const r = 36;
        const sg = add(s.add.graphics().setDepth(30));
        sg.fillStyle(COLORS.deep, 0.95);
        sg.fillCircle(x, this.cy, r);
        sg.lineStyle(2, COLORS.soft, 0.45);
        sg.strokeCircle(x, this.cy, r);
        const icon = add(sized(s.add.image(x, this.cy, key).setDepth(31), 30, 30));
        add(label(s, x, this.cy + r + 18, text, { size: 15, color: '#C7D6CD', letterSpacing: 1.5 }).setDepth(31));
        const zone = add(s.add.zone(x, this.cy, r * 2.2, r * 2.2).setInteractive().setDepth(31));
        zone.on('pointerup', cb);
        return icon;
      };
      side(56, 'iconRestart', 'RESTART', () => this.onRestart && this.onRestart());
      this.soundIcon = side(W - 56, 'iconSound', 'SOUND', () => this.onSound && this.onSound());
    }
  }

  setSoundIcon(muted) {
    if (this.soundIcon) this.soundIcon.setTexture(muted ? 'iconMute' : 'iconSound');
  }

  drawButton(name, on) {
    const btn = this.buttons[name];
    const { bg, x, y, size } = btn;
    bg.clear();
    bg.fillStyle(on ? COLORS.lime : 0x12553a, on ? 1 : 0.92);
    bg.fillRoundedRect(x - size / 2, y - size / 2, size, size, size * 0.27);
    bg.lineStyle(2, on ? 0xe9fad2 : COLORS.soft, on ? 1 : 0.45);
    bg.strokeRoundedRect(x - size / 2, y - size / 2, size, size, size * 0.27);
    btn.icon.setTint(on ? 0x0e2016 : 0xffffff);
  }

  inPad(p) {
    return this.showPad && Math.hypot((p.x / RES) - this.cx, (p.y / RES) - this.cy) <= this.radius * 1.15;
  }

  padDir(p) {
    const dx = (p.x / RES) - this.cx;
    const dy = (p.y / RES) - this.cy;
    if (Math.hypot(dx, dy) < this.radius * 0.12) return null; // dead zone in the middle
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  }

  setActive(name) {
    if (this.active === name) return;
    if (this.active && this.buttons?.[this.active]) this.drawButton(this.active, false);
    this.active = name;
    if (name && this.buttons?.[name]) this.drawButton(name, true);
    this.onHold(name ? DIRS[name] : null);
  }

  pointerDown(p) {
    if (this.inPad(p)) {
      this.padPointer = p.id;
      this.setActive(this.padDir(p));
      return;
    }
    // ignore taps on the side buttons / HUD (handled by their own zones)
    if (this.showPad && (p.y / RES) > this.cy - this.radius - 10 && view(this.scene).height > view(this.scene).width) return;
    this.swipe = { id: p.id, x: (p.x / RES), y: (p.y / RES) };
  }

  pointerMove(p) {
    if (this.padPointer === p.id && p.isDown) {
      this.setActive(this.padDir(p));
      return;
    }
    if (this.swipe && this.swipe.id === p.id && p.isDown) {
      const dx = (p.x / RES) - this.swipe.x;
      const dy = (p.y / RES) - this.swipe.y;
      if (Math.hypot(dx, dy) > 24) {
        const name = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
        this.onSwipe(DIRS[name]);
        // start a new swipe from here so you can chain turns without lifting
        this.swipe = { id: p.id, x: (p.x / RES), y: (p.y / RES) };
      }
    }
  }

  pointerUp(p) {
    if (this.padPointer === p.id) {
      this.padPointer = null;
      this.setActive(null);
    }
    if (this.swipe && this.swipe.id === p.id) this.swipe = null;
  }

  /** Let go of everything (used when pausing). */
  release() {
    this.padPointer = null;
    this.swipe = null;
    this.setActive(null);
  }

  destroy() {
    const i = this.scene.input;
    i.off('pointerdown', this.handleDown);
    i.off('pointermove', this.handleMove);
    i.off('pointerup', this.handleUp);
    i.off('pointerupoutside', this.handleUp);
    this.objects.forEach((o) => o.destroy());
  }
}
