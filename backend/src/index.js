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
const MAX_TICKS = 60 * 60 * 240;                 // 4 hours of play per run (each request still replays at most CHUNK_TICKS, so the cost per request does not grow)
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
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Admin-Token';
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}
const json = (env, req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', ...cors(env, req) } });

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
    return p.sub && p.exp > Date.now() ? p : null;          // sign-in sessions only (X proofs and OAuth state carry no "sub")
  } catch { return null; }
}
async function readSigned(env, token, kind) {                   // verify one of our other signed blobs (X proof, OAuth state)
  try {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig || !safeEq(unb64u(sig), await hmac(env.SESSION_SECRET, body))) return null;
    const p = JSON.parse(new TextDecoder().decode(unb64u(body)));
    return p.k === kind && p.exp > Date.now() ? p : null;
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
  await env.DB.prepare('INSERT INTO holdings(address,gate,held,expires) VALUES(?1,?2,?3,?4) ON CONFLICT(address,gate) DO UPDATE SET held=?3, expires=?4').bind(addr, key, v ? 1 : 0, now + (v || key !== 'mimu' ? HOLD_TTL : 60000)).run();      // a 'no Mimu' answer is only remembered for a minute, so a fresh buyer gets in fast
  return v;
}
async function checkGates(env, owner) {
  const g = { mimu: parseGate(env.GATE_MIMU), pass: parseGate(env.GATE_PASS), dengs: parseGate(env.GATE_DENGS) };
  const out = { mimu: null, pass: null, dengs: null };            // null = rule not configured yet
  for (const k of ['mimu', 'pass', 'dengs']) {
    if (!g[k]) continue;
    try { out[k] = await holds(env, g[k], owner, k); }
    catch (e) {
      if (k === 'mimu') throw e;                                      // cannot tell whether they hold a Mimu: ask them to retry
      console.error('side check unavailable', k, String(e && e.message || e));
      out[k] = false;                                                 // a blocker rule we cannot read right now never locks a holder out
    }
  }
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
  const glyphName = cleanName(b.name) || shortId(addr), picture = cleanPic(b.picture);
  const now = Date.now();
  const mine = await env.DB.prepare('SELECT x_handle FROM players WHERE address=?1').bind(addr.toLowerCase()).first();
  const name = mine && mine.x_handle ? '@' + mine.x_handle : glyphName;      // once X is connected, the X @handle is the player's name everywhere
  await env.DB.prepare('INSERT INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(address) DO UPDATE SET name=?2,picture=?3,glyph_name=?4,updated_at=?5')
    .bind(addr.toLowerCase(), name, picture, glyphName, now).run();
  const exp = now + SESSION_MS;
  return json(env, req, { token: await signToken(env, { sub: addr.toLowerCase(), exp }), expiresAt: exp, gates, x: (mine && mine.x_handle) || '', needX: xNeeded(env) && !(mine && mine.x_handle) });
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

/* A run whose tab closed or whose last piece never arrived: score it as far as the server verified it (never lose earned progress). */
async function salvageOpenRuns(env, address, now) {
  try {
    const rows = (await env.DB.prepare("SELECT * FROM runs WHERE address=?1 AND status='open' AND snapshot IS NOT NULL AND last_tick>=120").bind(address).all()).results || [];
    for (const run of rows) {
      const sim = Sim.create(run.seed, { wallet: run.wallet }); sim.restore(run.snapshot);
      const S = sim.S, stats = run.stats ? JSON.parse(run.stats) : newStats();
      const score = Math.max(0, Math.floor(S.score)), coins = Math.max(0, Math.floor(S.coins)), dist = Math.floor(S.dist);
      const flags = judge(stats, S, S.tick, Number(env.BOT_MIN) || 40);
      if (flags.length) { await env.DB.prepare("UPDATE runs SET status='held', snapshot=NULL, stats=?1, flags=?2, score=?3, coins=?4, dist=?5, ended_at=?6 WHERE id=?7").bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, now, run.id).run(); continue; }
      await env.DB.prepare("UPDATE runs SET status='done', snapshot=NULL, stats=NULL, score=?1, coins=?2, dist=?3, ended_at=?4 WHERE id=?5").bind(score, coins, dist, now, run.id).run();
      if (score > 0) await applyScore(env, address, weekNow(), score, coins, now);
    }
  } catch (e) { console.error('salvage failed', String(e && e.message || e)); }
}

async function handleRunStart(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  if (await isBanned(env, sess.sub)) return json(env, req, { error: 'blocked' }, 403);
  if (xNeeded(env)) {                                              // every player needs an X handle on file (verified via X login when that is set up, typed otherwise)
    const me = await env.DB.prepare('SELECT x_handle FROM players WHERE address=?1').bind(sess.sub).first();
    if (!me || !me.x_handle) return json(env, req, { error: 'add your X handle first', needX: true }, 403);
  }
  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);
  const wallet = Math.max(0, Math.min(10000000, Math.floor(Number(b.wallet) || 0)));
  const now = Date.now();
  await env.DB.prepare('DELETE FROM runs WHERE started_at<?1 AND status NOT IN (\'held\')').bind(now - 24 * 3600 * 1000).run();
  await salvageOpenRuns(env, sess.sub, now);                       // an interrupted run keeps the progress the server already verified
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
  const mine = await env.DB.prepare(`SELECT ${SCORE} AS sc FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first();
  return json(env, req, { ok: true, final: true, score, coins, dist, rank: mine ? await rankOf(env, week, SCORE, mine.sc) : null, best: mine ? mine.sc : 0 });
}

/* ---------- visitor counter (anonymous browser id + the approximate place Cloudflare reports for the connection) ---------- */
async function handleHit(env, req) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { /* no body */ }
  const vid = typeof b.vid === 'string' && /^[0-9a-f]{32}$/.test(b.vid) ? b.vid : null;
  if (!vid) return json(env, req, { error: 'bad request' }, 400);
  const now = Date.now();
  const row = await env.DB.prepare('SELECT last_seen FROM visitors WHERE id=?1').bind(vid).first();
  if (row && now - row.last_seen < 30 * 60 * 1000) return json(env, req, { ok: true });          // same visit
  await env.DB.prepare('INSERT INTO visitors(id,first_seen,last_seen,visits) VALUES(?1,?2,?2,1) ON CONFLICT(id) DO UPDATE SET last_seen=?2, visits=visits+1').bind(vid, now).run();
  return json(env, req, { ok: true });
}

/* ---------- profile pictures: the browser shrinks the photo to a small JPEG; we re-check the bytes and serve it ourselves ---------- */
const apiOrigin = (req) => { const o = new URL(req.url).origin; return /^https:\/\/[a-z0-9.\-]+$/i.test(o) ? o : ''; };
const picSql = (req) => `(CASE WHEN p.avatar IS NOT NULL THEN '${apiOrigin(req)}/api/avatar/'||p.address||'?v='||length(p.avatar) ELSE p.picture END)`;
function sniffImage(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;
}
async function handleAvatarPost(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_AUTH', sess.sub)) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image || ''));
  if (!m || m[1].length > 90000) return json(env, req, { error: 'That picture is too big. Try a smaller one.' }, 400);
  let bytes; try { bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)); } catch { return json(env, req, { error: 'bad image' }, 400); }
  const type = sniffImage(bytes);
  if (!type) return json(env, req, { error: 'That file is not a JPG, PNG or WebP picture.' }, 400);
  const stored = type + '|' + m[1];
  await env.DB.prepare('UPDATE players SET avatar=?1 WHERE address=?2').bind(stored, sess.sub).run();
  return json(env, req, { ok: true, url: `${apiOrigin(req)}/api/avatar/${sess.sub}?v=${stored.length}` });
}
async function handleAvatarGet(env, req, url) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const a = url.pathname.split('/').pop().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(a)) return new Response('not found', { status: 404 });
  const row = await env.DB.prepare('SELECT avatar FROM players WHERE address=?1').bind(a).first();
  if (!row || !row.avatar) return new Response('not found', { status: 404 });
  const [type, b64] = String(row.avatar).split('|');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return new Response('not found', { status: 404 });
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new Response(bytes, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'cross-origin' } });
}

/* ---------- live runs: the game pings every few seconds while a run is in progress (display only, never counts for score) ---------- */
async function handleRunBeat(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  if (typeof b.runId !== 'string' || !/^[0-9a-f]{32}$/.test(b.runId)) return json(env, req, { error: 'bad request' }, 400);
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  await env.DB.prepare("UPDATE runs SET last_beat=?1, live_score=?2, live_dist=?3, live_coins=?4 WHERE id=?5 AND address=?6 AND status='open'")
    .bind(Date.now(), n(b.score, 99999999), n(b.dist, 9999999), n(b.coins, 9999999), b.runId, sess.sub).run();
  return json(env, req, { ok: true });
}

/* ---------- Mimu Mail: emails only the admin can send, delivered to every phone signed in with Glyph ---------- */
const MAIL_IMG_MAX = 1000000;                                           // characters of base64 (about 750 KB)
const mailImgUrl = (req, key) => `${apiOrigin(req)}/api/mail/img/${key}`;
async function handleMailList(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const rows = (await env.DB.prepare('SELECT b.id, b.ts, b.subject, substr(b.body,1,160) pv, (b.ikey IS NOT NULL) img, EXISTS(SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id) rd FROM broadcasts b ORDER BY b.id DESC LIMIT 200').bind(a.me).all()).results || [];
  const un = await env.DB.prepare('SELECT COUNT(*) c FROM broadcasts b WHERE NOT EXISTS (SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id)').bind(a.me).first();
  return json(env, req, { unread: un.c, mails: rows.map((r) => ({ id: r.id, ts: r.ts, subject: r.subject, preview: r.pv, image: !!r.img, read: !!r.rd })) });
}
async function handleMailItem(env, req, url) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const id = Number(url.searchParams.get('id')) || 0;
  const m = await env.DB.prepare('SELECT id, ts, subject, body, ikey FROM broadcasts WHERE id=?1').bind(id).first();
  if (!m) return json(env, req, { error: 'not found' }, 404);
  await env.DB.prepare('INSERT OR IGNORE INTO mail_reads(address,id) VALUES(?1,?2)').bind(a.me, id).run();
  return json(env, req, { id: m.id, ts: m.ts, subject: m.subject, body: m.body, image: m.ikey ? mailImgUrl(req, m.ikey) : null });
}
async function handleMailImg(env, req, url) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const key = url.pathname.split('/').pop();
  if (!/^[0-9a-f]{24}$/.test(key)) return new Response('not found', { status: 404 });
  const row = await env.DB.prepare('SELECT img FROM broadcasts WHERE ikey=?1').bind(key).first();
  if (!row || !row.img) return new Response('not found', { status: 404 });
  const [type, b64] = String(row.img).split('|');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return new Response('not found', { status: 404 });
  return new Response(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'cross-origin' } });
}

/* ---------- player-to-player texts (the Messages app) ----------
 * Signed-in players can text anyone on the leaderboard. Messages live here, keyed by wallet, so both sides see the same
 * thread on any device. Plain text only, 280 characters, rate limited, and a player can block someone. Admin can read and delete. */
const MSG_MAX = 280;
const HYPE = '0x' + '0'.repeat(39) + '1';                 // the "Hype" account: nobody holds a key for it, only the admin page can text as Hype
async function msgAuth(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return { err: json(env, req, { error: 'sign in first' }, 401) };
  if (await limited(env, 'RL_RUN', 'msg:' + sess.sub)) return { err: tooMany(env, req) };
  return { me: sess.sub };
}
async function handleMsgThreads(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const me = a.me;
  const rows = (await env.DB.prepare(`SELECT other, MAX(id) lastid, SUM(CASE WHEN recipient=?1 AND read=0 THEN 1 ELSE 0 END) unread FROM (
      SELECT id, recipient, read, CASE WHEN sender=?1 THEN recipient ELSE sender END AS other FROM messages
      WHERE (sender=?1 OR recipient=?1) AND NOT (recipient=?1 AND sender IN (SELECT blocked FROM blocks WHERE blocker=?1))
    ) GROUP BY other ORDER BY lastid DESC LIMIT 200`).bind(me).all()).results || [];
  let threads = [];
  if (rows.length) {
    const ids = rows.map((r) => r.lastid);
    const info = (await env.DB.prepare(`SELECT m.id, m.body, m.ts, m.sender, p.address a, p.name n, ${picSql(req)} pic FROM messages m JOIN players p ON p.address=(CASE WHEN m.sender=?1 THEN m.recipient ELSE m.sender END) WHERE m.id IN (${ids.map((_, i) => '?' + (i + 2)).join(',')})`).bind(me, ...ids).all()).results || [];
    const byId = Object.fromEntries(info.map((r) => [r.id, r]));
    threads = rows.map((r) => { const i = byId[r.lastid]; return i ? { with: r.other, name: i.n, picture: i.pic || '', last: i.body, ts: i.ts, mine: i.sender === me, unread: r.unread || 0 } : null; }).filter(Boolean);
  }
  const mu = await env.DB.prepare('SELECT COUNT(*) c FROM broadcasts b WHERE NOT EXISTS (SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id)').bind(me).first();
  return json(env, req, { unread: threads.reduce((s, t) => s + t.unread, 0), threads, mail: mu ? mu.c : 0 });
}
async function handleMsgThread(env, req, url) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const me = a.me, other = String(url.searchParams.get('with') || '').toLowerCase(), after = Math.max(0, Number(url.searchParams.get('after')) || 0);
  if (!/^0x[0-9a-f]{40}$/.test(other)) return json(env, req, { error: 'bad request' }, 400);
  const who = await env.DB.prepare(`SELECT p.name n, ${picSql(req)} pic FROM players p WHERE p.address=?1`).bind(other).first();
  if (!who) return json(env, req, { error: 'unknown player' }, 404);
  const iBlocked = !!(await env.DB.prepare('SELECT 1 x FROM blocks WHERE blocker=?1 AND blocked=?2').bind(me, other).first());
  const base = `SELECT id, ts, sender, body FROM messages WHERE ((sender=?1 AND recipient=?2) OR (sender=?2 AND recipient=?1)) AND NOT (sender=?2 AND ?4=1)`;
  let msgs;
  if (after > 0) msgs = (await env.DB.prepare(base + ' AND id>?3 ORDER BY id ASC LIMIT 200').bind(me, other, after, iBlocked ? 1 : 0).all()).results || [];
  else msgs = ((await env.DB.prepare(base + ' AND id>?3 ORDER BY id DESC LIMIT 300').bind(me, other, 0, iBlocked ? 1 : 0).all()).results || []).reverse();
  if (msgs.some((m) => m.sender === other)) await env.DB.prepare('UPDATE messages SET read=1 WHERE recipient=?1 AND sender=?2 AND read=0').bind(me, other).run();
  return json(env, req, { with: other, name: who.n, picture: who.pic || '', blocked: iBlocked, messages: msgs.map((m) => ({ id: m.id, ts: m.ts, mine: m.sender === me, body: m.body })) });
}
async function handleMsgSend(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const me = a.me;
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const to = String(b.to || '').toLowerCase();
  const body = String(b.body || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!/^0x[0-9a-f]{40}$/.test(to) || !body) return json(env, req, { error: 'Type a message first.' }, 400);
  if (body.length > MSG_MAX) return json(env, req, { error: 'Keep it under ' + MSG_MAX + ' characters.' }, 400);
  if (to === me) return json(env, req, { error: 'You cannot text yourself.' }, 400);
  if (await isBanned(env, me)) return json(env, req, { error: 'blocked' }, 403);
  const rcpt = await env.DB.prepare('SELECT 1 x FROM players WHERE address=?1').bind(to).first();
  if (!rcpt || await isBanned(env, to)) return json(env, req, { error: 'That player cannot get texts right now.' }, 404);
  if (await env.DB.prepare('SELECT 1 x FROM blocks WHERE blocker=?1 AND blocked=?2').bind(to, me).first()) return json(env, req, { error: 'This player is not taking texts from you.' }, 403);
  const now = Date.now();
  const recent = await env.DB.prepare('SELECT COUNT(*) c FROM messages WHERE sender=?1 AND ts>?2').bind(me, now - 60 * 1000).first();
  const pair = await env.DB.prepare('SELECT COUNT(*) c FROM messages WHERE sender=?1 AND recipient=?2 AND ts>?3').bind(me, to, now - 10 * 60 * 1000).first();
  if (recent.c >= 12 || pair.c >= 30) return json(env, req, { error: 'Slow down a little, then send again.' }, 429);
  const r = await env.DB.prepare('INSERT INTO messages(ts,sender,recipient,body,read) VALUES(?1,?2,?3,?4,0)').bind(now, me, to, body).run();
  return json(env, req, { ok: true, id: r.meta && r.meta.last_row_id, ts: now, body });
}
async function handleMsgBlock(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const other = String(b.user || '').toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(other) || other === a.me) return json(env, req, { error: 'bad request' }, 400);
  if (b.block === false) await env.DB.prepare('DELETE FROM blocks WHERE blocker=?1 AND blocked=?2').bind(a.me, other).run();
  else await env.DB.prepare('INSERT OR IGNORE INTO blocks(blocker,blocked) VALUES(?1,?2)').bind(a.me, other).run();
  return json(env, req, { ok: true, blocked: b.block !== false });
}

/* ---------- Top 5: sending $TMF between players ----------
 * Rules (enforced here, not in the browser):
 *   - the top 5 runners of the week (Chair Run board) cannot send;
 *   - anyone outside the top 5 can send to any player who has registered at least 1 $TMF this week;
 *   - the amount comes out of the sender's "$TMF found" total and goes into the recipient's, in one all-or-nothing step. */
const TOP_N = 5;
const SCORE = '(run_best+boost)';                 // a player's Chair Run score = their best verified run + the boost they were given
const TOTAL = '(run_best+boost+coins_total)';      // a player's total main score = Chair Run score (incl. boost) + their $TMF found
const BOOST_PER_TMF = 2;                          // each $TMF sent to a top-5 runner adds this many points to their score
async function topNine(env, week) {
  const r = await env.DB.prepare(`SELECT address FROM scores WHERE week=?1 AND ${TOTAL}>0 ORDER BY ${TOTAL} DESC, updated_at ASC LIMIT ?2`).bind(week, TOP_N).all();
  return (r.results || []).map((x) => x.address);
}
async function handleTop9(env, req) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const week = weekNow();
  const rows = (await env.DB.prepare(`SELECT s.address a, ${TOTAL} total, (s.run_best+s.boost) run, s.coins_total tmf, p.name n, ${picSql(req)} pic FROM scores s JOIN players p ON p.address=s.address
      WHERE s.week=?1 AND ${TOTAL}>0 ORDER BY ${TOTAL} DESC, s.updated_at ASC LIMIT 300`).bind(week).all()).results || [];
  return json(env, req, { week, count: rows.length, rows: rows.map((r, i) => ({ rank: i + 1, id: r.a, name: r.n, picture: r.pic || '', total: r.total, run: r.run, tmf: r.tmf, top9: i < TOP_N })) });
}
async function handleSendStatus(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_READ', sess.sub)) return tooMany(env, req);
  const week = weekNow();
  const [top, mine] = await Promise.all([topNine(env, week), env.DB.prepare(`SELECT ${TOTAL} AS sc, run_best, coins_total FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first()]);
  const inTop = top.includes(sess.sub), balance = mine ? mine.coins_total : 0;
  const rank = mine && mine.sc > 0 ? await rankOf(env, week, TOTAL, mine.sc) : null;
  return json(env, req, { week, balance, rank, total: mine ? mine.sc : 0, top9: inTop, canSend: !inTop && balance > 0 });
}
async function handleTransfer(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  if (await isBanned(env, sess.sub)) return json(env, req, { error: 'blocked' }, 403);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const to = String(b.to || '').toLowerCase(), all = b.all === true;
  let amount = Number(b.amount);
  if (!/^0x[0-9a-f]{40}$/.test(to) || (!all && (!Number.isInteger(amount) || amount < 1 || amount > 1e9))) return json(env, req, { error: 'bad request' }, 400);
  if (to === sess.sub) return json(env, req, { error: 'You cannot send $TMF to yourself.' }, 400);
  const week = weekNow();
  const top = await topNine(env, week);
  if (top.includes(sess.sub)) return json(env, req, { error: 'The top 5 runners cannot send $TMF.', top9: true }, 403);
  const rc = await env.DB.prepare('SELECT coins_total c FROM scores WHERE address=?1 AND week=?2').bind(to, week).first();
  if (!rc || rc.c < 1) return json(env, req, { error: 'That player has not registered any $TMF yet, so they cannot receive.' }, 409);
  if (await isBanned(env, to)) return json(env, req, { error: 'That player cannot receive $TMF.' }, 409);
  if (all) {                                                          // give everything the sender holds right now
    const mine = await env.DB.prepare('SELECT coins_total c FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();
    amount = mine ? mine.c : 0;
    if (amount < 1) return json(env, req, { error: 'You have no $TMF to give yet.' }, 409);
  }
  const now = Date.now();
  const boost = top.includes(to) ? amount * BOOST_PER_TMF : 0;        // $TMF given to a top-5 runner also boosts their score
  const res = await env.DB.batch([
    env.DB.prepare('UPDATE scores SET coins_total=coins_total-?1 WHERE address=?2 AND week=?3 AND coins_total>=?1').bind(amount, sess.sub, week),
    env.DB.prepare('UPDATE scores SET coins_total=coins_total+?1, boost=boost+?4 WHERE address=?2 AND week=?3 AND (SELECT changes())>0').bind(amount, to, week, boost),
    env.DB.prepare('INSERT INTO transfers(ts,week,sender,recipient,amount,boost) SELECT ?1,?2,?3,?4,?5,?6 WHERE (SELECT changes())>0').bind(now, week, sess.sub, to, amount, boost),
  ]);
  if (!res[0].meta || !res[0].meta.changes) return json(env, req, { error: 'You do not have that much $TMF to send.' }, 409);
  const left = await env.DB.prepare('SELECT coins_total c FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();
  return json(env, req, { ok: true, sent: amount, boosted: boost, balance: left ? left.c : 0 });
}

/* ---------- Sign in with X (OAuth 2.0 + PKCE). The X @handle becomes the player's name; it is read from X, never typed. ---------- */
const xNeeded = (env) => !!(env.X_CLIENT_ID || env.X_REQUIRED === '1');
const X_AUTH = (env) => env.X_AUTH_URL || 'https://x.com/i/oauth2/authorize';
const X_API = (env) => String(env.X_API_BASE || 'https://api.x.com').replace(/\/$/, '');
const xRedirect = (req) => new URL(req.url).origin + '/api/x/callback';
async function sha256b64u(s) { return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))); }
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').split(String.fromCharCode(8232)).join('').split(String.fromCharCode(8233)).join('');
function xPage(origin, payload, message) {
  const html = `<!doctype html><meta charset="utf-8"><title>X</title><body style="background:#0b0907;color:#f2e7d0;font:15px system-ui;display:grid;place-items:center;height:100vh;margin:0"><p>${message}</p>` +
    `<script>try{window.opener&&window.opener.postMessage(${jsonForScript(payload)},${jsonForScript(origin || 'null')})}catch(e){}setTimeout(function(){window.close()},350)</script>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'", 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
}
async function handleXStart(env, req, url) {
  if (!env.X_CLIENT_ID || !env.X_CLIENT_SECRET) return new Response('X login is not set up yet.', { status: 503 });
  const origin = url.searchParams.get('o') || '';
  if (!allowedOrigins(env).includes(origin)) return new Response('This site is not allowed to use X login.', { status: 403 });
  const verifier = b64u(crypto.getRandomValues(new Uint8Array(32)));
  const state = await signToken(env, { k: 'xs', v: verifier, o: origin, exp: Date.now() + 10 * 60 * 1000 });
  const q = new URLSearchParams({ response_type: 'code', client_id: env.X_CLIENT_ID, redirect_uri: xRedirect(req), scope: 'users.read tweet.read', state, code_challenge: await sha256b64u(verifier), code_challenge_method: 'S256' });
  return Response.redirect(X_AUTH(env) + '?' + q.toString(), 302);
}
async function handleXCallback(env, req, url) {
  const st = await readSigned(env, url.searchParams.get('state'), 'xs');
  if (!st) return xPage('', { type: 'mimu-x', error: 'expired' }, 'That sign-in link expired. Close this window and try again.');
  const fail = (m) => xPage(st.o, { type: 'mimu-x', error: m }, 'Could not connect X. You can close this window.');
  const code = url.searchParams.get('code');
  if (!code || url.searchParams.get('error')) return fail('cancelled');
  try {
    const tr = await fetch(X_API(env) + '/2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + btoa(env.X_CLIENT_ID + ':' + env.X_CLIENT_SECRET) },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', client_id: env.X_CLIENT_ID, redirect_uri: xRedirect(req), code_verifier: st.v }),
    });
    const tj = await tr.json();
    if (!tr.ok || !tj.access_token) { console.error('x token', tr.status, JSON.stringify(tj).slice(0, 200)); return fail('token'); }
    const mr = await fetch(X_API(env) + '/2/users/me?user.fields=profile_image_url', { headers: { Authorization: 'Bearer ' + tj.access_token } });
    const mj = await mr.json();
    const u = mj && mj.data;
    if (!mr.ok || !u || !/^\d{1,25}$/.test(String(u.id)) || !/^[A-Za-z0-9_]{1,15}$/.test(String(u.username))) { console.error('x me', mr.status, JSON.stringify(mj).slice(0, 200)); return fail('profile'); }
    const proof = await signToken(env, { k: 'x', id: String(u.id), u: u.username, exp: Date.now() + 30 * 24 * 3600 * 1000 });
    return xPage(st.o, { type: 'mimu-x', proof, x: u.username, pic: cleanPic(u.profile_image_url ? String(u.profile_image_url).replace('_normal.', '_400x400.') : '') }, 'Connected as @' + String(u.username) + '. You can close this window.');
  } catch (e) { console.error('x callback', String(e && e.message || e)); return fail('network'); }
}
/* Typed X handle: used while real X login is not set up. It is NOT verified by X, so each handle can belong to only one wallet. */
async function handleXHandle(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_AUTH', sess.sub)) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const x = String(b.x || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, '').replace(/[/?#].*$/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(x)) return json(env, req, { error: 'That does not look like an X handle (letters, numbers and _ only, up to 15).' }, 400);
  const me = await env.DB.prepare('SELECT x_id FROM players WHERE address=?1').bind(sess.sub).first();
  if (me && me.x_id) return json(env, req, { error: 'Your X account is already verified.' }, 409);
  const taken = await env.DB.prepare('SELECT address FROM players WHERE lower(x_handle)=lower(?1) AND address<>?2').bind(x, sess.sub).first();
  if (taken) return json(env, req, { error: 'That X handle is already used by another wallet.' }, 409);
  try { await env.DB.prepare("UPDATE players SET x_handle=?1, name='@'||?1 WHERE address=?2").bind(x, sess.sub).run(); }
  catch { return json(env, req, { error: 'That X handle is already used by another wallet.' }, 409); }
  return json(env, req, { ok: true, x });
}
async function handleXLink(env, req) {                              // attach a verified X account to the signed-in wallet
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_AUTH', sess.sub)) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const p = await readSigned(env, b.proof, 'x');
  if (!p) return json(env, req, { error: 'X sign-in expired. Connect X again.' }, 401);
  const other = await env.DB.prepare('SELECT address FROM players WHERE x_id=?1 AND address<>?2').bind(p.id, sess.sub).first();
  if (other) return json(env, req, { error: 'That X account is already connected to another wallet.' }, 409);
  try { await env.DB.prepare("UPDATE players SET x_handle=?1, x_id=?2, name='@'||?1 WHERE address=?3").bind(p.u, p.id, sess.sub).run(); }
  catch { return json(env, req, { error: 'That X account is already connected to another wallet.' }, 409); }
  return json(env, req, { ok: true, x: p.u });
}

/* ---------- admin: dashboard, held runs, bans (needs the admin password, checked here on the server) ---------- */
async function ipKey(env, ip) { return b64u(await hmac(env.SESSION_SECRET, 'adm|' + ip)).slice(0, 22); }   // one-way, so no address is ever stored
async function adminLocked(env, ip) {
  const r = await env.DB.prepare('SELECT n, until FROM admin_fails WHERE ip=?1').bind(ip).first();
  return !!(r && r.until > Date.now());
}
async function adminFail(env, ip) {
  const now = Date.now();
  const r = await env.DB.prepare('SELECT n, at FROM admin_fails WHERE ip=?1').bind(ip).first();
  const n = r && now - r.at < 15 * 60 * 1000 ? r.n + 1 : 1;
  await env.DB.prepare('INSERT INTO admin_fails(ip,n,at,until) VALUES(?1,?2,?3,?4) ON CONFLICT(ip) DO UPDATE SET n=?2, at=?3, until=?4').bind(ip, n, now, n >= 6 ? now + 15 * 60 * 1000 : 0).run();
}
async function handleAdmin(env, req, url) {
  const ip = await ipKey(env, clientIp(req));
  const out = (o, st = 200) => new Response(JSON.stringify(o), { status: st, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...cors(env, req) } });
  if (await adminLocked(env, ip)) return out({ error: 'too many wrong passwords, try again in 15 minutes' }, 429);
  const tok = req.headers.get('X-Admin-Token') || '';
  if (!env.ADMIN_TOKEN || !safeEq(enc.encode(tok), enc.encode(env.ADMIN_TOKEN))) { await adminFail(env, ip); return out({ error: 'forbidden' }, 403); }
  const path = url.pathname.replace('/api/admin/', '');
  let b = {}; if (req.method === 'POST') { try { b = await req.json(); } catch { return out({ error: 'bad json' }, 400); } }
  if (path === 'hype' && req.method === 'POST') {                      // a one-on-one text from Hype to the chosen player
    const to = String(b.to || '').toLowerCase();
    const text = String(b.body || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (!/^0x[0-9a-f]{40}$/.test(to) || to === HYPE) return out({ error: 'Pick a player first.' }, 400);
    if (!text) return out({ error: 'Type a message first.' }, 400);
    if (text.length > MSG_MAX) return out({ error: 'Keep it under ' + MSG_MAX + ' characters.' }, 400);
    const who = await env.DB.prepare('SELECT name FROM players WHERE address=?1').bind(to).first();
    if (!who) return out({ error: 'That player has not signed in yet.' }, 404);
    await env.DB.prepare("INSERT OR IGNORE INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,'Hype','','Hype',?2)").bind(HYPE, Date.now()).run();
    const r = await env.DB.prepare('INSERT INTO messages(ts,sender,recipient,body,read) VALUES(?1,?2,?3,?4,0)').bind(Date.now(), HYPE, to, text).run();
    return out({ ok: true, id: r.meta && r.meta.last_row_id, to: who.name });
  }
  if (path === 'mail' && req.method === 'POST') {                      // the ONLY way an email is created: it goes to every phone signed in with Glyph
    const subject = String(b.subject || '').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
    const body = String(b.body || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
    if (!subject || subject.length > 120) return out({ error: 'Subject is required (up to 120 characters).' }, 400);
    if (!body || body.length > 5000) return out({ error: 'Write a message (up to 5000 characters).' }, 400);
    let img = null, ikey = null;
    if (b.image) {
      const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image));
      if (!m || m[1].length > MAIL_IMG_MAX) return out({ error: 'That photo is too big or not a JPG, PNG or WebP.' }, 400);
      let bytes; try { bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)); } catch { return out({ error: 'bad image' }, 400); }
      const type = sniffImage(bytes);
      if (!type) return out({ error: 'That file is not a real picture.' }, 400);
      img = type + '|' + m[1]; ikey = hex(12);
    }
    const r = await env.DB.prepare('INSERT INTO broadcasts(ts,subject,body,img,ikey) VALUES(?1,?2,?3,?4,?5)').bind(Date.now(), subject, body, img, ikey).run();
    const players = await env.DB.prepare('SELECT COUNT(*) c FROM players WHERE address<>?1').bind(HYPE).first();
    return out({ ok: true, id: r.meta && r.meta.last_row_id, recipients: players.c });
  }
  if (path === 'delmail' && req.method === 'POST') {
    const id = Number(b.id) || 0;
    await env.DB.prepare('DELETE FROM mail_reads WHERE id=?1').bind(id).run();
    await env.DB.prepare('DELETE FROM broadcasts WHERE id=?1').bind(id).run();
    return out({ ok: true });
  }
  if (path === 'live' && req.method === 'GET') {                       // runs happening right now (a ping in the last 25 seconds), newest first
    const since = Date.now() - 25000;
    const rows = (await env.DB.prepare("SELECT r.id, p.name n, r.started_at st, COALESCE(r.last_beat, r.started_at) lb, COALESCE(r.live_score,0) sc, COALESCE(r.live_dist,0) d, COALESCE(r.live_coins,0) c FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='open' AND COALESCE(r.last_beat, r.started_at)>?1 ORDER BY lb DESC").bind(since).all()).results || [];
    return out({ now: Date.now(), count: rows.length, runs: rows.slice(0, 3) });
  }
  if (path === 'dashboard' && req.method === 'GET') {
    const week = weekNow(), q = (sql, ...a) => env.DB.prepare(sql).bind(...a);
    const top = (col) => q(`SELECT s.address a, ${col} v, p.name n, p.x_handle x FROM scores s JOIN players p ON p.address=s.address WHERE s.week=?1 AND ${col}>0 ORDER BY ${col} DESC, s.updated_at ASC LIMIT 10`, week).all();
    const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails, hypes] = await Promise.all([
      q('SELECT COUNT(*) c FROM visitors').first(),
      q('SELECT COALESCE(SUM(visits),0) c FROM visitors').first(),
      q('SELECT COUNT(*) c FROM visitors WHERE last_seen>?1', Date.now() - 24 * 3600 * 1000).first(),
      top(SCORE), top('coins_total'),
      q("SELECT r.id, r.address a, p.name n, p.x_handle x, r.score, r.coins, r.last_tick ticks, r.flags, r.ended_at t FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='held' ORDER BY r.ended_at DESC LIMIT 50").all(),
      q(`SELECT p.address a, p.name n, p.glyph_name g, ${picSql(req)} pic, p.x_handle x, (p.x_id IS NOT NULL) xv, p.updated_at t, (SELECT 1 FROM bans b WHERE b.address=p.address) banned FROM players p WHERE p.address<>'${HYPE}' ORDER BY p.updated_at DESC LIMIT 1000`).all(),
      q('SELECT COUNT(*) c FROM bans').first(),
      q('SELECT t.ts, t.amount, t.boost, t.sender sa, t.recipient ra, ps.name sn, pr.name rn FROM transfers t LEFT JOIN players ps ON ps.address=t.sender LEFT JOIN players pr ON pr.address=t.recipient ORDER BY t.id DESC LIMIT 50').all(),
      q('SELECT m.id, m.ts, m.body, m.sender sa, m.recipient ra, ps.name sn, pr.name rn FROM messages m LEFT JOIN players ps ON ps.address=m.sender LEFT JOIN players pr ON pr.address=m.recipient ORDER BY m.id DESC LIMIT 100').all(),
      q('SELECT b.id, b.ts, b.subject, (b.ikey IS NOT NULL) img, (SELECT COUNT(*) FROM mail_reads r WHERE r.id=b.id) reads FROM broadcasts b ORDER BY b.id DESC LIMIT 20').all(),
      q('SELECT m.id, m.ts, m.body, pr.name rn FROM messages m LEFT JOIN players pr ON pr.address=m.recipient WHERE m.sender=?1 ORDER BY m.id DESC LIMIT 8', HYPE).all(),
    ]);
    return out({
      week, visitors: vis.c, visits: tot.c, today: today.c, banned: banned.c,
      topRun: run.results || [], topNw: nw.results || [],
      held: (held.results || []).map((r) => ({ ...r, flags: JSON.parse(r.flags || '[]'), seconds: Math.round(r.ticks / 60) })),
      users: users.results || [], transfers: transfers.results || [], messages: messages.results || [], mails: mails.results || [], hypes: hypes.results || [], players: users.results ? users.results.length : 0,
    });
  }
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
  if (path === 'delmsg' && req.method === 'POST') {
    await env.DB.prepare('DELETE FROM messages WHERE id=?1').bind(Number(b.id) || 0).run();
    return out({ ok: true });
  }
  if (path === 'rmavatar' && req.method === 'POST') {
    if (!isAddress(b.address || '')) return out({ error: 'bad address' }, 400);
    await env.DB.prepare('UPDATE players SET avatar=NULL WHERE address=?1').bind(String(b.address).toLowerCase()).run();
    return out({ ok: true });
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
  const col = kind === 'run' ? SCORE : 'coins_total';
  const limit = Math.max(5, Math.min(100, Number(url.searchParams.get('limit')) || 50));
  const week = weekNow();
  const rows = (await env.DB.prepare(`SELECT s.address a, ${col} v, p.name n, ${picSql(req)} pic FROM scores s JOIN players p ON p.address=s.address
      WHERE s.week=?1 AND ${col}>0 ORDER BY ${col} DESC, s.updated_at ASC LIMIT ?2`).bind(week, limit).all()).results || [];
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
      if (url.pathname === '/api/health') return json(env, req, { ok: true, week: weekNow(), gates: { mimu: !!env.GATE_MIMU, pass: !!env.GATE_PASS, dengs: !!env.GATE_DENGS }, xLogin: !!(env.X_CLIENT_ID && env.X_CLIENT_SECRET), xRequired: xNeeded(env) });
      if (!env.SESSION_SECRET) return json(env, req, { error: 'server not configured' }, 500);
      if (url.pathname === '/api/nonce' && req.method === 'GET') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleNonce(env, req); }
      if (url.pathname === '/api/auth' && req.method === 'POST') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAuth(env, req); }
      if (url.pathname === '/api/run/start' && req.method === 'POST') return handleRunStart(env, req);
      if (url.pathname === '/api/run/chunk' && req.method === 'POST') return handleRunChunk(env, req);
      if (url.pathname === '/api/leaderboard' && req.method === 'GET') return handleBoard(env, req, url);
      if (url.pathname === '/api/hit' && req.method === 'POST') return handleHit(env, req);
      if (url.pathname === '/api/mail' && req.method === 'GET') return handleMailList(env, req);
      if (url.pathname === '/api/mail/item' && req.method === 'GET') return handleMailItem(env, req, url);
      if (url.pathname.startsWith('/api/mail/img/') && req.method === 'GET') return handleMailImg(env, req, url);
      if (url.pathname === '/api/run/beat' && req.method === 'POST') return handleRunBeat(env, req);
      if (url.pathname === '/api/messages/threads' && req.method === 'GET') return handleMsgThreads(env, req);
      if (url.pathname === '/api/messages/thread' && req.method === 'GET') return handleMsgThread(env, req, url);
      if (url.pathname === '/api/messages/send' && req.method === 'POST') return handleMsgSend(env, req);
      if (url.pathname === '/api/messages/block' && req.method === 'POST') return handleMsgBlock(env, req);
      if (url.pathname === '/api/avatar' && req.method === 'POST') return handleAvatarPost(env, req);
      if (url.pathname.startsWith('/api/avatar/') && req.method === 'GET') return handleAvatarGet(env, req, url);
      if (url.pathname === '/api/top9' && req.method === 'GET') return handleTop9(env, req);
      if (url.pathname === '/api/send/status' && req.method === 'GET') return handleSendStatus(env, req);
      if (url.pathname === '/api/transfer' && req.method === 'POST') return handleTransfer(env, req);
      if (url.pathname === '/api/x/start' && req.method === 'GET') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleXStart(env, req, url); }
      if (url.pathname === '/api/x/callback' && req.method === 'GET') { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleXCallback(env, req, url); }
      if (url.pathname === '/api/x/link' && req.method === 'POST') return handleXLink(env, req);
      if (url.pathname === '/api/x/handle' && req.method === 'POST') return handleXHandle(env, req);
      if (url.pathname.startsWith('/api/admin/')) { if (await limited(env, url.pathname === '/api/admin/live' ? 'RL_READ' : 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAdmin(env, req, url); }
      return json(env, req, { error: 'not found' }, 404);
    } catch (e) {
      console.error('server error', String(e && e.stack || e));
      return json(env, req, { error: 'server error' }, 500);
    }
  },
};

export { loginMessage };
