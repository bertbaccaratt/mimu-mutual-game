/* Chair Run x Mutual Mimu — leaderboard API (Cloudflare Worker + D1)
 *
 *   GET  /api/health
 *   GET  /api/nonce                      -> { nonce, issuedAt }
 *   POST /api/auth                       -> { token, expiresAt, gates }   Glyph wallet signature + holdings check
 *   POST /api/run/start    (Bearer)      -> { runId, seed, wallet }       a run starts from a seed the SERVER picks
 *   POST /api/run/chunk    (Bearer)      -> { ok } | { ok, final, score, coins, dist, rank }
 *   GET  /api/leaderboard?kind=run|nw    -> { week, resetsAt, rows, me, total }
 *
 * Scores are never accepted from the browser. A run is submitted as its recorded inputs, and this server replays the
 * very same game code (assets/sim.js) from the server's seed to work out the real score. Wallet ownership is proven
 * by a signed message, and the holdings rules (Mimu required, TMF Pass / Dengs blocked) are enforced here too.
 */
import { createPublicClient, http, fallback, verifyMessage, parseAbi, isAddress, getAddress } from 'viem';
import Sim from '../../assets/sim.js';
import { newStats, observe, judge } from './behavior.js';

const EPOCH = Date.UTC(2024, 0, 5, 20);          // must match the front-end weekKey()
const WEEK_MS = 604800000;
const SESSION_MS = 12 * 3600 * 1000;
const NONCE_MS = 10 * 60 * 1000;
const CHUNK_TICKS = 2000;                        // replay work per request (keeps each request light)
const MAX_TICKS = 60 * 60 * 40;                  // 40 minutes of play per run
const MAX_INPUTS = 4000;
const TIME_SLACK_MS = 6000;
const ERC721 = parseAbi(['function balanceOf(address owner) view returns (uint256)']);
const ERC1155 = parseAbi(['function balanceOf(address account, uint256 id) view returns (uint256)']);

const weekNow = () => Math.floor((Date.now() - EPOCH) / WEEK_MS);
const resetsAt = (w) => EPOCH + (w + 1) * WEEK_MS;

/* Run the game once when the Worker starts so its code is already compiled before the first real request. */
try {
  const s = Sim.create(7, { wallet: 100 });
  while (s.S.tick < 2600 && !s.S.dead) { if (s.S.wait) { s.revive(); continue; } if (s.S.tick % 23 === 0) s.act(s.S.tick % 46 === 0 ? 'U' : 'D'); s.step(); s.drain(); }
  s.restore(s.snapshot());
} catch (e) { /* warm-up is best effort */ }

/* ---------- small helpers ---------- */
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
const safeEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
const cleanName = (s) => String(s || '').normalize('NFKC').replace(/[^\p{L}\p{N}._\- ]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24);
const cleanPic = (s) => { s = String(s || ''); return /^https:\/\/[^\s"'<>]{4,380}$/.test(s) ? s : ''; };
const shortId = (a) => a.slice(0, 6) + '…' + a.slice(-4);
const isInt = (n) => Number.isInteger(n);

function allowedOrigins(env) { return (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean); }
function cors(env, req) {
  const origin = req.headers.get('Origin') || '';
  const h = { 'Vary': 'Origin' };
  if (allowedOrigins(env).includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
const json = (env, req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(env, req) } });

/* ---------- rate limits (Cloudflare Workers Rate Limiting bindings; open if a binding isn't configured) ---------- */
const clientIp = (req) => req.headers.get('CF-Connecting-IP') || 'unknown';
async function limited(env, name, key) {
  const b = env[name];
  if (!b) return false;
  try { const r = await b.limit({ key }); return !r.success; } catch { return false; }
}
const tooMany = (env, req) => json(env, req, { error: 'too many requests, slow down' }, 429);

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
async function holdsOnChain(env, gate, owner) {
  const rpc = env['RPC_' + gate.chainId];
  if (!rpc) throw new Error('No RPC configured for chain ' + gate.chainId);
  const urls = [env['RPC_PRIMARY_' + gate.chainId], ...String(rpc).split(',')].map((s) => (s || '').trim()).filter(Boolean);   // optional keyed primary (a secret) first, free servers as backup   // several URLs = automatic fallback
  const client = createPublicClient({ transport: urls.length > 1 ? fallback(urls.map((u) => http(u, { retryCount: 1 }))) : http(urls[0], { retryCount: 2 }) });
  const n = gate.tokenId == null
    ? await client.readContract({ address: gate.address, abi: ERC721, functionName: 'balanceOf', args: [owner] })
    : await client.readContract({ address: gate.address, abi: ERC1155, functionName: 'balanceOf', args: [owner, gate.tokenId] });
  return n > 0n;
}
/* last resort when every RPC server is busy: the chain's block explorer (Blockscout, no key needed) */
async function holdsViaExplorer(env, gate, owner) {
  const ex = env['EXPLORER_' + gate.chainId];
  if (!ex || gate.tokenId != null) throw new Error('no explorer fallback');
  const r = await fetch(`${String(ex).replace(/\/$/, '')}/api?module=account&action=tokenbalance&contractaddress=${gate.address}&address=${owner}`, { headers: { Accept: 'application/json' } });
  const j = await r.json();
  if (!j || j.status !== '1') throw new Error('explorer said no');
  return BigInt(j.result) > 0n;
}
const HOLD_TTL = 10 * 60 * 1000;
async function holds(env, gate, owner, key) {
  const addr = owner.toLowerCase(), now = Date.now();
  const row = await env.DB.prepare('SELECT held, expires FROM holdings WHERE address=?1 AND gate=?2').bind(addr, key).first();
  if (row && row.expires > now) return !!row.held;                  // answered recently: no need to ask the chain again
  let v;
  try { v = await holdsOnChain(env, gate, owner); }
  catch (e1) {
    try { v = await holdsViaExplorer(env, gate, owner); }
    catch (e2) { if (row) return !!row.held; throw e1; }            // an old answer beats failing the sign-in
  }
  await env.DB.prepare('INSERT INTO holdings(address,gate,held,expires) VALUES(?1,?2,?3,?4) ON CONFLICT(address,gate) DO UPDATE SET held=?3, expires=?4').bind(addr, key, v ? 1 : 0, now + HOLD_TTL).run();
  return v;
}
async function checkGates(env, owner) {
  const g = { mimu: parseGate(env.GATE_MIMU), pass: parseGate(env.GATE_PASS), dengs: parseGate(env.GATE_DENGS) };
  const out = { mimu: null, pass: null, dengs: null };            // null = rule not configured yet
  for (const k of Object.keys(g)) if (g[k]) out[k] = await holds(env, g[k], owner, k);
  let reason = '';
  if (out.pass === true) reason = 'pass';
  else if (out.dengs === true) reason = 'dengs';
  else if (out.mimu === false) reason = 'nomimu';
  return { ...out, allowed: reason === '', reason };
}

/* ---------- sign-in ---------- */
/* The text the wallet signs. It is plain English, names this site, and cannot be mistaken for a transaction. */
function loginMessage(domain, address, nonce, issuedAt) {
  return `Sign in to Chair Run × Mutual Mimu\nThis only proves you own this wallet. It costs nothing, sends no transaction and cannot move your assets.\n\nDomain: ${domain}\nAddress: ${address}\nNonce: ${nonce}\nIssued: ${issuedAt}`;
}

async function handleNonce(env, req) {
  const issuedAt = Date.now();
  const rand = b64u(crypto.getRandomValues(new Uint8Array(12)));
  const nonce = `${rand}.${b64u(await hmac(env.SESSION_SECRET, rand + '|' + issuedAt))}`;
  return json(env, req, { nonce, issuedAt });
}

async function handleAuth(env, req) {
  const origin = req.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) return json(env, req, { error: 'this site is not allowed to sign in' }, 403);
  const domain = new URL(origin).host;                             // the signed message is bound to the site that asked
  let b; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const { address, nonce, issuedAt, signature } = b || {};
  if (!isAddress(address || '') || !nonce || !signature || !issuedAt) return json(env, req, { error: 'bad request' }, 400);
  if (Date.now() - Number(issuedAt) > NONCE_MS || Number(issuedAt) > Date.now() + 60000) return json(env, req, { error: 'nonce expired' }, 401);
  const [rand, mac] = String(nonce).split('.');
  let nonceOk = false;
  try { nonceOk = !!rand && !!mac && safeEq(unb64u(mac), await hmac(env.SESSION_SECRET, rand + '|' + issuedAt)); } catch { nonceOk = false; }
  if (!nonceOk) return json(env, req, { error: 'bad nonce' }, 401);
  const addr = getAddress(address);
  const message = loginMessage(domain, address, nonce, issuedAt);   // exactly the address string the client signed
  let ok = false;
  try { ok = await verifyMessage({ address: addr, message, signature }); } catch { ok = false; }
  if (!ok) {                                                       // smart-contract wallets (ERC-1271 / 6492)
    try {
      const rpc = String(env.RPC_33139 || env.RPC_1 || '').split(',')[0];
      if (rpc) ok = await createPublicClient({ transport: http(rpc) }).verifyMessage({ address: addr, message, signature });
    } catch { ok = false; }
  }
  if (!ok) return json(env, req, { error: 'bad signature' }, 401);

  if (await isBanned(env, addr.toLowerCase())) return json(env, req, { error: 'blocked' }, 403);
  let gates;
  try { gates = await checkGates(env, addr); } catch (e) { console.error('holdings check failed', String(e && e.message || e)); return json(env, req, { error: 'holdings check failed' }, 502); }
  if (!gates.allowed) return json(env, req, { error: 'not allowed', gates }, 403);   // blocked wallets are never stored
  const name = cleanName(b.name) || shortId(addr), picture = cleanPic(b.picture);
  const now = Date.now();
  await env.DB.prepare('INSERT INTO players(address,name,picture,updated_at) VALUES(?1,?2,?3,?4) ON CONFLICT(address) DO UPDATE SET name=?2,picture=?3,updated_at=?4')
    .bind(addr.toLowerCase(), name, picture, now).run();
  const exp = now + SESSION_MS;
  return json(env, req, { token: await signToken(env, { sub: addr.toLowerCase(), exp }), expiresAt: exp, gates });
}

/* ---------- verified runs ---------- */
async function rankOf(env, week, col, value) {
  const r = await env.DB.prepare(`SELECT COUNT(*)+1 AS r FROM scores WHERE week=?1 AND ${col}>?2`).bind(week, value).first();
  return r.r;
}

async function isBanned(env, addr) { return !!(await env.DB.prepare('SELECT 1 AS x FROM bans WHERE address=?1').bind(addr).first()); }

/* Cloudflare Turnstile: proves a real browser is starting the run (blocks plain scripts that talk to the API directly) */
async function humanOk(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;                          // not configured: skip
  if (typeof token !== 'string' || !token || token.length > 2100) return false;
  const f = new FormData(); f.append('secret', env.TURNSTILE_SECRET); f.append('response', token);
  if (ip && ip !== 'unknown') f.append('remoteip', ip);
  try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f }); const j = await r.json(); return !!j.success; }
  catch { return false; }
}

async function applyScore(env, address, week, score, coins, now) {
  await env.DB.prepare(`INSERT INTO scores(address,week,run_best,coins_total,runs,updated_at) VALUES(?1,?2,?3,?4,1,?5)
      ON CONFLICT(address,week) DO UPDATE SET run_best=MAX(run_best,?3), coins_total=coins_total+?4, runs=runs+1, updated_at=?5`).bind(address, week, score, coins, now).run();
}

async function handleRunStart(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  if (await isBanned(env, sess.sub)) return json(env, req, { error: 'blocked' }, 403);
  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);
  const wallet = Math.max(0, Math.min(10000000, Math.floor(Number(b.wallet) || 0)));
  const now = Date.now();
  await env.DB.prepare('DELETE FROM runs WHERE started_at<?1 AND status NOT IN (\'held\')').bind(now - 24 * 3600 * 1000).run();
  await env.DB.prepare("UPDATE runs SET status='abandoned', snapshot=NULL WHERE address=?1 AND status='open'").bind(sess.sub).run();   // one live run per player
  const id = hex(16), seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
  await env.DB.prepare("INSERT INTO runs(id,address,seed,wallet,started_at,last_tick,seq,snapshot,status) VALUES(?1,?2,?3,?4,?5,0,0,NULL,'open')")
    .bind(id, sess.sub, seed, wallet, now).run();
  return json(env, req, { runId: id, seed, wallet });
}

async function handleRunChunk(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  let b; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const { runId, seq, to, inputs, final } = b || {};
  if (typeof runId !== 'string' || !/^[0-9a-f]{32}$/.test(runId) || !isInt(seq) || !isInt(to) || !Array.isArray(inputs)) return json(env, req, { error: 'bad request' }, 400);
  if (inputs.length > MAX_INPUTS) return json(env, req, { error: 'too many inputs' }, 400);
  const run = await env.DB.prepare('SELECT * FROM runs WHERE id=?1').bind(runId).first();
  if (!run || run.address !== sess.sub) return json(env, req, { error: 'unknown run' }, 404);
  if (run.status !== 'open') return json(env, req, { error: 'run is closed' }, 409);
  if (seq !== run.seq) return json(env, req, { error: 'out of order' }, 409);
  const from = run.last_tick;
  if (to < from || to - from > CHUNK_TICKS || to > MAX_TICKS) return json(env, req, { error: 'bad tick range' }, 400);
  const now = Date.now();
  if ((to / 60) * 1000 > now - run.started_at + TIME_SLACK_MS) return json(env, req, { error: 'run is faster than real time' }, 422);   // can't play faster than the clock

  const list = [];
  let prev = from;
  for (const it of inputs) {
    if (!Array.isArray(it) || it.length !== 2 || !isInt(it[0]) || !isInt(it[1]) || it[1] < 0 || it[1] > 5 || it[0] < prev || it[0] > to || (it[0] === to && !final)) return json(env, req, { error: 'bad input list' }, 400);   // an input on the boundary tick belongs to the next chunk
    prev = it[0]; list.push(it);
  }

  const sim = Sim.create(run.seed, { wallet: run.wallet });
  if (run.snapshot) sim.restore(run.snapshot);
  const S = sim.S;
  const stats = run.stats ? JSON.parse(run.stats) : newStats();
  const feed = () => { observe(stats, S, S.tick, list[i][1]); Sim.applyCode(sim, list[i][1]); i++; };
  let i = 0;
  while (S.tick < to && !S.dead) {
    while (i < list.length && list[i][0] === S.tick) feed();
    if (S.wait || S.dead) break;
    sim.step(); sim.drain();
  }
  if (final) while (i < list.length && list[i][0] === S.tick) feed();
  if (i < list.length) return json(env, req, { error: 'inputs do not match the run' }, 422);
  if (S.tick !== to && !(S.dead && S.tick <= to)) return json(env, req, { error: 'run did not reach that tick' }, 422);

  if (!final) {
    await env.DB.prepare('UPDATE runs SET last_tick=?1, seq=?2, snapshot=?3, stats=?4 WHERE id=?5').bind(S.tick, run.seq + 1, sim.snapshot(), JSON.stringify(stats), runId).run();
    return json(env, req, { ok: true, tick: S.tick });
  }

  /* final: the replay's score is the score, unless the way it was played looks like a bot */
  const score = Math.max(0, Math.floor(S.score)), coins = Math.max(0, Math.floor(S.coins)), dist = Math.floor(S.dist), week = weekNow();
  const flags = judge(stats, S, S.tick, Number(env.BOT_MIN) || 40);
  if (flags.length) {
    await env.DB.prepare("UPDATE runs SET status='held', snapshot=NULL, stats=?1, flags=?2, score=?3, coins=?4, dist=?5, last_tick=?6, seq=?7, ended_at=?8 WHERE id=?9")
      .bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, S.tick, run.seq + 1, now, runId).run();
    return json(env, req, { ok: true, final: true, held: true, score, coins, dist });
  }
  await env.DB.prepare("UPDATE runs SET status='done', snapshot=NULL, stats=NULL, score=?1, coins=?2, dist=?3, last_tick=?4, seq=?5, ended_at=?6 WHERE id=?7")
    .bind(score, coins, dist, S.tick, run.seq + 1, now, runId).run();
  if (S.tick >= 120 && score > 0) await applyScore(env, sess.sub, week, score, coins, now);
  const mine = await env.DB.prepare('SELECT run_best FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();
  return json(env, req, { ok: true, final: true, score, coins, dist, rank: mine ? await rankOf(env, week, 'run_best', mine.run_best) : null, best: mine ? mine.run_best : 0 });
}

/* ---------- admin: review runs that were held, block wallets (needs the ADMIN_TOKEN secret; not callable from browsers) ---------- */
async function handleAdmin(env, req, url) {
  const tok = req.headers.get('X-Admin-Token') || '';
  if (!env.ADMIN_TOKEN || !safeEq(enc.encode(tok), enc.encode(env.ADMIN_TOKEN))) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  const out = (o, st = 200) => new Response(JSON.stringify(o, null, 2), { status: st, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  const path = url.pathname.replace('/api/admin/', '');
  let b = {}; if (req.method === 'POST') { try { b = await req.json(); } catch { return out({ error: 'bad json' }, 400); } }
  if (path === 'held' && req.method === 'GET') {
    const rows = (await env.DB.prepare("SELECT r.id, r.address, p.name, r.score, r.coins, r.dist, r.last_tick ticks, r.flags, r.ended_at FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='held' ORDER BY r.ended_at DESC LIMIT 100").all()).results || [];
    return out({ count: rows.length, runs: rows.map((r) => ({ ...r, flags: JSON.parse(r.flags || '[]'), seconds: Math.round(r.ticks / 60), ended: new Date(r.ended_at).toISOString() })) });
  }
  if (path === 'release' && req.method === 'POST') {
    const run = await env.DB.prepare("SELECT * FROM runs WHERE id=?1 AND status='held'").bind(String(b.runId || '')).first();
    if (!run) return out({ error: 'no such held run' }, 404);
    if (await isBanned(env, run.address)) return out({ error: 'that wallet is banned' }, 409);
    await applyScore(env, run.address, weekNow(), run.score, run.coins, Date.now());
    await env.DB.prepare("UPDATE runs SET status='released' WHERE id=?1").bind(run.id).run();
    return out({ ok: true, released: run.id, score: run.score });
  }
  if (path === 'reject' && req.method === 'POST') {
    const r = await env.DB.prepare("UPDATE runs SET status='rejected' WHERE id=?1 AND status='held'").bind(String(b.runId || '')).run();
    return out({ ok: true, changed: r.meta && r.meta.changes });
  }
  if (path === 'ban' && req.method === 'POST') {
    if (!isAddress(b.address || '')) return out({ error: 'bad address' }, 400);
    const a = String(b.address).toLowerCase();
    await env.DB.prepare('INSERT INTO bans(address,reason,at) VALUES(?1,?2,?3) ON CONFLICT(address) DO UPDATE SET reason=?2, at=?3').bind(a, String(b.reason || '').slice(0, 200), Date.now()).run();
    await env.DB.prepare('DELETE FROM scores WHERE address=?1').bind(a).run();
    await env.DB.prepare("UPDATE runs SET status='abandoned', snapshot=NULL WHERE address=?1 AND status='open'").bind(a).run();
    return out({ ok: true, banned: a });
  }
  if (path === 'unban' && req.method === 'POST') {
    await env.DB.prepare('DELETE FROM bans WHERE address=?1').bind(String(b.address || '').toLowerCase()).run();
    return out({ ok: true });
  }
  return out({ error: 'unknown admin call' }, 404);
}

async function handleBoard(env, req, url) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const kind = url.searchParams.get('kind') === 'nw' ? 'nw' : 'run';
  const col = kind === 'run' ? 'run_best' : 'coins_total';
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
      if (url.pathname === '/api/nonce' && req.method === 'GET') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleNonce(env, req); }
      if (url.pathname === '/api/auth' && req.method === 'POST') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAuth(env, req); }
      if (url.pathname === '/api/run/start' && req.method === 'POST') return handleRunStart(env, req);
      if (url.pathname === '/api/run/chunk' && req.method === 'POST') return handleRunChunk(env, req);
      if (url.pathname === '/api/leaderboard' && req.method === 'GET') return handleBoard(env, req, url);
      if (url.pathname.startsWith('/api/admin/')) { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAdmin(env, req, url); }
      return json(env, req, { error: 'not found' }, 404);
    } catch (e) {
      console.error('server error', String(e && e.stack || e));
      return json(env, req, { error: 'server error' }, 500);
    }
  },
};

export { loginMessage };
