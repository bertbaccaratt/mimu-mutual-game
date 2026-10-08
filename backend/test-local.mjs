// Local end-to-end check of the API: node test-local.mjs [baseUrl]
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2] || 'http://localhost:8787';
const origin = 'http://localhost:8765';
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  return { status: r.status, body: await r.json().catch(() => ({})), cors: r.headers.get('access-control-allow-origin') };
};
const ok = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) process.exitCode = 1; };

const acct = privateKeyToAccount(generatePrivateKey());
const login = async (account, name) => {
  const n = await call('/api/nonce');
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing and sends no transaction.\n\nAddress: ${account.address}\nNonce: ${n.body.nonce}\nIssued: ${n.body.issuedAt}`;
  const signature = await account.signMessage({ message: msg });
  return call('/api/auth', { method: 'POST', body: JSON.stringify({ address: account.address, nonce: n.body.nonce, issuedAt: n.body.issuedAt, signature, name, picture: 'https://example.com/a.png' }) });
};

const h = await call('/api/health');
ok('health', h.status === 200 && h.body.ok, JSON.stringify(h.body.gates));
ok('cors origin echoed', h.cors === origin);

const a = await login(acct, 'Test <b>Ape</b> 🐒');
if (h.body.gates.mimu) {
  ok('random wallet blocked by Mimu rule', a.status === 403 && a.body.gates && a.body.gates.reason === 'nomimu', JSON.stringify(a.body.gates || a.body));
} else {
  ok('login works (gates off)', a.status === 200 && !!a.body.token);
  const tok = a.body.token;
  const s0 = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 1234, dist: 200 }) });
  ok('score without token rejected', s0.status === 401);
  const s1 = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 1234, dist: 200 }) }, tok);
  ok('score accepted', s1.status === 200 && s1.body.value === 1234 && s1.body.rank === 1, JSON.stringify(s1.body));
  await new Promise((r) => setTimeout(r, 2600));
  const s2 = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 900, dist: 200 }) }, tok);
  ok('lower score keeps best', s2.status === 200 && s2.body.value === 1234);
  await new Promise((r) => setTimeout(r, 2600));
  const s3 = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 999999, dist: 10 }) }, tok);
  ok('implausible score rejected', s3.status === 422 || s3.status === 400, String(s3.status));
  const b = await call('/api/leaderboard?kind=run', {}, tok);
  ok('leaderboard lists me', b.status === 200 && b.body.rows.length === 1 && b.body.me && b.body.me.rank === 1, JSON.stringify(b.body.rows[0]));
  ok('name sanitised', b.body.rows[0] && !/[<>]/.test(b.body.rows[0].name), b.body.rows[0] && b.body.rows[0].name);
  ok('address not exposed in full', !JSON.stringify(b.body.rows).includes(acct.address.slice(10, 30)));
}
const bad = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: 'x.y', issuedAt: Date.now(), signature: '0x00' }) });
ok('forged nonce rejected', bad.status === 401);
const forged = await call('/api/score', { method: 'POST', body: JSON.stringify({ kind: 'run', value: 10 }) }, 'abc.def');
ok('forged token rejected', forged.status === 401);
