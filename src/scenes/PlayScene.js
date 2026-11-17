import { beginStudy, choice, recordPath } from '../fieldwork.js';
import { researchCheckpoint } from '../ui/researchCheckpoint.js';
import { sized } from '../systems/textures.js';
// ============================================================================
//  PlayScene.js: one level of the game
// ----------------------------------------------------------------------------
//  This is where everything comes together:
//    create()  builds the maze, Spark, fog, hazards, HUD and controls
//    update()  runs about 60 times a second: moves things, checks touches,
//              shrinks the light, redraws the fog and the HUD
//  The goal: collect every discovery (K), which unlocks the keyhole (E),
//  then reach the keyhole.
// ============================================================================
import Phaser from 'phaser';
import { COLORS, CSS, LIGHT, HAZARDS, PLAYER, SCORE, LAYOUT, LIVES } from '../config.js';
import { LEVELS } from '../levels.js';
import { Maze, DIRS } from '../game/Maze.js';
import { Player } from '../game/Player.js';
import { Fog } from '../game/Fog.js';
import { StaticBlob } from '../game/StaticBlob.js';
import { GhostRecorder, GhostPlayer } from '../game/Ghost.js';
import { TouchControls } from '../ui/TouchControls.js';
import { label, panel } from '../ui/widgets.js';
import { Save } from '../systems/save.js';
import { Sound } from '../systems/sound.js';
import { formatTime, isTouchDevice, prefersReducedMotion, view, setupCamera } from '../systems/layout.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('Play');
  }

  init(data) {
    this.levelIndex = data?.levelIndex ?? 0;
    this.level = LEVELS[this.levelIndex];
  }

  create() {
    setupCamera(this);
    const level = this.level;
    this.calm = Save.settings.calm;
    this.reducedMotion = prefersReducedMotion();
    this.cameras.main.setBackgroundColor(CSS.bg);

    // ---- Game state -----------------------------------------------------------
    this.state = 'playing'; // 'playing' | 'respawning' | 'over' | 'won'
    this.unlimitedLives = this.calm && LIVES.calmUnlimited;
    this.lives = Save.runLives;
    this.surge = 0;
    this.livesLost = 0;
    this.lowWarned = false;
    this.elapsed = 0; // seconds (starts when Spark first moves)
    this.score = 0;
    this.dotsEaten = 0;
    this.giftsFound = 0;
    this.beaconLit = false;
    this.cluesFound = 0;
    this.dotCombo = 0;
    this.lastDotTime = 0;
    this.par = this.calm ? Math.round(level.par / PLAYER.calmSpeedFactor) : level.par;

    // Light settings: the level's own values, falling back to config.js
    this.lightCfg = { ...LIGHT, ...(level.light || {}) };
    this.light = this.lightCfg.start;
    if (this.levelIndex === 0) beginStudy();
    this.trail = new Map();
    if (this.levelIndex === 1) {
      if (choice(0)) this.lightCfg.fadePerSecond *= 0.70;
      else { this.lightCfg.start += 38; this.lightCfg.max += 38; this.light = this.lightCfg.start; }
    }
    this.lightShown = this.light;

    // Seeded randomness, so Static moves the same way each attempt
    let seed = 1234 + this.levelIndex * 999;
    this.rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    // ---- The world ------------------------------------------------------------
    this.maze = new Maze(this, level);
    this.totalClues = this.maze.clues.length;
    this.totalGifts = this.maze.gifts.length;
    this.buildExit();
    this.trail.set('start', [this.maze.start.x, this.maze.start.y]);
    this.sampleDelay = 0;
    this.fieldStep = 0;
    this.station = null;
    const stations = {
      test: [this.maze.start, choice(1) ? this.maze.gifts[0] : this.maze.start],
      discovery: [this.maze.clues[0], choice(2) ? this.maze.clues[1] : this.maze.clues[0]],
      impact: [choice(3) ? this.maze.gifts[1] : this.maze.gifts[0]],
      next: [choice(4) ? this.maze.clues.at(-1) : this.maze.gifts[0]],
    };
    this.fieldSites = stations[level.id] || [];
    if (this.fieldSites.length) this.markStation();

    this.player = new Player(this, this.maze, this.maze.start.x, this.maze.start.y);
    if (this.calm) this.player.speed *= PLAYER.calmSpeedFactor;
    this.player.onArrive = (x, y) => this.onArrive(x, y);
    this.player.onBump = () => Sound.bump();

    const hazardFactor = this.calm ? HAZARDS.calmHazardFactor : 1;
    this.hazardFactor = hazardFactor;
    this.statics = this.maze.staticStarts.map((s) => new StaticBlob(this, this.maze, s.x, s.y, this.rng, hazardFactor));

    this.fog = new Fog(this, this.maze, this.lightCfg);
    this.fog.reveal(this.player.x, this.player.y, this.light);

    // Ghost of your best run (if you have one and the option is on)
    this.recorder = new GhostRecorder();
    const best = Save.level(level.id);
    this.ghost = Save.settings.ghost && best?.ghost?.length > 4 && !this.calm ? new GhostPlayer(this, best.ghost) : null;
    this.bestTime = best?.bestTime ?? null;

    // Sparkle particles (for pickups)
    this.sparkles = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 180 },
      lifespan: 600,
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.sparkles.setDepth(12);

    // ---- Controls ---------------------------------------------------------------
    this.setupKeyboard();
    this.touch = new TouchControls(this, {
      onHold: (dir) => {
        this.padDir = dir;
        Sound.unlock();
      },
      onSwipe: (dir) => {
        Sound.unlock();
        this.player.request(dir);
      },
      onRestart: () => this.restart(),
      onSound: () => this.toggleSound(),
    });
    this.padDir = null;

    // ---- HUD + layout --------------------------------------------------------------
    this.hud = [];
    this.layout();
    this.onResize = () => this.layout();
    this.scale.on('resize', this.onResize);
    this.snapCamera = true;
    this.updateCamera(1);

    this.showIntro();
    Sound.startMusic();

    // Pause automatically if the player switches tabs
    this.onHidden = () => this.pause();
    this.game.events.on('hidden', this.onHidden);
    this.events.once('shutdown', () => this.cleanup());
  }

  // ===========================================================================
  //  Setup helpers
  // ===========================================================================

  setupKeyboard() {
    const kb = this.input.keyboard;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.dirKeys = {
      left: [kb.addKey(K.LEFT), kb.addKey(K.A)],
      right: [kb.addKey(K.RIGHT), kb.addKey(K.D)],
      up: [kb.addKey(K.UP), kb.addKey(K.W)],
      down: [kb.addKey(K.DOWN), kb.addKey(K.S)],
    };
    this.lastKey = null;
    for (const [name, keys] of Object.entries(this.dirKeys)) {
      keys.forEach((k) =>
        k.on('down', () => {
          Sound.unlock();
          this.lastKey = name;
          if (this.state === 'playing') this.player.request(DIRS[name]);
        })
      );
    }
    kb.on('keydown-P', () => this.pause());
    kb.on('keydown-ESC', () => this.pause());
    kb.on('keydown-R', () => this.restart());
    kb.on('keydown-M', () => this.toggleSound());
    // Stop arrow keys / space from scrolling the web page
    kb.addCapture([K.LEFT, K.RIGHT, K.UP, K.DOWN, K.SPACE]);
  }

  /** Which direction is held right now (keyboard or d-pad)? */
  heldDirection() {
    if (this.padDir) return this.padDir;
    const isDown = (name) => this.dirKeys[name].some((k) => k.isDown);
    if (this.lastKey && isDown(this.lastKey)) return DIRS[this.lastKey];
    for (const name of Object.keys(this.dirKeys)) if (isDown(name)) return DIRS[name];
    return null;
  }

  buildExit() {
    const e = this.maze.exit;
    const p = this.maze.toPixel(e.x, e.y);
    // The keyhole glows above the fog, so you always know where the goal is
    this.exitBurst = this.add.image(p.x, p.y, 'sunburst').setDepth(11).setScale(0.42).setAlpha(0.28);
    this.exitLock = this.add.image(p.x, p.y, 'lock').setDepth(11.6).setScale(0.62);
    this.exitPulse = this.tweens.add({ targets: this.exitBurst, alpha: 0.45, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** Place the HUD and controls for the current screen size. */
  layout() {
    const { width: W, height: H } = view(this);
    this.portrait = H > W;
    this.showPad = isTouchDevice();
    this.hudH = this.portrait ? LAYOUT.hudHeightPortrait : LAYOUT.hudHeightLandscape;
    this.ctrlH = this.showPad && this.portrait ? LAYOUT.controlsHeight : 0;
    this.buildHud();
    this.touch.layout(this.showPad);
    this.touch.setSoundIcon(Sound.muted);
    this.snapCamera = true;
  }

  buildHud() {
    this.hud.forEach((o) => o.destroy());
    this.hud = [];
    const { width: W } = view(this);
    const add = (o) => {
      o.setScrollFactor(0);
      if (o.depth < 20) o.setDepth(21);
      this.hud.push(o);
      return o;
    };

    // dark band behind the HUD
    const band = add(this.add.graphics().setDepth(20));
    band.fillStyle(COLORS.bg, 0.94);
    band.fillRect(0, 0, W, this.hudH - 12);
    for (let i = 0; i < 12; i++) {
      band.fillStyle(COLORS.bg, 0.94 * (1 - i / 12));
      band.fillRect(0, this.hudH - 12 + i, W, 1);
    }

    const pillH = 46;
    const y = 12;
    const g = add(this.add.graphics());
    let x = 12;
    const pill = (w) => {
      panel(g, x, y, w, pillH, { radius: 23 });
      const left = x;
      x += w + 8;
      return left;
    };

    // Stage pill: "1 SEED"
    const stageText = add(label(this, 0, y + pillH / 2, this.level.stage, { size: 17, originX: 0, letterSpacing: 1 }));
    const num = add(label(this, 0, y + pillH / 2, String(this.levelIndex + 1), { size: 18, color: CSS.lime, originX: 0 }));
    const stageW = Math.min(this.portrait ? 150 : 190, num.width + stageText.width + 34);
    const sx = pill(stageW);
    num.setX(sx + 14);
    stageText.setX(sx + 14 + num.width + 6);
    if (stageText.width > stageW - num.width - 26) stageText.setScale((stageW - num.width - 26) / stageText.width);

    // Timer pill
    const tx = pill(72);
    this.timerText = add(label(this, tx + 36, y + pillH / 2, this.calm ? 'CALM' : '0:00', { size: this.calm ? 15 : 19, color: this.calm ? CSS.sky : CSS.cream }));

    // Discoveries pill
    const cx = pill(84);
    add(sized(this.add.image(cx + 22, y + pillH / 2, 'clue'), 32, 32));
    this.clueText = add(label(this, cx + 40, y + pillH / 2, '', { size: 19, originX: 0 }));

    // Gifts pill
    const gx = pill(80);
    add(sized(this.add.image(gx + 20, y + pillH / 2, 'gift'), 24, 24));
    this.giftText = add(label(this, gx + 36, y + pillH / 2, '', { size: 19, originX: 0 }));

    // Pause button (top right)
    const px = W - 12 - pillH;
    panel(g, px, y, pillH, pillH, { radius: 23 });
    add(sized(this.add.image(px + pillH / 2, y + pillH / 2, 'iconPause'), 24, 24));
    const pz = add(this.add.zone(px + pillH / 2, y + pillH / 2, pillH + 12, pillH + 12).setInteractive({ useHandCursor: true }));
    pz.on('pointerup', () => this.pause());

    // Sound button next to pause (computers only; phones have one by the d-pad)
    if (!(this.showPad && this.portrait)) {
      const mx = px - 8 - pillH;
      panel(g, mx, y, pillH, pillH, { radius: 23 });
      this.soundIcon = add(sized(this.add.image(mx + pillH / 2, y + pillH / 2, Sound.muted ? 'iconMute' : 'iconSound'), 26, 26));
      const mz = add(this.add.zone(mx + pillH / 2, y + pillH / 2, pillH + 8, pillH + 8).setInteractive({ useHandCursor: true }));
      mz.on('pointerup', () => this.toggleSound());
    } else {
      this.soundIcon = null;
    }

    // Row 2: goal and best time
    const row2 = this.portrait ? 80 : 78;
    this.goalText = add(label(this, 14, row2, '', { size: 16, originX: 0, color: CSS.soft, letterSpacing: 1 }));
    const bestStr = this.calm ? 'CALM MODE' : `BEST ${formatTime(this.bestTime)}`;
    add(label(this, W - 14, row2, bestStr, { size: 16, originX: 1, color: CSS.lime, letterSpacing: 1 }));

    // Hearts (lives). Calm mode has unlimited lives, so they are hidden.
    const heartsW = this.unlimitedLives ? 0 : 64;
    if (!this.unlimitedLives) {
      const hy = this.portrait ? 106 : row2;
      const hx = this.portrait ? W - 62 : W - 185;
      add(sized(this.add.image(hx, hy, 'heart'), 22));
      this.heartCount = add(label(this, hx + 16, hy, '', { size: 17, originX: 0 }));
    }

    // Light meter
    if (this.portrait) {
      this.lightBar = { x: 70, y: 104, w: W - 84 - heartsW - (heartsW ? 8 : 0), h: 8 };
      add(label(this, 14, 108, 'LIGHT', { size: 13, originX: 0, color: CSS.gold, letterSpacing: 1.5 }));
    } else {
      // on wide screens it sits in the top row
      const lx = x + 8;
      const lw = Math.max(80, px - 8 - pillH - 16 - lx - 54);
      this.lightBar = { x: lx + 54, y: y + pillH / 2 - 4, w: lw, h: 8 };
      add(label(this, lx, y + pillH / 2, 'LIGHT', { size: 13, originX: 0, color: CSS.gold, letterSpacing: 1.5 }));
    }
    this.lightGfx = add(this.add.graphics());
    this.hudCache = {};
    this.updateHud(true);
  }

  // ===========================================================================
  //  The game loop
  // ===========================================================================

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05); // seconds since last frame (capped)
    const player = this.player;

    if (this.state === 'playing') {
      this.sampleDelay = Math.max(0, this.sampleDelay - dt);
      this.surge = Math.max(0, this.surge - dt);
      player.hold(this.heldDirection());
      player.update(dt);
      if (this.state === 'observing') return;

      if (player.moved) {
        this.elapsed += dt;
        this.recorder.update(dt, player.x, player.y);
        // The light slowly fades as you explore (Calm mode: half as fast)
        // The light drains as you explore. Calm mode: slower, and it never runs out.
        const cfg = this.lightCfg;
        const fade = cfg.fadePerSecond * (this.calm ? cfg.calmFadeFactor : 1);
        const floor = this.calm ? Math.max(cfg.min, cfg.calmMin) : cfg.min;
        this.light = Math.max(floor, this.light - fade * dt);
        if (!this.calm && fade > 0) {
          if (this.light <= cfg.outAt) this.loseLife('light');
          else if (this.light < cfg.warnAt && !this.lowWarned) {
            this.lowWarned = true;
            this.toast('LOW LIGHT! FIND A GIFT OR DISCOVERY');
            Sound.lowLight();
          } else if (this.light > cfg.warnAt + 10) this.lowWarned = false;
        }
        if (this.intro && !this.introGone) this.hideIntro();
      }
      if (this.ghost) this.ghost.update(dt, player.moved);

      if (player.moved) this.statics.forEach((s) => s.update(dt));
      this.checkStatic();
      this.updateDoors(dt);
    } else {
      player.render();
    }

    // Smoothly animate the light toward its target size, with a gentle flicker
    this.lightShown += (this.light - this.lightShown) * Math.min(1, dt * 6);
    const flicker = this.reducedMotion ? 0 : Math.sin(time / 160) * 1.5;
    const r = this.lightShown + flicker;
    this.fog.reveal(player.x, player.y, r);
    this.fog.draw(player.x, player.y, r);
    player.glow.setScale((r / 64) * 0.75);

    this.updateCamera(dt);
    this.updateHud();
  }

  /** Called each time Spark reaches the middle of a square. */
  onArrive(x, y) {
    const key = this.maze.key(x, y);
    const p = this.maze.toPixel(x, y);

    this.trail.set(key, [x,y]);
    this.readStation(x,y);

    // Data dot
    const dot = this.maze.dots.get(key);
    if (dot) {
      dot.destroy();
      this.maze.dots.delete(key);
      this.dotsEaten++;
      this.score += SCORE.dot;
      const now = this.time.now;
      this.dotCombo = now - this.lastDotTime < 450 ? this.dotCombo + 1 : 0;
      this.lastDotTime = now;
      Sound.dot(this.dotCombo);
    }

    const heart = this.maze.hearts.get(key);
    if (heart) {
      this.maze.hearts.delete(key);
      heart.destroy();
      Save.collectHeart(this.level.id + key);
      this.lives = Save.runLives;
      this.burst(p.x, p.y, COLORS.gold, 18);
      this.floatText(p.x, p.y - 20, '1UP!', CSS.goldLight);
      Sound.gift();
    }

    // Gold gift
    const gift = this.maze.gifts.find((g) => g.x === x && g.y === y && !g.taken);
    if (gift) {
      gift.taken = true;
      this.tweens.killTweensOf(gift.sprite);
      this.tweens.add({ targets: gift.sprite, scale: 1.8, alpha: 0, duration: 260, onComplete: () => gift.sprite.destroy() });
      this.giftsFound++;
      this.score += SCORE.gift;
      this.light = Math.min(this.lightCfg.max, this.light + this.lightCfg.giftRefill);
      this.burst(p.x, p.y, COLORS.gold, 14);
      this.floatText(p.x, p.y - 18, '+ LIGHT', CSS.gold);
      Sound.gift();
      if (this.level.id === 'seed' && this.giftsFound === 2) {
        this.beaconLit = true;
        this.observe();
      }
    }

    // Discovery
    const clue = this.maze.clues.find((c) => c.x === x && c.y === y && !c.taken);
    if (clue) {
      clue.taken = true;
      this.tweens.killTweensOf(clue.sprite);
      this.tweens.add({ targets: clue.sprite, scale: 2, alpha: 0, duration: 380, onComplete: () => clue.sprite.destroy() });
      this.cluesFound++;
      if (this.statics.length) this.surge = HAZARDS.surgeSeconds;
      this.score += SCORE.discovery;
      this.light = this.lightCfg.max; // a discovery fully restores your light
      this.burst(p.x, p.y, COLORS.lime, 24);
      this.floatText(p.x, p.y - 20, `DISCOVERY ${this.cluesFound}/${this.totalClues}`, CSS.lime);
      Sound.discovery();
      this.openGates();
      if (this.level.id === 'test' && this.cluesFound === 1) this.observe();
      if (this.cluesFound >= this.totalClues && this.fieldStep === this.fieldSites.length && (this.level.id !== 'seed' || this.beaconLit)) this.unlockExit();
    }

    // The keyhole
    const e = this.maze.exit;
    if (e.open && x === e.x && y === e.y) this.win();
  }

  observe() {
    this.touch.release();
    this.padDir = null;
    this.state = 'observing';
    this.scene.pause();
    researchCheckpoint(this.level.id, () => {
      this.state = 'playing';
      this.scene.resume();
      const target = this.maze.clues.find(c => !c.taken) || this.maze.exit;
      const point = this.maze.toPixel(target.x, target.y);
      this.fog.reveal(point.x, point.y, this.lightCfg.max);
      this.burst(point.x, point.y, COLORS.gold, 20);
      if (this.cluesFound === this.totalClues && this.fieldStep === this.fieldSites.length) this.unlockExit();
      else this.toast('BEACON ONLINE • A NEW AREA IS LIT');
    });
  }

  markStation() {
    this.station?.destroy();
    const site = this.fieldSites[this.fieldStep];
    if (!site) return;
    const p = this.maze.toPixel(site.x, site.y);
    this.station = this.add.circle(p.x, p.y, 18, COLORS.sky, 0.18).setStrokeStyle(3, COLORS.sky).setDepth(11);
    if (this.level.id === 'next') this.lightCfg.giftRefill += 15;
  }

  readStation(x, y) {
    const site = this.fieldSites[this.fieldStep];
    if (!site || x !== site.x || y !== site.y) return;
    if (this.sampleDelay > 0) {
      this.toast('RECALIBRATING • RETURN IN ' + Math.ceil(this.sampleDelay) + 's');
      return;
    }
    this.fieldStep++;
    if (this.fieldSites[this.fieldStep] === site) this.sampleDelay = 4;
    this.markStation();
    this.light = this.lightCfg.max;
    this.burst(this.player.x, this.player.y, COLORS.sky, 18);
    this.toast(this.fieldStep < this.fieldSites.length ? 'SAMPLE SAVED • TAKE ANOTHER READING' : 'OBSERVATION COMPLETE');
    if (this.fieldStep === this.fieldSites.length && this.cluesFound === this.totalClues && !this.maze.exit.open) this.unlockExit();
  }

  openGates() {
    for (const gate of this.maze.gates) {
      if (!gate.open && this.cluesFound >= gate.need) {
        gate.open = true;
        gate.sprite.setTexture('gateOpen');
        gate.lock.setTexture('lockOpen');
        this.tweens.add({ targets: [gate.lock, gate.num], alpha: 0, y: '-=14', duration: 500, delay: 200 });
        const p = this.maze.toPixel(gate.x, gate.y);
        this.burst(p.x, p.y, COLORS.gold, 10);
        this.toast(`GATE ${gate.need} OPENED`);
        Sound.gate();
      }
    }
  }

  unlockExit() {
    const e = this.maze.exit;
    e.open = true;
    this.exitPulse.stop();
    this.exitLock.setTexture('lockOpen');
    this.tweens.add({ targets: this.exitLock, scale: 0.8, duration: 260, yoyo: true });
    this.tweens.add({ targets: this.exitBurst, alpha: 0.95, scale: 0.6, duration: 500 });
    if (!this.reducedMotion) this.tweens.add({ targets: this.exitBurst, angle: 360, duration: 9000, repeat: -1 });
    this.toast('KEYHOLE UNLOCKED! FOLLOW THE GLOW');
    this.time.delayedCall(350, () => Sound.unlockChime());
  }

  checkStatic() {
    const p = this.player;
    if (this.state !== 'playing') return;
    for (const s of this.statics) {
      if (s.absent) continue;
      if (Math.hypot(s.x - p.x, s.y - p.y) < PLAYER.hitRadius) {
        if (this.surge > 0) {
          s.disperse();
          this.burst(s.x, s.y, COLORS.sky, 16);
          this.floatText(s.x, s.y - 20, 'STATIC CLEARED', CSS.sky);
          Sound.gate();
          continue;
        }
        if (p.safe > 0) return;
        if (!this.unlimitedLives) {
          s.reverse();
          this.loseLife('static');
          break;
        }
        // Calm mode: no hearts lost, Static just pushes you back and dims the glow
        p.knockBack();
        s.reverse();
        this.light = Math.max(this.lightCfg.calmMin, this.light - this.lightCfg.hitLoss);
        this.floatText(p.x, p.y - 22, 'NOISY DATA!', CSS.soft);
        Sound.hit();
        if (!this.reducedMotion) this.cameras.main.shake(180, 0.006);
        this.cameras.main.flash(160, 110, 208, 232, false);
        break;
      }
    }
  }

  /**
   * Lose one heart (touched Static, or the light ran out). Spark goes back to
   * the start square with full light and a short flashing shield. Discoveries
   * and gifts already found stay found, so progress is never wiped out by a
   * single slip; the clock keeps running, which is the real cost.
   */
  loseLife(reason) {
    if (this.state !== 'playing' || this.player.safe > 0) return;
    const p = this.player;
    this.lives = Save.loseHeart();
    this.surge = 0;
    this.livesLost++;
    this.touch.release();
    this.padDir = null;
    Sound.hit();
    Sound.lifeLost();
    if (!this.reducedMotion) this.cameras.main.shake(220, 0.008);
    this.cameras.main.flash(200, 217, 67, 79, false);
    this.burst(p.x, p.y, reason === 'light' ? COLORS.gold : COLORS.sky, 22);
    this.floatText(p.x, p.y - 24, reason === 'light' ? 'OUT OF LIGHT!' : 'NOISY DATA!', '#FF8A7A');
    this.updateHud(true);
    if (this.lives <= 0) {
      this.state = 'over';
      p.setVisible(false);
      this.time.delayedCall(900, () => {
        this.scene.pause();
        this.scene.launch('TryAgain', { levelIndex: this.levelIndex });
      });
      return;
    }
    this.state = 'respawning';
    this.tweens.add({ targets: [p.sprite, p.ring, p.rim], alpha: 0, duration: 250 });
    this.time.delayedCall(LIVES.respawnDelay * 1000, () => {
      if (this.state !== 'respawning') return;
      p.respawn(this.maze.start.x, this.maze.start.y, LIVES.invulnerableTime);
      this.light = this.lightCfg.start;
      this.lowWarned = false;
      const s = this.maze.toPixel(this.maze.start.x, this.maze.start.y);
      this.burst(s.x, s.y, COLORS.gold, 16);
      this.toast(`${this.lives} ${this.lives === 1 ? 'HEART' : 'HEARTS'} LEFT`);
      this.state = 'playing';
    });
  }

  updateDoors(dt) {
    const openT = HAZARDS.doorOpenTime;
    const closedT = HAZARDS.doorClosedTime;
    const period = openT + closedT;
    for (const d of this.maze.doors) {
      d.timer += dt * this.hazardFactor;
      let phase = d.timer % period;
      const shouldClose = phase >= openT;
      const near = Math.hypot(d.x - this.player.tx, d.y - this.player.ty) < 6;
      if (shouldClose && !d.closed) {
        if (this.player.occupies(d.x, d.y)) {
          // never shut on Spark: wait until it has passed
          d.timer -= dt * this.hazardFactor;
          phase = openT - 0.001;
        } else {
          d.closed = true;
          d.sprite.setTexture('doorClosed');
          d.count.setText('');
          if (near) Sound.door(true);
        }
      } else if (!shouldClose && d.closed) {
        d.closed = false;
        d.sprite.setTexture('doorOpen');
        if (near) Sound.door(false);
      }
      if (!d.closed) {
        const left = Math.ceil(openT - phase);
        const txt = left <= 3 ? String(left) : '';
        if (d.count.text !== txt) {
          d.count.setText(txt);
          if (txt && near) Sound.tick();
        }
      }
    }
  }

  /** Keep Spark in view. Small mazes are centered; big ones scroll. */
  updateCamera(dt) {
    const cam = this.cameras.main;
    const { width: W, height: H } = view(this);
    const top = this.hudH;
    const bottom = H - this.ctrlH;
    const viewH = bottom - top;
    const mw = this.maze.width;
    const mh = this.maze.height;
    let sx, sy;
    if (mw + 16 <= W) sx = -(W - mw) / 2;
    else sx = Phaser.Math.Clamp(this.player.x - W / 2, -12, mw - W + 12);
    if (mh + 16 <= viewH) sy = -(top + (viewH - mh) / 2);
    else sy = Phaser.Math.Clamp(this.player.y - (top + viewH / 2), -top - 8, mh - bottom + 8);
    if (this.snapCamera) {
      cam.setScroll(sx, sy);
      this.snapCamera = false;
    } else {
      const k = Math.min(1, dt * 6);
      cam.setScroll(cam.scrollX + (sx - cam.scrollX) * k, cam.scrollY + (sy - cam.scrollY) * k);
    }
  }

  updateHud(force = false) {
    const c = this.hudCache;
    const set = (key, value, fn) => {
      if (force || c[key] !== value) {
        c[key] = value;
        fn(value);
      }
    };
    if (!this.calm) set('time', formatTime(this.elapsed), (v) => this.timerText.setText(v));
    set('clues', `${this.cluesFound}/${this.totalClues}`, (v) => this.clueText.setText(v));
    set('gifts', `${this.giftsFound}/${this.totalGifts}`, (v) => this.giftText.setText(v));
    if (!this.unlimitedLives) set('hearts', this.lives, v => this.heartCount.setText('× ' + v));
    set('surging', this.surge > 0, active => {
      this.player.ring.setTint(active ? COLORS.sky : 0xffffff);
      for (const enemy of this.statics) enemy.sprite.setTint(active ? COLORS.sky : 0xffffff);
    });
    let goal = this.maze.exit.open
      ? 'GOAL: REACH THE KEYHOLE'
      : `GOAL: FIND ${this.totalClues - this.cluesFound} MORE ${this.totalClues - this.cluesFound === 1 ? 'DISCOVERY' : 'DISCOVERIES'}`;
    if (this.level.id === 'seed' && !this.beaconLit && this.cluesFound === this.totalClues) goal = 'GOAL: COLLECT TWO GIFTS';
    if (this.fieldStep < this.fieldSites.length) goal = 'VISIT BLUE RING • ' + this.fieldStep + '/' + this.fieldSites.length;
    if (this.sampleDelay > 0) goal = 'NEXT SAMPLE IN ' + Math.ceil(this.sampleDelay) + 's';
    if (this.surge > 0) goal = 'TAG STATIC • ' + Math.ceil(this.surge) + 's';
    set('goal', goal, (v) => this.goalText.setText(v).setColor(this.maze.exit.open ? CSS.gold : CSS.soft));

    // light meter
    const lb = this.lightBar;
    const frac = (this.lightShown - 0) / this.lightCfg.max;
    const lowNow = !this.calm && this.lightCfg.fadePerSecond > 0 && this.lightShown < this.lightCfg.warnAt;
    const fracKey = Math.round(frac * 100) + (lowNow ? 1000 : 0);
    if (this.lightGfx) this.lightGfx.setAlpha(lowNow && !this.reducedMotion ? 0.6 + 0.4 * Math.abs(Math.sin(this.time.now / 160)) : 1);
    set('light', fracKey, () => {
      const g = this.lightGfx;
      g.clear();
      g.fillStyle(COLORS.deep, 1);
      g.fillRoundedRect(lb.x, lb.y, lb.w, lb.h, lb.h / 2);
      const low = !this.calm && this.lightCfg.fadePerSecond > 0 && this.lightShown < this.lightCfg.warnAt;
      g.fillStyle(low ? 0xd9434f : frac < 0.5 ? COLORS.goldDark : COLORS.gold, 1);
      g.fillRoundedRect(lb.x, lb.y, Math.max(lb.h, lb.w * Math.min(1, frac)), lb.h, lb.h / 2);
      g.lineStyle(1, COLORS.soft, 0.25);
      g.strokeRoundedRect(lb.x, lb.y, lb.w, lb.h, lb.h / 2);
    });
  }

  // ===========================================================================
  //  Little effects
  // ===========================================================================

  burst(x, y, tint, count) {
    if (this.reducedMotion) count = Math.ceil(count / 3);
    this.sparkles.setParticleTint(tint);
    this.sparkles.explode(count, x, y);
  }

  floatText(x, y, text, color) {
    const t = label(this, x, y, text, { size: 16, color, letterSpacing: 1 }).setDepth(13);
    t.setStroke('#051C12', 4);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  toast(text) {
    const { width: W } = view(this);
    const y = this.hudH + 34;
    const t = label(this, W / 2, y, text, { size: 18, color: CSS.deep, letterSpacing: 1.5 }).setScrollFactor(0).setDepth(26);
    const g = this.add.graphics().setScrollFactor(0).setDepth(25);
    const w = t.width + 36;
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(W / 2 - w / 2, y - 20, w, 40, 20);
    [t, g].forEach((o) => {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 200, yoyo: true, hold: 1800, onComplete: () => o.destroy() });
    });
  }

  showIntro() {
    const { width: W, height: H } = view(this);
    const touch = isTouchDevice();
    const top = this.hudH;
    const bottom = H - this.ctrlH;
    const cy = top + (bottom - top) * 0.5;
    const w = Math.min(W - 40, 460);
    const h = 176;
    const objs = [];
    const g = this.add.graphics().setScrollFactor(0).setDepth(27);
    panel(g, W / 2 - w / 2, cy - h / 2, w, h, { radius: 18, alpha: 0.95, stroke: COLORS.gold, strokeAlpha: 0.7 });
    objs.push(g);
    objs.push(label(this, W / 2, cy - 56, `LEVEL ${this.levelIndex + 1} · ${this.level.stage}`, { size: 15, color: CSS.lime, letterSpacing: 2 }));
    objs.push(label(this, W / 2, cy - 26, this.level.name, { size: 28, heading: true, color: CSS.cream }));
    objs.push(label(this, W / 2, cy + 18, ([
      this.level.tip,
      choice(0) ? 'Reserve battery equipped. Take the longer route for a heart.' : 'Wide lens equipped. Watch for Static beyond the next corner.',
      choice(1) ? 'Visit the blue base ring, then carry your reading to the distant ring.' : 'Visit the blue base ring twice. Leave and circle back for a second sample.',
      choice(2) ? 'Visit both blue instruments to compare readings.' : 'Visit the blue instrument twice to replay its original reading.',
      choice(3) ? 'Fictional participant: “Getting to work was the hard part.” Trace the commute to the blue ring.' : 'Fictional participant: “Mornings were the hardest.” Find the blue ring at the early field station.',
      choice(4) ? 'Your beacon lights the final station. Visit its ring for a full recharge.' : 'Your beacon lights the crossing. Visit its ring for a full recharge.',
    ])[this.levelIndex], { size: 17, color: CSS.soft, wrap: w - 40, bold: false }));
    objs.push(
      label(this, W / 2, cy + 64, touch ? 'SWIPE OR USE THE PAD TO START' : 'PRESS AN ARROW KEY TO START', {
        size: 14,
        color: CSS.gold,
        letterSpacing: 2,
      })
    );
    objs.forEach((o) => o.setScrollFactor(0).setDepth(o.depth > 27 ? o.depth : 28));
    this.intro = objs;
    this.introGone = false;
    // fade it after a few seconds even if you haven't moved yet
    this.time.delayedCall(4500, () => this.hideIntro());
  }

  hideIntro() {
    if (this.introGone || !this.intro) return;
    this.introGone = true;
    this.tweens.add({ targets: this.intro, alpha: 0, duration: 350, onComplete: () => this.intro.forEach((o) => o.destroy()) });
  }

  // ===========================================================================
  //  Winning, pausing, restarting
  // ===========================================================================

  win() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    this.touch.release();
    const time = this.elapsed;
    const stars = [true, this.giftsFound >= this.totalGifts, time <= this.par];
    const starCount = stars.filter(Boolean).length;
    const timeBonus = Math.round(Math.max(0, this.par - time) * SCORE.timeBonusPerSecond);
    this.score += timeBonus;

    const result = {
      id: this.level.id,
      index: this.levelIndex,
      time,
      stars: starCount,
      score: this.score,
      ghost: this.recorder.data(),
      calm: this.calm,
    };
    recordPath(this.levelIndex, Array.from(this.trail.values()));
    const records = Save.recordRun(result);
    if (!this.calm && this.levelIndex === LEVELS.length - 1) Save.finishRun();

    // celebration: the fog lifts and the keyhole bursts with light
    Sound.win();
    this.fog.clearAll(900);
    const e = this.maze.toPixel(this.maze.exit.x, this.maze.exit.y);
    this.burst(e.x, e.y, COLORS.gold, 40);
    this.time.delayedCall(150, () => this.burst(e.x, e.y, COLORS.lime, 30));
    this.tweens.add({ targets: this.exitBurst, scale: 1.6, alpha: 1, duration: 900, ease: 'Cubic.easeOut' });
    const ps = this.player.sprite.scaleX;
    this.tweens.add({ targets: this.player.sprite, scaleX: ps * 1.5, scaleY: ps * 1.5, duration: 400, yoyo: true });

    this.time.delayedCall(1500, () => {
      this.scene.start('LevelComplete', {
        levelIndex: this.levelIndex,
        time,
        stars,
        score: this.score,
        timeBonus,
        dots: this.dotsEaten,
        gifts: this.giftsFound,
        totalGifts: this.totalGifts,
        par: this.par,
        calm: this.calm,
        records,
      });
    });
  }

  pause() {
    if (this.state !== 'playing' || this.scene.isPaused()) return;
    this.touch.release();
    this.padDir = null;
    this.scene.pause();
    this.scene.launch('Pause', { levelIndex: this.levelIndex });
  }

  restart() {
    if (this.state !== 'playing' && this.state !== 'respawning') return;
    this.scene.restart({ levelIndex: this.levelIndex });
  }

  toggleSound() {
    const muted = Sound.toggleMute();
    if (this.soundIcon) this.soundIcon.setTexture(muted ? 'iconMute' : 'iconSound');
    this.touch.setSoundIcon(muted);
  }

  cleanup() {
    this.scale.off('resize', this.onResize);
    this.game.events.off('hidden', this.onHidden);
    this.touch.destroy();
    this.fog.destroy();
    this.input.keyboard.removeAllListeners();
  }
}
