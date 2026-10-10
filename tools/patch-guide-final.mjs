// Final pass: the "How this site works" guide, the Terms and the CSP match the finished game.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 90)); t = t.replace(a, () => b); };

const GUIDE = `<div class="tos-body">
      <p style="margin-top:14px">This is <b>Chair Run × Mutual Mimu</b>, a game by <b>MIMU ON APE</b> built for the <b>TMF Pass Mimu giveaway</b>. It is independent and is not affiliated with THE MUTUAL FUN project. The whole site is a desk. The <b>phone in the middle is the game</b>: everything you play lives on that screen, and the props around it are part of the fun too. This page explains every part of it.</p>

      <h3>Get playing in 30 seconds</h3>
      <div class="gd-steps">
        <div><b>1</b><span>Sign the NDA once (you will only see it the first time on this browser), then swipe up or tap the phone&rsquo;s lock screen, or press <em>Play now</em> in the top bar.</span></div>
        <div><b>2</b><span>First time only: meet your Mimu and enter the building.</span></div>
        <div><b>3</b><span>Tap <em>Chair Run</em> and connect your <em>Glyph</em> (you need a Mimu On Ape to run). Then type your username, which must be your X handle, and add a profile picture if you like.</span></div>
        <div><b>4</b><span>Press <em>Run</em>. Run, hop, grab $TMF, repeat. Tap the <b>?</b> in the top corner of Chair Run any time before a run for every rule.</span></div>
      </div>

      <h3>What you need, and staying signed in</h3>
      <p>You need a <b>Mimu On Ape</b> in the wallet you connect. Wallets that already hold a <b>TMF Pass</b> or a <b>Dengs</b> can&rsquo;t play. Connecting only asks for a free signature that proves you own the wallet. It sends no transaction and can&rsquo;t move anything. Once you are in, you stay signed in on this browser for up to <b>12 hours</b>, even if you refresh. After that, or if you press <em>Disconnect Glyph</em> in Settings, you sign in again. Your username (your X handle) and picture appear on the leaderboards, in the Top 5 app and in your texts.</p>

      <h3>Campaign schedule (Los Angeles time, PST)</h3>
      <div class="gd-steps">
        <div><b>1</b><span><b>Campaign opens</b>: Sat Oct 10, 6:00 PM. The countdown on the phone&rsquo;s home screen hits zero and <b>Chair Run opens by itself</b>. Before that it stays greyed out and can&rsquo;t be tapped, while the other apps are already open.</span></div>
        <div><b>2</b><span><b>Gaming stops</b>: Tue Oct 13, 6:00 AM. Chair Run closes again by itself and no new runs can start. A run you already have going can finish and count.</span></div>
        <div><b>3</b><span><b>24-hour donation window</b>: Tue 6:00 AM to Wed 6:00 AM. This is the only time $TMF can be given to other players, in the Top 5 app. Giving is locked at all other times.</span></div>
        <div><b>4</b><span><b>Campaign closes</b>: Wed Oct 14, 6:00 AM. The end.</span></div>
      </div>
      <p style="font-size:12.5px;color:var(--dim)">The schedule can change. The countdown on the home screen and the Alarm app are live and always show the real times.</p>

      <h3>Chair Run: how to play</h3>
      <p>Your Mimu sprints down a grand hall. Dodge, hop and slide to keep your three lives. A run lasts until you are benched, and there is <b>no pause button</b>.</p>
      <div class="gd-keys">
        <div><kbd>← →</kbd> or <kbd>A D</kbd><span>change lane (swipe left or right on a phone)</span></div>
        <div><kbd>↑</kbd> <kbd>W</kbd> <kbd>Space</kbd><span>jump a chair (swipe up or tap)</span></div>
        <div><kbd>↓</kbd> or <kbd>S</kbd><span>slide under banners (swipe down). In mid air it drops you fast.</span></div>
      </div>
      <ul class="gd-list">
        <li><b>Lives:</b> you have 3 hearts. A chair hurts unless you jump high enough, a banner hurts unless you slide under it. A hit costs a life, slows you for about a second, gives 1.5 seconds of protection and breaks your chain.</li>
        <li><b>$TMF coins:</b> each coin is 10 points x your chain and adds to your $TMF. The $TMF you collect in a run lands in your wallet when the run ends and counts toward your leaderboard total.</li>
        <li><b>Chain and the x5 multiplier:</b> every coin adds 1 to your chain and every chair hop adds 3. Every 10 raises your multiplier by 1, up to <b>x5 at a chain of 40</b>. Four seconds without a gain, or a hit, breaks the chain. The multiplier applies to coins, hops, distance points and milestone bonuses.</li>
        <li><b>Score:</b> coins (10 points), chair hops (15 points), distance (points every second based on your speed) and a bonus every 250 m, all multiplied by your chain. Closing Bell results also move your score by 10 points per $TMF.</li>
        <li><b>Power-ups:</b> about 1 in 9 obstacle patterns carries one. The <b>Star</b> ✨ doubles your points and coins for 10 seconds (it stacks with the chain, up to x10). The <b>Briefcase</b> 💼 blocks your next hit. The <b>Bell</b> 🔔 is a coin magnet for 9 seconds.</li>
        <li><b>Second Wind:</b> lose your last life and you get 5 seconds to pay <b>30 $TMF to keep running</b>. You keep your score and chain. It works <b>one time per run</b>, and if your run coins are short your wallet tops it up.</li>
      </ul>

      <h3>Ballot Gates and the Closing Bell: investing during a run</h3>
      <p>A purple gate appears down the hall every 900 m, the first at 650 m. It has three lane panels, each with an asset symbol (like BILLS, GOLD, CHAIN or MEME) and five risk dots. <b>You vote by running through a panel</b>, so steer into your lane first. The sign above the gate shows the market mood (Risk-on, Risk-off or Choppy). Safe assets pay small and steady, hard assets lean against fear, growth assets swing more and degen assets can pay or cost a lot. About <b>110 m later the Closing Bell rings</b> and pays a dividend or takes a drawdown from the $TMF you are carrying: (20 + your $TMF) x the asset&rsquo;s return x 9. A bigger stack swings harder in both directions, and it can never take more than you hold. Coin lines in front of each lane let you collect before you commit.</p>

      <h3>How the game gets harder, and how it eases</h3>
      <ul class="gd-list">
        <li><b>Speed:</b> you start at 11 and gain 1 for every 230 m, up to 23 at about 2,760 m. After the first 3 minutes the top speed climbs again, <b>+0.5 every 3 minutes</b>, up to a ceiling of 30 at minute 42.</li>
        <li><b>Obstacles:</b> rolling chairs from 420 m, walls of 3 chairs from 525 m, double banners from 1,225 m, and taller chairs and tighter gaps up to 3,500 m, where the mix reaches its hardest.</li>
        <li><b>Red orb:</b> at <b>2.5M, 5M, 7.5M, 10M</b> and every 2.5 million after, a glowing red orb appears. Catch it and your top speed is 0.5 lower for 3 minutes, then it returns on its own. A red chip at the top counts it down.</li>
        <li><b>Surprises:</b> every 1 million points shows a message and a 10 second RGB disco party over the phone. Every 10 million the carpet changes color. Messages at the top explain every event, with a detail line under each.</li>
      </ul>

      <h3>Quests, season points and badges</h3>
      <p><b>Daily quests</b> (three a day) and a daily streak give bonus season points. Each run earns season points (your score divided by 5, plus 2 per $TMF, plus quests) that fill the meter in the <b>Badges</b> app toward your next Season Badge. The Badges app also holds <b>168 achievements</b> in 16 colored groups, a level, your stats, the chair gallery (jump 25 of each of the 8 chair types) and the long-run badges at 1M, 10M, 20M, 50M and 100M. They are just for fun and never change the leaderboard.</p>

      <h3>Leaderboards, the Top 5 and giving $TMF</h3>
      <ul class="gd-list">
        <li><b>Fair scores:</b> your browser only sends the moves you made. The server replays them with the same rules and works out the score itself, so scores can&rsquo;t be made up. Runs that look like a bot are held for review.</li>
        <li><b>Weekly boards:</b> they reset every Friday at 1:00 PM Pacific. A Chair Run board ranks your best single run and a $TMF board ranks what you found. This week runs until Fri Oct 16, after the campaign has closed.</li>
        <li><b>Top 5 app:</b> every player ranked by total score (best run + $TMF found), with the top 5 in gold frames. The top 5 can&rsquo;t give $TMF. Everyone else can give all their $TMF to one top 5 player (+2 points on their score for every $TMF), or send an amount to any player who has at least 1 $TMF. <b>Giving only works during the 24-hour donation window.</b> Ranks change live, so whether you can give changes with them. Gifts are final.</li>
      </ul>

      <h3>Mutual Mimu: the boardroom</h3>
      <p>Mutual Mimu is a round-based room that unlocks once you connect your Glyph. Every <b>4 hours 20 minutes</b> a closing bell rings and settles the round. Read the weather forecast, vote on one of four proposals, stake some of your wallet&rsquo;s $TMF (up to 3x leverage), and optionally court a voting bloc to follow you. The room&rsquo;s biggest total wins, and your stake rides the result. You can never lose more than your stake, and every bell gives season points. Tap the <b>?</b> in the app for every rule. Your Mutual Mimu wallet lives on your own phone and is separate from the leaderboard totals.</p>

      <h3>Every app on the phone</h3>
      <div class="gd-grid">
        <div><b>Chair Run</b><span>The runner. Open from the countdown until gaming stops. This is where you connect your Glyph.</span></div>
        <div><b>Mutual Mimu</b><span>The boardroom: stake $TMF, vote and join the lobby. It stays greyed out until you connect your Glyph.</span></div>
        <div><b>Leaderboards</b><span>Weekly boards for the best run and for $TMF found, checked by the server so everyone is ranked fairly.</span></div>
        <div><b>Badges</b><span>Your level, 168 achievements, stats, season meter, season badges, chair gallery and patron status.</span></div>
        <div><b>Top 5</b><span>Everyone ranked by total score, the top 5 in gold, and the place to give $TMF during the donation window.</span></div>
        <div><b>Alarm</b><span>The campaign countdowns and schedule in Los Angeles time. It rings when gaming stops.</span></div>
        <div><b>Messages</b><span>A few welcome texts, plus texting with any player who has signed in (280 characters). You can block anyone, and the Mimu On Ape team may text you too.</span></div>
        <div><b>Mimu Mail</b><span>Your inbox. Emails from the team (a subject, a message and sometimes a photo) arrive here for every phone signed in with Glyph. You can&rsquo;t reply.</span></div>
        <div><b>X and OpenSea</b><span>Phone-view pictures of the Mimu On Ape pages on X and on OpenSea, each with a button that opens the real page.</span></div>
        <div><b>Phone, Camera, Settings</b><span>Dial a number (you will get the classic wrong-number message), snap a photo and browse the gallery, or change sound and disconnect Glyph.</span></div>
      </div>

      <h3>Getting around</h3>
      <p>The top bar launches any app on the phone in one click. On the phone, the <em>back</em> button at the bottom (or <kbd>Esc</kbd> outside Chair Run) takes you home. Your handle, Mimu, achievements and progress save in your browser automatically, so clearing your browser data clears them.</p>

      <h3>Secrets on the desk</h3>
      <div class="gd-grid">
        <div><b>The pen</b><span>Hover to wiggle it. Click it and it taps the phone while RGB lights glow under the desk.</span></div>
        <div><b>The Easy button</b><span>Hover to make it wiggle. Press it and jump straight to the Leaderboards.</span></div>
        <div><b>The coffee</b><span>Touch the liquid and it ripples through the Mimu in the foam.</span></div>
        <div><b>The post-it</b><span>Click it and the whole site turns 8-bit. Click again to come back.</span></div>
        <div><b>The paper</b><span>Your daily to-do list. Yes, including the phone bill.</span></div>
        <div><b>The TMF Pass card</b><span>Click it to visit themutual.fun.</span></div>
      </div>

      <h3>Rewards, honestly</h3>
      <p>Season badges and achievements are in-game cosmetics. Playing may, by chance and at the discretion of the Mimu On Ape team, lead to a TMF Pass in the giveaway, or it may not, and it probably will not. Nothing is guaranteed and no real money or assets are involved. Keep climbing, keep beating your best. Full details are in the Terms of Service.</p>
    </div>
    <div class="tos-foot"><span>© 2026 MIMU ON APE</span><button class="btn gold" data-guide-close>`;

{
  const a = t.indexOf('<div class="tos-body">\n      <p style="margin-top:14px">This is <b>Chair Run');
  const endMarker = '    </div>\n    <div class="tos-foot"><span>© 2026 MIMU ON APE</span><button class="btn gold" data-guide-close>';
  const b = t.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error('guide anchors');
  t = t.slice(0, a) + GUIDE + t.slice(b + endMarker.length);
}
rep(`.gd-keys{display:grid;gap:6px;margin:8px 0 10px}`, `.gd-list{margin:8px 0 12px;padding-left:18px;display:grid;gap:7px}.gd-list li{font:400 13.5px/1.55 var(--sans);color:var(--cream)}.gd-list li b{color:#fff}
.gd-keys{display:grid;gap:6px;margin:8px 0 10px}`);

/* Terms */
rep(`gaming stops on Tuesday, October 13 at 6:00 AM (no more Chair Runs and no more acquiring points), a 24-hour window follows in which players can donate $TMF to the top 5, and the campaign closes on Wednesday, October 14 at 6:00 AM. All times are Los Angeles time (PST). We may change, pause, extend or end the schedule at any time.`,
    `gaming stops on Tuesday, October 13 at 6:00 AM (no new Chair Runs can start, and a run already in progress may finish and count), a 24-hour window follows in which players can donate $TMF to the top 5, and the campaign closes on Wednesday, October 14 at 6:00 AM. Chair Run opens automatically when the campaign countdown ends. All times are Los Angeles time (PST). We may change, pause, extend or end the schedule at any time.`);
rep(`Gifts are virtual and final, and the Top 5 app is the only way to give coins away.`, `Giving is only available during the 24-hour donation window described above. Gifts are virtual and final, and the Top 5 app is the only way to give coins away. Your Mutual Mimu wallet is kept on your own device and is separate from the totals on our servers.`);
rep(`Chair Run runs on your device, so keep your connection open until the &ldquo;run complete&rdquo; screen finishes ranking you.`, `Chair Run runs on your device and cannot be paused, so keep your connection open until the &ldquo;run complete&rdquo; screen finishes ranking you. If the game was updated, the page reloads before a run starts so that your run counts.`);
rep(`After you connect your Glyph you can text other players on the leaderboard. Texts are stored on our servers, can be read by the team, and may be deleted.`, `After you connect your Glyph you can text other players who have signed in, and the team may text you too. Texts are stored on our servers, can be read by the team, and may be deleted.`);
rep(`Your handle, chosen Mimu, settings and progress also save in your own browser.`, `Your handle, chosen Mimu, settings, achievements and progress also save in your own browser, together with a sign-in session that lasts up to 12 hours.`);

/* tighten the security policy: the X timeline widget is no longer used */
rep(` https://platform.twitter.com;`, `;`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
