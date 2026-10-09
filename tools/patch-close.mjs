// Chair Run closed (greyed out, no new runs), no pause, and logins kept across reloads.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep, () => t); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('backend/src/index.js', (rep) => {
  rep(`  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);`,
`  if (env.CHAIR_RUN_OPEN === '0') return json(env, req, { error: 'Chair Run is closed. Thanks for playing! Your scores and login are saved.', closed: true }, 403);   // runs already in progress can still finish and count
  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);`);
});
edit('backend/wrangler.toml', (rep) => {
  rep(`X_REQUIRED = "1"`, `CHAIR_RUN_OPEN = "0"   # "0" = Chair Run is closed (no new runs). Runs already in progress still finish and count. Remove or set "1" to reopen.
X_REQUIRED = "1"`);
});

edit('index.html', (rep) => {
  /* the switch (set to true to reopen the game for new runs) */
  rep(`const GATE={ok:false};`, `const GATE={ok:false};
const CHAIR_RUN_OPEN=false;   /* Chair Run is closed: the tile is greyed out and no new runs start. Login, scores and the other apps stay as they are. */
/* keep players signed in across reloads: the server's own 12-hour session token is remembered in this browser */
const SESS_KEY='mimu_sess';
function saveSess(tok,exp,addr){try{localStorage.setItem(SESS_KEY,JSON.stringify({t:tok,e:exp,a:String(addr||'').toLowerCase()}))}catch(e){}}
function clearSess(){try{localStorage.removeItem(SESS_KEY)}catch(e){}}
function restoreSess(){
  try{
    const s=JSON.parse(localStorage.getItem(SESS_KEY)||'null');
    if(!s||!s.t||!(s.e>Date.now()+60000))return false;
    if(!P||!P.glyph||!P.glyph.address||String(P.glyph.address).toLowerCase()!==s.a)return false;
    API.token=s.t;GATE.ok=true;return true;
  }catch(e){return false}
}`);
  rep(`    API.token=r.token;return r;`, `    API.token=r.token;saveSess(r.token,r.expiresAt,addr);return r;`);
  rep(`  P.glyph=null;API.token=null;GATE.ok=false;saveP();syncLocks();stopPMPoll();`, `  P.glyph=null;API.token=null;GATE.ok=false;clearSess();saveP();syncLocks();stopPMPoll();`);
  /* a 401 means the session ended */
  rep(`if(e.status===401){API.token=null;GATE.ok=false;try{toast(`, `if(e.status===401){API.token=null;GATE.ok=false;clearSess();try{toast(`);

  /* startup: restore the session after the saved state is loaded */
  rep(`P=loadP()||defaultP();if(API.on())refreshBoards()`, `P=loadP()||defaultP();if(restoreSess()){try{syncLocks();startPMPoll()}catch(e){}}
if(API.on())refreshBoards()`);

  /* greyed tile */
  rep(`<button class="app-i\${a.id==='ff'&&!GATE.ok?' lk':''}" data-open="\${a.id}"`, `<button class="app-i\${(a.id==='ff'&&!GATE.ok)||(a.id==='run'&&!CHAIR_RUN_OPEN)?' lk':''}" data-open="\${a.id}"`);
  rep(`.app-i.lk{opacity:.5}`, `.app-i.lk{opacity:.5}
.app-i.lk[data-open=run] .ic{filter:grayscale(1)}
.closed-card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:70px 26px 60px;text-align:center;background:radial-gradient(circle at 50% 0,#2a1519,#120a0c)}
.closed-card h2{font:600 28px var(--serif);margin:0}.closed-card p{margin:0;color:var(--muted);font:400 14px/1.5 var(--sans);max-width:300px}
.closed-card .lock{width:74px;height:74px;border-radius:22px;display:grid;place-items:center;font-size:34px;background:#2a2024;border:1px solid var(--line2);filter:grayscale(1)}`);

  /* the app: closed card instead of the game */
  rep(`function buildRun(root){
  const ctl={inner:null,dead:false,destroy(){ctl.dead=true;if(ctl.inner&&ctl.inner.destroy)ctl.inner.destroy()}};
  if(GATE.ok){ctl.inner=buildRunGame(root);return ctl}
  runGate(root,ctl,()=>{ctl.inner=buildRunGame(root)});
  return ctl;
}`, `function buildRun(root){
  const ctl={inner:null,dead:false,destroy(){ctl.dead=true;if(ctl.inner&&ctl.inner.destroy)ctl.inner.destroy()}};
  const closed=()=>{
    root.innerHTML=\`<div class="sc"><div class="closed-card"><div class="lock">\\u{1FA91}</div><h2>Chair Run is closed</h2>
      <p>Thanks for running the halls. Your scores, your login and your $TMF are saved. Mutual Mimu, the Top 5, the leaderboards and your texts are still open.</p>
      <button class="btn gold" id="crh" style="max-width:260px">Back to the phone</button></div></div>\`;
    const b=root.querySelector('#crh');if(b)b.onclick=()=>goHome();
  };
  if(!CHAIR_RUN_OPEN){
    if(GATE.ok){closed();return ctl}
    runGate(root,ctl,closed);                                   /* signing in still works, so the other apps can unlock */
    return ctl;
  }
  if(GATE.ok){ctl.inner=buildRunGame(root);return ctl}
  runGate(root,ctl,()=>{ctl.inner=buildRunGame(root)});
  return ctl;
}`);
  rep(`<div class="acts"><button class="btn gold" id="ge" style="padding:16px">Enter the halls</button>`, `<div class="acts"><button class="btn gold" id="ge" style="padding:16px">\${CHAIR_RUN_OPEN?'Enter the halls':'Continue'}</button>`);

  /* no pause: remove the button, the keys and the auto pause */
  rep(`<div class="rbtn" id="rps" style="margin-left:0"><svg viewBox="0 0 16 16"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg></div>`, ``);
  rep(`  $('#rps',root).onclick=()=>pause();\n`, ``);
  rep(`else if(e.key==='Escape'||e.key==='p')pause()};`, `};`);
  rep(`  function pause(){
    if(S.st==='run'){S.st='paused';`, `  function pause(){
    return;   /* no pausing in Chair Run */
    if(S.st==='run'){S.st='paused';`);
  rep(`  const vis=()=>{if(document.hidden)pause()};document.addEventListener('visibilitychange',vis);`, `  const vis=()=>{};`);
  rep(`    if(S.st==='run')pause();
    if(!P.howSeen){`, `    if(S.st==='run')return;                                   /* the guide is for before a run, since the game cannot be paused */
    if(!P.howSeen){`);
});
console.log('ok');
