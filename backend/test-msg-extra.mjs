// Player-to-player texts: the awkward cases, against STAGING:
//   node test-msg-extra.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging|localhost/.test(base)) { console.error('Give the STAGING (or local) url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
async function login(acct, name) {
  const n = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
  const signature = await acct.signMessage({ message: msg });
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: n.nonce, issuedAt: n.issuedAt, signature, name, picture: '' }) });
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'M' + acct.address.slice(2, 12) }) }, r.b.token);
  return { addr: acct.address.toLowerCase(), token: r.b.token, s: r.s };
}
const send = (from, to, body) => call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: to.addr || to, body }) }, from.token);
const thread = async (me, other) => (await call('/api/messages/thread?with=' + other.addr, {}, me.token)).b;

const A = await login(privateKeyToAccount(generatePrivateKey()), 'MsgA'), B = await login(privateKeyToAccount(generatePrivateKey()), 'MsgB'), C = await login(privateKeyToAccount(generatePrivateKey()), 'MsgC');
ok('three players sign in', A.s === 200 && B.s === 200 && C.s === 200);

// the texts people really type
const cases = [
  ['emoji', '🔥 GG 👍🏽 see you at the top'],
  ['two lines', 'first line\nsecond line'],
  ['quotes and html stay plain text', `<b>hi</b> & "q" 'x' </script>`],
  ['other alphabets', 'مرحبا 你好 привет'],
  ['exactly 280 characters', 'x'.repeat(280)],
];
for (const [name, text] of cases) {
  const r = await send(A, B, text);
  const t = await thread(B, A);
  const got = t.messages && t.messages.find((m) => m.id === r.b.id);
  ok(`A texts B: ${name}`, r.s === 200 && !!got && !got.mine, `status ${r.s}`);
}
ok('281 characters is refused with a clear reason', (await send(A, B, 'x'.repeat(281))).s === 400);
ok('an empty text is refused', (await send(A, B, '   ')).b.error === 'Type a message first.');
const badTo = await send(A, 'not-an-address', 'hi');
ok('a bad recipient says the player could not be found', badTo.s === 400 && /could not be found/.test(badTo.b.error), badTo.b.error);
const unknown = await send(A, '0x' + 'ab'.repeat(20), 'hi');
ok('a player that has never signed in cannot get texts', unknown.s === 404, unknown.b.error);
ok('texting yourself is refused', (await send(A, A, 'hi')).s === 400);

// a retry after a slow connection must not send the same text twice
const d1 = await send(A, C, 'retry me');
const d2 = await send(A, C, 'retry me');
const tc = await thread(C, A);
ok('the same text sent twice in a moment arrives once', d1.s === 200 && d2.s === 200 && d1.b.id === d2.b.id && tc.messages.filter((m) => m.body === 'retry me').length === 1, `ids ${d1.b.id}/${d2.b.id}`);

// many different players, one after another
const crowd = [];
for (let i = 0; i < 4; i++) crowd.push(await login(privateKeyToAccount(generatePrivateKey()), 'MsgCrowd' + i));
let allOk = true; for (const p of crowd) { const r = await send(A, p, 'GG ' + p.addr.slice(2, 6)); if (r.s !== 200) allOk = false; }
ok('one player can text several different players in a row', allOk);
const threads = (await call('/api/messages/threads', {}, A.token)).b;
ok('the sender sees every chat, newest first', threads.threads.length >= 6 && threads.threads[0].with === crowd[crowd.length - 1].addr, String(threads.threads.length) + ' chats');

// blocking, and unblocking
await call('/api/messages/block', { method: 'POST', body: JSON.stringify({ user: A.addr, block: true }) }, C.token);
const blocked = await send(A, C, 'are you there');
ok('a blocked sender gets a clear reason', blocked.s === 403 && /not taking texts/.test(blocked.b.error), blocked.b.error);
await call('/api/messages/block', { method: 'POST', body: JSON.stringify({ user: A.addr, block: false }) }, C.token);
ok('after unblocking, texts go through again', (await send(A, C, 'back again')).s === 200);

// a lively chat: more than the old limit of 12 a minute now goes through, and a flood is still slowed down
let burstOk = 0; for (let i = 0; i < 14; i++) { const r = await send(B, A, 'rapid ' + i); if (r.s === 200) burstOk++; }
ok('14 quick texts in a minute all go through', burstOk === 14, String(burstOk));
let flood = 0; for (let i = 0; i < 12; i++) { const r = await send(B, C, 'flood ' + i); if (r.s === 429) flood++; }
ok('a flood is still slowed down', flood >= 1, String(flood) + ' refused');
const slow = await send(B, C, 'one more');
ok('the slow-down message is friendly', slow.s === 429 && /Slow down/.test(slow.b.error), slow.b.error);

// the other side reads everything in order
const tb = await thread(A, B);
ok('the thread comes back in order with both sides', tb.messages.length > 5 && tb.messages.every((m, i, a) => i === 0 || a[i - 1].id < m.id));
