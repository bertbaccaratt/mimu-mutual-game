// Badges app overhaul: 170+ achievements, stats, levels, plus the tracking behind the new features.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const p = root + 'index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 100)); t = t.replace(a, () => b); };

/* 1) replace the old vault code (long-run badges + buildVault) */
{
  const a = t.indexOf('/* long-run achievement badges: purely for fun, nothing to do with the leaderboard */');
  const mm = t.indexOf('   MUTUAL MIMU — the weekly boardroom');
  const b = t.lastIndexOf('/* =====', mm);
  if (a < 0 || b < a) throw new Error('vault anchors');
  const code = fs.readFileSync(root + 'tools/badges-code.js.txt', 'utf8').replace(/\r\n/g, '\n');
  t = t.slice(0, a) + code + t.slice(b);
}

/* 2) CSS */
rep(`.rbtn.pulse{`, fs.readFileSync(root + 'tools/badges-css.txt', 'utf8').replace(/\r\n/g, '\n') + `.rbtn.pulse{`);

/* 3) tracking inside Chair Run */
rep(`          if(e.k==='orb'){sfx.win();`, `          if(e.k==='orb'){ST().orb++;saveP();achCheck();sfx.win();`);
rep(`          sfx.power();spark(sx,sy,14,'#fff');
          if(e.k==='magnet')`, `          {const s=ST();if(e.k==='magnet')s.bell++;else if(e.k==='shield')s.case++;else s.star++}
          sfx.power();spark(sx,sy,14,'#fff');
          if(e.k==='magnet')`);
rep(`        case 'vote':msg('🗳 Voted '`, `        case 'vote':{const s=ST();s.gates++;const va=ASSETS.find(x=>x.sym===e.sym);if(va&&va.c==='degen')s.degen++}msg('🗳 Voted '`);
rep(`        case 'bell':{sfx.bell();hud.co.textContent=S.coins;const d=e.d;`, `        case 'bell':{sfx.bell();hud.co.textContent=S.coins;const d=e.d;{const s=ST();if(d>0){s.wins++;if(d>s.bigDiv)s.bigDiv=d}}`);
rep(`        case 'mile':{msg('📍 '`, `        case 'mile':{ST().mil250++;msg('📍 '`);
rep(`        case 'hit':{S.shake=1;`, `        case 'hit':{{const s=ST();s.hits++;const seg=S.dist-nh0;if(seg>s.noHit)s.noHit=seg;nh0=S.dist}S.shake=1;`);
rep(`        case 'shield':{S.shake=.5;`, `        case 'shield':{ST().blocks++;S.shake=.5;`);
rep(`      clearTimeout(tm);inputs.push([S.tick,4]);sim.revive();sim.drain();`, `      clearTimeout(tm);ST().rev++;inputs.push([S.tick,4]);sim.revive();sim.drain();`);

/* per-run counters */
rep(`  const freshSeed=()=>1+Math.floor(Math.random()*4294967294);`, `  let nh0=0,peakSpd=0;   /* distance at the last hit, and the fastest speed of this run (for the Badges stats) */
  const freshSeed=()=>1+Math.floor(Math.random()*4294967294);`);
rep(`  function reset(){newRun(freshSeed(),P.coins);`, `  function reset(){nh0=0;peakSpd=0;newRun(freshSeed(),P.coins);`);
rep(`      stepSim(dt);
      S.shake=Math.max(0,S.shake-dt*2.2);`, `      stepSim(dt);if(S.speed>peakSpd)peakSpd=S.speed;
      S.shake=Math.max(0,S.shake-dt*2.2);`);

/* milestones of a million: disco parties and carpet colors */
rep(`  function milestone(m){
    disco();`, `  function milestone(m){
    disco();{const s=ST();s.mils++;const tr=Math.floor(m/10);if(tr>s.tier)s.tier=tr}`);

/* end of a run */
rep(`    const qd=trackQ(score);let pp=`, `    {const s=ST(),secs=S.tick/60;s.t+=secs;if(secs>s.longest)s.longest=secs;if(S.coins>s.coinsRun)s.coinsRun=S.coins;if(dist>s.distRun)s.distRun=dist;if(S.mxChain>s.chain)s.chain=S.mxChain;if(peakSpd>s.topSpeed)s.topSpeed=peakSpd;const seg=S.dist-nh0;if(seg>s.noHit)s.noHit=seg;if(new Date().getHours()<5)s.night++}
    const qd=trackQ(score);ST().quests+=qd.length;let pp=`);
rep(`const before=passMeter(),passes=addPP(pp),rank=myRank('run');saveP();`, `const before=passMeter(),passes=addPP(pp),rank=myRank('run');saveP();achCheck();`);

/* daily streak record */
rep(`      P.streak=(P.lastDay===dayKey(y))?P.streak+1:1;P.lastDay=today;`, `      P.streak=(P.lastDay===dayKey(y))?P.streak+1:1;P.lastDay=today;{const s=ST();if(P.streak>s.bestStreak)s.bestStreak=P.streak}`);

/* 4) Mutual Mimu tracking */
rep(`    f.hist.push({w:f.week,sym:a.sym,ret:o.ret,pl});`, `    f.hist.push({w:f.week,sym:a.sym,ret:o.ret,pl});
    {const s=ST();if(stake>0){s.ffStaked++;if(stake>s.ffMaxStake)s.ffMaxStake=stake;if(lev===3)s.ffLev3++}}`);
rep(`    f.week++;ffNew();saveP();ringing=false;draw();`, `    f.week++;ffNew();saveP();achCheck();ringing=false;draw();`);
rep(`P.coins-=cost;f.lobby[bl.id]=f.vote;`, `P.coins-=cost;ST().ffBlocs++;f.lobby[bl.id]=f.vote;`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
