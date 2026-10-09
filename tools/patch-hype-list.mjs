// The Hype box picks the player from a scrollable list instead of a typed name.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/admin.html';
let t = fs.readFileSync(p, 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rep = (a, b) => { const re = new RegExp(a.split('\n').map(esc).join('\\r?\\n')); if (!re.test(t)) throw new Error('missing: ' + a.slice(0, 80)); t = t.replace(re, () => b); };

rep(`    <input type="text" id="h-to" list="h-list" placeholder="Pick a username, like @name" autocomplete="off" spellcheck="false">
    <datalist id="h-list"></datalist>`, `    <div class="hpick"><div class="hpl"><span id="h-who">Pick a player below</span><input type="text" id="h-filter" placeholder="filter" autocomplete="off" spellcheck="false"></div><div class="hlist" id="h-list" role="listbox" aria-label="Players"></div></div>`);

rep('.hypebox .hrow{', `.hypebox .hpick{border:1px solid #1f6b3e;border-radius:12px;background:#0c1f14;margin-bottom:9px;overflow:hidden}
.hypebox .hpl{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #174d2c;font:600 12px var(--mono);color:#7dffa8}
.hypebox .hpl span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hypebox .hpl input{width:96px;margin:0;padding:5px 8px;font-size:11px}
.hypebox .hlist{max-height:176px;overflow-y:auto;scrollbar-width:thin}
.hypebox .hrowp{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:8px 10px;border-bottom:1px solid #123a22;cursor:pointer}
.hypebox .hrowp:hover{background:#12301e}.hypebox .hrowp.sel{background:#1a4a2c;box-shadow:inset 3px 0 0 #46d36b}
.hypebox .hrowp i{flex:none;width:26px;height:26px;border-radius:50%;background:#1f8f43;color:#fff;display:grid;place-items:center;font:700 12px var(--sans);font-style:normal;overflow:hidden}
.hypebox .hrowp i img{width:100%;height:100%;object-fit:cover}
.hypebox .hrowp b{flex:1;min-width:0;font:600 12.5px var(--mono);color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hypebox .hrowp small{font:500 10px var(--mono);color:var(--muted);white-space:nowrap}
.hypebox .hempty{padding:14px;text-align:center;color:var(--muted);font-size:12px}
.hypebox .hrow{`);

// replace the old send handler and datalist filler
const a = t.indexOf('/* ---------- Hype texts: one player at a time ---------- */');
const b = t.indexOf('/* ---------- actions ---------- */');
if (a < 0 || b <= a) throw new Error('hype js anchors');
t = t.slice(0, a) + `/* ---------- Hype texts: pick one player from the list ---------- */
let HYPE_TO=null;
function paintHypeList(){
  const box=$('#h-list');if(!box)return;
  const f=($('#h-filter').value||'').trim().toLowerCase();
  const users=((DATA&&DATA.users)||[]).filter(u=>!u.banned&&(!f||String(u.n||'').toLowerCase().includes(f)||String(u.g||'').toLowerCase().includes(f)));
  $('#h-count').textContent=((DATA&&DATA.users)||[]).length+' players';
  box.innerHTML=users.length?users.map(u=>\`<button type="button" class="hrowp\${u.a===HYPE_TO?' sel':''}" role="option" data-hp="\${esc(u.a)}"><i>\${u.pic&&/^https:\\/\\//.test(u.pic)?\`<img src="\${esc(u.pic)}" alt="" referrerpolicy="no-referrer" loading="lazy">\`:esc(String(u.n||'?').replace('@','')[0]||'?').toUpperCase()}</i><b>\${esc(u.n)}</b><small>\${u.x?'':'no username yet'}</small></button>\`).join(''):'<div class="hempty">'+(((DATA&&DATA.users)||[]).length?'Nobody matches that filter.':'No players yet. They appear here as they sign in with Glyph.')+'</div>';
  const cur=((DATA&&DATA.users)||[]).find(u=>u.a===HYPE_TO);
  $('#h-who').textContent=cur?'To: '+cur.n:'Pick a player below';
}
$('#h-filter').oninput=paintHypeList;
$('#h-list').addEventListener('click',e=>{const b=e.target.closest('[data-hp]');if(!b)return;HYPE_TO=b.dataset.hp;paintHypeList()});
$('#h-body').oninput=()=>{$('#h-n').textContent=$('#h-body').value.length+' / 280'};
$('#h-send').onclick=async()=>{
  const body=$('#h-body').value.trim(),st=$('#h-st');
  const u=((DATA&&DATA.users)||[]).find(x=>x.a===HYPE_TO);
  st.style.color='var(--bad)';
  if(!u){st.textContent='Pick a player from the list first.';return}
  if(!body){st.textContent='Type a message first.';return}
  const b=$('#h-send');b.disabled=true;st.style.color='var(--muted)';st.textContent='Sending…';
  try{
    const r=await call('hype',{method:'POST',body:JSON.stringify({to:u.a,body})});
    st.style.color='var(--up)';st.textContent='Sent to '+r.to+' as Hype. It is waiting in their Messages.';
    $('#h-body').value='';$('#h-n').textContent='0 / 280';refresh();
  }catch(err){st.style.color='var(--bad)';st.textContent=err.message}
  b.disabled=false;
};

` + t.slice(b);

// refresh the list whenever the dashboard refreshes (new players show up as they sign in)
rep(`  $('#h-list').innerHTML=d.users.slice(0,500).map(u=>\`<option value="\${esc(u.n)}" label="\${esc(short(u.a))}"></option>\`).join('');`, '  paintHypeList();');
fs.writeFileSync(p, t);
console.log('ok');
