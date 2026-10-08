// Top 9 sending rules, against the STAGING API (it seeds fake scores in the staging database and removes them afterwards):
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

// 12 wallets: W0..W8 will be the top 9, W9 and W10 are outside it, W11 has registered nothing
const W = Array.from({ length: 12 }, () => privateKeyToAccount(generatePrivateKey()));
const tok = [];
for (let i = 0; i < W.length; i++) { tok.push(await login(W[i], 'Transfer Test ' + i, i)); if (i % 4 === 3) await sleep(61000); }   // per-IP sign-in limit
const week = (await call('/api/health')).b.week;
const rows = [];
for (let i = 0; i < 9; i++) rows.push(`('${W[i].address.toLowerCase()}',${week},${900000 - i * 1000},50,1,1)`);
rows.push(`('${W[9].address.toLowerCase()}',${week},100,40,1,1)`, `('${W[10].address.toLowerCase()}',${week},50,5,1,1)`);
d1(`INSERT OR REPLACE INTO scores(address,week,run_best,coins_total,runs,updated_at) VALUES ${rows.join(',')}`);
const addr = (i) => W[i].address.toLowerCase();
const send = (from, to, amount) => call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: typeof to === 'number' ? addr(to) : to, amount }) }, tok[from]);
try {
  const s0 = await call('/api/send/status', {}, tok[0]);
  ok('a top-9 runner is told they cannot send', s0.s === 200 && s0.b.top9 === true && s0.b.canSend === false, JSON.stringify(s0.b));
  const s9 = await call('/api/send/status', {}, tok[9]);
  ok('a runner outside the top 9 can send', s9.b.top9 === false && s9.b.canSend === true && s9.b.balance === 40, JSON.stringify(s9.b));

  const a = await send(0, 10, 5);
  ok('top-9 runner cannot send', a.s === 403 && a.b.top9 === true, String(a.s));
  const b = await send(8, 10, 5);
  ok('the 9th runner still cannot send', b.s === 403);
  const board = async () => Object.fromEntries(((await call('/api/leaderboard?kind=run&limit=100')).b.rows || []).map((r) => [r.id, r.v]));
  const b0 = await board();
  const boostRes = await send(9, 0, 10);
  ok('sending to a top-9 runner works and reports a boost', boostRes.s === 200 && boostRes.b.boosted === 20 && boostRes.b.balance === 30, JSON.stringify(boostRes.b));
  const b1 = await board();
  ok('the top-9 runner score went up by 2 points per $TMF', b1[addr(0)] === b0[addr(0)] + 20, b0[addr(0)] + ' -> ' + b1[addr(0)]);
  const t9 = (await call('/api/top9')).b;
  const r0 = t9.rows.find((r) => r.id === addr(0)), r9 = t9.rows.find((r) => r.id === addr(9)), pos9 = t9.rows.findIndex((r) => r.id === addr(9));
  ok('top 9 list: the leaders are flagged and the total is Chair Run score + $TMF found', !!r0 && r0.top9 === true && r0.total === r0.run + r0.tmf && r0.run === 900020 && r0.tmf === 60, JSON.stringify(r0));
  ok('top 9 list: everyone else is listed, not flagged', !!r9 && r9.top9 === false && pos9 >= 9 && t9.rows.filter((r) => r.top9).length === 9, 'rank ' + (r9 && r9.rank));
  ok('top 9 list is ordered by total', t9.rows.every((r, i) => i === 0 || t9.rows[i - 1].total >= r.total));
  const c = await send(9, 10, 15);
  ok('outside the top 9: sending works', c.s === 200 && c.b.balance === 15 && c.b.boosted === 0, JSON.stringify(c.b));
  const s10 = await call('/api/send/status', {}, tok[10]);
  ok('recipient received it', s10.b.balance === 20, String(s10.b.balance));
  const b2 = await board();
  ok('a player outside the top 9 gets the coins but no score boost', b2[addr(10)] === undefined || b2[addr(10)] === 50, String(b2[addr(10)]));
  ok('cannot send more than you have', (await send(9, 10, 16)).s === 409);
  ok('cannot send to a player with no $TMF registered', (await send(9, 11, 1)).s === 409);
  ok('cannot send to an unknown address', (await send(9, '0x' + '1'.repeat(40), 1)).s === 409);
  ok('cannot send to yourself', (await send(9, 9, 1)).s === 400);
  ok('zero is refused', (await send(9, 10, 0)).s === 400);
  ok('negative is refused', (await send(9, 10, -3)).s === 400);
  ok('fractions are refused', (await send(9, 10, 1.5)).s === 400);
  ok('sending needs a sign-in', (await call('/api/transfer', { method: 'POST', body: JSON.stringify({ to: addr(10), amount: 1 }) })).s === 401);
  const s9b = await call('/api/send/status', {}, tok[9]);
  ok('balance only dropped by the one successful send', s9b.b.balance === 15, String(s9b.b.balance));
  const all = await send(9, 10, 15);
  ok('can send the whole balance', all.s === 200 && all.b.balance === 0);
  ok('with nothing left, sending is refused', (await send(9, 10, 1)).s === 409);
  if (process.env.ADMIN_TOKEN) {
    const dash = await call('/api/admin/dashboard', { headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN } });
    ok('transfers show in the admin dashboard', dash.s === 200 && dash.b.transfers.some((t) => t.sa === addr(9) && t.ra === addr(10) && t.amount === 15));
  }
} finally {
  d1(`DELETE FROM scores WHERE address IN (${W.map((w) => `'${w.address.toLowerCase()}'`).join(',')})`);
  d1(`DELETE FROM transfers WHERE sender IN (${W.map((w) => `'${w.address.toLowerCase()}'`).join(',')})`);
}
