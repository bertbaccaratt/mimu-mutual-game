$ErrorActionPreference = 'Stop'
$p = 'C:\Users\bertb\OneDrive\Desktop\tmfxmimu\index.html'
$t = [IO.File]::ReadAllText($p)
function Swap($a, $b) { if (-not $script:t.Contains($a)) { throw "missing: $($a.Substring(0, [Math]::Min(90, $a.Length)))" }; $script:t = $script:t.Replace($a, $b) }

# ---- CSS: profile circle with a + button ----
Swap '.t5.g9{border:2px solid #d9b25f;' '.avup{position:relative;width:108px;height:108px;margin:0 auto 12px}
.avc{width:100%;height:100%;border-radius:50%;overflow:hidden;border:2px solid var(--gold);box-shadow:0 0 0 6px rgba(217,178,95,.1),0 12px 30px rgba(0,0,0,.55);background:#000}
.avp{position:absolute;right:-3px;bottom:-3px;width:36px;height:36px;border-radius:50%;background:linear-gradient(180deg,#f0d28a,#c4962f);color:#2a1a08;font:700 24px/1 var(--sans);border:3px solid #1a1315;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.55);padding:0;transition:transform .2s}
.avp:hover{transform:scale(1.1)}.avp:disabled{opacity:.6;cursor:wait}
.t5.g9{border:2px solid #d9b25f;'

# ---- picture shrinker (also strips anything hidden in the file by re-drawing it) ----
Swap 'const X_RE=/^[A-Za-z0-9_]{1,15}$/;' @'
const X_RE=/^[A-Za-z0-9_]{1,15}$/;
function shrinkImage(file){
  return new Promise((res,rej)=>{
    if(!/^image\//.test(file.type)||file.size>12e6)return rej(new Error('Choose a picture (JPG, PNG or WebP) under 12 MB.'));
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{URL.revokeObjectURL(url);const S=192,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),m=Math.min(im.width,im.height);g.drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,S,S);res(c.toDataURL('image/jpeg',.85))};
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('That file is not a picture we can read.'))};
    im.src=url;
  });
}
'@

# ---- the username pop-up: profile circle + plus button at the top ----
Swap 'show(`<div class="gl-gem">${GEM_SVG}</div><h2>Enter your <em>username</em></h2>' 'show(`<div class="avup"><div class="avc" id="avc">${imgTag(P.glyph&&safeUrl(P.glyph.picture)?P.glyph.picture:''assets/mimu-icon.jpg'')}</div><button class="avp" id="avpl" type="button" aria-label="Upload a profile picture">+</button><input type="file" id="avf" accept="image/*" hidden></div><h2>Enter your <em>username</em></h2>'
Swap 'const inp=$(''#xtype'',root),err=$(''#xe'',root),btn=$(''#xs'',root);' @'
const inp=$('#xtype',root),err=$('#xe',root),btn=$('#xs',root);
    const pick=$('#avf',root),plus=$('#avpl',root),avc=$('#avc',root);
    plus.onclick=()=>pick.click();
    pick.onchange=async()=>{
      const f=pick.files&&pick.files[0];if(!f)return;
      err.textContent='';plus.disabled=true;plus.textContent='\u2026';
      try{
        const data=await shrinkImage(f);avc.innerHTML=imgTagData(data);
        const r=await API.j('/api/avatar',{method:'POST',body:JSON.stringify({image:data})});
        if(P.glyph){P.glyph.picture=r.url;saveP()}
      }catch(e){err.textContent=(e&&e.message)||'Could not upload that picture. Try another.'}
      plus.disabled=false;plus.textContent='+';pick.value='';
    };
'@
Swap 'const imgTag=u=>' 'const imgTagData=u=>`<img src="${u}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`;
const imgTag=u=>'

# ---- time zone labels: EST and PST ----
$s = $t.IndexOf('function buildAlarm(root){'); $e = $t.IndexOf('function buildTop5(root){')
if ($s -lt 0 -or $e -le $s) { throw 'alarm block' }
$blk = $t.Substring($s, $e - $s)
$blk = [regex]::Replace($blk, '\bET\b', 'EST'); $blk = [regex]::Replace($blk, '\bPT\b', 'PST')
$t = $t.Substring(0, $s) + $blk + $t.Substring($e)
Swap ("9 PM ET'") ("9 PM EST'")
Swap ("9 AM ET'") ("9 AM EST'")
[IO.File]::WriteAllText($p, $t, (New-Object Text.UTF8Encoding $false))
'patched part 1'
