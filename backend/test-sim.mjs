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

// Second Wind price: 30 $TMF, +10 for every million points scored; run coins pay first, the wallet tops up
{
  const at = (score, coins, wallet) => {
    const sim = Sim.create(99, { wallet }), S = sim.S;
    S.lives = 1; S.score = score; S.coins = coins;
    S.obj.push({ t: 'chair', x: S.px, z: S.dist + 4.3, y: 0, h: 1, type: 0, id: 99999 });
    sim.step();
    return { sim, S };
  };
  let r = at(0, 30, 0);
  ok('price is 30 at the start', r.S.wait === 'revive' && r.S.rc === 30, 'rc ' + r.S.rc);
  r.sim.revive(); ok('paying 30 from run coins', r.S.coins === 0 && r.S.walletPaid === 0 && r.S.lives === 1);
  r = at(12.5e6, 500, 0);
  ok('price is 150 at 12.5M points', r.S.wait === 'revive' && r.S.rc === 150, 'rc ' + r.S.rc);
  r.sim.revive(); ok('150 comes out of run coins', r.S.coins === 350 && r.S.walletPaid === 0);
  r = at(30e6, 100, 0);
  ok('at 30M with 100 coins and no wallet it cannot be afforded (run ends)', r.S.dead === true && r.S.wait === null);
  r = at(30e6, 100, 300);
  ok('price is 330 at 30M, the wallet tops up', r.S.wait === 'revive' && r.S.rc === 330, 'rc ' + r.S.rc);
  const snap = r.sim.snapshot(), sim2 = Sim.create(99, { wallet: 300 }); sim2.restore(snap);
  ok('the offered price survives snapshot/restore', sim2.S.rc === 330 && sim2.S.wait === 'revive');
  sim2.revive(); ok('paid 100 from run coins and 230 from the wallet', sim2.S.coins === 0 && sim2.S.walletPaid === 230);
  ok('rules version is 7', Sim.VERSION === 7, String(Sim.VERSION));
}

// Red orb (rules v5): -5 top speed for 60 s; a run that started on v4 keeps -0.5 for 3 minutes
{
  const orb = (v) => {
    const sim = Sim.create(31, { wallet: 0, v }), S = sim.S;
    S.dist = 3000; S.speed = 23; S.lives = 99; S.inv = 1e9;
    S.obj.push({ t: 'pick', k: 'orb', x: S.px, z: S.dist + 4.3, y: 0, id: 88888 });
    sim.step();
    const timer = S.orbT;
    const at = (secs) => { for (let i = 0; i < secs * 60; i++) { S.inv = 1e9; S.obj = S.obj.filter((o) => o.t === 'coin'); sim.step(); } return S.speed; };
    const s4 = at(4);
    return { timer, s4, sim, S, at };
  };
  const n = orb(5), o = orb(4);
  ok('v5 orb lasts 60 seconds', Math.round(n.timer) === 60, String(n.timer));
  ok('v4 orb still lasts 3 minutes', Math.round(o.timer) === 180, String(o.timer));
  ok('v5 orb slows the runner by about 5 within 4 seconds', n.s4 < 19.5 && n.s4 > 17, n.s4.toFixed(2));
  ok('v4 orb only trims about 0.5', o.s4 > 22.3, o.s4.toFixed(2));
  const s70 = n.at(60);
  ok('v5 speed comes back after the calm ends', s70 > 22, s70.toFixed(2) + ' orbT ' + n.S.orbT);
  ok('the default for new runs is the latest rules', Sim.create(1, {}).S.orbT === 0 && Sim.VERSION === 7);
}

// Blue orb (rules v6): only at 50 million and 100 million points, the opposite of the red orb: top speed +5 for 60 seconds
{
  const mk = (v) => { const sim = Sim.create(77, { wallet: 0, v }), S = sim.S; S.dist = 3000; S.speed = 23; S.lives = 99; S.inv = 1e9; return { sim, S }; };
  const blues = (S) => S.obj.filter((o) => o.t === 'pick' && o.k === 'blue').length;
  const a = mk(6);
  a.S.score = 49999999; a.sim.step();
  ok('no blue orb before 50 million', blues(a.S) === 0 && a.S.blueN === 0);
  a.S.score = 50000000; a.sim.step();
  ok('one blue orb appears at 50 million', blues(a.S) === 1 && a.S.blueN === 1);
  for (let i = 0; i < 30; i++) { a.S.score = 80000000; a.sim.step(); }
  ok('only one blue orb for the 50 million mark', a.S.blueN === 1);
  a.S.score = 100000000; a.sim.step();
  ok('a second blue orb appears at 100 million', a.S.blueN === 2);
  for (let i = 0; i < 30; i++) { a.S.score = 900000000; a.sim.step(); }
  ok('and no more after that', a.S.blueN === 2);
  // catching it
  const b = mk(6);
  b.S.obj.push({ t: 'pick', k: 'blue', x: b.S.px, z: b.S.dist + 4.3, y: 0, id: 99999 });
  b.sim.step();
  ok('catching a blue orb starts a 60 second surge', Math.round(b.S.surgeT) === 60, String(b.S.surgeT));
  for (let i = 0; i < 240; i++) { b.S.inv = 1e9; b.S.obj = b.S.obj.filter((o) => o.t === 'coin'); b.sim.step(); }
  ok('the surge speeds the runner up by about 5', b.S.speed > 26.5, b.S.speed.toFixed(2));
  for (let i = 0; i < 61 * 60; i++) { b.S.inv = 1e9; b.S.obj = b.S.obj.filter((o) => o.t === 'coin'); b.sim.step(); }
  ok('the speed eases back after the surge', b.S.surgeT === 0 && b.S.speed < 25, b.S.speed.toFixed(2));
  // older rules never get a blue orb
  const c = mk(5); c.S.score = 60000000; c.sim.step();
  ok('a run on v5 rules never gets a blue orb', blues(c.S) === 0 && !c.S.blueN);
  // survives snapshot / restore
  const d = mk(6); d.S.surgeT = 33; d.S.blueN = 1; const e = Sim.create(77, { wallet: 0, v: 6 }); e.restore(d.sim.snapshot());
  ok('surge and blue count survive snapshot/restore', e.S.surgeT === 33 && e.S.blueN === 1);
}

// Rules v7: when the red and blue orb appear together (50M and 100M) they are never in the same lane
{
  let same7 = 0, same6 = 0, n = 0;
  for (let seed = 1; seed <= 60; seed++) for (const [v, mark] of [[7, 5e7], [7, 1e8]]) {
    const sim = Sim.create(seed, { wallet: 0, v }), S = sim.S;
    S.dist = 3000; S.speed = 23; S.lives = 99; S.inv = 1e9; S.score = mark; S.orbNext = mark; S.blueN = mark === 1e8 ? 1 : 0;
    sim.step();
    const red = S.obj.find((o) => o.t === 'pick' && o.k === 'orb'), blue = S.obj.find((o) => o.t === 'pick' && o.k === 'blue');
    n++; if (red && blue && red.x === blue.x) same7++;
    if (!red || !blue) same7 += 1000;
  }
  ok('v7: red and blue orbs that appear together never share a lane', same7 === 0, same7 + ' clashes in ' + n + ' tries');
  for (let seed = 1; seed <= 60; seed++) {                                  // v6 runs replay exactly as before (the clash can still happen there)
    const sim = Sim.create(seed, { wallet: 0, v: 6 }), S = sim.S;
    S.dist = 3000; S.speed = 23; S.lives = 99; S.inv = 1e9; S.score = 5e7; S.orbNext = 5e7;
    sim.step();
    const red = S.obj.find((o) => o.k === 'orb'), blue = S.obj.find((o) => o.k === 'blue');
    if (red && blue && red.x === blue.x) same6++;
  }
  ok('v6 runs keep the old lane picks (so in-progress runs replay the same)', same6 > 0, same6 + ' of 60 shared a lane');
}
