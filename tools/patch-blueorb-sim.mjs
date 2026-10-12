// Rules v6: the blue orb at 50 million and 100 million points (opposite of the red orb: top speed +5 for 60 seconds).
import fs from 'node:fs';
const p = new URL('../assets/sim.js', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const rep = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); t = t.replace(a, () => b); };
rep('orbNext: 2500000, orbT: 0,', 'orbNext: 2500000, orbT: 0, blueN: 0, surgeT: 0,');
rep("if (S.orbT > 0) { S.orbT -= dt; if (S.orbT <= 0) { S.orbT = 0; emit('orbend'); } }",
  "if (S.orbT > 0) { S.orbT -= dt; if (S.orbT <= 0) { S.orbT = 0; emit('orbend'); } }\n" +
  "      /* the blue orb (rules v6, only at 50 million and at 100 million points): the opposite of the red orb. Catch it and the top speed goes UP by 5 for 60 seconds, then eases back. */\n" +
  "      if (S.surgeT > 0) { S.surgeT -= dt; if (S.surgeT <= 0) { S.surgeT = 0; emit('surgeend'); } }");
rep('- (S.orbT > 0 ? (rv >= 5 ? 5 : .5) : 0)) * (S.slow', '- (S.orbT > 0 ? (rv >= 5 ? 5 : .5) : 0) + (S.surgeT > 0 ? 5 : 0)) * (S.slow');
rep('if (S.gateZ < S.dist + FAR) spawnGate();',
  "if (rv >= 6 && S.blueN < 2 && S.score >= (S.blueN ? 100000000 : 50000000)) { S.blueN++; const o = mk('pick', rp([-1, 0, 1]), S.dist + FAR - 9); o.k = 'blue'; emit('blueseen'); }\n" +
  '      if (S.gateZ < S.dist + FAR) spawnGate();');
rep("else if (o.k === 'orb') S.orbT = rv >= 5 ? 60 : 180; else", "else if (o.k === 'orb') S.orbT = rv >= 5 ? 60 : 180; else if (o.k === 'blue') S.surgeT = 60; else");
rep('const VERSION = 5;', 'const VERSION = 6;');
fs.writeFileSync(p, t);
console.log('sim.js patched');
