$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---------- Top 9 app v2: everyone ranked by total, top 9 in gold frames ----------
$i = $t.IndexOf('/* Top 9 (live): the leaderboard server decides')
$j = $t.IndexOf('function buildTop5Sim(root){')
if ($i -lt 0 -or $j -lt 0) { throw 'top9 anchors' }
$new = @'
/* Top 9 (live): every player ranked by TOTAL score = Chair Run points + $TMF found. The top 9 get gold frames. The server decides who may send. */
function buildTop5(root){
  if(!(API.on()&&!LIVE.failed))return buildTop5Sim(root);
  let st=null,stErr='',q='',T=null;
  const mine=()=>P.glyph&&P.glyph.address?P.glyph.address.toLowerCase():null;
  const loadStatus=()=>{if(!API.token){st=null;return Promise.resolve()}return API.j('/api/send/status').then(s=>{st=s;stErr=''}).catch(e=>{st=null;stErr=e.status===401?'Reconnect Glyph in Chair Run to send.':''})};
  const loadTop=()=>API.j('/api/top9').then(d=>{T=d}).catch(()=>{});
  const draw=()=>{
    const all=T?T.rows:[],me=mine(),can=!!(st&&st.canSend);
    const rows=all.filter(r=>!q||String(r.name).toLowerCase().includes(q));
    const rules=`<div class="card" style="border-color:rgba(217,178,95,.45)"><div class="lbl" style="color:var(--gold)">The rules</div>
      <ul style="margin:8px 0 0 18px;padding:0;font:400 12.5px/1.55 var(--sans);color:var(--muted)">
       <li><b style="color:var(--cream)">Total score = Chair Run points + $TMF found.</b> Everyone is ranked by it.</li>
       <li>The 9 highest totals get <b style="color:var(--gold2)">gold frames</b>. <b style="color:var(--cream)">The top 9 cannot send $TMF.</b></li>
       <li>Anyone outside the top 9 can <b style="color:var(--cream)">give all their $TMF to one top 9 runner</b> to help them, or send any amount to a player who has registered at least 1 $TMF point.</li>
       <li><b style="color:var(--cream)">$TMF given to a top 9 runner boosts them:</b> +2 Chair Run points for every $TMF.</li>
       <li>Gifts are final and can&rsquo;t be taken back. $TMF here is virtual and has no cash value.</li></ul></div>`;
    const status=!API.token?`<div class="card" style="text-align:center"><div class="sub2">Connect your Glyph in <button style="color:var(--gold2);text-decoration:underline" data-go="run">Chair Run</button> to send $TMF.</div></div>`
      :stErr?`<div class="card" style="text-align:center"><div class="sub2">${escH(stErr)}</div></div>`
      :!st?`<div class="card" style="text-align:center"><div class="sub2">Checking your seat&hellip;</div></div>`
      :st.top9?`<div class="card" style="border-color:rgba(224,103,95,.5)"><div class="lbl" style="color:#ff8a80">Sending is locked</div><div class="sub2" style="margin-top:4px">You are <b style="color:var(--cream)">#${st.rank}</b> this week, inside the top 9, so you can&rsquo;t send $TMF. Fall out of the top 9 and the lock lifts.</div></div>`
      :`<div class="card"><div class="row"><div><div class="lbl">Your $TMF to give</div><div class="mono" style="font-size:22px;color:var(--gold2);margin-top:2px">${fmt(st.balance)}</div></div><div class="sp"></div><span class="tag" style="color:var(--up);border-color:var(--up)">${st.balance>0?'you can give':'earn some first'}</span></div>${st.rank?`<div class="sub2" style="margin-top:6px;font-size:12px">You are #${st.rank} with a total of ${fmt(st.total)}.</div>`:''}</div>`;
    const list=!T?`<div class="sub2" style="padding:8px 2px">Loading the leaderboard&hellip;</div>`
      :rows.length?rows.map((r,i)=>{
        const gold=r.top9,isMe=r.id===me;
        const act=isMe?'':gold?`<button class="btn sm ${can?'gold':'ghost'}" data-all="${escH(r.id)}" ${can?'':'disabled'}>Give all</button>`:r.tmf>=1?`<button class="btn sm ${can?'gold':'ghost'}" data-send="${escH(r.id)}" ${can?'':'disabled'}>Send</button>`:'';
        return `<div class="t5 ${gold?'g9':''} ${isMe?'me':''}" style="animation-delay:${Math.min(i,12)*40}ms"><div class="t5rk">${r.rank}</div><div class="av">${avOf({pic:r.picture})}</div>
          <div style="min-width:0;flex:1"><div class="nm">${escH(r.name)}${isMe?' <span class="tag" style="margin-left:4px">you</span>':''}${gold?' <span class="tag" style="color:var(--gold2);border-color:var(--gold)">top 9</span>':''}</div>
          <div class="sm"><b style="color:var(--cream)">${fmt(r.total)}</b> total &middot; ${fmt(r.run)} run + ${fmt(r.tmf)} $TMF</div></div>${act}</div>`}).join('')
      :`<div class="sub2" style="padding:8px 2px">${q?'Nobody matches that name.':'No scores yet. The board fills as people run.'}</div>`;
    root.innerHTML=`<div class="sc"><div class="ah"><div><h1>Top 9</h1><div class="sub">everyone, ranked by total</div></div><div class="sp"></div></div>
      <div class="scroll" style="padding-bottom:30px">${rules}${status}
       <input id="t9q" value="${escH(q)}" placeholder="search a name" autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line2);color:var(--cream);font:500 13px var(--mono);outline:0;margin:6px 0 10px">
       ${list}</div></div>`;
    paintAll();
    const g=$('[data-go=run]',root);if(g)g.onclick=()=>{goHome();setTimeout(()=>openApp('run'),700)};
    const qi=$('#t9q',root);if(qi)qi.oninput=()=>{q=qi.value.trim().toLowerCase();const pos=qi.selectionStart;draw();const n=$('#t9q',root);if(n){n.focus();n.setSelectionRange(pos,pos)}};
    $$('[data-send]',root).forEach(b=>b.onclick=()=>{const r=all.find(x=>x.id===b.dataset.send);if(r){sfx.select();openSend(r,false)}});
    $$('[data-all]',root).forEach(b=>b.onclick=()=>{const r=all.find(x=>x.id===b.dataset.all);if(r){sfx.select();openSend(r,true)}});
  };
  const openSend=(r,giveAll)=>{
    const max=st.balance;
    sheet(`<div class="lbl" style="color:var(--gold)">Top 9 &middot; ${giveAll?'give all your $TMF':'send $TMF'}</div><div class="h2" style="margin:6px 0 10px;font-size:24px">${giveAll?'Give everything to':'Send to'} <em>${escH(r.name)}</em></div>
      <div class="sub2" style="font-size:12.5px;margin-bottom:12px">${giveAll?`You give <b style="color:var(--cream)">${fmt(max)}</b> $TMF, all of it.`:`You can send up to <b style="color:var(--cream)">${fmt(max)}</b>.`} This is final.</div>
      ${r.top9?`<div class="sub2" style="font-size:12.5px;margin:-4px 0 12px;color:var(--gold2)">This runner is in the top 9, so it boosts their score: <b>${giveAll?'+'+fmt(max*2)+' points':'+2 points for every $TMF'}</b>.</div>`:''}
      ${giveAll?'':`<input id="sendamt" type="number" inputmode="numeric" min="1" max="${max}" value="${max}" style="width:100%;padding:13px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line2);color:var(--cream);font:500 17px var(--mono);outline:0;text-align:center">`}
      <div class="hint" id="senderr" style="min-height:18px;color:#e0675f;margin-top:6px"></div>
      <button class="btn gold" id="sendgo" style="padding:15px;margin-top:6px">${giveAll?`Give all ${fmt(max)} $TMF`:'Send $TMF'}</button><button class="btn ghost" data-act="closesheet" style="margin-top:8px">Not now</button>`);
    setTimeout(()=>{
      const go=document.getElementById('sendgo');if(!go)return;
      go.onclick=async()=>{
        const er=document.getElementById('senderr'),amt=giveAll?max:Number(document.getElementById('sendamt').value);
        if(!Number.isInteger(amt)||amt<1||amt>max){er.textContent='Enter a whole number from 1 to '+max+'.';return}
        go.disabled=true;er.textContent='';
        try{
          const res=await API.j('/api/transfer',{method:'POST',body:JSON.stringify({to:r.id,amount:amt})});
          closeSheet();sfx.coin(6);setTimeout(()=>sfx.win(),180);confetti(r.top9?30:0);
          toast(`&hearts; <span>You gave <b>${fmt(amt)} $TMF</b> to <b>${escH(r.name)}</b>.${res&&res.boosted?` Their score is up <b>+${fmt(res.boosted)}</b>.`:''}</span>`,3800);
          await Promise.all([refreshBoards(),loadStatus(),loadTop()]);if(window._t5)window._t5();
        }catch(e){go.disabled=false;er.textContent=(e&&e.message)||'Could not send. Try again.';if(e&&e.body&&e.body.top9){loadStatus().then(()=>{if(window._t5)window._t5()})}}
      };
    },60);
  };
  window._t5=draw;draw();
  Promise.all([loadTop(),loadStatus()]).then(()=>{if(document.body.contains(root))draw()});
  return{destroy(){window._t5=null}};
}
'@
$t = $t.Substring(0, $i) + $new + "`n" + $t.Substring($j)

# gold frames
Swap '.app-i.alarm.ring .ic{background:' '.t5.g9{border:2px solid #d9b25f;background:linear-gradient(180deg,rgba(217,178,95,.16),rgba(217,178,95,.04));box-shadow:0 0 16px rgba(217,178,95,.4),inset 0 0 0 1px rgba(255,236,170,.16)}
.t5.g9 .t5rk{color:#ffe08a}
.app-i.alarm.ring .ic{background:'

# guide + terms wording
Swap 'See the nine runners leading the week. The top 9 cannot send $TMF. Anyone outside the top 9 can send their $TMF to any player who has registered at least 1 $TMF point. $TMF sent to a top 9 runner also boosts their score (+2 points for every $TMF).' 'Every player ranked by total score (Chair Run points + $TMF found), with the top 9 in gold frames. The top 9 cannot send $TMF. Anyone outside the top 9 can give all their $TMF to one top 9 runner to help them (+2 points for every $TMF), or send $TMF to any player who has registered at least 1 $TMF point.'

# ---------- Alarm app: a live countdown, the same count the admin page shows ----------
Swap '<button class="app-i alarm" type="button">' '<button class="app-i alarm" data-open="alarm">'
Swap 'cam:buildCam,set:buildSet})[id](a);' 'cam:buildCam,set:buildSet,alarm:buildAlarm})[id](a);'
Swap 'function buildTop5(root){' @'
/* Alarm app: live campaign countdown (identical to the count on the admin page) */
function buildAlarm(root){
  const cell=(id,l)=>`<div><b id="${id}">00</b><i>${l}</i></div>`;
  root.innerHTML=`<div class="sc"><div class="ah"><div><h1>Alarm</h1><div class="sub">campaign countdown</div></div><div class="sp"></div></div>
    <div class="scroll" style="padding-bottom:30px"><div class="cdw" style="margin-top:6px"><div class="cdh"><span class="cdl" id="al-l"></span></div>
      <div class="cdt">${cell('al-d','days')}<em>:</em>${cell('al-h','hrs')}<em>:</em>${cell('al-m','min')}<em>:</em>${cell('al-s','sec')}</div>
      <div class="sub2" id="al-n" style="margin-top:12px;font-size:12.5px"></div></div>
     <div class="card" style="margin-top:14px"><div class="row"><div class="lbl">Campaign opens</div><div class="sp"></div><b class="mono" style="font-size:12.5px">Sat Oct 10 &middot; 9:00 PM ET</b></div>
      <div class="row" style="margin-top:10px"><div class="lbl">Alarm rings</div><div class="sp"></div><b class="mono" style="font-size:12.5px">Tue Oct 13 &middot; 6:00 AM PT</b></div>
      <div class="row" style="margin-top:10px"><div class="lbl">Campaign closes</div><div class="sp"></div><b class="mono" style="font-size:12.5px">Wed Oct 14 &middot; 9:00 AM ET</b></div></div></div></div>`;
  const tick=()=>{
    if(!document.body.contains(root))return;
    const now=Date.now(),pre=now<CAMPAIGN.open,done=now>=CAMPAIGN.close,target=done?now:pre?CAMPAIGN.open:CAMPAIGN.close;
    $('#al-l',root).textContent=done?'Campaign closed':pre?'Campaign opens in':'Campaign closes in';
    $('#al-n',root).textContent=done?'Thanks for playing.':now>=ALARM_AT?'The alarm is ringing. Closing time is close.':'The alarm rings Tuesday at 6:00 AM Pacific.';
    let s=Math.max(0,Math.floor((target-now)/1000));
    const d=Math.floor(s/86400);s-=d*86400;const h=Math.floor(s/3600);s-=h*3600;const m=Math.floor(s/60);s-=m*60;
    [['al-d',d],['al-h',h],['al-m',m],['al-s',s]].forEach(([id,v])=>{const e=$('#'+id,root),x=String(v).padStart(2,'0');if(e&&e.textContent!==x)e.textContent=x});
  };
  tick();const iv=setInterval(tick,1000);
  return{destroy(){clearInterval(iv)}};
}
function buildTop5(root){
'@
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
