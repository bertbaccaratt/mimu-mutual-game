// Blue orb (rules v6): drawing, pickup, chip, glow, help text (Chair Run ? panel, the guide) and the server / admin live view letter.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const R = (f) => fs.readFileSync(new URL(f, root), 'utf8');
const W = (f, t) => fs.writeFileSync(new URL(f, root), t);
const once = (t, a, b, tag) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error((tag || a.slice(0, 50)) + ': found ' + n); return t.replace(a, () => b); };

/* ---------- index.html ---------- */
let h = R('index.html');
h = once(h, '<script src="assets/sim.js?v=5"></script>', '<script src="assets/sim.js?v=6"></script>');
h = once(h, '.c-redorb{--cc:#ff3b3b}', '.c-redorb{--cc:#ff3b3b}.c-blueorb{--cc:#3b9bff}');
h = once(h, '#rmsg div.orb{border-color:#ff4a4a;box-shadow:0 0 12px rgba(255,60,60,.55)}#rmsg div.orb b{color:#ffd0cc}',
  '#rmsg div.orb{border-color:#ff4a4a;box-shadow:0 0 12px rgba(255,60,60,.55)}#rmsg div.orb b{color:#ffd0cc}#rmsg div.borb{border-color:#4aa8ff;box-shadow:0 0 12px rgba(60,150,255,.55)}#rmsg div.borb b{color:#d2e8ff}');
h = once(h, '@keyframes orbring{0%{transform:scale(.4);opacity:1}100%{transform:scale(9);opacity:0}}',
  '@keyframes orbring{0%{transform:scale(.4);opacity:1}100%{transform:scale(9);opacity:0}}.orbfx.bluefx{border-color:rgba(70,160,255,.95);box-shadow:0 0 30px rgba(40,140,255,.8),inset 0 0 20px rgba(80,160,255,.6)}');
h = once(h, '.rorb.on{opacity:1}',
  '.rorb.on{opacity:1}.borbg{position:absolute;inset:0;pointer-events:none;z-index:4;opacity:0;transition:opacity .6s;box-shadow:inset 0 0 60px 8px rgba(40,140,255,.5),inset 0 0 140px rgba(20,100,255,.25);animation:orbpulse 2.4s ease-in-out infinite}.borbg.on{opacity:1}');
h = once(h, '<div class="rorb" id="rorb"></div>', '<div class="rorb" id="rorb"></div><div class="borbg" id="borbg"></div>');
h = once(h, "orb:$('#rorb',root),sc:", "orb:$('#rorb',root),bl:$('#borbg',root),sc:");
h = once(h, "if(hud.orb)hud.orb.classList.toggle('on',S.orbT>0);",
  "if(S.surgeT>0){const s=Math.ceil(S.surgeT);a.push('\u{1F535} SURGE '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'))}if(hud.orb)hud.orb.classList.toggle('on',S.orbT>0);if(hud.bl)hud.bl.classList.toggle('on',S.surgeT>0);");
h = once(h, "+(S.orbT>0?'O'+Math.ceil(S.orbT):'');if(sig!==pwSig)", "+(S.orbT>0?'O'+Math.ceil(S.orbT):'')+(S.surgeT>0?'U'+Math.ceil(S.surgeT):'');if(sig!==pwSig)");
h = once(h, "o.k==='orb'?'r':'x'):o.t==='gate'?'g':null;if(!c)continue;", "o.k==='orb'?'r':o.k==='blue'?'u':'x'):o.t==='gate'?'g':null;if(!c)continue;");
h = once(h, "          if(e.k==='orb'){ST().orb++;",
  "          if(e.k==='blue'){const s=ST();s.blue=(s.blue||0)+1;saveP();sfx.win();spark(sx,sy,34,'#4aa8ff');spark(sx,sy,14,'#fff');\n" +
  "            const fx=document.createElement('div');fx.className='orbfx bluefx';root.querySelector('.sc').appendChild(fx);setTimeout(()=>fx.remove(),1000);\n" +
  "            msg('\u{1F535} Surge · faster for 60s','big borb','Top speed +5 for 60 seconds, then it eases back. Riskier, but you score faster');break}\n" +
  "          if(e.k==='orb'){ST().orb++;");
h = once(h, "case 'orbseen':msg('\u{1F534} Red orb ahead','orb','Catch it to slow down and breathe');sfx.select();break;",
  "case 'orbseen':msg('\u{1F534} Red orb ahead','orb','Catch it to slow down and breathe');sfx.select();break;\n        case 'blueseen':msg('\u{1F535} Blue orb ahead','borb','Catch it for 60 seconds of extra speed');sfx.select();break;");
// the orb in the road: same orb, blue colours for the blue one
h = once(h, "if(o.k==='orb'){\n        const pu=", "if(o.k==='orb'||o.k==='blue'){const bl=o.k==='blue';\n        const pu=");
h = once(h, "g2.addColorStop(0,'rgba(255,70,70,.95)');g2.addColorStop(.35,'rgba(255,40,40,.45)');g2.addColorStop(1,'rgba(255,0,0,0)');",
  "g2.addColorStop(0,bl?'rgba(70,160,255,.95)':'rgba(255,70,70,.95)');g2.addColorStop(.35,bl?'rgba(40,120,255,.45)':'rgba(255,40,40,.45)');g2.addColorStop(1,bl?'rgba(0,60,255,0)':'rgba(255,0,0,0)');");
h = once(h, "cg.addColorStop(0,'#ffe0dc');cg.addColorStop(.35,'#ff4a4a');cg.addColorStop(1,'#8a0b12');",
  "cg.addColorStop(0,bl?'#dcecff':'#ffe0dc');cg.addColorStop(.35,bl?'#3f9bff':'#ff4a4a');cg.addColorStop(1,bl?'#0b2f8a':'#8a0b12');");

/* ---------- help text: the same cards sit in the Chair Run ? panel (escaped copy) and the guide (plain copy) ---------- */
const card = `<div class="fm c-blueorb"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">\u{1F535}</span><b>The blue orb: only at 50 million and 100 million points</b></div><p>The opposite of the red orb: a burst of speed for the very best runs.</p><ul><li>A blue orb appears on the road <b>only twice</b>: when your run reaches <b>50 million</b> points and again at <b>100 million</b>. It never comes back after that.</li><li>Run into it to catch it. Your top speed goes <b>up by 5 for 60 seconds</b> (about 20% faster: riskier, but you score faster), then it eases back by itself to wherever the ramp has reached.</li><li>Catching it plays a burst and a ring, and a blue glow frames the screen while the surge lasts.</li><li>A blue chip at the top shows the 60 second countdown, and the glow fades when the surge ends.</li><li>It works like the red orb the other way round. If a red calm and a blue surge are active together they cancel each other out. Miss the 50 million orb and the next one is at 100 million.</li></ul></div></div>`;
const redEnd = 'just refreshes the 60 seconds.</li></ul></div></div>';
const lines = h.split('\n');
const tweak = (s, esc) => {
  const q = (x) => (esc ? x.replace(/"/g, '\\"') : x);
  s = once(s, redEnd, redEnd + q(card), 'red card');
  s = once(s, 'Coins, power-ups and the red orb are all good for you.', 'Coins, power-ups and the red and blue orbs are all good for you.');
  s = once(s, 'and \u{1F534} CALM with a minutes:seconds countdown.', 'and \u{1F534} CALM or \u{1F535} SURGE with a minutes:seconds countdown.');
  s = once(s, 'the red orb calm is active.</li>', 'the red orb calm is active. <b>Blue glow around the whole screen</b>: the blue orb surge is active.</li>');
  s = once(s, 'The red orb takes 5 off your top speed for 60 seconds.', 'The red orb takes 5 off your top speed for 60 seconds, and the blue orb (only at 50 million and 100 million points) adds 5 for 60 seconds.');
  return s;
};
let done = 0;
lines.forEach((s, i) => { if (s.includes('fm c-redorb')) { lines[i] = tweak(s, s.includes('\\"fm')); done++; } });
if (done !== 2) throw new Error('expected 2 help copies, got ' + done);
h = lines.join('\n');
h = once(h, '<div><b>Calm</b><span>The red orb effect: slower for 60 seconds.</span></div>',
  '<div><b>Calm</b><span>The red orb effect: slower for 60 seconds.</span></div><div><b>Surge</b><span>The blue orb effect: faster for 60 seconds. Only at 50 million and 100 million points.</span></div>');
W('index.html', h);

/* ---------- server live-view letter + admin ---------- */
let s = R('backend/src/index.js');
s = once(s, "o.k === 'orb' ? 'r' : 'x')", "o.k === 'orb' ? 'r' : o.k === 'blue' ? 'u' : 'x')");
W('backend/src/index.js', s);
let a = R('admin.html');
a = once(a, "t==='r'?'\\ud83d\\udd34':'\\u2728'", "t==='r'?'\\ud83d\\udd34':t==='u'?'\\ud83d\\udd35':'\\u2728'");
W('admin.html', a);
console.log('blue orb UI patched');
