// A run is verified as it is played (a piece every ~33s), so a long, crashed or interrupted run never loses its progress.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('index.html', (rep) => {
  // state
  rep(`inputs=[],runSession=null,verified=false,`, `inputs=[],runSession=null,verified=false,up={from:0,seq:0,busy:false},`);
  rep(`if(r&&r.runId){newRun(r.seed,r.wallet);runSession=r;verified=true}`, `if(r&&r.runId){newRun(r.seed,r.wallet);runSession=r;verified=true;up={from:0,seq:0,busy:false}}`);

  // stream finished 2000-tick pieces while playing (called every beat)
  rep(`    send();beatT=setInterval(send,6000);
  };`, `    send();beatT=setInterval(()=>{send();flushRun()},6000);
  };
  /* upload each completed 2000-tick piece as it happens; the server replays and keeps the state, so nothing is lost if the tab closes or the run is very long */
  async function flushRun(){
    if(!verified||!runSession||!API.token||up.busy)return;
    up.busy=true;
    try{
      while(S.tick-up.from>=2400){
        const to=up.from+2000,part=inputs.filter(i=>i[0]>=up.from&&i[0]<to);
        const r=await API.j('/api/run/chunk',{method:'POST',body:JSON.stringify({runId:runSession.runId,seq:up.seq,to,inputs:part,final:false})});
        if(!r||!r.ok)break;up.from=to;up.seq++;
      }
    }catch(e){}
    up.busy=false;
  }`);

  // the final submit continues from where streaming stopped
  rep(`    const id=runSession.runId,total=S.tick,CH=2000;let from=0,seq=0,res=null;
    const cuts=[];for(let t=0;t<total;t+=CH)cuts.push(Math.min(total,t+CH));if(!cuts.length)cuts.push(0);`,
`    for(let w=0;up.busy&&w<200;w++)await sleep(100);                  /* let an upload that is in flight finish first */
    const id=runSession.runId,total=S.tick,CH=2000;let from=up.from,seq=up.seq,res=null;
    const cuts=[];for(let t=from;t<total;t+=CH)cuts.push(Math.min(total,t+CH));if(!cuts.length)cuts.push(total);`);
  rep(`      if(!r)return {error:'network'};
      from=to;seq++;res=r;`, `      if(!r)return {error:'network'};
      from=to;seq++;up.from=from;up.seq=seq;res=r;`);
  rep(`        catch(e){if(e.status===401||e.status===409||e.status===422||e.status===404)return {error:e.message,status:e.status};await sleep(900*(attempt+1))}`,
      `        catch(e){if(e.status===401||e.status===409||e.status===422||e.status===404||e.status===400)return {error:e.message,status:e.status};await sleep(900*(attempt+1)+(e.status===429?2500:0))}`);
  rep(`      for(let attempt=0;attempt<5&&!r;attempt++){`, `      for(let attempt=0;attempt<8&&!r;attempt++){`);

  // never fail silently: say so, and let the player retry
  rep(`    if(verified&&API.on())submitRun().then(r=>{const e=$('#rkv',root);if(e)e.textContent=r&&r.rank?('#'+r.rank+(r.rank<=5?' · top 5':'')):'—';if(r&&r.final&&r.score!==score)console.warn('server score differs',r.score,score);return refreshBoards()});`,
`    const sendRun=()=>submitRun().then(r=>{const e=$('#rkv',root);
      if(r&&r.final){if(e)e.textContent=r.held?'under review':(r.rank?('#'+r.rank+(r.rank<=5?' · top 5':'')):'saved');if(r.score!==score)console.warn('server score differs',r.score,score);return refreshBoards()}
      if(e){e.innerHTML='not saved yet · <u id="rrt" style="cursor:pointer;color:var(--gold2)">retry</u>';const b=$('#rrt',root);if(b)b.onclick=()=>{e.textContent='…';sendRun()}}
    });
    if(verified&&API.on())sendRun();`);
});

edit('backend/src/index.js', (rep) => {
  rep(`  await env.DB.prepare("UPDATE runs SET status='abandoned', snapshot=NULL WHERE address=?1 AND status='open'").bind(sess.sub).run();   // one live run per player
  const id = hex(16)`, `  await salvageOpenRuns(env, sess.sub, now);                       // an interrupted run keeps the progress the server already verified
  await env.DB.prepare("UPDATE runs SET status='abandoned', snapshot=NULL WHERE address=?1 AND status='open'").bind(sess.sub).run();   // one live run per player
  const id = hex(16)`);
  rep(`async function handleRunStart(env, req) {`, `/* A run whose tab closed or whose last piece never arrived: score it as far as the server verified it (never lose earned progress). */
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

async function handleRunStart(env, req) {`);
});
console.log('ok');
