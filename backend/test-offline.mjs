// "Offline memory": texts and admin emails that arrive while a player is signed out are waiting when they sign back in.
//   ADMIN_TOKEN=... node test-offline.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765', pw = process.env.ADMIN_TOKEN;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})) };
};
const admin = (path, body) => call('/api/admin/' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'X-Admin-Token': pw } });
// a brand-new sign-in (fresh nonce, fresh signature, fresh token): exactly what happens when a player comes back later
async function signIn(acct, glyphName) {
  const nn = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${nn.nonce}\nIssued: ${nn.issuedAt}`;
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: nn.nonce, issuedAt: nn.issuedAt, signature: await acct.signMessage({ message: msg }), name: glyphName, picture: '' }) });
  if (r.s !== 200) throw new Error('sign-in failed ' + r.s);
  return r.b;
}
const A = privateKeyToAccount(generatePrivateKey()), B = privateKeyToAccount(generatePrivateKey()), C = privateKeyToAccount(generatePrivateKey()), D = privateKeyToAccount(generatePrivateKey());
const addr = (x) => x.address.toLowerCase();
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// --- day 1: three players sign in and pick usernames, then everyone goes offline ---
const a1 = await signIn(A, 'Alice'), b1 = await signIn(B, 'Bob'), c1 = await signIn(C, 'Carol');
const hand = (x, tok) => call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'Off' + x.address.slice(2, 10) }) }, tok);
await hand(A, a1.token); await hand(B, b1.token); await hand(C, c1.token);
await sleep(61000);                                         // per-IP sign-in limit
const send = (tok, to, body) => call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: addr(to), body }) }, tok);

// --- while Bob and Carol are offline (no session at all) ---
ok('Alice texts Bob (offline)', (await send(a1.token, B, 'Bob, are you there?')).s === 200);
ok('Alice texts Bob again', (await send(a1.token, B, 'Call me when you are back')).s === 200);
ok('Alice texts Bob a third time', (await send(a1.token, B, 'Top 5 is heating up')).s === 200);
ok('Alice texts Carol (offline too)', (await send(a1.token, C, 'Hey Carol')).s === 200);
const m1 = await admin('mail', { subject: 'Campaign opens soon', body: 'Get ready.\nThe countdown is live.', image: PNG });
const m2 = await admin('mail', { subject: 'Gaming stops Tuesday', body: 'No more runs after 6 AM PST.' });
ok('admin sends two emails while everyone is offline', m1.s === 200 && m2.s === 200);

// --- Bob comes back later: a brand-new sign-in ---
const b2 = await signIn(B, 'Bob');
const bt = await call('/api/messages/threads', {}, b2.token);
ok('Bob sees Alice\'s thread with 3 unread texts waiting', bt.b.threads.length === 1 && bt.b.threads[0].unread === 3 && bt.b.unread === 3 && bt.b.threads[0].last === 'Top 5 is heating up', JSON.stringify({ unread: bt.b.unread, last: bt.b.threads[0]?.last }));
ok('Bob\'s thread shows Alice\'s current username', /^@Off/.test(bt.b.threads[0].name), bt.b.threads[0].name);
const bth = await call('/api/messages/thread?with=' + addr(A), {}, b2.token);
ok('all three texts are there, in order', bth.b.messages.map((m) => m.body).join('|') === 'Bob, are you there?|Call me when you are back|Top 5 is heating up' && bth.b.messages.every((m) => !m.mine));
ok('Bob sees both emails, unread', bt.b.mail === 2);
const bm = await call('/api/mail', {}, b2.token);
ok('inbox lists the two emails, newest first, unread', bm.b.mails.length >= 2 && bm.b.mails[0].id === m2.b.id && bm.b.mails[1].id === m1.b.id && bm.b.mails.slice(0, 2).every((m) => !m.read), bm.b.mails.slice(0, 2).map((m) => m.subject).join(' / '));
const mi = await call('/api/mail/item?id=' + m1.b.id, {}, b2.token);
ok('the email with the photo opens with its photo', mi.s === 200 && mi.b.body.includes('countdown is live') && /\/api\/mail\/img\//.test(mi.b.image || ''));
ok('Bob replies; the reply is saved', (await send(b2.token, A, 'Back! Ready to run.')).s === 200);

// --- Bob signs out and returns a THIRD time: everything is still there, and read state is remembered ---
await sleep(15000);
const b3 = await signIn(B, 'Bob');
const bt3 = await call('/api/messages/threads', {}, b3.token);
ok('after another sign-in the thread is still there and the texts stay read', bt3.b.threads.length === 1 && bt3.b.unread === 0 && bt3.b.mail === 1, JSON.stringify({ unread: bt3.b.unread, mail: bt3.b.mail }));
const bth3 = await call('/api/messages/thread?with=' + addr(A), {}, b3.token);
ok('his own reply is part of the saved thread', bth3.b.messages.length === 4 && bth3.b.messages[3].mine === true);
const bm3 = await call('/api/mail', {}, b3.token);
ok('the email he opened stays read; the other is still unread', bm3.b.mails.find((m) => m.id === m1.b.id).read === true && bm3.b.mails.find((m) => m.id === m2.b.id).read === false);

// --- Carol was offline for all of it ---
await sleep(30000);
const c2 = await signIn(C, 'Carol');
const ct = await call('/api/messages/threads', {}, c2.token);
ok('Carol gets Alice\'s text and both emails when she returns', ct.b.unread === 1 && ct.b.threads[0].last === 'Hey Carol' && ct.b.mail === 2, JSON.stringify({ unread: ct.b.unread, mail: ct.b.mail }));

// --- Alice was offline when Bob replied ---
await sleep(15000);
const a2 = await signIn(A, 'Alice');
const at = await call('/api/messages/threads', {}, a2.token);
const bobThread = at.b.threads.find((t) => t.with === addr(B));
ok('Alice finds Bob\'s reply waiting after she returns', !!bobThread && bobThread.unread === 1 && bobThread.last === 'Back! Ready to run.', JSON.stringify(bobThread));

// --- a phone that never existed when the emails were sent still gets them ---
await sleep(20000);
const d1 = await signIn(D, 'Dave');
const dm = await call('/api/mail', {}, d1.token);
ok('a brand-new player who signs in later also gets the earlier emails', dm.b.mails.some((m) => m.id === m1.b.id) && dm.b.mails.some((m) => m.id === m2.b.id) && dm.b.mails.every((m) => m.read === false));

// clean up the test emails
await admin('delmail', { id: m1.b.id }); await admin('delmail', { id: m2.b.id });
