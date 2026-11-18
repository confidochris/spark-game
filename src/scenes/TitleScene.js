// ============================================================================
//  TitleScene.js: the start screen
// ============================================================================
import { challenge } from '../fieldwork.js';
import Phaser from 'phaser';
import { CHARACTERS, CSS, GAME_TITLE, GAME_SUBTITLE } from '../config.js';
import { label, button, menuBackground, restartOnResize } from '../ui/widgets.js';
import { Save } from '../systems/save.js';
import { Sound } from '../systems/sound.js';
import { prefersReducedMotion, isTouchDevice, view, setupCamera } from '../systems/layout.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    setupCamera(this);
    const { width: W, height: H } = view(this);
    const portrait = H > W;
    const reduced = prefersReducedMotion();
    menuBackground(this);
    restartOnResize(this);

    // ---- The hero: Spark in a sunburst -----------------------------------------
    const heroY = portrait ? H * 0.25 : 108;
    const burst = this.add.image(W / 2, heroY, 'sunburst').setScale(portrait ? 1.25 : 0.72).setAlpha(0.9);
    if (!reduced) this.tweens.add({ targets: burst, angle: 360, duration: 30000, repeat: -1 });
    this.add.image(W / 2, heroY, 'glow').setScale(1.6).setAlpha(0.35).setTint(0xe9fad2);
    const heroScale = portrait ? 2.2 : 1.7;
    const spark = this.add.image(W / 2, heroY, 'spark').setScale(heroScale);
    const ring = this.add.image(W / 2, heroY, 'sparkRing').setScale(heroScale).setAngle(-25);
    if (!reduced) {
      this.tweens.add({ targets: [spark], scale: heroScale * 1.1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ring, angle: 335, duration: 6000, repeat: -1 });
    }

    // a few drifting data dots
    for (let i = 0; i < 14; i++) {
      const d = this.add.image(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(20, H - 20), 'dot').setAlpha(0.5);
      if (!reduced) this.tweens.add({ targets: d, y: d.y - 40, alpha: 0, duration: Phaser.Math.Between(3000, 6000), repeat: -1, delay: i * 300 });
    }

    // ---- Title text ------------------------------------------------------------------
    let y = heroY + (portrait ? 150 : 104);
    label(this, W / 2, y, GAME_TITLE, { size: portrait ? 84 : 72, heading: true, color: CSS.gold, letterSpacing: 10 }).setStroke('#051C12', 8);
    y += portrait ? 66 : 52;
    label(this, W / 2, y, GAME_SUBTITLE.toUpperCase(), { size: portrait ? 20 : 18, color: CSS.cream, letterSpacing: 3 });
    y += portrait ? 40 : 30;
    label(this, W / 2, y, 'Six mazes. Five neighbors. One question about depression.', {
      size: 17,
      color: CSS.muted,
      bold: false,
      wrap: Math.min(W - 60, 440),
    });

    // ---- Buttons -----------------------------------------------------------------------
    y += portrait ? 70 : 56;
    const hasProgress = Save.unlocked > 1 || Save.level('seed');
    button(this, W / 2, y, 280, 64, hasProgress ? 'PLAY' : 'START', () => this.play(), { primary: true, size: 26 });
    y += portrait ? 84 : 70;

    // settings toggles in a row
    const s = Save.settings;
    const toggles = [
      { key: 'muted', on: () => !s.muted, text: (on) => `SOUND ${on ? 'ON' : 'OFF'}`, act: () => Sound.toggleMute() },
      { key: 'calm', on: () => s.calm, text: (on) => `CALM ${on ? 'ON' : 'OFF'}`, act: () => Save.setSetting('calm', !s.calm) },
    ];
    const bw = portrait ? 156 : 160;
    const toggleY = y;
    toggles.forEach((t, i) => {
      const bx = W / 2 + (i - (portrait ? 0.5 : 1)) * (bw + 12);
      const b = button(this, bx, y, bw, 52, t.text(t.on()), () => {
        t.act();
        b.text.setText(t.text(t.on()));
        this.updateHelp();
      }, { size: 17 });
    });
    y += portrait ? 54 : 42;
    this.help = label(this, W / 2, y, '', { size: 14, color: CSS.muted, bold: false, wrap: W - 60 });
    this.updateHelp();

    // Character choice: under the toggles on phones, beside them on wide screens
    const who = s.badge ? 'BADGE' : 'CHOOSE';
    const pickChar = () => this.scene.start('CharacterSelect', { returnTo: 'Title' });
    if (portrait) button(this, W / 2, y + 62, 280, 46, `PLAYER: ${who}`, pickChar, { size: 17 });
    else button(this, W / 2 + (bw + 12), toggleY, bw, 52, who, pickChar, { size: 17, icon: s.character ? `face-${s.character}` : null, iconSize: 34 });

    // ---- How to play + footer --------------------------------------------------------------
    const how = isTouchDevice()
      ? 'Swipe or use the pad to steer. Find every discovery, then reach the keyhole.'
      : 'Arrow keys or WASD to steer · P pause · R restart · M sound';
    label(this, W / 2, H - (portrait ? 92 : 58), how, { size: 15, color: CSS.soft, bold: false, wrap: W - 60 });
    label(this, W / 2, H - (portrait ? 44 : 28), 'A FOUNDATION OF HOPE GAME · 2026 ANNUAL FUND', {
      size: 13,
      color: CSS.lime,
      letterSpacing: 2,
    });

    // Enter / Space starts the game too
    this.input.keyboard.on('keydown-ENTER', () => this.play());
    this.input.keyboard.on('keydown-SPACE', () => this.play());
    this.input.once('pointerdown', () => Sound.unlock());
    this.input.keyboard.once('keydown', () => Sound.unlock());
    Sound.startMusic();
  }

  updateHelp() {
    const s = Save.settings;
    const lines = [];
    if (s.calm) lines.push('Calm mode: unlimited lives, slower Static, and light never runs out.');
    else lines.push('Three hearts for the run. Find heart pickups to earn extra lives.');
    this.help.setText(lines.join(' '));
  }

  play() {
    Sound.unlock();
    if (Save.settings.badge && CHARACTERS.some(c => c.id === Save.settings.character)) {
      this.scene.start('Play', { levelIndex: 0 });
      return;
    }
    this.scene.start('CharacterSelect', { returnTo: null });
  }
}
