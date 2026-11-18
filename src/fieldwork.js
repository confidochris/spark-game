export const chapters = [
  ['The community funded our first field kit. What will help you find a signal in the fog?', 'Fit a wider lens', 'Carry a reserve battery'],
  ['Which lead should be near the entry to your next survey?', 'Start near the sensor', 'Start near Maya'],
  ['Which document should be at the first field station?', 'Pilot result first', 'Study limitation first'],
  ['Which partner needs the nearer field station?', 'West lab', 'Home lab'],
  ['Which dataset should your first field station carry?', 'Site A', 'Site B'],
  ['Your first study is ready to present. What question would you take into the next one?', 'Does the pattern repeat over time?', 'Does the pattern hold in a new setting?'],
];

const key = 'spark-field-notebook-v1';
let book;
try { book = JSON.parse(sessionStorage.getItem(key)); } catch {}
book ||= {};
const shared = new URLSearchParams(location.search).get('route');
export const challenge = /^[01]{6}$/.test(shared || '') ? shared : null;
function save() { try { sessionStorage.setItem(key, JSON.stringify(book)); } catch {} }
export function beginStudy() { book = { choices: [], paths: {} }; save(); }
export function choice(i) { return Number(challenge?.[i] ?? book.choices?.[i] ?? 0); }
export function decide(i, n) { (book.choices ||= [])[i] = n; save(); }
export function recordPath(i, path, notes, distinction) {
  (book.paths ||= {})[i] = path;
  (book.notes ||= {})[i] = notes;
  (book.honors ||= {})[i] = distinction;
  save();
}
export function routeLink() {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('route', chapters.map((_, i) => choice(i)).join(''));
  return url.href;
}
export function drawPoster(canvas, levels, character) {
  canvas.width = 840; canvas.height = 1250;
  const c = canvas.getContext('2d');
  c.fillStyle = '#09271d'; c.fillRect(0, 0, 840, 940);
  function line(str, y, font, color) {
    c.fillStyle = color; c.font = font; c.fillText(str, 48, y, 745);
  }
  line('FOUNDATION OF HOPE   /   SPARK', 66, 'bold 22px sans-serif', '#c5ed85');
  line('My first research poster', 145, '56px Georgia', '#fff2d3');
  line(character + '  ·  PhD candidate  ·  Simulated field study', 195, '25px sans-serif', '#d8ebdc');
  levels.forEach((level, i) => {
    const x = 50 + i % 3 * 253, y = 238 + Math.floor(i / 3) * 208;
    const size = Math.min(8, 155 / level.map.length);
    c.fillStyle = '#28563f';
    level.map.forEach((row, ry) => [...row].forEach((v, rx) => {
      if (v !== '#') c.fillRect(x + rx * size, y + ry * size, size, size);
    }));
    c.fillStyle = '#f6c55b';
    for (const [rx, ry] of book.paths?.[i] || []) c.fillRect(x + rx * size, y + ry * size, size, size);
    c.font = '18px sans-serif'; c.fillStyle = '#dcf0da'; c.fillText(level.name, x, y + 176, 222);
  });
  line('WHAT I OBSERVED', 690, 'bold 19px sans-serif', '#c5ed85');
  const notes = Object.values(book.notes || {}).flat();
  if (notes.some(note => note.startsWith('Record D'))) {
    line('Record D · Early waking on Mon 5, 12 and 19.', 735, '28px Georgia', '#fff2d3');
    line('Maya’s calendar · Opening shift on all three dates.', 778, '28px Georgia', '#fff2d3');
  }
  line('WHAT I WOULD TEST NEXT', 858, 'bold 19px sans-serif', '#c5ed85');
  line(chapters[5][1 + choice(5)], 905, '30px Georgia', '#fff2d3');
  line('FIELD DISTINCTIONS', 975, 'bold 19px sans-serif', '#c5ed85');
  Object.values(book.honors || {}).filter(Boolean).forEach((honor,i) => line(honor,1015+i*36,'23px sans-serif','#fff2d3'));

}
