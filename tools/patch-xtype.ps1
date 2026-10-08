$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# shared typed-handle box (solid, opaque, with the placeholder text the owner asked for)
Swap '/* Sign in with X: opens X in a small window' @'
const X_RE=/^[A-Za-z0-9_]{1,15}$/;
const xTypeBox=(val)=>`<input id="xtype" maxlength="41" value="${escH(val||'')}" placeholder="type your x handle here" autocomplete="off" autocapitalize="off" spellcheck="false" style="width:100%;padding:14px;border-radius:14px;background:#1a1315;border:1.5px solid rgba(217,178,95,.55);color:#f2e7d0;font:500 15px var(--mono);outline:0;text-align:center"><div style="margin-top:8px;text-align:center"><a href="https://x.com/home" target="_blank" rel="noopener noreferrer" style="color:#9ad1ff;font:500 12px var(--sans)">Open X to find your handle &#8599;</a></div>`;
/* Sign in with X: opens X in a small window
'@

Swap "async check(){if(XL.on!==null)return XL.on;try{XL.on=!!(await API.j('/api/health')).xLogin}catch(e){XL.on=false}return XL.on}," "req:false,async check(){if(XL.on!==null)return XL.on;try{const h=await API.j('/api/health');XL.on=!!h.xLogin;XL.req=!!h.xRequired}catch(e){XL.on=false;XL.req=false}return XL.on},"

# ---- first-visit screen ----
Swap "let pick=0;const handle='mimu_'+Math.floor(1000+Math.random()*9000);" @'
let pick=0;const handle='mimu_'+Math.floor(1000+Math.random()*9000);
  const typedName=()=>`<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="sub2" style="margin-bottom:10px">Type your X <b style="color:var(--cream)">@handle</b>. It becomes your name on every leaderboard.</div>${xTypeBox(P.x&&P.x.handle)}`;
'@
Swap 'if(!XL.on)return `<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="sub2" style="margin-bottom:2px">You&rsquo;re' 'if(XL.req&&!XL.on)return typedName();if(!XL.on)return `<div class="lbl" style="margin:16px 0 6px">Your name</div><div class="sub2" style="margin-bottom:2px">You&rsquo;re'
Swap "const go=`$('#obgo');if(go){const need=XL.on&&!(P.x&&P.x.handle);go.disabled=need;go.style.opacity=need?.45:1}" @'
const go=$('#obgo'),xt=$('#xtype');
    if(go){
      const sync=()=>{const need=xt?!X_RE.test(xt.value.trim().replace(/^@/,'')):(XL.on&&!(P.x&&P.x.handle));go.disabled=need;go.style.opacity=need?.45:1};
      if(xt)xt.oninput=sync;sync();
    }
'@
Swap "startgame(){if(XL.on&&!(P.x&&P.x.handle)){" @'
startgame(){const xt=document.getElementById('xtype');if(xt){const v=xt.value.trim().replace(/^@/,'');if(!X_RE.test(v)){toast('&#128274; <span>Type your X handle first.</span>');return}P.x={handle:v,proof:null,pic:''}}
    if(XL.on&&!(P.x&&P.x.handle)){
'@

# ---- Chair Run gate: typed handle step when real X login is not set up ----
Swap '  /* every player connects their X account once' @'
  /* typed X handle (used until real X login is set up): saved against the wallet, one wallet per handle */
  const askTyped=async()=>{
    const save=async(v)=>{await API.j('/api/x/handle',{method:'POST',body:JSON.stringify({x:v})});P.x={handle:v.replace(/^@/,''),proof:null,pic:''};applyIdentity()};
    if(P.x&&P.x.handle){try{await save(P.x.handle);if(alive())return welcome()}catch(e){if(e.status===409||e.status===400)P.x=null}}
    show(`<div class="gl-gem">${GEM_SVG}</div><h2>Add your <em>X</em> handle</h2>
      <p>Your X <b>@handle</b> becomes your name on every leaderboard.</p>
      ${xTypeBox('')}
      <div class="hint" id="xe" style="min-height:18px;color:#e0675f;margin-top:6px"></div>
      <div class="acts"><button class="btn gold" id="xs" style="padding:16px">Continue</button><button class="btn ghost" id="xh" style="max-width:300px">Back to phone</button></div>`);
    const inp=$('#xtype',root),err=$('#xe',root),btn=$('#xs',root);
    $('#xh',root).onclick=()=>goHome();
    const go=async()=>{
      const v=inp.value.trim().replace(/^@/,'');
      if(!X_RE.test(v)){err.textContent='Type your X handle (letters, numbers and _ only, up to 15).';return}
      btn.disabled=true;err.textContent='';
      try{await save(v);if(alive()){beep(880,.1);welcome()}}catch(e){btn.disabled=false;err.textContent=(e&&e.message)||'Could not save that. Try again.'}
    };
    btn.onclick=go;inp.onkeydown=e=>{if(e.key==='Enter')go()};setTimeout(()=>inp.focus(),300);
  };
  /* every player connects their X account once
'@
Swap 'const askX=async()=>{' 'const askX=async()=>{await XL.check();if(!XL.on)return askTyped();'

[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched index'

# ---- admin: mark typed (unverified) handles ----
$p2 = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\admin.html'
$t = [IO.File]::ReadAllText($p2)
Swap '<td>${xlink(u.x)}</td><td style="font-size:11px">' '<td>${xlink(u.x)}${u.x&&!u.xv?'' <span class="tag warn" title="Typed by the player, not verified by X">typed</span>'':''''}</td><td style="font-size:11px">'
[IO.File]::WriteAllText($p2, $t, (New-Object Text.UTF8Encoding $false))
'patched admin'
