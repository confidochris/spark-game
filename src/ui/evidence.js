import { GIVE_URL } from '../config.js';
export function evidencePanel(title, info, close) {
  const box = document.createElement('dialog');
  box.className = 'research-station';
  box.setAttribute('aria-label',title);
  const add = (tag, message) => {
    const el = document.createElement(tag);
    el.textContent = message;
    box.append(el);
    return el;
  };
  add('h2',title);
  add('p',info.note);
  for (const line of info.cards || []) add('p',line);
  const feedback = add('p','');
  feedback.setAttribute('role','status');
  const buttons = (info.answers || []).map((text,n) => {
    const button = add('button',text);
    button.onclick = () => {
      if (info.choose(n)) {
        feedback.textContent = info.reward;
        buttons.forEach(b => b.remove());
      } else feedback.textContent = info.hint;
    };
    return button;
  });
  add('button','Return to the maze').onclick = () => box.close();
  if (info.allowGiving) {
    const link = add('a','Support mental illness research ↗');
    link.className = 'donation-link';
    link.href = GIVE_URL;
    link.target = '_blank';
    link.rel = 'noopener';
  }
  document.body.append(box);
  box.addEventListener('close', () => { box.remove(); close(); }, {once:true});
  box.showModal();
  return box;
}
