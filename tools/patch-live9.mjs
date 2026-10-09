// Admin: nine live Chair Run squares ranked by live score, with as much detail as fits. Site: sign the NDA once per browser.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('backend/src/index.js', (rep) => {
  rep(`    const rows = (await env.DB.prepare("SELECT r.id, p.name n, r.started_at st, COALESCE(r.last_beat, r.started_at) lb, COALESCE(r.live_score,0) sc, COALESCE(r.live_dist,0) d, COALESCE(r.live_coins,0) c FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='open' AND COALESCE(r.last_beat, r.started_at)>?1 ORDER BY lb DESC").bind(since).all()).results || [];
    return out({ now: Date.now(), count: rows.length, runs: rows.slice(0, 3) });`,
`    const week = weekNow();
    const rows = (await env.DB.prepare(\`SELECT r.id, r.address a, p.name n, p.x_handle x, \${picSql(req)} pic, r.started_at st, COALESCE(r.last_beat, r.started_at) lb, COALESCE(r.live_score,0) sc, COALESCE(r.live_dist,0) d, COALESCE(r.live_coins,0) c, r.last_tick tk FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='open' AND COALESCE(r.last_beat, r.started_at)>?1 ORDER BY COALESCE(r.live_score,0) DESC, lb DESC\`).bind(since).all()).results || [];
    const nine = rows.slice(0, 9);
    for (const r of nine) {                                            // where each live player stands on this week's leaderboard
      const s = await env.DB.prepare(\`SELECT run_best, coins_total, runs, \${TOTAL} AS total FROM scores WHERE address=?1 AND week=?2\`).bind(r.a, week).first();
      r.best = s ? s.run_best : 0; r.tmf = s ? s.coins_total : 0; r.runs = s ? s.runs : 0; r.total = s ? s.total : 0;
      r.rank = s && s.total > 0 ? await rankOf(env, week, TOTAL, s.total) : null;
      r.a = r.a.slice(0, 6) + '…' + r.a.slice(-4);
    }
    return out({ now: Date.now(), count: rows.length, runs: nine });`);
});

edit('admin.html', (rep) => {
  rep(`.lsq{aspect-ratio:1/.82;border-radius:18px;`, `.lsq{min-height:196px;border-radius:18px;`);
  rep(`.lsq .nm{font:600 12.5px var(--mono);color:#fff;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`, `.lsq .nm{font:600 12.5px var(--mono);color:#fff;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsq .rk{position:absolute;left:10px;top:9px;font:700 11px var(--mono);letter-spacing:.06em;padding:3px 8px;border-radius:99px;background:#0b2a16;color:#7dffa8;border:1px solid #1f8f4a}
.lsq .rk.r1{background:#3a2a00;color:#ffd466;border-color:#ffc233;box-shadow:0 0 14px rgba(255,194,51,.5)}.lsq .rk.r2{background:#262a33;color:#dfe5f0;border-color:#9aa6b6}.lsq .rk.r3{background:#35200f;color:#f3b27a;border-color:#cd7f32}
.lsq .bd{position:absolute;right:10px;top:9px;font:600 10.5px var(--mono);color:#9fd3ff}
.lsq.top1{border-color:var(--gold);box-shadow:0 0 34px rgba(255,194,51,.55)}
.lsq .row2{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 10px;font:500 10.5px var(--mono);color:#a7c9b4}
.lsq .row2 b{color:#e6fff0;font-weight:600}
.lsq .pic{width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid #1f8f4a;background:#0b2a16}`);
  rep(`  box.innerHTML=[0,1,2].map(i=>{const r=LIVE_RUNS[i];return r?\`<div class="lsq on"><span class="pulse"></span><div class="runner">🏃</div><div class="nm">\${esc(r.n||'player')}</div><div class="sc">\${nf(r.sc)}</div><small>\${nf(r.d)} m &middot; \${nf(r.c)} $TMF</small><em data-st="\${r.st}">\${mmss(now-r.st)}</em></div>\`:'<div class="lsq"><i class="spin"></i></div>'}).join('');`,
`  box.innerHTML=[0,1,2,3,4,5,6,7,8].map(i=>{const r=LIVE_RUNS[i];if(!r)return'<div class="lsq"><i class="spin"></i></div>';
    const pic=r.pic&&/^https:\\/\\//.test(r.pic)?\`<img class="pic" src="\${esc(r.pic)}" alt="" referrerpolicy="no-referrer" loading="lazy">\`:'<div class="runner">🏃</div>';
    const age=Math.max(0,Math.round((now-r.lb)/1000));
    return\`<div class="lsq on \${i===0?'top1':''}"><span class="rk r\${i+1}">\${i===0?'👑 ':''}LIVE #\${i+1}</span><span class="bd">\${r.rank?'board #'+r.rank:'not ranked yet'}</span>\${pic}<div class="nm">\${esc(r.n||'player')}</div><div class="sc">\${nf(r.sc)}</div>
      <div class="row2"><span><b>\${nf(r.d)}</b> m</span><span><b>\${nf(r.c)}</b> $TMF</span><span>time <b data-st="\${r.st}">\${mmss(now-r.st)}</b></span></div>
      <div class="row2"><span>week best <b>\${nf(r.best)}</b></span><span>runs <b>\${nf(r.runs)}</b></span><span>total <b>\${nf(r.total)}</b></span></div>
      <small>\${esc(r.a)}\${r.x?' &middot; @'+esc(r.x):''} &middot; ping \${age}s ago</small></div>\`}).join('');`);
  rep(`document.querySelectorAll('#live3 em[data-st]').forEach(`, `document.querySelectorAll('#live3 [data-st]').forEach(`);
  rep(`<section class="sec a-green"><h2>🏃 Live Chair Runs <small id="livecount">happening now</small></h2>`, `<section class="sec a-green"><h2>🏃 Live Chair Runs <small id="livecount">happening now · top 9 by live score</small></h2>`);
  rep(`$('#livecount').textContent=d.count?d.count+' running now':'waiting for runs';`, `$('#livecount').textContent=d.count?d.count+' running now'+(d.count>9?' · showing the top 9 by live score':''):'waiting for runs';`);
});

edit('index.html', (rep) => {
  rep(`  /* shown on every visit and every refresh, by design */
  const $1=`, `  /* signed once: remembered in this browser, so returning visitors go straight to the desk */
  try{if(localStorage.getItem('mimu_nda')==='1'){el.remove();return}}catch(e){}
  const $1=`);
  rep(`    doc.classList.add('signed');`, `    doc.classList.add('signed');try{localStorage.setItem('mimu_nda','1')}catch(e){}`);
  rep(`<style>`, `<script>try{if(localStorage.getItem('mimu_nda')==='1')document.documentElement.className+=' nda-ok'}catch(e){}</script>
<style>
.nda-ok #nda{display:none!important}`);
});
console.log('ok');
