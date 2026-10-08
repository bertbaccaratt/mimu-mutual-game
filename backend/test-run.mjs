// End-to-end check of verified runs against a deployed (or local) API:
//   node test-run.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev [chunkTicks] [waitSeconds]
// Needs an API whose holdings rules are off (the staging worker), because a random test wallet owns no Mimu.
import { createRequire } from 'node:module';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const require = createRequire(import.meta.url);
const Sim = require('../assets/sim.js');
const base = process.argv[2] || 'http://localhost:8787';
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const TICKS1 = Number(process.argv[3] || 2000), WAIT = Number(process.argv[4] || 0);
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
  return call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: n.nonce, issuedAt: n.issuedAt, signature, name, picture: '' }) });
}
function bot(seed, wallet, ticks, metronome = false) {                      // plays the shared game core locally and records its inputs
  const sim = Sim.create(seed, { wallet }), S = sim.S, inputs = [];
  const act = (c) => { inputs.push([S.tick, c]); Sim.applyCode(sim, c); };
  let n = 0, nextAt = 0, rs = 12345;
  const rnd = () => (rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  while (S.tick < ticks && !S.dead) {
    if (S.wait === 'revive') { act(Sim.ACT.REVIVE); continue; }
    if (metronome ? S.tick % 7 === 0 : S.tick >= nextAt) {
      if (!metronome) nextAt = S.tick + 4 + Math.floor(rnd() * 11);
      let near = null;
      for (const o of S.obj) if ((o.t === 'chair' || o.t === 'banner') && !o.hit && o.z - S.dist > 4 && o.z - S.dist < 14 && Math.abs(o.x - S.lane) < .5 && (!near || o.z < near.z)) near = o;
      if (near) { const d = near.z - S.dist; if (near.t === 'chair' && d < 8) act(Sim.ACT.U); else if (near.t === 'banner' && d < 7) act(Sim.ACT.D); else if (d >= 8 && (n++ % 3 === 0)) act(S.lane > -1 ? Sim.ACT.L : Sim.ACT.R); }
    }
    sim.step(); sim.drain();
  }
  return { sim, inputs };
}

const a = privateKeyToAccount(generatePrivateKey()), b2 = privateKeyToAccount(generatePrivateKey());
const la = await login(a, 'Runner A'), lb = await login(b2, 'Runner B');
ok('sign in (A and B)', la.s === 200 && lb.s === 200, `${la.s}/${lb.s} ${la.b.error || ''}`);
const tokA = la.b.token, tokB = lb.b.token;

// a message for a different site is refused
{
  const n = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: evil.example\nAddress: ${a.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: a.address, nonce: n.nonce, issuedAt: n.issuedAt, signature: await a.signMessage({ message: msg }), name: 'x' }) });
  ok('signature for another domain is rejected', r.s === 401, String(r.s));
}

const st = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tokA);
ok('run start gives a server seed', st.s === 200 && /^[0-9a-f]{32}$/.test(st.b.runId) && Number.isInteger(st.b.seed), JSON.stringify(st.b));
const { runId, seed } = st.b;
const t0 = Date.now();
const play = bot(seed, st.b.wallet, TICKS1 + 900);
const S = play.sim.S;
const total = S.tick;
console.log(`local bot: ${total} ticks, score ${Math.floor(S.score)}, dist ${Math.floor(S.dist)}, coins ${S.coins}, dead ${S.dead}`);
const part = (from, to, fin) => play.inputs.filter((i) => i[0] >= from && (i[0] < to || (fin && i[0] === to)));

// B can't touch A's run
const steal = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId, seq: 0, to: 10, inputs: [], final: false }) }, tokB);
ok("another player can't use my run", steal.s === 404, String(steal.s));

// too fast: claiming 2000 ticks one second after starting
const fast = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId, seq: 0, to: Math.min(2000, total), inputs: part(0, Math.min(2000, total), false), final: false }) }, tokA);
if (Date.now() - t0 < 25000) ok('faster-than-real-time run is rejected', fast.s === 422, String(fast.s) + ' ' + (fast.b.error || ''));

if (WAIT) { console.log(`waiting ${WAIT}s so the run is no faster than real time...`); await sleep(WAIT * 1000); }

// honest upload in chunks
const cuts = []; for (let t = 0; t < total; t += TICKS1) cuts.push(Math.min(total, t + TICKS1));
let from = 0, seq = 0, last = null;
for (let k = 0; k < cuts.length; k++) {
  const to = cuts[k], fin = k === cuts.length - 1;
  const t1 = Date.now();
  const r = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId, seq, to, inputs: part(from, to, fin), final: fin }) }, tokA);
  console.log(`  chunk ${seq}: ticks ${from}-${to} -> ${r.s} ${JSON.stringify(r.b).slice(0, 140)}  (${Date.now() - t1} ms round trip)`);
  ok(`chunk ${seq} accepted`, r.s === 200, r.b.error || '');
  if (r.s !== 200) break;
  from = to; seq++; last = r;
}
if (last && last.b.final) {
  ok('server score equals the local replay', last.b.score === Math.floor(S.score), `${last.b.score} vs ${Math.floor(S.score)}`);
  ok('coins and distance match', last.b.coins === S.coins && last.b.dist === Math.floor(S.dist));
  ok('rank returned', last.b.rank >= 1, String(last.b.rank));
}
// the same run can't be submitted twice
const again = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId, seq, to: from, inputs: [], final: true }) }, tokA);
ok('a finished run is closed', again.s === 409, String(again.s));

// forged inputs can't buy a better score: B starts a run and submits inputs that do nothing
const stB = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tokB);
const f = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: stB.b.runId, seq: 0, to: 300, inputs: [], final: true }) }, tokB);
ok('empty/idle run scores what the replay says (tiny)', f.s === 200 && f.b.score < 400, JSON.stringify(f.b));
const board = await call('/api/leaderboard?kind=run', {}, tokA);
ok('leaderboard shows both verified runs', board.s === 200 && board.b.rows.length >= 1, `${board.b.rows.length} rows, top ${board.b.rows[0] && board.b.rows[0].v}`);
const coins = await call('/api/leaderboard?kind=nw', {}, tokA);
ok('coins board uses verified coins', coins.s === 200 && coins.b.rows.length >= 1, JSON.stringify(coins.b.rows[0] && coins.b.rows[0].v));
// the old unverified endpoint is gone
const old = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 99999, dist: 99999 }) }, tokA);
ok('direct score submission no longer exists', old.s === 404, String(old.s));

// human check: starting a run without a Turnstile token is refused
const nocf = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0 }) }, tokA);
ok('run start without human-check token is refused', nocf.s === 403, String(nocf.s));

// bot check: a metronome player is verified but held out of the leaderboard, and the admin can release it
{
  const c = privateKeyToAccount(generatePrivateKey());
  const lc = await login(c, 'Metronome'); const tokC = lc.b.token;
  const sc = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tokC);
  const tc0 = Date.now();
  const pl = bot(sc.b.seed, sc.b.wallet, 3600, true), T = pl.sim.S.tick;
  await sleep(Math.max(0, T / 60 * 1000 - (Date.now() - tc0) - 3000));   // no faster than real time
  let r = null, f0 = 0, sq = 0;
  while (f0 < T) { const to = Math.min(T, f0 + 2000), fin = to === T;
    r = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: sc.b.runId, seq: sq++, to, inputs: pl.inputs.filter((i) => i[0] >= f0 && (i[0] < to || (fin && i[0] === to))), final: fin }) }, tokC);
    if (r.s !== 200) break; f0 = to; }  ok('metronome run is replayed but held', r.s === 200 && r.b.held === true && r.b.score > 0, JSON.stringify(r.b));
  const bd = await call('/api/leaderboard?kind=run', {}, tokC);
  ok('held run is not on the leaderboard', !bd.b.rows.some((x) => x.name === 'Metronome'));
  const adm = process.env.ADMIN_TOKEN;
  if (adm) {
    const A = (path, body) => fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'X-Admin-Token': adm, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(async (x) => ({ s: x.status, b: await x.json() }));
    ok('admin without token is refused', (await fetch(base + '/api/admin/held')).status === 403);
    const held = await A('/api/admin/held'); const mine = held.b.runs.find((x) => x.id === sc.b.runId);
    ok('admin sees the held run with reasons', !!mine && mine.flags.length > 0, JSON.stringify(mine && mine.flags));
    const rel = await A('/api/admin/release', { runId: sc.b.runId });
    ok('admin can release it', rel.s === 200);
    const bd2 = await call('/api/leaderboard?kind=run', {}, tokC);
    ok('released run appears', bd2.b.rows.some((x) => x.name === 'Metronome'));
    const ban = await A('/api/admin/ban', { address: c.address, reason: 'test' });
    ok('admin can ban', ban.s === 200);
    const again2 = await login(c, 'Metronome');
    ok('banned wallet cannot sign in', again2.s === 403, String(again2.s));
    const bd3 = await call('/api/leaderboard?kind=run', {}, tokC);
    ok('banned wallet removed from board', !bd3.b.rows.some((x) => x.name === 'Metronome'));
  } else console.log('(set ADMIN_TOKEN to test admin endpoints)');
}
