import Phaser from 'phaser';
import { CHARACTERS } from '../config.js';
import { Save } from '../systems/save.js';

export class CharacterSelectScene extends Phaser.Scene {
  constructor() { super('CharacterSelect'); }
  create(data) {
    const dialog = document.createElement('dialog');
    dialog.className = 'research-station onboarding';
    dialog.setAttribute('aria-label','Your research team');
    document.body.append(dialog);
    this.events.once('shutdown', () => dialog.remove());
    dialog.oncancel = event => { event.preventDefault(); this.scene.start('Title'); };
    const add = (tag, text) => {
      const el = document.createElement(tag); el.textContent = text; dialog.append(el); return el;
    };
    add('h2','Your lab badge');
    const scroll = add('div',''); scroll.className = 'badge-options';
    const grid = document.createElement('div'); scroll.append(grid); grid.className = 'avatar-grid';
    let picked = CHARACTERS.find(c => c.id === Save.settings.character) || CHARACTERS[0];
    const buttons = CHARACTERS.map(c => {
      const b = document.createElement('button');
      const img = new Image(); img.src = c.file; img.alt = c.name; b.append(img); grid.append(b);
      b.setAttribute('aria-pressed', String(c === picked));
      b.onclick = () => { picked = c; buttons.forEach(el => el.setAttribute('aria-pressed', String(el === b))); };
      return b;
    });
    const label = add('label','First name or nickname'); label.htmlFor = 'badge-name';
    const input = add('input',''); input.id = label.htmlFor; input.maxLength = 24; input.value = Save.settings.badge || '';
    const start = add('button',data?.returnTo ? 'Save badge' : 'Continue to story →');
    start.onclick = () => {
      const name = input.value.trim();
      if (!name) { input.setCustomValidity('Enter a name for your badge.'); input.focus(); input.reportValidity(); return; }
      Save.setSetting('badge',name); Save.setSetting('character',picked.id);
      if (data?.returnTo) { this.scene.start(data.returnTo); return; }
      dialog.replaceChildren();
      dialog.classList.add('story-intro');
      const art = add('img',''); art.className = 'story-frame'; art.src = 'story/kitchen.webp'; art.alt = 'Maya sharing dinner photos with her dad by phone';
      add('small','A fictional North Carolina community');
      add('h2','Maya’s kitchen');
      add('p','“Dad and I traded dinner photos. When my depression came back, I stopped sending mine. He noticed before I did.”');
      add('p','Could changes in sleep offer an early clue for some people? Your new lab has a question to test.');
      const fact = add('p','In 2024, about 1 in 3 U.S. adults ages 18–25 experienced mental illness.');
      const source = document.createElement('a'); source.textContent = 'SAMHSA · 2024 survey, table 9.45B'; source.href = 'https://www.samhsa.gov/data/sites/default/files/reports/rpt56484/NSDUHDetailedTabs2024/NSDUHDetailedTabs2024/2024-nsduh-detailed-tables-sect9pe.htm'; source.target = '_blank'; source.rel = 'noopener'; fact.append(source);
      const go = add('button','Start Level 1 →'); go.onclick = () => this.scene.start('Play',{levelIndex:0}); go.focus();
    };
    input.oninput = () => input.setCustomValidity('');
    input.onkeydown = e => { if (e.key === 'Enter') start.click(); };
    dialog.showModal();
  }
}
