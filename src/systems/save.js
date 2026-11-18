// ============================================================================
//  save.js: remembers progress in the browser (localStorage)
// ----------------------------------------------------------------------------
//  Saved: which levels are unlocked, best time / stars / score per level,
//  your best "ghost" route per level, and settings (sound, calm, ghost).
//  To wipe progress while testing, open the browser console and run:
//      localStorage.removeItem('spark-game-save-v1')
// ============================================================================
import { SAVE_KEY, LIVES } from '../config.js';

const DEFAULTS = {
  version: 2,
  run: null,
  unlocked: 1, // how many levels are open (1 = only the first)
  levels: {}, // per level id: { stars, bestTime, bestScore, ghost }
  settings: { muted: false, calm: false, raceBest: false, character: null },
};

let data = load();

function load() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    // Version 2 changed some mazes, so old ghost routes no longer fit.
    if ((parsed.version || 1) < 2) {
      for (const l of Object.values(parsed.levels || {})) l.ghost = null;
      parsed.version = 2;
    }
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
      levels: parsed.levels || {},
    };
  } catch (err) {
    // Private browsing or a broken save: just start fresh.
    return structuredClone(DEFAULTS);
  }
}

function persist() {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (err) {
    /* storage full or blocked: the game still works, it just won't remember */
  }
}

export const Save = {
  get runLives() {
    return data.run?.lives ?? LIVES.start;
  },

  claimedHeart(id) {
    return data.run?.hearts.includes(id) ?? false;
  },

  collectHeart(id) {
    if (this.claimedHeart(id)) return;
    data.run ??= { lives: LIVES.start, hearts: [] };
    data.run.hearts.push(id);
    data.run.lives++;
    persist();
  },

  loseHeart() {
    data.run ??= { lives: LIVES.start, hearts: [] };
    const left = --data.run.lives;
    if (left === 0) data.run = null;
    persist();
    return left;
  },

  finishRun() {
    data.run = null;
    persist();
  },

  get unlocked() {
    return data.unlocked;
  },
  get settings() {
    return data.settings;
  },

  setSetting(name, value) {
    data.settings[name] = value;
    persist();
  },

  level(id) {
    return data.levels[id] || null;
  },

  totalStars() {
    return Object.values(data.levels).reduce((sum, l) => sum + (l.stars || 0), 0);
  },

  /**
   * Record a finished run. Returns which records were beaten.
   * result = { id, index, time, stars, score, ghost, calm }
   */
  recordRun(result) {
    const prev = data.levels[result.id] || {};
    const isBestTime = !result.calm && (prev.bestTime == null || result.time < prev.bestTime);
    const isBestScore = prev.bestScore == null || result.score > prev.bestScore;
    data.levels[result.id] = {
      stars: Math.max(prev.stars || 0, result.stars),
      bestTime: isBestTime ? result.time : prev.bestTime ?? null,
      bestScore: Math.max(prev.bestScore || 0, result.score),
      ghost: isBestTime && result.ghost ? result.ghost : prev.ghost || null,
    };
    data.unlocked = Math.max(data.unlocked, result.index + 2);
    persist();
    return { isBestTime: isBestTime && prev.bestTime != null, isBestScore, firstClear: prev.stars == null };
  },

  resetAll() {
    const settings = data.settings;
    data = structuredClone(DEFAULTS);
    data.settings = settings;
    persist();
  },
};
