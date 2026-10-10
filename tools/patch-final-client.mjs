// Campaign lock (sign-in, Chair Run and Mutual Mimu), profile picture prompt, richer admin (fun facts, Top 5 results, top-3 cards, LIVE cards).
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 90)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

/* ============================ the game page ============================ */
edit('index.html', (rep) => {
  /* the campaign window */
  rep(`const chairClosedWhy=()=>Date.now()<CAMPAIGN.open?'Chair Run opens when the countdown ends: Sat Oct 10, 6:00 PM PST':'Gaming has stopped';`,
`const campaignLive=()=>{const n=Date.now();return n>=CAMPAIGN.open&&n<CAMPAIGN.close};   /* sign-in, Chair Run and Mutual Mimu are all locked outside this window */
const chairClosedWhy=()=>Date.now()<CAMPAIGN.open?'Locked until the countdown ends: Sat Oct 10, 6:00 PM PST':Date.now()>=CAMPAIGN.close?'The campaign has ended':'Gaming has stopped';`);

  /* home tiles */
  rep(`\${(a.id==='ff'&&!GATE.ok)||(a.id==='run'&&!chairOpen())?' lk':''}" data-open="\${a.id}"\${a.id==='ff'&&!GATE.ok&&chairOpen()?' disabled aria-disabled="true" title="Connect Glyph in Chair Run first"':''}\${a.id==='run'&&!chairOpen()?' disabled aria-disabled="true" title="'+chairClosedWhy()+'"':''}>`,
      `\${(a.id==='ff'&&(!GATE.ok||!campaignLive()))||(a.id==='run'&&!chairOpen())?' lk':''}" data-open="\${a.id}"\${a.id==='ff'&&(!campaignLive()||(!GATE.ok&&chairOpen()))?' disabled aria-disabled="true" title="'+(campaignLive()?'Connect Glyph in Chair Run first':'Locked until the countdown ends: Sat Oct 10, 6:00 PM PST')+'"':''}\${a.id==='run'&&!chairOpen()?' disabled aria-disabled="true" title="'+chairClosedWhy()+'"':''}>`);

  rep(`  document.querySelectorAll('[data-open=ff]').forEach(b=>{b.disabled=lock&&open;b.classList.toggle('lk',lock);b.setAttribute('aria-disabled',lock&&open?'true':'false');b.title=lock?(open?'Connect Glyph in Chair Run first':'Sign in with Glyph'):''});
  document.querySelectorAll('[data-launch=ff]').forEach(b=>{b.disabled=lock&&open;b.setAttribute('aria-disabled',lock&&open?'true':'false');b.title=lock?(open?'Connect Glyph in Chair Run first':'Sign in with Glyph'):''});`,
`  const live=campaignLive();
  const ffOff=!live||(lock&&open);   /* locked entirely outside the campaign; during it, closed until signed in (or tappable to sign in once Chair Run has closed) */
  const ffWhy=!live?chairClosedWhy():(lock?(open?'Connect Glyph in Chair Run first':'Sign in with Glyph'):'');
  document.querySelectorAll('[data-open=ff]').forEach(b=>{b.disabled=ffOff;b.classList.toggle('lk',lock||!live);b.setAttribute('aria-disabled',ffOff?'true':'false');b.title=ffWhy});
  document.querySelectorAll('[data-launch=ff]').forEach(b=>{b.disabled=ffOff;b.setAttribute('aria-disabled',ffOff?'true':'false');b.title=ffWhy});`);
  rep(`  document.querySelectorAll('[data-open=run],[data-launch=run],[data-launch=play]').forEach(b=>{b.disabled=shut;`, `  document.querySelectorAll('[data-open=run],[data-launch=run],[data-launch=play]').forEach(b=>{b.disabled=shut||!live;`);
  rep(`b.classList.toggle('lk',shut&&b.classList.contains('app-i'));b.setAttribute('aria-disabled',shut?'true':'false');b.title=shut?chairClosedWhy():''});`, `b.classList.toggle('lk',(shut||!live)&&b.classList.contains('app-i'));b.setAttribute('aria-disabled',(shut||!live)?'true':'false');b.title=(shut||!live)?chairClosedWhy():''});`);

  /* opening apps */
  rep(`function openApp(id,from){
  if(id==='ff'&&!GATE.ok&&!chairOpen())id='run';`, `function openApp(id,from){
  if((id==='ff'||id==='run')&&!campaignLive()){try{toast('&#128274; <span>'+(Date.now()<CAMPAIGN.open?'Everything unlocks when the countdown ends, <b>Sat Oct 10 at 6:00 PM PST</b>.':'The campaign has ended. Thanks for playing!')+'</span>',3600)}catch(e){}return}
  if(id==='ff'&&!GATE.ok&&!chairOpen())id='run';`);

  /* the app itself */
  rep(`  const closed=()=>{
    root.innerHTML=\`<div class="sc"><div class="closed-card"><div class="lock">\\u{1FA91}</div><h2>\${Date.now()<CAMPAIGN.open?'Chair Run opens soon':'Gaming has stopped'}</h2>
      <p>\${Date.now()<CAMPAIGN.open?'The halls open when the campaign countdown ends: <b>Sat Oct 10 at 6:00 PM PST</b>. Your login and $TMF are saved, and Mutual Mimu, the Top 5, the leaderboards and your texts are open now.':'No more Chair Runs this campaign. Your scores, login and $TMF are saved. The <b>24-hour donation window</b> is next, in the Top 5 app (Tue 6:00 AM to Wed 6:00 AM PST).'}</p>`,
`  const closed=()=>{
    const early=Date.now()<CAMPAIGN.open,ended=Date.now()>=CAMPAIGN.close;
    root.innerHTML=\`<div class="sc"><div class="closed-card"><div class="lock">\\u{1FA91}</div><h2>\${early?'Chair Run opens soon':ended?'The campaign has ended':'Gaming has stopped'}</h2>
      <p>\${early?'Everything unlocks together when the campaign countdown ends: <b>Sat Oct 10 at 6:00 PM PST</b>. Signing in with Glyph, Chair Run and Mutual Mimu are all locked until then.':ended?'The campaign is over. Thanks for playing. The final standings stand.':'No more Chair Runs this campaign. Your scores, login and $TMF are saved. The <b>24-hour donation window</b> is next, in the Top 5 app (Tue 6:00 AM to Wed 6:00 AM PST).'}</p>`);
  rep(`  if(!chairOpen()){
    if(GATE.ok){closed();return ctl}`, `  if(!campaignLive()){closed();return ctl}                       /* nobody can sign in or play outside the campaign */
  if(!chairOpen()){
    if(GATE.ok){closed();return ctl}`);

  /* the live picture also carries the orb countdown */
  rep(`mg:S.magnet>0?Math.ceil(S.magnet):0,x2:S.mult>0?Math.ceil(S.mult):0,ch:S.chain,cm:S.cm,ob:ob.slice(0,48)}`, `mg:S.magnet>0?Math.ceil(S.magnet):0,x2:S.mult>0?Math.ceil(S.mult):0,or:S.orbT>0?Math.ceil(S.orbT):0,ch:S.chain,cm:S.cm,ob:ob.slice(0,48)}`);

  /* sign-in refused by the server: say why, nicely */
  rep(`problem('Couldn’t sign you in',e&&e.status===401?`, `problem('Couldn’t sign you in',e&&e.body&&e.body.closed?(e.body.error||'The campaign is not open.'):e&&e.status===401?`);
});

/* ---- profile picture prompt in the username step ---- */
edit('index.html', (rep) => {
  rep(`<input type="file" id="avf" accept="image/*" hidden></div><h2>Enter your <em>username</em></h2>`,
      `<input type="file" id="avf" accept="image/*" hidden></div>
      <button class="btn ghost" id="avcta" type="button" style="max-width:300px;margin:-4px auto 8px;font-size:13px">\${hasPic0?'📷 Change your profile picture':'📷 Add your profile picture'}</button>
      <div class="hint" id="avhint" style="min-height:16px;margin-bottom:6px">\${hasPic0?'This is your Glyph picture. You can keep it or upload another.':'Pick a picture so other players know who you are on the boards and in texts.'}</div>
      <h2>Enter your <em>username</em></h2>`);
  rep(`  const askTyped=async()=>{
    const save=`, `  const askTyped=async()=>{
    let hasPic0=!!(P.glyph&&safeUrl(P.glyph.picture)),nudged=false;
    const save=`);
  rep(`    plus.onclick=()=>pick.click();`, `    plus.onclick=()=>pick.click();
    const cta=$('#avcta',root),hint=$('#avhint',root);if(cta)cta.onclick=()=>pick.click();
    if(!hasPic0)plus.classList.add('pulse');`);
  rep(`        const data=await shrinkImage(f);avc.innerHTML=imgTagData(data);`, `        const data=await shrinkImage(f);avc.innerHTML=imgTagData(data);hasPic0=true;plus.classList.remove('pulse');if(cta)cta.textContent='📷 Change your profile picture';if(hint){hint.textContent='Looking good! That is your picture now.';hint.style.color='#86c183'}`);
  rep(`      if(!X_RE.test(v)){err.textContent='Type your X handle (letters, numbers and _ only, up to 15).';return}`, `      if(!X_RE.test(v)){err.textContent='Type your X handle (letters, numbers and _ only, up to 15).';return}
      if(!hasPic0&&!nudged){nudged=true;err.textContent='Add a profile picture first so other players recognize you. Tap the + (or press OK again to skip).';plus.classList.add('pulse');beep(440,.08);return}`);
  rep(`.rbtn.pulse{`, `.avp.pulse{animation:howp 1.3s ease-in-out infinite}
.rbtn.pulse{`);
});

console.log('ok');
