$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# first-visit screen: no name field at all (the username is asked after Glyph connects)
Swap 'if(XL.req&&!XL.on)return typedName();' 'return `<div class="sub2" style="margin-top:14px">Connect your Glyph in Chair Run to pick your username.</div>`;'

# username popup after the wallet checks
Swap '<h2>Add your <em>X</em> handle</h2>' '<h2>Enter your <em>username</em></h2>'
Swap '<p>Your X <b>@handle</b> becomes your name on every leaderboard.</p>' '<p>Your username <b>must be your X handle</b>. Just type it below and press OK. It becomes your name on every leaderboard.</p>'
Swap 'id="xs" style="padding:16px">Continue</button>' 'id="xs" style="padding:16px">OK</button>'
Swap '<div style="margin-top:8px;text-align:center"><a href="https://x.com/home" target="_blank" rel="noopener noreferrer" style="color:#9ad1ff;font:500 12px var(--sans)">Open X to find your handle &#8599;</a></div>' ''
Swap "err.textContent='Type your X handle (letters, numbers and _ only, up to 15).'" "err.textContent='Type your X handle (letters, numbers and _ only, up to 15).'"

# wording on the Glyph intro
Swap 'and ask for your <b>X username</b>.' 'and ask for a <b>username</b> (your X handle).'
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
