// ============================================================================
//  main.js: starts the game
// ----------------------------------------------------------------------------
//  This file only sets up Phaser and lists the scenes (screens) in order.
//  The first scene in the list (Boot) runs first.
//
//  Scenes:
//    Boot          draws all the pictures with code, then opens the Title
//    Title         the start screen and settings
//    LevelSelect   pick a level
//    Play          the game itself (one level)
//    Pause         the pause menu (on top of Play)
//    LevelComplete stars, score and the story after each level
//    End           "Discovery Unlocked" after the final level
// ============================================================================
import { MentorScene } from './scenes/MentorScene.js';
import Phaser from 'phaser';
import { CSS } from './config.js';
import { computeGameSize, RES } from './systems/layout.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { LevelSelectScene } from './scenes/LevelSelectScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { TryAgainScene } from './scenes/TryAgainScene.js';
import { EndScene } from './scenes/EndScene.js';

const size = computeGameSize();

const game = new Phaser.Game({
  type: Phaser.AUTO, // WebGL if the browser has it
  parent: 'app',
  backgroundColor: CSS.bg,
  width: Math.round(size.width * RES),
  height: Math.round(size.height * RES),
  scale: {
    mode: Phaser.Scale.FIT, // keep the shape, fit inside the window
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 3 }, // allow a few fingers at once
  render: { antialias: true },
  scene: [BootScene, MentorScene, TitleScene, CharacterSelectScene, LevelSelectScene, PlayScene, PauseScene, TryAgainScene, LevelCompleteScene, EndScene],
});

// When the window changes shape (for example a phone turns sideways),
// pick a new game size so the game keeps filling the screen.
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const next = computeGameSize();
    const cur = game.scale.gameSize;
    if (Math.round(next.width * RES) !== cur.width || Math.round(next.height * RES) !== cur.height) game.scale.setGameSize(Math.round(next.width * RES), Math.round(next.height * RES));
  }, 150);
});

// Handy for testing in the browser console: window.sparkGame
if (import.meta.env.DEV || new URLSearchParams(location.search).has('test')) window.sparkGame = game;
