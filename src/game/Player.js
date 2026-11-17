// ============================================================================
//  Player.js: Spark, and how it glides through the maze
// ----------------------------------------------------------------------------
//  Spark moves square by square ("grid movement"), but slides smoothly
//  between squares. That means it can never snag on a corner.
//
//  How steering works (a bit like Pac-Man):
//   - Press a direction and Spark sets off. You can press the next turn
//     early; Spark remembers it and turns at the first chance.
//   - Keep holding to keep going. Let go and Spark glides on to the next
//     junction (a place where it could turn) and waits there.
//   - In a corridor with a single bend, Spark follows the bend by itself.
// ============================================================================
import { Save } from '../systems/save.js';
import { sized } from '../systems/textures.js';
import { TILE, PLAYER, FACE_SIZE } from '../config.js';

export class Player {
  constructor(scene, maze, startX, startY) {
    this.scene = scene;
    this.maze = maze;
    this.tx = startX; // the square Spark is on (or just leaving)
    this.ty = startY;
    this.dir = null; // current direction, e.g. { x: 1, y: 0 }
    this.queued = null; // the next direction the player asked for
    this.held = null; // direction currently held down (keys / d-pad)
    this.progress = 0; // 0..1, how far toward the next square
    this.speed = PLAYER.speed; // squares per second
    this.stun = 0; // seconds left being dazed
    this.safe = 0; // seconds left of protection after a hit
    this.moved = false; // has the player moved yet? (the timer waits for this)
    this.onArrive = null; // called with (x, y) each time Spark reaches a square
    this.onBump = null; // called when Spark tries to move into a wall

    const p = maze.toPixel(startX, startY);
    this.x = p.x;
    this.y = p.y;

    // What you see: a soft glow, the star, and a spinning gold ring
    this.glow = scene.add.image(p.x, p.y, 'glow').setDepth(6).setAlpha(0.35).setTint(0xe9fad2).setScale(0.75);
    const key = `face-${Save.settings.character || 'chris'}`;
    this.sprite = sized(scene.add.image(p.x, p.y, scene.textures.exists(key) ? key : 'spark'), FACE_SIZE).setDepth(7);
    this.baseScale = this.sprite.scaleX;
    this.rim = sized(scene.add.image(p.x, p.y, 'faceRim'), 42).setDepth(6.9);
    this.ring = sized(scene.add.image(p.x, p.y, 'sparkRing'), 50).setDepth(7.1).setAngle(-25).setAlpha(0.8);

  }

  /** Ask Spark to go a direction (from a key, swipe or d-pad). */
  request(dir) {
    if (!dir) return;
    this.queued = dir;
    this.queuedAge = 0;
  }

  /** Tell Spark which direction is being held (or null). */
  hold(dir) {
    this.held = dir;
    if (dir) this.request(dir);
  }

  canGo(dir, fromX = this.tx, fromY = this.ty) {
    return !!dir && this.maze.canEnter(fromX + dir.x, fromY + dir.y, 'player');
  }

  isOpposite(a, b) {
    return a && b && a.x === -b.x && a.y === -b.y;
  }

  /** A junction is a square where Spark could turn off to the side. */
  isJunction(x, y, dir) {
    return this.maze.openDirs(x, y).filter((d) => !this.isOpposite(d, dir) && !(d.x === dir.x && d.y === dir.y)).length > 0;
  }

  /** The square Spark is heading into (or standing on). */
  get targetTile() {
    if (!this.dir) return { x: this.tx, y: this.ty };
    return { x: this.tx + this.dir.x, y: this.ty + this.dir.y };
  }

  /** Is Spark on (or moving into) square (x, y)? Used so doors don't shut on it. */
  occupies(x, y) {
    const t = this.targetTile;
    return (this.tx === x && this.ty === y) || (t.x === x && t.y === y);
  }

  /** Knocked back by Static: slide back to the square we came from. */
  knockBack() {
    if (this.dir && this.progress > 0) {
      // reverse in place: we are between two squares
      this.tx += this.dir.x;
      this.ty += this.dir.y;
      this.progress = 1 - this.progress;
      this.dir = { x: -this.dir.x, y: -this.dir.y };
    } else {
      this.dir = null;
      this.progress = 0;
    }
    this.queued = null;
    this.stun = PLAYER.stunTime;
    this.safe = PLAYER.safeTime;
  }

  /** Lost a life: jump back to the start square, protected for a moment. */
  respawn(x, y, safeTime) {
    this.tx = x;
    this.ty = y;
    this.dir = null;
    this.queued = null;
    this.progress = 0;
    this.stun = 0;
    this.safe = safeTime;
    this.render();
  }

  setVisible(v) {
    [this.sprite, this.ring, this.rim, this.glow].forEach((o) => o.setVisible(v));
  }

  update(dt) {
    if (this.safe > 0) this.safe -= dt;
    if (this.queued) {
      this.queuedAge += dt;
      // a remembered turn is forgotten if Spark is standing still and can't take it
      if (!this.dir && this.queuedAge > 0.25 && !this.held) this.queued = null;
    }

    if (this.stun > 0) {
      this.stun -= dt;
      // still finish sliding back to the square during the daze
      if (this.dir) this.advance(dt * 0.6, true);
      this.render();
      return;
    }

    if (!this.dir) {
      // Standing still: start moving if there's a direction to go
      const want = this.queued || this.held;
      if (want) {
        if (this.canGo(want)) {
          this.dir = want;
          this.queued = null;
          this.progress = 0;
          this.moved = true;
        } else if (this.queuedAge < 0.02 && this.onBump) {
          this.onBump();
        }
      }
    } else if (this.queued && this.isOpposite(this.queued, this.dir)) {
      // Turning around is allowed at any moment
      this.tx += this.dir.x;
      this.ty += this.dir.y;
      this.progress = 1 - this.progress;
      this.dir = this.queued;
      this.queued = null;
    }

    if (this.dir) this.advance(dt, false);
    this.render();
  }

  advance(dt, dazed) {
    // If the square ahead shut (a door closed), stop where we are.
    const ahead = this.targetTile;
    if (!this.maze.canEnter(ahead.x, ahead.y, 'player') && this.progress < 0.5) {
      this.progress = Math.max(0, this.progress - dt * this.speed);
      if (this.progress === 0) this.dir = null;
      return;
    }
    this.progress += dt * this.speed;
    while (this.dir && this.progress >= 1) {
      this.progress -= 1;
      this.tx += this.dir.x;
      this.ty += this.dir.y;
      if (this.onArrive) this.onArrive(this.tx, this.ty);
      if (dazed) {
        this.dir = null;
        this.progress = 0;
        break;
      }
      this.chooseNext();
    }
  }

  /** Spark just reached the middle of a square: where next? */
  chooseNext() {
    const dir = this.dir;
    if (this.queued && this.canGo(this.queued)) {
      this.dir = this.queued;
      this.queued = null;
      return;
    }
    const forwardOpen = this.canGo(dir);
    const holding = this.held && this.held.x === dir.x && this.held.y === dir.y;
    if (forwardOpen && (holding || !this.isJunction(this.tx, this.ty, dir))) return; // keep going
    if (!forwardOpen) {
      // Follow a single bend in a corridor automatically
      const sides = this.maze.openDirs(this.tx, this.ty).filter((d) => !this.isOpposite(d, dir));
      if (sides.length === 1 && !this.held) {
        this.dir = sides[0];
        return;
      }
      if (sides.length === 1 && this.held && !this.canGo(this.held)) {
        this.dir = sides[0];
        return;
      }
    }
    // Stop and wait for the player's next choice
    this.dir = null;
    this.progress = 0;
  }

  /** Put the pictures where Spark is. */
  render() {
    const from = this.maze.toPixel(this.tx, this.ty);
    if (this.dir) {
      this.x = from.x + this.dir.x * this.progress * TILE;
      this.y = from.y + this.dir.y * this.progress * TILE;
    } else {
      this.x = from.x;
      this.y = from.y;
    }
    this.sprite.setPosition(this.x, this.y - (this.scene.reducedMotion ? 0 : Math.sin(this.scene.time.now / 240) * 1.2));
    this.ring.setPosition(this.x, this.y);
    this.rim.setPosition(this.x, this.y);
    this.glow.setPosition(this.x, this.y);
    this.ring.angle += 2.2;
    // blink while protected after a hit
    const blink = this.safe > 0 && Math.floor(this.safe * 10) % 2 === 0;
    this.sprite.setAlpha(blink ? 0.35 : 1);
    this.ring.setAlpha(blink ? 0.3 : 0.8);
    this.rim.setAlpha(blink ? 0.3 : 1);
  }

  destroy() {
    this.sprite.destroy();
    this.ring.destroy();
    this.rim.destroy();
    this.glow.destroy();
  }
}
