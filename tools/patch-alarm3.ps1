$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

$i = $t.IndexOf('function buildAlarm(root){')
$j = $t.IndexOf('function buildTop5(root){')
if ($i -lt 0 -or $j -le $i) { throw 'alarm anchors' }
$new = @'
function buildAlarm(root){
  const cell=(id,l)=>`<div><b id="${id}">00</b><i>${l}</i></div>`;
  const STEPS=[
    {k:'open',t:'Campaign opens',when:'Sat Oct 10 &middot; 9:00 PM EST',alt:'6:00 PM PST',d:'<b>Start gaming.</b> Chair Run and Mutual Mimu are open and every run earns $TMF and points.'},
    {k:'stop',t:'Gaming stops',when:'Tue Oct 13 &middot; 6:00 AM PST',alt:'9:00 AM EST',d:'<b>No more Chair Runs and no more acquiring points.</b> Your score and $TMF total are final.'},
    {k:'give',t:'24-hour donation window',when:'Tue 6:00 AM PST to Wed 9:00 AM EST',alt:'24 hours',d:'For 24 hours, players can <b>donate their $TMF to the top 9</b> in the Top 9 app.'},
    {k:'close',t:'Campaign closes',when:'Wed Oct 14 &middot; 9:00 AM EST',alt:'6:00 AM PST',d:'<b>The end.</b> The campaign is over and the final standings stand.'}];
  /* red-framed countdowns that sit between the squares: what is the next thing and how long until it */
  const BETWEEN=[
    {id:'a',label:'Gaming stops in',at:()=>ALARM_AT,done:()=>Date.now()>=ALARM_AT?'Gaming has stopped':''},
    {id:'b',label:'Donation window opens in',at:()=>ALARM_AT,done:()=>Date.now()>=CAMPAIGN.close?'Donation window closed':Date.now()>=ALARM_AT?'Donation window is open':''},
    {id:'c',label:'Campaign closes in',at:()=>CAMPAIGN.close,done:()=>Date.now()>=CAMPAIGN.close?'Campaign closed':''}];
  const step=s=>`<div class="alst" id="al-${s.k}" data-n="${STEPS.indexOf(s)+1}"><span class="chip" id="al-c-${s.k}"></span><h3>${s.t}</h3><div class="wh">${s.when} <span style="color:var(--muted)">&middot; ${s.alt}</span></div><p>${s.d}</p></div>`;
  const between=b=>`<div class="alcd" id="alb-${b.id}"><span class="l">${b.label}</span><b class="v" id="alv-${b.id}">0d 00h 00m 00s</b></div>`;
  root.innerHTML=`<div class="sc alarmsc"><div class="ah"><div><h1>Alarm</h1><div class="sub">campaign schedule</div></div><div class="sp"></div><span class="tag" id="al-ph"></span></div>
    <div class="alfit"><div class="cdw"><div class="cdh"><span class="cdl" id="al-l"></span></div>
      <div class="cdt">${cell('al-d','days')}<em>:</em>${cell('al-h','hrs')}<em>:</em>${cell('al-m','min')}<em>:</em>${cell('al-s','sec')}</div></div>
     ${step(STEPS[0])}${between(BETWEEN[0])}${step(STEPS[1])}${between(BETWEEN[1])}${step(STEPS[2])}${between(BETWEEN[2])}${step(STEPS[3])}
     <div class="alnote">All times in EST and PST.</div></div></div>`;
  const hms=ms=>{let s=Math.max(0,Math.floor(ms/1000));const d=Math.floor(s/86400);s-=d*86400;const h=Math.floor(s/3600);s-=h*3600;const m=Math.floor(s/60);s-=m*60;return d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s'};
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
    BETWEEN.forEach(b=>{const dn=b.done(),box=$('#alb-'+b.id,root);box.classList.toggle('over',!!dn);$('#alv-'+b.id,root).textContent=dn||hms(b.at()-now)});
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

# compact layout so the whole schedule fits on the phone without scrolling
Swap '.t5.g9{border:2px solid #d9b25f;' @'
.alarmsc .alfit{padding:0 14px;display:flex;flex-direction:column;justify-content:space-between;height:calc(100% - 74px)}
.alarmsc .cdw{margin:0 0 7px;padding:7px 12px 8px}
.alarmsc .cdw .cdh{margin-bottom:5px}
.alarmsc .cdw .cdt b{font-size:24px}.alarmsc .cdw .cdt div{min-width:46px}.alarmsc .cdw .cdt i{margin-top:2px}.alarmsc .cdw .cdt em{font-size:20px}
.alarmsc .alst{margin:0;padding:8px 12px 8px 42px;border-radius:14px}
.alarmsc .alst:before{left:10px;top:9px;width:22px;height:22px;font-size:11px}
.alarmsc .alst h3{font-size:13.5px;padding-right:92px}
.alarmsc .alst .wh{margin:1px 0 3px;font-size:10.5px}
.alarmsc .alst p{font-size:11.3px;line-height:1.4}
.alarmsc .alst .chip{top:9px;right:10px;font-size:9px;padding:2px 8px}
.alcd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:7px 10px;padding:6px 12px;border:2px solid #e0332f;border-radius:12px;background:rgba(43,31,33,.62);box-shadow:0 0 0 1px rgba(0,0,0,.45),0 0 14px rgba(224,51,47,.32)}
.alcd .l{font:600 9.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:#ff7a70}
.alcd .v{font:700 15px var(--mono);color:var(--cream);font-variant-numeric:tabular-nums;white-space:nowrap}
.alcd.over{border-color:var(--line2);box-shadow:none}.alcd.over .l{color:var(--muted)}.alcd.over .v{font:600 11px var(--mono);color:var(--muted);letter-spacing:.06em}
.alarmsc .alnote{text-align:center;font:500 10px var(--mono);letter-spacing:.1em;color:var(--muted);margin-top:6px}
.t5.g9{border:2px solid #d9b25f;
'@
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
