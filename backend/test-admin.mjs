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
ok('sign in says an X handle is needed', li.b.needX === true);
const pre = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tok);
ok('cannot start a run before adding an X handle', pre.s === 403 && pre.b.needX === true, String(pre.s));
ok('bad X handle refused', (await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'not valid!!' }) }, tok)).s === 400);
ok('X handle needs sign-in', (await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'abc' }) })).s === 401);
const hnd = 'T' + randomBytes(5).toString('hex');
const sx = await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: '@' + hnd }) }, tok);
ok('X handle saved', sx.s === 200 && sx.b.x === hnd, JSON.stringify(sx.b));
const post = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' }) }, tok);
ok('runs work once a handle is on file', post.s === 200, String(post.s));
{
  const b2 = privateKeyToAccount(generatePrivateKey());
  const n2 = (await call('/api/nonce')).b;
  const m2 = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${b2.address}\nNonce: ${n2.nonce}\nIssued: ${n2.issuedAt}`;
  const l2 = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: b2.address, nonce: n2.nonce, issuedAt: n2.issuedAt, signature: await b2.signMessage({ message: m2 }), name: 'Second', picture: '' }) });
  const dup = await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: hnd.toUpperCase() }) }, l2.b.token);
  ok('the same handle cannot be used by a second wallet (any capitalisation)', dup.s === 409, String(dup.s));
}

// profile picture
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
ok('picture upload needs sign-in', (await call('/api/avatar', { method: 'POST', body: JSON.stringify({ image: PNG }) })).s === 401);
ok('svg is refused', (await call('/api/avatar', { method: 'POST', body: JSON.stringify({ image: 'data:image/svg+xml;base64,PHN2Zy8+' }) }, tok)).s === 400);
ok('a fake png (text bytes) is refused', (await call('/api/avatar', { method: 'POST', body: JSON.stringify({ image: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>-----').toString('base64') }) }, tok)).s === 400);
ok('an oversized picture is refused', (await call('/api/avatar', { method: 'POST', body: JSON.stringify({ image: 'data:image/png;base64,' + 'A'.repeat(95000) }) }, tok)).s === 400);
const up = await call('/api/avatar', { method: 'POST', body: JSON.stringify({ image: PNG }) }, tok);
ok('a real picture is accepted', up.s === 200 && /\/api\/avatar\/0x[0-9a-f]{40}\?v=\d+$/.test(up.b.url || ''), JSON.stringify(up.b));
const img = await fetch(base + '/api/avatar/' + a.address.toLowerCase());
ok('the picture is served back as an image, locked down', img.status === 200 && img.headers.get('content-type') === 'image/png' && img.headers.get('x-content-type-options') === 'nosniff' && /sandbox/.test(img.headers.get('content-security-policy') || ''));
ok('a player without a picture gets 404', (await fetch(base + '/api/avatar/0x' + '2'.repeat(40))).status === 404);
// dashboard
const d = await admin('dashboard');
ok('dashboard works with the password', d.s === 200 && typeof d.b.visitors === 'number', `visitors ${d.b.visitors}`);
ok('visitor counted once', d.b.visitors === before + 1, `${before} -> ${d.b.visitors}`);
ok('player listed with Glyph name, wallet, X handle and our picture URL', d.b.users.some((u) => u.g === 'Admin Test Ape' && u.a === a.address.toLowerCase() && u.x === hnd && /\/api\/avatar\//.test(u.pic || '')));
ok('the dashboard carries no IP address, map or location data anywhere', !('ips' in d.b) && !('map' in d.b) && d.b.users.every((u) => !('ip' in u)) && !/"(ip|lat|lon|country|city)"/.test(JSON.stringify(d.b)));
ok('CORS allows the admin header', (await fetch(base + '/api/admin/dashboard', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'x-admin-token' } })).headers.get('access-control-allow-headers')?.includes('X-Admin-Token'));
ok('admin CORS echoes the origin', d.h.get('access-control-allow-origin') === origin);

// wrong password: refused, then locked out after 6 tries (use a fresh header each time)
let last = 0; for (let i = 0; i < 7; i++) last = (await admin('dashboard', {}, 'wrong-' + i)).s;
ok('wrong passwords are refused, then locked out', last === 429, String(last));
ok('even the right password is locked while locked out', (await admin('dashboard')).s === 429);
