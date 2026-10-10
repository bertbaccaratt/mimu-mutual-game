// Red orb every 2.5 million (-0.5 speed for 3 minutes), clearer notifications with details, and ultra-thorough guides for Chair Run and Mutual Mimu.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 90)); t = t.replace(a, () => b); }; fn(rep, () => t, (x) => { t = x; }); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

/* ---------------- the rules (shared with the server) ---------------- */
edit('assets/sim.js', (rep) => {
  rep(`      tick: 0, dead: false, wait: null, walletPaid: 0,
    };`, `      tick: 0, dead: false, wait: null, walletPaid: 0, orbNext: 2500000, orbT: 0,
    };`);
  rep(`      const stairs = Math.min(7, .5 * Math.floor(S.tick / 10800));
      const target = (Math.min(23, 11 + S.dist / 230) + stairs) * (S.slow > 0 ? .62 : 1);`,
`      const stairs = Math.min(7, .5 * Math.floor(S.tick / 10800));
      /* the red orb (every 2.5 million points): catch it and the top speed is 0.5 lower for 3 minutes, then it comes back by itself to wherever the ramp has got to */
      if (S.orbT > 0) { S.orbT -= dt; if (S.orbT <= 0) { S.orbT = 0; emit('orbend'); } }
      const target = (Math.min(23, 11 + S.dist / 230) + stairs - (S.orbT > 0 ? .5 : 0)) * (S.slow > 0 ? .62 : 1);`);
  rep(`      while (S.spawnZ < S.dist + FAR) pattern();`, `      while (S.spawnZ < S.dist + FAR) pattern();
      if (S.score >= S.orbNext) { S.orbNext += 2500000; const o = mk('pick', rp([-1, 0, 1]), S.dist + FAR - 6); o.k = 'orb'; emit('orbseen'); }`);
  rep(`            if (o.k === 'magnet') S.magnet = 9; else if (o.k === 'shield') S.shield = 1; else S.mult = 10;`,
      `            if (o.k === 'magnet') S.magnet = 9; else if (o.k === 'shield') S.shield = 1; else if (o.k === 'orb') S.orbT = 180; else S.mult = 10;`);
  rep(`  const VERSION = 2;`, `  const VERSION = 3;`);
});

edit('backend/src/index.js', (rep) => {
  rep(`o.t === 'pick' ? (o.k === 'magnet' ? 'm' : o.k === 'shield' ? 's' : 'x')`, `o.t === 'pick' ? (o.k === 'magnet' ? 'm' : o.k === 'shield' ? 's' : o.k === 'orb' ? 'r' : 'x')`);
});

edit('admin.html', (rep) => {
  rep(`c.fillText(t==='m'?'\\ud83d\\udd14':t==='s'?'\\ud83d\\udcbc':'\\u2728',p[0],p[1])`, `c.fillText(t==='m'?'\\ud83d\\udd14':t==='s'?'\\ud83d\\udcbc':t==='r'?'\\ud83d\\udd34':'\\u2728',p[0],p[1])`);
});

/* ---------------- the game page ---------------- */
edit('index.html', (rep, get, set) => {
  rep(`<script src="assets/sim.js?v=2"></script>`, `<script src="assets/sim.js?v=3"></script>`);

  /* notifications: clearer, with a detail line, and they stay a little longer */
  rep(`#rmsg div{padding:5px 13px;border-radius:99px;background:rgba(20,12,14,.55);border:1px solid var(--gold);font:600 11px var(--sans);animation:msg 2.2s var(--ease) forwards;position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap}
#rmsg div.big{font:italic 700 15px var(--serif);padding:5px 15px}
#rmsg div.bad{border-color:var(--down);color:#ffb3ad}`,
`#rmsg div{padding:6px 14px 7px;border-radius:16px;background:rgba(18,10,12,.66);border:1px solid var(--gold);box-shadow:0 0 16px rgba(217,178,95,.32);animation:msg 3.6s var(--ease) forwards;position:absolute;left:50%;transform:translateX(-50%);width:max-content;max-width:300px;text-align:center;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
#rmsg div b{display:block;font:700 13px var(--sans);color:#fff3d6;letter-spacing:.01em}
#rmsg div small{display:block;margin-top:1px;font:500 10.5px/1.35 var(--sans);color:#e2d3b0}
#rmsg div.big b{font:italic 700 16px var(--serif)}
#rmsg div.bad{border-color:var(--down);box-shadow:0 0 16px rgba(224,103,95,.35)}#rmsg div.bad b{color:#ffb3ad}
#rmsg div.orb{border-color:#ff4a4a;box-shadow:0 0 22px rgba(255,60,60,.55)}#rmsg div.orb b{color:#ffd0cc}
.orbfx{position:absolute;left:50%;top:62%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;border:3px solid rgba(255,70,70,.95);box-shadow:0 0 30px rgba(255,40,40,.8),inset 0 0 20px rgba(255,80,80,.6);pointer-events:none;z-index:6;animation:orbring .95s ease-out forwards}
@keyframes orbring{0%{transform:scale(.4);opacity:1}100%{transform:scale(9);opacity:0}}`);
  rep(`  function msg(t,cls=''){const d=document.createElement('div');d.className=cls;d.textContent=t;d.style.top=(msgN++%3)*28+'px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),2300)}`,
      `  function msg(t,cls='',sub=''){const d=document.createElement('div');d.className=cls;const b=document.createElement('b');b.textContent=t;d.appendChild(b);if(sub){const s=document.createElement('small');s.textContent=sub;d.appendChild(s)}d.style.top=(msgN++%3)*50+'px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),3700)}`);

  /* event notifications with details */
  rep(`        case 'chainup':msg('🔥 Chain x'+e.m,'big');sfx.power();break;
        case 'chainbreak':msg('Chain broken','bad');break;
        case 'pick':{sfx.power();const [sx,sy]=P3(e.x,1,e.z);spark(sx,sy,14,'#fff');msg(e.k==='magnet'?'🔔 Coin magnet':e.k==='shield'?'💼 Briefcase shield':'✦ Gilded x2 for 10s');break}
        case 'hop':{const [px2,py2]=P3(S.px,.4,S.dist+D0);spark(px2,py2,8,'#fff3d0');if(e.nice)msg('✓ Clean hop','');break}
        case 'vote':msg('🗳 Voted '+e.sym+' · bell in 110m','big');sfx.select();break;
        case 'bell':sfx.bell();hud.co.textContent=S.coins;msg(\`🔔 Closing Bell · \${e.sym} \${pct(e.ret)}\`,'big');{const d=e.d;setTimeout(()=>msg(d>=0?\`+\${d} $TMF dividend\`:\`\${d} $TMF drawdown\`,d>=0?'':'bad'),500);if(d>0)confetti(18)}break;
        case 'mile':{msg('📍 '+fmt(e.m)+'m · +'+e.b,'big');sfx.win();const [mx,my]=P3(S.px,1.4,S.dist+D0);spark(mx,my,16,'#f0d28a');break}
        case 'shield':{S.shake=.5;sfx.power();msg('💼 Shield broke');const [sx,sy]=P3(S.px,1,S.dist+D0);spark(sx,sy,18,'#7ac8ff');break}`,
`        case 'chainup':msg('🔥 Chain x'+e.m,'big','Your coins, hops and distance now score x'+e.m);sfx.power();break;
        case 'chainbreak':msg('Chain broken','bad','Grab a coin or hop a chair to start a new one');break;
        case 'pick':{
          const [sx,sy]=P3(e.x,1,e.z);
          if(e.k==='orb'){sfx.win();spark(sx,sy,34,'#ff5a5a');spark(sx,sy,14,'#fff');
            const fx=document.createElement('div');fx.className='orbfx';root.querySelector('.sc').appendChild(fx);setTimeout(()=>fx.remove(),1000);
            msg('🔴 Red orb caught','big orb','Top speed -0.5 for 3 minutes, then it eases back on its own');break}
          sfx.power();spark(sx,sy,14,'#fff');
          if(e.k==='magnet')msg('🔔 Bell: coin magnet','','Coins fly to you for 9 seconds');
          else if(e.k==='shield')msg('💼 Briefcase: shield','','Blocks your next hit, then it breaks');
          else msg('✨ Star: gilded x2','','Double points and double coins for 10 seconds');
          break}
        case 'orbseen':msg('🔴 Red orb ahead','orb','Catch it for -0.5 top speed for 3 minutes');sfx.select();break;
        case 'orbend':msg('Orb calm has ended','','Your top speed is back to the normal pace');break;
        case 'hop':{const [px2,py2]=P3(S.px,.4,S.dist+D0);spark(px2,py2,8,'#fff3d0');if(e.nice)msg('✓ Clean hop','','+15 points x your chain');break}
        case 'vote':msg('🗳 Voted '+e.sym+' · bell in 110m','big','Payout = (20 + your $TMF) x the return. A bigger stack swings harder');sfx.select();break;
        case 'bell':{sfx.bell();hud.co.textContent=S.coins;const d=e.d;msg(\`🔔 Closing Bell · \${e.sym} \${pct(e.ret)}\`,d>=0?'big':'big bad',d>=0?\`+\${d} $TMF dividend (and +\${d*10} points)\`:\`\${d} $TMF drawdown. It can never take more than you carry\`);if(d>0)confetti(18);break}
        case 'mile':{msg('📍 '+fmt(e.m)+'m · +'+fmt(e.b),'big','Milestone bonus: 50 x milestone number x your chain');sfx.win();const [mx,my]=P3(S.px,1.4,S.dist+D0);spark(mx,my,16,'#f0d28a');break}
        case 'shield':{S.shake=.5;sfx.power();msg('💼 Shield broke','','The hit was blocked. Grab another briefcase if you see one');const [sx,sy]=P3(S.px,1,S.dist+D0);spark(sx,sy,18,'#7ac8ff');break}`);
  rep(`        case 'msg':msg(e.a,e.b);break;`, `        case 'msg':msg(e.a,e.b,e.a.indexOf('Last')>=0?'One more hit ends the run unless you take a Second Wind':'You lost a life and slowed down for a moment');break;`);

  /* milestones: title + a detail line */
  rep(`    if(m%10===0){setTier(m/10);msg('🌈 '+m+' MILLION · new runway!','big');confetti(36);sfx.win()}
    else{msg('🪑 '+m+' MILLION · '+MQ[(m-1)%MQ.length],'big');sfx.power();if(m%5===0)confetti(18)}
    if(MBADGE[m])setTimeout(()=>msg('🏅 Badge unlocked: '+MBADGE[m],'big'),750);`,
`    if(m%10===0){setTier(m/10);msg('🌈 '+m+' MILLION · new runway!','big','The carpet changes color every 10 million. '+MQ[(m-1)%MQ.length]);confetti(36);sfx.win()}
    else{msg('🪑 '+m+' MILLION','big',MQ[(m-1)%MQ.length]+' · disco party for 10 seconds');sfx.power();if(m%5===0)confetti(18)}
    if(MBADGE[m])setTimeout(()=>msg('🏅 Badge unlocked: '+MBADGE[m],'big','See it in the Badges app'),900);`);

  /* the orb on the road */
  rep(`      c.font=\`\${r*1.6}px "Segoe UI Emoji","Apple Color Emoji",sans-serif\`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(o.k==='magnet'?'🔔':o.k==='shield'?'💼':'✨',sx,cy)`,
`      if(o.k==='orb'){
        const pu=.5+.5*Math.sin(S.time*5+o.id),R=r*(1.5+.35*pu),g2=c.createRadialGradient(sx,cy,0,sx,cy,R*2.6);
        g2.addColorStop(0,'rgba(255,70,70,.95)');g2.addColorStop(.35,'rgba(255,40,40,.45)');g2.addColorStop(1,'rgba(255,0,0,0)');
        c.fillStyle=g2;c.fillRect(sx-R*2.6,cy-R*2.6,R*5.2,R*5.2);
        const cg=c.createRadialGradient(sx-R*.25,cy-R*.3,R*.1,sx,cy,R);cg.addColorStop(0,'#ffe0dc');cg.addColorStop(.35,'#ff4a4a');cg.addColorStop(1,'#8a0b12');
        c.fillStyle=cg;c.beginPath();c.arc(sx,cy,R,0,6.3);c.fill();
      }else{
      c.font=\`\${r*1.6}px "Segoe UI Emoji","Apple Color Emoji",sans-serif\`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(o.k==='magnet'?'🔔':o.k==='shield'?'💼':'✨',sx,cy)}`);

  /* HUD chip + picture code */
  rep(`function updPW(){const a=[];if(S.shield>0)a.push('🛡 SHIELD');if(S.magnet>0)a.push('🔔 MAGNET '+Math.ceil(S.magnet));if(S.mult>0)a.push('✦ x2 '+Math.ceil(S.mult));hud.pw.innerHTML`,
      `function updPW(){const a=[];if(S.shield>0)a.push('💼 SHIELD');if(S.magnet>0)a.push('🔔 MAGNET '+Math.ceil(S.magnet));if(S.mult>0)a.push('✨ x2 '+Math.ceil(S.mult));if(S.orbT>0){const s=Math.ceil(S.orbT);a.push('🔴 ORB -0.5 '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))}hud.pw.innerHTML`);
  rep(`(S.mult>0?'X'+Math.ceil(S.mult):'');if(sig!==pwSig)`, `(S.mult>0?'X'+Math.ceil(S.mult):'')+(S.orbT>0?'O'+Math.ceil(S.orbT):'');if(sig!==pwSig)`);
  rep(`o.t==='pick'?(o.k==='magnet'?'m':o.k==='shield'?'s':'x')`, `o.t==='pick'?(o.k==='magnet'?'m':o.k==='shield'?'s':o.k==='orb'?'r':'x')`);
  rep(`.pw span`, `.pw span`);
});
console.log('ok');
