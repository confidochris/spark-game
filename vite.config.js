// Vite settings. You rarely need to change these.
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // lets the built game (the dist folder) run from any web folder
  build: {
    chunkSizeWarningLimit: 2000, // Phaser is big; that's normal for a game
  },
});
