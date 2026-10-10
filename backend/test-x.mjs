// End-to-end check of Sign in with X against a MOCK X server (no real X account needed).
//   wrangler dev --config wrangler.staging.toml --local --var X_CLIENT_ID:abc --var X_CLIENT_SECRET:def --var X_AUTH_URL:http://localhost:8799/authorize --var X_API_BASE:http://localhost:8799
//   node test-x.mjs [baseUrl]
import http from 'node:http';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
const base = process.argv[2] || 'http://localhost:8787';
const origin = 'http://localhost:8765', domain = 'localhost:8765';
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };

// ---- mock X: /2/oauth2/token and /2/users/me ----
const seen = [];
const mock = http.createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c)); req.on('end', () => {
    const send = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (req.url.startsWith('/2/oauth2/token')) {
      const p = new URLSearchParams(body); seen.push({ auth: req.headers.authorization, verifier: p.get('code_verifier'), redirect: p.get('redirect_uri') });
      const m = /^good(\d+)$/.exec(p.get('code') || ''); if (!m) return send(400, { error: 'invalid_grant' });
      return send(200, { access_token: 'tok' + m[1], token_type: 'bearer' });
    }
    if (req.url.startsWith('/2/users/me')) {
      const m = /^Bearer tok(\d+)$/.exec(req.headers.authorization || ''); if (!m) return send(401, {});
      const names = { 111: 'MimuAlice', 222: 'MimuBob' };
      return send(200, { data: { id: m[1], name: 'Display ' + m[1], username: names[m[1]] || 'user' + m[1], profile_image_url: 'https://pbs.twimg.com/profile_images/1/a_normal.jpg' } });
    }
    send(404, {});
  });
}).listen(8799);

const call = async (path, opt = {}, token) => {
  const r = await fetch(base + path, { redirect: 'manual', ...opt, headers: { 'Content-Type': 'application/json', Origin: origin, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
  const text = await r.text(); let b = {}; try { b = JSON.parse(text); } catch { /* html */ }
  return { s: r.status, b, text, loc: r.headers.get('location') };
};
async function login(acct, name) {
  const n = (await call('/api/nonce')).b;
  const msg = `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${acct.address}\nNonce: ${n.nonce}\nIssued: ${n.issuedAt}`;
  return call('/api/auth', { method: 'POST', body: JSON.stringify({ address: acct.address, nonce: n.nonce, issuedAt: n.issuedAt, signature: await acct.signMessage({ message: msg }), name, picture: '' }) });
}
async function xConnect(id) {                              // what the popup does: start -> (X approves) -> callback
  const st = await call('/api/x/start?o=' + encodeURIComponent(origin));
  const u = new URL(st.loc); const state = u.searchParams.get('state');
  const cb = await call('/api/x/callback?code=good' + id + '&state=' + encodeURIComponent(state));
  const m = /postMessage\((\{.*?\}),"/.exec(cb.text);
  return { st, u, state, cb, msg: m ? JSON.parse(m[1]) : null };
}

const h = await call('/api/health');
ok('health says X login is on', h.b.xLogin === true, JSON.stringify(h.b));
ok('X start refuses a site that is not allowed', (await call('/api/x/start?o=' + encodeURIComponent('https://evil.example'))).s === 403);

const A = privateKeyToAccount(generatePrivateKey()), B = privateKeyToAccount(generatePrivateKey());
const la = await login(A, 'GlyphAlice'); const tokA = la.b.token;
ok('sign in reports X is needed', la.s === 200 && la.b.needX === true && la.b.x === '', JSON.stringify({ needX: la.b.needX, x: la.b.x }));
const early = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: 2 }) }, tokA);
ok('cannot start a run before connecting X', early.s === 403 && early.b.needX === true, String(early.s));

const x1 = await xConnect(111);
ok('start sends the player to X with PKCE', x1.st.s === 302 && x1.u.searchParams.get('code_challenge_method') === 'S256' && x1.u.searchParams.get('client_id') === 'abc' && /users\.read/.test(x1.u.searchParams.get('scope')), x1.st.loc && x1.st.loc.slice(0, 70));
ok('callback hands back a proof, handle and picture', !!(x1.msg && x1.msg.proof && x1.msg.x === 'MimuAlice' && /^https:\/\//.test(x1.msg.pic)), JSON.stringify(x1.msg).slice(0, 90));
ok('token exchange used client secret + PKCE verifier', seen.length > 0 && /^Basic /.test(seen[0].auth) && seen[0].verifier && seen[0].verifier.length >= 40 && /\/api\/x\/callback$/.test(seen[0].redirect));
ok('the message is sent only to our own site', /,"http:\/\/localhost:8765"\)/.test(x1.cb.text));

const link = await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: x1.msg.proof }) }, tokA);
ok('X account links to the wallet', link.s === 200 && link.b.x === 'MimuAlice', JSON.stringify(link.b));
const start = await call('/api/run/start', { method: 'POST', body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: 2 }) }, tokA);
ok('runs work after connecting X', start.s === 200, String(start.s));
const la2 = await login(A, 'GlyphAlice');
ok('next sign-in knows the X handle', la2.b.x === 'MimuAlice' && la2.b.needX === false);

const lb = await login(B, 'GlyphBob'); const tokB = lb.b.token;
const dup = await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: x1.msg.proof }) }, tokB);
ok('the same X account cannot be used by a second wallet', dup.s === 409, String(dup.s));
await new Promise((r) => setTimeout(r, 61000));   // the per-IP sign-in limit is 10 a minute
const x2 = await xConnect(222);
ok('a different X account links to the second wallet', (await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: x2.msg.proof }) }, tokB)).s === 200);

ok('a forged proof is rejected', (await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: x1.msg.proof.slice(0, -3) + 'abc' }) }, tokA)).s === 401);
ok('a sign-in token is not accepted as an X proof', (await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: tokA }) }, tokA)).s === 401);
ok('an X proof is not accepted as a sign-in session', (await call('/api/run/start', { method: 'POST', body: '{}' }, x1.msg.proof)).s === 401);
ok('link needs a sign-in', (await call('/api/x/link', { method: 'POST', body: JSON.stringify({ proof: x1.msg.proof }) })).s === 401);

await new Promise((r) => setTimeout(r, 61000));
const bad = await call('/api/x/callback?code=good111&state=nope.nope');
ok('a bad state gives no proof', bad.s === 200 && !/proof/.test(bad.text) && /expired/.test(bad.text));
const st3 = await call('/api/x/start?o=' + encodeURIComponent(origin)); const state3 = new URL(st3.loc).searchParams.get('state');
const denied = await call('/api/x/callback?error=access_denied&state=' + encodeURIComponent(state3));
ok('cancelling on X reports cancelled', /cancelled/.test(denied.text) && !/"proof"/.test(denied.text));
const bogus = await call('/api/x/callback?code=wrongcode&state=' + encodeURIComponent(state3));
ok('a rejected code gives an error, not a proof', !/"proof"/.test(bogus.text) && /"error"/.test(bogus.text));
mock.close();
