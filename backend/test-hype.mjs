// Texts sent as Hype from the admin page, against STAGING:  ADMIN_TOKEN=... node test-hype.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765', pw = process.env.ADMIN_TOKEN;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
const admin = (path, body, t = pw) => call('/api/admin/' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'X-Admin-Token': t } });
const A = privateKeyToAccount(generatePrivateKey()), B = privateKeyToAccount(generatePrivateKey());
async function login(acct, n) {
  const nn = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${nn.nonce}\nIssued: ${nn.issuedAt}`;
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: nn.nonce, issuedAt: nn.issuedAt, signature: await acct.signMessage({ message: msg }), name: 'Hype ' + n, picture: '' }) });
  await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'Hy' + acct.address.slice(2, 10) + n }) }, r.b.token);
  return r.b.token;
}
const ta = await login(A, 'a'), tb = await login(B, 'b');
const a = A.address.toLowerCase(), b = B.address.toLowerCase();

ok('a player cannot send as Hype (no admin password)', (await call('/api/admin/hype', { method: 'POST', body: JSON.stringify({ to: b, body: 'hi' }), headers: { 'X-Admin-Token': 'nope' } })).s === 403);
ok('a player token is not an admin password', (await admin('hype', { to: b, body: 'hi' }, ta)).s === 403);
ok('picking nobody is refused', (await admin('hype', { to: '', body: 'hi' })).s === 400);
ok('an empty message is refused', (await admin('hype', { to: a, body: '  ' })).s === 400);
ok('over 280 characters is refused', (await admin('hype', { to: a, body: 'x'.repeat(281) })).s === 400);
ok('an unknown player is refused', (await admin('hype', { to: '0x' + '5'.repeat(40), body: 'hi' })).s === 404);

const s1 = await admin('hype', { to: a, body: 'TIMES ALMOST UP! Keep running.' });
ok('Hype texts player A', s1.s === 200 && s1.b.ok === true, JSON.stringify(s1.b));
const th = await call('/api/messages/threads', {}, ta);
const hype = th.b.threads.find((t) => t.name === 'Hype');
ok('A sees a chat called Hype with 1 unread text', !!hype && hype.unread === 1 && hype.last === 'TIMES ALMOST UP! Keep running.' && th.b.unread === 1, JSON.stringify(hype));
const open = await call('/api/messages/thread?with=' + hype.with, {}, ta);
ok('the text opens as a received message', open.b.messages.length === 1 && open.b.messages[0].mine === false && open.b.name === 'Hype');
ok('B never sees it (one-on-one only)', (await call('/api/messages/threads', {}, tb)).b.threads.every((t) => t.name !== 'Hype'));
const rep = await call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: hype.with, body: 'On it!' }) }, ta);
ok('A can reply to Hype', rep.s === 200);
await admin('hype', { to: a, body: 'Second message' });
ok('a second text lands in the same chat', (await call('/api/messages/thread?with=' + hype.with, {}, ta)).b.messages.map((m) => m.body).join('|') === 'TIMES ALMOST UP! Keep running.|On it!|Second message');

const dash = await call('/api/admin/dashboard', { headers: { 'X-Admin-Token': pw } });
ok('the Hype account is not in the admin player list', !dash.b.users.some((u) => u.a === hype.with));
ok('admin sees A\'s reply in the player texts', dash.b.messages.some((m) => m.body === 'On it!'));
ok('admin sees what was sent as Hype', dash.b.hypes.some((h) => h.body === 'Second message') && dash.b.hypes.every((h) => h.rn));
ok('the leaderboard does not list Hype', !((await call('/api/top9')).b.rows || []).some((r) => r.id === hype.with));
