/* Chair Run x Mutual Mimu — leaderboard API (Cloudflare Worker + D1)
 *
 *   GET  /api/health
 *   GET  /api/nonce                      -> { nonce, issuedAt, message }
 *   POST /api/auth                       -> { token, expiresAt, gates }   (Glyph wallet signature + holdings check)
 *   POST /api/score        (Bearer)      -> { ok, rank, value }           (weekly best, per address)
 *   GET  /api/leaderboard?kind=run|nw    -> { week, resetsAt, rows, me, total }
 *
 * Wallet ownership is proven by a signed message. Holdings gates (Mimu required, TMF Pass / Dengs blocked) are
 * enforced here too, so the front-end gate is only the friendly version of the same rule.
 */
import { createPublicClient, http, verifyMessage, parseAbi, isAddress, getAddress } from 'viem';

const EPOCH = Date.UTC(2024, 0, 5, 20);          // must match the front-end weekKey()
const WEEK_MS = 604800000;
const SESSION_MS = 12 * 3600 * 1000;
const NONCE_MS = 10 * 60 * 1000;
const ERC721 = parseAbi(['function balanceOf(address owner) view returns (uint256)']);
const ERC1155 = parseAbi(['function balanceOf(address account, uint256 id) view returns (uint256)']);
const MAX_SCORE = { run: 400000, nw: 50000000 };

const weekNow = () => Math.floor((Date.now() - EPOCH) / WEEK_MS);
const resetsAt = (w) => EPOCH + (w + 1) * WEEK_MS;

/* ---------- small helpers ---------- */
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
const cleanName = (s) => String(s || '').normalize('NFKC').replace(/[^\p{L}\p{N}._\- ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24);
const cleanPic = (s) => { s = String(s || ''); return /^https:\/\/[^\s"'<>]{4,380}$/.test(s) ? s : ''; };
const shortId = (a) => a.slice(0, 6) + '…' + a.slice(-4);

function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = { 'Vary': 'Origin' };
  if (allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
const json = (env, req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(env, req) } });

/* ---------- session tokens (HMAC-signed, no storage needed) ---------- */
async function signToken(env, payload) {
  const body = b64u(enc.encode(JSON.stringify(payload)));
  return body + '.' + b64u(await hmac(env.SESSION_SECRET, body));
}
async function readToken(env, req) {
  const m = /^Bearer (.+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const [body, sig] = m[1].split('.');
  if (!body || !sig) return null;
  try {
    if (!safeEq(unb64u(sig), await hmac(env.SESSION_SECRET, body))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}

/* ---------- holdings gates ---------- */
function parseGate(v) {            // "chainId:0xAddress" or "chainId:0xAddress:tokenId"
  if (!v) return null;
  const [chain, addr, id] = String(v).split(':');
  if (!chain || !isAddress(addr || '')) return null;
  return { chainId: Number(chain), address: getAddress(addr), tokenId: id ? BigInt(id) : null };
}
async function holds(env, gate, owner) {
  const rpc = env['RPC_' + gate.chainId];
  if (!rpc) throw new Error('No RPC configured for chain ' + gate.chainId);
  const client = createPublicClient({ transport: http(rpc) });
  const n = gate.tokenId == null
    ? await client.readContract({ address: gate.address, abi: ERC721, functionName: 'balanceOf', args: [owner] })
    : await client.readContract({ address: gate.address, abi: ERC1155, functionName: 'balanceOf', args: [owner, gate.tokenId] });
  return n > 0n;
}
async function checkGates(env, owner) {
  const g = { mimu: parseGate(env.GATE_MIMU), pass: parseGate(env.GATE_PASS), dengs: parseGate(env.GATE_DENGS) };
  const out = { mimu: null, pass: null, dengs: null };            // null = rule not configured yet
  for (const k of Object.keys(g)) if (g[k]) out[k] = await holds(env, g[k], owner);
  let reason = '';
  if (out.pass === true) reason = 'pass';
  else if (out.dengs === true) reason = 'dengs';
  else if (out.mimu === false) reason = 'nomimu';
  return { ...out, allowed: reason === '', reason };
}

/* ---------- handlers ---------- */
function loginMessage(address, nonce, issuedAt) {
  return `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing and sends no transaction.\n\nAddress: ${address}\nNonce: ${nonce}\nIssued: ${issuedAt}`;
}

async function handleNonce(env, req) {
  const issuedAt = Date.now();
  const rand = b64u(crypto.getRandomValues(new Uint8Array(12)));
  const nonce = `${rand}.${b64u(await hmac(env.SESSION_SECRET, rand + '|' + issuedAt))}`;
  return json(env, req, { nonce, issuedAt });
}

async function handleAuth(env, req) {
  let b; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const { address, nonce, issuedAt, signature } = b || {};
  if (!isAddress(address || '') || !nonce || !signature || !issuedAt) return json(env, req, { error: 'bad request' }, 400);
  if (Date.now() - Number(issuedAt) > NONCE_MS || Number(issuedAt) > Date.now() + 60000) return json(env, req, { error: 'nonce expired' }, 401);
  const [rand, mac] = String(nonce).split('.');
  let nonceOk = false;
  try { nonceOk = !!rand && !!mac && safeEq(unb64u(mac), await hmac(env.SESSION_SECRET, rand + '|' + issuedAt)); } catch { nonceOk = false; }
  if (!nonceOk) return json(env, req, { error: 'bad nonce' }, 401);
  const addr = getAddress(address);
  const message = loginMessage(address, nonce, issuedAt);   // exactly the address string the client signed
  let ok = false;
  try { ok = await verifyMessage({ address: addr, message, signature }); } catch { ok = false; }
  if (!ok) {                                                     // smart-contract wallets (ERC-1271 / 6492)
    try {
      const rpc = env.RPC_33139 || env.RPC_1;
      if (rpc) ok = await createPublicClient({ transport: http(rpc) }).verifyMessage({ address: addr, message, signature });
    } catch { ok = false; }
  }
  if (!ok) return json(env, req, { error: 'bad signature' }, 401);

  let gates;
  try { gates = await checkGates(env, addr); } catch (e) { return json(env, req, { error: 'holdings check failed' }, 502); }
  const name = cleanName(b.name) || shortId(addr), picture = cleanPic(b.picture);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO players(address,name,picture,updated_at) VALUES(?1,?2,?3,?4) ON CONFLICT(address) DO UPDATE SET name=?2,picture=?3,updated_at=?4')
    .bind(addr.toLowerCase(), name, picture, now).run();
  if (!gates.allowed) return json(env, req, { error: 'not allowed', gates }, 403);
  const exp = now + SESSION_MS;
  return json(env, req, { token: await signToken(env, { sub: addr.toLowerCase(), exp }), expiresAt: exp, gates });
}

async function rankOf(env, week, col, value) {
  const r = await env.DB.prepare(`SELECT COUNT(*)+1 AS r FROM scores WHERE week=?1 AND ${col}>?2`).bind(week, value).first();
  return r.r;
}

async function handleScore(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  let b; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const kind = b.kind === 'nw' ? 'nw' : b.kind === 'run' ? 'run' : null;
  const value = Math.floor(Number(b.value));
  if (!kind || !Number.isFinite(value) || value < 0 || value > MAX_SCORE[kind]) return json(env, req, { error: 'bad score' }, 400);
  if (kind === 'run') {                                          // plausibility: score can't outrun the distance covered
    const dist = Math.floor(Number(b.dist) || 0);
    if (value > 60 * dist + 800) return json(env, req, { error: 'implausible run' }, 422);
  }
  const col = kind === 'run' ? 'run_best' : 'nw_best', week = weekNow(), now = Date.now();
  const last = await env.DB.prepare('SELECT updated_at FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();
  if (last && now - last.updated_at < 2500) return json(env, req, { error: 'slow down' }, 429);
  await env.DB.prepare(`INSERT INTO scores(address,week,${col},updated_at) VALUES(?1,?2,?3,?4)
      ON CONFLICT(address,week) DO UPDATE SET ${col}=MAX(${col},?3), updated_at=?4`).bind(sess.sub, week, value, now).run();
  const mine = await env.DB.prepare(`SELECT ${col} AS v FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first();
  return json(env, req, { ok: true, value: mine.v, rank: await rankOf(env, week, col, mine.v) });
}

async function handleBoard(env, req, url) {
  const kind = url.searchParams.get('kind') === 'nw' ? 'nw' : 'run';
  const col = kind === 'run' ? 'run_best' : 'nw_best';
  const limit = Math.max(5, Math.min(100, Number(url.searchParams.get('limit')) || 50));
  const week = weekNow();
  const rows = (await env.DB.prepare(`SELECT s.address a, s.${col} v, p.name n, p.picture pic FROM scores s JOIN players p ON p.address=s.address
      WHERE s.week=?1 AND s.${col}>0 ORDER BY s.${col} DESC, s.updated_at ASC LIMIT ?2`).bind(week, limit).all()).results || [];
  const total = (await env.DB.prepare(`SELECT COUNT(*) c FROM scores WHERE week=?1 AND ${col}>0`).bind(week).first()).c;
  const sess = await readToken(env, req);
  let me = null;
  if (sess) {
    const m = await env.DB.prepare(`SELECT ${col} v FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first();
    if (m && m.v > 0) me = { rank: await rankOf(env, week, col, m.v), v: m.v, id: sess.sub };
  }
  return json(env, req, {
    week, resetsAt: resetsAt(week), total, me,
    rows: rows.map((r, i) => ({ rank: i + 1, id: r.a, name: r.n, picture: r.pic || '', v: r.v, short: shortId(r.a) })),
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(env, req) });
    try {
      if (url.pathname === '/api/health') return json(env, req, { ok: true, week: weekNow(), gates: { mimu: !!env.GATE_MIMU, pass: !!env.GATE_PASS, dengs: !!env.GATE_DENGS } });
      if (!env.SESSION_SECRET) return json(env, req, { error: 'server not configured' }, 500);
      if (url.pathname === '/api/nonce' && req.method === 'GET') return handleNonce(env, req);
      if (url.pathname === '/api/auth' && req.method === 'POST') return handleAuth(env, req);
      if (url.pathname === '/api/score' && req.method === 'POST') return handleScore(env, req);
      if (url.pathname === '/api/leaderboard' && req.method === 'GET') return handleBoard(env, req, url);
      return json(env, req, { error: 'not found' }, 404);
    } catch (e) {
      return json(env, req, { error: 'server error' }, 500);
    }
  },
};

export { loginMessage };
