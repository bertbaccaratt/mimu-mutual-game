// Scoring change: every finished run's points are ADDED to the player's weekly run total (instead of keeping only the best run).
//   run_best  = the run points of every finished run this week, added together  (Chair Run board, and half of the Top 5 total)
//   best_run  = the best single run (kept for the long-run badges)
//   Top 5 total = run points + boost + $TMF found  (unchanged formula)
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (file, fn) => {
  const p = root + file;
  let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
  const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(file + ': ' + n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };
  fn(rep);
  fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
};

edit('backend/src/index.js', (rep) => {
  rep("async function applyScore(env, address, week, score, coins, now) {\n  await env.DB.prepare(`INSERT INTO scores(address,week,run_best,coins_total,runs,updated_at) VALUES(?1,?2,?3,?4,1,?5)\n      ON CONFLICT(address,week) DO UPDATE SET run_best=MAX(run_best,?3), coins_total=coins_total+?4, runs=runs+1, updated_at=?5`).bind(address, week, score, coins, now).run();",
      "/* Every finished run ADDS its points to the player's weekly run total (run_best), and its $TMF to coins_total. best_run keeps the best single run. */\nasync function applyScore(env, address, week, score, coins, now) {\n  await env.DB.prepare(`INSERT INTO scores(address,week,run_best,best_run,coins_total,runs,updated_at) VALUES(?1,?2,?3,?3,?4,1,?5)\n      ON CONFLICT(address,week) DO UPDATE SET run_best=run_best+?3, best_run=MAX(best_run,?3), coins_total=coins_total+?4, runs=runs+1, updated_at=?5`).bind(address, week, score, coins, now).run();");
  rep("SELECT MAX(run_best) b FROM scores WHERE address=?1", "SELECT MAX(best_run) b FROM scores WHERE address=?1");
  rep("const SCORE = '(run_best+boost)';                 // a player's Chair Run score = their best verified run + the boost they were given",
      "const SCORE = '(run_best+boost)';                 // a player's Chair Run score = the points of ALL their finished runs this week added together + the boost they were given");
  rep("SELECT run_best, coins_total, runs, ${TOTAL} AS total FROM scores WHERE address=?1 AND week=?2", "SELECT run_best, best_run, coins_total, runs, ${TOTAL} AS total FROM scores WHERE address=?1 AND week=?2");
  rep("r.best = s ? s.run_best : 0;", "r.best = s ? s.best_run : 0; r.runPts = s ? s.run_best : 0;");
  rep("s.run_best v FROM scores s JOIN players p ON p.address=s.address ORDER BY s.run_best DESC LIMIT 1", "s.best_run v FROM scores s JOIN players p ON p.address=s.address ORDER BY s.best_run DESC LIMIT 1");
});

edit('backend/schema.sql', (rep) => {
  rep("  run_best    INTEGER NOT NULL DEFAULT 0,\n", "  run_best    INTEGER NOT NULL DEFAULT 0,   -- run points: every finished run this week ADDED together\n  best_run    INTEGER NOT NULL DEFAULT 0,   -- the best single run this week (long-run badges)\n");
});

edit('index.html', (rep) => {
  rep(`A Chair Run board ranks your best single run and a $TMF board ranks what you found.`, `The Chair Run board adds up the points from every run you finish this week, so each run lifts you higher, and the $TMF board ranks the $TMF you found.`);
  rep(`every player ranked by total score (best run + $TMF found)`, `every player ranked by total score (the points from all your finished runs added together + $TMF found)`);
  rep(`<span>Weekly boards for the best run and for $TMF found, checked by the server so everyone is ranked fairly.</span>`, `<span>Weekly boards: Chair Run points from all your finished runs added together, and $TMF found. Checked by the server so everyone is ranked fairly.</span>`);
  rep(`Your total score is your Chair Run points plus your $TMF found, and the Top 5 app ranks every player by it.`, `Your total score is the Chair Run points from all your finished runs this week added together, plus your $TMF found, and the Top 5 app ranks every player by it.`);
  rep(`The weekly board counts your best single run plus the $TMF you found.`, `The weekly board adds up the points from every run you finish, plus the $TMF you found.`);
  rep(`<b style="color:var(--cream)">Total score = Chair Run points + $TMF found.</b> Everyone is ranked by it.`, `<b style="color:var(--cream)">Total score = Chair Run points from all your finished runs added together + $TMF found.</b> Everyone is ranked by it.`);
  rep(`Keep climbing. Top scorers may be considered for a TMF Pass, but it isn’t guaranteed.`, `Every run you finish adds to your total, so keep climbing. Top scorers may be considered for a TMF Pass, but it isn’t guaranteed.`);
  rep(`stat('#ff7bd5','🚀',fmt(maxRun),'best single run')`, `stat('#ff7bd5','🚀',fmt(maxRun),'most run points')`);
  // end-of-run card: show the weekly run total so the climb is visible
  rep(`<div class="row" style="margin-bottom:14px"><div class="lbl">Weekly rank</div>`, `\${verified&&API.on()?'<div class="row" style="margin-bottom:6px"><div class="lbl">Run points this week</div><div class="sp"></div><b class="mono" id="rtv" style="color:var(--gold2)">…</b></div>':''}<div class="row" style="margin-bottom:14px"><div class="lbl">Weekly rank</div>`);
  rep(`if(r&&r.final){if(e)e.textContent=r.held?`, `if(r&&r.final){{const tv=$('#rtv',root);if(tv)tv.textContent=r.held?'under review':fmt(r.best||0)}if(e)e.textContent=r.held?`);
});

edit('README.md', (rep) => {
  rep("- **A run only counts if it ends:**", "- **Scoring adds up:** every finished run's points are ADDED to the player's weekly run total (`scores.run_best`), and its $TMF to `coins_total`. The Chair Run board is the run total (+ boost), the $TMF board is `coins_total`, and the Top 5 total (the winner) is run total + boost + $TMF found. `best_run` keeps the best single run for the long-run badges.\n- **A run only counts if it ends:**");
});
console.log('ok');
