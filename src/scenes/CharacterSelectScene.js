// Choose a face. The setting is shared by the player and the ghost.
import { challenge } from '../fieldwork.js';
import Phaser from 'phaser';
import { CHARACTERS, CSS, COLORS } from '../config.js';
import { Save } from '../systems/save.js';
import { Sound } from '../systems/sound.js';
import { sized } from '../systems/textures.js';
import { view, setupCamera } from '../systems/layout.js';
import { label, button, menuBackground, panel, restartOnResize } from '../ui/widgets.js';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super('CharacterSelect'); }
  init(data) { this.returnTo = data?.returnTo; }
  create() {
    setupCamera(this);
    menuBackground(this);
    restartOnResize(this, { returnTo: this.returnTo });
    const { width: W, height: H } = view(this);
    const portrait = H > W;
    const top = portrait ? H * 0.24 : 60;
    label(this, W / 2, top, 'Choose your spark', { size: 42, heading: true, color: CSS.gold });
    label(this, W / 2, top + 54, 'Two friendly faces. One bright mission.', { size: 18, color: CSS.soft });
    const cw = Math.min(210, (W - 72) / 2);
    const cy = top + 206;
    for (const [i, c] of CHARACTERS.entries()) {
      const x = W / 2 + (i ? 1 : -1) * (cw / 2 + 12);
      const g = this.add.graphics();
      panel(g, x - cw / 2, cy - 100, cw, 260, { radius: 24, stroke: Save.settings.character === c.id ? COLORS.gold : COLORS.soft, strokeAlpha: 0.7 });
      this.add.image(x, cy - 8, 'glow').setAlpha(0.55).setTint(COLORS.gold);
      sized(this.add.image(x, cy - 18, `face-${c.id}`), cw - 40);
      button(this, x, cy + 110, cw - 24, 54, c.name, () => this.choose(c.id), { primary: true, size: 22 });
      this.add.zone(x, cy - 20, cw, 180).setInteractive({ useHandCursor: true }).on('pointerup', () => this.choose(c.id));
    }
    label(this, W / 2, cy + 211, 'You can change your character on the Title screen.', { size: 16, color: CSS.muted, bold: false, wrap: W - 60 });
    button(this, W / 2, Math.min(H - 48, cy + 280), 200, 44, 'BACK', () => this.scene.start('Title'), { size: 16 });
    this.input.keyboard.once('keydown-LEFT', () => this.choose('chris'));
    this.input.keyboard.once('keydown-RIGHT', () => this.choose('shelley'));
  }
  choose(id) {
    Save.setSetting('character', id);
    Sound.unlock(); Sound.click();
    if (this.returnTo) this.scene.start(this.returnTo);
    else if (challenge || (Save.unlocked <= 1 && !Save.level('seed'))) this.scene.start('Play', { levelIndex: 0 });
    else this.scene.start('LevelSelect');
  }
}
