$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---------- global: player texts state, polling, dock badge ----------
Swap 'const unreadN=()=>MSGS.filter(x=>!(P.mr&&P.mr[x.id])).length;' @'
/* player-to-player texts (live): only after Glyph sign-in */
const PM={unread:0,threads:[],top:null,topAt:0,timer:null,seen:0};
const unreadN=()=>MSGS.filter(x=>!(P.mr&&P.mr[x.id])).length+(PM.unread||0);
const pmOn=()=>!!(GATE.ok&&API.token&&API.on());
const pAv=pic=>`<div class="av">${imgTag(safeUrl(pic)?pic:'assets/mimu-icon.jpg')}</div>`;
const tmAgo=ts=>{const s=Math.max(0,Math.floor((Date.now()-ts)/1000));return s<60?'now':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'};
function refreshDockBadge(){
  const b=document.querySelector('.dock .app-i[data-open=msg]');if(!b)return;
  const n=unreadN();let d=b.querySelector('.bd');
  if(n){if(!d){d=document.createElement('i');d.className='bd';b.querySelector('.ic').appendChild(d)}d.textContent=n}else if(d)d.remove();
}
async function pmPoll(){
  if(!pmOn())return;
  try{
    const r=await API.j('/api/messages/threads'),before=PM.unread;
    PM.threads=r.threads||[];PM.unread=r.unread||0;
    if(PM.unread>before&&PM.seen){const t=PM.threads.find(x=>x.unread);toast(`&#128172; <span>New text from <b>${escH(t?t.name:'a player')}</b></span>`,3200)}
    PM.seen=1;refreshDockBadge();if(window._pmList)window._pmList();
  }catch(e){}
}
function startPMPoll(){stopPMPoll();if(!pmOn())return;pmPoll();PM.timer=setInterval(pmPoll,20000)}
function stopPMPoll(){clearInterval(PM.timer);PM.timer=null;PM.unread=0;PM.threads=[];PM.seen=0;refreshDockBadge()}
'@

# ---------- Messages app: demo texts stay exactly as they are; the player section is added below them ----------
$i = $t.IndexOf('function buildMsgs(root){')
$j = $t.IndexOf('function buildPhone(root){')
if ($i -lt 0 -or $j -le $i) { throw 'msgs anchors' }
$r = $t.Substring($i, $j - $i)
function RSwap($a, $b) { if (-not $script:r.Contains($a)) { throw "missing in region: $($a.Substring(0, [Math]::Min(80, $a.Length)))" }; $script:r = $script:r.Replace($a, $b) }

RSwap "`${u?'<i class=`"ud`"></i>':''}</button>``}).join('')}</div></div>``;" "`${u?'<i class=`"ud`"></i>':''}</button>``}).join('')}<div id=`"pmbox`"></div></div></div>``;"
RSwap "`$`$('[data-th]',root).forEach(b=>b.onclick=()=>thread(b.dataset.th));" "`$`$('[data-th]',root).forEach(b=>b.onclick=()=>thread(b.dataset.th));
    inList=true;paintPM();if(pmOn()){loadTop().then(()=>{if(inList)paintPM()});pmPoll()}"
RSwap "return{destroy(){const d=`$('.dock .app-i[data-open=msg] .bd');if(d){const n=unreadN();if(n)d.textContent=n;else d.remove()}}};" "return{destroy(){clearInterval(thrTimer);window._pmList=null;refreshDockBadge()}};"

$live = @'
  /* ---- live chats with other players ---- */
  let inList=true,q='',thrTimer=null;
  const me=()=>P.glyph&&P.glyph.address?P.glyph.address.toLowerCase():'';
  const loadTop=()=>(PM.top&&Date.now()-PM.topAt<60000)?Promise.resolve():API.j('/api/top9').then(d=>{PM.top=d;PM.topAt=Date.now()}).catch(()=>{});
  const paintPM=()=>{
    const box=$('#pmbox',root);if(!box)return;
    if(!pmOn()){box.innerHTML=`<div class="pmh">Leaderboard texts</div><div class="pmlock"><b>&#128274; Locked</b><span>Connect your Glyph in Chair Run to text the other players on the leaderboard.</span></div>`;return}
    const th=PM.threads.map(t=>`<button class="cv" data-pt="${escH(t.with)}" data-nm="${escH(t.name)}" data-pc="${escH(t.picture||'')}">${pAv(t.picture)}<div class="mid"><b>${escH(t.name)}</b><span>${t.mine?'You: ':''}${escH(t.last)}</span></div><div class="tm">${tmAgo(t.ts)}</div>${t.unread?'<i class="ud"></i>':''}</button>`).join('');
    const rows=(PM.top?PM.top.rows:[]).filter(r=>r.id!==me()&&(!q||String(r.name).toLowerCase().includes(q)));
    box.innerHTML=`<div class="pmh">Your chats</div>${th||'<div class="pmem">No chats yet. Pick a player below and say something.</div>'}
      <div class="pmh">Players on the leaderboard</div><div class="pmsr"><input id="pmq" placeholder="search a player" value="${escH(q)}" autocomplete="off"></div>
      <div class="pmlist">${rows.length?rows.slice(0,150).map(r=>`<button class="cv" data-pt="${escH(r.id)}" data-nm="${escH(r.name)}" data-pc="${escH(r.picture||'')}">${pAv(r.picture)}<div class="mid"><b>${escH(r.name)}</b><span>#${r.rank} &middot; ${fmt(r.total)} points${r.top9?' &middot; top 9':''}</span></div><div class="tm">Text</div></button>`).join(''):`<div class="pmem">${PM.top?'No players match.':'Loading players&hellip;'}</div>`}</div>`;
    $$('[data-pt]',box).forEach(b=>b.onclick=()=>{ac();sfx.tap();pmThread(b.dataset.pt,b.dataset.nm,b.dataset.pc)});
    const qi=$('#pmq',box);if(qi)qi.oninput=()=>{q=qi.value.trim().toLowerCase();const pos=qi.selectionStart;paintPM();const n=$('#pmq',root);if(n){n.focus();n.setSelectionRange(pos,pos)}};
  };
  window._pmList=()=>{if(inList)paintPM()};
  const pmThread=(addr,name,pic)=>{
    inList=false;let last=0,blocked=false;
    root.innerHTML=`<div class="sc"><div class="sysh"><button class="bk" id="mb">&lsaquo; Messages</button><div class="ttl" style="margin-right:0">${escH(name)}</div><button class="pmx" id="pmblk">Block</button></div>
      <div class="thr" id="pmthr"></div><div id="pmbot"></div></div>`;
    const thr=$('#pmthr',root),bot=$('#pmbot',root),blk=$('#pmblk',root);
    const bubble=m=>{const d=document.createElement('div');d.className='bub'+(m.mine?' me':'');d.title=new Date(m.ts).toLocaleString();d.textContent=m.body;return d};
    const add=arr=>{if(!arr.length)return;const atEnd=thr.scrollHeight-thr.scrollTop-thr.clientHeight<80;arr.forEach(m=>{thr.appendChild(bubble(m));last=Math.max(last,m.id)});if(atEnd||last===arr[arr.length-1].id)thr.scrollTop=thr.scrollHeight};
    const drawBot=()=>{
      blk.textContent=blocked?'Unblock':'Block';
      bot.innerHTML=blocked?'<div class="pmblocked">You blocked this player. Unblock to text them again.</div>':`<div class="pmdon">Want to help ${escH(name)}? <button id="pmdn">Donate $TMF in Top 9</button></div><div class="pmerr" id="pmerr"></div><div class="pmin"><input id="pmt" maxlength="280" placeholder="Text message" autocomplete="off"><button id="pms">Send</button></div>`;
      if(blocked)return;
      const inp=$('#pmt',root),btn=$('#pms',root),er=$('#pmerr',root);
      $('#pmdn',root).onclick=()=>{goHome();setTimeout(()=>openApp('top5'),700)};
      const send=async()=>{
        const body=inp.value.trim();if(!body)return;
        btn.disabled=true;er.textContent='';
        try{const r=await API.j('/api/messages/send',{method:'POST',body:JSON.stringify({to:addr,body:r0(body)})});inp.value='';add([{id:r.id,ts:r.ts,mine:true,body:r.body}]);sfx.select()}
        catch(e){er.textContent=(e&&e.message)||'Could not send. Try again.'}
        btn.disabled=false;inp.focus();
      };
      const r0=s=>s;
      btn.onclick=send;inp.onkeydown=e=>{if(e.key==='Enter')send()};
    };
    const load=async()=>{
      try{
        const d=await API.j('/api/messages/thread?with='+encodeURIComponent(addr)+'&after='+last);
        if(last===0){thr.innerHTML='';blocked=d.blocked;drawBot()}
        add(d.messages.filter(m=>m.id>last));
        if(last===0&&!d.messages.length)thr.innerHTML=`<div class="dt">Say hi to ${escH(name)}</div>`;
        if(d.messages.some(m=>!m.mine))pmPoll();
      }catch(e){if(last===0)thr.innerHTML='<div class="dt">Could not load this chat. Try again in a moment.</div>'}
    };
    blk.onclick=async()=>{
      if(!blocked&&!confirm('Block '+name+'? They will not be able to text you.'))return;
      try{const r=await API.j('/api/messages/block',{method:'POST',body:JSON.stringify({user:addr,block:!blocked})});blocked=r.blocked;drawBot();if(blocked)thr.innerHTML='';else{last=0;load()}}catch(e){}
    };
    drawBot();load();
    thrTimer=setInterval(()=>{if(document.body.contains(root)&&!blocked)load()},4000);
    $('#mb',root).onclick=()=>{clearInterval(thrTimer);ac();sfx.tap();list();pmPoll()};
    tone(880,0,.08,.04,'sine');
  };

'@
RSwap '  const thread=id=>{' ($live + '  const thread=id=>{')
$t = $t.Substring(0, $i) + $r + $t.Substring($j)

# start/stop polling with the Glyph session
Swap 'GATE.ok=true;syncLocks();applyIdentity();refreshBoards();' 'GATE.ok=true;syncLocks();applyIdentity();refreshBoards();startPMPoll();'
Swap 'P.glyph=null;API.token=null;GATE.ok=false;saveP();syncLocks();' 'P.glyph=null;API.token=null;GATE.ok=false;saveP();syncLocks();stopPMPoll();'

# styles
Swap '.alst{position:relative;' @'
.pmh{font:600 11px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--gold);padding:18px 16px 8px}
.pmem{padding:6px 16px 12px;font:400 13px/1.4 var(--sans);color:var(--muted)}
.pmlock{margin:0 14px;padding:14px;border-radius:16px;border:1px dashed #ffffff22;background:#ffffff08;display:flex;flex-direction:column;gap:4px;opacity:.8}
.pmlock b{font:600 14px var(--sans)}.pmlock span{font:400 12.5px/1.4 var(--sans);color:var(--muted)}
.pmsr{padding:0 14px 8px}.pmsr input{width:100%;padding:10px 14px;border-radius:12px;background:var(--panel);border:1px solid var(--line2);color:var(--cream);font:500 13px var(--mono);outline:0}
.pmlist{max-height:330px;overflow-y:auto;scrollbar-width:thin}
.bub.me{align-self:flex-end;background:linear-gradient(135deg,#e0bb6a,#b0802e);color:#2a1a08;border-radius:20px 20px 6px 20px;font-weight:500}
.pmin{flex:none;display:flex;gap:8px;margin:6px 12px 10px}
.pmin input{flex:1;min-width:0;padding:11px 16px;border-radius:22px;border:1px solid #ffffff22;background:#1a1315;color:var(--cream);font:400 14px var(--sans);outline:0}
.pmin button{padding:0 18px;border-radius:22px;background:linear-gradient(180deg,#f0d28a,#c4962f);color:#2a1a08;font:700 13px var(--sans)}
.pmin button:disabled{opacity:.5}
.pmdon{flex:none;text-align:center;font:400 11.5px var(--sans);color:var(--dim);padding:6px 14px 0}.pmdon button{color:var(--gold2);text-decoration:underline}
.pmerr{flex:none;min-height:14px;text-align:center;font:400 11.5px var(--sans);color:#e0675f;padding:2px 14px 0}
.pmx{font:500 13px var(--sans);color:#ff8a80;padding:6px 4px}
.pmblocked{flex:none;text-align:center;padding:14px;color:var(--muted);font:400 13px var(--sans)}
.alst{position:relative;
'@
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
