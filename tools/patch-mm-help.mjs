// Mutual Mimu "?" help: weight table, the three blocs, what each asset pays, wipe-out chances by leverage,
// where leverage wipes you, season points in numbers, and what happens if you are away.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const esc = (h) => { if (/['\\]/.test(h)) throw new Error('bad char: ' + h.match(/.{0,25}['\\].{0,25}/)[0]); return h.replace(/\n/g, '').replace(/"/g, '\\"'); };
const card = (c, ic, title, body) => `<div class="fm ${c}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ic}</span><b>${title}</b></div>${body}</div></div>`;
const tab = (cols, head, rows) => `<div class="ttab"><div class="ttr tth" style="--cols:${cols}">${head.map((h) => `<span>${h}</span>`).join('')}</div>${rows.map((r) => `<div class="ttr" style="--cols:${cols}">${r.map((c, i) => (i === 0 ? `<b>${c}</b>` : `<span>${c}</span>`)).join('')}</div>`).join('')}</div>`;
const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const dots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
const arow = (a, avg, rng, wipe) => `<div class="gtr"><b>${a}</b><em>${avg}</em><span>${rng}</span><span class="gtw${wipe === '0%' ? '' : ' hot'}">${wipe}</span></div>`;
const acls = (n, d) => `<div class="gtc"><span>${n}</span><span class="gtd">${dots(d)}</span></div>`;

const weight = card('c-green2', '⚖', 'Your weight in the vote', `<p>Your weight is <b>8 plus 1 for every 25 $TMF you stake</b>, up to a total of 78. You only have weight if you voted.</p>` +
  tab('1fr 1fr', ['Your stake', 'Your weight'], [['Vote only (0 $TMF)', '8'], ['250 $TMF', '18'], ['500 $TMF', '28'], ['1,000 $TMF', '48'], ['1,750 $TMF or more', '78 (the cap)']]) + ul([
  'A bloc is worth 45 to 75 weight, so a maxed-out stake is about one whole bloc.',
  'Staking more than 1,750 $TMF does not add weight, but it does raise what you win or lose.']));

const blocs = card('c-pink', '🏛', 'The three blocs, in detail', `<p>Each round every bloc picks the proposal it likes best, from its taste and from how the assets did last round.</p>` +
  tab('72px 1fr 1fr', ['Bloc', 'Likes', 'Follows last round?'], [
    ['Three-Eyed Council', 'Growth and Degen, some Balanced and Hard', 'A little'],
    ['Fur Traders Guild', 'Safe, Balanced and Hard. Dislikes Degen', 'Barely'],
    ['Cape & Cowl Club', 'Degen and Growth. Dislikes Safe', 'Strongly']]) + ul([
  '<b>Weight:</b> every bloc is worth 45 to 75, re-rolled each round.',
  '<b>Price to court:</b> 3 $TMF per point of weight, so 135 to 225 $TMF per bloc. You pay it straight away and it is not refunded.',
  '<b>A courted bloc</b> follows your pick for that round only.',
  '<b>Tie-breaker:</b> if proposals tie for the lead, the bell picks one at random.']));

const pays = card('c-cyan', '📈', 'What each asset pays per round', `<p>Per round and before leverage, as a share of your stake, from 150,000 simulated rounds per asset. Returns here are 3 times a Chair Run gate. The range covers 90 rounds out of 100.</p>
<div class="gtab"><div class="gtr gth"><span>Asset</span><span>Avg</span><span>Worst 5% to best 5%</span><span>3x wipe</span></div>
${acls('Safe', 1)}${arow('BILLS', '+0.3%', '−2% to +3%', '0%')}${arow('STBL', '+0.4%', '−3% to +4%', '0%')}
${acls('Hard asset', 2)}${arow('GOLD', '+0.6%', '−12% to +13%', '0%')}${arow('VAULT', '+0.5%', '−10% to +11%', '0%')}
${acls('Balanced', 2)}${arow('TMKT', '+0.8%', '−15% to +16%', '0%')}${arow('DIVS', '+0.6%', '−11% to +13%', '0%')}
${acls('Growth', 4)}${arow('CHAIN', '+1.4%', '−31% to +34%', '4%')}${arow('AIINF', '+1.6%', '−34% to +37%', '6%')}${arow('APE', '+1.4%', '−34% to +36%', '5%')}
${acls('Degen', 5)}${arow('DENG', '+0.8%', '−60% to +62%', '18%')}${arow('MEME', '+0.9%', '−80% to +81%', '24%')}${arow('LEV3', '+1.2%', '−99% to +101%', '28%')}${arow('PRE', '+1.6%', '−64% to +67%', '19%')}</div>` + ul([
  'A typical round loses money about 4 times in 10 for Safe and about 5 times in 10 for the rest. The averages are small, so streaks and leverage decide the big swings.',
  '<b>3x wipe</b> is the chance that one round takes your whole stake at 3x leverage.']));

const wipes = card('c-red2', '☠', 'Wipe-out chances by leverage', `<p>The chance that a single round takes your whole stake (you can never lose more than the stake).</p>` +
  tab('1fr 1fr 1fr 1fr', ['Asset type', '1x', '2x', '3x'], [
    ['Safe', '0%', '0%', '0%'], ['Hard asset', '0%', '0%', '0%'], ['Balanced', '0%', '0%', '0%'],
    ['Growth', '0%', 'about 1%', '4% to 6%'], ['Degen', '0% to 5%', '9% to 20%', '18% to 28%']]) + ul([
  'LEV3 is the wildest: about 5% at 1x, 20% at 2x and 28% at 3x.',
  'Leverage multiplies both ways: it is a bet on the winning proposal being good, not a way to make a safe asset safer.']));

const lever = card('c-orange', '🎚', 'Where leverage wipes you', `<p>What a round does to your stake at each leverage setting.</p>` +
  tab('44px 1fr 1fr 1fr 1fr', ['Lever', 'Asset +10%', 'Asset −10%', 'Asset −40%', 'Gone when'], [
    ['1x', '+10%', '−10%', '−40%', 'asset −100%'], ['2x', '+20%', '−20%', '−80%', 'asset −50%'], ['3x', '+30%', '−30%', '−100%', 'asset −33%']]) + ul([
  'At 3x a −40% round would be −120%, but the loss stops at your stake, so you lose 100%.',
  'Your result is always stake × the asset return × leverage, with the loss capped at your stake.']));

const sp = card('c-silver', '🏅', 'Season points, in numbers', ul([
  '<b>Every bell pays +50 SP</b>, even if you did not vote. <b>+100 more</b> when your round finishes in profit, so a profitable round is 150 SP.',
  '<b>About 5.5 bells a day,</b> so Mutual Mimu is worth about 280 SP a day with no profit and up to about 830 SP a day if every round is in profit.',
  '<b>The first Season Badge is at 2,500 SP:</b> 17 profitable bells or 50 bells with no profit. Later badges need 6,000, 10,500, 16,000 and so on.',
  '<b>Chair Run pays far more per run</b> (score ÷ 5), so Mutual Mimu points are a steady bonus on top.']));

const away = card('c-blue', '🌙', 'If you are away', ul([
  '<b>A bell that rang while you were away resolves when you open Mutual Mimu.</b>',
  '<b>Several missed bells count as one round,</b> not one each. You do not catch up on the rounds in between.',
  '<b>Your last saved vote, stake and leverage are what count.</b> If you never voted, nothing is at risk, and you still get +50 SP.',
  '<b>Your stake is capped to what you have at the bell.</b> If you spend $TMF on blocs, or on a Second Wind in Chair Run, a bigger stake shrinks to your wallet.',
  '<b>Courted blocs only last for the round you bought them in.</b>']));

const NEXT = '<div class=\\"fm';
const after = (marker, html) => { const i = t.indexOf(marker); if (i < 0) throw new Error('marker ' + marker); if (t.indexOf(marker, i + 1) >= 0) throw new Error('marker not unique ' + marker); const n = t.indexOf(NEXT, i + marker.length); if (n < 0) throw new Error('next card ' + marker); t = t.slice(0, n) + esc(html) + t.slice(n); };
after('<span class=\\"mmi\\">🔔</span><b>The Closing Bell</b>', away);
after('<span class=\\"mmi\\">💰</span><b>Stake</b>', weight);
after('<span class=\\"mmi\\">⚡</span><b>Leverage</b>', lever + wipes);
after('<span class=\\"mmi\\">🤝</span><b>Voting blocs</b>', blocs);
after('<span class=\\"mmi\\">🏆</span><b>How the bell pays</b>', pays);
after('<span class=\\"mmi\\">🏅</span><b>Season points and history</b>', sp);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
