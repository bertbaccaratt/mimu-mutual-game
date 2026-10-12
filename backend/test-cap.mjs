// A run that plays past the cap is closed AT the cap and keeps what it had there. Against STAGING deployed with a small cap:
//   npx wrangler deploy -c wrangler.staging.toml --var MAX_TICKS:2400
//   node test-cap.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev 2400
import { createRequire } from 'node:module';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const require = createRequire(import.meta.url);
const Sim = require('../assets/sim.js');
const base = process.argv[2], CAP = Number(process.argv[3] || 2400);
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
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'C' + acct.address.slice(2, 12) }) }, r.b.token);
  return r;
}
function bot(seed, wallet, ticks) {
  const sim = Sim.create(seed, { wallet }), S = sim.S, inputs = [];
  const act = (c) => { inputs.push([S.tick, c]); Sim.applyCode(sim, c); };
  let n = 0, nextAt = 0, rs = 4242;
  const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const at = {};                                                           // score at each tick, to know what the run had at the cap
  while (S.tick < ticks && !S.dead) {
    if (S.wait === 'revive') { act(Sim.ACT.REVIVE); continue; }
    if (S.tick >= nextAt) {
      nextAt = S.tick + 4 + Math.floor(rnd() * 11);
      let near = null;
      for (const o of S.obj) if ((o.t === 'chair' || o.t === 'banner') && !o.hit && o.z - S.dist > 4 && o.z - S.dist < 14 && Math.abs(o.x - S.lane) < .5 && (!near || o.z < near.z)) near = o;
      if (near) { const d = near.z - S.dist; if (near.t === 'chair' && d < 8) act(Sim.ACT.U); else if (near.t === 'banner' && d < 7) act(Sim.ACT.D); else if (d >= 8 && (n++ % 3 === 0)) act(S.lane > -1 ? Sim.ACT.L : Sim.ACT.R); }
    }
    at[S.tick] = [Math.floor(S.score), Math.floor(S.coins)];
    sim.step(); sim.drain();
  }
  at[S.tick] = [Math.floor(S.score), Math.floor(S.coins)];
  return { sim, inputs, at };
}
const start = (tok) => call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: Sim.VERSION }) }, tok);
const meBoard = async (tok) => (await call('/api/leaderboard?kind=run&limit=5', {}, tok)).b.me;

const acct = privateKeyToAccount(generatePrivateKey());
const la = await login(acct, 'Cap Test'); ok('sign in', la.s === 200, String(la.s) + ' ' + (la.b.error || '')); const tok = la.b.token;
const r = await start(tok); ok('run starts', r.s === 200, JSON.stringify(r.b));
const total = CAP + 1600;
const p = bot(r.b.seed, r.b.wallet, total);
const reached = p.sim.S.tick;
ok('the local bot plays past the cap', reached > CAP, `reached ${reached}, cap ${CAP}`);
const want = p.at[CAP];
console.log(`at the cap (tick ${CAP}) the run had ${want[0]} points and ${want[1]} coins; waiting ${Math.ceil(CAP / 60)}s so it is no faster than real time...`);
await sleep(Math.ceil(CAP / 60) * 1000 + 1500);

// piece 0: ordinary, below the cap
const to0 = 2000;
const c0 = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r.b.runId, seq: 0, to: to0, inputs: p.inputs.filter((i) => i[0] < to0), final: false }) }, tok);
ok('piece below the cap is accepted', c0.s === 200 && c0.b.ok && !c0.b.final, JSON.stringify(c0.b));
// piece 1 runs past the cap: closed at the cap, counted as it stood there
const to1 = Math.min(reached, to0 + 2000);
const c1 = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r.b.runId, seq: 1, to: to1, inputs: p.inputs.filter((i) => i[0] >= to0 && i[0] < to1), final: false }) }, tok);
ok('piece past the cap closes the run at the cap', c1.s === 200 && c1.b.final === true && c1.b.capped === true, JSON.stringify(c1.b));
ok('it keeps exactly what the run had at the cap', c1.b.score === want[0] && c1.b.coins === want[1], `server ${c1.b.score}/${c1.b.coins} local ${want[0]}/${want[1]}`);
const me = await meBoard(tok);
ok('the capped score is on the leaderboard', !!me && me.v === want[0], JSON.stringify(me));
// the game keeps playing and later sends the final piece: it gets the same answer, no error
const c2 = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: r.b.runId, seq: 2, to: reached, inputs: p.inputs.filter((i) => i[0] <= reached && i[0] >= to1), final: true }) }, tok);
ok('a later final piece gets the same saved answer', c2.s === 200 && c2.b.final === true && c2.b.capped === true && c2.b.score === want[0], JSON.stringify(c2.b));
const me2 = await meBoard(tok);
ok('the score is not counted twice', !!me2 && me2.v === want[0], JSON.stringify(me2));

