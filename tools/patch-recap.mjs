// Final Recap app (right of OpenSea, locked until the campaign closes) + share card at the top of the Badges app.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const p = root + 'index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const block = fs.readFileSync(root + 'tools/recap-block.js', 'utf8').split('\r\n').join('\n');
const css = fs.readFileSync(root + 'tools/recap.css', 'utf8').split('\r\n').join('\n').trimEnd();
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---- CSS ---- */
rep(`.xrow .ostile{grid-column:3}`, `.xrow .ostile{grid-column:3}\n` + css);

/* ---- icon ---- */
rep(`const APPS=[`, `IC.recap='<svg viewBox="0 0 24 24"><path fill="#fff" d="M7 3h10v2h3v3c0 2.300-1.700 4.200-3.900 4.500A5.500 5.500 0 0 1 13 15.400V18h3v3H8v-3h3v-2.600a5.500 5.500 0 0 1-3.100-2.900C5.700 12.200 4 10.300 4 8V5h3zm-1 4H6v1c0 1 .5 1.900 1.300 2.400A8 8 0 0 1 7 8zm12 0v1c0 1-.5 1.900-1.300 2.400L18 8z"/></svg>';\nconst APPS=[`);

/* ---- open time + home tile ---- */
rep(`/* sign-in, Chair Run and Mutual Mimu are all locked outside this window */`,
    `/* sign-in, Chair Run and Mutual Mimu are all locked outside this window */\nconst recapOpen=()=>Date.now()>=CAMPAIGN.close;   /* the Final Recap app stays greyed out until the campaign closes */\nconst recapWhy='The recap unlocks when the campaign closes: Wed Oct 14, 6:00 AM PST';`);
rep(`<button class="app-i ostile" data-open="os"><div class="ic">\${IC.os}</div>OpenSea</button></div></div>`,
    `<button class="app-i ostile" data-open="os"><div class="ic">\${IC.os}</div>OpenSea</button><button class="app-i rctile\${recapOpen()?'':' lk'}" data-open="recap"\${recapOpen()?'':' disabled aria-disabled="true" title="'+recapWhy+'"'}><div class="ic">\${IC.recap}</div>Recap</button></div></div>`);

/* ---- keep the lock live (syncLocks runs every few seconds) ---- */
rep(`  /* Chair Run: cannot be clicked at all until the countdown ends, and again after gaming stops */`,
    `  /* Final Recap: cannot be clicked until the campaign closes */
  document.querySelectorAll('[data-open=recap]').forEach(b=>{const off=!recapOpen();b.disabled=off;b.classList.toggle('lk',off);b.setAttribute('aria-disabled',off?'true':'false');b.title=off?recapWhy:''});
  /* Chair Run: cannot be clicked at all until the countdown ends, and again after gaming stops */`);

/* ---- open the app ---- */
rep(`function openApp(id,from){\n`, `function openApp(id,from){\n  if(id==='recap'&&!recapOpen()){try{toast('&#128274; <span>The recap unlocks when the campaign closes, <b>Wed Oct 14 at 6:00 AM PST</b>.</span>',3600)}catch(e){}return}\n`);
rep(`,os:buildOS})[id](a);`, `,os:buildOS,recap:buildRecap})[id](a);`);

/* ---- share card helpers + Recap app (before the Badges app) ---- */
rep(`function buildVault(root){\n`, block + `function buildVault(root){\n`);

/* ---- Badges: reuse the shared level table, share card at the very top ---- */
{
  const re = /const LEVELS=\[\[0,'Rookie'\][^\n]*\n/;
  if (!re.test(t)) throw new Error('LEVELS line');
  t = t.replace(re, () => 'const LEVELS=BADGE_LEVELS;\n');
}
rep(`<div class="scroll" style="padding-bottom:30px">\n     <div class="ahero">`,
    `<div class="scroll" style="padding-bottom:30px">
     <div class="shc"><div class="shp" id="scMount"></div><div class="shb"><div class="lbl" style="color:var(--gold)">Your share card</div><div class="sub2" style="font-size:12px;margin:4px 0 10px">A picture of your level and stats to post or save.</div><button class="btn gold sm" id="scShare" type="button">Share on X</button><button class="btn ghost sm" id="scSave" type="button" style="margin-top:6px">Save image</button></div></div>
     <div class="ahero">`);
rep(`    paintAll();paintChairs(root);\n    $$('.afl',root)`,
    `    paintAll();paintChairs(root);
    {const mount=$('#scMount',root);
     const mk=()=>shareCardCanvas('badges').then(cv=>{scCv=cv;return cv});
     if(scCv){mount.appendChild(scCv);scCv=null}                    /* a redraw: the picture is made again below so it always matches the screen */
     mk().then(cv=>{const m=$('#scMount',root);if(m){m.innerHTML='';m.appendChild(cv)}}).catch(()=>{});
     $('#scShare',root).onclick=async()=>{sfx.tap();shareCardAct(scCv||await mk(),'share')};
     $('#scSave',root).onclick=async()=>{sfx.tap();shareCardAct(scCv||await mk(),'save')};}
    $$('.afl',root)`);
rep(`function buildVault(root){\n  const open={};let filter='all';`, `function buildVault(root){\n  const open={};let filter='all',scCv=null;`);

/* ---- How this site works ---- */
rep(`        <div><b>Phone, Camera, Settings</b>`,
    `        <div><b>Final Recap</b><span>Sits to the right of OpenSea and stays greyed out until the campaign closes (Wed Oct 14, 6:00 AM PST). Then it shows the final top 5, how everyone did together, your own numbers and a picture you can share.</span></div>
        <div><b>Phone, Camera, Settings</b>`);
rep(`<div><b>Badges</b><span>Your level, 168 achievements, stats, season meter, season badges, chair gallery and patron status.</span></div>`,
    `<div><b>Badges</b><span>A share card at the top (save it or post it), your level, 168 achievements, stats, season meter, season badges, chair gallery and patron status.</span></div>`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
