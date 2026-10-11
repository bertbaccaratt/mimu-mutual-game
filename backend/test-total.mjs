// Scoring adds up: every finished run is added to the weekly total. Against STAGING:
//   node test-total.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { createRequire } from 'node:module';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const require = createRequire(import.meta.url);
const Sim = require('../assets/sim.js');
const base = process.argv[2];
if (!base || !/staging|localhost/.test(base)) { console.error('Give the STAGING (or local) url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function login(acct, name) {
  const n = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
  const signature = await acct.signMessage({ message: msg });
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: n.nonce, issuedAt: n.issuedAt, signature, name, picture: '' }) });
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'T' + acct.address.slice(2, 12) }) }, r.b.token);
  return r;
}
function bot(seed, wallet, ticks, tag) {
  const sim = Sim.create(seed, { wallet }), S = sim.S, inputs = [];
  const act = (c) => { inputs.push([S.tick, c]); Sim.applyCode(sim, c); };
  let n = 0, nextAt = 0, rs = 777 + tag;
  const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  while (S.tick < ticks && !S.dead) {
    if (S.wait === 'revive') { act(Sim.ACT.REVIVE); continue; }
    if (S.tick >= nextAt) {
      nextAt = S.tick + 4 + Math.floor(rnd() * 11);
      let near = null;
      for (const o of S.obj) if ((o.t === 'chair' || o.t === 'banner') && !o.hit && o.z - S.dist > 4 && o.z - S.dist < 14 && Math.abs(o.x - S.lane) < .5 && (!near || o.z < near.z)) near = o;
      if (near) { const d = near.z - S.dist; if (near.t === 'chair' && d < 8) act(Sim.ACT.U); else if (near.t === 'banner' && d < 7) act(Sim.ACT.D); else if (d >= 8 && (n++ % 3 === 0)) act(S.lane > -1 ? Sim.ACT.L : Sim.ACT.R); }
    }
    sim.step(); sim.drain();
  }
  return { sim, inputs };
}
const start = (tok) => call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: Sim.VERSION }) }, tok);
const board = async (kind, tok) => (await call('/api/leaderboard?kind=' + kind + '&limit=5', {}, tok)).b.me;

const acct = privateKeyToAccount(generatePrivateKey());
const la = await login(acct, 'Total Test');
ok('sign in', la.s === 200, String(la.s) + ' ' + (la.b.error || ''));
const tok = la.b.token;

const runs = [];
for (let k = 0; k < 3; k++) {
  const r = await start(tok);
  const p = bot(r.b.seed, r.b.wallet, 500 + k * 120, k);
  const S = p.sim.S, to = S.tick;
  await sleep(Math.max(0, Math.ceil(to / 60) - 5) * 1000 + 800);
  const f = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r.b.runId, seq: 0, to, inputs: p.inputs.filter((i) => i[0] <= to), final: true }) }, tok);
  const sc = Math.floor(S.score), co = Math.floor(S.coins);
  runs.push({ sc, co });
  const sumSc = runs.reduce((a, x) => a + x.sc, 0);
  ok(`run ${k + 1} finishes (score ${sc}, $TMF ${co})`, f.s === 200 && f.b.final && !f.b.held && f.b.score === sc, JSON.stringify(f.b));
  const me = await board('run', tok);
  ok(`  Chair Run board after run ${k + 1} = all runs added together (${sumSc})`, !!me && me.v === sumSc, JSON.stringify(me));
}
const sumSc = runs.reduce((a, x) => a + x.sc, 0), sumCo = runs.reduce((a, x) => a + x.co, 0), bestOne = Math.max(...runs.map((x) => x.sc));
ok('$TMF board = all $TMF added together', (await board('nw', tok)).v === sumCo, String((await board('nw', tok)).v) + ' vs ' + sumCo);
const stt = (await call('/api/send/status', {}, tok)).b;
ok('Top 5 total = run points + $TMF found', stt.total === sumSc + sumCo, `${stt.total} vs ${sumSc} + ${sumCo}`);
const mb = (await call('/api/mybest', {}, tok)).b;
ok('best single run is still tracked (for the badges)', mb.best === bestOne, `${mb.best} vs ${bestOne}`);
