$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# every date shown on the site is Los Angeles time (the moments themselves are unchanged)
Swap "9 PM EST'" "6 PM PST'"
Swap "9 AM EST'" "6 AM PST'"
Swap "when:'Sat Oct 10 &middot; 9:00 PM EST',alt:'6:00 PM PST'" "when:'Sat Oct 10 &middot; 6:00 PM PST',alt:''"
Swap "when:'Tue Oct 13 &middot; 6:00 AM PST',alt:'9:00 AM EST'" "when:'Tue Oct 13 &middot; 6:00 AM PST',alt:''"
Swap "when:'Tue 6:00 AM PST to Wed 9:00 AM EST',alt:'24 hours'" "when:'Tue 6:00 AM to Wed 6:00 AM PST',alt:'24 hours'"
Swap "when:'Wed Oct 14 &middot; 9:00 AM EST',alt:'6:00 AM PST'" "when:'Wed Oct 14 &middot; 6:00 AM PST',alt:''"
Swap '${s.when} <span style="color:var(--muted)">&middot; ${s.alt}</span>' '${s.when}${s.alt?` <span style="color:var(--muted)">&middot; ${s.alt}</span>`:''''}'
Swap 'Date (Pacific)' 'Date (PST)'
$t = [regex]::Replace($t, '(12-hour.{1,4})Pacific', '${1}PST')
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched'
