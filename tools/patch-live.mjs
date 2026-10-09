// Live Chair Run squares (server + admin + game heartbeat), admin "Glyph + username" wording, wrong-number YouTube clip then hang up.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function edit(file, fn) {
  const p = root + file; let t = fs.readFileSync(p, 'utf8');
  const re = (a) => new RegExp(a.split('\n').map(esc).join('\\r?\\n'));
  const api = {
    rep(a, b) { if (!re(a).test(t)) throw new Error(file + ' missing: ' + a.slice(0, 80)); t = t.replace(re(a), () => b); },
    get t() { return t; }, set t(v) { t = v; },
  };
  fn(api); fs.writeFileSync(p, t);
}

/* ---------------- server ---------------- */
edit('backend/src/index.js', (e) => {
  e.rep("/* ---------- player-to-player texts (the Messages app) ----------", `/* ---------- live runs: the game pings every few seconds while a run is in progress (display only, never counts for score) ---------- */
async function handleRunBeat(env, req) {
  const sess = await readToken(env, req);
  if (!sess) return json(env, req, { error: 'sign in first' }, 401);
  if (await limited(env, 'RL_RUN', sess.sub)) return tooMany(env, req);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  if (typeof b.runId !== 'string' || !/^[0-9a-f]{32}$/.test(b.runId)) return json(env, req, { error: 'bad request' }, 400);
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  await env.DB.prepare("UPDATE runs SET last_beat=?1, live_score=?2, live_dist=?3, live_coins=?4 WHERE id=?5 AND address=?6 AND status='open'")
    .bind(Date.now(), n(b.score, 99999999), n(b.dist, 9999999), n(b.coins, 9999999), b.runId, sess.sub).run();
  return json(env, req, { ok: true });
}

/* ---------- player-to-player texts (the Messages app) ----------`);
  e.rep("      if (url.pathname === '/api/messages/threads' && req.method === 'GET') return handleMsgThreads(env, req);", "      if (url.pathname === '/api/run/beat' && req.method === 'POST') return handleRunBeat(env, req);\n      if (url.pathname === '/api/messages/threads' && req.method === 'GET') return handleMsgThreads(env, req);");
  e.rep("if (url.pathname.startsWith('/api/admin/')) { if (await limited(env, 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAdmin(env, req, url); }",
        "if (url.pathname.startsWith('/api/admin/')) { if (await limited(env, url.pathname === '/api/admin/live' ? 'RL_READ' : 'RL_AUTH', clientIp(req))) return tooMany(env, req); return handleAdmin(env, req, url); }");
  e.rep("  if (path === 'dashboard' && req.method === 'GET') {", `  if (path === 'live' && req.method === 'GET') {                       // runs happening right now (a ping in the last 25 seconds), newest first
    const since = Date.now() - 25000;
    const rows = (await env.DB.prepare("SELECT r.id, p.name n, r.started_at st, COALESCE(r.last_beat, r.started_at) lb, COALESCE(r.live_score,0) sc, COALESCE(r.live_dist,0) d, COALESCE(r.live_coins,0) c FROM runs r LEFT JOIN players p ON p.address=r.address WHERE r.status='open' AND COALESCE(r.last_beat, r.started_at)>?1 ORDER BY lb DESC").bind(since).all()).results || [];
    return out({ now: Date.now(), count: rows.length, runs: rows.slice(0, 3) });
  }
  if (path === 'dashboard' && req.method === 'GET') {`);
});

/* ---------------- admin page ---------------- */
edit('admin.html', (e) => {
  e.rep("Glyph + X'", "Glyph + username'");
  e.rep('<small id="ucount">Glyph + X</small>', '<small id="ucount">Glyph + username</small>');
  e.rep('<th>X account</th>', '<th>Username</th>');
  e.rep('.xl{color:#9ad1ff}', `.xl{color:#9ad1ff}
.live3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:16px}
.lsq{aspect-ratio:1;border-radius:18px;border:3px solid #e0332f;background:#140808;box-shadow:0 0 18px rgba(224,51,47,.28);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px;text-align:center;overflow:hidden;transition:border-color .3s,background .3s,box-shadow .3s}
.lsq.on{border-color:#2fd36b;background:#07140b;box-shadow:0 0 24px rgba(47,211,107,.42)}
.lsq .nm{font:600 12px var(--mono);color:var(--cream);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsq .sc{font:700 clamp(26px,4.2vw,44px)/1 var(--cond);color:#7dffa8;font-variant-numeric:tabular-nums}
.lsq small{font:500 10px var(--mono);color:var(--muted);letter-spacing:.06em}
.lsq em{font:600 11px var(--mono);color:#7dffa8;font-style:normal;letter-spacing:.1em}
.lsq .pulse{width:9px;height:9px;border-radius:50%;background:#2fd36b;box-shadow:0 0 10px #2fd36b;animation:pulse 1.4s infinite}
.spin{width:34px;height:34px;border-radius:50%;border:3px solid #4a1d1b;border-top-color:#e0332f;animation:spin 1s linear infinite;display:block}
@keyframes spin{to{transform:rotate(360deg)}}`);
  e.rep('  <section class="sec"><h2>Players <small id="ucount">', '  <section class="sec"><h2>Players <small id="ucount">'); // anchor check
  // live squares go at the very bottom of the page
  e.t = e.t.replace(/(\s*<\/div>\s*<\/div>\s*<div class="toast")/, `\n\n  <section class="sec"><h2>Live Chair Runs <small id="livecount">happening now</small></h2><div class="live3" id="live3"></div></section>$1`);
  if (!e.t.includes('id="live3"')) throw new Error('live section not placed');
  e.rep("/* ---------- actions ---------- */", `/* ---------- live Chair Run squares: green = a run is happening, red = empty (spinner) ---------- */
let LIVE_RUNS=[];
function paintLive(){
  const box=$('#live3');if(!box)return;
  const now=Date.now(),mmss=ms=>{const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  box.innerHTML=[0,1,2].map(i=>{const r=LIVE_RUNS[i];return r?\`<div class="lsq on"><span class="pulse"></span><div class="nm">\${esc(r.n||'player')}</div><div class="sc">\${nf(r.sc)}</div><small>\${nf(r.d)} m &middot; \${nf(r.c)} $TMF</small><em data-st="\${r.st}">\${mmss(now-r.st)}</em></div>\`:'<div class="lsq"><i class="spin"></i></div>'}).join('');
}
async function pollLive(){
  if($('#app').hidden||document.hidden)return;
  try{const d=await call('live');LIVE_RUNS=d.runs||[];$('#livecount').textContent=d.count?d.count+' running now':'waiting for runs';paintLive()}catch(e){}
}
setInterval(()=>{document.querySelectorAll('#live3 em[data-st]').forEach(el=>{const s=Math.max(0,Math.floor((Date.now()-Number(el.dataset.st))/1000));el.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')})},1000);
setInterval(pollLive,4000);

/* ---------- actions ---------- */`);
  e.rep("  campTick();\n  refresh();", "  campTick();\n  refresh();pollLive();");
});

/* ---------------- game page ---------------- */
edit('index.html', (e) => {
  // CSP: YouTube's player API (only fetched when someone dials a wrong number)
  e.rep("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com;", "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com;");
  // heartbeat while a run is in progress
  e.rep("  function gameOver(quit){\n    if(S.st==='over')return;S.st='over';", `  let beatT=null;
  const beatStop=()=>{clearInterval(beatT);beatT=null};
  const beatStart=()=>{
    beatStop();if(!verified||!runSession||!API.token)return;
    const send=()=>{if(S.st!=='run'&&S.st!=='revive')return;API.j('/api/run/beat',{method:'POST',body:JSON.stringify({runId:runSession.runId,score:Math.floor(S.score),dist:Math.floor(S.dist),coins:S.coins})}).catch(()=>{})};
    send();beatT=setInterval(send,6000);
  };
  function gameOver(quit){
    if(S.st==='over')return;S.st='over';beatStop();`);
  e.rep("      S.st='run';acc=0;last=performance.now();setTimeout(()=>{hud.cn.innerHTML=''},700);", "      S.st='run';acc=0;last=performance.now();setTimeout(()=>{hud.cn.innerHTML=''},700);beatStart();");
  e.rep("return{destroy(){alive=false;cancelAnimationFrame(raf);", "return{destroy(){alive=false;beatStop();cancelAnimationFrame(raf);");

  // wrong number: the YouTube clip plays inside the phone, then the call hangs up
  e.rep(".callb", `.callov{position:absolute;inset:0;z-index:20;background:radial-gradient(420px 360px at 50% 0%,#3a1a20,transparent 70%),#0c0909;display:flex;flex-direction:column;align-items:center;padding:92px 20px 26px;gap:12px;text-align:center}
.callov .cn{font:300 34px var(--sans);letter-spacing:.02em}
.callov .cs{font:500 13px var(--sans);color:#ff8a80}
.callov .ytw{width:100%;max-width:352px;height:200px;border-radius:14px;overflow:hidden;background:#000;border:1px solid var(--line2)}
.callov .ytw iframe{width:100%;height:100%;display:block;border:0}
.callov .cm{font:500 13px/1.4 var(--sans);color:var(--cream);max-width:300px}
.callov .cend{margin-top:auto;width:76px;height:76px;border-radius:50%;background:#e0332f;color:#fff;font:700 11px var(--sans);display:grid;place-items:center;box-shadow:0 8px 20px rgba(224,51,47,.4)}
.callb`);
  e.rep("  cl.onclick=()=>{\n    if(calling){clearTimeout(tm);calling=false;cl.classList.remove('end');ds.innerHTML='&nbsp;';return}", `  /* a wrong number plays the "not a working number" recording (YouTube's own embedded player, visible) and then hangs up when it ends */
  let hangNow=null;
  const loadYT=()=>{
    if(window.YT&&window.YT.Player)return Promise.resolve(true);
    if(window._ytReady)return window._ytReady;
    window._ytReady=new Promise(res=>{
      const prev=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{if(prev)try{prev()}catch(e){}res(true)};
      const s=document.createElement('script');s.src='https://www.youtube.com/iframe_api';s.onerror=()=>{window._ytReady=null;res(false)};document.head.appendChild(s);
      setTimeout(()=>res(false),7000);
    });
    return window._ytReady;
  };
  const resetCall=()=>{calling=false;cl.classList.remove('end');ds.innerHTML='&nbsp;'};
  const wrongNumber=()=>{
    const ov=document.createElement('div');ov.className='callov';
    ov.innerHTML='<div class="cn"></div><div class="cs">Call failed</div><div class="ytw"><div id="ytp"></div></div><div class="cm">We&rsquo;re sorry, but the number you dialed is not the right number. Keep trying.</div><button class="cend" type="button">End call</button>';
    ov.querySelector('.cn').textContent=dn.textContent;root.appendChild(ov);
    let done=false,player=null,fell=false,watchdog=null;
    const hang=()=>{if(done)return;done=true;clearTimeout(watchdog);hangNow=null;try{if(player&&player.destroy)player.destroy()}catch(e){}ov.remove();num='';dn.textContent='';resetCall();tone(480,0,.14,.04);tone(380,.17,.2,.04)};
    hangNow=hang;ov.querySelector('.cend').onclick=hang;
    const fallback=()=>{if(done||fell)return;fell=true;try{if(player&&player.destroy)player.destroy()}catch(e){}ov.querySelector('.ytw').style.display='none';tone(950,0,.3,.05);tone(1400,.34,.3,.05);tone(1800,.68,.3,.05);setTimeout(hang,6500)};
    watchdog=setTimeout(fallback,9000);
    loadYT().then(ok=>{
      if(done||fell)return;
      if(!ok||!window.YT||!window.YT.Player)return fallback();
      player=new window.YT.Player('ytp',{videoId:'UqHUEGWNzQQ',width:'100%',height:'200',playerVars:{autoplay:1,controls:1,rel:0,playsinline:1,modestbranding:1,fs:0,disablekb:1,iv_load_policy:3},
        events:{onReady:ev=>{try{ev.target.unMute();ev.target.setVolume(100);ev.target.playVideo()}catch(x){}},
          onStateChange:ev=>{if(ev.data===1)clearTimeout(watchdog);if(ev.data===0)hang()},onError:()=>fallback()}});
    });
  };
  cl.onclick=()=>{
    if(calling){clearTimeout(tm);if(hangNow)hangNow();else resetCall();return}`);
  e.rep("tm=setTimeout(()=>{ds.innerHTML='<span style=\"color:#ff9d8a\">We&rsquo;re sorry, but the number you dialed is not the right number. Keep trying.</span>';tone(950,0,.3,.05);tone(1400,.34,.3,.05);tone(1800,.68,.3,.05);calling=false;cl.classList.remove('end');setTimeout(()=>{if(!calling)ds.innerHTML='&nbsp;'},9000)},2800);", "loadYT();tm=setTimeout(wrongNumber,2800);");
  e.rep("return{destroy(){clearTimeout(tm)}};", "return{destroy(){clearTimeout(tm);if(hangNow)hangNow()}};");
  e.rep("Our servers do not store your IP address or your location.", "Our servers do not store your IP address or your location. If you dial a wrong number in the phone app, a short clip plays from YouTube's embedded player, and YouTube's own privacy policy applies to that clip.");
});
console.log('ok');
