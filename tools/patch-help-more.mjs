// Chair Run "?" help: 13 more cards (controls, on-screen guide, where big scores come from, power-up combos, gate decision guide,
// Second Wind prices, speed timeline, reading the road, the 8 chairs, carpet colors, quests and season points, keep your run safe, never share your wallet).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };
const esc = (h) => { if (/['\\]/.test(h)) throw new Error('bad char: ' + h.match(/.{0,25}['\\].{0,25}/)[0]); return h.replace(/\n/g, '').replace(/"/g, '\\"'); };
const card = (c, ic, title, body) => `<div class="fm ${c}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ic}</span><b>${title}</b></div>${body}</div></div>`;
const tab = (cols, head, rows) => `<div class="ttab"><div class="ttr tth" style="--cols:${cols}">${head.map((h) => `<span>${h}</span>`).join('')}</div>${rows.map((r) => `<div class="ttr" style="--cols:${cols}">${r.map((c, i) => (i === 0 ? `<b>${c}</b>` : `<span>${c}</span>`)).join('')}</div>`).join('')}</div>`;
const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;

const fmt = (n) => n.toLocaleString('en-US');
const cards = {};

/* 16 controls */
cards.controls = card('c-blue', '🎮', 'Controls', `<p>Every action, on a phone and on a keyboard.</p>` + tab('66px 1fr 1fr', ['Action', 'Touch', 'Keyboard'], [
  ['Left / right', 'Swipe left or right', '← → or A D'],
  ['Jump', 'Swipe up or tap', '↑, W or Space'],
  ['Slide', 'Swipe down', '↓ or S'],
  ['Drop fast', 'Swipe down in mid air', '↓ or S in mid air']]) + ul([
  '<b>Jump buffer:</b> a jump you press just before landing (about a sixth of a second) is remembered and fires on landing, so you can chain hops.',
  '<b>Slide</b> lasts about two thirds of a second, long enough to pass a banner.',
  '<b>There is no pause.</b> Once a run starts, it keeps going until you are benched or tap Quit.']));

/* 14 what everything on screen means */
cards.screen = card('c-silver', '📱', 'What everything on screen means', ul([
  '<b>Score</b> (top left chip): your points this run, with the chain multiplier already applied.',
  '<b>$TMF</b> (next chip): the coins you are carrying in this run. This is what a Ballot Gate invests.',
  '<b>?</b> (top right): this guide. It only opens between runs, since the game cannot be paused.',
  '<b>Hearts</b> (under the chips): your 3 lives.',
  '<b>Power-up chips</b>: 💼 SHIELD, 🔔 MAGNET and ✨ x2 with their countdown in seconds, and 🔴 CALM with a minutes:seconds countdown.',
  '<b>Chain counter</b> (left): your multiplier (x1 to x5) and your chain, with a bar that drains over the 4 seconds you have before it breaks.',
  '<b>Notices</b> (top centre, one at a time): gold for points and milestones, blue for power-ups, red for danger.',
  '<b>Red flash on the edges</b>: you were hit. <b>Red glow around the whole screen</b>: the red orb calm is active.',
  '<b>Rainbow lights over the phone</b>: a 1 million point disco party. <b>Big 3, 2, 1</b>: the start countdown.']));

/* 2 where big scores come from */
cards.score = card('c-gold', '📐', 'Where big scores come from', `<p>Your score has two engines. Speed points are small and steady. <b>Milestone bonuses grow the longer you run</b>, and they take over.</p>
<p style="margin-top:6px"><b>Speed points per minute</b> (speed × multiplier × 60):</p>` + tab('34px 1fr 1fr 1fr 1fr', ['Speed', 'x1', 'x2', 'x5', 'x10 (Star)'], [
  ['11', '660', '1,320', '3,300', '6,600'], ['15', '900', '1,800', '4,500', '9,000'], ['20', '1,200', '2,400', '6,000', '12,000'],
  ['23', '1,380', '2,760', '6,900', '13,800'], ['26', '1,560', '3,120', '7,800', '15,600'], ['30', '1,800', '3,600', '9,000', '18,000']]) +
`<p style="margin-top:8px"><b>Milestone bonus</b> (every 250 m pays 50 × the milestone number × your chain multiplier):</p>` + tab('46px 1fr 1fr 1fr 1fr', ['Distance', 'Time', 'Bonus x1', 'Bonus x5', 'All added up (x5)'], [
  ['1 km', '~1.3 min', '200', '1,000', '2,500'], ['5 km', '~4.5 min', '1,000', '5,000', '52,500'], ['10 km', '~8 min', '2,000', '10,000', '205,000'],
  ['25 km', '~17 min', '5,000', '25,000', '1,262,500'], ['50 km', '~34 min', '10,000', '50,000', '5,025,000'], ['100 km', '~65 min', '20,000', '100,000', '20,050,000']]) +
ul(['<b>The two big levers:</b> a long run and a high chain. A x5 chain at 50 km pays five times what x1 pays.',
  '<b>A Star does not double milestones.</b> Only the chain multiplier does. The Star doubles coins, hops and speed points.',
  '<b>Gate bells</b> add or remove 10 points per $TMF on top of all this.']));

/* 13 power-up combos */
cards.combos = card('c-pink', '🧩', 'Power-up combos', ul([
  '<b>Star + a big chain:</b> a x5 chain with a Star is x10 on coins, hops and speed points. It does not change milestones or gate bells.',
  '<b>Magnet + Star:</b> the magnet pulls every coin in reach to you, and the Star doubles each one (2 $TMF per coin).',
  '<b>The Briefcase keeps your chain.</b> A hit it blocks costs no life and does not break the chain. You can hold one at a time.',
  '<b>Grabbing the same power-up again</b> just refreshes its timer: Star back to 10 seconds, Bell back to 9.',
  '<b>Take the Briefcase before dense sections,</b> like the walls of 3 chairs, then spend it there.',
  '<b>During the red orb calm</b> you run about 20% slower for 60 seconds. It is a good moment to rebuild a broken chain or sweep up coins.',
  '<b>Second Wind</b> also gives 2.6 seconds of protection and clears what is right in front of you, so use the moment to line up your next lane.']));

/* 9 gate decision guide */
cards.guide = card('c-violet', '🧭', 'Gate decision guide', `<p>Read the sign above the gate first, then think about how much you carry.</p>` + tab('62px 1fr 1fr', ['Mood', 'Best lane', 'Avoid'], [
  ['Risk-on', 'Degen, then Growth', 'Hard assets (they fall)'],
  ['Choppy', 'Balanced or Growth to grow, Safe to protect', 'Degen unless you can afford it'],
  ['Risk-off', 'Hard assets (GOLD, VAULT), then Safe', 'Degen and Growth']]) + ul([
  '<b>Empty or tiny stack (under about 50 $TMF):</b> take the riskiest lane. You cannot lose more than you hold, so it is a free roll. It pays a few $TMF on average and a lucky bell can pay over 100.',
  '<b>A stack you need for Second Wind:</b> keep it in Safe or Hard lanes. Check the price table.',
  '<b>Leading and protecting a big stack:</b> Safe or Hard. About +1% to +2% a bell with almost no risk.',
  '<b>Chasing a rival:</b> Growth in Risk-on is the sensible gamble. Degen wipes you out 1 bell in 5 to 1 in 3.',
  '<b>Do the sum on a wipe-out:</b> it costs 10 points for every $TMF. A 20,000 $TMF stack wiped out is 200,000 points.',
  '<b>The left lane is always Safe or Hard,</b> so there is always a low-risk lane. The right lane may be Growth instead of Degen.']));

/* 1 Second Wind price table */
cards.sw = card('c-teal', '🏷', 'Second Wind price table', `<p>The price is 30 $TMF plus 10 for every full million points you have when you lose your last life.</p>` + tab('1fr 1fr', ['Your score', 'Second Wind costs'], [
  ['Under 1M', '30 $TMF'], ['1M', '40 $TMF'], ['2M', '50 $TMF'], ['5M', '80 $TMF'], ['10M', '130 $TMF'], ['20M', '230 $TMF'], ['30M', '330 $TMF'], ['50M', '530 $TMF'], ['100M', '1,030 $TMF']]) + ul([
  'It is paid from the $TMF you carry in the run first, and your wallet from earlier runs tops up the rest.',
  'If run $TMF plus wallet cannot cover the price, there is no offer and the run ends.',
  'A bad bell can shrink your stack, so keep a reserve if you want the comeback.']));

/* 4 speed timeline */
cards.speed = card('c-cyan', '⏲', 'Speed timeline', `<p>How fast you run, and how far you cover, as the minutes go by.</p>` + tab('1fr 1fr 1fr', ['Time in run', 'Top speed', 'Distance per minute'], [
  ['0:00', '11', '660 m'], ['1:00', '~15', '~900 m'], ['2:00', '~19', '~1,140 m'], ['3:00', '23.5', '1,410 m'], ['6:00', '24', '1,440 m'], ['12:00', '25', '1,500 m'],
  ['24:00', '27', '1,620 m'], ['36:00', '29', '1,740 m'], ['42:00 and on', '30 (ceiling)', '1,800 m']]) + ul([
  'The first 3 minutes ramp from 11 up to 23. After that the top speed rises 0.5 every 3 minutes.',
  'A hit slows you to about 60% for a second. The red orb takes 5 off your top speed for 60 seconds.']));

/* 11 reading the road */
cards.road = card('c-green2', '🛣', 'Reading the road', ul([
  '<b>Coins come in lines.</b> There are about 276 on every kilometre. Staying in one lane picks up about 80 to 125 of them, and sweeping every lane about 270.',
  '<b>Rolling chairs</b> (from 420 m) travel toward you on top of your speed, so jump a little later than usual.',
  '<b>Walls of 3 chairs</b> (from 525 m) block every lane. There is no way round, so jump.',
  '<b>Double banners</b> (from 1,225 m) mean a longer slide for two in a row.',
  '<b>Change lane early.</b> A late swipe is how most hits happen at speed.',
  '<b>Link your hops.</b> Every chair cleared adds 3 to your chain, and the jump buffer lets you jump right as you land.',
  '<b>The chain is on a 4 second clock.</b> If the road is empty, steer into a coin line to keep it alive.',
  '<b>Spot the gate early:</b> a purple frame with three panels. The coin lines in front of each lane are your last chance to collect before you commit.']));

/* 3 the 8 chairs */
cards.chairs = card('c-orange', '🪑', 'The 8 chairs', `<p>A chair hurts you unless you clear about 82% of its height. A full jump reaches about 1.8, so every chair can be cleared if the timing is right.</p>` + tab('1fr 40px 44px', ['Chair', 'Height', 'Share'], [
  ['The Intern’s Folding Chair', '0.85', '30.9%'], ['Creaking Wooden Swivel', '0.95', '21.2%'], ['Beige Task Chair', '1.0', '19.4%'], ['Green Banker’s Chair', '1.0', '14.0%'],
  ['Oxblood Wingback', '1.25', '6.8%'], ['Deep Button Chesterfield', '1.0', '4.5%'], ['Tasteful Walnut Lounge', '0.8', '2.2%'], ['The Gilded Throne', '1.6', '0.9%']]) + ul([
  'Share is how often each chair appears. The Gilded Throne is the rarest and the tallest, so jump near the top of your arc.',
  'Jump 25 of each type to complete the chair gallery in the Badges app.']));

/* 5 carpet colors */
const sw = (hex) => `<span class="sw" style="background:${hex}"></span>`;
cards.carpet = card('c-rainbow', '🎨', 'The carpet colors', `<p>The carpet changes color every 10 million points, and the cycle repeats after 100 million.</p>` + tab('1fr 1fr', ['Score reached', 'Carpet'], [
  ['Start to 10M', sw('#7a2430') + 'Crimson'], ['10M', sw('#2a4aa8') + 'Royal blue'], ['20M', sw('#1f8f5a') + 'Green'], ['30M', sw('#7a35a8') + 'Purple'], ['40M', sw('#1f8f98') + 'Teal'],
  ['50M', sw('#c0821c') + 'Amber'], ['60M', sw('#a82a6a') + 'Magenta'], ['70M', sw('#3a3a44') + 'Slate'], ['80M', sw('#b34a14') + 'Burnt orange'], ['90M', sw('#1a1a2e') + 'Midnight, neon trim'], ['100M', sw('#7a2430') + 'Back to crimson']]) +
  ul(['Each change comes with a message, confetti and a short celebration. It is display only and does not change the game.']));

/* 6 quests and season points */
cards.quests = card('c-yellow', '📋', 'Quests and season points, in numbers', `<p>Three quests a day, picked from this list, with an easy, medium or hard goal.</p>` + tab('1fr 1fr 40px', ['Quest', 'Goals', 'SP'], [
  ['Collect $TMF', '120, 200 or 320', '60'], ['Hop chairs', '20, 35 or 50', '60'], ['Run in total', '1,500, 2,500 or 4,000 m', '70'], ['Finish runs', '3, 4 or 6', '50'], ['Reach a chain', 'x2, x3 or x4', '80'], ['Score in one run', '2,500, 4,000 or 6,000', '90']]) +
`<p style="margin-top:8px"><b>Season points for each run</b> = your score ÷ 5, plus 2 for every $TMF you finish with, plus any quest rewards. For example a 1,000,000 point run with 500 $TMF is 201,000 SP.</p>
<p style="margin-top:6px"><b>Season Badge thresholds</b> (total SP): ` + ['2,500', '6,000', '10,500', '16,000', '22,500', '30,000', '38,500', '48,000', '58,500', '70,000'].map((v, i) => `#${i + 1} at ${v}`).join(' · ') + `. Each badge needs 1,000 more than the step before.</p>`);

/* 18 keep your run safe */
cards.safe = card('c-red', '🛟', 'Keep your run safe', `<p>An interrupted run is lost, so protect it.</p>` + ul([
  '<b>Keep Chair Run in front.</b> Another app or tab can freeze the run, and a phone can close the page.',
  '<b>Do not refresh or close the page</b> until the run complete screen has finished ranking you.',
  '<b>Use a steady connection.</b> The game sends your run to the server in small pieces about every 40 seconds.',
  '<b>Sign in fresh before a long run.</b> Your sign-in lasts 12 hours. If it runs out in the middle of a run, that run cannot be saved.',
  '<b>Charge your phone</b> and switch on Do Not Disturb so a call does not take over the screen.',
  '<b>If it says not saved yet,</b> tap retry before you leave the screen.',
  '<b>One run is capped at 4 hours.</b>']));

/* 21 never share your wallet */
cards.wallet = card('c-green', '🔐', 'Never share your wallet', ul([
  '<b>Connecting only asks for a free signature</b> of a plain message that names this site. It sends no transaction and cannot move your assets.',
  '<b>This game never asks</b> for a seed phrase, a private key, a password or any payment details. If anything asks for those, it is not us.',
  '<b>Only connect on mutualmimu.fun.</b> Check the address bar before you sign.',
  '<b>$TMF in this game is virtual.</b> It has no cash value and is not the token.',
  '<b>You can disconnect any time</b> in Settings.']));

/* ---- placement ---- */
const NEXT = '<div class=\\"fm';
const after = (marker, html) => { const i = t.indexOf(marker); if (i < 0) throw new Error('marker ' + marker); const n = t.indexOf(NEXT, i + marker.length); if (n < 0) throw new Error('next card ' + marker); t = t.slice(0, n) + esc(html) + t.slice(n); };
const before = (marker, html) => { const i = t.indexOf(marker); if (i < 0) throw new Error('marker ' + marker); const s = t.lastIndexOf(NEXT, i); t = t.slice(0, s) + esc(html) + t.slice(s); };
after('<b>The basics</b>', cards.controls + cards.screen);
after('<b>How your score is built</b>', cards.score);
after('<b>Power-ups: Star, Briefcase and Bell</b>', cards.combos);
after('<b>Risks and what to expect</b>', cards.guide);
after('<span class=\\"mmi\\">🩹</span><b>Second Wind</b>', cards.sw);
after('<b>How the speed climbs</b>', cards.speed);
after('<b>How the obstacles get harder with distance</b>', cards.road + cards.chairs);
after('<b>Milestones and surprises</b>', cards.carpet);
after('<b>Daily quests and your streak</b>', cards.quests);
before('<b>Tips for a big run</b>', cards.safe + cards.wallet);

/* ---- CSS for the tables ---- */
rep(`.mmk{display:grid;gap:7px;margin-top:9px;position:relative;padding-left:12px}`,
`.ttab{margin-top:8px;border-radius:12px;background:rgba(255,255,255,.04);padding:3px 7px 4px}
.ttab .ttr{display:grid;grid-template-columns:var(--cols);gap:0 6px;align-items:center;padding:3px 0;border-top:1px solid rgba(255,255,255,.06);font:500 9.5px/1.35 var(--mono);color:var(--cream)}
.ttab .ttr b{color:#fff;font-size:10px;font-weight:700}
.ttab .tth{font:700 8px/1.25 var(--mono);letter-spacing:.04em;text-transform:uppercase;color:var(--cc);border-top:0;padding-bottom:4px}
.ttab .sw{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:6px;vertical-align:-2px;border:1px solid rgba(255,255,255,.35)}
.mmk{display:grid;gap:7px;margin-top:9px;position:relative;padding-left:12px}`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
