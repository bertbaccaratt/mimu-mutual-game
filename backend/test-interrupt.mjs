// Contest rule: an interrupted run never counts (the player starts over). Against STAGING:
//   node test-interrupt.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
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
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'I' + acct.address.slice(2, 12) }) }, r.b.token);
  return r;
}
function bot(seed, wallet, ticks) {                                        // plays the shared game core locally and records its inputs
  const sim = Sim.create(seed, { wallet }), S = sim.S, inputs = [];
  const act = (c) => { inputs.push([S.tick, c]); Sim.applyCode(sim, c); };
  let n = 0, nextAt = 0, rs = 4242;
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
const meBoard = async (tok) => (await call('/api/leaderboard?kind=run&limit=5', {}, tok)).b.me;

const acct = privateKeyToAccount(generatePrivateKey());
const la = await login(acct, 'Interrupt Test');
ok('sign in', la.s === 200, String(la.s) + ' ' + (la.b.error || ''));
const tok = la.b.token;

// run 1: plays, uploads one verified piece, then "the phone dies" (no final piece is ever sent)
const r1 = await start(tok);
ok('run 1 starts', r1.s === 200, JSON.stringify(r1.b));
const p1 = bot(r1.b.seed, r1.b.wallet, 2000);
const to1 = Math.min(2000, p1.sim.S.tick);
console.log(`run 1: bot reached ${p1.sim.S.tick} ticks, score ${Math.floor(p1.sim.S.score)}; waiting ${Math.ceil(to1 / 60)}s so it is no faster than real time...`);
await sleep(Math.ceil(to1 / 60) * 1000 + 500);
const c1 = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r1.b.runId, seq: 0, to: to1, inputs: p1.inputs.filter((i) => i[0] < to1), final: false }) }, tok);
ok('run 1: the verified piece is accepted (the run is open, then interrupted)', c1.s === 200 && c1.b.ok, JSON.stringify(c1.b));

// the player starts over: this used to credit the interrupted run
const r2 = await start(tok);
ok('run 2 starts', r2.s === 200, JSON.stringify(r2.b));
ok('the interrupted run did NOT reach the leaderboard', (await meBoard(tok)) === null, JSON.stringify(await meBoard(tok)));
const late = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r1.b.runId, seq: 1, to: to1, inputs: [], final: true }) }, tok);
ok('the old run can no longer be finished', late.s === 409, String(late.s) + ' ' + (late.b.error || ''));

// run 2 is played to the end and counts normally
const p2 = bot(r2.b.seed, r2.b.wallet, 700);
const S2 = p2.sim.S, to2 = S2.tick;
await sleep(Math.max(0, Math.ceil(to2 / 60) - 5) * 1000 + 800);
const f2 = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r2.b.runId, seq: 0, to: to2, inputs: p2.inputs.filter((i) => i[0] <= to2), final: true }) }, tok);
ok('run 2 finishes and counts', f2.s === 200 && f2.b.final && !f2.b.held && f2.b.score === Math.floor(S2.score), JSON.stringify(f2.b));
const me = await meBoard(tok);
ok('leaderboard holds only the finished run', !!me && me.v === Math.floor(S2.score), JSON.stringify(me) + ' local ' + Math.floor(S2.score));
