import { GIVE_URL } from '../config.js';

export function researchCheckpoint(level, resume) {
  const dialog = document.createElement('dialog');
  dialog.className = 'research-station';
  dialog.setAttribute('aria-labelledby', 'station-heading');
  const add = (tag, text) => {
    const el = document.createElement(tag);
    el.textContent = text;
    dialog.append(el);
    return el;
  };
  function action(text, click) {
    const button = add('button', text);
    button.onclick = click;
    return button;
  }
  function finish() {
    action('Return to the maze', () => dialog.close()).focus();
    const link = add('a', 'Give to real research ↗');
    link.className = 'donation-link';
    link.href = GIVE_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  const heading = add('h2', level === 'seed' ? 'Five gifts opened the lab' : 'Which signal holds up?');
  heading.id = 'station-heading';
  document.body.append(dialog);
  dialog.addEventListener('cancel', event => event.preventDefault());
  dialog.addEventListener('close', () => { dialog.remove(); resume(); }, { once: true });
  dialog.showModal();
  if (level === 'seed') {
    const lab = add('img',''); lab.className = 'story-frame'; lab.src = 'story/lab.webp'; lab.alt = 'The community lab with five glowing windows';
    add('p', 'One neighbor could help with supplies. Together, five neighbors funded a pilot study. Switch on the equipment to take your first reading.');
    const pulse = action('Power up the lab', () => {
      pulse.remove();
      add('p', 'A signal came back! Your beacon has marked the area to explore.');
      finish();
    });
    pulse.focus();
    return;
  }
  add('p', 'In mental illness research, testing an observation again can help separate a pattern from chance. Compare the readings from two stations.');
  const repeat = Math.floor(Math.random() * 3);
  const symbols = ['◆ ○ ◆', '○ ◆ ○', '◆ ◆ ○'];
  const feedback = add('p', 'Select the signal that repeated at both stations.');
  feedback.setAttribute('aria-live', 'polite');
  const choices = symbols.map((first, index) => {
    const second = index === repeat ? first : symbols[(index + 1) % 3];
    return action('Signal ' + (index + 1) + '    ' + first + '   /   ' + second, () => {
      if (index !== repeat) {
        choices[index].disabled = true;
        feedback.textContent = 'That reading changed. Compare the symbols on each side of the slash.';
        return;
      }
      choices.forEach(button => button.remove());
      feedback.textContent = 'You found the repeating signal. The beacon has revealed your next search area.';
      finish();
    });
  });
  choices[0].focus();
}
