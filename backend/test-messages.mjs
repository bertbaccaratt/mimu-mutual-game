// Player-to-player texts against the STAGING API:  ADMIN_TOKEN=... node test-messages.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url.'); process.exit(2); }
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
  if (r.s !== 200) throw new Error('login ' + r.s);
  await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'Mg' + acct.address.slice(2, 11) + n }) }, r.b.token);
  return r.b.token;
}
const A = privateKeyToAccount(generatePrivateKey()), B = privateKeyToAccount(generatePrivateKey()), C = privateKeyToAccount(generatePrivateKey());
const ta = await login(A, 'Alice', 'a'), tb = await login(B, 'Bob', 'b');
await new Promise((r) => setTimeout(r, 61000));       // per-IP sign-in limit
const tc = await login(C, 'Carol', 'c');
const a = A.address.toLowerCase(), b = B.address.toLowerCase(), c = C.address.toLowerCase();
const send = (tok, to, body) => call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to, body }) }, tok);

ok('texting needs sign-in', (await call('/api/messages/threads')).s === 401 && (await call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: b, body: 'hi' }) })).s === 401);
const m1 = await send(ta, b, 'You are going down, Bob');
ok('A can text B', m1.s === 200 && m1.b.id > 0, JSON.stringify(m1.b));
const tbThreads = await call('/api/messages/threads', {}, tb);
ok('B sees the thread with 1 unread, from Alice', tbThreads.s === 200 && tbThreads.b.unread === 1 && tbThreads.b.threads[0].with === a && /^@Mg/.test(tbThreads.b.threads[0].name) && tbThreads.b.threads[0].last === 'You are going down, Bob', JSON.stringify(tbThreads.b).slice(0, 200));
const t1 = await call('/api/messages/thread?with=' + a, {}, tb);
ok('B opens it and reads the text', t1.b.messages.length === 1 && t1.b.messages[0].mine === false && t1.b.messages[0].body === 'You are going down, Bob');
ok('reading clears the unread count', (await call('/api/messages/threads', {}, tb)).b.unread === 0);
const m2 = await send(tb, a, 'Bring it <b>on</b>');
const t2 = await call('/api/messages/thread?with=' + b, {}, ta);
ok('A sees B\'s reply in the same thread, in order', t2.b.messages.length === 2 && t2.b.messages[0].mine === true && t2.b.messages[1].mine === false && t2.b.messages[1].body === 'Bring it <b>on</b>');
const newer = await call('/api/messages/thread?with=' + b + '&after=' + m1.b.id, {}, ta);
ok('polling only returns newer texts', newer.b.messages.length === 1 && newer.b.messages[0].id === m2.b.id);
ok('texts are stored as plain text (the app escapes them)', t2.b.messages[1].body.includes('<b>'));
ok('a third player cannot read the thread', (await call('/api/messages/thread?with=' + a, {}, tc)).b.messages.length === 0);
ok('empty text refused', (await send(ta, b, '   ')).s === 400);
ok('over-long text refused', (await send(ta, b, 'x'.repeat(281))).s === 400);
ok('cannot text yourself', (await send(ta, a, 'hi me')).s === 400);
ok('cannot text an unknown wallet', (await send(ta, '0x' + '4'.repeat(40), 'hi')).s === 404);
ok('control characters are stripped', (await send(ta, b, 'a\u0000b‮c')).b.body === 'abc');
// blocking
ok('B blocks A', (await call('/api/messages/block', { method: 'POST', body: JSON.stringify({ user: a }) }, tb)).b.blocked === true);
ok('A can no longer text B', (await send(ta, b, 'still there?')).s === 403);
const afterBlock = await call('/api/messages/thread?with=' + a, {}, tb);
ok('B no longer sees A\'s texts, and the thread says blocked', afterBlock.b.blocked === true && afterBlock.b.messages.every((m) => m.mine));
ok('B can unblock', (await call('/api/messages/block', { method: 'POST', body: JSON.stringify({ user: a, block: false }) }, tb)).b.blocked === false);
ok('A can text B again', (await send(ta, b, 'back')).s === 200);
// flood limit
let last = 0; for (let i = 0; i < 14; i++) last = (await send(tc, a, 'spam ' + i)).s;
ok('flooding is slowed down', last === 429, String(last));
if (process.env.ADMIN_TOKEN) {
  const dash = await call('/api/admin/dashboard', { headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN } });
  const mine = (dash.b.messages || []).find((m) => m.body === 'You are going down, Bob');
  ok('admin can read the texts', !!mine && /^@Mg/.test(mine.sn) && /^@Mg/.test(mine.rn));
  const del = await call('/api/admin/delmsg', { method: 'POST', body: JSON.stringify({ id: mine.id }), headers: { 'X-Admin-Token': process.env.ADMIN_TOKEN } });
  ok('admin can delete a text', del.s === 200 && (await call('/api/messages/thread?with=' + a, {}, tb)).b.messages.every((m) => m.body !== 'You are going down, Bob'));
}
