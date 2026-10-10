// Second Wind price grows with the run: 30 $TMF, +10 for every million points scored (paid from run coins first, the wallet tops up).
// Rules change => the shared game core goes to VERSION 4 (and the ?v= on its script tag).
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (file, fn) => {
  const p = root + file;
  let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
  const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(file + ': ' + n + ' matches for ' + a.slice(0, 80)); t = t.replace(a, () => b); };
  fn(rep);
  fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
};

edit('assets/sim.js', (rep) => {
  rep(`wait: null, walletPaid: 0, orbNext: 2500000, orbT: 0,`, `wait: null, walletPaid: 0, rc: 30, orbNext: 2500000, orbT: 0,`);
  rep(`        if (!S.revived && S.coins + wallet >= 30) { S.wait = 'revive'; emit('offer'); }`,
      `        const rc = 30 + 10 * Math.floor(Math.max(0, S.score) / 1e6);   // Second Wind price: 30 $TMF, +10 for every million points scored
        if (!S.revived && S.coins + wallet >= rc) { S.rc = rc; S.wait = 'revive'; emit('offer', { cost: rc }); }`);
  rep(`      const a = Math.min(30, S.coins); S.coins -= a; S.walletPaid = 30 - a;`,
      `      const cost = S.rc || 30, a = Math.min(cost, S.coins); S.coins -= a; S.walletPaid = cost - a;   // run coins first, the wallet tops up`);
  rep(`  const VERSION = 3;`, `  const VERSION = 4;`);
});

edit('index.html', (rep) => {
  rep(`<script src="assets/sim.js?v=3"></script>`, `<script src="assets/sim.js?v=4"></script>`);
  rep(`/* second wind: once per run, pay 30 $TMF to keep your score and chain going */`, `/* second wind: once per run, pay 30 $TMF (+10 for every million points) to keep your score and chain going */`);
  rep('Costs <b style="color:var(--gold2)">30 $TMF</b> and you only get one per run.</div>', 'Costs <b style="color:var(--gold2)">${fmt(S.rc||30)} $TMF</b> and you only get one per run.</div>');
  rep('Keep running · 30 $TMF</button>', 'Keep running · ${fmt(S.rc||30)} $TMF</button>');
  // guide
  rep(`you get 5 seconds to pay <b>30 $TMF to keep running</b>. You keep your score and chain.`,
      `you get 5 seconds to pay <b>30 $TMF to keep running, plus 10 more for every million points you have scored</b> (130 at 10M, 330 at 30M, 530 at 50M). You keep your score and chain.`);
  // in-run ? guide
  rep(`the <b>Second Wind</b> (30 $TMF) and the`, `the <b>Second Wind</b> (30 $TMF, plus 10 for every million points you have) and the`);
  rep(`you get a 5 second offer to keep running for <b>30 $TMF</b>.</li>`, `you get a 5 second offer to keep running for <b>30 $TMF plus 10 for every million points you have scored</b> (130 at 10M, 330 at 30M).</li>`);
  rep(`<li>Keep 30 $TMF in reserve so the Second Wind is always available.</li>`, `<li>Keep $TMF in reserve so the Second Wind is always available: it costs 30 plus 10 for every million points you have.</li>`);
  // badge text
  rep(`(g>1?'s':'')+' (30 $TMF)');`, `(g>1?'s':'')+' (30 $TMF, +10 per million points)');`);
});
console.log('ok');
