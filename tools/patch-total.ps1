$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\backend\src\index.js'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

Swap "const BOOST_PER_TMF = 2;" "const TOTAL = '(run_best+boost+coins_total)';      // a player's total main score = Chair Run score (incl. boost) + their `$TMF found
const BOOST_PER_TMF = 2;"
# the top 9 is decided by the total
Swap 'FROM scores WHERE week=?1 AND run_best>0 ORDER BY ${SCORE} DESC, updated_at ASC LIMIT ?2`).bind(week, TOP_N)' 'FROM scores WHERE week=?1 AND ${TOTAL}>0 ORDER BY ${TOTAL} DESC, updated_at ASC LIMIT ?2`).bind(week, TOP_N)'
Swap 'SELECT ${SCORE} AS sc, run_best, coins_total FROM scores WHERE address=?1 AND week=?2' 'SELECT ${TOTAL} AS sc, run_best, coins_total FROM scores WHERE address=?1 AND week=?2'
Swap 'const rank = mine && mine.run_best > 0 ? await rankOf(env, week, SCORE, mine.sc) : null;' 'const rank = mine && mine.sc > 0 ? await rankOf(env, week, TOTAL, mine.sc) : null;'
Swap 'return json(env, req, { week, balance, rank, top9: inTop, canSend: !inTop && balance > 0 });' 'return json(env, req, { week, balance, rank, total: mine ? mine.sc : 0, top9: inTop, canSend: !inTop && balance > 0 });'

# every player, ranked by total, for the Top 9 app
Swap 'async function handleSendStatus(env, req) {' @'
async function handleTop9(env, req) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const week = weekNow();
  const rows = (await env.DB.prepare(`SELECT s.address a, ${TOTAL} total, (s.run_best+s.boost) run, s.coins_total tmf, p.name n, p.picture pic FROM scores s JOIN players p ON p.address=s.address
      WHERE s.week=?1 AND ${TOTAL}>0 ORDER BY ${TOTAL} DESC, s.updated_at ASC LIMIT 300`).bind(week).all()).results || [];
  return json(env, req, { week, count: rows.length, rows: rows.map((r, i) => ({ rank: i + 1, id: r.a, name: r.n, picture: r.pic || '', total: r.total, run: r.run, tmf: r.tmf, top9: i < TOP_N })) });
}
async function handleSendStatus(env, req) {
'@
Swap "      if (url.pathname === '/api/send/status' && req.method === 'GET')" "      if (url.pathname === '/api/top9' && req.method === 'GET') return handleTop9(env, req);
      if (url.pathname === '/api/send/status' && req.method === 'GET')"
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched backend'
