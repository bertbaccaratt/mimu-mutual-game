// Chair Run cannot be clicked at all while it is closed (tile, nav and Play now). Signing in is still reachable from the locked apps.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

/* tile: truly disabled while closed */
rep(`\${(a.id==='ff'&&!GATE.ok)||(a.id==='run'&&!chairOpen())?' lk':''}" data-open="\${a.id}"\${a.id==='ff'&&!GATE.ok?' disabled aria-disabled="true" title="Connect Glyph in Chair Run first"':''}>`,
    `\${(a.id==='ff'&&!GATE.ok)||(a.id==='run'&&!chairOpen())?' lk':''}" data-open="\${a.id}"\${a.id==='ff'&&!GATE.ok&&chairOpen()?' disabled aria-disabled="true" title="Connect Glyph in Chair Run first"':''}\${a.id==='run'&&!chairOpen()?' disabled aria-disabled="true" title="'+chairClosedWhy()+'"':''}>`);

rep(`const chairOpen=()=>{const n=Date.now();return n>=CAMPAIGN.open&&n<ALARM_AT};`, `const chairOpen=()=>{const n=Date.now();return n>=CAMPAIGN.open&&n<ALARM_AT};
const chairClosedWhy=()=>Date.now()<CAMPAIGN.open?'Chair Run opens when the countdown ends: Sat Oct 10, 6:00 PM PST':'Gaming has stopped';`);

/* all the places that launch Chair Run */
rep(`function syncLocks(){
  const lock=!GATE.ok;
  document.querySelectorAll('[data-open=ff]').forEach(b=>{b.disabled=lock;b.classList.toggle('lk',lock);b.setAttribute('aria-disabled',lock?'true':'false');b.title=lock?'Connect Glyph in Chair Run first':''});
  document.querySelectorAll('[data-launch=ff]').forEach(b=>{b.disabled=lock;b.setAttribute('aria-disabled',lock?'true':'false');b.title=lock?'Connect Glyph in Chair Run first':''});
}`, `function syncLocks(){
  const lock=!GATE.ok,open=chairOpen(),shut=!open;
  /* Mutual Mimu: closed until signed in. While Chair Run is closed it stays tappable so a player can still reach the sign-in. */
  document.querySelectorAll('[data-open=ff]').forEach(b=>{b.disabled=lock&&open;b.classList.toggle('lk',lock);b.setAttribute('aria-disabled',lock&&open?'true':'false');b.title=lock?(open?'Connect Glyph in Chair Run first':'Sign in with Glyph'):''});
  document.querySelectorAll('[data-launch=ff]').forEach(b=>{b.disabled=lock&&open;b.setAttribute('aria-disabled',lock&&open?'true':'false');b.title=lock?(open?'Connect Glyph in Chair Run first':'Sign in with Glyph'):''});
  /* Chair Run: cannot be clicked at all until the countdown ends, and again after gaming stops */
  document.querySelectorAll('[data-open=run],[data-launch=run],[data-launch=play]').forEach(b=>{b.disabled=shut;b.classList.toggle('lk',shut&&b.classList.contains('app-i'));b.setAttribute('aria-disabled',shut?'true':'false');b.title=shut?chairClosedWhy():''});
}`);
rep(`function openApp(id,from){
  if(id==='ff'&&!GATE.ok){try{toast(`, `function openApp(id,from){
  if(id==='ff'&&!GATE.ok&&!chairOpen())id='run';                /* Chair Run is closed: the sign-in is reached through the locked apps instead */
  if(id==='ff'&&!GATE.ok){try{toast(`);
rep(`function syncAlarm(){const n=Date.now(),on=n>=ALARM_AT&&n<CAMPAIGN.close;document.querySelectorAll('.app-i[data-open=run]').forEach(b=>b.classList.toggle('lk',!chairOpen()));`, `function syncAlarm(){const n=Date.now(),on=n>=ALARM_AT&&n<CAMPAIGN.close;if(typeof syncLocks==='function')syncLocks();`);

rep(`.app-i.lk[data-open=run] .ic{filter:grayscale(1)}`, `.app-i.lk[data-open=run] .ic{filter:grayscale(1)}
.app-i:disabled{cursor:not-allowed}
nav button:disabled{opacity:.45;cursor:not-allowed}`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
