// Red orb with a real effect (rules version 5): top speed -5 for 60 seconds (was -0.5 for 3 minutes), with a red glow.
// A run keeps the rules it started with (runs.ver), so runs already in progress replay exactly as they were played.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (file, fn) => {
  const p = root + file;
  let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
  const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(file + ': ' + n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };
  fn(rep);
  fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
};

edit('assets/sim.js', (rep) => {
  rep(`    const wallet = Math.max(0, Math.floor(opts.wallet || 0));\n`, `    const wallet = Math.max(0, Math.floor(opts.wallet || 0));\n    const rv = Number(opts.v) || VERSION;                          // the rules version this run plays by (a run keeps the rules it started with)\n`);
  rep(`      /* the red orb (every 2.5 million points): catch it and the top speed is 0.5 lower for 3 minutes, then it comes back by itself to wherever the ramp has got to */`,
      `      /* the red orb (every 2.5 million points): catch it and the top speed drops for a while, then it eases back to wherever the ramp has got to.\n         rules v5: -5 for 60 seconds (about 20% slower). Runs that started on v4 keep -0.5 for 3 minutes. */`);
  rep(`- (S.orbT > 0 ? .5 : 0)) * (S.slow > 0 ? .62 : 1);`, `- (S.orbT > 0 ? (rv >= 5 ? 5 : .5) : 0)) * (S.slow > 0 ? .62 : 1);`);
  rep(`else if (o.k === 'orb') S.orbT = 180;`, `else if (o.k === 'orb') S.orbT = rv >= 5 ? 60 : 180;`);
  rep(`  const VERSION = 4;`, `  const VERSION = 5;`);
});

edit('backend/src/index.js', (rep) => {
  rep(`INSERT INTO runs(id,address,seed,wallet,started_at,last_tick,seq,snapshot,status) VALUES(?1,?2,?3,?4,?5,0,0,NULL,'open')")`, `INSERT INTO runs(id,address,seed,wallet,started_at,last_tick,seq,snapshot,status,ver) VALUES(?1,?2,?3,?4,?5,0,0,NULL,'open',?6)")`);
  rep(`    .bind(id, sess.sub, seed, wallet, now).run();`, `    .bind(id, sess.sub, seed, wallet, now, Sim.VERSION).run();`);
  rep(`  const sim = Sim.create(run.seed, { wallet: run.wallet });\n  if (run.snapshot) sim.restore(run.snapshot);`, `  const sim = Sim.create(run.seed, { wallet: run.wallet, v: run.ver || 4 });   // a run replays by the rules version it started on (older rows have no version: v4)\n  if (run.snapshot) sim.restore(run.snapshot);`);
  rep(`SELECT seed, wallet, snapshot FROM runs WHERE id=?1`, `SELECT seed, wallet, ver, snapshot FROM runs WHERE id=?1`);
  rep(`const sim = Sim.create(run.seed, { wallet: run.wallet }); sim.restore(run.snapshot);\n              const S = sim.S, ob = [];`, `const sim = Sim.create(run.seed, { wallet: run.wallet, v: run.ver || 4 }); sim.restore(run.snapshot);\n              const S = sim.S, ob = [];`);
});

edit('backend/schema.sql', (rep) => {
  const t = fs.readFileSync(root + 'backend/schema.sql', 'utf8');
  if (!/CREATE TABLE IF NOT EXISTS runs \(/.test(t)) throw new Error('runs table');
});
{ // add the column inside the CREATE TABLE runs (...) block
  const p = root + 'backend/schema.sql';
  let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
  const m = /(CREATE TABLE IF NOT EXISTS runs \([\s\S]*?\n)(\);)/.exec(t);
  if (!m) throw new Error('runs block');
  if (!/\bver\b/.test(m[1])) t = t.replace(m[0], () => m[1].replace(/,?\n$/, ',\n') + '  ver        INTEGER,                         -- game rules version the run was started on (null = 4)\n' + m[2]);
  fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
}

edit('index.html', (rep) => {
  rep(`<script src="assets/sim.js?v=4"></script>`, `<script src="assets/sim.js?v=5"></script>`);
  rep(`Catch it and your top speed is 0.5 lower for 3 minutes, then it returns on its own. A red chip at the top counts it down.`, `Catch it and the hall calms: your top speed drops by 5 for 60 seconds, so you run slower and safer (and score a little slower), then it returns on its own. A red glow and a red chip at the top count it down.`);
  rep(`Your top speed is <b>0.5 lower for 3 minutes</b>, then it comes back by itself to wherever the ramp has reached.`, `Your top speed drops by <b>5 for 60 seconds</b> (about 20% slower: safer, but you score slower), then it comes back by itself to wherever the ramp has reached.`);
  rep(`Catching it plays a burst and a ring and does not slow you down on its own.</li><li>A red chip at the top shows the 3 minute countdown, and a message tells you when the calm ends.</li><li>If you miss it, the next orb comes at the next 2.5 million. Catching one while another is active just refreshes the 3 minutes.`,
      `Catching it plays a burst and a ring, and a red glow frames the screen while the calm lasts.</li><li>A red chip at the top shows the 60 second countdown, and the glow fades when the calm ends.</li><li>If you miss it, the next orb comes at the next 2.5 million. Catching one while another is active just refreshes the 60 seconds.`);
  rep(`a.push('🔴 ORB -0.5 '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))}hud.pw.innerHTML=`, `a.push('🔴 CALM '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))}if(hud.orb)hud.orb.classList.toggle('on',S.orbT>0);hud.pw.innerHTML=`);
  rep(`msg('🔴 Red orb caught','big orb','Top speed -0.5 for 3 minutes, then it eases back on its own')`, `msg('🔴 Calm · slower for 60s','big orb','Top speed -5 for 60 seconds, then it eases back. Safer, but you score slower')`);
  rep(`<div class="rflash" id="rfl"></div>`, `<div class="rflash" id="rfl"></div><div class="rorb" id="rorb"></div>`);
  rep(`const hud={sc:$('#rsc',root),`, `const hud={orb:$('#rorb',root),sc:$('#rsc',root),`);
  rep(`@keyframes orbring{0%{transform:scale(.4);opacity:1}100%{transform:scale(9);opacity:0}}`, `@keyframes orbring{0%{transform:scale(.4);opacity:1}100%{transform:scale(9);opacity:0}}\n.rorb{position:absolute;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity .6s;box-shadow:inset 0 0 60px 8px rgba(255,40,40,.5),inset 0 0 140px rgba(255,20,20,.25);animation:orbpulse 2.4s ease-in-out infinite}\n.rorb.on{opacity:1}\n@keyframes orbpulse{0%,100%{filter:none}50%{filter:brightness(1.4)}}`);
});

edit('admin.html', (rep) => {
  rep(`'\\ud83d\\udd34 -0.5 speed '+st.or+'s'`, `'\\ud83d\\udd34 orb calm '+st.or+'s'`);
});

edit('README.md', (rep) => {
  rep(`a red orb appears every 2.5 million points (-0.5 top speed for 3 minutes)`, `a red orb appears every 2.5 million points (rules v5: -5 top speed for 60 seconds, with a red glow; runs that started on v4 keep -0.5 for 3 minutes)`);
  rep(`(currently 4)`, `(currently 5). A run keeps the rules version it started on (\`runs.ver\`, null = 4), so a rules change never breaks runs already in progress`);
});
console.log('ok');
