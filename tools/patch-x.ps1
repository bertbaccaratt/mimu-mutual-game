$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(80, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---- 1. gate: replace the typed-username step with Connect X (verified through X) ----
$i = $t.IndexOf('  /* every player gives an X username once')
$j = $t.IndexOf('  const welcome=()=>{')
if ($i -lt 0 -or $j -lt 0) { throw 'askX anchors' }
$askx = @'
  /* every player connects their X account once (Sign in with X). The X @handle becomes their name everywhere; nothing is typed. */
  const askX=async()=>{
    if(P.x&&P.x.proof){                                   /* connected earlier (first-visit screen): just attach it to this wallet */
      try{await API.j('/api/x/link',{method:'POST',body:JSON.stringify({proof:P.x.proof})});if(alive()){applyIdentity();return welcome()}}catch(e){if(e.status===409)P.x=null;else if(e.status===401)P.x.proof=null}
    }
    show(`<div class="gl-gem">${GEM_SVG}</div><h2>Connect your <em>X</em></h2>
      <p>Your X <b>@handle</b> becomes your name on every leaderboard. We only read your public X profile, we can&rsquo;t post for you, and it takes one tap.</p>
      <div class="hint" id="xe" style="min-height:18px;color:#e0675f"></div>
      <div class="acts"><button class="btn gold" id="xs" style="padding:16px">Connect with X</button><button class="btn ghost" id="xh" style="max-width:300px">Back to phone</button></div>`);
    const err=$('#xe',root),btn=$('#xs',root);
    $('#xh',root).onclick=()=>goHome();
    btn.onclick=async()=>{
      btn.disabled=true;err.textContent='';beep(520);
      try{
        const x=await XL.connect();
        await API.j('/api/x/link',{method:'POST',body:JSON.stringify({proof:x.proof})});
        if(alive()){applyIdentity();beep(880,.1);welcome()}
      }catch(e){if(e&&e.status===409)P.x=null;btn.disabled=false;err.textContent=(e&&e.message)||'Could not connect X. Try again.'}
    };
  };

'@
$t = $t.Substring(0, $i) + $askx + $t.Substring($j)

# ---- 2. gate: the server says whether X is needed; remember an X handle it already knows ----
Swap "else if(r&&!r.x)needX=true}" "else if(r){if(r.x&&(!P.x||P.x.handle!==r.x))P.x={handle:r.x,proof:null,pic:''};if(r.needX)needX=true}}"

# ---- 3. the X helper (popup flow) next to the API client ----
$xl = @'
/* Sign in with X: opens X in a small window, gets back a signed proof of the account (never a typed name) */
const XL={
  on:null,
  async check(){if(XL.on!==null)return XL.on;try{XL.on=!!(await API.j('/api/health')).xLogin}catch(e){XL.on=false}return XL.on},
  connect(){
    return new Promise((res,rej)=>{
      const api=GAME_CONFIG.api.replace(/\/$/,''),w=window.open(api+'/api/x/start?o='+encodeURIComponent(location.origin),'mimu-x','width=520,height=720');
      if(!w)return rej(new Error('The X window was blocked. Allow popups for this site and try again.'));
      let done=false;const apiOrigin=new URL(api).origin;
      const cleanup=()=>{clearInterval(t);window.removeEventListener('message',on)};
      const on=e=>{
        if(e.origin!==apiOrigin||!e.data||e.data.type!=='mimu-x')return;
        done=true;cleanup();
        if(e.data.proof&&/^[A-Za-z0-9_]{1,15}$/.test(String(e.data.x))){P.x={handle:e.data.x,proof:e.data.proof,pic:safeUrl(e.data.pic)?e.data.pic:''};P.handle='@'+P.x.handle;saveP();res(P.x)}
        else rej(new Error(e.data.error==='cancelled'?'X connection cancelled.':'Could not connect X. Try again.'));
      };
      const t=setInterval(()=>{if(w.closed&&!done){cleanup();rej(new Error('The X window was closed before finishing.'))}},500);
      window.addEventListener('message',on);
    });
  }
};

'@
Swap '/* live leaderboards: real players from the API.' ($xl + '/* live leaderboards: real players from the API.')

# ---- 4. name shown everywhere = the X handle once connected ----
Swap "if(P.glyph&&P.glyph.name)P.handle=P.glyph.name;" "if(P.x&&P.x.handle)P.handle='@'+P.x.handle;else if(P.glyph&&P.glyph.name)P.handle=P.glyph.name;"

# ---- 5. first-visit screen: no typing; connect X instead ----
$i = $t.IndexOf('function onboard(){')
$j = $t.IndexOf('function relPos(el)')
$k = $t.IndexOf("function buildHome(anim){")
if ($i -lt 0 -or $k -lt 0) { throw 'onboard anchors' }
# onboard() ends right before buildHome? find end of onboard: the line '  setTimeout(()=>sheet(body),400);' + '}'
$endMark = "  setTimeout(()=>sheet(body),400);`n}"
$e = $t.IndexOf($endMark, $i); $nlLen = $endMark.Length
if ($e -lt 0) { $endMark = "  setTimeout(()=>sheet(body),400);`r`n}"; $e = $t.IndexOf($endMark, $i); $nlLen = $endMark.Length }
if ($e -lt 0) { throw 'onboard end' }
$onb = @'
function onboard(){
  P.mimu=STARTERS[0];P.handle='mimu';ensureRivals();buildHome();
  let pick=0;const handle='mimu_'+Math.floor(1000+Math.random()*9000);
  const nameBlock=()=>{
    if(!XL.on)return `<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="sub2" style="margin-bottom:2px">You&rsquo;re <b style="color:var(--cream)">${handle}</b> for now. It becomes your X @handle once you connect X.</div>`;
    if(P.x&&P.x.handle)return `<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="mono" style="font-size:18px;color:var(--gold2)">@${escH(P.x.handle)} <span style="color:var(--up)">&#10003;</span></div>`;
    return `<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="sub2" style="margin-bottom:10px">Connect your X account. Your X <b style="color:var(--cream)">@handle</b> becomes your name on every leaderboard.</div><button class="btn" id="xcon" style="padding:14px;background:#000;border:1px solid #fff4;color:#fff;font-weight:600">Connect with &#120143;</button><div class="hint" id="xerr" style="min-height:16px;margin-top:6px;color:#e0675f"></div>`;
  };
  const paint=()=>{
    const nb=$('#nameb');if(nb)nb.innerHTML=nameBlock();
    const go=$('#obgo');if(go){const need=XL.on&&!(P.x&&P.x.handle);go.disabled=need;go.style.opacity=need?.45:1}
    const c=$('#xcon');if(c)c.onclick=async()=>{c.disabled=true;const er=$('#xerr');if(er)er.textContent='';try{await XL.connect();sfx.win();paint()}catch(e){c.disabled=false;if(er)er.textContent=(e&&e.message)||'Could not connect X.'}};
  };
  const body=()=>`<div class="lbl" style="color:var(--gold)">Welcome to the building</div><div class="h2" style="font-size:28px;margin:6px 0 4px">Meet your <em>Mimu</em></div>
   <div class="sub2" style="margin-bottom:12px">Caped, three-eyed and fast on his feet. He runs the halls for you, and he is the one at the board table at every closing bell.</div>
   <div style="width:190px;height:190px;margin:0 auto;border-radius:26px;overflow:hidden;border:1.5px solid var(--gold);box-shadow:0 0 0 6px rgba(217,178,95,.08),0 20px 50px rgba(0,0,0,.55),0 0 60px rgba(255,108,240,.18);background:#000">${pcvM(HERO,'ob')}</div>
   <div id="nameb"></div>
   <button class="btn gold" id="obgo" data-act="startgame" style="margin-top:16px;padding:16px">Enter the building</button>`;
  window._ob={set:i=>{pick=i;$$('#layer .mm').forEach((b,j)=>b.classList.toggle('on',j===i))},get:()=>({pick,handle})};
  setTimeout(async()=>{if(API.on())await XL.check();else XL.on=false;sheet(body());paint()},400);
}
'@
$t = $t.Substring(0, $i) + $onb.TrimEnd() + $t.Substring($e + $nlLen)

# ---- 6. start game: use the X handle; refuse until X is connected when X login is on ----
Swap "startgame(){const o=window._ob.get();P.mimu=STARTERS[o.pick];P.handle=(o.handle||'mimu').replace(/[^\w.\-]/g,'').slice(0,16)||'mimu';" "startgame(){if(XL.on&&!(P.x&&P.x.handle)){toast('&#128274; <span>Connect your X account first.</span>');return}const o=window._ob.get();P.mimu=STARTERS[o.pick];P.handle=P.x&&P.x.handle?'@'+P.x.handle:(o.handle||'mimu').replace(/[^\w.\-]/g,'').slice(0,16)||'mimu';"

[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
