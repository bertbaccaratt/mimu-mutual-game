$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(80, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# red frame + wiggle on hover
Swap 'border:1px solid rgba(217,178,95,.28);box-shadow:0 10px 24px rgba(0,0,0,.3);text-align:center}' 'border:2px solid #e0332f;box-shadow:0 0 0 1px rgba(0,0,0,.45),0 0 18px rgba(224,51,47,.38),0 10px 24px rgba(0,0,0,.3);text-align:center;cursor:default;transform-origin:50% 60%}
.cdw:hover{animation:cdwig .55s ease-in-out infinite}
@keyframes cdwig{0%,100%{transform:rotate(0)}20%{transform:rotate(-2.4deg) translateX(-2px)}40%{transform:rotate(2.4deg) translateX(2px)}60%{transform:rotate(-1.7deg) translateX(-1px)}80%{transform:rotate(1.7deg) translateX(1px)}}
@media(prefers-reduced-motion:reduce){.cdw:hover{animation:none}}'
Swap '.cdw .cdl{color:var(--gold)}' '.cdw .cdl{color:#ff7a70}'

# the widget only exists until the campaign has closed
Swap '   <div class="cdw" id="cdw" aria-live="off">' '   ${Date.now()<CAMPAIGN.close?`<div class="cdw" id="cdw" aria-live="off">'
Swap '<div><b id="cd-s">00</b><i>sec</i></div></div></div></div>' '<div><b id="cd-s">00</b><i>sec</i></div></div></div>`:''}</div>'
Swap "const w=`$('#cdw');if(!w){clearInterval(_cdTimer);return}" "const w=`$('#cdw');if(!w){clearInterval(_cdTimer);return}if(Date.now()>=CAMPAIGN.close){w.remove();clearInterval(_cdTimer);return}"

# two new texts (Messages app only), same green as Hype
Swap "t:'now',g:1,m:['TIMES ALMOST UP! GO GO GO!']}," "t:'now',g:1,m:['TIMES ALMOST UP! GO GO GO!']},
  {id:'bert',n:'Bert',av:'B',bg:'linear-gradient(135deg,#46d36b,#1f8f43)',t:'now',g:1,m:['I AM BERT']},
  {id:'joubrel',n:'Joubrel',av:'J',bg:'linear-gradient(135deg,#46d36b,#1f8f43)',t:'now',g:1,m:['HOLD MY HAND MIMU!']},"

[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched index'

# ---- admin page: campaign strip under the visitor counter ----
$p2 = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\admin.html'
$t = [IO.File]::ReadAllText($p2)
Swap '<span><b id="s-ban">0</b>banned</span></div>' '<span><b id="s-ban">0</b>banned</span></div>
    <div class="camp" id="camp" hidden><span class="cl" id="camp-l"></span><b id="camp-t"></b></div>'
Swap '.xl{color:#9ad1ff}' '.xl{color:#9ad1ff}
.camp{margin:16px auto 0;max-width:520px;padding:10px 16px;border:2px solid #e0332f;border-radius:14px;box-shadow:0 0 16px rgba(224,51,47,.3);background:#120706;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.camp[hidden]{display:none}.camp .cl{color:#ff7a70;font-weight:600}.camp b{font:700 20px var(--cond);letter-spacing:.1em;color:var(--cream);font-variant-numeric:tabular-nums}
.camp.live .cl{color:var(--up)}'
Swap "/* ---------- api ---------- */" @'
/* ---------- campaign countdown (Sat Oct 10 2026 9 PM ET -> Wed Oct 14 2026 9 AM ET); shown until it ends ---------- */
const CAMPAIGN={open:Date.UTC(2026,9,11,1,0,0),close:Date.UTC(2026,9,14,13,0,0)};
function campTick(){
  const el=$('#camp');if(!el)return;const now=Date.now();
  if(now>=CAMPAIGN.close){el.hidden=true;return}
  const pre=now<CAMPAIGN.open,target=pre?CAMPAIGN.open:CAMPAIGN.close;
  let s=Math.floor((target-now)/1000);const d=Math.floor(s/86400);s-=d*86400;const h=Math.floor(s/3600);s-=h*3600;const m=Math.floor(s/60);s-=m*60;
  el.hidden=false;el.classList.toggle('live',!pre);
  $('#camp-l').textContent=pre?'Campaign opens in':'Campaign closes in';
  $('#camp-t').textContent=d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s';
}
setInterval(campTick,1000);

/* ---------- api ---------- */
'@
[IO.File]::WriteAllText($p2, $t, (New-Object Text.UTF8Encoding $false))
'patched admin'
