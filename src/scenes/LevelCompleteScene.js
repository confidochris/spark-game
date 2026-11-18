import { sized } from '../systems/textures.js';
// ============================================================================
//  LevelCompleteScene.js: stars, score, and the next chapter of the story
// ============================================================================
import Phaser from 'phaser';
import { COLORS, CSS } from '../config.js';
import { LEVELS } from '../levels.js';
import { label, button, panel, menuBackground, restartOnResize, centerVertically } from '../ui/widgets.js';
import { Sound } from '../systems/sound.js';
import { formatTime, prefersReducedMotion, view, setupCamera } from '../systems/layout.js';

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelComplete');
  }

  init(data) {
    this.result = data;
  }

  create() {
    setupCamera(this);
    const r = this.result;
    const level = LEVELS[r.levelIndex];
    const isLast = r.levelIndex >= LEVELS.length - 1;
    const { width: W, height: H } = view(this);
    const portrait = H > W;
    const reduced = prefersReducedMotion();
    menuBackground(this);
    restartOnResize(this, r);
    const first = this.children.list.length; // everything after this gets centered

    // Two columns on wide screens, one tall column on phones
    const colW = portrait ? Math.min(W - 40, 480) : Math.min((W - 60) / 2, 440);
    const leftX = portrait ? W / 2 : W / 2 - colW / 2 - 10;
    const rightX = portrait ? W / 2 : W / 2 + colW / 2 + 10;

    // ---- Results ------------------------------------------------------------------
    let y = portrait ? 64 : 52;
    const burst = this.add.image(leftX, y + 96, 'sunburst').setScale(0.9).setAlpha(0.45);
    if (!reduced) this.tweens.add({ targets: burst, angle: 360, duration: 20000, repeat: -1 });
    label(this, leftX, y, `LEVEL ${r.levelIndex + 1} · KEYHOLE UNLOCKED`, { size: 15, color: CSS.lime, letterSpacing: 2 });
    y += 40;
    label(this, leftX, y, level.name, { size: 32, heading: true, wrap: colW });
    y += 72;

    // stars pop in one by one
    const starLabels = ['UNLOCKED', 'ALL GIFTS', `UNDER ${formatTime(r.par)}`];
    r.stars.forEach((earned, i) => {
      const sx = leftX + (i - 1) * 104;
      sized(this.add.image(sx, y, 'starEmpty'), 64, 64);
      label(this, sx, y + 46, starLabels[i], { size: 13, color: earned ? CSS.gold : '#7E9688', letterSpacing: 1 });
      if (earned) {
        const st = sized(this.add.image(sx, y, 'star'), 64, 64).setAlpha(0);
        const sc = st.scaleX;
        st.setScale(sc * 2.2);
        this.tweens.add({
          targets: st,
          alpha: 1,
          scaleX: sc,
          scaleY: sc,
          duration: reduced ? 1 : 380,
          delay: 350 + i * 320,
          ease: 'Back.easeOut',
          onStart: () => Sound.star(i),
        });
      }
    });
    y += 96;

    // stat rows
    const rows = [
      ['TIME', r.calm ? `${formatTime(r.time)} (CALM)` : formatTime(r.time)],
      ['GIFTS', `${r.gifts} / ${r.totalGifts}`],
      ['DATA DOTS', String(r.dots)],
      ['SCORE', r.score.toLocaleString()],
    ];
    const g = this.add.graphics();
    const statH = rows.length * 34 + 16;
    panel(g, leftX - colW / 2, y - 8, colW, statH, { radius: 14, alpha: 0.85 });
    rows.forEach(([k, v], i) => {
      const ry = y + 12 + i * 34;
      label(this, leftX - colW / 2 + 20, ry, k, { size: 16, color: CSS.muted, originX: 0, letterSpacing: 1.5 });
      label(this, leftX + colW / 2 - 20, ry, v, { size: 19, color: k === 'SCORE' ? CSS.gold : CSS.cream, originX: 1 });
    });
    if (r.records?.isBestTime) {
      const badge = label(this, leftX + colW / 2 - 10, y - 14, 'NEW BEST TIME!', { size: 14, color: CSS.deep, originX: 1, letterSpacing: 1 });
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.lime, 1);
      bg.fillRoundedRect(badge.x - badge.width - 12, badge.y - 13, badge.width + 24, 26, 13);
      badge.setDepth(1);
    }
    y += statH + 18;

    // ---- Story card -------------------------------------------------------------------
    let sy = portrait ? y : 92;
    const story = { ...level.story, text: level.story.text + (r.distinction ? '\n\n✦ ' + r.distinction : '') };
    const cardX = rightX - colW / 2;
    const text = label(this, rightX, 0, story.text, { size: 18, color: CSS.soft, bold: false, wrap: colW - 44, align: 'left', lineSpacing: 6 }).setDepth(2);
    const cardH = text.height + 110;
    const cg = this.add.graphics();
    panel(cg, cardX, sy, colW, cardH, { radius: 18, alpha: 0.96, stroke: COLORS.gold, strokeAlpha: 0.55 });
    cg.fillStyle(COLORS.gold, 1);
    cg.fillRoundedRect(cardX, sy + 18, 6, cardH - 36, 3);
    label(this, cardX + 24, sy + 30, `THE STORY · ${story.kicker}`, { size: 13, color: CSS.lime, originX: 0, letterSpacing: 2 });
    label(this, cardX + 24, sy + 62, story.title, { size: 24, heading: true, italic: true, color: CSS.gold, originX: 0 });
    text.setOrigin(0, 0).setPosition(cardX + 24, sy + 88);
    sy += cardH + 22;

    // ---- Buttons ----------------------------------------------------------------------------
    const by = portrait ? Math.max(sy + 30, y + cardH + 52) : Math.max(sy, y) + 34;
    const bY = Math.min(by, H - 110);
    const next = () => {
      this.scene.start('Mentor', { levelIndex: r.levelIndex });
    };
    button(this, W / 2, bY, Math.min(W - 40, 340), 62, 'OPEN FIELD NOTES', next, { primary: true, size: 22 });
    const half = Math.min((W - 52) / 2, 164);
    button(this, W / 2 - half / 2 - 6, bY + 76, half, 52, 'RETRY', () => this.scene.start('Play', { levelIndex: r.levelIndex }), { icon: 'iconRestart', size: 18 });
    button(this, W / 2 + half / 2 + 6, bY + 76, half, 52, 'LEVELS', () => this.scene.start('LevelSelect'), { size: 18 });

    centerVertically(this, first, portrait ? 40 : 30, bY + 76 + 36);

    this.input.keyboard.on('keydown-ENTER', next);
    this.input.keyboard.on('keydown-SPACE', next);
    this.input.keyboard.on('keydown-R', () => this.scene.start('Play', { levelIndex: r.levelIndex }));
  }
}
