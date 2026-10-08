$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

Swap '.app-i.lk{opacity:.5}' '.app-i.lk{opacity:.5}
.app-i[disabled]{opacity:.42;filter:grayscale(1);cursor:not-allowed}
.topbar nav button[disabled]{opacity:.35;cursor:not-allowed;pointer-events:none;filter:grayscale(1)}'

Swap 'function openApp(id,from){' @'
/* Mutual Mimu stays greyed out and closed until the player has connected Glyph (and passed the wallet checks) */
function syncLocks(){
  const lock=!GATE.ok;
  document.querySelectorAll('[data-open=ff]').forEach(b=>{b.disabled=lock;b.classList.toggle('lk',lock);b.setAttribute('aria-disabled',lock?'true':'false');b.title=lock?'Connect Glyph in Chair Run first':''});
  document.querySelectorAll('[data-launch=ff]').forEach(b=>{b.disabled=lock;b.setAttribute('aria-disabled',lock?'true':'false');b.title=lock?'Connect Glyph in Chair Run first':''});
}
function openApp(id,from){
  if(id==='ff'&&!GATE.ok){try{toast('&#128274; <span>Connect your Glyph in <b>Chair Run</b> first.</span>',3000)}catch(e){}return}
'@

Swap 'GATE.ok=true;applyIdentity();refreshBoards();' 'GATE.ok=true;syncLocks();applyIdentity();refreshBoards();'
Swap 'GATE.ok=false;sfx.fail();' 'GATE.ok=false;syncLocks();sfx.fail();'
Swap 'P.glyph=null;API.token=null;GATE.ok=false;saveP();' 'P.glyph=null;API.token=null;GATE.ok=false;saveP();syncLocks();'
Swap "`$`$('[data-launch]').forEach(b=>b.addEventListener('click',()=>launch(b.dataset.launch)));" "`$`$('[data-launch]').forEach(b=>b.addEventListener('click',()=>launch(b.dataset.launch)));syncLocks();"
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched locks'
