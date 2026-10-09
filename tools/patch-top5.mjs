// Top 9 -> Top 5 everywhere, leaderboard thresholds, Top 5 app mechanics (live refresh, fresh checks, give-all), dialer message.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const must = (s) => { const re = new RegExp(s.split('\n').map(esc).join('\\r?\\n')); if (!re.test(t)) throw new Error('missing: ' + s.slice(0, 90)); };
const rep = (a, b) => { must(a); const re = new RegExp(a.split('\n').map(esc).join('\\r?\\n'), 'g'); t = t.replace(re, () => b); };

// ---------- wording and numbers ----------
rep('Top 9', 'Top 5'); rep('top 9', 'top 5'); rep('top nine', 'top five'); rep('The 9 highest', 'The 5 highest');
rep('font-size="10.5" fill="#fff3d0" stroke="none" text-anchor="middle">9</text>', 'font-size="10.5" fill="#fff3d0" stroke="none" text-anchor="middle">5</text>');
rep("board('run').slice(0,9)", "board('run').slice(0,5)");
rep('i===8&&!r.me', 'i===4&&!r.me');

// ---------- leaderboards: the cut-off is the top 5 ----------
rep("rank&&rank<=10?'<span style=\"color:var(--up)\">in the top 10</span>':rank?'chasing top 10'", "rank&&rank<=5?'<span style=\"color:var(--up)\">in the top 5</span>':rank?'chasing top 5'");
rep("(r.rank<=10?' · top 10':'')", "(r.rank<=5?' · top 5':'')");
rep("(rank<=10?' · top 10':'')", "(rank<=5?' · top 5':'')");
rep('gap=meIdx>=10?rows[9].v-me.v+1:0', 'gap=meIdx>=5?rows[4].v-me.v+1:0');
rep("${i<10?'<span class=\"pmini\"></span>top 10':'rank '+(i+1)}", "${i<5?'<span class=\"pmini\"></span>top 5':'rank '+(i+1)}");
rep("meIdx<10?'up':''", "meIdx<5?'up':''");
rep('${meIdx>=10?`<div class="sub2" style="margin:-4px 4px 10px;font-size:12px">${fmt(gap)} more to reach the top 10.</div>`:\'\'}', '${meIdx>=5?`<div class="sub2" style="margin:-4px 4px 10px;font-size:12px">${fmt(gap)} more to reach the top 5.</div>`:\'\'}');
rep("${rows.slice(0,10).map(li).join('')}<div class=\"zone\">top 10 ends</div>${rows.slice(10,22).map((r,i)=>li(r,i+10)).join('')}", "${rows.slice(0,5).map(li).join('')}<div class=\"zone\">top 5 ends</div>${rows.slice(5,22).map((r,i)=>li(r,i+5)).join('')}");

// ---------- Top 5 app mechanics ----------
// buttons only where the server would accept them: the player must be able to send, and the receiver must hold at least 1 $TMF
rep("const act=isMe?'':gold?`<button class=\"btn sm ${can?'gold':'ghost'}\" data-all=\"${escH(r.id)}\" ${can?'':'disabled'}>Give all</button>`:r.tmf>=1?`<button class=\"btn sm ${can?'gold':'ghost'}\" data-send=\"${escH(r.id)}\" ${can?'':'disabled'}>Send</button>`:'';",
    "const act=isMe?'':r.tmf<1?'<span class=\"tag\">no $TMF yet</span>':gold?`<button class=\"btn sm ${can?'gold':'ghost'}\" data-all=\"${escH(r.id)}\" ${can?'':'disabled'}>Give all</button>`:`<button class=\"btn sm ${can?'gold':'ghost'}\" data-send=\"${escH(r.id)}\" ${can?'':'disabled'}>Send</button>`;");
// always re-check rank, balance and the receiver right before the sheet opens
rep("$$('[data-send]',root).forEach(b=>b.onclick=()=>{const r=all.find(x=>x.id===b.dataset.send);if(r){sfx.select();openSend(r,false)}});\n    $$('[data-all]',root).forEach(b=>b.onclick=()=>{const r=all.find(x=>x.id===b.dataset.all);if(r){sfx.select();openSend(r,true)}});",
    "const start=async(id,giveAll)=>{\n      sfx.select();await Promise.all([loadTop(),loadStatus()]);draw();\n      const r=T&&T.rows.find(x=>x.id===id);if(!r)return;\n      if(!st||!st.canSend){toast(st&&st.top9?'&#128274; <span>You are in the top 5 right now, so you can&rsquo;t send.</span>':'&#128274; <span>You have no $TMF to give right now.</span>',3200);return}\n      if(r.tmf<1){toast('That player has no $TMF yet, so they can&rsquo;t receive.',3000);return}\n      openSend(r,giveAll);\n    };\n    $$('[data-send]',root).forEach(b=>b.onclick=()=>start(b.dataset.send,false));\n    $$('[data-all]',root).forEach(b=>b.onclick=()=>start(b.dataset.all,true));");
// give all sends the flag, so the server gives the live balance
rep("body:JSON.stringify({to:r.id,amount:amt})", "body:JSON.stringify(giveAll?{to:r.id,all:true}:{to:r.id,amount:amt})");
// keep the board and the player's lock fresh while the app is open (positions change as others play and give)
rep("Promise.all([loadTop(),loadStatus()]).then(()=>{if(document.body.contains(root))draw()});\n  return{destroy(){window._t5=null}};",
    "Promise.all([loadTop(),loadStatus()]).then(()=>{if(document.body.contains(root))draw()});\n  const iv=setInterval(()=>{\n    if(!document.body.contains(root)){clearInterval(iv);return}\n    if(sheetOpen||(document.activeElement&&document.activeElement.id==='t9q'))return;\n    Promise.all([loadTop(),loadStatus()]).then(()=>{if(document.body.contains(root)&&!sheetOpen)draw()});\n  },8000);\n  return{destroy(){clearInterval(iv);window._t5=null}};");

// ---------- dialer: any number gets the classic recording ----------
rep(".dsub{height:20px;font:500 12px var(--sans);color:#6fe28a;margin-bottom:10px}", ".dsub{height:38px;font:500 12px/1.3 var(--sans);color:#6fe28a;margin-bottom:8px;text-align:center;overflow:hidden}");
rep("ds.textContent=num==='*'?'…':'No signal in the halls';tone(300,0,.5,.05,'sawtooth',150);calling=false;cl.classList.remove('end');setTimeout(()=>{if(!calling)ds.innerHTML='&nbsp;'},2200)",
    "ds.innerHTML='<span style=\"color:#ff9d8a\">We&rsquo;re sorry, but the number you dialed is not the right number. Keep trying.</span>';tone(950,0,.3,.05);tone(1400,.34,.3,.05);tone(1800,.68,.3,.05);calling=false;cl.classList.remove('end');setTimeout(()=>{if(!calling)ds.innerHTML='&nbsp;'},9000)");

fs.writeFileSync(p, t);
console.log('ok');
