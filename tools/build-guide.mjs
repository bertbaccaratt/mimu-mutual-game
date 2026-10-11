// Rebuilds "How this site works" (the red button) as the main info place, in the same card theme as the two ? panels.
//  - the Chair Run ? and Mutual Mimu ? cards are extracted from index.html and reused word for word (so the three never drift apart)
//  - site-level cards (start, schedule, how to win, Top 5, leaderboards, badges, apps, desk, fair play, FAQ, glossary) are written here
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---- small accuracy fixes in the Chair Run ? (they flow into the guide through the extraction below) ---- */
rep(`<p>The game tells you what is happening, with a short note under each message.</p>`, `<p>The game tells you what is happening. The first time you see a kind of message it comes with a short note, and after that just the title.</p>`);
rep(`Double points and double coins for 10 seconds.</li>`, `Double points and double coins for 10 seconds. It doubles coins, hops and speed points, but not milestone bonuses or gate bells.</li>`);

/* ---- extract the cards of the two ? panels ---- */
const extract = (anchor, endMarker) => {
  const s = t.indexOf(anchor); if (s < 0) throw new Error('anchor ' + anchor);
  const ts = t.indexOf('<div class=\\"mmtrunk\\">', s) + '<div class=\\"mmtrunk\\">'.length;
  const e = t.indexOf(endMarker, ts); if (e < 0) throw new Error('end ' + endMarker);
  const body = t.slice(ts, e);
  const raw = body.split('<div class=\\"fm ').filter(Boolean).map((x) => '<div class=\\"fm ' + x);
  return raw.map((r) => {
    const h = r.replace(/\\"/g, '"').replace(/\\'/g, "'");
    const title = (/class="mmh"><span class="mmi">[^<]*<\/span><b>([^<]*)<\/b>/.exec(h) || [])[1];
    if (!title) throw new Error('no title in card: ' + h.slice(0, 120));
    return { title, html: h };
  });
};
const CR = extract('<b>CHAIR RUN</b><small>every feature</small>', '</div><button class=\\"btn gold\\" id=\\"hwx\\"');
const MM = extract('<b>MUTUAL MIMU</b><small>every feature</small>', '</div><button class=\\"btn gold\\" id=\\"ffx\\"');
console.log('extracted', CR.length, 'Chair Run cards and', MM.length, 'Mutual Mimu cards');

/* ---- helpers ---- */
const card = (c, ic, title, body) => `<div class="fm ${c}"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">${ic}</span><b>${title}</b></div>${body}</div></div>`;
const tab = (cols, head, rows) => `<div class="ttab"><div class="ttr tth" style="--cols:${cols}">${head.map((h) => `<span>${h}</span>`).join('')}</div>${rows.map((r) => `<div class="ttr" style="--cols:${cols}">${r.map((c, i) => (i === 0 ? `<b>${c}</b>` : `<span>${c}</span>`)).join('')}</div>`).join('')}</div>`;
const ul = (items) => `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const steps = (items) => `<div class="gstep">${items.map((x, i) => `<div><b>${i + 1}</b><span>${x}</span></div>`).join('')}</div>`;
const qa = (items) => `<div class="gqa">${items.map(([q, a]) => `<div><b>${q}</b><span>${a}</span></div>`).join('')}</div>`;
// tables become collapsible so the page stays easy to scroll
const collapsible = (html) => html
  .replace(/<div class="(ttab|gtab)">/g, (m, c) => `<details class="gdet" open><summary>Show or hide the table</summary><div class="${c}">`)
  .replace(/(<details class="gdet" open><summary>[^<]*<\/summary><div class="(?:ttab|gtab)">)([\s\S]*?)(<\/div>)(?=(?:<p|<ul|<\/div>|<div class="gtc"|$))/g, (m, a, b, c) => m);
// (the closing tag of a table is the same </div> as its last row, so wrap by structure instead)
const wrapTables = (html) => {
  let out = '', i = 0;
  while (i < html.length) {
    const m = /<div class="(ttab|gtab)">/.exec(html.slice(i));
    if (!m) { out += html.slice(i); break; }
    const start = i + m.index;
    out += html.slice(i, start);
    // find the matching closing div of the table
    let depth = 0, j = start;
    const re = /<div\b|<\/div>/g; re.lastIndex = start;
    let mm;
    while ((mm = re.exec(html))) { if (mm[0] === '</div>') { depth--; if (depth === 0) { j = re.lastIndex; break; } } else depth++; }
    out += `<details class="gdet" open><summary>Show or hide the table</summary>${html.slice(start, j)}</details>`;
    i = j;
  }
  return out;
};
const reuse = (list, title) => { const c = list.find((x) => x.title === title); if (!c) throw new Error('missing card: ' + title); return wrapTables(c.html); };
const reuseAll = (list, skip = []) => list.filter((c) => !skip.includes(c.title)).map((c) => wrapTables(c.html)).join('');
const chapter = (id, cls, ic, title, sub, cards) => `<section class="gdc ${cls}" id="${id}"><div class="gdch"><span class="gdci">${ic}</span><div><b>${title}</b><small>${sub}</small></div><button class="gtopb" type="button" data-gj="g-top">Back to top ↑</button></div><div class="mmtrunk">${cards}</div></section>`;

/* ================= site-level cards ================= */
const start = [
  card('c-red', '🎬', 'What this is', `<p>This is <b>Chair Run × Mutual Mimu</b>, a game by <b>MIMU ON APE</b> built for the <b>TMF Pass Mimu giveaway</b>. It is independent and is not affiliated with THE MUTUAL FUN project.</p>` + ul([
    '<b>The whole site is a desk.</b> The phone in the middle is the game. Everything you play lives on that screen, and the props around it are part of the fun.',
    '<b>Two games on one phone:</b> Chair Run (a runner where you collect $TMF and invest it at gates) and Mutual Mimu (a round-based boardroom where you vote and stake).',
    '<b>This page explains everything.</b> The <b>?</b> inside Chair Run and inside Mutual Mimu carries the same cards for that app.'])),
  card('c-green2', '⏱', 'Get playing in 30 seconds', steps([
    'Sign the NDA once (you only see it the first time on this browser), then swipe up or tap the lock screen, or press <em>Play now</em> in the top bar.',
    'First time only: meet your Mimu and enter the building.',
    'Tap <em>Chair Run</em> and connect your <em>Glyph</em> (you need a Mimu On Ape to run). Then type your username, which must be your X handle, and add a profile picture if you like.',
    'Press <em>Run</em>. Run, hop, grab $TMF, repeat. Tap the <b>?</b> in the top corner of Chair Run any time before a run for every rule.'])),
  card('c-blue', '🪪', 'What you need, and staying signed in', ul([
    '<b>A Mimu On Ape</b> in the wallet you connect. Wallets that already hold a <b>TMF Pass</b> or a <b>Dengs</b> cannot play.',
    '<b>Connecting only asks for a free signature</b> of a plain message that names this site. It sends no transaction and cannot move anything.',
    '<b>Your username must be your X handle.</b> One wallet per handle. It is shown on the leaderboards, in the Top 5 app and in your texts, together with your profile picture.',
    '<b>You stay signed in for up to 12 hours</b> on this browser, even if you refresh. After that, or after <em>Disconnect Glyph</em> in Settings, you sign in again. Do it fresh before a long run.',
    '<b>Your handle, Mimu, achievements and progress save in your browser.</b> Clearing your browser data clears them.'])),
  card('c-gold', '📅', 'Campaign schedule (Los Angeles time, PT)', steps([
    '<b>Campaign opens: Sat Oct 10, 6:00 PM.</b> The countdown on the home screen hits zero and Chair Run, sign-in and Mutual Mimu open by themselves. Before that they stay greyed out.',
    '<b>Gaming stops: Tue Oct 13, 6:00 AM.</b> Chair Run closes by itself and no new runs can start. A run already going can finish and count.',
    '<b>24-hour donation window: Tue 6:00 AM to Wed 6:00 AM.</b> The only time $TMF can be given to other players, in the Top 5 app.',
    '<b>Campaign closes: Wed Oct 14, 6:00 AM.</b> The end. The Final Recap app unlocks.']) +
    `<p style="margin-top:8px;font-size:12px;opacity:.8">The schedule can change. The countdown on the home screen and the Alarm app are live and always show the real times.</p>`)
].join('');

const win = [
  card('c-gold', '🏆', 'What decides the winner', ul([
    '<b>Total score = the points from all your finished runs this week added together + the $TMF you found</b> (plus any boost from gifts). Everyone is ranked by it in the Top 5 app.',
    '<b>The top 5 totals get gold frames.</b> The final standings are read when the campaign closes (Wed Oct 14, 6:00 AM PT).',
    '<b>If two players tie,</b> the one who reached that total first ranks higher.',
    '<b>Only finished runs count.</b> A run ends when you are benched or tap Quit and its result reaches the server. An interrupted run counts for nothing, and your earlier runs stay.',
    '<b>Recognition is decided by MIMU ON APE.</b> A rank does not entitle anyone to a reward. Details are in the Terms of Service.'])),
  card('c-pink', '🧗', 'Two ways to climb', `<p>Players climb in different ways. You can mix them.</p>` + ul([
    '<b>Endurance:</b> a long run with a big chain. Milestone bonuses grow with every kilometre, so one 60 to 90 minute run can be worth tens of millions of points.',
    '<b>$TMF:</b> collect coins, and invest what you carry at the Ballot Gates. A good bell can multiply a stack, and a bad one can wipe it. Every $TMF also counts towards your total.',
    '<b>Both matter.</b> Run points come from distance, chain and speed. $TMF found adds on top, and a gate result also moves your run points by 10 per $TMF.',
    '<b>Risk is yours to choose.</b> The safe lanes grow a stack slowly. The degen lanes can add a lot or take it all.'])),
  card('c-teal', '🎁', 'Gifts and timing', ul([
    '<b>Giving is only possible in the 24-hour donation window</b> (Tue 6:00 AM to Wed 6:00 AM PT).',
    '<b>The top 5 cannot give.</b> Everyone else can give or send $TMF in the Top 5 app.',
    '<b>Giving costs you:</b> the $TMF comes out of your own $TMF found. If you give to a top 5 runner, it lifts their total by 3 points for every $TMF.',
    '<b>Gifts are final.</b> They cannot be taken back.']))
].join('');

const top5 = [
  card('c-gold', '🥇', 'How the Top 5 works', ul([
    '<b>Every player is listed,</b> ranked by total score (all your finished run points + $TMF found). There is a search box to find a name.',
    '<b>The top 5</b> are shown in gold frames with a "top 5" tag. A line marks where the top 5 ends, and the 5th place shows "closest to falling out".',
    '<b>Ranks change live.</b> So whether you can give can change too.',
    '<b>Your own row</b> shows your rank, your run points and your $TMF.'])),
  card('c-teal', '💸', 'Giving and sending $TMF', ul([
    '<b>Give all</b> (on a top 5 runner): hands over every $TMF you hold to that runner. It adds the $TMF itself and a bonus of 2 points per $TMF to their score, so 3 points of total score for each one.',
    '<b>Send</b> (on anyone else): an amount you choose, to a player who has found at least 1 $TMF. No bonus points unless they are in the top 5 at that moment.',
    '<b>The amount</b> comes off your $TMF found and goes into theirs in one all-or-nothing step.',
    '<b>Final:</b> a gift cannot be undone.'])),
  card('c-red2', '🚫', 'Why Give or Send is greyed out', ul([
    '<b>The donation window is closed.</b> It is only open Tue 6:00 AM to Wed 6:00 AM PT. The app shows "Donations open soon" or "Donations closed".',
    '<b>You are in the top 5.</b> The top 5 cannot send $TMF. Fall out of the top 5 and the lock lifts.',
    '<b>You have no $TMF to give.</b> Earn some in Chair Run first.',
    '<b>The other player has no $TMF yet.</b> They need at least 1 $TMF found to receive.',
    '<b>You are not signed in.</b> Connect Glyph in Chair Run first.'])),
  card('c-yellow', '🤝', 'Patron status', `<p>Giving $TMF earns patron status in the Badges app.</p>` + tab('1fr 1fr', ['Total $TMF given', 'Badge'], [['1', 'Supporter'], ['100', 'Kind Heart'], ['500', 'Patron'], ['2,000', 'Benefactor'], ['5,000', 'Chairman’s Friend']]))
].join('');

const boards = [
  card('c-orange', '📊', 'The two weekly boards', ul([
    '<b>Chair Run board:</b> the points from every run you finish this week added together (plus any gift boost). Each run lifts you higher.',
    '<b>$TMF found board:</b> the $TMF you have found this week. It goes up with coins and gate dividends, and goes down if you give $TMF away.',
    '<b>The Top 5 app</b> adds the two together for the total that decides the standings.',
    '<b>The two boards can disagree.</b> Someone can lead on points and not on $TMF.'])),
  card('c-blue', '🔁', 'Resets and ranks', ul([
    '<b>Weekly boards reset every Friday at 1:00 PM Pacific.</b> This week runs until Fri Oct 16, after the campaign has closed.',
    '<b>"Your rank"</b> at the top of the Leaderboards app shows your place and how far you are from the top 5.',
    '<b>Scores are checked by the server.</b> A run that is under review does not show until it is cleared.',
    '<b>Not on the board yet?</b> Finish a run to put your name on it.']))
].join('');

const badges = [
  card('c-green', '🏅', 'Season badges', `<p>Your runs and bells fill the season meter in the Badges app. Each run earns <b>your score ÷ 5, plus 2 per $TMF you finish with, plus quest rewards</b>.</p>` +
    ul(['Badge thresholds (total SP): #1 at 2,500 · #2 at 6,000 · #3 at 10,500 · #4 at 16,000 · #5 at 22,500 · #6 at 30,000 · #7 at 38,500 · #8 at 48,000 · #9 at 58,500 · #10 at 70,000.', 'Each step needs 1,000 more than the one before.'])),
  card('c-violet', '📈', 'Levels and badge points', `<p>Every achievement you unlock gives badge points (10 × its tier), and your points set your level.</p>` + tab('1fr 1fr', ['Level', 'Badge points needed'], [
    ['Rookie', '0'], ['Hall Runner', '100'], ['Chair Hopper', '300'], ['Bell Ringer', '600'], ['Halls Veteran', '1,000'], ['Mimu Elite', '1,600'], ['Legend of the Halls', '2,400'], ['Chairman’s Pick', '3,500']]) +
    ul(['Medals run Bronze, Silver, Gold, Platinum, Diamond and Mythic as the goals get harder.'])),
  card('c-cyan', '🗂', '184 achievements in 17 groups', ul([
    'Runner · Score · Endurance · $TMF coins · Chain · Hops and chairs · Power-ups · Red orb · Ballot Gate · Survival · Milestones and parties · Daily play · Season · Mutual Mimu · Patron · Fun · Mimugotchi.',
    'Each group is a set of ladders, for example "Run 1,000 m / 10,000 m / 50,000 m in total".',
    'Achievements are just for fun and never change the leaderboard.'])),
  card('c-pink', '🖼', 'Your share card', ul([
    'At the top of the Badges app: a picture of your Mimu, name, level, badges, best run, runs, $TMF found, rank and medal counts.',
    '<b>Share on X</b> opens your phone share sheet with the picture, or a ready-made post on a computer. <b>Save image</b> downloads the PNG.',
    'The Final Recap app has the same card for your final numbers.'])),
  card('c-rainbow', '🎉', 'The Final Recap', ul([
    'It sits to the right of OpenSea and is greyed out until the campaign closes (Wed Oct 14, 6:00 AM PT).',
    'It shows the final top 5, how everyone did together, your own numbers, your badge level and a share card.',
    'A saved copy of the final board is kept on your phone if you open it before the weekly reset (Fri Oct 16, 1:00 PM PT).']))
].join('');

const apps = [
  card('c-red', '📱', 'Every app on the phone', `<div class="gd-grid">
    <div><b>Chair Run</b><span>The runner. Open from the countdown until gaming stops. This is where you connect your Glyph.</span></div>
    <div><b>Mutual Mimu</b><span>The boardroom: vote, stake $TMF and court a voting bloc. It stays greyed out until you connect your Glyph.</span></div>
    <div><b>Leaderboards</b><span>The two weekly boards, checked by the server.</span></div>
    <div><b>Badges</b><span>Share card, level, 184 achievements, stats, season meter, season badges, chair gallery and patron status.</span></div>
    <div><b>Top 5</b><span>Everyone ranked by total score, the top 5 in gold, and the place to give $TMF in the donation window.</span></div>
    <div><b>Alarm</b><span>The campaign countdowns and schedule in Los Angeles time. It rings when gaming stops.</span></div>
    <div><b>Messages</b><span>Texts from Hype (the team) and from any player who has signed in, plus your Mimugotchi.</span></div>
    <div><b>Mimu Mail</b><span>Your inbox for emails from the team.</span></div>
    <div><b>X and OpenSea</b><span>Phone-view pictures of the Mimu On Ape pages, each with a button that opens the real page.</span></div>
    <div><b>Final Recap</b><span>Greyed out until the campaign closes.</span></div>
    <div><b>Phone, Camera, Settings</b><span>A wrong-number dialer, a camera and gallery, and sound, clock and sign-out.</span></div>
  </div>`),
  card('c-blue', '💬', 'Messages', ul([
    '<b>Texts are plain text, up to 280 characters.</b> You can text any player who has signed in, and block or unblock anyone.',
    '<b>Hype</b> is the team account. Only the team can send as Hype.',
    '<b>Your Mimugotchi</b> texts you here when it falls asleep or finishes its hour.',
    '<b>Texts are stored on our servers,</b> can be read by the team and may be deleted. Keep it friendly: no harassment, threats, hate or spam.'])),
  card('c-cyan', '📬', 'Mimu Mail', ul([
    'Emails from the team (a subject, a message and sometimes a photo) arrive for every phone signed in with Glyph.',
    'You cannot reply, and players cannot send mail.',
    'An unread badge shows on the app until you open the mail.'])),
  card('c-silver', '⚙', 'Settings, Camera and Phone', ul([
    '<b>Settings:</b> sound, volume, the 12-hour Pacific clock, About, this guide, the Terms, Disconnect Glyph and Reset game progress (tap twice to confirm).',
    '<b>Camera:</b> take a photo and browse the gallery.',
    '<b>Phone:</b> dial any number and you will get the classic wrong-number message.'])),
  card('c-gold2', '🧭', 'Getting around', ul([
    'The top bar launches any app on the phone in one click.',
    'On the phone, the <em>back</em> bar at the bottom (or <kbd>Esc</kbd> outside Chair Run) takes you home.',
    'The red <b>How this site works</b> button, the Terms of Service and the links to Mimu On Ape and themutual.fun are in the top and bottom bars.']))
].join('');

const desk = [
  card('c-teal', '🐾', 'The Mimugotchi', ul([
    '<b>What it is:</b> the keychain pet on the blue post-its at the right of the desk. It starts off.',
    '<b>Press it</b> to switch it on for 60 minutes. It stays awake for 5 minutes, then falls asleep and waits for you to wake it.',
    '<b>Each wake-up</b> earns 5 season points (up to 12 wake-ups, 60 SP, per hour) and it texts you in Messages.',
    '<b>Badges:</b> switch it on, wake it, wake it within 30 seconds, finish a full hour (6 or more wake-ups) and a perfect hour (10 or more wake-ups, each within a minute).',
    '<b>Hover over it</b> to see how long until it sleeps and how long until the hour ends. It remembers across refreshes.'])),
  card('c-pink', '🖥', 'Secrets on the desk', `<div class="gd-grid">
    <div><b>The pen</b><span>Hover to wiggle it. Click it and it taps the phone while RGB lights glow under the desk.</span></div>
    <div><b>The Easy button</b><span>Hover to make it wiggle. Press it and jump straight to the Leaderboards.</span></div>
    <div><b>The coffee</b><span>Touch the liquid and it ripples through the Mimu in the foam.</span></div>
    <div><b>The post-it</b><span>Click it and the whole site turns 8-bit. Click again to come back.</span></div>
    <div><b>The paper</b><span>Your daily to-do list. Yes, including the phone bill.</span></div>
    <div><b>The TMF Pass card</b><span>Click it to visit themutual.fun.</span></div>
  </div>`)
].join('');

const help = [
  card('c-red', '🛡', 'How scores are checked', ul([
    '<b>Your browser only sends the moves you made.</b> The server replays them with the same rules and works out the score itself, so a score cannot be made up.',
    '<b>Runs that look like a bot</b> (robotic timing, scripts, automated input) are held for review and do not count until they are cleared.',
    '<b>A held run</b> also holds back its $TMF. If you think it was a mistake, ask the team.',
    '<b>Leaderboard results may be reviewed and adjusted</b> to remove cheating or errors. Edited code, exploits and multiple identities can lead to removal.',
    '<b>If the game is updated,</b> the page reloads before a run starts so your run counts.'])),
  card('c-green', '🔐', 'Stay safe', ul([
    'Connecting only asks for a free signature. It sends no transaction and cannot move your assets.',
    'This game never asks for a seed phrase, a private key, a password or payment details. If anything asks for those, it is not us.',
    'Only connect on <b>mutualmimu.fun</b> and check the address bar before you sign.',
    '$TMF in this game is virtual. It has no cash value and is not the token.'])),
  card('c-yellow', '🛠', 'Troubleshooting and FAQ', qa([
    ['Chair Run or Mutual Mimu is greyed out', 'They open when the countdown ends (Sat Oct 10, 6:00 PM PT). Chair Run closes again when gaming stops (Tue Oct 13, 6:00 AM PT). Mutual Mimu also needs your Glyph connected.'],
    ['It says I am not allowed', 'You need a Mimu On Ape in the wallet. A wallet holding a TMF Pass or a Dengs cannot play.'],
    ['It says the game was updated', 'Reload the page. The game does this by itself before a run starts so your run is scored by the same rules.'],
    ['My run says not saved yet', 'Tap retry before you leave the end screen. If you leave first, that run is lost.'],
    ['My run vanished after my phone died', 'An interrupted run does not count. Your earlier finished runs are safe.'],
    ['My sign-in expired in the middle of a run', 'Sign-ins last 12 hours. Sign in fresh before a long run.'],
    ['The human check failed', 'Wait a few seconds and press Run again.'],
    ['Why is my $TMF lower than I expected?', 'A bell can take $TMF, a Second Wind costs $TMF, blocs cost $TMF, and gifts leave your total.'],
    ['Why are my ranks different on the two boards?', 'One counts run points and the other counts $TMF found. The Top 5 adds them.'],
    ['Why can I not give $TMF?', 'See "Why Give or Send is greyed out" in the Top 5 chapter.'],
    ['Where is the Recap?', 'It unlocks when the campaign closes, Wed Oct 14 at 6:00 AM PT.']])),
  card('c-silver', '📖', 'Glossary', qa([
    ['Benched', 'Out of lives. Your run ends.'], ['Chain', 'Your streak of coins and chair hops. It sets your multiplier.'], ['Multiplier', 'x1 to x5 from your chain, x10 with a Star.'],
    ['Stack', 'The $TMF you are carrying in a run (or staking in Mutual Mimu).'], ['Ballot Gate', 'The purple gate where you pick a lane and invest.'], ['Closing Bell', 'The result 110 m after a gate, or the round bell in Mutual Mimu.'],
    ['Dividend and drawdown', 'A gain or a loss at a bell.'], ['Wipe-out', 'A bell that takes your whole stack.'], ['Weight', 'Your say in a Mutual Mimu vote.'], ['Bloc', 'A group in Mutual Mimu you can pay to follow your pick.'],
    ['Leverage', 'A 1x, 2x or 3x multiplier on a Mutual Mimu result.'], ['SP', 'Season points.'], ['Calm', 'The red orb effect: slower for 60 seconds.']])),
  card('c-gold2', '🧾', 'Rewards, honestly', `<p>Season badges and achievements are in-game cosmetics. Playing may, by chance and at the discretion of the Mimu On Ape team, lead to a TMF Pass in the giveaway, or it may not, and it probably will not. Nothing is guaranteed and no real money or assets are involved. Keep climbing, keep beating your best. Full details are in the Terms of Service.</p>`)
].join('');

/* ---- Mutual Mimu intro (the forecast stays in the app, so it is mentioned here) ---- */
const mmIntro = card('c-violet', '🏛', 'What Mutual Mimu is, in one minute', `<p>Mutual Mimu is a round-based boardroom on your phone. It unlocks once you connect your Glyph.</p>` + steps([
  'A <b>closing bell</b> rings every 4 hours 20 minutes and settles a round.',
  'Read the <b>weather forecast</b> card at the top: a guess at the market mood, with a "% sure" tag. It is a hint, not a promise.',
  '<b>Vote</b> on one of four proposals, <b>stake</b> some of your wallet’s $TMF (up to 3x leverage), and optionally <b>court a voting bloc</b>.',
  'At the bell the proposal with the most weight wins, and <b>your stake rides that result</b>. You can never lose more than your stake.',
  'Every bell pays season points. Your Mutual Mimu wallet lives on your own phone and is separate from the leaderboard totals.']));

/* ================= assemble ================= */
const jump = [
  ['g-start', '🎬', 'Start here'], ['g-win', '🏆', 'How to win'], ['g-chair', '🏃', 'Chair Run'], ['g-mm', '🏛', 'Mutual Mimu'],
  ['g-top5', '🥇', 'Top 5 and giving'], ['g-boards', '📊', 'Leaderboards'], ['g-badges', '🏅', 'Badges and levels'], ['g-apps', '📱', 'The apps'],
  ['g-desk', '🐾', 'Desk and Mimugotchi'], ['g-help', '🛡', 'Fair play and help']];
const body = `
      <div id="g-top"></div>
      <div class="gintro"><b>The main info page.</b> Everything about the game, the rules, the numbers and the apps, in one place. Tap a chapter to jump to it.</div>
      <div class="gjump">${jump.map(([id, ic, n], i) => `<button class="gjb c-${['red', 'gold', 'blue', 'violet', 'gold2', 'orange', 'green', 'cyan', 'teal', 'red'][i]}" type="button" data-gj="${id}"><i>${ic}</i>${n}</button>`).join('')}</div>
      ${chapter('g-start', 'c-red', '🎬', 'Start here', 'what this is, what you need, the schedule', start)}
      ${chapter('g-win', 'c-gold', '🏆', 'How to win', 'what decides the standings', win)}
      ${chapter('g-chair', 'c-blue', '🏃', 'Chair Run', 'every rule, table and tip (the same cards as the ? in the game)', reuseAll(CR))}
      ${chapter('g-mm', 'c-violet', '🏛', 'Mutual Mimu', 'every rule, table and tip (the same cards as the ? in the app)', mmIntro + reuseAll(MM))}
      ${chapter('g-top5', 'c-gold2', '🥇', 'Top 5 and giving $TMF', 'who is in, who can give, and what a gift does', top5)}
      ${chapter('g-boards', 'c-orange', '📊', 'Leaderboards', 'the two weekly boards and when they reset', boards)}
      ${chapter('g-badges', 'c-green', '🏅', 'Badges, levels and the Recap', 'season badges, 184 achievements, the share card', badges)}
      ${chapter('g-apps', 'c-cyan', '📱', 'The apps and getting around', 'every app on the phone', apps)}
      ${chapter('g-desk', 'c-teal', '🐾', 'Desk and Mimugotchi', 'the props and the keychain pet', desk)}
      ${chapter('g-help', 'c-red', '🛡', 'Fair play, safety and help', 'how scores are checked, FAQ, glossary', help)}
    `;

const a = t.indexOf('id="guide"');
const bs = t.indexOf('<div class="tos-body">', a);
const be = t.indexOf('    </div>\n    <div class="tos-foot"><span>© 2026 MIMU ON APE</span><button class="btn gold" data-guide-close>', bs);
if (a < 0 || bs < 0 || be < 0) throw new Error('guide bounds');
t = t.slice(0, bs) + '<div class="tos-body">' + body + t.slice(be);

/* ---- CSS ---- */
rep(`.gd-red{color:#ff6b61!important}`, `.gd-red{color:#ff6b61!important}
.guide-modal .gintro{margin:14px 0 4px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,rgba(255,107,97,.18),rgba(240,198,74,.10));border:1px solid rgba(255,107,97,.4);font:400 13.5px/1.55 var(--sans);color:var(--cream)}
.guide-modal .gintro b{color:#fff}
.guide-modal .gjump{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0 6px}
.guide-modal .gjb{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:14px;text-align:left;cursor:pointer;color:var(--cream);font:600 13px var(--sans);background:linear-gradient(135deg,color-mix(in srgb,var(--cc,#e9c24f) 26%,#1a0f12),#1a0f12 82%);border:1px solid color-mix(in srgb,var(--cc,#e9c24f) 60%,transparent);transition:transform .15s,border-color .15s}
.guide-modal .gjb:hover{transform:translateY(-1px);border-color:var(--cc,#e9c24f)}
.guide-modal .gjb i{font-style:normal;font-size:18px}
.guide-modal .gdc{margin-top:30px;scroll-margin-top:8px}
.guide-modal .gdch{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:18px;margin-bottom:16px;background:linear-gradient(90deg,color-mix(in srgb,var(--cc,#e9c24f) 42%,#1a0f12),#1a0f12 85%);border:1px solid var(--cc,#e9c24f);position:sticky;top:0;z-index:3;backdrop-filter:blur(6px)}
.guide-modal .gdci{flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:21px;background:var(--cc,#e9c24f);color:#1a0f12}
.guide-modal .gdch b{display:block;font:800 17px var(--sans);letter-spacing:.06em;text-transform:uppercase;color:#fff}
.guide-modal .gdch small{display:block;font:500 10.5px var(--mono);letter-spacing:.08em;color:var(--cc,#e9c24f);text-transform:uppercase;margin-top:1px}
.guide-modal .gtopb{margin-left:auto;flex:none;padding:7px 11px;border-radius:999px;border:1px solid color-mix(in srgb,var(--cc,#e9c24f) 60%,transparent);background:rgba(0,0,0,.25);color:var(--cream);font:600 10.5px var(--mono);letter-spacing:.06em;cursor:pointer}
.guide-modal .mmc p{font-size:14px;line-height:1.55}
.guide-modal .mmc li{font-size:13.5px;line-height:1.55}
.guide-modal .ttab .ttr{font-size:11.5px}.guide-modal .ttab .ttr b{font-size:11.5px}.guide-modal .ttab .tth{font-size:9.5px}
.guide-modal .gtab .gtr{grid-template-columns:70px 56px 1fr 52px;font-size:11px}.guide-modal .gtab .gtr b,.guide-modal .gtab .gtr em{font-size:11.5px}.guide-modal .gtab .gth{font-size:9.5px}.guide-modal .gtab .gtc{font-size:11px}
.guide-modal details.gdet{margin-top:8px}
.guide-modal .gdet>summary{cursor:pointer;list-style:none;font:600 10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--cc,#e9c24f);padding:4px 0}
.guide-modal .gdet>summary::-webkit-details-marker{display:none}
.guide-modal .gdet>summary::before{content:"▾ "}.guide-modal .gdet:not([open])>summary::before{content:"▸ "}
.guide-modal .gdet>.ttab,.guide-modal .gdet>.gtab{margin-top:4px}
.guide-modal .gstep{display:grid;gap:7px;margin-top:8px}
.guide-modal .gstep>div{display:flex;gap:11px;align-items:flex-start;padding:9px 11px;border-radius:13px;background:rgba(255,255,255,.05);border:1px solid var(--line)}
.guide-modal .gstep b{flex:none;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:var(--cc,#e9c24f);color:#1a0f12;font:800 12.5px var(--sans)}
.guide-modal .gstep span{font:400 13.5px/1.5 var(--sans);color:var(--cream)}
.guide-modal .gqa{display:grid;gap:7px;margin-top:8px}
.guide-modal .gqa>div{padding:9px 12px;border-radius:13px;background:rgba(255,255,255,.05);border:1px solid var(--line)}
.guide-modal .gqa b{display:block;font:700 13px var(--sans);color:#fff;margin-bottom:2px}
.guide-modal .gqa span{font:400 13px/1.5 var(--sans);color:var(--cream);opacity:.92}
@media(max-width:620px){.guide-modal .gjump{grid-template-columns:1fr}.guide-modal .gtopb{display:none}.guide-modal .gtab .gtr{grid-template-columns:48px 40px 1fr 30px}}`);

/* ---- jump buttons ---- */
rep(`addEventListener('keydown',e=>{if(e.key==='Escape'&&guideEl.classList.contains('on')){guideClose();e.stopPropagation()}},true);`,
`addEventListener('keydown',e=>{if(e.key==='Escape'&&guideEl.classList.contains('on')){guideClose();e.stopPropagation()}},true);
guideEl.addEventListener('click',e=>{const j=e.target.closest('[data-gj]');if(!j)return;const el=document.getElementById(j.dataset.gj);if(el){try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(x){el.scrollIntoView()}sfx.tap()}});`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('guide rebuilt: chapters', jump.length, ' Chair Run cards', CR.length, ' Mutual Mimu cards', MM.length);
