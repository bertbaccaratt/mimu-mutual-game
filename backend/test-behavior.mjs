// Offline check of the bot detector: node test-behavior.mjs
// A metronome script and a jittery human-like script play the same game; only the first should be flagged.
import { createRequire } from 'node:module';
import { newStats, observe, judge } from './src/behavior.js';
const Sim = createRequire(import.meta.url)('../assets/sim.js');

function play(metro, ticks, seed = 777) {
  const sim = Sim.create(seed, { wallet: 0 }), S = sim.S, st = newStats();
  let n = 0, nextAt = 0, rs = 12345, count = 0;
  const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const act = (c) => { observe(st, S, S.tick, c); Sim.applyCode(sim, c); count++; };
  while (S.tick < ticks && !S.dead) {
    if (S.wait === 'revive') { act(Sim.ACT.REVIVE); continue; }
    if (metro ? S.tick % 7 === 0 : S.tick >= nextAt) {
      if (!metro) nextAt = S.tick + 4 + Math.floor(rnd() * 11);
      let near = null;
      for (const o of S.obj) if ((o.t === 'chair' || o.t === 'banner') && !o.hit && o.z - S.dist > 4 && o.z - S.dist < 14 && Math.abs(o.x - S.lane) < .5 && (!near || o.z < near.z)) near = o;
      if (near) { const d = near.z - S.dist; if (near.t === 'chair' && d < 8) act(Sim.ACT.U); else if (near.t === 'banner' && d < 7) act(Sim.ACT.D); else if (d >= 8 && (n++ % 3 === 0)) act(S.lane > -1 ? Sim.ACT.L : Sim.ACT.R); }
    }
    sim.step(); sim.drain();
  }
  return { count, st, S, flags: judge(st, S, S.tick) };
}
for (const metro of [true, false]) {
  const r = play(metro, Number(process.argv[2] || 30000));
  console.log(metro ? 'metronome' : 'jittery  ', 'inputs', r.count, 'counted', r.st.n, 'jumps', r.st.jn, 'ticks', r.S.tick, 'dead', r.S.dead, '->', JSON.stringify(r.flags));
}

