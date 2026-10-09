// Mimu Mail against STAGING:  ADMIN_TOKEN=... node test-mail.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2];
if (!base || !/staging/.test(base)) { console.error('Give the STAGING url.'); process.exit(2); }
const origin = 'http://localhost:8765', domain = 'localhost:8765', pw = process.env.ADMIN_TOKEN;
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(opt.headers || {}) } });
  return { s: r.status, b: await r.json().catch(() => ({})), r };
};
const admin = (path, body, t = pw) => call('/api/admin/' + path, { method: 'POST', body: JSON.stringify(body), headers: { 'X-Admin-Token': t } });
async function login(acct, n) {
  const nn = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${nn.nonce}\nIssued: ${nn.issuedAt}`;
  const r = await call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: nn.nonce, issuedAt: nn.issuedAt, signature: await acct.signMessage({ message: msg }), name: 'Mail ' + n, picture: '' }) });
  return r.b.token;
}
const A = privateKeyToAccount(generatePrivateKey()), B = privateKeyToAccount(generatePrivateKey());
const ta = await login(A, 'A'), tb = await login(B, 'B');
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

ok('inbox needs a sign-in', (await call('/api/mail')).s === 401);
const empty = await call('/api/mail', {}, ta);
const before = empty.b.mails.length;
ok('the inbox works for a signed-in phone', empty.s === 200 && Array.isArray(empty.b.mails));

// only the admin can send
ok('a player cannot send mail (no admin password)', (await call('/api/admin/mail', { method: 'POST', body: JSON.stringify({ subject: 'x', body: 'y' }), headers: { 'X-Admin-Token': 'nope' } })).s === 403);
ok('a player token is not an admin password', (await call('/api/admin/mail', { method: 'POST', body: JSON.stringify({ subject: 'x', body: 'y' }), headers: { 'X-Admin-Token': ta } })).s === 403);
ok('there is no player-facing send route', (await call('/api/mail', { method: 'POST', body: JSON.stringify({ subject: 'x', body: 'y' }) }, ta)).s === 404);

// validation
ok('subject is required', (await admin('mail', { subject: '  ', body: 'hello' })).s === 400);
ok('message is required', (await admin('mail', { subject: 'Hi', body: ' ' })).s === 400);
ok('over-long subject refused', (await admin('mail', { subject: 'x'.repeat(121), body: 'hello' })).s === 400);
ok('svg attachment refused', (await admin('mail', { subject: 'Hi', body: 'hello', image: 'data:image/svg+xml;base64,PHN2Zy8+' })).s === 400);
ok('fake png (script bytes) refused', (await admin('mail', { subject: 'Hi', body: 'hello', image: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>-----').toString('base64') })).s === 400);
ok('oversized photo refused', (await admin('mail', { subject: 'Hi', body: 'hello', image: 'data:image/png;base64,' + 'A'.repeat(1000100) })).s === 400);

// send one with a photo
const sent = await admin('mail', { subject: 'Welcome to <b>Mimu Mail</b>', body: 'Line one\nLine two <script>alert(1)</script>', image: PNG });
ok('admin sends an email with a photo', sent.s === 200 && sent.b.id > 0, JSON.stringify(sent.b));
const la = await call('/api/mail', {}, ta), lb = await call('/api/mail', {}, tb);
ok('it lands on phone A', la.b.mails.length === before + 1 && la.b.mails[0].subject === 'Welcome to <b>Mimu Mail</b>' && la.b.mails[0].read === false && la.b.mails[0].image === true);
ok('and on phone B (everyone signed in gets it)', lb.b.mails.some((m) => m.id === sent.b.id && !m.read));
const th = await call('/api/messages/threads', {}, ta);
ok('unread mail count rides along with the texts poll', th.b.mail >= 1);
const item = await call('/api/mail/item?id=' + sent.b.id, {}, ta);
ok('opening it returns subject, body and the photo link', item.s === 200 && item.b.body.startsWith('Line one\nLine two') && /\/api\/mail\/img\/[0-9a-f]{24}$/.test(item.b.image || ''), item.b.image);
ok('opening marks it read for A only', (await call('/api/mail', {}, ta)).b.mails.find((m) => m.id === sent.b.id).read === true && (await call('/api/mail', {}, tb)).b.mails.find((m) => m.id === sent.b.id).read === false);
const img = await fetch(item.b.image);
ok('the photo is served as an image with locked-down headers', img.status === 200 && img.headers.get('content-type') === 'image/png' && img.headers.get('x-content-type-options') === 'nosniff' && /sandbox/.test(img.headers.get('content-security-policy') || ''));
ok('guessing a photo link does not work', (await fetch(base + '/api/mail/img/' + '0'.repeat(24))).status === 404);
ok('mail needs a sign-in to read', (await call('/api/mail/item?id=' + sent.b.id)).s === 401);

// admin view and delete
const dash = await call('/api/admin/dashboard', { headers: { 'X-Admin-Token': pw } });
const row = (dash.b.mails || []).find((m) => m.id === sent.b.id);
ok('admin sees it in the sent list, with how many opened it', !!row && row.reads === 1 && row.img === 1, JSON.stringify(row));
ok('admin can delete it from every phone', (await admin('delmail', { id: sent.b.id })).s === 200 && !(await call('/api/mail', {}, tb)).b.mails.some((m) => m.id === sent.b.id));
ok('and its photo link stops working', (await fetch(item.b.image)).status === 404);
