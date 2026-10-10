// 1) Speed stairs: after the first 3 minutes the top speed rises +0.5 every 3 minutes, from 23 to a ceiling of 30 (reached at minute 42).
// 2) A 10-second RGB disco party on the phone at every 1 million points.
// Safety: the sim carries a VERSION and a run only starts when the game page and the server agree, so a stale page can never submit a mismatched run.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('assets/sim.js', (rep) => {
  rep(`      const target = Math.min(23, 11 + S.dist / 230) * (S.slow > 0 ? .62 : 1);`,
`      /* the first 3 minutes ramp exactly as before (11 + 1 per 230 m, up to 23). After that the top speed steps up +0.5 every 3 minutes, to a ceiling of 30 at minute 42, so long runs keep tightening. */
      const stairs = Math.min(7, .5 * Math.floor(S.tick / 10800));
      const target = (Math.min(23, 11 + S.dist / 230) + stairs) * (S.slow > 0 ? .62 : 1);`);
  rep(`  return { create, applyCode, ACT, DT, ASSETS, CHAIR_H };`, `  /* bump this whenever the rules change: the server only accepts runs from a game page on the same version */
  const VERSION = 2;
  return { create, applyCode, ACT, DT, ASSETS, CHAIR_H, VERSION };`);
});

edit('backend/src/index.js', (rep) => {
  rep(`  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);`,
`  let b = {}; try { b = await req.json(); } catch { /* optional body */ }
  if (Number(b.sv) !== Sim.VERSION) return json(env, req, { error: 'The game was updated. Reload the page to play.', refresh: true }, 409);   // a stale page would play by old rules
  if (!(await humanOk(env, b.cf, clientIp(req)))) return json(env, req, { error: 'human check failed' }, 403);`);
});

edit('backend/test-run.mjs', (rep) => {
  rep(`body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX' })`, `body: JSON.stringify({ wallet: 0, cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: Sim.VERSION })`);
  rep(`body: JSON.stringify({ cf: 'XXXX.DUMMY.TOKEN.XXXX' })`, `body: JSON.stringify({ cf: 'XXXX.DUMMY.TOKEN.XXXX', sv: Sim.VERSION })`);
  rep(`body: JSON.stringify({ wallet: 0 })`, `body: JSON.stringify({ wallet: 0, sv: Sim.VERSION })`);
});

edit('index.html', (rep) => {
  rep(`<script src="assets/sim.js?v=1"></script>`, `<script src="assets/sim.js?v=2"></script>`);

  /* tell the server which game version this page plays by; a mismatch reloads the page instead of playing an uncounted run */
  rep(`API.j('/api/run/start',{method:'POST',body:JSON.stringify({wallet:P.coins,cf})})).catch(()=>null)`,
      `API.j('/api/run/start',{method:'POST',body:JSON.stringify({wallet:P.coins,cf,sv:MimuSim.VERSION})})).catch(e=>(e&&e.status===409&&e.body&&e.body.refresh)?{refresh:true}:null)`);
  rep(`      if(!alive)return;
      if(r&&r.runId){newRun(r.seed,r.wallet);`, `      if(!alive)return;
      if(r&&r.refresh){try{toast('🔄 <span>The game was updated. Reloading so your run counts…</span>',2600)}catch(e){}S.st='idle';setTimeout(()=>location.reload(),1800);return}
      if(r&&r.runId){newRun(r.seed,r.wallet);`);

  /* disco party */
  rep(`  function milestone(m){
    if((P.top||0)<m*1e6){P.top=m*1e6;saveP()}`, `  /* RGB disco party: 10 seconds of colored lights over the phone at every million, then it switches off */
  let discoEl=null,discoT=null;
  function disco(){
    const sc=root.querySelector('.sc');if(!sc)return;
    if(!discoEl||!discoEl.isConnected){discoEl=document.createElement('div');discoEl.className='disco';discoEl.innerHTML='<i class="db b1"></i><i class="db b2"></i><i class="db b3"></i><i class="dfl"></i>';sc.appendChild(discoEl)}
    discoEl.classList.remove('off');void discoEl.offsetWidth;discoEl.classList.add('on');
    clearTimeout(discoT);
    discoT=setTimeout(()=>{if(discoEl){discoEl.classList.add('off');const e=discoEl;setTimeout(()=>{if(e.parentNode)e.remove()},600);discoEl=null}},10000);
  }
  function discoStop(){clearTimeout(discoT);if(discoEl){discoEl.remove();discoEl=null}}
  function milestone(m){
    disco();
    if((P.top||0)<m*1e6){P.top=m*1e6;saveP()}`);
  rep(`  const beatStop=()=>{clearInterval(beatT);beatT=null;clearInterval(fastT);fastT=null};`, `  const beatStop=()=>{clearInterval(beatT);beatT=null;clearInterval(fastT);fastT=null};`);
  rep(`  function gameOver(quit){
    if(S.st==='over')return;S.st='over';beatStop();`, `  function gameOver(quit){
    if(S.st==='over')return;S.st='over';beatStop();discoStop();`);

  rep(`.rbtn.pulse{`, `.disco{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .35s}
.disco.on{opacity:1}.disco.off{opacity:0;transition:opacity .6s}
.disco .db{position:absolute;left:50%;top:-10%;width:150%;height:130%;margin-left:-75%;transform-origin:50% 0;mix-blend-mode:screen;opacity:.5;filter:blur(2px)}
.disco .b1{background:conic-gradient(from 200deg at 50% 0,transparent 0 6%,rgba(255,40,90,.85) 8% 14%,transparent 16% 100%);animation:dsw 3.4s ease-in-out infinite alternate}
.disco .b2{background:conic-gradient(from 165deg at 50% 0,transparent 0 6%,rgba(40,255,120,.8) 8% 14%,transparent 16% 100%);animation:dsw 2.7s ease-in-out infinite alternate-reverse}
.disco .b3{background:conic-gradient(from 185deg at 50% 0,transparent 0 6%,rgba(60,120,255,.85) 8% 14%,transparent 16% 100%);animation:dsw 4.1s ease-in-out infinite alternate}
.disco .dfl{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,0,110,.22),rgba(0,255,170,.14) 50%,rgba(70,90,255,.26));animation:dhue 2.4s linear infinite;mix-blend-mode:screen}
@keyframes dsw{from{transform:rotate(-26deg)}to{transform:rotate(26deg)}}
@keyframes dhue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.disco .db{animation:none}.disco .dfl{animation:none}}
.rbtn.pulse{`);
});
console.log('ok');
