// ============================================================================
//  sound.js: every sound in the game, made with code (Web Audio)
// ----------------------------------------------------------------------------
//  No audio files are needed. Each sound is a few lines that shape a tone.
//  Browsers only allow sound after the player taps or presses a key, so the
//  audio starts on the first input (see Sound.unlock()).
//  Try changing the frequencies (Hz) below to make your own sounds.
// ============================================================================
import { Save } from './save.js';

let ctx = null; // the Web Audio "context" (the sound engine)
let master = null; // overall volume knob
let musicGain = null; // separate knob for the soft background hum
let musicNodes = [];
let noiseBuffer = null;
let musicWanted = false;

function ensure() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = Save.settings.muted ? 0 : 0.6;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  musicGain.connect(master);
  // One second of random "static" noise, reused by several sounds.
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const ch = noiseBuffer.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Play one tone. type: 'sine' | 'triangle' | 'square' | 'sawtooth' */
function tone({ freq = 440, to = null, type = 'sine', start = 0, dur = 0.15, vol = 0.3, attack = 0.005 }) {
  if (!ensure() || Save.settings.muted) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** A short burst of filtered noise (for Static and doors). */
function noise({ start = 0, dur = 0.2, vol = 0.25, freq = 1200, q = 0.8 }) {
  if (!ensure() || Save.settings.muted) return;
  const t0 = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

// Musical notes (Hz) used below: a bright, hopeful major scale.
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G4: 392, C4: 261.63, E4: 329.63, A3: 220, F3: 174.61, G3: 196, C3: 130.81 };
const DOT_SCALE = [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6];

export const Sound = {
  /** Call on the first tap/keypress so the browser allows audio. */
  unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (musicWanted) this.startMusic();
  },

  get muted() {
    return Save.settings.muted;
  },

  setMuted(muted) {
    Save.setSetting('muted', muted);
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.05);
  },

  toggleMute() {
    this.setMuted(!Save.settings.muted);
    if (!Save.settings.muted) this.click();
    return Save.settings.muted;
  },

  // ---- Sound effects -------------------------------------------------------
  dot(combo = 0) {
    tone({ freq: DOT_SCALE[combo % DOT_SCALE.length], type: 'triangle', dur: 0.07, vol: 0.07 });
  },
  gift() {
    tone({ freq: N.E5, type: 'triangle', dur: 0.12, vol: 0.25 });
    tone({ freq: N.C6, type: 'triangle', start: 0.08, dur: 0.3, vol: 0.25 });
  },
  discovery() {
    [N.C5, N.E5, N.G5, N.C6, N.E6].forEach((f, i) =>
      tone({ freq: f, type: 'sine', start: i * 0.06, dur: 0.35, vol: 0.22 })
    );
  },
  unlockChime() {
    // the keyhole opens: a rising sweep and a warm chord
    tone({ freq: 220, to: 880, type: 'sawtooth', dur: 0.5, vol: 0.05 });
    [N.C5, N.E5, N.G5].forEach((f) => tone({ freq: f, type: 'triangle', start: 0.35, dur: 0.9, vol: 0.15 }));
  },
  hit() {
    noise({ dur: 0.35, vol: 0.35, freq: 900, q: 0.6 });
    tone({ freq: 180, to: 70, type: 'square', dur: 0.25, vol: 0.08 });
  },
  door(closing) {
    noise({ dur: 0.08, vol: 0.2, freq: closing ? 400 : 1600, q: 2 });
    tone({ freq: closing ? 110 : 220, type: 'square', dur: 0.06, vol: 0.05 });
  },
  lifeLost() {
    tone({ freq: N.G4, to: N.G4 / 2, type: 'triangle', dur: 0.45, vol: 0.16 });
    tone({ freq: N.G4 * 0.75, to: N.G4 / 3, type: 'sine', dur: 0.6, vol: 0.1, start: 0.12 });
  },
  lowLight() {
    tone({ freq: 660, type: 'sine', dur: 0.09, vol: 0.06 });
  },
  tick() {
    tone({ freq: 1400, type: 'square', dur: 0.03, vol: 0.03 });
  },
  gate() {
    tone({ freq: N.G4, to: N.G5, type: 'triangle', dur: 0.3, vol: 0.18 });
  },
  bump() {
    tone({ freq: 140, type: 'sine', dur: 0.05, vol: 0.06 });
  },
  click() {
    tone({ freq: 880, type: 'triangle', dur: 0.05, vol: 0.12 });
  },
  star(i = 0) {
    tone({ freq: [N.E5, N.G5, N.C6][i] || N.C6, type: 'triangle', dur: 0.4, vol: 0.22 });
    tone({ freq: ([N.E5, N.G5, N.C6][i] || N.C6) * 2, type: 'sine', start: 0.02, dur: 0.3, vol: 0.06 });
  },
  win() {
    // a short fanfare for finishing a level
    const seq = [N.C5, N.E5, N.G5, N.C6];
    seq.forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.11, dur: 0.3, vol: 0.2 }));
    [N.C5, N.E5, N.G5, N.C6].forEach((f) => tone({ freq: f, type: 'sine', start: 0.5, dur: 1.2, vol: 0.09 }));
  },
  finale() {
    // the big "Discovery Unlocked" moment
    const seq = [N.G4, N.C5, N.E5, N.G5, N.C6, N.E6];
    seq.forEach((f, i) => tone({ freq: f, type: 'triangle', start: i * 0.1, dur: 0.45, vol: 0.18 }));
    [N.C4, N.E4, N.G4, N.C5].forEach((f) => tone({ freq: f, type: 'sine', start: 0.6, dur: 2.2, vol: 0.1 }));
  },

  // ---- Background hum ---------------------------------------------------------
  // A very quiet, slowly changing chord. It follows the mute setting.
  startMusic() {
    musicWanted = true;
    if (!ensure() || ctx.state !== 'running' || musicNodes.length) return;
    const chords = [
      [N.C3, N.G3, N.E4],
      [N.A3, N.E4, N.C5 / 2],
      [N.F3, N.C4, N.A3 * 2],
      [N.G3, N.D5 / 2, N.G4],
    ];
    const voices = [0, 1, 2].map(() => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      const g = ctx.createGain();
      g.gain.value = 0.33;
      osc.connect(g).connect(musicGain);
      osc.start();
      return osc;
    });
    let step = 0;
    const change = () => {
      const chord = chords[step % chords.length];
      voices.forEach((osc, i) => osc.frequency.setTargetAtTime(chord[i], ctx.currentTime, 0.8));
      step++;
    };
    change();
    const timer = setInterval(change, 4000);
    musicGain.gain.setTargetAtTime(0.05, ctx.currentTime, 1.5);
    musicNodes = [...voices, { stop: () => clearInterval(timer) }];
  },

  stopMusic() {
    musicWanted = false;
    if (!ctx || !musicNodes.length) return;
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    const nodes = musicNodes;
    musicNodes = [];
    setTimeout(() => nodes.forEach((n) => n.stop()), 1200);
  },
};
