$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

$i = $t.IndexOf('/* Alarm app: live campaign countdown')
$j = $t.IndexOf('function buildTop5(root){')
if ($i -lt 0 -or $j -lt 0 -or $j -le $i) { throw 'alarm anchors' }
$new = @'
/* Alarm app: the campaign schedule. The big count is the same one the admin page shows (opens in -> closes in). */
function buildAlarm(root){
  const cell=(id,l)=>`<div><b id="${id}">00</b><i>${l}</i></div>`;
  const STEPS=[
    {k:'open',t:'Campaign opens',when:'Sat Oct 10 &middot; 9:00 PM ET',alt:'6:00 PM PT',d:'<b>Start gaming.</b> Chair Run and Mutual Mimu are open for play, and every run earns you $TMF and points.'},
    {k:'stop',t:'Gaming stops',when:'Tue Oct 13 &middot; 6:00 AM PT',alt:'9:00 AM ET',d:'<b>No more Chair Runs and no more acquiring points.</b> Your score and $TMF total are final from here.'},
    {k:'give',t:'24-hour donation window',when:'Tue 6:00 AM PT to Wed 9:00 AM ET',alt:'exactly 24 hours',d:'For 24 hours, players can <b>donate their $TMF to the top 9</b> in the Top 9 app to help them finish higher.'},
    {k:'close',t:'Campaign closes',when:'Wed Oct 14 &middot; 9:00 AM ET',alt:'6:00 AM PT',d:'<b>The end.</b> The campaign is over and the final standings stand.'}];
  root.innerHTML=`<div class="sc"><div class="ah"><div><h1>Alarm</h1><div class="sub">campaign schedule</div></div><div class="sp"></div><span class="tag" id="al-ph"></span></div>
    <div class="scroll" style="padding-bottom:30px"><div class="cdw" style="margin-top:2px"><div class="cdh"><span class="cdl" id="al-l"></span></div>
      <div class="cdt">${cell('al-d','days')}<em>:</em>${cell('al-h','hrs')}<em>:</em>${cell('al-m','min')}<em>:</em>${cell('al-s','sec')}</div></div>
     <div class="lbl" style="margin:18px 4px 10px">How it works</div>
     ${STEPS.map((s,i)=>`<div class="alst" id="al-${s.k}" data-n="${i+1}"><span class="chip" id="al-c-${s.k}"></span><h3>${s.t}</h3><div class="wh">${s.when} <span style="color:var(--muted)">&middot; ${s.alt}</span></div><p>${s.d}</p></div>`).join('')}
     <div class="sub2" style="font-size:11.5px;text-align:center;margin-top:4px">Times shown in Eastern (ET) and Pacific (PT).</div></div></div>`;
  const left=ms=>{let s=Math.max(0,Math.floor(ms/1000));const d=Math.floor(s/86400);s-=d*86400;const h=Math.floor(s/3600);s-=h*3600;const m=Math.floor(s/60);return(d?d+'d ':'')+h+'h '+m+'m'};
  const tick=()=>{
    if(!document.body.contains(root))return;
    const now=Date.now(),O=CAMPAIGN.open,A=ALARM_AT,C=CAMPAIGN.close;
    const phase=now<O?'pre':now<A?'game':now<C?'give':'done',pre=phase==='pre',done=phase==='done',target=done?now:pre?O:C;
    $('#al-l',root).textContent=done?'Campaign closed':pre?'Campaign opens in':'Campaign closes in';
    $('#al-ph',root).textContent=({pre:'not open yet',game:'gaming is live',give:'donation window',done:'closed'})[phase];
    let s=Math.max(0,Math.floor((target-now)/1000));
    const d=Math.floor(s/86400);s-=d*86400;const h=Math.floor(s/3600);s-=h*3600;const m=Math.floor(s/60);s-=m*60;
    [['al-d',d],['al-h',h],['al-m',m],['al-s',s]].forEach(([id,v])=>{const e=$('#'+id,root),x=String(v).padStart(2,'0');if(e&&e.textContent!==x)e.textContent=x});
    const st={open:now>=O?'done':'next',stop:now>=A?'done':'next',give:now>=C?'done':now>=A?'now':'next',close:now>=C?'done':'next'};
    if(phase==='game')st.open='now';
    const at={open:O,stop:A,give:A,close:C};
    STEPS.forEach(s=>{
      const el=$('#al-'+s.k,root),c=$('#al-c-'+s.k,root),v=st[s.k];
      el.classList.toggle('done',v==='done');el.classList.toggle('now',v==='now');
      c.textContent=v==='done'?'done':v==='now'?'happening now':'in '+left(at[s.k]-now);
    });
  };
  tick();const iv=setInterval(tick,1000);
  return{destroy(){clearInterval(iv)}};
}
'@
$t = $t.Substring(0, $i) + $new + "`n" + $t.Substring($j)

Swap '.t5.g9{border:2px solid #d9b25f;' '.alst{position:relative;margin:0 0 12px;padding:14px 14px 14px 48px;border-radius:18px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line)}
.alst:before{content:attr(data-n);position:absolute;left:13px;top:15px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:600 12px var(--mono);background:#2b2022;color:var(--muted);border:1px solid var(--line2)}
.alst.done:before{content:"\2713";background:#1f4029;color:var(--up);border-color:#2c6a43}
.alst.now{border:2px solid #e0332f;box-shadow:0 0 16px rgba(224,51,47,.35)}
.alst.now:before{background:#e0332f;color:#fff;border-color:#ff8a80}
.alst h3{margin:0;font:600 15px var(--sans);padding-right:96px}
.alst .wh{margin:3px 0 7px;font:500 11.5px/1.4 var(--mono);color:var(--gold2)}
.alst p{margin:0;font:400 12.5px/1.55 var(--sans);color:var(--muted)}.alst p b{color:var(--cream);font-weight:600}
.alst .chip{position:absolute;right:12px;top:14px;padding:3px 9px;border-radius:999px;border:1px solid var(--line2);font:600 10px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.alst.done .chip{color:var(--up);border-color:#2c6a43}.alst.now .chip{color:#fff;background:#e0332f;border-color:#ff8a80}
.t5.g9{border:2px solid #d9b25f;'
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched index'

# ---- admin: logging out returns to the landing page ----
$p2 = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\admin.html'
$t = [IO.File]::ReadAllText($p2)
Swap "`$('#out').onclick=()=>logout(false);" "`$('#out').onclick=()=>{logout(false);location.replace('./')};"
[IO.File]::WriteAllText($p2, $t, (New-Object Text.UTF8Encoding $false))
'patched admin'
