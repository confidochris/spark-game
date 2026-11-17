// ============================================================================
//  LevelSelectScene.js: choose a level (locked ones show a padlock)
// ============================================================================
import Phaser from 'phaser';
import { COLORS, CSS } from '../config.js';
import { LEVELS } from '../levels.js';
import { label, button, panel, starRow, menuBackground, restartOnResize } from '../ui/widgets.js';
import { Save } from '../systems/save.js';
import { formatTime, view, setupCamera } from '../systems/layout.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create() {
    setupCamera(this);
    const { width: W, height: H } = view(this);
    const portrait = H > W;
    menuBackground(this);
    restartOnResize(this);

    label(this, W / 2, portrait ? 60 : 40, 'THE FUNDING PATH', { size: 15, color: CSS.lime, letterSpacing: 3 });
    label(this, W / 2, portrait ? 100 : 76, 'Choose a level', { size: 34, heading: true });
    label(this, W / 2, portrait ? 140 : 108, `★ ${Save.totalStars()} / ${LEVELS.length * 3} STARS`, { size: 17, color: CSS.gold, letterSpacing: 2 });

    const cols = portrait ? 2 : 3;
    const gap = 14;
    const cardW = Math.min(portrait ? (W - 36 - gap) / 2 : 270, 270);
    const cardH = portrait ? 170 : 150;
    const rows = Math.ceil(LEVELS.length / cols);
    const gridW = cols * cardW + (cols - 1) * gap;
    const top = portrait ? 172 : 132;
    const x0 = (W - gridW) / 2;

    LEVELS.forEach((lvl, i) => {
      const cx = x0 + (i % cols) * (cardW + gap);
      const cy = top + Math.floor(i / cols) * (cardH + gap);
      const unlocked = i < Save.unlocked;
      const rec = Save.level(lvl.id);
      const g = this.add.graphics();
      panel(g, cx, cy, cardW, cardH, {
        radius: 16,
        fill: unlocked ? COLORS.deep : 0x041a10,
        stroke: unlocked ? COLORS.gold : COLORS.soft,
        strokeAlpha: unlocked ? 0.55 : 0.15,
      });
      label(this, cx + 16, cy + 24, `${i + 1} · ${lvl.stage}`, { size: 14, color: unlocked ? CSS.lime : '#56715F', originX: 0, letterSpacing: 2 });
      label(this, cx + 16, cy + 58, lvl.name, {
        size: 20,
        heading: true,
        originX: 0,
        color: unlocked ? CSS.cream : '#56715F',
        wrap: cardW - 30,
      });
      if (unlocked) {
        starRow(this, cx + 58, cy + cardH - 52, rec?.stars || 0, 28, 6);
        label(this, cx + cardW - 16, cy + cardH - 52, rec?.bestTime != null ? formatTime(rec.bestTime) : 'NEW', {
          size: 16,
          color: rec ? CSS.soft : CSS.gold,
          originX: 1,
        });
        label(this, cx + 16, cy + cardH - 22, `PAR ${formatTime(lvl.par)}`, { size: 13, color: CSS.muted, originX: 0, letterSpacing: 1 });
        const zone = this.add.zone(cx + cardW / 2, cy + cardH / 2, cardW, cardH).setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => this.scene.start('Play', { levelIndex: i }));
        zone.on('pointerover', () => g.setAlpha(0.8));
        zone.on('pointerout', () => g.setAlpha(1));
      } else {
        this.add.image(cx + cardW - 34, cy + cardH - 44, 'lock').setScale(0.55).setAlpha(0.5);
        label(this, cx + 16, cy + cardH - 30, 'LOCKED', { size: 14, color: '#56715F', originX: 0, letterSpacing: 2 });
      }
    });

    const by = top + rows * (cardH + gap) + (portrait ? 40 : 26);
    button(this, W / 2, Math.min(by, H - 50), 220, 56, 'BACK', () => this.scene.start('Title'));
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Title'));
    // number keys jump straight to a level
    this.input.keyboard.on('keydown', (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= LEVELS.length && n <= Save.unlocked) this.scene.start('Play', { levelIndex: n - 1 });
    });
  }
}
