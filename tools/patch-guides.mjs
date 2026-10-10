// Ultra-thorough "?" guides for Chair Run and Mutual Mimu (colourful mind maps).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 90)); t = t.replace(a, () => b); };

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const li = (arr) => arr.length ? '<ul>' + arr.map((x) => '<li>' + x + '</li>').join('') + '</ul>' : '';
const node = (cls, ico, title, intro, bullets) => `<div class="fm ${cls}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ico}</span><b>${title}</b></div>${intro ? '<p>' + intro + '</p>' : ''}${li(bullets || [])}</div></div>`;

const CR = [
  node('c-blue', '↔', 'The basics', 'You run down a hall of chairs as your Mimu. A run lasts until you are benched. There is no pause button, so once it starts it keeps going.', [
    '<b>Change lane:</b> swipe left or right, or use the arrow keys or A and D. There are 3 lanes.',
    '<b>Jump:</b> swipe up, tap the screen, or press the up arrow, W or Space. A jump you press just before landing is remembered.',
    '<b>Slide:</b> swipe down or press the down arrow or S to slide under banners. Pressing it in mid air drops you fast.',
    '<b>What hurts you:</b> only chairs and hanging banners. Coins, power-ups and the red orb are all good for you.']),
  node('c-red', '❤', 'Lives and hits', 'You have 3 lives, shown as hearts at the top left.', [
    'A chair hurts you unless you are high enough over it. Taller chairs need a better-timed jump.',
    'A banner hurts you unless you are sliding under it.',
    'A hit costs 1 life, slows you down for about a second, gives you 1.5 seconds of protection and breaks your chain.',
    'The briefcase blocks one hit for free.',
    'On your last life the game warns you: one more hit ends the run unless you take a Second Wind.']),
  node('c-gold', '🪙', '$TMF coins and how you use them', 'The $TMF box at the top shows how many coins you are carrying this run.', [
    'Every coin is worth 10 points x your chain multiplier, and it adds 1 to your $TMF.',
    'The $TMF you collect in a run goes into your wallet when the run ends, and it counts toward your total on the leaderboard.',
    'You can spend $TMF during a run in two ways: the <b>Second Wind</b> (30 $TMF) and the <b>Closing Bell</b> at each Ballot Gate, where the coins you carry are invested.',
    'If your run coins are short for a Second Wind, your wallet from earlier runs tops it up.']),
  node('c-orange', '🔥', 'Chain and the x5 multiplier', 'The chain is your streak. It is the biggest lever on your score.', [
    'Every coin adds <b>1</b> to the chain and every chair you hop adds <b>3</b>.',
    'Every 10 in the chain raises your multiplier by 1, up to <b>x5 at a chain of 40</b>.',
    'The multiplier applies to coin points, hop points, distance points and milestone bonuses.',
    'You have <b>4 seconds</b> after your last gain before the chain breaks. The bar under the chain number counts it down.',
    'A hit breaks the chain too.',
    'The Star (x2) stacks on top, so a x5 chain with a Star is x10.']),
  node('c-green', '📊', 'How your score is built', 'Four things add points, and every one of them is multiplied by your chain.', [
    '<b>Coins:</b> 10 points each.',
    '<b>Chair hops:</b> 15 points for clearing a chair with a jump.',
    '<b>Distance:</b> points every second based on your speed, so running fast with a big chain is where huge scores come from.',
    '<b>Milestones:</b> every 250 m pays 50 x the milestone number x your chain. The 250 m one pays 50, the 500 m one pays 100, the 1,000 m one pays 200, and it keeps growing.',
    '<b>Closing Bell:</b> each $TMF gained or lost at a Ballot Gate moves your score by 10 points.']),
  node('c-pink', '⚡', 'Power-ups: Star, Briefcase and Bell', 'About 1 in every 9 patterns of obstacles carries one, floating in a random lane. Run through it to take it.', [
    '<b>✨ Star:</b> gilded x2. Double points and double coins for 10 seconds.',
    '<b>💼 Briefcase:</b> a shield that blocks your next hit, then it breaks. You can hold one at a time.',
    '<b>🔔 Bell:</b> a coin magnet. Coins near you fly to you for 9 seconds.',
    'A chip at the top shows each active power-up and its countdown.']),
  node('c-violet', '🗳', 'Ballot Gate and the Closing Bell: how you earn money in a run', 'A purple gate appears every 900 m, the first at 650 m. This is where the $TMF you carry gets invested.', [
    '<b>Three lane panels.</b> Each shows a symbol such as BILLS, GOLD, CHAIN or MEME and five risk dots. You choose by running through one panel, so steer into your lane before the gate.',
    '<b>The lanes:</b> left offers a safe or hard asset, the middle a balanced or growth asset, and the right a growth or degen asset.',
    '<b>Market mood:</b> the sign above the gate says Risk-on, Risk-off or Choppy. Growth and degen assets amplify the mood. Safe and gold-style assets lean against it.',
    '<b>Asset types:</b> Safe (BILLS, STBL) pays small and steady. Hard (GOLD, VAULT) tends to move against fear. Balanced (TMKT, DIVS) sits in the middle. Growth (CHAIN, AIINF, APE) swings more. Degen (DENG, MEME, LEV3, PRE) can pay big or cost big.',
    '<b>Coins before the gate:</b> each lane has a short coin line in front of it, so collect before you commit.',
    '<b>The bell rings 110 m later</b> and pays a dividend or takes a drawdown. The pay is (20 + the $TMF you carry) x the asset return x 9.',
    '<b>Bigger stack, bigger swing.</b> Carrying more $TMF makes the result larger in both directions. A drawdown can never take more than you are carrying.',
    '<b>Score:</b> every $TMF gained or lost also moves your score by 10 points.']),
  node('c-red2', '🩹', 'Second Wind', 'Your one comeback per run.', [
    'When you lose your last life and can afford it, you get a 5 second offer to keep running for <b>30 $TMF</b>.',
    'You keep your score and your chain.',
    'It gives you 1 life, 2.6 seconds of protection, a short slow-down and clears the obstacles right in front of you.',
    '<b>One time per run.</b> After you use it, the next fall ends the run.']),
  node('c-cyan', '⏱', 'How the speed climbs', 'Speed is measured in units per second. The harder you survive, the faster it gets.', [
    'You start at speed <b>11</b>.',
    'Every 230 m you run adds <b>1</b>, until speed <b>23</b> at about 2,760 m (a little under 3 minutes).',
    'After the first 3 minutes the top speed keeps climbing: <b>+0.5 every 3 minutes</b>, up to a ceiling of <b>30 at minute 42</b>.',
    'A hit slows you for a second, then your speed builds back up.',
    'Gaps between obstacles shrink as you speed up, so you have less time to react.']),
  node('c-redorb', '🔴', 'The red orb: every 2.5 million points', 'A glowing red orb is your breather on a very long run.', [
    'At <b>2.5M, 5M, 7.5M, 10M</b> and every 2.5 million after that, a red orb appears on the road.',
    'Run into it to catch it. Your top speed is <b>0.5 lower for 3 minutes</b>, then it comes back by itself to wherever the ramp has reached.',
    'Catching it plays a burst and a ring and does not slow you down on its own.',
    'A red chip at the top shows the 3 minute countdown, and a message tells you when the calm ends.',
    'If you miss it, the next orb comes at the next 2.5 million. Catching one while another is active just refreshes the 3 minutes.']),
  node('c-yellow', '🧱', 'How the obstacles get harder with distance', 'Alongside speed, the hall itself changes as you go further.', [
    '<b>From 420 m:</b> chairs that roll toward you, on top of your own speed.',
    '<b>From 525 m:</b> walls of 3 chairs across every lane. The only way through is to jump.',
    '<b>From 1,225 m:</b> two banners at once, so you need to slide for both.',
    '<b>Up to 3,500 m:</b> the taller, tougher chair types become more common and the gaps between patterns shrink.',
    '<b>After 3,500 m</b> the obstacle mix stays at its hardest. The speed stairs keep tightening it.']),
  node('c-rainbow', '🌈', 'Milestones and surprises', 'The game tells you what is happening, with a short note under each message.', [
    '<b>Every 250 m:</b> a milestone bonus.',
    '<b>Every 1 million points:</b> a message, plus a 10 second RGB disco party over the phone.',
    '<b>Every 10 million:</b> the carpet changes color (there are 10 colors that repeat).',
    '<b>Long-run badges:</b> 1M, 10M, 20M, 50M and 100M in a single run unlock special badges. They are just for fun and do not touch the leaderboard.']),
  node('c-silver', '🏅', 'Badges, season points and the gallery', 'Everything you earn is tracked in the Badges app.', [
    'Each run earns <b>season points (SP)</b>: your score divided by 5, plus 2 per $TMF, plus quest bonuses.',
    'The season meter fills toward the next <b>Season Badge</b>. The first is at 2,500 SP and each one after needs a bit more.',
    '<b>Chair gallery:</b> jump 25 of each of the 8 chair types to unlock it.',
    '<b>Patron status</b> comes from giving $TMF to other players in the Top 5 app.']),
  node('c-teal', '📅', 'Daily quests and your streak', 'Three quests every day, and a streak for coming back.', [
    'Quests are picked from: collect $TMF, hop chairs, run meters in total, finish runs, reach a chain, and score in one run.',
    'Each quest pays 50 to 90 season points when you finish it.',
    'Play on consecutive days to grow your daily streak (the flame in the start card).']),
  node('c-green2', '✅', 'Fair play and the leaderboard', 'Your run is checked, so every score on the board is real.', [
    'The server replays your recorded moves with the same rules and decides the score. A score cannot be made up.',
    'The weekly board counts your best single run plus the $TMF you found. Players with perfectly robotic timing are held for review.',
    'The Top 5 cannot send $TMF. Giving to a top 5 player adds 2 points per $TMF to their score.',
    'Chair Run is open from the countdown (Sat Oct 10, 6:00 PM PST) until gaming stops (Tue Oct 13, 6:00 AM PST). Gifts open for 24 hours after that.']),
  node('c-gold2', '💡', 'Tips for a big run', '', [
    'Build the chain early. A x5 multiplier is worth more than any single coin.',
    'Steer into the lane you want before a Ballot Gate, and carry some $TMF in, since your payout scales with it.',
    'Keep 30 $TMF in reserve so the Second Wind is always available.',
    'Grab the Briefcase before the dense sections, and use the orb to take a breather on long runs.',
  ]),
];
const crHTML = '<div class="howc"><div class="mmhub"><span>&#129681;</span><b>CHAIR RUN</b><small>every feature</small></div><div class="mmtrunk">' + CR.join('') + '</div><button class="btn gold" id="hwx" style="margin-top:12px">Got it</button></div>';

const FF = [
  node('c-gold', '🔔', 'The Closing Bell', 'Mutual Mimu is a round-based room. Everything resolves at the bell.', [
    'The bell rings every <b>4 hours 20 minutes</b>. The countdown and progress bar are at the top.',
    'Votes lock at the bell and a fresh ballot opens straight away. If the bell rang while you were away, it resolves when you open the app.',
    'Your vote and stake are saved automatically as you change them.']),
  node('c-blue', '☀', 'Weather forecast', 'A guess about the market mood for this round.', [
    'It reads Risk-on, Mild tailwind, Choppy, Mild headwind or Risk-off, with a <b>% sure</b> tag for how confident it is.',
    'It is a forecast, not a promise. The real weather can differ.',
    'Growth and degen assets amplify the weather. Safe and gold-style assets lean against it.']),
  node('c-violet', '🗳', 'The proxy ballot', 'Four proposals, from boring to wild. The room votes and the biggest total wins.', [
    'There is always one safe or hard asset, one balanced, one growth and one degen proposal.',
    'Each card shows the symbol, the asset type, a one-line description, a <b>risk bar</b> of 1 to 5, how it did <b>last round</b>, and its current share of the vote.',
    'Tap a card to cast your vote. You can change it until the bell.',
    'If two proposals tie for the lead, the bell picks one at random.']),
  node('c-green', '💰', 'Stake', 'How much of your $TMF rides on the vote.', [
    'Slide in steps of 10, up to the $TMF in your wallet.',
    'A heavier stake gives you <b>more weight</b> in the vote: 8 plus 1 for every 25 $TMF staked, up to a total weight of 78.',
    'You only have a stake in play if you voted. With no vote, you just watch from the gallery.',
    'You can never lose more than your stake.']),
  node('c-orange', '⚡', 'Leverage', 'A multiplier on both the win and the loss.', [
    'Pick <b>1x, 2x or 3x</b>. It multiplies the result of your stake in both directions.',
    'Because losses are capped at your stake, 3x can wipe the stake but never more.']),
  node('c-pink', '🤝', 'Voting blocs', 'Three groups with their own tastes and weight.', [
    'Each bloc shows its weight and which proposal it leans toward right now.',
    'Pick a proposal first. Then <b>court</b> a bloc for <b>3 $TMF per point of its weight</b>, and it follows your pick this round.',
    'A courted bloc swings the whole vote, so a well-timed court can decide the winner.']),
  node('c-red', '🏆', 'How the bell pays', 'The winning proposal sets the return for the round.', [
    'The winner is the proposal with the most weight. Everyone who voted rides that result.',
    'Your result = <b>stake x the asset return x your leverage</b>, with the loss capped at your stake.',
    'Returns here are 3x the size of a Chair Run gate. Safe assets move a little, degen assets move a lot.',
    'The result adds to or takes from your wallet, and the bell shows a payout check or a loss card.']),
  node('c-silver', '🏅', 'Season points and history', 'Showing up pays even when the room goes against you.', [
    'Every bell gives <b>+50 season points</b>, and <b>+100 more</b> when you finish in profit.',
    'They fill your meter in the Badges app.',
    'The <b>Recent bells</b> card lists your last 5 rounds with the winning asset and your result.']),
  node('c-rainbow', '🪑', 'Where $TMF comes from', 'Mutual Mimu uses the $TMF in your own wallet on your phone.', [
    'Earn $TMF by running the halls in Chair Run. The coins you collect land in your wallet when a run ends.',
    'Mutual Mimu unlocks once you connect Glyph and pass the wallet checks.',
    'Your wallet balance here is yours on this phone. It is separate from the leaderboard totals the server keeps.']),
  node('c-gold2', '💡', 'Tips', '', [
    'Check the forecast and its confidence before choosing growth or degen.',
    'Vote early, then add a stake. Your vote only counts for payout if you cast it before the bell.',
    'Use leverage when you are confident and keep some $TMF back for Chair Run\'s Second Wind.']),
];
const ffHTML = '<div class="howc"><div class="mmhub"><span>&#128276;</span><b>MUTUAL MIMU</b><small>every feature</small></div><div class="mmtrunk">' + FF.join('') + '</div><button class="btn gold" id="ffx" style="margin-top:12px">Got it</button></div>';

/* swap the Chair Run guide */
{
  const aMark = `    o.innerHTML='<div class=\\"howc\\"><div class=\\"mmhub\\"><span>&#129681;</span>`;
  const a = t.indexOf(aMark);
  const endMark = `Got it</button></div>';`;
  const b = t.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error('chair run guide anchors');
  t = t.slice(0, a) + '    o.innerHTML=' + JSON.stringify(crHTML).replace(/'/g, "\\'").replace(/^"|"$/g, "'") + ';' + t.slice(b + endMark.length);
}
/* swap the Mutual Mimu guide */
{
  const aMark = `    o.innerHTML='<div class="howc"><div class="mmhub"><span>&#128276;</span>`;
  const a = t.indexOf(aMark);
  const endMark = `'</div><button class="btn gold" id="ffx" style="margin-top:12px">Got it</button></div>';`;
  const b = t.indexOf(endMark, a);
  if (a < 0 || b < 0) throw new Error('mutual mimu guide anchors');
  t = t.slice(0, a) + '    o.innerHTML=' + JSON.stringify(ffHTML).replace(/'/g, "\\'").replace(/^"|"$/g, "'") + ';' + t.slice(b + endMark.length);
}

rep(`.mmc p b{color:#fff;opacity:1}`, `.mmc p b{color:#fff;opacity:1}
.mmc ul{margin:7px 0 0;padding-left:17px}
.mmc li{font:400 12px/1.45 var(--sans);color:var(--cream);opacity:.93;margin:4px 0}
.mmc li b{color:#fff}
.c-red2{--cc:#ff7b5a}.c-redorb{--cc:#ff3b3b}.c-yellow{--cc:#e8d24a}.c-gold2{--cc:#f0b84a}.c-teal{--cc:#35d0c0}.c-green2{--cc:#5be08a}.c-cyan{--cc:#38c8ff}`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok', CR.length, 'chair run sections,', FF.length, 'mutual mimu sections');
