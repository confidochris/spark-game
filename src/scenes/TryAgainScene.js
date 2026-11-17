// A level retry, never a lost campaign: unlocked levels and records are safe.
import Phaser from 'phaser';
import { COLORS, CSS, LIVES } from '../config.js';
import { view, setupCamera } from '../systems/layout.js';
import { label, button, panel } from '../ui/widgets.js';
export class TryAgainScene extends Phaser.Scene {
  constructor() { super('TryAgain'); }
  init(data) { this.levelIndex = data.levelIndex; }
  create() {
    setupCamera(this);
    const { width: W, height: H } = view(this);
    this.add.rectangle(0, 0, W, H, COLORS.bg, 0.9).setOrigin(0).setInteractive();
    const w = Math.min(W - 40, 420), top = H / 2 - 205;
    panel(this.add.graphics(), W / 2 - w / 2, top, w, 410, { radius: 24, stroke: COLORS.gold, strokeAlpha: 0.8 });
    label(this, W / 2, top + 55, 'Try again', { size: 44, heading: true, color: CSS.gold });
    label(this, W / 2, top + 113, 'Every discovery takes persistence.', { size: 19, color: CSS.cream });
    label(this, W / 2, top + 177, `Start level ${this.levelIndex + 1} fresh with ${LIVES.start} hearts.\nYour unlocked levels and records are safe.`, { size: 17, bold: false, color: CSS.soft, wrap: w - 52 });
    button(this, W / 2, top + 274, w - 70, 60, 'RETRY LEVEL', () => this.goto('Play', { levelIndex: this.levelIndex }), { primary: true });
    button(this, W / 2, top + 348, w - 70, 50, 'TITLE / CALM MODE', () => this.goto('Title'), { size: 18 });
    this.input.keyboard.on('keydown-ENTER', () => this.goto('Play', { levelIndex: this.levelIndex }));
    this.input.keyboard.on('keydown-R', () => this.goto('Play', { levelIndex: this.levelIndex }));
  }
  goto(key, data) { this.scene.stop('Play'); this.scene.start(key, data); }
}
