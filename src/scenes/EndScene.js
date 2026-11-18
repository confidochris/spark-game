// ============================================================================
//  EndScene.js: "Discovery Unlocked", shown after the last level
// ----------------------------------------------------------------------------
//  The gold padlock springs open in a sunburst, confetti data dots fly, then
//  the real story and a gentle invitation to give. Giving never blocks play.
// ============================================================================
import Phaser from 'phaser';
import { COLORS, CSS, GIVE_URL } from '../config.js';
import { LEVELS, REAL_STORY } from '../levels.js';
import { label, button, panel, menuBackground, restartOnResize, centerVertically } from '../ui/widgets.js';
import { Save } from '../systems/save.js';
import { Sound } from '../systems/sound.js';
import { formatTime, prefersReducedMotion, view, setupCamera } from '../systems/layout.js';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create() {
    setupCamera(this);
    const { width: W, height: H } = view(this);
    const portrait = H > W;
    const reduced = prefersReducedMotion();
    menuBackground(this);
    restartOnResize(this);
    const first = this.children.list.length;

    // ---- The big moment ------------------------------------------------------------------
    const heroY = portrait ? 170 : 92;
    const burst = this.add.image(W / 2, heroY, 'sunburst').setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: burst, scale: portrait ? 1.35 : 0.72, alpha: 1, duration: reduced ? 400 : 1200, ease: 'Cubic.easeOut' });
    if (!reduced) this.tweens.add({ targets: burst, angle: 360, duration: 24000, repeat: -1 });
    const lockScale = portrait ? 1.6 : 1.15;
    const lock = this.add.image(W / 2, heroY, 'lock').setScale(lockScale);
    this.time.delayedCall(reduced ? 200 : 700, () => {
      lock.setTexture('lockOpen');
      if (!reduced) this.tweens.add({ targets: lock, scale: lockScale * 1.2, duration: 220, yoyo: true, ease: 'Back.easeOut' });
      Sound.finale();
      if (!reduced) this.confetti(W / 2, heroY + this.shift);
    });

    let y = heroY + (portrait ? 140 : 90);
    label(this, W / 2, y, 'DISCOVERY UNLOCKED', { size: portrait ? 34 : 32, heading: true, color: CSS.gold, letterSpacing: 2 }).setStroke('#051C12', 6);
    y += portrait ? 42 : 36;
    const total = LEVELS.reduce((sum, l) => sum + (Save.level(l.id)?.bestTime || 0), 0);
    label(this, W / 2, y, `★ ${Save.totalStars()} / ${LEVELS.length * 3} STARS  ·  BEST TOTAL ${formatTime(total)}`, {
      size: 17,
      color: CSS.cream,
      letterSpacing: 1.5,
    });
    y += portrait ? 36 : 26;

    // ---- The real story card -------------------------------------------------------------------
    const cw = Math.min(W - 40, 520);
    const text = label(this, W / 2, 0, REAL_STORY.text, { size: 18, color: CSS.soft, bold: false, wrap: cw - 48, align: 'left', lineSpacing: 6 }).setDepth(2);
    const ch = text.height + (portrait ? 86 : 74);
    const g = this.add.graphics();
    panel(g, W / 2 - cw / 2, y, cw, ch, { radius: 18, alpha: 0.96, stroke: COLORS.lime, strokeAlpha: 0.5 });
    label(this, W / 2 - cw / 2 + 24, y + 30, REAL_STORY.title.toUpperCase(), { size: 14, color: CSS.lime, originX: 0, letterSpacing: 2 });
    text.setOrigin(0, 0).setPosition(W / 2 - cw / 2 + 24, y + 54);
    y += ch + (portrait ? 46 : 38);

    // ---- Give (gentle, optional) and play again ------------------------------------------------------------
    const half = Math.min((W - 52) / 2, 200);
    button(this, W / 2 - half / 2 - 6, y, half, 54, 'PLAY AGAIN', () => this.scene.start('LevelSelect'), { primary: true, size: 18 });
    this.copyBtn = button(this, W / 2 + half / 2 + 6, y, half, 54, 'MY POSTER', () => this.scene.start('Mentor', { levelIndex: 5, poster: true }), { size: 18 });
    y += 60;
    const donate = label(this, W / 2, y, 'Support mental illness research ↗', { size: 16, color: CSS.muted, bold: false });
    donate.setPadding(8).setInteractive({ useHandCursor: true }).on('pointerup', () => this.give());
    this.shift = centerVertically(this, first, heroY - (portrait ? 130 : 86), y + 30);
    this.input.keyboard.on('keydown-ENTER', () => this.scene.start('LevelSelect'));
  }

  confetti(x, y) {
    const colors = [COLORS.gold, COLORS.lime, COLORS.sky, COLORS.cream];
    const em = this.add.particles(x, y, 'particle', {
      speed: { min: 180, max: 520 },
      angle: { min: 0, max: 360 },
      gravityY: 380,
      lifespan: 2200,
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      tint: colors,
      emitting: false,
    });
    em.explode(90);
    this.time.delayedCall(350, () => em.explode(60));
  }

  give() {
    // Opens the annual fund page in a new tab. The game keeps running.
    window.open(GIVE_URL, '_blank', 'noopener');
  }

  async copy() {
    const stars = Save.totalStars();
    const text = `I unlocked the discovery in Spark! ⭐ ${stars}/${LEVELS.length * 3} 🔓`;
    try {
      await navigator.clipboard.writeText(text);
      this.copyBtn.text.setText('COPIED!');
    } catch (err) {
      this.copyBtn.text.setText('NOT AVAILABLE');
    }
    this.time.delayedCall(1800, () => this.copyBtn?.text?.setText('COPY RESULT'));
  }
}
