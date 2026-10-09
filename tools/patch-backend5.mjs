// No IP / location stored or shown anywhere; Top 9 -> Top 5; "give all" uses the live balance.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/src/index.js';
let t = fs.readFileSync(p, 'utf8');
const must = (s) => { if (!t.includes(s)) throw new Error('missing: ' + s.slice(0, 80)); };
const rep = (a, b) => { must(a); t = t.replace(a, b); };

// 1. visitor counter keeps nothing but an anonymous id and times
{
  const a = t.indexOf("  const cf = req.cf || {}, ip = clientIp(req), now = Date.now();");
  const delLine = "  await env.DB.prepare('DELETE FROM hits WHERE id <= (SELECT MAX(id) - 2000 FROM hits)').run();\n";
  const b = t.indexOf(delLine);
  if (a < 0 || b < 0) throw new Error('handleHit anchors');
  const body = `  const now = Date.now();
  const row = await env.DB.prepare('SELECT last_seen FROM visitors WHERE id=?1').bind(vid).first();
  if (row && now - row.last_seen < 30 * 60 * 1000) return json(env, req, { ok: true });          // same visit
  await env.DB.prepare('INSERT INTO visitors(id,first_seen,last_seen,visits) VALUES(?1,?2,?2,1) ON CONFLICT(id) DO UPDATE SET last_seen=?2, visits=visits+1').bind(vid, now).run();
`;
  t = t.slice(0, a) + body + t.slice(b + delLine.length);
}
// 2. sign-in no longer records an IP
rep("INSERT INTO players(address,name,picture,glyph_name,last_ip,updated_at) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(address) DO UPDATE SET name=?2,picture=?3,glyph_name=?4,last_ip=?5,updated_at=?6')\n    .bind(addr.toLowerCase(), name, picture, glyphName, clientIp(req), now).run();",
    "INSERT INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(address) DO UPDATE SET name=?2,picture=?3,glyph_name=?4,updated_at=?5')\n    .bind(addr.toLowerCase(), name, picture, glyphName, now).run();");
// 3. the wrong-password lockout keys on a one-way keyed hash, not the address itself
rep("async function adminLocked(env, ip) {", "async function ipKey(env, ip) { return b64u(await hmac(env.SESSION_SECRET, 'adm|' + ip)).slice(0, 22); }   // one-way, so no address is ever stored\nasync function adminLocked(env, ip) {");
rep("async function handleAdmin(env, req, url) {\n  const ip = clientIp(req);", "async function handleAdmin(env, req, url) {\n  const ip = await ipKey(env, clientIp(req));");
// 4. dashboard: no map, no visitor IP list, no per-player IP
rep("const [vis, tot, today, run, nw, held, users, map, ips, banned, transfers, messages]", "const [vis, tot, today, run, nw, held, users, banned, transfers, messages]");
rep(" p.last_ip ip,", "");
rep("      q('SELECT lat, lon, country, city, COUNT(*) c FROM visitors WHERE lat IS NOT NULL AND lon IS NOT NULL GROUP BY ROUND(lat,1), ROUND(lon,1) ORDER BY MAX(last_seen) DESC LIMIT 1500').all(),\n", "");
rep("      q('SELECT ts, ip, country, city, vid FROM hits ORDER BY id DESC LIMIT 200').all(),\n", "");
rep("map: map.results || [], ips: ips.results || [], ", "");

// 5. Top 5
rep("const TOP_N = 9;", "const TOP_N = 5;");
t = t.replace(/Top 9/g, 'Top 5').replace(/top 9/g, 'top 5').replace(/top-9/g, 'top-5');

// 6. "give all" gives whatever the live balance is at that moment
rep("const to = String(b.to || '').toLowerCase(), amount = Number(b.amount);\n  if (!/^0x[0-9a-f]{40}$/.test(to) || !Number.isInteger(amount) || amount < 1 || amount > 1e9) return json(env, req, { error: 'bad request' }, 400);",
    "const to = String(b.to || '').toLowerCase(), all = b.all === true;\n  let amount = Number(b.amount);\n  if (!/^0x[0-9a-f]{40}$/.test(to) || (!all && (!Number.isInteger(amount) || amount < 1 || amount > 1e9))) return json(env, req, { error: 'bad request' }, 400);");
rep("  const now = Date.now();\n  const boost = top.includes(to)", "  if (all) {                                                          // give everything the sender holds right now\n    const mine = await env.DB.prepare('SELECT coins_total c FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();\n    amount = mine ? mine.c : 0;\n    if (amount < 1) return json(env, req, { error: 'You have no $TMF to give yet.' }, 409);\n  }\n  const now = Date.now();\n  const boost = top.includes(to)");
fs.writeFileSync(p, t);
console.log('ok');
