// Game features popup as a colourful mind map, with the star / briefcase / bell and the one-time 30 $TMF Second Wind.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

const a = t.indexOf(`    o.innerHTML='<div class="howc">`);
const endMark = `<button class="btn gold" id="hwx" style="margin-top:6px">Got it</button></div>';`;
const b = t.indexOf(endMark);
if (a < 0 || b < a) throw new Error('howov anchors');
const node = (cls, ico, title, body) => `<div class="mm ${cls}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ico}</span><b>${title}</b></div><p>${body}</p></div></div>`;
const html = [
  `<div class="howc"><div class="mmhub"><span>&#129681;</span><b>CHAIR RUN</b><small>how it all works</small></div><div class="mmtrunk">`,
  node('c-blue', '↔', 'Move', 'Swipe or use the arrow keys / A D W S. Left and right dodge. Up jumps chairs. Down slides under banners.'),
  node('c-gold', '🪙', '$TMF coins', 'Grab coins as you run. They feed your chain, your score and your total, and you can give them to the Top 5 during the donation window.'),
  `<div class="mm c-pink"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">⚡</span><b>Power-ups</b></div><p>Floating pickups on the floor. Run into one to grab it.</p><div class="mmk"><div class="k k1"><span>✨</span><b>Star</b><em>Gilded x2. Double points and double coins for 10 seconds.</em></div><div class="k k2"><span>💼</span><b>Briefcase</b><em>Shield. Blocks your next hit, then it breaks.</em></div><div class="k k3"><span>🔔</span><b>Bell</b><em>Coin magnet. Pulls nearby coins to you for 9 seconds.</em></div></div></div></div>`,
  node('c-violet', '🗳', 'Ballot Gate', 'Pick a lane at each gate. Your vote decides what the closing bell pays, as a $TMF dividend or a drawdown.'),
  node('c-orange', '🔥', 'Chains', 'Clear coins and chairs back to back to build a chain. Every 10 in a row raises your multiplier, up to x5. Four seconds without a gain breaks it.'),
  node('c-red', '❤', 'Second Wind', 'Lose your last life and you can pay <b>30 $TMF to try again, ONE TIME per run</b>. Use it and the next fall ends the run.'),
  node('c-rainbow', '🌈', 'Milestones', 'Every 1 million points pops a surprise. Every 10 million the runway changes color.'),
  node('c-silver', '🏅', 'Long-run badges', 'Reach 1M, 10M, 20M, 50M and 100M in a single run to unlock special badges in the Badges app. Just for fun, separate from the leaderboard.'),
  node('c-green', '✅', 'Fair scores', 'Every run is replayed and checked by the server. Daily quests and your streak give bonus season points.'),
  `</div><button class="btn gold" id="hwx" style="margin-top:12px">Got it</button></div>`,
].join('');
t = t.slice(0, a) + `    o.innerHTML=${JSON.stringify(html).replace(/'/g, "\\'").replace(/^"|"$/g, "'")};` + t.slice(b + endMark.length);

rep(`.howc .fxr{padding:8px 0;border-top:1px solid rgba(255,255,255,.07)}
.howc .fxr b{display:block;font:700 12px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--gold2);margin-bottom:2px}
.howc .fxr span{font:400 12.5px/1.45 var(--sans);color:var(--cream);opacity:.88}`, `.mmhub{margin:0 auto 4px;width:132px;padding:12px 8px;border-radius:50% / 42%;text-align:center;background:radial-gradient(circle at 30% 25%,#ffe9a8,#d9b25f 55%,#a8741f);box-shadow:0 0 0 3px rgba(217,178,95,.25),0 0 28px rgba(217,178,95,.55);color:#2a1a08}
.mmhub span{font-size:26px;display:block;line-height:1}.mmhub b{display:block;font:800 15px var(--sans);letter-spacing:.08em}.mmhub small{font:600 9.5px var(--mono);opacity:.75;text-transform:uppercase;letter-spacing:.08em}
.mmtrunk{position:relative;margin:0 0 0 14px;padding:14px 0 0 22px;border-left:3px solid transparent;border-image:linear-gradient(180deg,#5aa0ff,#e9c24f,#ff6fb5,#9b7bff,#ff9a4a,#ff5a5a,#4fd1a5,#d0d6e0,#5be08a) 1}
.mm{position:relative;margin-bottom:11px}
.mm::before{content:"";position:absolute;left:-22px;top:20px;width:20px;height:3px;background:var(--cc,#e9c24f);border-radius:2px}
.mmd{position:absolute;left:-30px;top:13px;width:13px;height:13px;border-radius:50%;background:var(--cc,#e9c24f);box-shadow:0 0 0 3px rgba(0,0,0,.45),0 0 12px var(--cc,#e9c24f)}
.mmc{padding:10px 12px 11px;border-radius:16px;background:linear-gradient(135deg,color-mix(in srgb,var(--cc,#e9c24f) 26%,#1a0f12),#1a0f12 78%);border:1px solid color-mix(in srgb,var(--cc,#e9c24f) 60%,transparent)}
.mmh{display:flex;align-items:center;gap:8px;margin-bottom:3px}.mmi{display:grid;place-items:center;width:26px;height:26px;border-radius:9px;background:var(--cc,#e9c24f);color:#1a0f12;font-size:14px;flex:none}
.mmh b{font:800 13px var(--sans);letter-spacing:.04em;text-transform:uppercase;color:var(--cc,#e9c24f)}
.mmc p{font:400 12.2px/1.45 var(--sans);color:var(--cream);opacity:.92;margin:0}.mmc p b{color:#fff;opacity:1}
.c-blue{--cc:#5aa0ff}.c-gold{--cc:#f0c64a}.c-pink{--cc:#ff6fb5}.c-violet{--cc:#9b7bff}.c-orange{--cc:#ff9a4a}.c-red{--cc:#ff5a5a}.c-green{--cc:#4fd1a5}.c-silver{--cc:#d0d6e0}.c-rainbow{--cc:#ff7bd5}
.c-rainbow .mmh b{background:linear-gradient(90deg,#ff5a5a,#f0c64a,#5be08a,#5aa0ff,#c07bff);-webkit-background-clip:text;background-clip:text;color:transparent}
.mmk{display:grid;gap:7px;margin-top:9px;position:relative;padding-left:12px}
.mmk::before{content:"";position:absolute;left:3px;top:6px;bottom:6px;width:2px;background:rgba(255,111,181,.5);border-radius:2px}
.mmk .k{position:relative;display:grid;grid-template-columns:30px 1fr;column-gap:8px;padding:7px 9px;border-radius:12px;background:rgba(255,255,255,.05)}
.mmk .k::before{content:"";position:absolute;left:-9px;top:50%;width:9px;height:2px;background:rgba(255,111,181,.5)}
.mmk .k span{grid-row:1/3;display:grid;place-items:center;font-size:20px;border-radius:10px;background:rgba(0,0,0,.35)}
.mmk .k b{font:700 12px var(--sans);color:#fff}.mmk .k em{font:400 11.5px/1.35 var(--sans);font-style:normal;color:var(--cream);opacity:.85}
.mmk .k1{box-shadow:inset 3px 0 0 #f0c64a}.mmk .k2{box-shadow:inset 3px 0 0 #7ac8ff}.mmk .k3{box-shadow:inset 3px 0 0 #b98cff}`);

/* site guide: name the three pickups and the one-time Second Wind */
rep(`a coin magnet, a briefcase shield and a gilded x2.`, `a <b>Bell</b> 🔔 coin magnet, a <b>Briefcase</b> 💼 shield and a <b>Star</b> ✨ gilded x2 (double points for 10 seconds).`);
rep(`you can pay 30 $TMF for a one-time <b>Second Wind</b>.`, `you can pay 30 $TMF for a <b>Second Wind</b> to try again. It works <b>one time per run</b>.`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
