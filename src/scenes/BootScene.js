// ============================================================================
//  BootScene.js: the very first scene
// ----------------------------------------------------------------------------
//  Most games load image and sound files here ("preload"). Spark draws all of
//  its pictures with code instead, so this scene just makes them and moves on.
// ============================================================================
import Phaser from 'phaser';
import { CHARACTERS } from '../config.js';
import { createTextures } from '../systems/textures.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    for (const c of CHARACTERS) this.load.image(`face-${c.id}`, c.file);
  }

  create() {
    createTextures(this);
    this.scene.start('Title');
  }
}
