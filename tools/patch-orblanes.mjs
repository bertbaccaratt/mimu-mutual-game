// Rules v7: a red orb and a blue orb that appear together (they do at 50M and 100M) never share a lane.
import fs from 'node:fs';
const U = (f) => new URL(f, import.meta.url);
const edit = (f, fn) => { const t = fs.readFileSync(U(f), 'utf8'); const o = fn(t); if (o === t) throw new Error('no change ' + f); fs.writeFileSync(U(f), o); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); return t.replace(a, () => b); };

edit('../assets/sim.js', (t) => {
  t = once(t, "    const chair = (l, z, roll) =>",
    "    /* rules v7: an orb never appears in the lane of another orb (red or blue) that is within 25 m of it; the pick still uses one random number, like before */\n" +
    "    const orbLane = (z) => { const taken = S.obj.filter((q) => q.t === 'pick' && (q.k === 'orb' || q.k === 'blue') && !q.dead && Math.abs(q.z - z) < 25).map((q) => Math.round(q.x)); const free = [-1, 0, 1].filter((l) => !taken.includes(l)); return rp(free.length ? free : [-1, 0, 1]); };\n" +
    "    const chair = (l, z, roll) =>");
  t = once(t, "const o = mk('pick', rp([-1, 0, 1]), S.dist + FAR - 6); o.k = 'orb';", "const o = mk('pick', rv >= 7 ? orbLane(S.dist + FAR - 6) : rp([-1, 0, 1]), S.dist + FAR - 6); o.k = 'orb';");
  t = once(t, "const o = mk('pick', rp([-1, 0, 1]), S.dist + FAR - 9); o.k = 'blue';", "const o = mk('pick', rv >= 7 ? orbLane(S.dist + FAR - 9) : rp([-1, 0, 1]), S.dist + FAR - 9); o.k = 'blue';");
  t = once(t, 'const VERSION = 6;', 'const VERSION = 7;');
  return t;
});
edit('../index.html', (t) => once(t, 'assets/sim.js?v=6', 'assets/sim.js?v=7'));
for (const f of ['test-admin.mjs', 'test-live.mjs', 'test-run.mjs', 'test-x.mjs']) edit('../backend/' + f, (t) => t.split('sv: 6 }').join('sv: 7 }'));
edit('../backend/test-sim.mjs', (t) => {
  t = once(t, "ok('rules version is 6', Sim.VERSION === 6, String(Sim.VERSION));", "ok('rules version is 7', Sim.VERSION === 7, String(Sim.VERSION));");
  t = once(t, "Sim.create(1, {}).S.orbT === 0 && Sim.VERSION === 6);", "Sim.create(1, {}).S.orbT === 0 && Sim.VERSION === 7);");
  t += `
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
`;
  return t;
});
console.log('orb lanes patched (rules v7)');
