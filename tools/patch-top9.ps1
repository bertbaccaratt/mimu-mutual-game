$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---------- names: Top 5 -> Top 9 ----------
Swap '<button data-launch="top5">Top 5</button>' '<button data-launch="top5">Top 9</button>'
Swap "{id:'top5',n:'Top 5'," "{id:'top5',n:'Top 9',"
Swap 'font-size="10.5" fill="#fff3d0" stroke="none" text-anchor="middle">5</text>' 'font-size="10.5" fill="#fff3d0" stroke="none" text-anchor="middle">9</text>'
Swap '<div><b>Top 5</b><span>See the five runners leading the week. Backing a runner with your $TMF is coming soon.</span></div>' '<div><b>Top 9</b><span>See the nine runners leading the week. The top 9 cannot send $TMF. Anyone outside the top 9 can send their $TMF to any player who has registered at least 1 $TMF point.</span></div>'
$lq = [string][char]0x201C; $rq = [string][char]0x201D; $ap = [string][char]0x2019
Swap ('The only way to give coins away is the in-game ' + $lq + 'Top 5' + $rq + ' app; those gifts are virtual and final.') ('The only way to give coins away is the in-game ' + $lq + 'Top 9' + $rq + ' app: the top 9 runners of the week cannot send, and anyone outside the top 9 can send to any player who has registered at least 1 $TMF point. Those gifts are virtual and final.')
Swap "You have given `${fmt(P.patron)} `$TMF to top-five runners." "You have given `${fmt(P.patron)} `$TMF to other players."
Swap "Give your `$TMF to a top-five runner in the Top 5 app to become a patron." "Send `$TMF to another player in the Top 9 app to become a patron."

# ---------- the Top 9 app ----------
$i = $t.IndexOf('function buildTop5(root){')
$j = $t.IndexOf('function openBack(idx){')
if ($i -lt 0 -or $j -lt 0) { throw 'top5 anchors' }
$old = $t.Substring($i, $j - $i)
# keep the old (simulated) version for when the leaderboard server cannot be reached, renamed and widened to nine
$sim = $old.Replace('function buildTop5(root){', 'function buildTop5Sim(root){').Replace('.slice(0,5)', '.slice(0,9)').Replace('<h1>Top 5</h1>', '<h1>Top 9</h1>').Replace('The top five appear once', 'The top nine appear once').Replace(('This week' + $ap + 's top five'), ('This week' + $ap + 's top nine')).Replace('anyone in the top five', 'anyone in the top nine').Replace('someone in the top five', 'someone in the top nine').Replace('i===4&&!r.me', 'i===8&&!r.me').Replace('This week&rsquo;s <em>top five</em>', 'This week&rsquo;s <em>top nine</em>')
$sim = $sim.Replace("if(API.on())refreshBoards().then(ok=>{if(ok&&document.body.contains(root))draw()});", "")
$new = @'
/* Top 9 (live): the leaderboard server decides who may send and to whom; this screen just shows the rules and the people */
function buildTop5(root){
  if(!(API.on()&&!LIVE.failed))return buildTop5Sim(root);
  let st=null,stErr='',q='';
  const mine=()=>P.glyph&&P.glyph.address?P.glyph.address.toLowerCase():null;
  const loadStatus=()=>{if(!API.token){st=null;return Promise.resolve()}return API.j('/api/send/status').then(s=>{st=s;stErr=''}).catch(e=>{st=null;stErr=e.status===401?'Reconnect Glyph in Chair Run to send.':''})};
  const draw=()=>{
    const rows=board('run').slice(0,9),recips=(LIVE.nw&&LIVE.nw.rows?LIVE.nw.rows:[]).filter(r=>r.id!==mine()&&(!q||String(r.name).toLowerCase().includes(q)));
    const can=!!(st&&st.canSend);
    const rules=`<div class="card" style="border-color:rgba(217,178,95,.45)"><div class="lbl" style="color:var(--gold)">The rules</div>
      <ul style="margin:8px 0 0 18px;padding:0;font:400 12.5px/1.55 var(--sans);color:var(--muted)">
       <li><b style="color:var(--cream)">The top 9 runners cannot send $TMF</b> to anyone.</li>
       <li><b style="color:var(--cream)">Anyone outside the top 9</b> can send their $TMF to any player who has registered <b style="color:var(--cream)">at least 1 $TMF point</b> this week.</li>
       <li>The $TMF you send comes out of your &ldquo;$TMF found&rdquo; total and goes into theirs.</li>
       <li>Gifts are final and can&rsquo;t be taken back. $TMF here is virtual and has no cash value.</li></ul></div>`;
    const status=!API.token?`<div class="card" style="text-align:center"><div class="sub2">Connect your Glyph in <button style="color:var(--gold2);text-decoration:underline" data-go="run">Chair Run</button> to send $TMF.</div></div>`
      :stErr?`<div class="card" style="text-align:center"><div class="sub2">${escH(stErr)}</div></div>`
      :!st?`<div class="card" style="text-align:center"><div class="sub2">Checking your seat&hellip;</div></div>`
      :st.top9?`<div class="card" style="border-color:rgba(224,103,95,.5)"><div class="lbl" style="color:#ff8a80">Sending is locked</div><div class="sub2" style="margin-top:4px">You are <b style="color:var(--cream)">#${st.rank}</b> this week, inside the top 9, so you can&rsquo;t send $TMF. Fall out of the top 9 and the lock lifts.</div></div>`
      :`<div class="card"><div class="row"><div><div class="lbl">Your $TMF to send</div><div class="mono" style="font-size:22px;color:var(--gold2);margin-top:2px">${fmt(st.balance)}</div></div><div class="sp"></div><span class="tag" style="color:var(--up);border-color:var(--up)">${st.balance>0?'you can send':'earn some first'}</span></div>${st.rank?`<div class="sub2" style="margin-top:6px;font-size:12px">You are #${st.rank} this week.</div>`:''}</div>`;
    const top=rows.length?rows.map((r,i)=>`<div class="t5 ${r.me?'me':''} ${i===0?'first':''}" style="animation-delay:${i*50}ms"><div class="t5rk">${i+1}</div><div class="av">${avOf(r)}</div>
      <div style="min-width:0;flex:1"><div class="nm">${escH(r.name)}${r.me?' <span class="tag" style="margin-left:4px">you</span>':''}</div><div class="sm">${fmt(r.v)} pts${i===8&&!r.me?'<br><span style="color:var(--up)">closest to falling out</span>':''}</div></div><span class="tag">can&rsquo;t send</span></div>`).join('')
      :'<div class="card" style="text-align:center"><div class="h2" style="font-size:18px">No runners yet</div><div class="sub2" style="margin-top:4px">The top nine appear once the first scores land.</div></div>';
    const list=recips.length?recips.slice(0,60).map(r=>`<div class="t5" style="padding:10px 12px"><div class="av">${avOf({pic:r.picture})}</div><div style="min-width:0;flex:1"><div class="nm">${escH(r.name)}</div><div class="sm">${fmt(r.v)} $TMF registered</div></div>
      <button class="btn sm ${can?'gold':'ghost'}" data-send="${escH(r.id)}" ${can?'':'disabled'}>Send</button></div>`).join(''):`<div class="sub2" style="padding:6px 2px">${q?'Nobody matches that name.':'Nobody has registered a $TMF point yet.'}</div>`;
    root.innerHTML=`<div class="sc"><div class="ah"><div><h1>Top 9</h1><div class="sub">this week&rsquo;s leaders</div></div><div class="sp"></div></div>
      <div class="scroll" style="padding-bottom:30px">${rules}${status}
       <div class="lbl" style="margin:14px 4px 8px">This week&rsquo;s top 9</div>${top}
       <div class="lbl" style="margin:16px 4px 8px">Send $TMF to a player</div>
       <input id="t9q" value="${escH(q)}" placeholder="search a name" autocomplete="off" style="width:100%;padding:11px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line2);color:var(--cream);font:500 13px var(--mono);outline:0;margin-bottom:8px">
       <div id="t9l">${list}</div></div></div>`;
    paintAll();
    const g=$('[data-go=run]',root);if(g)g.onclick=()=>{goHome();setTimeout(()=>openApp('run'),700)};
    const qi=$('#t9q',root);if(qi)qi.oninput=()=>{q=qi.value.trim().toLowerCase();const pos=qi.selectionStart;draw();const n=$('#t9q',root);if(n){n.focus();n.setSelectionRange(pos,pos)}};
    $$('[data-send]',root).forEach(b=>b.onclick=()=>{const r=(LIVE.nw.rows||[]).find(x=>x.id===b.dataset.send);if(r){sfx.select();openSend(r)}});
  };
  const openSend=r=>{
    const max=st.balance;
    sheet(`<div class="lbl" style="color:var(--gold)">Top 9 &middot; send $TMF</div><div class="h2" style="margin:6px 0 10px;font-size:24px">Send to <em>${escH(r.name)}</em></div>
      <div class="sub2" style="font-size:12.5px;margin-bottom:12px">They have <b style="color:var(--cream)">${fmt(r.v)}</b> $TMF registered. You can send up to <b style="color:var(--cream)">${fmt(max)}</b>. This is final.</div>
      <input id="sendamt" type="number" inputmode="numeric" min="1" max="${max}" value="${max}" style="width:100%;padding:13px 14px;border-radius:14px;background:var(--panel);border:1px solid var(--line2);color:var(--cream);font:500 17px var(--mono);outline:0;text-align:center">
      <div class="hint" id="senderr" style="min-height:18px;color:#e0675f;margin-top:6px"></div>
      <button class="btn gold" id="sendgo" style="padding:15px;margin-top:6px">Send $TMF</button><button class="btn ghost" data-act="closesheet" style="margin-top:8px">Not now</button>`);
    setTimeout(()=>{
      const go=document.getElementById('sendgo');if(!go)return;
      go.onclick=async()=>{
        const amt=Number(document.getElementById('sendamt').value),er=document.getElementById('senderr');
        if(!Number.isInteger(amt)||amt<1||amt>max){er.textContent='Enter a whole number from 1 to '+max+'.';return}
        go.disabled=true;er.textContent='';
        try{
          const res=await API.j('/api/transfer',{method:'POST',body:JSON.stringify({to:r.id,amount:amt})});
          closeSheet();sfx.coin(6);setTimeout(()=>sfx.win(),180);
          toast(`&hearts; <span>You sent <b>${fmt(amt)} $TMF</b> to <b>${escH(r.name)}</b>.</span>`,3600);
          await refreshBoards();await loadStatus();if(window._t5)window._t5();
        }catch(e){go.disabled=false;er.textContent=(e&&e.message)||'Could not send. Try again.';if(e&&e.body&&e.body.top9){loadStatus().then(()=>{if(window._t5)window._t5()})}}
      };
    },60);
  };
  window._t5=draw;draw();
  refreshBoards().then(()=>{if(document.body.contains(root))draw()});loadStatus().then(()=>{if(document.body.contains(root))draw()});
  return{destroy(){window._t5=null}};
}
'@
$t = $t.Substring(0, $i) + $new + "`n" + $sim + $t.Substring($j)

# ---------- Mutual Mimu stays greyed out until Glyph is connected ----------
# home grid: the Mutual Mimu tile is disabled until the wallet is connected and approved
Swap '${APPS.map(a=>`<button class="app-i" data-open="${a.id}">' '${APPS.map(a=>`<button class="app-i${a.id===''ff''&&!GATE.ok?'' lk'':''''}" data-open="${a.id}"${a.id===''ff''&&!GATE.ok?'' disabled aria-disabled="true" title="Connect Glyph in Chair Run first"'':''''}>'
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched part 1'
