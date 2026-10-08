$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---- Top 9: sending to a top-9 runner boosts them ----
Swap '<li>The $TMF you send comes out of your &ldquo;$TMF found&rdquo; total and goes into theirs.</li>' '<li>The $TMF you send comes out of your &ldquo;$TMF found&rdquo; total and goes into theirs.</li>
       <li><b style="color:var(--cream)">Sending to a top 9 runner boosts them:</b> every $TMF adds +2 points to their score.</li>'
Swap 'const can=!!(st&&st.canSend);' 'const can=!!(st&&st.canSend),topIds=new Set((LIVE.run&&LIVE.run.rows?LIVE.run.rows:[]).slice(0,9).map(x=>x.id));'
Swap '<div class="sm">${fmt(r.v)} $TMF registered</div>' '<div class="sm">${fmt(r.v)} $TMF registered${topIds.has(r.id)?''<br><span style="color:var(--gold2)">top 9 &middot; your $TMF boosts their score</span>'':''''}</div>'
Swap 'const max=st.balance;' 'const max=st.balance,isTop=(LIVE.run&&LIVE.run.rows?LIVE.run.rows:[]).slice(0,9).some(x=>x.id===r.id);'
Swap 'You can send up to <b style="color:var(--cream)">${fmt(max)}</b>. This is final.</div>' 'You can send up to <b style="color:var(--cream)">${fmt(max)}</b>. This is final.</div>${isTop?''<div class="sub2" style="font-size:12.5px;margin:-4px 0 12px;color:var(--gold2)">This runner is in the top 9, so every $TMF you send adds +2 points to their score.</div>'':''''}'
Swap 'toast(`&hearts; <span>You sent <b>${fmt(amt)} $TMF</b> to <b>${escH(r.name)}</b>.</span>`,3600);' 'toast(`&hearts; <span>You sent <b>${fmt(amt)} $TMF</b> to <b>${escH(r.name)}</b>.${res&&res.boosted?` Their score is up <b>+${fmt(res.boosted)}</b>.`:''''}</span>`,3800);'
Swap 'any player who has registered at least 1 $TMF point.</span></div>' 'any player who has registered at least 1 $TMF point. $TMF sent to a top 9 runner also boosts their score (+2 points for every $TMF).</span></div>'
Swap 'registered at least 1 $TMF point. Those gifts are virtual and final.' 'registered at least 1 $TMF point, and $TMF sent to a top 9 runner also adds points to their score. Those gifts are virtual and final.'

# ---- Alarm icon: bright red and wiggling from Tuesday 6 AM Pacific until the campaign closes ----
Swap '<button class="app-i" type="button"><div class="ic" style="background:linear-gradient(135deg,#ff8a4c,#d4362f)">${IC.alarm}</div>Alarm</button>' '<button class="app-i alarm" type="button"><div class="ic" style="background:linear-gradient(135deg,#ff8a4c,#d4362f)">${IC.alarm}</div>Alarm</button>'
Swap '.app-i[disabled]{opacity:.42;' '@keyframes alwig{0%,100%{transform:rotate(0)}15%{transform:rotate(-14deg)}30%{transform:rotate(12deg)}45%{transform:rotate(-10deg)}60%{transform:rotate(8deg)}75%{transform:rotate(-4deg)}}
@keyframes alglow{0%,100%{box-shadow:0 0 10px 2px rgba(255,30,30,.7)}50%{box-shadow:0 0 26px 9px rgba(255,30,30,.95)}}
.app-i.alarm.ring .ic{background:linear-gradient(135deg,#ff4d3d,#e00000)!important;animation:alwig .9s ease-in-out infinite,alglow 1.1s ease-in-out infinite;transform-origin:50% 12%}
@media(prefers-reduced-motion:reduce){.app-i.alarm.ring .ic{animation:alglow 1.6s ease-in-out infinite}}
.app-i[disabled]{opacity:.42;'
Swap 'let _cdTimer=null;' @'
const ALARM_AT=Date.UTC(2026,9,13,13,0,0);   /* Tue Oct 13 2026, 6:00 AM Pacific (PDT) */
function syncAlarm(){const n=Date.now(),on=n>=ALARM_AT&&n<CAMPAIGN.close;document.querySelectorAll('.app-i.alarm').forEach(b=>b.classList.toggle('ring',on))}
setInterval(syncAlarm,5000);
let _cdTimer=null;
'@
Swap 'function startCampaignClock(){' 'function startCampaignClock(){syncAlarm();'
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
