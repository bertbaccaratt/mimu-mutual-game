// A run that plays past the 4 hour cap is closed AT the cap and keeps what it had there (it used to be refused and lost).
import fs from 'node:fs';
const p = new URL('../backend/src/index.js', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const rep = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); t = t.replace(a, () => b); };

rep("  if (run.status !== 'open') return json(env, req, { error: 'run is closed' }, 409);\n  if (seq !== run.seq) return json(env, req, { error: 'out of order' }, 409);\n  const from = run.last_tick;\n  if (to < from || to - from > CHUNK_TICKS || to > MAX_TICKS) return json(env, req, { error: 'bad tick range' }, 400);\n  const now = Date.now();\n  if ((to / 60) * 1000 > now - run.started_at + TIME_SLACK_MS)",
  "  const maxTicks = Number(env.MAX_TICKS) || MAX_TICKS;                 // staging tests use a small cap\n" +
  "  if (run.status === 'done' && run.last_tick >= maxTicks) {            // a run that went past the cap was closed there: any later piece just gets the same answer\n" +
  "    const wk = weekNow(), m0 = await env.DB.prepare(`SELECT ${SCORE} AS sc FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, wk).first();\n" +
  "    return json(env, req, { ok: true, final: true, capped: true, score: run.score, coins: run.coins, dist: run.dist, rank: m0 ? await rankOf(env, wk, SCORE, m0.sc) : null, best: m0 ? m0.sc : 0 });\n" +
  "  }\n" +
  "  if (run.status !== 'open') return json(env, req, { error: 'run is closed' }, 409);\n" +
  "  if (seq !== run.seq) return json(env, req, { error: 'out of order' }, 409);\n" +
  "  const from = run.last_tick;\n" +
  "  if (to < from || to - from > CHUNK_TICKS) return json(env, req, { error: 'bad tick range' }, 400);\n" +
  "  /* a run that plays past the cap is closed AT the cap and keeps what it had there; it is not thrown away */\n" +
  "  const capped = to > maxTicks, upTo = capped ? maxTicks : to, isFinal = final === true || capped;\n" +
  "  if (from > upTo) return json(env, req, { error: 'bad tick range' }, 400);\n" +
  "  const now = Date.now();\n" +
  "  if ((upTo / 60) * 1000 > now - run.started_at + TIME_SLACK_MS)");

rep("  const list = [];\n  let prev = from;\n  for (const it of inputs) {\n    if (!Array.isArray(it) || it.length !== 2 || !isInt(it[0]) || !isInt(it[1]) || it[1] < 0 || it[1] > 5 || it[0] < prev || it[0] > to || (it[0] === to && !final))",
  "  const list = [];\n  let prev = from;\n  const inList = capped ? inputs.filter((it) => !(Array.isArray(it) && isInt(it[0]) && it[0] > upTo)) : inputs;   // moves after the cap are not part of the counted run\n  for (const it of inList) {\n    if (!Array.isArray(it) || it.length !== 2 || !isInt(it[0]) || !isInt(it[1]) || it[1] < 0 || it[1] > 5 || it[0] < prev || it[0] > upTo || (it[0] === upTo && !isFinal))");

rep("  while (S.tick < to && !S.dead) {\n    while (i < list.length && list[i][0] === S.tick) feed();\n    if (S.wait || S.dead) break;\n    sim.step(); sim.drain();\n  }\n  if (final) while (i < list.length && list[i][0] === S.tick) feed();",
  "  while (S.tick < upTo && !S.dead) {\n    while (i < list.length && list[i][0] === S.tick) feed();\n    if (S.wait || S.dead) break;\n    sim.step(); sim.drain();\n  }\n  if (isFinal) while (i < list.length && list[i][0] === S.tick) feed();");
rep("if (S.tick !== to && !(S.dead && S.tick <= to)) return json(env, req, { error: 'run did not reach that tick' }, 422);\n\n  if (!final) {",
  "if (S.tick !== upTo && !(S.dead && S.tick <= upTo)) return json(env, req, { error: 'run did not reach that tick' }, 422);\n  const atCap = capped || (S.tick >= maxTicks && !S.dead);            // the run was alive at the cap\n\n  if (!isFinal && !atCap) {");
rep("return json(env, req, { ok: true, final: true, held: true, score, coins, dist });", "return json(env, req, { ok: true, final: true, held: true, capped: atCap, score, coins, dist });");
rep("return json(env, req, { ok: true, final: true, score, coins, dist, rank: mine ? await rankOf(env, week, SCORE, mine.sc) : null, best: mine ? mine.sc : 0 });\n}",
  "return json(env, req, { ok: true, final: true, capped: atCap, score, coins, dist, rank: mine ? await rankOf(env, week, SCORE, mine.sc) : null, best: mine ? mine.sc : 0 });\n}");
fs.writeFileSync(p, t);
console.log('cap patched');
