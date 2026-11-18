import Phaser from 'phaser';
import { chapters, challenge, choice, decide, drawPoster, routeLink } from '../fieldwork.js';
import { LEVELS } from '../levels.js';
import { Save } from '../systems/save.js';
import { GIVE_URL } from '../config.js';

export class MentorScene extends Phaser.Scene {
  constructor() { super('Mentor'); }
  create({ levelIndex, poster = false }) {
    const dialog = document.createElement('dialog');
    dialog.className = 'research-station mentor';
    document.body.append(dialog);
    this.events.once('shutdown', () => dialog.remove());
    dialog.oncancel = e => e.preventDefault();
    const add = (tag, value) => {
      const el = document.createElement(tag);
      el.textContent = value;
      dialog.append(el);
      return el;
    };
    const act = (name, fn) => { const b = add('button', name); b.onclick = fn; return b; };
    const who = Save.settings.character === 'shelley' ? 'Shelley' : 'Chris';
    const portrait = (file, alt) => {
      const img = add('img', '');
      img.src = import.meta.env.BASE_URL + 'characters/' + file;
      img.alt = alt;
    };
    const showPoster = () => {
      dialog.replaceChildren();
      const canvas = add('canvas', '');
      canvas.setAttribute('aria-label', who + '’s research poster. Next question: ' + chapters[5][1 + choice(5)]);
      drawPoster(canvas, LEVELS, who);
      const download = add('a', 'Download my poster');
      download.download = 'Spark-research-poster.png';
      download.href = canvas.toDataURL('image/png');
      act('Share my research route', async () => {
        const url = routeLink();
        try {
          if (navigator.share) await navigator.share({title:'Try my Spark research route', url});
          else { await navigator.clipboard.writeText(url); shareStatus.textContent = 'Challenge link copied.'; }
        } catch (e) {
          if (e.name !== 'AbortError') { const input = add('input', ''); input.value = url; input.select(); }
        }
      });
      const shareStatus = add('small', ''); shareStatus.setAttribute('role','status');
      act('Continue to results', () => this.scene.start('End'));
      const give = add('a', 'Fund real mental illness research ↗');
      give.className = 'donation-link';
      give.href = GIVE_URL; give.target = '_blank'; give.rel = 'noopener';
    };
    dialog.showModal();
    if (poster) { showPoster(); return; }
    add('small', 'FIELD NOTES   /   CHAPTER ' + (levelIndex + 1));
    portrait('andersen.webp', 'Dr. Andersen');
    add('h2', 'Dr. Andersen');
    add('p', chapters[levelIndex][0]);
    portrait(who.toLowerCase() + '.png', who);
    add('strong', who + ' · PhD candidate');
    for (const n of [0,1]) {
      if (challenge && choice(levelIndex) !== n) continue;
      act(chapters[levelIndex][n + 1], () => {
        decide(levelIndex, n);
        if (levelIndex === 5) showPoster();
        else this.scene.start('Play', {levelIndex: levelIndex + 1});
      });
    }
    add('small', challenge ? 'Shared route · Your friend chose this response.' : 'Fictional mentor dialogue');
  }
}
