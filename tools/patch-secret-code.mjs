// Admin square: a green check mark (with a constant wiggle and a gold frame) when the player who found the number texted the
// correct code to the Hype user account. The code is a server secret.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, root); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 80)); return t.replace(a, () => b); };

edit('backend/src/index.js', (t) => {
  t = once(t, "import { newStats, observe, judge } from './behavior.js';", "import { newStats, observe, judge } from './behavior.js';\nimport { codeCheck } from './secret.js';");
  t = once(t, "    return { found: true, name: row.n || 'a player', x: row.x || '', address: row.a, at: row.t };",
              "    const out = { found: true, name: row.n || 'a player', x: row.x || '', address: row.a, at: row.t };\n" +
              "    try { Object.assign(out, await codeCheck(env, row)); } catch { /* the code check can never hide who found the number */ }\n" +
              "    return out;");
  return t;
});

edit('admin.html', (t) => {
  t = once(t, ".a-gold{--ac:var(--gold)}",
".sec.sec-ok{border:3px solid #ffd257;box-shadow:0 0 0 2px #7a5a12,0 0 34px rgba(255,210,87,.55),inset 0 0 40px rgba(255,210,87,.12);animation:secwig 1.1s ease-in-out infinite;transform-origin:50% 60%}\n" +
"@keyframes secwig{0%,100%{transform:rotate(-1.4deg) scale(1)}25%{transform:rotate(1.4deg) scale(1.012)}50%{transform:rotate(-1deg) scale(1)}75%{transform:rotate(1.2deg) scale(1.01)}}\n" +
".sec .chk{display:inline-grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#22c55e;color:#fff;font-size:30px;font-weight:900;line-height:1;box-shadow:0 0 18px rgba(34,197,94,.75);animation:chkwig .55s ease-in-out infinite;margin-right:12px;vertical-align:middle}\n" +
"@keyframes chkwig{0%,100%{transform:rotate(-14deg) scale(1)}50%{transform:rotate(14deg) scale(1.12)}}\n" +
".a-gold{--ac:var(--gold)}");
  const a = t.indexOf('let SEC_PREV=null;'), b = t.indexOf('function render(d){', a);
  if (a < 0 || b < 0) throw new Error('admin secret block not found');
  const fn =
"let SEC_PREV=null,SEC_CODE_PREV=null;\n" +
"function paintSecret(d){\n" +
"  const s=d.secret||{found:false},b=$('#secretbody'),box=$('#secretbox');if(!b)return;\n" +
"  if(!s.found){box.className='sec a-sky';b.innerHTML='<b style=\"color:var(--text);font-size:18px\">Not found yet</b><div style=\"margin-top:4px\">Nobody has dialed it yet. The first signed-in player to dial it is recorded here.</div>';SEC_PREV=false;SEC_CODE_PREV=false;return}\n" +
"  const pt=ms=>new Date(ms).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})+' PT';\n" +
"  box.className=s.codeOk?'sec a-gold sec-ok':'sec a-gold';\n" +
"  let h='';\n" +
"  if(s.codeOk)h+='<div style=\"display:flex;align-items:center;margin-bottom:10px\"><span class=\"chk\">&#10004;</span><div><div style=\"font-size:20px;font-weight:800;color:#4ade80\">TEXTED THE CORRECT CODE</div><div style=\"color:var(--muted);font-size:13px\">to the Hype account at <b>'+pt(s.codeAt)+'</b></div></div></div>';\n" +
"  h+='<div style=\"font-size:20px;font-weight:700;color:var(--gold)\">&#127942; '+esc(s.name)+' got the number</div><div style=\"margin-top:4px\">They dialed it first at <b>'+pt(s.at)+'</b>.</div>';\n" +
"  if(s.codeOk&&s.codeText)h+='<div style=\"margin-top:8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.06)\">They sent: <b>&ldquo;'+esc(s.codeText)+'&rdquo;</b></div>';\n" +
"  h+='<div style=\"margin-top:8px;font:12px var(--mono);color:var(--muted);word-break:break-all\">'+esc(s.address||'')+'</div>';\n" +
"  b.innerHTML=h;\n" +
"  if(SEC_PREV===false){toast('&#9742; '+esc(s.name)+' just found the secret number!');ding(988,1480);confetti(60)}\n" +
"  if(s.codeOk&&SEC_CODE_PREV===false){toast('&#9989; '+esc(s.name)+' texted the correct code!');ding(1180,1760);confetti(90)}\n" +
"  SEC_PREV=true;SEC_CODE_PREV=!!s.codeOk;\n" +
"}\n";
  return t.slice(0, a) + fn + t.slice(b);
});
console.log('secret code check applied');
