$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\admin.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

Swap '  <section class="sec"><h2>Players <small id="ucount">' '  <section class="sec"><h2>Player texts <small>Messages app &middot; latest 100</small></h2><div class="scroll" id="msgs" style="max-height:340px"></div></section>

  <section class="sec"><h2>Players <small id="ucount">'
Swap "  // players
  `$('#ucount')" @'
  // player texts
  $('#msgs').innerHTML=(d.messages||[]).length?'<table><thead><tr><th>When</th><th>From</th><th>To</th><th>Text</th><th></th></tr></thead><tbody>'+d.messages.map(m=>`<tr><td>${ago(m.ts)}</td><td>${esc(m.sn||short(m.sa))}</td><td>${esc(m.rn||short(m.ra))}</td><td style="max-width:260px">${esc(m.body)}</td><td><button class="btn no" data-dm="${m.id}">Delete</button></td></tr>`).join('')+'</tbody></table>':'<div class="empty">No texts yet.</div>';
  // players
  $('#ucount')
'@
Swap '    if(t.dataset.ub){' "    if(t.dataset.dm){await call('delmsg',{method:'POST',body:JSON.stringify({id:+t.dataset.dm})});toast('Text deleted');return refresh()}
    if(t.dataset.ub){"
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched admin'
