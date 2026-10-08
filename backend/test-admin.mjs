// Checks the visitor counter, X username and admin dashboard: ADMIN_TOKEN=... node test-admin.mjs <baseUrl>
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { randomBytes } from 'node:crypto';
const base = process.argv[2] || 'http://localhost:8787';
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const pw = process.env.ADMIN_TOKEN;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})), h: r.headers };
};
const admin = (path, o = {}, t = pw) => call('/api/admin/' + path, { ...o, headers: { 'X-Admin-Token': t } });

// visitor counter
const vid = randomBytes(16).toString('hex');
const before = (await admin('dashboard')).b.visitors;
ok('visit recorded', (await call('/api/hit', { method: 'POST', body: JSON.stringify({ vid }) })).s === 200);
await call('/api/hit', { method: 'POST', body: JSON.stringify({ vid }) });     // same visit again: not double counted
ok('bad visitor id refused', (await call('/api/hit', { method: 'POST', body: JSON.stringify({ vid: 'x' }) })).s === 400);

// a player with an X username
const a = privateKeyToAccount(generatePrivateKey());
const n = (await call('/api/nonce')).b;
const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${a.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
const li = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: a.address, nonce: n.nonce, issuedAt: n.issuedAt, signature: await a.signMessage({ message: msg }), name: 'Admin Test Ape', picture: '' }) });
ok('sign in works', li.s === 200 && li.b.x === '');
const tok = li.b.token;
ok('the old typed-username endpoint is gone', (await call('/api/profile/x', { method: 'POST', body: JSON.stringify({ x: 'abc' }) }, tok)).s === 404);

// dashboard
const d = await admin('dashboard');
ok('dashboard works with the password', d.s === 200 && typeof d.b.visitors === 'number', `visitors ${d.b.visitors}`);
ok('visitor counted once', d.b.visitors === before + 1, `${before} -> ${d.b.visitors}`);
ok('player listed with Glyph name, wallet and IP', d.b.users.some((u) => u.g === 'Admin Test Ape' && u.a === a.address.toLowerCase() && u.ip));
ok('recent visitors list has the visit', d.b.ips.length > 0 && d.b.ips.some((h) => h.vid === vid));
ok('CORS allows the admin header', (await fetch(base + '/api/admin/dashboard', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-admin-token' } })).headers.get('access-control-allow-headers')?.includes('X-Admin-Token'));
ok('admin CORS echoes the origin', d.h.get('access-control-allow-origin') === origin);

// wrong password: refused, then locked out after 6 tries (use a fresh header each time)
let last = 0; for (let i = 0; i < 7; i++) last = (await admin('dashboard', {}, 'wrong-' + i)).s;
ok('wrong passwords are refused, then locked out', last === 429, String(last));
ok('even the right password is locked while locked out', (await admin('dashboard')).s === 429);
