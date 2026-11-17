// ============================================================================
//  PauseScene.js: the pause menu, shown on top of the paused level
// ============================================================================
import Phaser from 'phaser';
import { COLORS, CSS } from '../config.js';
import { label, button, panel } from '../ui/widgets.js';
import { Sound } from '../systems/sound.js';
import { isTouchDevice, view, setupCamera } from '../systems/layout.js';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.levelIndex = data.levelIndex;
  }

  create() {
    setupCamera(this);
    const { width: W, height: H } = view(this);
    this.add.rectangle(0, 0, W, H, COLORS.bg, 0.78).setOrigin(0, 0).setInteractive(); // blocks taps on the game
    const pw = Math.min(W - 40, 380);
    const ph = 390;
    const top = H / 2 - ph / 2;
    panel(this.add.graphics(), W / 2 - pw / 2, top, pw, ph, { radius: 22, alpha: 0.98, stroke: COLORS.gold, strokeAlpha: 0.6 });
    label(this, W / 2, top + 50, 'Paused', { size: 36, heading: true });

    let y = top + 120;
    button(this, W / 2, y, pw - 60, 58, 'RESUME', () => this.resume(), { primary: true });
    y += 74;
    button(this, W / 2, y, pw - 60, 54, 'RESTART LEVEL', () => this.goto('Play', { levelIndex: this.levelIndex }), { icon: 'iconRestart' });
    y += 68;
    const snd = button(this, W / 2, y, pw - 60, 54, `SOUND ${Sound.muted ? 'OFF' : 'ON'}`, () => {
      const muted = Sound.toggleMute();
      snd.text.setText(`SOUND ${muted ? 'OFF' : 'ON'}`);
      snd.icon.setTexture(muted ? 'iconMute' : 'iconSound');
    }, { icon: Sound.muted ? 'iconMute' : 'iconSound' });
    y += 68;
    button(this, W / 2, y, pw - 60, 54, 'LEVELS', () => this.goto('LevelSelect'));
    if (!isTouchDevice()) label(this, W / 2, top + ph + 30, 'P / ESC TO RESUME', { size: 14, color: CSS.muted, letterSpacing: 2 });

    this.input.keyboard.on('keydown-P', () => this.resume());
    this.input.keyboard.on('keydown-ESC', () => this.resume());
  }

  resume() {
    this.scene.stop();
    this.scene.resume('Play');
  }

  goto(key, data) {
    this.scene.stop('Play');
    this.scene.start(key, data); // also closes this pause menu
  }
}
