// Rewrites the "How this site works" guide and the Terms of Service so they match what the site actually does today.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const cut = (startMarker, endMarker, html) => {
  const a = t.indexOf(startMarker); const b0 = t.indexOf(endMarker, a);
  if (a < 0 || b0 < 0) throw new Error('markers: ' + startMarker.slice(0, 40));
  t = t.slice(0, a) + html + t.slice(b0 + endMarker.length);
};

/* ---------------- How this site works ---------------- */
cut('      <p style="margin-top:14px">This is <b>Chair Run × Mutual Mimu</b>', 'Full details are in the Terms of Service.</p>', `      <p style="margin-top:14px">This is <b>Chair Run × Mutual Mimu</b>, a game by <b>MIMU ON APE</b> built for the <b>TMF Pass Mimu giveaway</b>. It is independent and is not affiliated with THE MUTUAL FUN project. The whole site is a desk. The <b>phone in the middle is the game</b>: everything you play lives on that screen. The props around it are part of the fun too.</p>

      <h3>Get playing in 30 seconds</h3>
      <div class="gd-steps">
        <div><b>1</b><span>Swipe up or tap the phone's lock screen (or press <em>Play now</em> in the top bar).</span></div>
        <div><b>2</b><span>First time only: meet your Mimu and enter the building.</span></div>
        <div><b>3</b><span>Tap <em>Chair Run</em> and connect your <em>Glyph</em> (you need a Mimu On Ape to run). Then type your username, which must be your X handle, and add a profile picture if you like.</span></div>
        <div><b>4</b><span>Press <em>Run</em>. Run, hop, grab $TMF, repeat. The closing bell rings every 4 hours 20 minutes, and the <em>Alarm</em> app shows the campaign schedule.</span></div>
      </div>

      <h3>Chair Run: how to play</h3>
      <p>Your Mimu sprints down a grand hall. Dodge, hop and slide to keep your three lives.</p>
      <div class="gd-keys">
        <div><kbd>← →</kbd> or <kbd>A D</kbd><span>change lane (swipe left or right on a phone)</span></div>
        <div><kbd>↑</kbd> <kbd>W</kbd> <kbd>Space</kbd><span>jump a chair (swipe up or tap)</span></div>
        <div><kbd>↓</kbd> or <kbd>S</kbd><span>slide under banners (swipe down)</span></div>
        <div><kbd>Esc</kbd> or <kbd>P</kbd><span>pause. Resuming gives you a 3-2-1.</span></div>
      </div>
      <p><b>Connecting:</b> Chair Run is where you connect your Glyph. After you connect and pass the wallet checks, <em>Mutual Mimu</em> and texting other players unlock. Your username (your X handle) and picture show up on the Leaderboards, the Top 5 app and your texts. You need a Mimu On Ape to play, and wallets that already hold a TMF Pass or a Dengs can&rsquo;t play.</p>
      <p><b>$TMF coins</b> are your score fuel. Every coin and clean chair hop builds a <b>chain</b> that multiplies your score up to x5, but four seconds without a gain breaks it. <b>Power-ups</b> show up on the floor: a coin magnet, a briefcase shield and a gilded x2. Hit a milestone every 250m for a bonus. Lose your last life and you can pay 30 $TMF for a one-time <b>Second Wind</b>.</p>
      <p><b>Ballot Gates</b> appear down the hall. Pick a lane to vote on an asset. About 110m later the closing bell pays a dividend or takes a drawdown from your run's $TMF. Risky picks swing harder.</p>
      <p><b>Daily quests</b> (three a day) and a daily streak give you bonus season points. Each run also earns season points toward your Badges meter.</p>

      <h3>Campaign schedule (Los Angeles time, PST)</h3>
      <div class="gd-steps">
        <div><b>1</b><span><b>Campaign opens</b>: Sat Oct 10, 6:00 PM. Start gaming.</span></div>
        <div><b>2</b><span><b>Gaming stops</b>: Tue Oct 13, 6:00 AM. No more Chair Runs and no more acquiring points.</span></div>
        <div><b>3</b><span><b>24-hour donation window</b>: Tue 6:00 AM to Wed 6:00 AM. Players can donate their $TMF to the top 5 in the Top 5 app.</span></div>
        <div><b>4</b><span><b>Campaign closes</b>: Wed Oct 14, 6:00 AM. The end.</span></div>
      </div>
      <p style="font-size:12.5px;color:var(--dim)">The schedule can change. The countdown on the phone&rsquo;s home screen and in the Alarm app is live.</p>

      <h3>Every app on the phone</h3>
      <div class="gd-grid">
        <div><b>Chair Run</b><span>The runner. Beat your best score every day. This is where you connect your Glyph.</span></div>
        <div><b>Mutual Mimu</b><span>The boardroom: stake $TMF, vote and join the lobby. A closing bell rings every 4h 20m and settles the round. It stays greyed out until you connect your Glyph in Chair Run.</span></div>
        <div><b>Leaderboards</b><span>Weekly boards for the best run and for $TMF found. Every score is checked by the server, which replays your run, so everyone is ranked fairly. Boards reset weekly.</span></div>
        <div><b>Badges</b><span>Your season meter, badges, chair gallery (jump 25 of each to unlock), patron status and career stats.</span></div>
        <div><b>Top 5</b><span>Every player ranked by total score (Chair Run points + $TMF found), with the top 5 in gold frames. The top 5 cannot send $TMF. Anyone outside the top 5 can give all their $TMF to one top 5 player to help them (+2 points for every $TMF), or send $TMF to any player who has registered at least 1 $TMF point. Ranks change live, so whether you can give changes with them.</span></div>
        <div><b>Alarm</b><span>The campaign countdown and schedule, in Los Angeles time. The icon lights up and wiggles when gaming stops.</span></div>
        <div><b>Messages</b><span>A few welcome texts, plus (after you connect your Glyph) texting with other players on the leaderboard. You can block anyone.</span></div>
        <div><b>Phone, Camera, Settings</b><span>Dial a number (you will get the classic wrong-number message), snap a photo and browse the gallery, or flip sound on and off and disconnect Glyph. Mimu Mail is locked and comes later.</span></div>
      </div>

      <h3>Getting around</h3>
      <p>The top bar launches any app on the phone in one click. On the phone, the <em>back</em> button at the bottom (or <kbd>Esc</kbd>) takes you home. On a real phone the game fills your whole screen. Your progress saves in your browser automatically.</p>

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
      <p>Season badges are in-game cosmetics. Playing may, by chance and at the discretion of the Mimu On Ape team, lead to a TMF Pass in the giveaway, or it may not, and it probably will not. Nothing is guaranteed and no real money or assets are involved. Keep climbing, keep beating your best. Full details are in the Terms of Service.</p>`);

/* ---------------- Terms of Service ---------------- */
cut('      <p style="color:var(--dim);font-size:12.5px;margin-top:14px">Last updated', 'community channels.</p>', `      <p style="color:var(--dim);font-size:12.5px;margin-top:14px">Last updated: October 2026</p>
      <h3>1 · Acceptance</h3><p>By opening or playing Chair Run × Mutual Mimu (the “Game”) you agree to these Terms. If you do not agree, please do not use the Game.</p>
      <h3>2 · Who we are</h3><p>The Game is published by MIMU ON APE and built by Bert Baccaratt (together, “we”, “us”). It is an entertainment product and a community campaign. The Game is independent: it is not affiliated with, endorsed by or sponsored by THE MUTUAL FUN project, and it exists for the TMF Pass Mimu giveaway.</p>
      <h3>3 · Eligibility</h3><p>You must be old enough to enter a binding agreement where you live, and at least 18 to be considered for any reward. Where the law restricts promotions or digital-asset rewards in your region, you may not be eligible.</p>
      <h3>4 · Campaign schedule</h3><p>The campaign is scheduled to open on Saturday, October 10, 2026 at 6:00 PM, gaming stops on Tuesday, October 13 at 6:00 AM (no more Chair Runs and no more acquiring points), a 24-hour window follows in which players can donate $TMF to the top 5, and the campaign closes on Wednesday, October 14 at 6:00 AM. All times are Los Angeles time (PST). We may change, pause, extend or end the schedule at any time.</p>
      <h3>5 · The giveaway, leaderboards and recognition</h3><p>The Game exists for the TMF Pass Mimu giveaway. Playing may, subject to chance and our discretion, lead to a TMF Pass, or it may not, and it probably will not. The Game has leaderboards that reset each week, and you are welcome to keep playing to beat your own best score. Top players may be considered for recognition, which could include a TMF Pass or another item, but nothing is promised. No TMF Passes have been allocated to the Game at this time. Whether any recognition is given, who is considered, how many items exist and when are decided solely by MIMU ON APE, and may change or end at any time. Leaderboard results may be reviewed and adjusted to remove cheating or errors. A score, rank or badge does not entitle anyone to a reward.</p>
      <h3>6 · In-game currency, points and giving</h3><p>“$TMF” coins and “Season Points” shown inside the Game are virtual items for gameplay only. They have no cash value, cannot be sold or redeemed, and are not the $TMF token or any other digital asset. Your total score is your Chair Run points plus your $TMF found, and the Top 5 app ranks every player by it. The top 5 players of the week cannot give $TMF to anyone. Anyone outside the top 5 can give all their $TMF to one top 5 player, which also adds 2 points to that player&rsquo;s score for every $TMF, or send $TMF to any player who has registered at least 1 $TMF point. Ranks change as players play and give, so whether you can give can change at any time. Gifts are virtual and final, and the Top 5 app is the only way to give coins away.</p>
      <h3>7 · Fair play</h3><p>Every leaderboard score is checked by our server, which replays your run from the moves you made. Runs that can&rsquo;t be verified, or that come from bots, scripts, automated input, edited code or exploits, don&rsquo;t count and may be removed along with the account&rsquo;s results. Do not use multiple identities to gain an advantage, and do not interfere with the Game or other players. Chair Run runs on your device, so keep your connection open until the &ldquo;run complete&rdquo; screen finishes ranking you. Some runs are held for review before they count. We may remove scores, texts, pictures or players, or restrict access, where we reasonably suspect misuse.</p>
      <h3>8 · Glyph, usernames and pictures</h3><p>Chair Run asks you to connect a Glyph wallet. We read your Glyph name, profile picture and wallet address, and we check which NFTs that wallet holds: you need a Mimu On Ape to play, and wallets holding a TMF Pass or a Dengs can&rsquo;t play. You then choose a username, which must be your X handle. You type it yourself and we do not verify it, only one wallet can use a given username, and we may change or remove usernames that impersonate someone else. Your username is shown publicly as your name on the leaderboards, in the Top 5 app and in texts, together with your scores and your profile picture. You may upload a profile picture, which is shown publicly too; do not upload anything unlawful, offensive or that is not yours, and we may remove it. Connecting only asks for a signature that proves you own the wallet. It costs nothing, sends no transaction and can&rsquo;t move your assets. Disconnect any time in Settings.</p>
      <h3>9 · Texts and conduct</h3><p>After you connect your Glyph you can text other players on the leaderboard. Texts are stored on our servers, can be read by the team, and may be deleted. Keep it friendly: no harassment, threats, hate or spam. You can block any player, and we may remove players who harass others.</p>
      <h3>10 · Your data and third-party services</h3><p>On our servers we store your wallet address, Glyph name, username, profile picture, scores, $TMF gifts and texts, plus an anonymous browser ID and the time of your visits so we can count visitors. Our servers do not store your IP address or your location. Your handle, chosen Mimu, settings and progress also save in your own browser. We do not collect wallet keys, seed phrases or payment details through the Game and will never ask for them. The site is hosted on GitHub Pages and the leaderboard service runs on Cloudflare, which also provides the human check used before a run starts. Fonts load from Google Fonts, wallet connection uses Glyph, and if you dial a wrong number in the phone app a short recording plays through YouTube&rsquo;s embedded player. Each of these providers has its own privacy policy and may process your IP address to deliver its service.</p>
      <h3>11 · Not financial advice</h3><p>Mutual Mimu is a simulation. It does not involve real money, real investments or real markets, and nothing in it is investment, legal or tax advice. Past in-game results say nothing about real-world performance.</p>
      <h3>12 · Intellectual property</h3><p>The MIMU ON APE name, characters and artwork belong to MIMU ON APE and its respective creators and rights holders. THEMUTUAL.FUN names, marks and chair artwork belong to their respective owners. The Game’s design and code belong to their authors. You may play the Game for personal, non-commercial use but may not copy or redistribute it without permission.</p>
      <h3>13 · Third-party links</h3><p>The Game links to third-party sites, including OpenSea, themutual.fun and X. We do not control them and are not responsible for their content or practices.</p>
      <h3>14 · Disclaimers and liability</h3><p>The Game is provided “as is” and “as available”, without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect or consequential loss, or for loss of data, scores, texts or rewards, arising from your use of the Game.</p>
      <h3>15 · Changes and contact</h3><p>We may update these Terms from time to time; continued play after an update means you accept it. Questions can be raised through the official MIMU ON APE community channels.</p>`);
fs.writeFileSync(p, t);
console.log('ok');
