// Admin: the top 3 live runs show a live picture of the actual run; any square that changes place jiggles.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

/* ---------------- server ---------------- */
edit('backend/src/index.js', (rep) => {
  rep(`async function handleRunBeat(env, req) {`, `/* a compact picture of the run as it is played (lane, jump, nearby obstacles). Only kept for the admin's live view; never part of the score. */
let LIVE_TABLE = false;
async function liveTable(env) {
  if (LIVE_TABLE) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS live_state (run_id TEXT PRIMARY KEY, state TEXT, at INTEGER NOT NULL DEFAULT 0, watch_until INTEGER NOT NULL DEFAULT 0)').run();
  LIVE_TABLE = true;
}
function cleanState(st) {
  if (!st || typeof st !== 'object') return null;
  const num = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const ob = Array.isArray(st.ob) ? st.ob.slice(0, 48).filter((a) => Array.isArray(a)).map((a) => [String(a[0]).slice(0, 1), Math.round(num(a[1], -1.5, 1.5) * 100) / 100, Math.round(num(a[2], -5, 120) * 10) / 10, num(a[3], 0, 9) | 0]) : [];
  return { l: Math.round(num(st.l, -1.5, 1.5) * 100) / 100, y: Math.round(num(st.y, 0, 8) * 100) / 100, s: st.s ? 1 : 0, v: Math.round(num(st.v, 0, 80) * 10) / 10, d: num(st.d, 0, 9999999) | 0, lv: num(st.lv, 0, 9) | 0, sh: st.sh ? 1 : 0, mg: num(st.mg, 0, 30) | 0, x2: num(st.x2, 0, 30) | 0, ch: num(st.ch, 0, 99999) | 0, cm: num(st.cm, 1, 9) | 0, ob };
}
async function handleRunBeat(env, req) {`);
  rep(`    .bind(Date.now(), n(b.score, 99999999), n(b.dist, 9999999), n(b.coins, 9999999), b.runId, sess.sub).run();
  return json(env, req, { ok: true });`, `    .bind(Date.now(), n(b.score, 99999999), n(b.dist, 9999999), n(b.coins, 9999999), b.runId, sess.sub).run();
  let w = 0;
  try {                                                              // the live picture is best effort: it can never get in the way of the beat itself
    const st = cleanState(b.st);
    if (st) {
      await liveTable(env);
      const row = await env.DB.prepare('INSERT INTO live_state(run_id,state,at) SELECT ?1,?2,?3 WHERE EXISTS (SELECT 1 FROM runs WHERE id=?1 AND address=?4 AND status=\\'open\\') ON CONFLICT(run_id) DO UPDATE SET state=?2, at=?3 RETURNING watch_until')
        .bind(b.runId, JSON.stringify(st), Date.now(), sess.sub).first();
      w = row && row.watch_until > Date.now() ? 1 : 0;              // 1 = the admin is looking at this run right now, so send pictures faster
    }
  } catch (e) { console.error('live state', String(e && e.message || e)); }
  return json(env, req, { ok: true, w });`);
  rep(`    return out({ now: Date.now(), count: rows.length, runs: nine });`, `    try {                                                              // the top 3 get a live picture of the run itself
      await liveTable(env);
      const top3 = nine.slice(0, 3), now = Date.now();
      if (top3.length) {
        await env.DB.batch(top3.map((r) => env.DB.prepare('INSERT INTO live_state(run_id,state,at,watch_until) VALUES(?1,NULL,0,?2) ON CONFLICT(run_id) DO UPDATE SET watch_until=?2').bind(r.id, now + 20000)));
        const sel = await env.DB.prepare(\`SELECT run_id, state, at FROM live_state WHERE run_id IN (\${top3.map((_, i) => '?' + (i + 1)).join(',')})\`).bind(...top3.map((r) => r.id)).all();
        const m = {}; for (const s of (sel.results || [])) m[s.run_id] = s;
        for (const r of top3) { const s = m[r.id]; if (s && s.state) { try { r.st = JSON.parse(s.state); r.sat = s.at; } catch { /* skip */ } } }
      }
      if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM live_state WHERE at<?1 AND watch_until<?1').bind(Date.now() - 3600000).run();
    } catch (e) { console.error('live pictures', String(e && e.message || e)); }
    return out({ now: Date.now(), count: rows.length, runs: nine });`);
});

/* ---------------- game: send the picture with each beat, faster while watched ---------------- */
edit('index.html', (rep) => {
  rep(`  let beatT=null;
  const beatStop=()=>{clearInterval(beatT);beatT=null};`, `  let beatT=null,fastT=null;
  const beatStop=()=>{clearInterval(beatT);beatT=null;clearInterval(fastT);fastT=null};
  /* a small picture of the run for the admin's live view: lane, jump, and the nearest obstacles */
  const snap=()=>{
    const ob=[];for(const o of S.obj){if(o.dead)continue;const dz=o.z-S.dist;if(dz<-3||dz>70)continue;
      const c=o.t==='chair'?'c':o.t==='banner'?'b':o.t==='coin'?'o':o.t==='pick'?(o.k==='magnet'?'m':o.k==='shield'?'s':'x'):o.t==='gate'?'g':null;if(!c)continue;
      ob.push([c,+o.x.toFixed(2),+dz.toFixed(1),o.type|0])}
    ob.sort((a,b)=>a[2]-b[2]);
    return{l:+S.px.toFixed(2),y:+S.py.toFixed(2),s:S.slide>0?1:0,v:+S.speed.toFixed(1),d:Math.floor(S.dist),lv:S.lives,sh:S.shield>0?1:0,mg:S.magnet>0?Math.ceil(S.magnet):0,x2:S.mult>0?Math.ceil(S.mult):0,ch:S.chain,cm:S.cm,ob:ob.slice(0,48)};
  };`);
  rep(`    const send=()=>{if(S.st!=='run'&&S.st!=='revive')return;API.j('/api/run/beat',{method:'POST',body:JSON.stringify({runId:runSession.runId,score:Math.floor(S.score),dist:Math.floor(S.dist),coins:S.coins})}).catch(()=>{})};
    send();beatT=setInterval(()=>{send();flushRun()},6000);`, `    const send=()=>{if(S.st!=='run'&&S.st!=='revive')return;
      API.j('/api/run/beat',{method:'POST',body:JSON.stringify({runId:runSession.runId,score:Math.floor(S.score),dist:Math.floor(S.dist),coins:S.coins,st:snap()})})
        .then(r=>{if(r&&r.w){if(!fastT)fastT=setInterval(send,500)}else if(fastT){clearInterval(fastT);fastT=null}}).catch(()=>{})};
    send();beatT=setInterval(()=>{send();flushRun()},6000);`);
});

/* ---------------- admin ---------------- */
edit('admin.html', (rep) => {
  rep(`.lsq .pic{`, `.lsq .gv{width:100%;aspect-ratio:370/230;border-radius:12px;border:1px solid #1f8f4a;background:#0b0608;display:block;margin:20px 0 4px}
.lsq.hasgv{justify-content:flex-start;padding-top:8px}
@keyframes jig{0%{transform:translate(0,0) rotate(0)}12%{transform:translate(-7px,2px) rotate(-1.8deg)}28%{transform:translate(7px,-3px) rotate(1.8deg)}44%{transform:translate(-5px,2px) rotate(-1.2deg)}60%{transform:translate(5px,-2px) rotate(1deg)}78%{transform:translate(-2px,1px) rotate(-.4deg)}100%{transform:translate(0,0) rotate(0)}}
.lsq.jig{animation:jig .95s ease-in-out}
.lsq.jig.up{box-shadow:0 0 44px rgba(255,194,51,.85);border-color:var(--gold)}
.lsq .pic{`);

  rep(`let LIVE_RUNS=[],LIVE_INIT=false;const LIVE_SEEN=new Set();`, `let LIVE_RUNS=[],LIVE_INIT=false;const LIVE_SEEN=new Set();
const LIVE_SLOT={},LIVE_GFX={};let LIVE_POLLED=0,LIVE_NOW=0;
const RUNNER=new Image();RUNNER.src='assets/runner.webp';`);

  rep(`  box.innerHTML=[0,1,2,3,4,5,6,7,8].map(i=>{const r=LIVE_RUNS[i];if(!r)return'<div class="lsq"><i class="spin"></i></div>';`, `  const moved={};
  LIVE_RUNS.slice(0,9).forEach((r,i)=>{if(LIVE_SLOT[r.id]!=null&&LIVE_SLOT[r.id]!==i)moved[r.id]=LIVE_SLOT[r.id]>i?'up':'down'});
  box.innerHTML=[0,1,2,3,4,5,6,7,8].map(i=>{const r=LIVE_RUNS[i];if(!r)return'<div class="lsq"><i class="spin"></i></div>';`);
  rep(`    return\`<div class="lsq on \${i===0?'top1':''}"><span class="rk r\${i+1}">`, `    const gv=i<3?\`<canvas class="gv" width="370" height="230" data-rid="\${esc(r.id)}"></canvas>\`:'';
    return\`<div class="lsq on \${i===0?'top1':''} \${i<3?'hasgv':''} \${moved[r.id]?'jig '+moved[r.id]:''}"><span class="rk r\${i+1}">`);
  rep(`<span class="bd">\${r.rank?'board #'+r.rank:'not ranked yet'}</span>\${pic}`, `<span class="bd">\${r.rank?'board #'+r.rank:'not ranked yet'}</span>\${gv}\${i<3?'':pic}`);
  rep(`      <small>\${esc(r.a)}\${r.x?' &middot; @'+esc(r.x):''} &middot; ping \${age}s ago</small></div>\`}).join('');`, `      <small>\${esc(r.a)}\${r.x?' &middot; @'+esc(r.x):''} &middot; ping \${age}s ago</small></div>\`}).join('');
  Object.keys(LIVE_SLOT).forEach(k=>delete LIVE_SLOT[k]);LIVE_RUNS.slice(0,9).forEach((r,i)=>{LIVE_SLOT[r.id]=i});
  LIVE_RUNS.slice(0,3).forEach(r=>{if(r.st)LIVE_GFX[r.id]={st:r.st,age:Math.max(0,LIVE_NOW-r.sat)}});`);
  rep(`  try{const d=await call('live');LIVE_RUNS=d.runs||[];`, `  try{const d=await call('live');LIVE_RUNS=d.runs||[];LIVE_POLLED=Date.now();LIVE_NOW=d.now||Date.now();`);
  rep(`setInterval(pollLive,4000);`, `setInterval(pollLive,2000);

/* ---------- live picture of the top 3 runs (redrawn from the run's real state, a couple of times a second) ---------- */
(function(){
  const CH=2.6,F=170,HZ=58,CX=185,D0=4;
  const CHAIR=['#8a5a2b','#a8472f','#5c6f8a','#6b8a4a','#b08a2f','#7a4a8a','#c0662f','#d9d9e0'];
  function draw(cv,g){
    const c=cv.getContext('2d'),W=370,H=230;
    c.clearRect(0,0,W,H);
    let gr=c.createLinearGradient(0,0,0,HZ+10);gr.addColorStop(0,'#0f080a');gr.addColorStop(1,'#3a1c20');c.fillStyle=gr;c.fillRect(0,0,W,HZ+10);
    c.fillStyle='#1a0f12';c.fillRect(0,HZ,W,H-HZ);
    const el=(g?(Date.now()-LIVE_POLLED+g.age)/1000:0),st=g?g.st:null;
    const sp=st?st.v:0,dist=st?st.d+sp*el:0;
    const proj=(x,y,dz)=>{const s=F/Math.max(.6,dz);return[CX+x*s,HZ+(CH-y)*s,s]};
    /* road: carpet bands that scroll with the distance run */
    for(let dz=70;dz>1.6;dz-=1.6){
      const a=dz,b=dz-1.6,band=Math.floor((dist+dz)/1.6)&1,fog=Math.min(1,dz/70);
      const quad=(xl,xr,col,al)=>{const p1=proj(xl,0,a),p2=proj(xr,0,a),p3=proj(xr,0,b),p4=proj(xl,0,b);c.globalAlpha=al;c.fillStyle=col;c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.lineTo(p4[0],p4[1]);c.closePath();c.fill()};
      quad(-3,3,band?'#cdbda3':'#b9a98f',1-fog*.7);quad(-1.66,1.66,'#d9b25f',1-fog*.7);quad(-1.5,1.5,band?'#7a2430':'#5f1b26',1-fog*.65);
    }
    c.globalAlpha=1;
    /* side walls */
    for(const sx of [-1,1]){const n=proj(sx*3,0,3),f=proj(sx*3,0,70),nt=proj(sx*3,3.6,3),ft=proj(sx*3,3.6,70);c.fillStyle='#24141a';c.beginPath();c.moveTo(n[0],n[1]);c.lineTo(f[0],f[1]);c.lineTo(ft[0],ft[1]);c.lineTo(nt[0],nt[1]);c.closePath();c.fill()}
    if(!st){c.fillStyle='#a7c9b4';c.font='600 13px monospace';c.textAlign='center';c.fillText('waiting for the run\\u2026',CX,HZ+60);return}
    /* things on the road, far to near */
    const obs=st.ob.map(o=>[o[0],o[1],o[2]-sp*el,o[3]]).filter(o=>o[2]>.7).sort((a,b)=>b[2]-a[2]);
    for(const [t,x,dz,ty] of obs){
      if(dz>70)continue;const s=F/dz,al=Math.min(1,(70-dz)/18+.25);c.globalAlpha=al;
      if(t==='c'){const w=.8*s,h=(.7+ (ty%4)*.12)*s,p=proj(x,0,dz);c.fillStyle=CHAIR[ty%CHAIR.length];c.fillRect(p[0]-w/2,p[1]-h,w,h);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(p[0]-w/2,p[1]-h,w,h*.25);c.fillStyle='#1a0f12';c.fillRect(p[0]-w/2,p[1]-h*.12,w*.12,h*.12);c.fillRect(p[0]+w/2-w*.12,p[1]-h*.12,w*.12,h*.12)}
      else if(t==='b'){const w=.95*s,p=proj(x,2.6,dz);c.fillStyle='#8b2e35';c.fillRect(p[0]-w/2,p[1],w,1.5*s);c.strokeStyle='#d9b25f';c.lineWidth=Math.max(1,s*.05);c.strokeRect(p[0]-w/2,p[1],w,1.5*s)}
      else if(t==='o'){const p=proj(x,.6,dz),r=Math.max(1.5,.22*s);c.fillStyle='#f0c64a';c.beginPath();c.arc(p[0],p[1],r,0,6.3);c.fill();c.strokeStyle='#8a6a14';c.lineWidth=1;c.stroke()}
      else if(t==='g'){const p1=proj(-3,3.4,dz),p2=proj(3,3.4,dz),p3=proj(-3,0,dz);c.fillStyle='rgba(155,123,255,.35)';c.fillRect(p1[0],p1[1],p2[0]-p1[0],(p3[1]-p1[1]));c.strokeStyle='#b99bff';c.lineWidth=Math.max(1.5,s*.06);c.strokeRect(p1[0],p1[1],p2[0]-p1[0],(p3[1]-p1[1]))}
      else{const p=proj(x,.9,dz);c.font=Math.max(10,.9*s)+'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(t==='m'?'\\ud83d\\udd14':t==='s'?'\\ud83d\\udcbc':'\\u2728',p[0],p[1])}
    }
    c.globalAlpha=1;
    /* the runner */
    const rp=proj(st.l,st.y,D0),sz=1.25*rp[2],sq=st.s?.55:1;
    c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(proj(st.l,0,D0)[0],proj(st.l,0,D0)[1],sz*.32,sz*.09,0,0,6.3);c.fill();
    if(st.sh){c.strokeStyle='rgba(122,200,255,.9)';c.lineWidth=2.5;c.beginPath();c.arc(rp[0],rp[1]-sz*.45,sz*.55,0,6.3);c.stroke()}
    if(RUNNER.complete&&RUNNER.naturalWidth){const h=sz*sq,w=sz*.8;c.drawImage(RUNNER,rp[0]-w/2,rp[1]-h,w,h)}else{c.fillStyle='#ffe9c4';c.fillRect(rp[0]-9,rp[1]-26*sq,18,26*sq)}
    /* readout */
    c.textBaseline='alphabetic';c.textAlign='left';c.fillStyle='rgba(0,0,0,.45)';c.fillRect(0,0,W,22);
    c.fillStyle='#ffe9c4';c.font='700 12px monospace';c.fillText('\\u2764'.repeat(Math.max(0,st.lv))+(st.sh?'  \\ud83d\\udcbc':'')+(st.mg?'  \\ud83d\\udd14'+st.mg:'')+(st.x2?'  \\u2728x2 '+st.x2:''),8,15);
    c.textAlign='right';c.fillStyle='#7dffa8';c.fillText('chain '+st.ch+'  x'+st.cm,W-8,15);
  }
  let last=0;
  function loop(ts){
    requestAnimationFrame(loop);
    if(document.hidden||ts-last<66)return;last=ts;
    document.querySelectorAll('canvas.gv').forEach(cv=>draw(cv,LIVE_GFX[cv.dataset.rid]));
  }
  requestAnimationFrame(loop);
})();`);
});
console.log('ok');
