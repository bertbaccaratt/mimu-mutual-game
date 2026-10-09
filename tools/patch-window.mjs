// Chair Run is open from the campaign opening until the "gaming stops" alarm (Tue Oct 13, 6:00 AM Pacific).
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('backend/src/index.js', (rep) => {
  rep(`  const opensAt = Number(env.CHAIR_RUN_OPENS_AT) || Date.UTC(2026, 9, 11, 1, 0, 0);
  if (env.CHAIR_RUN_OPEN === '0' || (env.CHAIR_RUN_OPEN !== '1' && Date.now() < opensAt)) return json(env, req, { error: 'Chair Run opens when the campaign countdown ends, Sat Oct 10 at 6:00 PM PST. Your scores and login are saved.', closed: true, opensAt }, 403);`,
`  const opensAt = Number(env.CHAIR_RUN_OPENS_AT) || Date.UTC(2026, 9, 11, 1, 0, 0), closesAt = Number(env.CHAIR_RUN_CLOSES_AT) || Date.UTC(2026, 9, 13, 13, 0, 0);
  const nowMs = Date.now();
  if (env.CHAIR_RUN_OPEN === '0' || (env.CHAIR_RUN_OPEN !== '1' && nowMs < opensAt)) return json(env, req, { error: 'Chair Run opens when the campaign countdown ends, Sat Oct 10 at 6:00 PM PST. Your scores and login are saved.', closed: true, opensAt }, 403);
  if (env.CHAIR_RUN_OPEN !== '1' && nowMs >= closesAt) return json(env, req, { error: 'Gaming has stopped. The 24-hour donation window is next. Your scores and login are saved.', closed: true, closesAt }, 403);`);
});
edit('backend/wrangler.toml', (rep) => {
  rep(`# Chair Run opens by itself when the campaign countdown ends (Sat Oct 10, 6:00 PM Pacific). Set CHAIR_RUN_OPEN = "0" to force it closed or "1" to force it open.`,
      `# Chair Run is open from the campaign opening (Sat Oct 10, 6:00 PM Pacific) until gaming stops (Tue Oct 13, 6:00 AM Pacific). Set CHAIR_RUN_OPEN = "0" to force it closed or "1" to force it open.`);
});
edit('index.html', (rep) => {
  rep(`const chairOpen=()=>Date.now()>=CAMPAIGN.open;`, `const chairOpen=()=>{const n=Date.now();return n>=CAMPAIGN.open&&n<ALARM_AT};`);
  rep(`<h2>Chair Run opens soon</h2>
      <p>The halls open when the campaign countdown ends: <b>Sat Oct 10 at 6:00 PM PST</b>. Your login and $TMF are saved, and Mutual Mimu, the Top 5, the leaderboards and your texts are open now.</p>`,
      `<h2>\${Date.now()<CAMPAIGN.open?'Chair Run opens soon':'Gaming has stopped'}</h2>
      <p>\${Date.now()<CAMPAIGN.open?'The halls open when the campaign countdown ends: <b>Sat Oct 10 at 6:00 PM PST</b>. Your login and $TMF are saved, and Mutual Mimu, the Top 5, the leaderboards and your texts are open now.':'No more Chair Runs this campaign. Your scores, login and $TMF are saved. The <b>24-hour donation window</b> is next, in the Top 5 app (Tue 6:00 AM to Wed 6:00 AM PST).'}</p>`);
});
console.log('ok');
