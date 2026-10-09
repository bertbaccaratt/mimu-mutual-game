// Server: every signed-in player is listed (text app, admin), plus a per-player all-time best for the long-run badges.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/src/index.js';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

rep(`async function handleMsgThreads(env, req) {`, `/* every player who has signed in (not just the ones with a score), for the text app's list */
async function handlePlayers(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const rows = (await env.DB.prepare(\`SELECT p.address id, p.name, \${picSql(req)} pic, (SELECT \${TOTAL} FROM scores s WHERE s.address=p.address AND s.week=?1) total FROM players p WHERE p.address<>?2 AND p.address<>?3 AND NOT EXISTS (SELECT 1 FROM bans b WHERE b.address=p.address) ORDER BY (total IS NULL), total DESC, p.updated_at DESC LIMIT 5000\`).bind(weekNow(), HYPE, a.me).all()).results || [];
  return json(env, req, { players: rows.map((r) => ({ id: r.id, name: r.name, picture: r.pic, total: r.total || 0 })) });
}
/* the player's own best single run ever (earned by running only, boosts and $TMF not included): used for the long-run badges */
async function handleMyBest(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const r = await env.DB.prepare('SELECT MAX(run_best) b FROM scores WHERE address=?1').bind(a.me).first();
  return json(env, req, { best: (r && r.b) || 0 });
}
async function handleMsgThreads(env, req) {`);

rep(`      if (url.pathname === '/api/top9' && req.method === 'GET') return handleTop9(env, req);`, `      if (url.pathname === '/api/top9' && req.method === 'GET') return handleTop9(env, req);
      if (url.pathname === '/api/players' && req.method === 'GET') return handlePlayers(env, req);
      if (url.pathname === '/api/mybest' && req.method === 'GET') return handleMyBest(env, req);`);

rep(`WHERE p.address<>'\${HYPE}' ORDER BY p.updated_at DESC LIMIT 1000\`)`, `WHERE p.address<>'\${HYPE}' ORDER BY p.updated_at DESC LIMIT 5000\`)`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
