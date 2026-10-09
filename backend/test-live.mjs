// Live Chair Run squares, against STAGING:  ADMIN_TOKEN=... node test-live.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765', pw = process.env.ADMIN_TOKEN;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
const live = () => call('/api/admin/live', { headers: { 'X-Admin-Token': pw } });
const a = privateKeyToAccount(generatePrivateKey());
const nn = (await call('/api/nonce')).b;
const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${a.address}\nNonce: ${nn.nonce}\nIssued: ${nn.issuedAt}`;
const li = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: a.address, nonce: nn.nonce, issuedAt: nn.issuedAt, signature: await a.signMessage({ message: msg }), name: 'Live Tester', picture: '' }) });
const tok = li.b.token;
await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'Lv' + a.address.slice(2, 12) }) }, tok);
const before = (await live()).b;
ok('live endpoint needs the admin password', (await call('/api/admin/live')).s === 403);
const st = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tok);
ok('run started', st.s === 200);
const runId = st.b.runId;
const l1 = (await live()).b;
ok('a just-started run shows as live', l1.count === before.count + 1 && l1.runs.some((r) => r.id === runId), JSON.stringify(l1.runs[0]));
ok('beats need a sign-in', (await call('/api/run/beat', { method: 'POST', body: JSON.stringify({ runId, score: 1, dist: 1, coins: 1 }) })).s === 401);
ok('somebody else cannot beat for my run', (await call('/api/run/beat', { method: 'POST', body: JSON.stringify({ runId: 'f'.repeat(32), score: 1, dist: 1, coins: 1 }) }, tok)).s === 200);   // unknown id is a silent no-op
const b1 = await call('/api/run/beat', { method: 'POST', body: JSON.stringify({ runId, score: 1234, dist: 321, coins: 17 }) }, tok);
ok('a beat is accepted', b1.s === 200);
const l2 = (await live()).b, mine = l2.runs.find((r) => r.id === runId);
ok('the square shows the live score, distance and coins', !!mine && mine.sc === 1234 && mine.d === 321 && mine.c === 17, JSON.stringify(mine));
ok('at most three squares are returned', l2.runs.length <= 3);
ok('bad run ids are refused', (await call('/api/run/beat', { method: 'POST', body: JSON.stringify({ runId: 'nope' }) }, tok)).s === 400);
