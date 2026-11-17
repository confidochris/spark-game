// ============================================================================
//  StaticBlob.js: "noisy data" that drifts through the corridors
// ----------------------------------------------------------------------------
//  Static wanders: at each square it picks a random way to go, but it avoids
//  turning straight back unless it hits a dead end. Touching it is a setback,
//  never a "game over": Spark's light dims and Spark is pushed back.
// ============================================================================
import { TILE, HAZARDS } from '../config.js';

export class StaticBlob {
  constructor(scene, maze, x, y, rng, speedFactor = 1) {
    this.scene = scene;
    this.maze = maze;
    this.rng = rng; // a seeded random generator, so each level behaves the same way
    this.tx = x;
    this.ty = y;
    this.dir = null;
    this.progress = 0;
    this.speed = (scene.level.staticSpeed ?? HAZARDS.staticSpeed) * speedFactor;
    this.frame = 0;
    this.frameTime = 0;
    const p = maze.toPixel(x, y);
    this.x = p.x;
    this.y = p.y;
    this.sprite = scene.add.image(p.x, p.y, 'static0').setDepth(5);
    // A faint shimmer drawn above the fog, so you can sense Static nearby
    this.hint = scene.add.image(p.x, p.y, 'static0').setDepth(11).setAlpha(0.16);
    this.pickDir();
  }

  pickDir() {
    const options = this.maze.openDirs(this.tx, this.ty, 'static');
    if (!options.length) {
      this.dir = null;
      return;
    }
    const forward = options.filter((d) => !this.dir || !(d.x === -this.dir.x && d.y === -this.dir.y));
    const pool = forward.length ? forward : options;
    this.dir = pool[Math.floor(this.rng() * pool.length)];
  }

  /** Turn around (after bumping into Spark). */
  reverse() {
    if (!this.dir) return;
    this.tx += this.dir.x;
    this.ty += this.dir.y;
    this.progress = 1 - this.progress;
    this.dir = { x: -this.dir.x, y: -this.dir.y };
  }

  update(dt) {
    // flicker between the 4 static pictures
    this.frameTime += dt;
    if (this.frameTime > 0.08) {
      this.frameTime = 0;
      this.frame = (this.frame + 1) % 4;
      this.sprite.setTexture(`static${this.frame}`);
      this.hint.setTexture(`static${this.frame}`);
    }
    if (!this.dir) {
      this.pickDir();
    } else {
      this.progress += dt * this.speed;
      if (this.progress >= 1) {
        this.progress -= 1;
        this.tx += this.dir.x;
        this.ty += this.dir.y;
        this.pickDir();
        if (!this.dir) this.progress = 0;
      }
    }
    const p = this.maze.toPixel(this.tx, this.ty);
    this.x = p.x + (this.dir ? this.dir.x * this.progress * TILE : 0);
    this.y = p.y + (this.dir ? this.dir.y * this.progress * TILE : 0);
    this.sprite.setPosition(this.x, this.y);
    this.hint.setPosition(this.x, this.y);
  }

  destroy() {
    this.sprite.destroy();
    this.hint.destroy();
  }
}
