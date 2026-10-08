// Determinism + speed check for the shared game core: node test-sim.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Sim = require('../assets/sim.js');
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) process.exitCode = 1; };

let guard = 0; const G = (where) => { if (++guard > 3e6) throw new Error('loop guard at ' + where); };
// a simple bot: dodge/jump based on what's ahead, recording its inputs
function play(seed, maxTicks, wallet = 0) {
  const sim = Sim.create(seed, { wallet }), S = sim.S, inputs = [];
  const act = (code) => { inputs.push([S.tick, code]); Sim.applyCode(sim, code); };
  let n = 0;
  while (S.tick < maxTicks && !S.dead) { G('play');
    if (S.wait === 'revive') { act(Sim.ACT.REVIVE); continue; }
    if (S.tick % 7 === 0) {
      // look at the nearest hazard in my lane
      let near = null;
      for (const o of S.obj) { if ((o.t === 'chair' || o.t === 'banner') && !o.hit && o.z - S.dist > 4 && o.z - S.dist < 14 && Math.abs(o.x - S.lane) < .5) { if (!near || o.z < near.z) near = o; } }
      if (near) {
        const d = near.z - S.dist;
        if (near.t === 'chair' && d < 8) act(Sim.ACT.U);
        else if (near.t === 'banner' && d < 7) act(Sim.ACT.D);
        else if (d >= 8 && ((n++) % 3 === 0)) act(S.lane > -1 ? Sim.ACT.L : Sim.ACT.R);
      }
    }
    sim.step(); sim.drain();
  }
  return { sim, inputs };
}
function replay(seed, inputs, ticks, wallet = 0) {
  const sim = Sim.create(seed, { wallet }), S = sim.S; let i = 0;
  while (S.tick < ticks && !S.dead) { G('replay');
    while (i < inputs.length && inputs[i][0] === S.tick) { Sim.applyCode(sim, inputs[i][1]); i++; }
    if (S.wait) break;                               // waiting for an input that never came: the run can't continue
    sim.step(); sim.drain();
  }
  while (i < inputs.length && inputs[i][0] === S.tick) { Sim.applyCode(sim, inputs[i][1]); i++; }
  return sim;
}

const seed = 123456789;
const a = play(seed, 18000, 100);
const A = a.sim.S;
console.log(`bot run: ${A.tick} ticks, score ${Math.floor(A.score)}, dist ${Math.floor(A.dist)}, coins ${A.coins}, dead ${A.dead}, inputs ${a.inputs.length}`);
const b = replay(seed, a.inputs, A.tick, 100), B = b.S;
ok('replay reproduces the exact score', Math.floor(A.score) === Math.floor(B.score) && A.score === B.score, `${A.score} vs ${B.score}`);
ok('replay reproduces coins / dist / tick', A.coins === B.coins && A.dist === B.dist && A.tick === B.tick);

// different inputs give a different result
const c = replay(seed, a.inputs.slice(0, Math.max(1, a.inputs.length >> 1)), A.tick, 100).S;
ok('different inputs -> different score', c.score !== A.score, `${c.score} vs ${A.score}`);
// different seed -> different world
const d = replay(seed + 1, a.inputs, A.tick, 100).S;
ok('different seed -> different score', d.score !== A.score);

// chunked replay through snapshot/restore (what the server does) equals the one-shot replay
{
  const CH = 2000, sim = Sim.create(seed, { wallet: 100 }); let snap = null, i = 0;
  for (let from = 0; from < A.tick; from += CH) {
    const to = Math.min(A.tick, from + CH);
    const s = Sim.create(seed, { wallet: 100 }); if (snap) s.restore(snap);
    while (s.S.tick < to && !s.S.dead) {
      while (i < a.inputs.length && a.inputs[i][0] === s.S.tick) { Sim.applyCode(s, a.inputs[i][1]); i++; }
      if (s.S.wait) break;
      s.step(); s.drain();
    }
    while (i < a.inputs.length && a.inputs[i][0] === s.S.tick) { Sim.applyCode(s, a.inputs[i][1]); i++; }
    snap = s.snapshot();
  }
  const f = Sim.create(seed, { wallet: 100 }); f.restore(snap);
  ok('chunked snapshot/restore replay matches', f.S.score === A.score && f.S.coins === A.coins && f.S.tick === A.tick, `${f.S.score} vs ${A.score}`);
}

// speed
{
  const t0 = process.hrtime.bigint();
  replay(seed, a.inputs, A.tick, 100);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  console.log(`replay speed: ${A.tick} ticks in ${ms.toFixed(1)} ms  (${(ms / A.tick * 1000).toFixed(2)} us/tick, ${(ms / A.tick * 2000).toFixed(1)} ms per 2000-tick chunk)`);
}
// a few more seeds to be sure there is no divergence
let allSame = true;
for (let s = 1; s <= 25; s++) { const p = play(s * 7919, 6000, 50); const r = replay(s * 7919, p.inputs, p.sim.S.tick, 50); if (r.S.score !== p.sim.S.score) { allSame = false; console.log('diverged on seed', s * 7919); } }
ok('25 more seeds replay identically', allSame);
