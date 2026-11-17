import { sized } from '../systems/textures.js';
import { Save } from '../systems/save.js';
// ============================================================================
//  Ghost.js: records your route, and replays your best one
// ----------------------------------------------------------------------------
//  While you play, Spark's position is saved 10 times a second. If you set a
//  new best time, that route is saved. Next time, a see-through "ghost" Spark
//  follows your best route so you can race yourself.
// ============================================================================
const STEP = 0.1; // seconds between saved points

export class GhostRecorder {
  constructor() {
    this.points = [];
    this.t = 0;
  }
  update(dt, x, y) {
    this.t += dt;
    while (this.t >= STEP) {
      this.t -= STEP;
      this.points.push(Math.round(x), Math.round(y));
    }
  }
  /** Points as a flat list: [x0, y0, x1, y1, ...] (small enough to save). */
  data() {
    return this.points.length <= 6000 ? this.points.slice() : null;
  }
}

export class GhostPlayer {
  constructor(scene, points) {
    this.points = points;
    this.time = 0;
    this.sprite = sized(scene.add.image(points[0], points[1], `face-${Save.settings.character || 'chris'}`), 34).setDepth(11.5).setAlpha(0.35);
  }
  update(dt, running) {
    if (!running) return;
    this.time += dt;
    const i = this.time / STEP;
    const a = Math.floor(i);
    const n = this.points.length / 2;
    if (a >= n - 1) {
      // the ghost has finished: fade it away
      this.sprite.setAlpha(Math.max(0, this.sprite.alpha - dt));
      return;
    }
    const f = i - a;
    const x = this.points[a * 2] + (this.points[a * 2 + 2] - this.points[a * 2]) * f;
    const y = this.points[a * 2 + 1] + (this.points[a * 2 + 3] - this.points[a * 2 + 1]) * f;
    this.sprite.setPosition(x, y);
  }
  destroy() {
    this.sprite.destroy();
  }
}
