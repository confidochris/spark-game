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
    const who = Save.settings.badge || 'Researcher';
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
    const sceneArt = add('img',''); sceneArt.className = 'story-frame'; sceneArt.src = levelIndex === 3 || levelIndex === 5 ? 'story/kitchen.webp' : 'story/lab.webp'; sceneArt.alt = levelIndex === 3 || levelIndex === 5 ? 'Maya and her father at dinner' : 'Community research lab';
    add('h2', ['Your seed grant','A faint signal','The fourth record','Maya’s early shift','Three partner labs','Discovery unlocked'][levelIndex]);

    portrait((Save.settings.character || 'researcher0') + '.webp', who);
    add('strong', who + ' · PhD candidate');
    function offerRoute() {
      add('p', chapters[levelIndex][0]);
    for (const n of [0,1]) {
      if (challenge && choice(levelIndex) !== n) continue;
      act(chapters[levelIndex][n + 1], () => {
        decide(levelIndex, n);
        if (levelIndex === 5) showPoster();
        else this.scene.start('Play', {levelIndex: levelIndex + 1});
      });
    }
    }
    const reviews = [
      ['Five neighbors pooled enough for a small pilot. Which study can open today?', 'Launch the three-lab study', 'Fund the pilot', 'The larger study needs staff and equipment beyond this budget.'],
      ['One participant’s sleep changed. What can you report?', 'An observation to test', 'A reliable prediction', 'One record cannot establish a pattern across people.'],
      ['The fourth record differs. Which evidence is missing?', 'Discard the fourth record', 'Ask about the participant’s schedule', 'Leaving it out would hide a possible explanation.'],
      ['Maya started an early shift. What belongs in the NIH application?', 'The pilot found a pattern worth testing', 'The pilot proved a cause', 'The work schedule offers another explanation. The larger test is still needed.'],
      ['The fictional NIH award funds three sites. Are their readings comparable?', 'Pool every reading immediately', 'Check that the sites measured the same things', 'Different measurement rules could create a misleading pattern.'],
      ['Which finding does your fictional study support?', 'Sleep changes came first for some participants', 'Sleep changes predict every relapse', 'Several participants showed a different pattern. Your conclusion must include them.'],
    ];
    const [prompt, first, second, feedback] = reviews[levelIndex];
    const checkpoint = add('p', prompt);
    const status = add('p',''); status.setAttribute('role','status');
    const buttons = [first,second].map((answer,i) => act(answer, () => {
      if (i !== [1,0,1,0,1,0][levelIndex]) {
        status.textContent = feedback + ' Revise your decision to continue.'; buttons[i].disabled = true; return;
      }
      checkpoint.remove(); status.remove(); buttons.forEach(b => b.remove()); offerRoute();
    }));
    add('small', challenge ? 'Shared route · Your friend chose this response.' : 'Fictional community study');
  }
}
