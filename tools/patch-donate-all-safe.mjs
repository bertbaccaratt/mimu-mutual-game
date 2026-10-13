// Donate all, fail-safe: the transfers "points" column is verified before it is used, so a problem adding it can never break the
// admin dashboard or the existing $TMF transfers.
import fs from 'node:fs';
const p = new URL('../backend/src/index.js', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const once = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss (' + (t.split(a).length - 1) + '): ' + a.slice(0, 90)); t = t.replace(a, () => b); };

once("let TRANSFERS_POINTS = false;\nasync function transfersPoints(env) {\n  if (TRANSFERS_POINTS) return;\n  try { await env.DB.prepare('ALTER TABLE transfers ADD COLUMN points INTEGER NOT NULL DEFAULT 0').run(); } catch { /* the column is already there */ }\n  TRANSFERS_POINTS = true;\n}",
"let TRANSFERS_POINTS = false;\nasync function transfersPoints(env) {                               // true when the transfers table has its points column (added once, then verified)\n  if (TRANSFERS_POINTS) return true;\n  try { await env.DB.prepare('ALTER TABLE transfers ADD COLUMN points INTEGER NOT NULL DEFAULT 0').run(); } catch { /* the column is already there */ }\n  try { await env.DB.prepare('SELECT points FROM transfers LIMIT 1').first(); TRANSFERS_POINTS = true; } catch { return false; }\n  return true;\n}");

once("    await transfersPoints(env);\n    const mineE =", "    const hasPts = await transfersPoints(env);\n    const mineE =");
once("      env.DB.prepare('INSERT INTO transfers(ts,week,sender,recipient,amount,boost,points) SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE (SELECT changes())>0').bind(nowE, week, sess.sub, to, coinsE, boostE, pts),",
     "      hasPts\n        ? env.DB.prepare('INSERT INTO transfers(ts,week,sender,recipient,amount,boost,points) SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE (SELECT changes())>0').bind(nowE, week, sess.sub, to, coinsE, boostE, pts)\n        : env.DB.prepare('INSERT INTO transfers(ts,week,sender,recipient,amount,boost) SELECT ?1,?2,?3,?4,?5,?6 WHERE (SELECT changes())>0').bind(nowE, week, sess.sub, to, coinsE, boostE),");

once("    await transfersPoints(env);\n    const [vis, tot, today,", "    const hasPtsCol = await transfersPoints(env);\n    const [vis, tot, today,");
once("q('SELECT t.ts, t.amount, t.boost, t.points, t.sender sa,", "q('SELECT t.ts, t.amount, t.boost, ' + (hasPtsCol ? 't.points' : '0 AS points') + ', t.sender sa,");
fs.writeFileSync(p, t);
console.log('donate all fail-safe applied');
