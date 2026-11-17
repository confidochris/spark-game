import { sized } from '../systems/textures.js';
import { RES } from '../systems/layout.js';
// ============================================================================
//  Maze.js: turns a level's text map into walls, floor and items
// ----------------------------------------------------------------------------
//  It also answers questions the other pieces ask, like
//  "can Spark move into square (x, y) right now?"
// ============================================================================
import { TILE } from '../config.js';

// The four directions, as steps in x and y.
export const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
export const DIR_LIST = [DIRS.left, DIRS.right, DIRS.up, DIRS.down];

export class Maze {
  constructor(scene, level) {
    this.scene = scene;
    this.map = level.map;
    this.rows = this.map.length;
    this.cols = Math.max(...this.map.map((r) => r.length));
    this.width = this.cols * TILE;
    this.height = this.rows * TILE;

    this.start = { x: 1, y: 1 };
    this.exit = null;
    this.dots = new Map(); // "x,y" -> image
    this.gifts = []; // { x, y, sprite }
    this.clues = []; // { x, y, sprite }
    this.staticStarts = []; // { x, y }
    this.doors = []; // Closing Doors: { x, y, ... }
    this.gates = []; // numbered gates: { x, y, need, open, ... }
    this.floorCount = 0;

    this.build();
  }

  /** The letter at square (x, y). Outside the map counts as wall. */
  cell(x, y) {
    if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return '#';
    return this.map[y][x] ?? '#';
  }

  /** Center of square (x, y) in pixels. */
  toPixel(x, y) {
    return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 };
  }

  key(x, y) {
    return `${x},${y}`;
  }

  /** Is the square solid wall? (Doors and gates are checked separately.) */
  isWall(x, y) {
    return this.cell(x, y) === '#';
  }

  /**
   * Can something enter square (x, y) right now?
   * who = 'player' or 'static'. Static never enters doors, gates or the keyhole.
   */
  canEnter(x, y, who = 'player') {
    if (this.isWall(x, y)) return false;
    const door = this.doorAt(x, y);
    if (door && (who !== 'player' || door.closed)) return false;
    const gate = this.gateAt(x, y);
    if (gate && (who !== 'player' || !gate.open)) return false;
    if (this.exit && x === this.exit.x && y === this.exit.y) {
      return who === 'player' && this.exit.open;
    }
    return true;
  }

  doorAt(x, y) {
    return this.doors.find((d) => d.x === x && d.y === y) || null;
  }

  gateAt(x, y) {
    return this.gates.find((g) => g.x === x && g.y === y) || null;
  }

  /** Squares next to (x, y) that can be entered, as direction objects. */
  openDirs(x, y, who = 'player') {
    return DIR_LIST.filter((d) => this.canEnter(x + d.x, y + d.y, who));
  }

  /** Read the text map and create everything you can see. */
  build() {
    const s = this.scene;
    // Floor: one repeating picture under the whole maze
    s.add.tileSprite(0, 0, this.width, this.height, 'floor').setOrigin(0, 0).setDepth(0);

    let doorIndex = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const c = this.cell(x, y);
        const p = this.toPixel(x, y);
        if (c === '#') {
          s.add.image(p.x, p.y, 'wall').setDepth(1);
          continue;
        }
        this.floorCount++;
        switch (c) {
          case 'S':
            this.start = { x, y };
            break;
          case '.': {
            const dot = s.add.image(p.x, p.y, 'dot').setDepth(2);
            this.dots.set(this.key(x, y), dot);
            break;
          }
          case '$': {
            const sprite = s.add.image(p.x, p.y, 'gift').setDepth(3);
            s.tweens.add({ targets: sprite, y: p.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: (x + y) * 60 });
            this.gifts.push({ x, y, sprite });
            break;
          }
          case 'K': {
            const sprite = s.add.image(p.x, p.y, 'clue').setDepth(3);
            s.tweens.add({ targets: sprite, scale: 1.12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            this.clues.push({ x, y, sprite });
            break;
          }
          case 'N':
            this.staticStarts.push({ x, y });
            break;
          case 'C': {
            const sprite = s.add.image(p.x, p.y, 'doorOpen').setDepth(4);
            const count = s.add
              .text(p.x, p.y, '', { fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#F2C14E', resolution: RES })
              .setOrigin(0.5)
              .setDepth(4.1);
            // Doors take turns: each one starts a bit later than the last.
            this.doors.push({ x, y, sprite, count, closed: false, timer: doorIndex * 1.3, index: doorIndex });
            doorIndex++;
            break;
          }
          case 'E':
            this.exit = { x, y, open: false };
            break;
          default:
            if (/[1-9]/.test(c)) {
              const sprite = s.add.image(p.x, p.y, 'gate').setDepth(4);
              const lock = sized(s.add.image(p.x, p.y - 4, 'lock'), 18, 21).setDepth(4.1);
              const num = s.add
                .text(p.x, p.y + 11, c, { fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#9BD65B', resolution: RES })
                .setOrigin(0.5)
                .setDepth(4.2);
              this.gates.push({ x, y, need: Number(c), open: false, sprite, lock, num });
            }
        }
      }
    }
  }
}
