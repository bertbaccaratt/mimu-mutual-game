// Chair Run reopens by itself when the campaign countdown ends (Sat Oct 10, 6:00 PM Pacific).
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('backend/src/index.js', (rep) => {
  rep(`  if (env.CHAIR_RUN_OPEN === '0') return json(env, req, { error: 'Chair Run is closed. Thanks for playing! Your scores and login are saved.', closed: true }, 403);   // runs already in progress can still finish and count`,
`  /* Chair Run opens when the campaign countdown ends (Sat Oct 10 2026, 6:00 PM Pacific). CHAIR_RUN_OPEN = "1" forces it open (staging), "0" forces it closed. Runs already in progress can still finish and count. */
  const opensAt = Number(env.CHAIR_RUN_OPENS_AT) || Date.UTC(2026, 9, 11, 1, 0, 0);
  if (env.CHAIR_RUN_OPEN === '0' || (env.CHAIR_RUN_OPEN !== '1' && Date.now() < opensAt)) return json(env, req, { error: 'Chair Run opens when the campaign countdown ends, Sat Oct 10 at 6:00 PM PST. Your scores and login are saved.', closed: true, opensAt }, 403);`);
});
edit('backend/wrangler.toml', (rep) => {
  rep(`CHAIR_RUN_OPEN = "0"   # "0" = Chair Run is closed (no new runs). Runs already in progress still finish and count. Remove or set "1" to reopen.
`, `# Chair Run opens by itself when the campaign countdown ends (Sat Oct 10, 6:00 PM Pacific). Set CHAIR_RUN_OPEN = "0" to force it closed or "1" to force it open.
`);
});
edit('backend/wrangler.staging.toml', (rep) => {
  rep(`X_REQUIRED = "1"`, `CHAIR_RUN_OPEN = "1"          # staging: always open so the tests can run
X_REQUIRED = "1"`);
});
edit('index.html', (rep) => {
  rep(`const CHAIR_RUN_OPEN=false;   /* Chair Run is closed: the tile is greyed out and no new runs start. Login, scores and the other apps stay as they are. */`,
      `/* Chair Run is greyed out and closed until the campaign countdown ends; then it opens by itself. Login, scores and the other apps are not affected. */
const chairOpen=()=>Date.now()>=CAMPAIGN.open;`);
  rep(`||(a.id==='run'&&!CHAIR_RUN_OPEN)?' lk':''}`, `||(a.id==='run'&&!chairOpen())?' lk':''}`);
  rep(`  if(!CHAIR_RUN_OPEN){
    if(GATE.ok){closed();return ctl}`, `  if(!chairOpen()){
    if(GATE.ok){closed();return ctl}`);
  rep(`\${CHAIR_RUN_OPEN?'Enter the halls':'Continue'}`, `\${chairOpen()?'Enter the halls':'Continue'}`);
  rep(`<h2>Chair Run is closed</h2>
      <p>Thanks for running the halls. Your scores, your login and your $TMF are saved. Mutual Mimu, the Top 5, the leaderboards and your texts are still open.</p>`,
      `<h2>Chair Run opens soon</h2>
      <p>The halls open when the campaign countdown ends: <b>Sat Oct 10 at 6:00 PM PST</b>. Your login and $TMF are saved, and Mutual Mimu, the Top 5, the leaderboards and your texts are open now.</p>`);
  /* the tile wakes up by itself when the countdown ends */
  rep(`function syncAlarm(){const n=Date.now(),on=n>=ALARM_AT&&n<CAMPAIGN.close;`, `function syncAlarm(){const n=Date.now(),on=n>=ALARM_AT&&n<CAMPAIGN.close;document.querySelectorAll('.app-i[data-open=run]').forEach(b=>b.classList.toggle('lk',!chairOpen()));`);
});
console.log('ok');
