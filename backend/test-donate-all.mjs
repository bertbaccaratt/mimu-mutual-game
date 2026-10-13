// Donate all: every Chair Run point and every $TMF go to one player, in one step. Against STAGING (donations are always open there):
//   node test-donate-all.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { createRequire } from 'node:module';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const require = createRequire(import.meta.url);
const Sim = require('../assets/sim.js');
const base = process.argv[2];
if (!base || !/staging|localhost/.test(base)) { console.error('Give the STAGING (or local) url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function login(name) {
  const acct = privateKeyToAccount(generatePrivateKey());
  const n = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
  const signature = await acct.signMessage({ message: msg });
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: n.nonce, issuedAt: n.issuedAt, signature, name, picture: '' }) });
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'D' + acct.address.slice(2, 12) }) }, r.b.token);
  return { addr: acct.address.toLowerCase(), token: r.b.token };
}
function bot(seed, wallet, ticks) {
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
// a short real run that finishes and counts (so the player has points and $TMF)
async function playOne(p) {
  const st = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: Sim.VERSION }) }, p.token);
  const pl = bot(st.b.seed, st.b.wallet, 700), T = pl.sim.S.tick;
  await sleep(Math.ceil(T / 60) * 1000 + 1500);
  const r = await call('/api/run/chunk', { method: 'POST', body: JSON.stringify({ runId: st.b.runId, seq: 0, to: T, inputs: pl.inputs.filter((i) => i[0] <= T), final: true }) }, p.token);
  return r.b;
}
const status = async (p) => (await call('/api/send/status', {}, p.token)).b;
const donateAll = (p, to) => call('/api/transfer', { method: 'POST', body: JSON.stringify({ to, everything: true }) }, p.token);
const board = async () => (await call('/api/top9')).b.rows || [];

const [D1, D2, R, Z] = await Promise.all([login('DonA'), login('DonB'), login('DonR'), login('DonZ')]);
ok('four players sign in', !!(D1.token && D2.token && R.token && Z.token));
const [f1, f2, fr] = await Promise.all([playOne(D1), playOne(D2), playOne(R)]);
ok('three players finish a short run', f1.final && f2.final && fr.final && f1.score > 0 && f1.coins > 0 && fr.coins > 0, JSON.stringify([f1.score, f1.coins, f2.score, f2.coins, fr.score, fr.coins]));

const s1 = await status(D1), sR = await status(R);
ok('status reports the points, the $TMF and that Donate all is possible', s1.points === f1.score && s1.balance === f1.coins && s1.canAll === true && s1.canSend === true, JSON.stringify(s1));
ok('the $TMF-only answer is unchanged (balance, canSend, total)', s1.total === f1.score + f1.coins);

// refusals
const rz = await donateAll(Z, R.addr);
ok('a player with nothing to give is refused', rz.s === 409 && /nothing to give/i.test(rz.b.error || ''), rz.s + ' ' + JSON.stringify(rz.b));
const rs = await donateAll(D1, D1.addr);
ok('giving to yourself is refused', rs.s === 400, rs.s + ' ' + (rs.b.error || ''));
const rn = await donateAll(D1, Z.addr);
ok('giving to a player with no $TMF is refused (same rule as before)', rn.s === 409, rn.s + ' ' + (rn.b.error || ''));
ok('refusals took nothing', (await status(D1)).total === f1.score + f1.coins);

// Donate all to a normal player: everything moves, nothing is lost or made up
const go = await donateAll(D1, R.addr);
ok('Donate all to a player outside the top 5', go.s === 200 && go.b.ok && go.b.points === f1.score && go.b.sent === f1.coins && go.b.total === f1.score + f1.coins && go.b.boosted === 0, JSON.stringify(go.b));
const s1b = await status(D1), sRb = await status(R);
ok('the donor is at zero', s1b.total === 0 && s1b.points === 0 && s1b.balance === 0 && s1b.canAll === false, JSON.stringify(s1b));
ok('the receiver gained exactly the points plus the $TMF', sRb.total === sR.total + f1.score + f1.coins && sRb.balance === sR.balance + f1.coins && sRb.points === sR.points + f1.score, `${sR.total} -> ${sRb.total}`);
const again = await donateAll(D1, R.addr);
ok('a second tap gives nothing and changes nothing', again.s === 409 && (await status(R)).total === sRb.total, again.s + ' ' + (again.b.error || ''));

// Donate all to a top 5 runner: points move one for one, the $TMF boosts them as before (+2 each)
const rows = await board();
const top = rows.find((r) => r.top9 && r.id !== D2.addr && r.tmf >= 1);
ok('there is a top 5 runner to give to', !!top);
if (top) {
  const before = top.total, s2 = await status(D2);
  const g2 = await donateAll(D2, top.id);
  ok('Donate all to a top 5 runner', g2.s === 200 && g2.b.points === f2.score && g2.b.sent === f2.coins && g2.b.boosted === f2.coins * 2, JSON.stringify(g2.b));
  const after = (await board()).find((r) => r.id === top.id);
  ok('the top 5 runner gained the points, the $TMF and +2 per $TMF', !!after && after.total === before + s2.points + s2.balance + 2 * s2.balance, `${before} -> ${after && after.total}`);
  const s2b = await status(D2);
  ok('that donor is at zero too', s2b.total === 0, JSON.stringify(s2b));
}

// the existing $TMF-only transfer still works exactly as before
const p2 = await playOne(D1);
const sOnly = await status(D1);
const tmfOnly = await call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: R.addr, amount: 1 }) }, D1.token);
const sOnlyB = await status(D1);
ok('the $TMF-only send still works and moves only $TMF', tmfOnly.s === 200 && tmfOnly.b.sent === 1 && sOnlyB.balance === sOnly.balance - 1 && sOnlyB.points === sOnly.points, JSON.stringify(tmfOnly.b));
const tmfAll = await call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: R.addr, all: true }) }, D1.token);
const sOnlyC = await status(D1);
ok('the $TMF "give all" still moves only the $TMF and keeps the points', tmfAll.s === 200 && sOnlyC.balance === 0 && sOnlyC.points === sOnly.points, JSON.stringify(tmfAll.b));
