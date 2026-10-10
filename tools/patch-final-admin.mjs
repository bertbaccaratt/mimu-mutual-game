// Campaign lock (sign-in, Chair Run and Mutual Mimu), profile picture prompt, richer admin (fun facts, Top 5 results, top-3 cards, LIVE cards).
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 90)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

/* ============================ the admin page ============================ */
edit('admin.html', (rep) => {
  /* CSS */
  rep(`/* section cards */`, `/* LIVE countdown cards */
.camp.live b{color:#7dffa8;text-shadow:0 0 18px rgba(47,211,107,.7);letter-spacing:.2em}
.camp .cs{width:100%;font:500 10.5px var(--mono);letter-spacing:.12em;color:#8fd0a2;text-transform:none}

/* Top 5 results */
.t5a{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;padding:20px}
@media(max-width:900px){.t5a{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:480px){.t5a{grid-template-columns:minmax(0,1fr)}}
.t5c{position:relative;border-radius:18px;padding:16px 12px 14px;text-align:center;background:linear-gradient(180deg,#2a2208,#130f05);border:2px solid #b8921f;box-shadow:0 0 24px rgba(255,194,51,.22);display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.t5c.r1{border-color:#ffc233;box-shadow:0 0 38px rgba(255,194,51,.55);background:linear-gradient(180deg,#3a2c05,#160f03)}
.t5c.r2{border-color:#cfd6e4;box-shadow:0 0 26px rgba(207,214,228,.28);background:linear-gradient(180deg,#252a33,#101319)}
.t5c.r3{border-color:#d98b4a;box-shadow:0 0 26px rgba(217,139,74,.3);background:linear-gradient(180deg,#33200f,#150d06)}
.t5c .rk{position:absolute;left:10px;top:8px;font:700 22px var(--cond);color:#ffd466}
.t5c.r2 .rk{color:#e6ecf7}.t5c.r3 .rk{color:#f0a56b}
.t5c .av{width:62px;height:62px;border-radius:50%;object-fit:cover;border:3px solid currentColor;background:#111;color:#ffc233}
.t5c.r2 .av{color:#cfd6e4}.t5c.r3 .av{color:#d98b4a}
.t5c .nm{font:600 13px var(--mono);color:#fff;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t5c .tot{font:700 28px var(--cond);color:#ffe9a8;font-variant-numeric:tabular-nums;line-height:1}
.t5c .sub{font:500 10.5px var(--mono);color:#b9ad87;letter-spacing:.04em}
.t5c .bar{width:100%;height:6px;border-radius:99px;background:#ffffff14;overflow:hidden}.t5c .bar i{display:block;height:100%;background:linear-gradient(90deg,#ffc233,#fff0b0)}
.t5s{display:flex;flex-wrap:wrap;gap:10px;padding:0 20px 18px}
.t5s span{flex:1 1 150px;padding:9px 12px;border-radius:12px;background:#ffffff08;border:1px solid var(--line);font:500 11px var(--mono);color:var(--muted)}.t5s b{display:block;font:700 18px var(--cond);color:#fff}

/* fun facts */
.facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;padding:20px}
@media(max-width:1000px){.facts{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:520px){.facts{grid-template-columns:minmax(0,1fr)}}
.fact{--c:var(--blue);position:relative;padding:16px 16px 14px;border-radius:18px;background:linear-gradient(160deg,color-mix(in srgb,var(--c) 22%,#0c0f16),#0b0d13 75%);border:1px solid color-mix(in srgb,var(--c) 60%,transparent);box-shadow:0 0 20px color-mix(in srgb,var(--c) 18%,transparent);min-width:0}
.fact .fi{font-size:26px;line-height:1}.fact b{display:block;margin-top:8px;font:700 30px var(--cond);color:#fff;font-variant-numeric:tabular-nums;line-height:1.05;overflow:hidden;text-overflow:ellipsis}
.fact span{display:block;margin-top:4px;font:600 10.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--c)}
.fact small{display:block;margin-top:5px;font:500 11px var(--mono);color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fact.mvp{grid-column:span 2;--c:#2fd36b;border:3px solid #2fd36b;background:linear-gradient(160deg,#0f3a1f,#07140b 75%);box-shadow:0 0 36px rgba(47,211,107,.5);display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:center}
@media(max-width:520px){.fact.mvp{grid-column:auto}}
.fact.mvp .mav{width:96px;height:96px;border-radius:50%;object-fit:cover;border:4px solid #2fd36b;background:#07140b;box-shadow:0 0 24px rgba(47,211,107,.6)}
.fact.mvp .crown{position:absolute;right:14px;top:10px;font-size:26px}
.fact.mvp b{font-size:34px}
.lead{display:flex;align-items:center;gap:10px;margin-top:8px}.lead img{width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid var(--c);background:#111}

/* top 3 live runs: the full read-out */
.lsq .hud3{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-top:2px}
.lsq .chip{padding:3px 8px;border-radius:99px;font:700 11px var(--mono);background:#0b2a16;color:#bfffd3;border:1px solid #1f8f4a;white-space:nowrap}
.lsq .chip.hearts{background:#2a0c10;color:#ff8a93;border-color:#8f1f2c;letter-spacing:.06em}
.lsq .chip.mult{background:#2a1c05;color:#ffd466;border-color:#ffc233}
.lsq .chip.fx{background:#1a1030;color:#d6c4ff;border-color:#7a5cd6}
.lsq .chip.orb{background:#30090b;color:#ff9aa0;border-color:#ff3b3b}
.lsq .chip.spd{background:#07202b;color:#9fe0ff;border-color:#3b9fcf}

/* section cards */`);

  /* HTML: the Top 5 results above the review queue, fun facts at the bottom */
  rep(`  <section class="sec a-amber"><h2>🚩 Review queue`, `  <section class="sec a-gold"><h2>👑 Top 5 results <small id="t5meta">Top 5 app · this week</small></h2><div class="t5a" id="t5a"></div><div class="t5s" id="t5s"></div></section>

  <section class="sec a-amber"><h2>🚩 Review queue`);
  rep(`  <section class="sec a-sky"><h2>👥 Players <small id="ucount">Glyph + username</small></h2><div class="scroll" id="users"></div></section>
`, `  <section class="sec a-sky"><h2>👥 Players <small id="ucount">Glyph + username</small></h2><div class="scroll" id="users"></div></section>

  <section class="sec a-green"><h2>🎉 Fun facts <small>everyone, all together</small></h2><div class="facts" id="facts"></div></section>
`);

  /* JS: render the new sections on every refresh */
  rep(`  paintHypeList();`, `  paintHypeList();paintTop5(d);paintFacts(d);`);
  rep(`function campTick(){`, `/* ---------- Top 5 app results ---------- */
function paintTop5(d){
  const box=$('#t5a');if(!box)return;
  const rows=d.top5||[],max=Math.max(1,...rows.map(r=>r.total||0));
  box.innerHTML=rows.length?rows.map((r,i)=>\`<div class="t5c r\${i+1}"><span class="rk">#\${i+1}</span>\${r.pic&&/^https:\\/\\//.test(r.pic)?\`<img class="av" src="\${esc(r.pic)}" alt="" referrerpolicy="no-referrer">\`:'<div class="av" style="display:grid;place-items:center;font-size:26px">🏃</div>'}<div class="nm">\${esc(r.n||'player')}</div><div class="tot">\${nf(r.total)}</div><div class="sub">\${nf(r.run)} run + \${nf(r.tmf)} $TMF</div><div class="bar"><i style="width:\${Math.max(4,(r.total||0)/max*100)}%"></i></div>\${r.boost?\`<div class="sub" style="color:#ffd466">+\${nf(r.boost)} from gifts</div>\`:''}</div>\`).join(''):'<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:26px">Nobody on the board yet. The Top 5 fills as people run.</div>';
  const f=d.facts||{},g=f.gifts||{n:0,amt:0,big:0,boost:0};
  $('#t5s').innerHTML=\`<span><b>\${nf(g.n)}</b>gifts sent</span><span><b>\${nf(g.amt)}</b>$TMF given</span><span><b>\${nf(g.boost)}</b>points boosted</span><span><b>\${nf(g.big)}</b>biggest gift</span>\`;
}
/* ---------- fun facts ---------- */
function paintFacts(d){
  const box=$('#facts');if(!box)return;
  const f=d.facts;if(!f){box.innerHTML='<div style="grid-column:1/-1;color:var(--muted);padding:20px;text-align:center">Fun facts appear as people play.</div>';return}
  const mins=t=>{const m=Math.round((t||0)/60/60);return m>=120?(m/60).toFixed(1)+' hours':m+' minutes'};
  const dur=t=>{const s=Math.floor((t||0)/60);return Math.floor(s/60)+'m '+String(s%60).padStart(2,'0')+'s'};
  const av=p=>p&&p.pic&&/^https:\\/\\//.test(p.pic)?\`<img src="\${esc(p.pic)}" alt="" referrerpolicy="no-referrer">\`:'';
  const tile=(c,i,v,l,sub)=>\`<div class="fact" style="--c:\${c}"><div class="fi">\${i}</div><b>\${v}</b><span>\${l}</span>\${sub?\`<small>\${sub}</small>\`:''}</div>\`;
  const who=(c,i,l,p,val)=>p?\`<div class="fact" style="--c:\${c}"><div class="fi">\${i}</div><span>\${l}</span><div class="lead">\${av(p)}<div style="min-width:0"><b style="font-size:20px;margin:0">\${esc(p.n||'player')}</b><small>\${val}</small></div></div></div>\`:tile(c,i,'—',l,'no one yet');
  const m=f.mvp,mvp=m?\`<div class="fact mvp"><span class="crown">👑</span>\${m.pic&&/^https:\\/\\//.test(m.pic)?\`<img class="mav" src="\${esc(m.pic)}" alt="" referrerpolicy="no-referrer">\`:'<div class="mav" style="display:grid;place-items:center;font-size:40px">🏃</div>'}<div style="min-width:0"><span>Most valuable player</span><b>\${esc(m.n||'player')}</b><small>has played the most: \${mins(m.v)} in the halls</small></div></div>\`:\`<div class="fact mvp"><div class="mav" style="display:grid;place-items:center;font-size:40px">🏆</div><div><span>Most valuable player</span><b>—</b><small>the player with the most minutes played shows up here</small></div></div>\`;
  const avgRun=f.runs?f.ticks/f.runs:0,hopsPer=f.runs?f.hops/f.runs:0;
  box.innerHTML=mvp+
    tile('#5be08a','🪑',nf(f.hops),'chairs jumped','all players, all runs')+
    tile('#4cc3ff','🏃',nf(f.runs),'runs finished',nf(f.runners)+' players have run')+
    tile('#ffb000','📏',nf(Math.round(f.dist/1000))+' km','distance run',nf(f.dist)+' metres in total')+
    tile('#a66bff','⏱',mins(f.ticks),'total play time','average run '+dur(avgRun))+
    tile('#ffc233','🪙',nf(f.coins),'$TMF collected',(hopsPer?hopsPer.toFixed(1):'0')+' chairs per run')+
    tile('#ff5fa8','💸',nf((f.gifts||{}).amt),'$TMF given',nf((f.gifts||{}).n)+' gifts · biggest '+nf((f.gifts||{}).big))+
    tile('#19d3c5','💬',nf(f.texts),'texts sent','between players and from Hype')+
    tile('#3b8cff','📬',nf(f.mailReads),'mails opened','across all phones')+
    who('#5be08a','🪑','Chair champion',f.hopsLead,nf((f.hopsLead||{}).v)+' chairs jumped')+
    who('#ffc233','🪙','Coin hoarder',f.coinsLead,nf((f.coinsLead||{}).v)+' $TMF collected')+
    who('#ff7b5a','🏅','Marathoner',f.longest,'longest run '+dur((f.longest||{}).v))+
    who('#ff9a4a','🔥','Chain master',f.chain,'best chain '+nf((f.chain||{}).v))+
    who('#ffd166','🤝','Top gifter',f.gifter,nf((f.gifter||{}).v)+' $TMF given')+
    who('#d0d6e0','⭐','Highest score',f.best,nf((f.best||{}).v)+' points');
}

function campTick(){`);

  /* LIVE cards */
  rep(`  el.hidden=false;el.classList.toggle('live',!pre);`, `  el.hidden=false;el.classList.toggle('live',!pre);
  if(!$('#camp-s')){const sp=document.createElement('span');sp.className='cs';sp.id='camp-s';el.appendChild(sp)}`);
  rep(`  $('#camp-l').textContent=pre?'Campaign opens in':'Campaign closes in';
  $('#camp-t').textContent=d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s';`,
`  const left=d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s';
  if(pre){$('#camp-l').textContent='Campaign opens in';$('#camp-t').textContent=left;$('#camp-s').textContent=''}
  else{$('#camp-l').textContent='Campaign is';$('#camp-t').textContent='LIVE';$('#camp-s').textContent='closes in '+left}`);
  rep(`    if(now>=ALARM_AT){al.classList.add('live');$('#alm-l').textContent='Alarm is going off';$('#alm-t').textContent='Gaming has stopped'}`, `    if(now>=ALARM_AT){al.classList.add('live');$('#alm-l').textContent='Alarm';$('#alm-t').textContent='LIVE · gaming stopped'}`);

  /* top 3 live runs: more detail */
  rep(`      <small>\${esc(r.a)}\${r.x?' &middot; @'+esc(r.x):''} &middot; ping \${age}s ago</small></div>\`}).join('');`,
`      \${i<3&&r.gfx?\`<div class="hud3"><span class="chip hearts">\${'❤'.repeat(Math.max(0,r.gfx.lv))||'—'}</span><span class="chip mult">x\${Math.max(1,r.gfx.cm)} · chain \${r.gfx.ch}</span><span class="chip spd">\${Number(r.gfx.v).toFixed(1)} speed</span>\${r.gfx.sh?'<span class="chip fx">💼 shield</span>':''}\${r.gfx.mg?'<span class="chip fx">🔔 magnet '+r.gfx.mg+'s</span>':''}\${r.gfx.x2?'<span class="chip fx">✨ x2 '+r.gfx.x2+'s</span>':''}\${r.gfx.or?'<span class="chip orb">🔴 orb calm '+Math.floor(r.gfx.or/60)+':'+String(r.gfx.or%60).padStart(2,'0')+'</span>':''}</div>\`:''}
      <small>\${esc(r.a)}\${r.x?' &middot; @'+esc(r.x):''} &middot; ping \${age}s ago\${r.est?' &middot; estimated view':''}</small></div>\`}).join('');`);
  /* the orb countdown in the picture readout */
  rep(`c.textAlign='right';c.fillStyle='#7dffa8';c.fillText((g.est?'approx · ':'')+'chain '+st.ch+'  x'+st.cm,W-8,15);`, `c.textAlign='right';c.fillStyle='#7dffa8';c.fillText((g.est?'approx · ':'')+'chain '+st.ch+'  x'+st.cm,W-8,15);
    if(st.or){c.textAlign='left';c.fillStyle='#ff6a6a';c.fillText('\\ud83d\\udd34 -0.5 speed '+st.or+'s',8,H-8)}`);
});
console.log('ok');
