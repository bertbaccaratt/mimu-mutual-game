import fs from 'node:fs';
const B = new URL('../backend/', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, B); const t = fs.readFileSync(p, 'utf8'); const o = fn(t); if (o === t) throw new Error('no change ' + f); fs.writeFileSync(p, o); };
for (const f of ['test-admin.mjs', 'test-live.mjs', 'test-run.mjs', 'test-x.mjs']) edit(f, (t) => t.split('sv: 5 }').join('sv: 6 }'));
edit('test-sim.mjs', (t) => {
  t = t.replace("ok('rules version is 5', Sim.VERSION === 5, String(Sim.VERSION));", "ok('rules version is 6', Sim.VERSION === 6, String(Sim.VERSION));");
  t = t.replace("Sim.create(1, {}).S.orbT === 0 && Sim.VERSION === 5);", "Sim.create(1, {}).S.orbT === 0 && Sim.VERSION === 6);");
  t += `
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
`;
  return t;
});
console.log('tests patched');
