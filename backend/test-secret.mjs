// The secret phone line: exactly one finder in the whole game. Against STAGING (the finder row is cleared first):
//   npx wrangler d1 execute mimu-mutual-staging --remote -c wrangler.staging.toml --command "DELETE FROM secret_finder"
//   node test-secret.mjs https://mimu-mutual-api-staging.mutualmimu.workers.dev
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
  if (r.s === 200 && r.b.needX) await call('/api/x/handle', { method: 'POST', body: JSON.stringify({ x: 'S' + acct.address.slice(2, 12) }) }, r.b.token);
  return { addr: acct.address.toLowerCase(), token: r.b.token, s: r.s };
}
const claim = (tok) => call('/api/secret/claim', { method: 'POST', body: '{}' }, tok);
const status = (tok) => call('/api/secret/status', {}, tok);

const A = await login(privateKeyToAccount(generatePrivateKey()), 'SecA'), B = await login(privateKeyToAccount(generatePrivateKey()), 'SecB'), C = await login(privateKeyToAccount(generatePrivateKey()), 'SecC');
ok('three players sign in', A.s === 200 && B.s === 200 && C.s === 200);

const s0 = await status();
ok('before anyone dials, anyone can see it is not found yet (no sign-in needed)', s0.s === 200 && s0.b.found === false, JSON.stringify(s0.b));
ok('a signed-out dial is refused', (await call('/api/secret/claim', { method: 'POST', body: '{}' })).s === 401);

// two players dial at the same moment: exactly one wins
const [ra, rb] = await Promise.all([claim(A.token), claim(B.token)]);
const winners = [ra.b.won === true, rb.b.won === true].filter(Boolean).length;
ok('two dials at the same moment: exactly one winner', ra.s === 200 && rb.s === 200 && winners === 1, JSON.stringify([ra.b, rb.b]));
const W = ra.b.won ? A : B, L = ra.b.won ? B : A;
ok('only the winner is marked as the first', (ra.b.won ? ra.b.first : rb.b.first) === true && (ra.b.won ? rb.b.first : ra.b.first) === false);

// a later player does not win; the winner dialing again still wins (rewatch) and is not "first" again
const rc = await claim(C.token);
ok('a later dialer does not win', rc.s === 200 && rc.b.won === false, JSON.stringify(rc.b));
const rw = await claim(W.token);
ok('the winner can dial again and still wins (rewatch), not counted twice', rw.s === 200 && rw.b.won === true && rw.b.first === false, JSON.stringify(rw.b));

// everyone sees who won; only the winner sees "mine"
const sw = await status(W.token), sl = await status(L.token), sp = await status();
ok('status names the finder for everyone', sw.b.found && sl.b.found && sp.b.found && sw.b.name === sl.b.name && sl.b.name === sp.b.name && !!sw.b.at, JSON.stringify(sp.b));
ok('only the winner gets mine = true', sw.b.mine === true && sl.b.mine === false && sp.b.mine === false);
ok('the reminder is open until they text Hype', sw.b.texted === false);

// no text is put into anyone's Hype thread by the claim (the reminder is an on-screen notification from Hornilius)
const tw = await call('/api/messages/threads', {}, W.token);
ok('the claim does not put a text into the Hype thread', !(tw.b.threads || []).some((t) => /hype/i.test(t.name || '')), JSON.stringify(tw.b.threads));

// the winner texts Hype back: the reminder clears
const HYPE = '0x' + '0'.repeat(39) + '1';
const sent = await call('/api/messages/send', { method: 'POST', body: JSON.stringify({ to: HYPE, body: 'the code is 1234' }) }, W.token);
ok('the winner can text Hype back', sent.s === 200 && sent.b.ok, JSON.stringify(sent.b));
const sw2 = await status(W.token);
ok('after texting Hype the reminder is done', sw2.b.mine === true && sw2.b.texted === true, JSON.stringify(sw2.b));
