// Server: sign-in only while the campaign is live, play statistics for the admin fun facts, Top 5 results, orb time in the live picture.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/src/index.js';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* 1) the campaign window gates sign-in */
rep(`async function handleAuth(env, req) {
  const origin = req.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) return json(env, req, { error: 'this site is not allowed to sign in' }, 403);`,
`/* The campaign is live from the countdown ending (Sat Oct 10 2026, 6:00 PM Pacific) until it closes (Wed Oct 14, 6:00 AM Pacific). Nobody can sign in outside it. CHAIR_RUN_OPEN = "1" (staging) skips the check. */
function campaignWindow(env, now = Date.now()) {
  const from = Number(env.CHAIR_RUN_OPENS_AT) || Date.UTC(2026, 9, 11, 1, 0, 0), until = Number(env.CAMPAIGN_CLOSES_AT) || Date.UTC(2026, 9, 14, 13, 0, 0);
  if (env.CHAIR_RUN_OPEN === '1') return { from, until, open: true, state: 'open' };
  return { from, until, open: now >= from && now < until, state: now < from ? 'early' : now >= until ? 'ended' : 'open' };
}
async function handleAuth(env, req) {
  const origin = req.headers.get('Origin') || '';
  if (!allowedOrigins(env).includes(origin)) return json(env, req, { error: 'this site is not allowed to sign in' }, 403);
  const cw = campaignWindow(env);
  if (!cw.open) return json(env, req, { error: cw.state === 'early' ? 'The campaign has not opened yet. Sign-in opens when the countdown ends, Sat Oct 10 at 6:00 PM PST.' : 'The campaign has ended. Thanks for playing!', closed: true, state: cw.state, opensAt: cw.from }, 403);`);

/* 2) play statistics (for the admin fun facts) */
rep(`/* A run whose tab closed`, `/* lifetime play statistics per player, filled when a run is finished (verified or held) */
let PLAY_TABLE = false;
async function ensurePlayStats(env) {
  if (PLAY_TABLE) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS play_stats (address TEXT PRIMARY KEY, ticks INTEGER NOT NULL DEFAULT 0, runs INTEGER NOT NULL DEFAULT 0, hops INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 0, dist INTEGER NOT NULL DEFAULT 0, best_chain INTEGER NOT NULL DEFAULT 0, longest INTEGER NOT NULL DEFAULT 0)').run();
  PLAY_TABLE = true;
}
async function recordPlay(env, address, S) {
  try {
    await ensurePlayStats(env);
    const hops = (S.cleared || []).reduce((a, b) => a + (b | 0), 0);
    await env.DB.prepare('INSERT INTO play_stats(address,ticks,runs,hops,coins,dist,best_chain,longest) VALUES(?1,?2,1,?3,?4,?5,?6,?2) ON CONFLICT(address) DO UPDATE SET ticks=ticks+?2, runs=runs+1, hops=hops+?3, coins=coins+?4, dist=dist+?5, best_chain=MAX(best_chain,?6), longest=MAX(longest,?2)')
      .bind(address, S.tick | 0, hops, Math.max(0, Math.floor(S.coins)), Math.floor(S.dist), S.mxChain | 0).run();
  } catch (e) { console.error('play stats', String(e && e.message || e)); }
}
/* A run whose tab closed`);
rep(`      if (flags.length) { await env.DB.prepare("UPDATE runs SET status='held', snapshot=NULL, stats=?1, flags=?2, score=?3, coins=?4, dist=?5, ended_at=?6 WHERE id=?7").bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, now, run.id).run(); continue; }`,
    `      if (flags.length) { await env.DB.prepare("UPDATE runs SET status='held', snapshot=NULL, stats=?1, flags=?2, score=?3, coins=?4, dist=?5, ended_at=?6 WHERE id=?7").bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, now, run.id).run(); await recordPlay(env, address, S); continue; }`);
rep(`      if (score > 0) await applyScore(env, address, weekNow(), score, coins, now);
    }`, `      if (score > 0) await applyScore(env, address, weekNow(), score, coins, now);
      await recordPlay(env, address, S);
    }`);
rep(`      .bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, S.tick, run.seq + 1, now, runId).run();
    return json(env, req, { ok: true, final: true, held: true, score, coins, dist });`, `      .bind(JSON.stringify(stats), JSON.stringify(flags), score, coins, dist, S.tick, run.seq + 1, now, runId).run();
    await recordPlay(env, sess.sub, S);
    return json(env, req, { ok: true, final: true, held: true, score, coins, dist });`);
rep(`  if (S.tick >= 120 && score > 0) await applyScore(env, sess.sub, week, score, coins, now);
  const mine =`, `  if (S.tick >= 120 && score > 0) await applyScore(env, sess.sub, week, score, coins, now);
  await recordPlay(env, sess.sub, S);
  const mine =`);

/* 3) the live picture carries the orb countdown */
rep(`lv: num(st.lv, 0, 9) | 0,`, `lv: num(st.lv, 0, 9) | 0, or: num(st.or, 0, 200) | 0,`);
rep(`cm: S.cm, ob });`, `cm: S.cm, or: S.orbT > 0 ? Math.ceil(S.orbT) : 0, ob });`);

/* 4) dashboard: fun facts and the Top 5 results */
rep(`    return out({
      week, visitors: vis.c, visits: tot.c, today: today.c, banned: banned.c,`, `    let facts = null, top5 = [];
    try {
      await ensurePlayStats(env);
      const lead = (col) => q(\`SELECT ps.address a, p.name n, \${picSql(req)} pic, ps.\${col} v FROM play_stats ps JOIN players p ON p.address=ps.address WHERE ps.\${col}>0 AND ps.address<>'\${HYPE}' ORDER BY ps.\${col} DESC LIMIT 1\`).first();
      const [tot2, mvp, hops, coinsL, longest, chain, gifts, gifter, msgs, reads, best] = await Promise.all([
        q('SELECT COALESCE(SUM(ticks),0) ticks, COALESCE(SUM(runs),0) runs, COALESCE(SUM(hops),0) hops, COALESCE(SUM(coins),0) coins, COALESCE(SUM(dist),0) dist, COUNT(*) players FROM play_stats').first(),
        lead('ticks'), lead('hops'), lead('coins'), lead('longest'), lead('best_chain'),
        q('SELECT COUNT(*) n, COALESCE(SUM(amount),0) amt, COALESCE(MAX(amount),0) big, COALESCE(SUM(boost),0) boost FROM transfers').first(),
        q(\`SELECT t.sender a, p.name n, \${picSql(req)} pic, SUM(t.amount) v FROM transfers t JOIN players p ON p.address=t.sender GROUP BY t.sender ORDER BY v DESC LIMIT 1\`).first(),
        q('SELECT COUNT(*) c FROM messages').first(),
        q('SELECT COUNT(*) c FROM mail_reads').first(),
        q(\`SELECT p.name n, \${picSql(req)} pic, s.run_best v FROM scores s JOIN players p ON p.address=s.address ORDER BY s.run_best DESC LIMIT 1\`).first(),
      ]);
      facts = { ticks: tot2.ticks, runs: tot2.runs, hops: tot2.hops, coins: tot2.coins, dist: tot2.dist, runners: tot2.players, mvp, hopsLead: hops, coinsLead: coinsL, longest, chain, gifts, gifter, texts: msgs.c, mailReads: reads.c, best };
      const t5 = await q(\`SELECT s.address a, \${TOTAL} total, (s.run_best+s.boost) run, s.coins_total tmf, s.boost, p.name n, \${picSql(req)} pic FROM scores s JOIN players p ON p.address=s.address WHERE s.week=?1 AND \${TOTAL}>0 ORDER BY \${TOTAL} DESC, s.updated_at ASC LIMIT \${TOP_N}\`, week).all();
      top5 = t5.results || [];
    } catch (e) { console.error('facts', String(e && e.message || e)); }
    return out({
      facts, top5,
      week, visitors: vis.c, visits: tot.c, today: today.c, banned: banned.c,`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
