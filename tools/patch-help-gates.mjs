// Chair Run "?" help: the strict run rule, and the Ballot Gate / Closing Bell rules in full detail (same card style as the rest of the help).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---- the cards (written as plain HTML, then escaped for the single-quoted string the help lives in) ---- */
const esc = (h) => { if (/['\\]/.test(h)) throw new Error('bad char in card: ' + h.match(/.{0,20}['\\].{0,20}/)[0]); return h.replace(/\n/g, '').replace(/"/g, '\\"'); };
const card = (c, ic, title, body) => `<div class="fm ${c}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ic}</span><b>${title}</b></div>${body}</div></div>`;
const row = (a, dots, avg, rng, wipe) => `<div class="gr"><b>${a}</b><span class="gd">${'●'.repeat(dots)}${'○'.repeat(5 - dots)}</span><span>${avg}</span><span>${rng}</span><span>${wipe}</span></div>`;
const cls = (n) => `<div class="gc">${n}</div>`;

const strict = card('c-red', '⚠', 'A run only counts if it ends',
  `<p>This is a strict contest. Your run is scored only when it ends and its result reaches our server.</p><ul>
<li><b>It ends</b> when you are benched or you tap Quit.</li>
<li><b>An interrupted run does not count.</b> A dead phone, a closed tab, a refresh or a lost connection means that run is thrown away and you start over.</li>
<li><b>Your earlier finished runs still count.</b> Every finished run is added to your weekly total.</li>
<li>If the end of run screen says <b>not saved yet</b>, tap <b>retry</b> before you leave that screen.</li>
<li>One run can last up to 4 hours.</li></ul>`);

const gates = card('c-violet', '🗳', 'Ballot Gates: how they work',
  `<p>A purple gate appears every 900 m, the first at 650 m. At full speed that is about one every 36 seconds. This is where the $TMF you carry gets invested.</p><ul>
<li><b>Three lane panels.</b> Each shows an asset symbol and five risk dots. You vote by running through one panel, so steer into your lane before the gate.</li>
<li><b>Your vote locks</b> the moment you pass the gate. There is no changing it.</li>
<li><b>What each lane offers:</b> the left lane is a Safe or Hard asset, the middle lane a Balanced or Growth asset, the right lane a Growth or Degen asset. The assets are re-rolled at every gate.</li>
<li><b>Coins before the gate:</b> each lane has a short coin line in front of it, so collect before you commit.</li>
<li><b>The bell rings 110 m after the gate</b> and settles your vote. If your run ends before the bell, that vote pays nothing and costs nothing.</li>
<li><b>What you invest:</b> only the $TMF you are carrying in this run. The wallet from earlier runs is never used.</li>
<li><b>Carrying 0 $TMF</b> means you cannot lose anything at the bell. You can only gain a little.</li></ul>`);

const payout = card('c-gold2', '🧮', 'The payout, exactly',
  `<p><b>Pay = (20 + the $TMF you carry) × the asset return × 9</b>, rounded to a whole $TMF.</p><ul>
<li><b>The asset return</b> = the asset base return + the market mood effect + a random swing. Safe assets swing a little and Degen assets swing a lot.</li>
<li><b>Market mood:</b> the sign above the gate is the real number used in the pay. Risk-on is above +0.4, Risk-off below −0.4, Choppy is in between.</li>
<li><b>What the mood alone does to your stack</b> at the strongest Risk-on: Degen about +47%, Growth +32%, Balanced +16%, Safe +3%, and <b>Hard assets move the other way, about −9%</b>. At a normal Risk-on sign it is about half of that. Risk-off flips every sign.</li>
<li><b>A gain:</b> you get the pay in $TMF and <b>+10 points for every $TMF</b>.</li>
<li><b>A loss:</b> the same amount comes off your run $TMF, and <b>10 points per $TMF come off your score</b>. A bell <b>never takes more than you carry</b>, so the worst case is losing all of it.</li>
<li><b>Your chain, multiplier and Stars do not change the pay.</b> Only your stack, the asset and the mood do.</li>
<li><b>What you hold at the end of the run</b> goes to your wallet and counts on the leaderboard.</li></ul>`);

const assets = card('c-cyan', '📈', 'The 13 assets: what each one has paid',
  `<p>Figures are for a stack of 10,000 $TMF, from 200,000 simulated bells per asset, as a share of your stack per bell. The range covers 90 bells out of 100.</p>
<div class="gtab"><div class="gr gh"><span>Asset</span><span>Risk</span><span>Average</span><span>Worst 5% to best 5%</span><span>Wipe-out</span></div>
${cls('Safe')}${row('BILLS', 1, '+0.9%', '−6% to +7%', '0%')}${row('STBL', 1, '+1.2%', '−8% to +11%', '0%')}
${cls('Hard asset')}${row('GOLD', 2, '+1.8%', '−35% to +38%', '0%')}${row('VAULT', 2, '+1.5%', '−29% to +32%', '0%')}
${cls('Balanced')}${row('TMKT', 2, '+2.2%', '−45% to +49%', '0%')}${row('DIVS', 2, '+1.8%', '−33% to +37%', '0%')}
${cls('Growth')}${row('CHAIN', 4, '+5.1%', '−92% to +100%', '4%')}${row('AIINF', 4, '+6.1%', '−100% to +112%', '6%')}${row('APE', 4, '+5.2%', '−100% to +108%', '5%')}
${cls('Degen')}${row('DENG', 5, '+13.6%', '−100% to +185%', '18%')}${row('MEME', 5, '+22.8%', '−100% to +243%', '24%')}${row('LEV3', 5, '+35.9%', '−100% to +304%', '29%')}${row('PRE', 5, '+16.8%', '−100% to +201%', '19%')}</div>
<p style="margin-top:8px"><b>Wipe-out</b> is the chance a single bell takes your whole stack. The Degen averages are high only because a bell can never take more than you hold. The typical Degen result is just +2% to +4%.</p>`);

const risks = card('c-red2', '☠', 'Risks and what to expect',
  `<ul>
<li><b>Safe lanes</b> grow your stack slowly and almost never hurt: about +1% per bell.</li>
<li><b>Hard and Balanced lanes</b> average around +2%, but one bell can swing about 35% to 45% either way.</li>
<li><b>Growth lanes</b> average about +5% and can double your stack. About 1 bell in 20 wipes you out.</li>
<li><b>Degen lanes</b> average the most (+14% to +36%) because the downside stops at zero, but <b>about 1 bell in 5 to 1 in 3 wipes your whole stack</b>.</li>
<li><b>A wipe-out also costs points:</b> 10 points for every $TMF lost.</li>
<li><b>Streaks multiply.</b> A win raises your stack for the next bell and a loss shrinks it. Results are random, so no lane is a guaranteed win.</li>
<li><b>Examples with 1,000 $TMF carried:</b> STBL is about +13 $TMF (+130 points). A typical Growth bell is about +50 $TMF. A LEV3 bell averages about +360, but it can lose all 1,000 (−10,000 points).</li>
<li><b>Tip:</b> the bigger the stack, the bigger the swing. Protect a big stack with Safe and Hard lanes, and take Degen lanes when you are happy to risk it.</li></ul>`);

/* ---- insert into the help string ---- */
{
  const lives = t.indexOf('<b>Lives and hits</b>');
  if (lives < 0) throw new Error('lives card');
  const at = t.lastIndexOf('<div class=\\"fm', lives);
  if (at < 0) throw new Error('lives card start');
  t = t.slice(0, at) + esc(strict) + t.slice(at);
}
{
  const g = t.indexOf('how you earn money in a run');
  if (g < 0) throw new Error('gate card');
  const start = t.lastIndexOf('<div class=\\"fm', g);
  const end = t.indexOf('<div class=\\"fm', g);
  if (start < 0 || end < 0) throw new Error('gate card bounds');
  t = t.slice(0, start) + esc(gates) + esc(payout) + esc(assets) + esc(risks) + t.slice(end);
}
rep(`the Badges app tracks 160+ achievements`, `the Badges app tracks 184 achievements`);

/* ---- CSS for the asset table ---- */
rep(`.mmk{display:grid;gap:7px;margin-top:9px;position:relative;padding-left:12px}`,
`.gtab{margin-top:8px;border-radius:12px;background:rgba(255,255,255,.04);padding:4px 6px}
.gtab .gr{display:grid;grid-template-columns:44px 40px 46px 1fr 40px;gap:0 6px;align-items:center;padding:3px 0;font:500 10.5px/1.3 var(--mono);color:var(--cream)}
.gtab .gr b{color:#fff;font-weight:700}.gtab .gd{color:var(--cc);letter-spacing:-.04em;font-size:9px}
.gtab .gh{font:700 8.5px/1.2 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--cc);opacity:.9;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:4px}
.gtab .gc{margin:5px 0 1px;font:800 9.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--cc);opacity:.9}
.mmk{display:grid;gap:7px;margin-top:9px;position:relative;padding-left:12px}`);

/* ---- "How this site works": the same facts in the long guide ---- */
rep(`Coin lines in front of each lane let you collect before you commit.</p>`,
`Coin lines in front of each lane let you collect before you commit.</p>
      <ul class="gd-list">
        <li><b>Lanes:</b> the left lane offers a Safe or Hard asset, the middle lane a Balanced or Growth asset, the right lane a Growth or Degen asset. Your vote locks as you pass the gate.</li>
        <li><b>The bell</b> rings 110 m after the gate. If your run ends first, that vote pays nothing and costs nothing. Carrying 0 $TMF means you can&rsquo;t lose anything.</li>
        <li><b>The mood sign is real:</b> Risk-on is above +0.4 and Risk-off below &minus;0.4. At the strongest Risk-on the mood alone moves your stack about +47% (Degen), +32% (Growth), +16% (Balanced), +3% (Safe) and &minus;9% (Hard assets). Risk-off flips the signs.</li>
        <li><b>Typical results per bell</b> (stack of 10,000 $TMF): Safe about +1%, Hard about +2%, Balanced about +2%, Growth about +5% (1 bell in 20 wipes you out), Degen +14% to +36% on average but 1 bell in 5 to 1 in 3 wipes your whole stack.</li>
        <li><b>Gains and losses move your score</b> by 10 points per $TMF. A bell never takes more than you carry. Your chain, multiplier and Stars don&rsquo;t change the pay. Tap the <b>?</b> in Chair Run for the full asset table.</li>
      </ul>`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
