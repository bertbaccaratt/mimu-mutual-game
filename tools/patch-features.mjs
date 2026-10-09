// Long-run badges, run milestones + runway colours, in-game feature guide, and the text list showing every signed-in player.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---------- saved state ---------- */
rep(`best:0,runs:0,dist:0,`, `best:0,top:0,howSeen:0,runs:0,dist:0,`);
rep(`if(o&&o.mimu){o.mimu=HERO;return`, `if(o&&o.mimu){o.mimu=HERO;o.top=Math.max(o.top||0,o.best||0);return`);

/* ---------- the text app lists every signed-in player ---------- */
rep(`const loadTop=()=>(PM.top&&Date.now()-PM.topAt<60000)?Promise.resolve():API.j('/api/top9').then(d=>{PM.top=d;PM.topAt=Date.now()}).catch(()=>{});`,
    `const loadTop=()=>(PM.pl&&Date.now()-PM.plAt<15000)?Promise.resolve():API.j('/api/players').then(d=>{PM.pl=d;PM.plAt=Date.now()}).catch(()=>{});`);
rep(`const rows=(PM.top?PM.top.rows:[]).filter(r=>r.id!==me()&&(!q||String(r.name).toLowerCase().includes(q)));`,
    `const rows=(PM.pl?PM.pl.players:[]).filter(r=>r.id!==me()&&(!q||String(r.name).toLowerCase().includes(q)));`);
rep(`<div class="pmh">Players on the leaderboard</div>`, '<div class="pmh">All players${PM.pl?\' &middot; \'+PM.pl.players.length:\'\'}</div>');
rep(`<span>#\${r.rank} &middot; \${fmt(r.total)} points\${r.top9?' &middot; top 5':''}</span>`, `<span>\${r.total>0?fmt(r.total)+' points':'signed in'}</span>`);
rep(`\${PM.top?'No players match.':'Loading players&hellip;'}`, `\${PM.pl?'No players match.':'Loading players&hellip;'}`);
rep(`if(pmOn()){loadTop().then(()=>{if(inList)paintPM()});pmPoll()}`, `if(pmOn()){loadTop().then(()=>{if(inList)paintPM()});pmPoll();clearInterval(PM.plT);PM.plT=setInterval(()=>{if(!inList||!document.body.contains(root))return clearInterval(PM.plT);PM.plAt=0;loadTop().then(()=>{if(inList&&document.activeElement!==$('#pmq',root))paintPM()})},15000)}`);

/* ---------- own best (for badges) after sign-in ---------- */
rep(`    GATE.ok=true;syncLocks();applyIdentity();refreshBoards();startPMPoll();`, `    GATE.ok=true;syncLocks();applyIdentity();refreshBoards();startPMPoll();API.j('/api/mybest').then(d=>{if(d&&d.best>(P.top||0)){P.top=d.best;saveP()}}).catch(()=>{});`);

/* ---------- Chair Run: runway tiers, milestones, how-to popup ---------- */
rep(`  const freshSeed=()=>1+Math.floor(Math.random()*4294967294);`, `  /* runway colour: changes every 10 million (display only; the game itself is untouched) */
  const TIERS=[['#7a2430','#5f1b26','#d9b25f'],['#2a4aa8','#1f3780','#8fb4ff'],['#1f8f5a','#16704a','#9ff0c4'],['#7a35a8','#5d2882','#e0b3ff'],['#1f8f98','#177079','#9ff5ff'],['#c0821c','#8f5f12','#fff0a0'],['#a82a6a','#7e1f50','#ffb3dc'],['#3a3a44','#26262e','#e0e0ff'],['#b34a14','#85360d','#ffd0a0'],['#1a1a2e','#10101c','#39ff88']];
  function setTier(n){const T=TIERS[n%TIERS.length];for(let i=0;i<16;i++){const k=Math.pow(i/15,1.3)*.92;pal.cA[i]=mix(T[0],FOG,k);pal.cB[i]=mix(T[1],FOG,k);pal.gd[i]=mix(T[2],FOG,k)}}
  const MQ=['Chairs are scared','Hype spat his coffee','TMF Pass is nervous','The banners bow','Your Mimu is a menace','Hall monitor claps','Carpet is blushing','Ghosts salute you','The bell rings for you','Legendary hallway'];
  const MBADGE={1:'Million Mile',10:'Ten Million Club',20:'Twenty Mil Legend',50:'Fifty Mil Immortal',100:'Hundred Mil Myth'};
  function milestone(m){
    if((P.top||0)<m*1e6){P.top=m*1e6;saveP()}
    if(m%10===0){setTier(m/10);msg('🌈 '+m+' MILLION · new runway!','big');confetti(36);sfx.win()}
    else{msg('🪑 '+m+' MILLION · '+MQ[(m-1)%MQ.length],'big');sfx.power();if(m%5===0)confetti(18)}
    if(MBADGE[m])setTimeout(()=>msg('🏅 Badge unlocked: '+MBADGE[m],'big'),750);
  }
  const freshSeed=()=>1+Math.floor(Math.random()*4294967294);`);
rep(`Object.assign(S,{st:'idle',part:[],shake:0,bestShown:false,near:false});`, `Object.assign(S,{st:'idle',part:[],shake:0,bestShown:false,near:false,mile:0});`);
rep(`Object.assign(S,{st:keep.st,part:keep.part,shake:0,bestShown:false,near:false,deadDist:undefined});`, `Object.assign(S,{st:keep.st,part:keep.part,shake:0,bestShown:false,near:false,deadDist:undefined,mile:0});setTier(0);`);
rep(`      if(P.best>0&&S.score>P.best&&!S.bestShown){S.bestShown=true;msg('🏆 New weekly best!','big');sfx.win()}`,
    `      if(P.best>0&&S.score>P.best&&!S.bestShown){S.bestShown=true;msg('🏆 New weekly best!','big');sfx.win()}
      {const ml=Math.floor(S.score/1e6);if(ml>(S.mile||0)){for(let m=(S.mile||0)+1;m<=ml;m++)milestone(m);S.mile=ml}}`);
rep(`const score=Math.floor(S.score),prevBest=P.best;if(score>P.best)P.best=score;`, `const score=Math.floor(S.score),prevBest=P.best;if(score>P.best)P.best=score;if(score>(P.top||0))P.top=score;`);

/* how-to button */
rep(`<div class="rbtn" id="rps">`, `<div class="rbtn" id="rhow" style="margin-left:auto" aria-label="Game features" role="button"><b style="font:700 17px var(--serif);color:var(--gold2)">?</b></div><div class="rbtn" id="rps" style="margin-left:0">`);
rep(`  $('#rps',root).onclick=()=>pause();`, `  $('#rps',root).onclick=()=>pause();
  const howBtn=$('#rhow',root);if(!P.howSeen)howBtn.classList.add('pulse');
  function showHow(){
    if(S.st==='run')pause();
    if(!P.howSeen){P.howSeen=1;saveP();howBtn.classList.remove('pulse')}
    const o=document.createElement('div');o.className='howov';
    o.innerHTML='<div class="howc"><div class="lbl" style="color:var(--gold)">Chair Run</div><div class="h2" style="font-size:25px;margin:2px 0 10px">Game <em>features</em></div>'+
      '<div class="fxr"><b>Move</b><span>Swipe or use the arrow keys / A D W S. Left and right dodge, up jumps chairs, down slides under banners.</span></div>'+
      '<div class="fxr"><b>$TMF</b><span>Grab the coins as you run. They add to your total and you can give them to Top 5 players.</span></div>'+
      '<div class="fxr"><b>Ballot Gate</b><span>Pick a lane at each gate. Your vote decides what the bell pays.</span></div>'+
      '<div class="fxr"><b>Power-ups</b><span>Shield blocks a hit, Magnet pulls coins in, and the multiplier boosts your score for a short time.</span></div>'+
      '<div class="fxr"><b>Chains</b><span>Clear obstacles back to back to build a chain and a bigger multiplier. Slip up and it resets.</span></div>'+
      '<div class="fxr"><b>Second wind</b><span>When you are benched you can spend $TMF to keep running.</span></div>'+
      '<div class="fxr"><b>Milestones</b><span>Every 1 million points pops a surprise. Every 10 million the runway changes color.</span></div>'+
      '<div class="fxr"><b>Long-run badges</b><span>Reach 1M, 10M, 20M, 50M and 100M in one run to unlock special badges in the Badges app. They are just for fun and do not touch the leaderboard.</span></div>'+
      '<div class="fxr"><b>Scores</b><span>Every run is replayed and checked by the server, so the leaderboard is fair. Daily quests and your streak give bonus season points.</span></div>'+
      '<button class="btn gold" id="hwx" style="margin-top:6px">Got it</button></div>';
    root.querySelector('.sc').appendChild(o);
    $('#hwx',o).onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};
  }
  howBtn.onclick=showHow;`);
rep(`if(e.target.closest('.rcard,.rbtn'))return;`, `if(e.target.closest('.rcard,.rbtn,.howov'))return;`);
rep(`    \${questHTML()}<button class="btn gold" id="rgo" style="padding:16px">Run</button>\`);
    paintAll();$('#rgo',root).onclick=()=>{ac();startCount()};`, `    \${questHTML()}<button class="btn gold" id="rgo" style="padding:16px">Run</button><button class="btn ghost" id="rhw" style="margin-top:8px;font-size:12.5px">Game features</button>\`);
    paintAll();$('#rgo',root).onclick=()=>{ac();startCount()};$('#rhw',root).onclick=()=>showHow();`);

/* CSS */
rep(`.rbtn svg{width:16px;height:16px;fill:var(--cream)}`, `.rbtn svg{width:16px;height:16px;fill:var(--cream)}
.rbtn.pulse{border-color:var(--gold);animation:howp 1.3s ease-in-out infinite}
@keyframes howp{0%,100%{box-shadow:0 0 0 0 rgba(217,178,95,.55)}50%{box-shadow:0 0 0 9px rgba(217,178,95,0)}}
.howov{position:absolute;inset:0;z-index:12;background:rgba(10,6,8,.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:54px 14px 40px;pointer-events:auto}
.howc{width:100%;max-height:100%;overflow-y:auto;scrollbar-width:thin;padding:20px 18px;border-radius:26px;background:linear-gradient(180deg,rgba(43,31,33,.98),rgba(24,15,17,.99));border:1px solid var(--line2)}
.howc .fxr{padding:8px 0;border-top:1px solid rgba(255,255,255,.07)}
.howc .fxr b{display:block;font:700 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--gold2);margin-bottom:2px}
.howc .fxr span{font:400 12.5px/1.45 var(--sans);color:var(--cream);opacity:.88}
.lgb{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px}
.lgb div{text-align:center}.lgb svg{width:100%;height:auto;display:block}
.lgb small{display:block;margin-top:4px;font:600 9px var(--mono);color:var(--cream);opacity:.85}
.lgb .lk svg{filter:grayscale(1) brightness(.5)}.lgb .lk small{opacity:.45}`);

/* ---------- long-run badges in the Badges app ---------- */
rep(`function buildVault(root){`, `/* long-run achievement badges: purely for fun, nothing to do with the leaderboard */
const LONG_BADGES=[[1e6,'1M','Million Mile','#cd7f32','#f3c18a'],[1e7,'10M','Ten Million Club','#9aa6b6','#f1f5fb'],[2e7,'20M','Twenty Mil Legend','#d9b25f','#fff0b8'],[5e7,'50M','Fifty Mil Immortal','#3fb6d8','#c9f4ff'],[1e8,'100M','Hundred Mil Myth','#d24fb0','#ffd3f1']];
const medalSVG=(b,i)=>\`<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg\${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="\${b[4]}"/><stop offset="1" stop-color="\${b[3]}"/></linearGradient></defs><path d="M20 3h10l6 22H26zM34 3h10L38 25H28z" fill="\${b[3]}" opacity=".75"/><circle cx="32" cy="40" r="19" fill="url(#lg\${i})" stroke="#1a0f12" stroke-width="2.5"/><circle cx="32" cy="40" r="14.5" fill="none" stroke="#1a0f12" stroke-opacity=".35" stroke-width="1.5"/><text x="32" y="45" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="700" font-size="\${b[1].length>3?10:12}" fill="#1a0f12">\${b[1]}</text></svg>\`;
function buildVault(root){`);
rep(`     <div class="card"><div class="row" style="margin-bottom:10px"><div class="lbl">Chair gallery</div>`, `     <div class="card"><div class="row"><div class="lbl">Long-run badges</div><div class="sp"></div><div class="lbl">best run \${fmt(P.top||0)}</div></div><div class="lgb">\${LONG_BADGES.map((b,i)=>\`<div class="\${(P.top||0)>=b[0]?'':'lk'}">\${medalSVG(b,i)}<small>\${b[2]}</small></div>\`).join('')}</div><div class="sub2" style="margin-top:8px;font-size:11.5px">Reach 1M, 10M, 20M, 50M or 100M points in a single Chair Run. Just for fun, separate from the leaderboard.</div></div>
     <div class="card"><div class="row" style="margin-bottom:10px"><div class="lbl">Chair gallery</div>`);
rep(`  draw();return{destroy(){}};
}

/* =====================================================================
   MUTUAL MIMU`, `  draw();if(pmOn())API.j('/api/mybest').then(d=>{if(d&&d.best>(P.top||0)&&document.body.contains(root)){P.top=d.best;saveP();draw()}}).catch(()=>{});return{destroy(){}};
}

/* =====================================================================
   MUTUAL MIMU`);

/* ---------- guide ---------- */
rep(`<div><b>Badges</b><span>Your season meter, badges,`, `<div><b>Long-run badges</b><span>Reach 1M, 10M, 20M, 50M or 100M in a single Chair Run for a special badge. Every 1M pops a surprise and every 10M the runway changes color. These are just for fun and do not affect the leaderboard.</span></div>
        <div><b>Badges</b><span>Your season meter, badges,`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
