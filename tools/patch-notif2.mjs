// In-run notifications, round 2: about half the footprint, shorter, one at a time, detail line only the first time, quieter, color-coded.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---- look: one compact line ---- */
rep(`#rmsg{position:absolute;left:0;right:0;top:118px;height:0;pointer-events:none}`, `#rmsg{position:absolute;left:0;right:0;top:112px;height:0;pointer-events:none}`);
rep(`#rmsg div{padding:5px 12px 6px;border-radius:14px;background:rgba(18,10,12,.56);border:1px solid var(--gold);box-shadow:0 0 16px rgba(217,178,95,.32);animation:msg 2.3s var(--ease) forwards;position:absolute;left:50%;transform:translateX(-50%);width:max-content;max-width:250px;text-align:center;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}`,
    `#rmsg div{padding:3px 9px 4px;border-radius:11px;background:rgba(18,10,12,.6);border:1px solid var(--gold);box-shadow:0 0 9px rgba(217,178,95,.3);animation:msg 1.4s var(--ease) forwards;position:absolute;left:50%;transform:translateX(-50%);width:max-content;max-width:190px;text-align:center;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}`);
rep(`#rmsg div b{display:block;font:700 13px var(--sans);color:#fff3d6;letter-spacing:.01em}`, `#rmsg div b{display:block;font:700 11px/1.25 var(--sans);color:#fff3d6;letter-spacing:.01em}`);
rep(`#rmsg div small{display:block;margin-top:1px;font:500 10.5px/1.35 var(--sans);color:#e2d3b0}`, `#rmsg div small{display:block;margin-top:1px;font:500 9px/1.3 var(--sans);color:#e2d3b0}`);
rep(`#rmsg div.big b{font:italic 700 16px var(--serif)}`, `#rmsg div.big b{font:italic 700 12.5px/1.2 var(--serif)}`);
rep(`#rmsg div.bad{border-color:var(--down);box-shadow:0 0 16px rgba(224,103,95,.35)}#rmsg div.bad b{color:#ffb3ad}`, `#rmsg div.bad{border-color:var(--down);box-shadow:0 0 9px rgba(224,103,95,.4)}#rmsg div.bad b{color:#ffb3ad}`);
rep(`#rmsg div.orb{border-color:#ff4a4a;box-shadow:0 0 22px rgba(255,60,60,.55)}#rmsg div.orb b{color:#ffd0cc}`, `#rmsg div.orb{border-color:#ff4a4a;box-shadow:0 0 12px rgba(255,60,60,.55)}#rmsg div.orb b{color:#ffd0cc}\n#rmsg div.pw{border-color:#5aa8ff;box-shadow:0 0 9px rgba(90,168,255,.45)}#rmsg div.pw b{color:#d4e8ff}`);

/* ---- behavior: one at a time, short, the detail line only the first time a kind of notice is seen ---- */
rep(`  function msg(t,cls='',sub=''){
    const life=/\\b(big|orb)\\b/.test(cls)?2900:2300;                     /* short, so a notice never sits on the view of the run */
    while(hud.msg.children.length>=2)hud.msg.firstChild.remove();       /* at most two at a time: the newest replaces the oldest */
    const d=document.createElement('div');d.className=cls;d.style.animationDuration=life+'ms';const b=document.createElement('b');b.textContent=t;d.appendChild(b);if(sub){const s=document.createElement('small');s.textContent=sub;d.appendChild(s)}
    d.style.top=(msgN++%2)*46+'px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),life+80)}`,
`  const noticed=(()=>{try{return JSON.parse(localStorage.getItem('mimu_noticed')||'{}')||{}}catch(e){return{}}})();
  function msg(t,cls='',sub=''){
    const last=hud.msg.lastChild;
    if(last&&last.dataset.t===t&&performance.now()-Number(last.dataset.at)<1000)return;     /* the same notice again within a second: ignore */
    while(hud.msg.children.length>=1)hud.msg.firstChild.remove();                              /* one at a time: the newest replaces the old */
    const key=t.replace(/[0-9][0-9,.]*/g,'#');
    let show=false;
    if(sub){if(/\\bkeep\\b/.test(cls))show=true;else if(!noticed[key]){show=true;noticed[key]=1;try{localStorage.setItem('mimu_noticed',JSON.stringify(noticed))}catch(e){}}}   /* the explanation only the first time; the "?" guide has the rules */
    const life=(/\\b(big|orb)\\b/.test(cls)?2000:/\\bbad\\b/.test(cls)?1800:1400)+(show&&!/\\bkeep\\b/.test(cls)?500:0);
    const d=document.createElement('div');d.className=cls.replace(/\\bkeep\\b/,'').trim();d.dataset.t=t;d.dataset.at=String(performance.now());d.style.animationDuration=life+'ms';
    const b=document.createElement('b');b.textContent=t;d.appendChild(b);
    if(show){const s=document.createElement('small');s.textContent=sub;d.appendChild(s)}
    d.style.top='0px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),life+80)}`);

/* ---- fewer, clearer notices ---- */
rep(`if(e.nice)msg('✓ Clean hop','','+15 points x your chain');break}`, `break}`);
rep(`case 'orbend':msg('Orb calm has ended','','Your top speed is back to the normal pace');break;`, `case 'orbend':break;`);
rep(`msg('🔔 Bell: coin magnet','','Coins fly to you for 9 seconds');`, `msg('🔔 Magnet · 9s','pw','Coins fly to you for 9 seconds');`);
rep(`msg('💼 Briefcase: shield','','Blocks your next hit, then it breaks');`, `msg('💼 Shield on','pw','Blocks your next hit, then it breaks');`);
rep(`msg('✨ Star: gilded x2','','Double points and double coins for 10 seconds');`, `msg('✨ Double points · 10s','pw','Points and coins count x2 for 10 seconds');`);
rep(`d>=0?'big':'big bad'`, `d>=0?'big keep':'big bad keep'`);
rep(`msg('🔴 Red orb ahead','orb','Catch it for -0.5 top speed for 3 minutes')`, `msg('🔴 Red orb ahead','orb','Catch it to slow down and breathe')`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
