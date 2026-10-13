// Secret phone line: the first signed-in player to dial it is recorded as the finder (one row, decided in one step),
// gets a text from Hype, and everyone can read who found it. The admin dashboard carries the same record.
import fs from 'node:fs';
const p = new URL('../backend/src/index.js', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const once = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); t = t.replace(a, () => b); };

once('async function handleSendStatus(env, req) {',
`/* ---------- the secret phone line: one finder in the whole game ---------- */
let SECRET_TABLE = false;
async function secretTable(env) {
  if (SECRET_TABLE) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS secret_finder (id INTEGER PRIMARY KEY CHECK (id=1), address TEXT NOT NULL, found_at INTEGER NOT NULL)').run();
  SECRET_TABLE = true;
}
async function handleSecretClaim(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  if (await isBanned(env, sess.sub)) return json(env, req, { error: 'blocked' }, 403);
  await secretTable(env);
  const now = Date.now();
  // one row, id 1: the first insert wins, every later insert is ignored (so two dials at the same moment can never both win)
  const ins = await env.DB.prepare('INSERT OR IGNORE INTO secret_finder(id,address,found_at) VALUES(1,?1,?2)').bind(sess.sub, now).run();
  const row = await env.DB.prepare('SELECT address FROM secret_finder WHERE id=1').first();
  const first = !!(ins.meta && ins.meta.changes > 0);
  if (first) {                                                       // the reminder: a text from Hype, right in their Messages
    await env.DB.prepare("INSERT OR IGNORE INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,'Hype','','Hype',?2)").bind(HYPE, now).run();
    await env.DB.prepare('INSERT INTO messages(ts,sender,recipient,body,read) VALUES(?1,?2,?3,?4,0)').bind(now, HYPE, sess.sub, 'TEXT HYPE THE CODE NOW!').run();
  }
  return json(env, req, { ok: true, won: !!row && row.address === sess.sub, first });
}
async function handleSecretStatus(env, req) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  await secretTable(env);
  const row = await env.DB.prepare(\`SELECT f.address a, f.found_at t, p.name n, \${picSql(req)} pic FROM secret_finder f LEFT JOIN players p ON p.address=f.address WHERE f.id=1\`).first();
  if (!row) return json(env, req, { found: false });
  let sess = null; try { sess = await readToken(env, req); } catch { /* public read */ }
  const mine = !!sess && sess.sub === row.a;
  let texted = false;
  if (mine) texted = !!(await env.DB.prepare('SELECT 1 x FROM messages WHERE sender=?1 AND recipient=?2 AND ts>=?3 LIMIT 1').bind(row.a, HYPE, row.t).first());
  return json(env, req, { found: true, name: row.n || 'a player', pic: row.pic || '', at: row.t, mine, texted });
}
async function secretAdmin(env) {
  try {
    await secretTable(env);
    const row = await env.DB.prepare('SELECT f.address a, f.found_at t, p.name n, p.x_handle x FROM secret_finder f LEFT JOIN players p ON p.address=f.address WHERE f.id=1').first();
    if (!row) return { found: false };
    const m = await env.DB.prepare('SELECT ts, body FROM messages WHERE sender=?1 AND recipient=?2 AND ts>=?3 ORDER BY id DESC LIMIT 1').bind(row.a, HYPE, row.t).first();
    return { found: true, name: row.n || 'a player', x: row.x || '', address: row.a, at: row.t, texted: !!m, textedAt: m ? m.ts : 0, body: m ? m.body : '' };
  } catch { return { found: false, error: true }; }
}
async function handleSendStatus(env, req) {`);

once("      if (url.pathname === '/api/transfer' && req.method === 'POST') return handleTransfer(env, req);",
"      if (url.pathname === '/api/transfer' && req.method === 'POST') return handleTransfer(env, req);\n" +
"      if (url.pathname === '/api/secret/claim' && req.method === 'POST') return handleSecretClaim(env, req);\n" +
"      if (url.pathname === '/api/secret/status' && req.method === 'GET') return handleSecretStatus(env, req);");

once('      users: users.results || [], transfers: transfers.results || [],', '      secret: await secretAdmin(env), users: users.results || [], transfers: transfers.results || [],');
fs.writeFileSync(p, t);
console.log('secret server patched');
