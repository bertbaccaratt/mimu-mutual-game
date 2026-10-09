// Top 5 sending rules against the STAGING API (seeds fake scores in the staging database and removes them afterwards):
//   ADMIN_TOKEN=... node test-transfer.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { execSync } from 'node:child_process';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url (this test writes fake scores).'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
async function login(acct, name, n) {
  const nn = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${nn.nonce}\nIssued: ${nn.issuedAt}`;
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: nn.nonce, issuedAt: nn.issuedAt, signature: await acct.signMessage({ message: msg }), name, picture: '' }) });
  if (r.s !== 200) throw new Error('login failed ' + r.s + ' ' + JSON.stringify(r.b));
  await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'Tt' + acct.address.slice(2, 12) + n }) }, r.b.token);
  return r.b.token;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const d1 = (sql) => execSync(`npx wrangler d1 execute mimu-mutual-staging --remote --config wrangler.staging.toml --command "${sql}"`, { stdio: 'pipe', shell: true }).toString();

// W0..W4 are the top 5, W5 and W6 are outside it, W7 has registered nothing
const W = Array.from({ length: 8 }, () => privateKeyToAccount(generatePrivateKey()));
const tok = [];
for (let i = 0; i < W.length; i++) { tok.push(await login(W[i], 'Transfer Test ' + i, i)); if (i % 3 === 2 && i < W.length - 1) await sleep(62000); }   // per-IP sign-in limit
const week = (await call('/api/health')).b.week;
const addr = (i) => W[i].address.toLowerCase();
const seed = (i, run, coins) => `('${addr(i)}',${week},${run},${coins},1,1)`;
d1(`INSERT OR REPLACE INTO scores(address,week,run_best,coins_total,runs,updated_at) VALUES ${[0, 1, 2, 3, 4].map((i) => seed(i, 900000 - i * 1000, 50)).join(',')},${seed(5, 100, 40)},${seed(6, 50, 30)}`);
const send = (from, to, amount) => call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: typeof to === 'number' ? addr(to) : to, amount }) }, tok[from]);
const giveAll = (from, to) => call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: addr(to), all: true }) }, tok[from]);
const status = (i) => call('/api/send/status', {}, tok[i]).then((r) => r.b);
const list = async () => (await call('/api/top9')).b.rows;
try {
  // ---- who is in the top 5 ----
  const rows = await list();
  ok('the list shows everyone, exactly 5 flagged as the top 5', rows.filter((r) => r.top9).length === 5 && rows.slice(0, 5).every((r) => r.top9) && rows.slice(5).every((r) => !r.top9));
  ok('the top 5 are the five highest totals', [0, 1, 2, 3, 4].every((i, k) => rows[k].id === addr(i)), rows.slice(0, 5).map((r) => r.rank + ':' + r.id.slice(0, 6)).join(' '));
  ok('totals are Chair Run score + $TMF found', rows.every((r) => r.total === r.run + r.tmf));
  const s0 = await status(0), s4 = await status(4), s5 = await status(5);
  ok('1st place is locked from sending', s0.top9 === true && s0.canSend === false, JSON.stringify(s0));
  ok('5th place is still locked', s4.top9 === true && s4.canSend === false && s4.rank === 5, JSON.stringify(s4));
  ok('6th place can send', s5.top9 === false && s5.canSend === true && s5.balance === 40 && s5.rank > 5, JSON.stringify(s5));
  ok('top 5 cannot send (1st)', (await send(0, 6, 5)).s === 403);
  ok('top 5 cannot send (5th)', (await send(4, 6, 5)).s === 403);
  ok('top 5 cannot give all either', (await giveAll(4, 6)).s === 403);

  ok('cannot send more than you have', (await send(5, 6, 41)).s === 409);
  ok('cannot send to a player with no $TMF registered', (await send(5, 7, 1)).s === 409);
  ok('cannot send to an unknown address', (await send(5, '0x' + '1'.repeat(40), 1)).s === 409);
  ok('cannot send to yourself', (await send(5, 5, 1)).s === 400);
  ok('zero, negative and fractions are refused', (await send(5, 6, 0)).s === 400 && (await send(5, 6, -3)).s === 400 && (await send(5, 6, 1.5)).s === 400);

  // ---- sending outside the top 5 ----
  const c = await send(5, 6, 10);
  ok('6th place can send to a player with $TMF (no boost, receiver is not top 5)', c.s === 200 && c.b.boosted === 0 && c.b.balance === 30, JSON.stringify(c.b));
  ok('the receiver got the coins', (await status(6)).balance === 40);
  const before = (await list()).find((r) => r.id === addr(0));
  const g = await giveAll(5, 0);
  ok('give all: the whole live balance goes to a top 5 runner, with +2 points per $TMF', g.s === 200 && g.b.sent === 30 && g.b.boosted === 60 && g.b.balance === 0, JSON.stringify(g.b));
  const after = (await list()).find((r) => r.id === addr(0));
  ok('the top 5 runner total went up by the coins + the boost', after.total === before.total + 30 + 60 && after.tmf === before.tmf + 30 && after.run === before.run + 60, `${before.total} -> ${after.total}`);
  ok('with nothing left, give all and send are refused', (await giveAll(5, 0)).s === 409 && (await send(5, 0, 1)).s === 409);
  ok('a player with no balance cannot send', (await status(5)).canSend === false);

  // ---- rank changes move the lock ----
  d1(`UPDATE scores SET run_best=899500 WHERE address='${addr(6)}' AND week=${week}`);       // 7th/6th place player overtakes 5th place
  const s4b = await status(4);
  ok('when someone passes 5th place, 5th place drops to 6th and is UNLOCKED', s4b.top9 === false && s4b.canSend === true && s4b.rank === 6, JSON.stringify(s4b));
  ok('the list flags the new top 5 correctly', (await list()).slice(0, 5).some((r) => r.id === addr(6) && r.top9) && !(await list()).find((r) => r.id === addr(4)).top9);
  const s6 = await status(6);
  ok('the player who moved up is now LOCKED', s6.top9 === true && s6.canSend === false, JSON.stringify(s6));
  const m = await send(4, 6, 10);
  ok('the player who dropped can now send, and the new top 5 receiver is boosted', m.s === 200 && m.b.boosted === 20 && m.b.balance === 40, JSON.stringify(m.b));
  d1(`UPDATE scores SET run_best=50 WHERE address='${addr(6)}' AND week=${week}`);          // the other player falls back
  const s4c = await status(4);
  ok('when they fall back, the lock comes back', s4c.top9 === true && s4c.canSend === false, JSON.stringify(s4c));
  ok('and sending is refused again', (await send(4, 5, 1)).s === 403);

  // ---- the rest of the rules ----
  ok('sending needs a sign-in', (await call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: addr(0), amount: 1 }) })).s === 401);
  if (process.env.ADMIN_TOKEN) {
    const dash = await call('/api/admin/dashboard', { headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN } });
    ok('transfers show in the admin dashboard', dash.s === 200 && dash.b.transfers.some((t) => t.sa === addr(5) && t.ra === addr(0) && t.amount === 30 && t.boost === 60));
  }
} finally {
  const ids = W.map((w) => `'${w.address.toLowerCase()}'`).join(',');
  d1(`DELETE FROM scores WHERE address IN (${ids})`);
  d1(`DELETE FROM transfers WHERE sender IN (${ids})`);
}
