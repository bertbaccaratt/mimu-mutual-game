// Final wording pass: achievement count, how giving really scores (+3), Pacific Time label, Mimugotchi in the guide, alarm text.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (file, fn, post) => {
  const p = root + file;
  let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
  const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(file + ': ' + n + ' matches for ' + a.slice(0, 80)); t = t.replace(a, () => b); };
  if (fn) fn(rep);
  if (post) t = post(t);
  fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
};
// "PST" is wrong in October (Los Angeles is on PDT): use the season-proof "PT". The code comment that explains PST/PDT stays as it is.
const ptLabel = (t) => t.split('\n').map((l) => (l.includes('PST in winter') ? l : l.replace(/\bPST\b/g, 'PT'))).join('\n');

edit('index.html', (rep) => {
  rep(`<b>168 achievements</b> in 16 colored groups`, `<b>184 achievements</b> in 17 colored groups`);
  rep(`your level, 168 achievements, stats`, `your level, 184 achievements, stats`);
  rep(`(+2 points on their score for every $TMF)`, `(the $TMF itself plus a bonus of 2 points for every $TMF: 3 points of total score each)`);
  rep(`which also adds 2 points to that player&rsquo;s score for every $TMF`, `which adds those $TMF to that player&rsquo;s $TMF found and also adds a bonus of 2 points to their score for every $TMF (3 points of total score for each $TMF given)`);
  rep(`Giving to a top 5 player adds 2 points per $TMF to their score.`, `Giving to a top 5 player adds the $TMF itself plus a bonus of 2 points per $TMF to their score (3 points of total score for each $TMF given).`);
  rep(`+2 Chair Run points for every $TMF.</li>`, `a bonus of +2 Chair Run points for every $TMF, on top of the $TMF itself (3 points of total score for each one).</li>`);
  rep("<b>${giveAll?'+'+fmt(max*2)+' points':'+2 points for every $TMF'}</b>.", "<b>${giveAll?'+'+fmt(max*3)+' total score ('+fmt(max)+' $TMF plus '+fmt(max*2)+' bonus points)':'+3 total score for every $TMF (1 $TMF plus 2 bonus points)'}</b>.");
  rep(`<b>No new Chair Runs can start and no more points can be acquired.</b> A run already underway may finish. Your run scores are final.`, `<b>No new Chair Runs can start and no more run points can be earned.</b> A run already underway may finish and count. After that your run scores are final.`);
  rep(`        <div><b>The paper</b>`, `        <div><b>The Mimugotchi</b><span>The keychain pet on the blue post-its. Press it to switch it on for 60 minutes. It falls asleep every 5 minutes and waits for you to wake it. Each wake-up earns a few season points, it texts you in Messages, and it has its own badges.</span></div>\n        <div><b>The paper</b>`);
}, ptLabel);
edit('backend/src/index.js', null, ptLabel);
console.log('ok');
