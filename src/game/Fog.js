// ============================================================================
//  Fog.js: the darkness, and Spark's circle of light
// ----------------------------------------------------------------------------
//  Two layers work together:
//   1. "memory": a dark sheet over the whole maze. Places Spark has already
//      lit stay a little brighter, so you can remember the way. (What you
//      learn stays learned.)
//   2. "fog": what you actually see. Every frame it copies the memory sheet,
//      then erases a soft circle of light around Spark.
//
//  Phaser 4 note: drawing on a RenderTexture / DynamicTexture is saved up in
//  a list. Nothing appears until you call .render().
// ============================================================================
import Phaser from 'phaser';
import { TILE, COLORS } from '../config.js';

let fogId = 0;

export class Fog {
  constructor(scene, maze, { fogAlpha, memoryAlpha }) {
    this.scene = scene;
    this.maze = maze;
    this.memoryKey = `fog-memory-${++fogId}`;
    this.memoryAlpha = memoryAlpha;
    this.seen = new Set();

    // pad the fog a little past the maze edges so the border is dark too
    this.pad = TILE;
    const w = maze.width + this.pad * 2;
    const h = maze.height + this.pad * 2;

    this.memory = scene.textures.addDynamicTexture(this.memoryKey, w, h);
    this.memory.fill(COLORS.fog, fogAlpha);
    this.memory.render();

    this.layer = scene.add.renderTexture(-this.pad, -this.pad, w, h).setOrigin(0, 0).setDepth(10);

    // how much a "seen" square lifts the memory fog (0..1)
    this.liftAlpha = 1 - memoryAlpha / fogAlpha;
  }

  /** Mark squares within `radius` pixels of (px, py) as seen. */
  reveal(px, py, radius) {
    const r = radius * 0.8;
    const x0 = Math.floor((px - r) / TILE);
    const x1 = Math.floor((px + r) / TILE);
    const y0 = Math.floor((py - r) / TILE);
    const y1 = Math.floor((py + r) / TILE);
    let changed = false;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (x < -1 || y < -1 || x > this.maze.cols || y > this.maze.rows) continue;
        const k = `${x},${y}`;
        if (this.seen.has(k)) continue;
        const cx = x * TILE + TILE / 2;
        const cy = y * TILE + TILE / 2;
        if (Math.hypot(cx - px, cy - py) > r) continue;
        this.seen.add(k);
        this.memory.stamp('memoryBrush', null, cx + this.pad, cy + this.pad, {
          alpha: this.liftAlpha,
          blendMode: Phaser.BlendModes.ERASE,
        });
        changed = true;
      }
    }
    if (changed) this.memory.render();
  }

  /** Redraw what the player sees: memory, minus a light circle at Spark. */
  draw(px, py, radius) {
    const scale = radius / 128; // the light brush picture is 256 wide (radius 128)
    this.layer.clear();
    this.layer.stamp(this.memoryKey, null, 0, 0, { originX: 0, originY: 0 });
    this.layer.stamp('lightBrush', null, px + this.pad, py + this.pad, {
      scale,
      blendMode: Phaser.BlendModes.ERASE,
    });
    this.layer.render();
  }

  /** Lift all the fog at once (used when the level is finished). */
  clearAll(duration = 800) {
    this.scene.tweens.add({ targets: this.layer, alpha: 0, duration });
  }

  destroy() {
    this.layer.destroy();
    if (this.scene.textures.exists(this.memoryKey)) this.scene.textures.remove(this.memoryKey);
  }
}
