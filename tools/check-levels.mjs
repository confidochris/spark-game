// Checks every level in src/levels.js can be finished.
// Run it with:  npm run check-levels
import { LEVELS } from '../src/levels.js';

let ok = true;
const fail = (lvl, msg) => { ok = false; console.log(`  ✗ ${lvl.id}: ${msg}`); };

for (const lvl of LEVELS) {
  const m = lvl.map;
  const H = m.length, W = m[0].length;
  m.forEach((row, y) => { if (row.length !== W) fail(lvl, `row ${y} is ${row.length} wide, expected ${W}`); });
  const at = (x, y) => (y < 0 || y >= H || x < 0 || x >= W ? '#' : m[y][x] || '#');
  let start = null, keys = 0, gifts = 0, exits = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    if (c === 'S') start = [x, y];
    if (c === 'K') keys++;
    if (c === '$') gifts++;
    if (c === 'E') exits++;
    if ((x === 0 || y === 0 || x === W - 1 || y === H - 1) && c !== '#') fail(lvl, `edge square (${x},${y}) is not a wall`);
  }
  if (!start) { fail(lvl, 'no S'); continue; }
  if (exits !== 1) fail(lvl, `needs exactly 1 E, found ${exits}`);
  // Flood fill, opening gates as discoveries are collected (doors cycle, so they count as open).
  let held = 0, seen, prev = -1, exitReached = false;
  const collected = new Set();
  while (held !== prev) {
    prev = held;
    seen = new Set([start.join()]);
    const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      const c = at(x, y);
      if (c === 'K') collected.add(`${x},${y}`);
      if (c === 'E') { exitReached = true; continue; }
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy, n = at(nx, ny);
        if (n === '#' || seen.has(`${nx},${ny}`)) continue;
        if (/[1-9]/.test(n) && Number(n) > held) continue;
        if (n === 'E' && held < keys) continue;
        seen.add(`${nx},${ny}`); q.push([nx, ny]);
      }
    }
    held = collected.size;
  }
  let reachableGifts = 0;
  for (const s of seen) { const [x, y] = s.split(',').map(Number); if (at(x, y) === '$') reachableGifts++; }
  if (held < keys) fail(lvl, `only ${held} of ${keys} discoveries can be reached`);
  if (!exitReached && held >= keys) {
    // re-run once with all keys to see if E is reachable
  }
  if (reachableGifts < gifts) fail(lvl, `only ${reachableGifts} of ${gifts} gifts can be reached`);
  const eOk = [...seen].some((s) => { const [x, y] = s.split(',').map(Number); return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => at(x+dx,y+dy) === 'E'); });
  if (!eOk) fail(lvl, 'the keyhole E cannot be reached');
  console.log(`${eOk && held >= keys ? '✓' : '✗'} ${lvl.id.padEnd(10)} ${W}x${H}  discoveries ${keys}  gifts ${gifts}  par ${lvl.par}s`);
}
process.exit(ok ? 0 : 1);
