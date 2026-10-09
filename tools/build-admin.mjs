// Rebuilds admin.html with the new design, keeping every id and function the page already uses.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/admin.html';
const old = fs.readFileSync(p, 'utf8');
const s0 = old.indexOf('<script>') + 8, s1 = old.lastIndexOf('</script>');
let js = old.slice(s0, s1);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rep = (a, b) => { const re = new RegExp(a.split('\n').map(esc).join('\\r?\\n')); if (!re.test(js)) throw new Error('js missing: ' + a.slice(0, 80)); js = js.replace(re, () => b); };

/* ---------- script edits: medals, friendlier empty states, a little fun ---------- */
rep('<tr><td class="n">${i+1}</td>', '<tr><td class="n">${i<3?[\'🥇\',\'🥈\',\'🥉\'][i]:i+1}</td>');
rep('<div class="empty">Nobody on the board yet this week.</div>', '<div class="empty"><i>🏁</i>Nobody on the board yet this week.<br><small>The chairs are waiting.</small></div>');
rep('<div class="empty">Nothing waiting. Flagged runs show up here for you to approve or deny.</div>', '<div class="empty"><i>🌴</i>All clear. Nothing is waiting for review.<br><small>Flagged runs show up here to approve or deny.</small></div>');
rep('<div class="empty">No transfers yet.</div>', '<div class="empty"><i>💸</i>No $TMF has changed hands yet.</div>');
rep('<div class="empty">No texts yet.</div>', '<div class="empty"><i>💬</i>No texts yet. The halls are quiet.</div>');
rep('<div class="empty">No players yet.</div>', '<div class="empty"><i>🆕</i>No players yet.</div>');
rep('function render(d){\n  DATA=d;', `let PREV=null;
function render(d){
  DATA=d;
  if(PREV){
    if(d.visitors>PREV.v){toast('🎉 New visitor! '+nf(d.visitors)+' and counting');ding()}
    if(d.users.length>PREV.u){toast('🆕 A new player just signed in');ding(988,1480);confetti(45)}
    if(d.held.length>PREV.h){toast('🚩 A run needs your review');ding(440,330)}
  }
  PREV={v:d.visitors,u:d.users.length,h:d.held.length};`);
rep("return r?`<div class=\"lsq on\"><span class=\"pulse\"></span><div class=\"nm\">${esc(r.n||'player')}</div>", "return r?`<div class=\"lsq on\"><span class=\"pulse\"></span><div class=\"runner\">🏃</div><div class=\"nm\">${esc(r.n||'player')}</div>");
rep("try{const d=await call('live');LIVE_RUNS=d.runs||[];", "try{const d=await call('live');LIVE_RUNS=d.runs||[];LIVE_RUNS.forEach(r=>{if(!LIVE_SEEN.has(r.id)){if(LIVE_SEEN.size||LIVE_INIT){toast('🏃 '+(r.n||'A player')+' just started a run');ding(660,990)}LIVE_SEEN.add(r.id)}});LIVE_INIT=true;");
rep('let LIVE_RUNS=[];', 'let LIVE_RUNS=[],LIVE_INIT=false;const LIVE_SEEN=new Set();');
rep("$('#m-clear').onclick();refresh();", "$('#m-clear').onclick();refresh();confetti(90);ding(784,1175);");
rep("$('#h-n').textContent='0 / 280';refresh();", "$('#h-n').textContent='0 / 280';refresh();confetti(60);ding(784,1175);");
rep("/* ---------- campaign countdown (Sat Oct 10 2026 9 PM ET -> Wed Oct 14 2026 9 AM ET); shown until it ends ---------- */", "/* ---------- campaign countdown (opens Sat Oct 10 2026 6 PM, closes Wed Oct 14 2026 6 AM, Los Angeles time); shown until it ends ---------- */");
rep('/* ---------- actions ---------- */', `/* ---------- a little fun: greeting, sounds, confetti ---------- */
const QUIPS=['The chairs are holding up.','Mimu is watching.','All systems vibing.','Coffee status: strong.','Another day in the halls.','Somebody is about to beat their best.','Leaderboards look spicy today.'];
function greet(){
  const h=new Date().getHours(),w=h<5?'Burning the midnight oil':h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  $('#greet').textContent=w+', chief. '+QUIPS[Math.floor(Math.random()*QUIPS.length)];
}
let SOUND=true;try{SOUND=localStorage.getItem('mimu-admin-snd')!=='0'}catch(e){}
let ACX=null;
function ding(f1=880,f2=1320){
  if(!SOUND)return;
  try{ACX=ACX||new(window.AudioContext||window.webkitAudioContext)();const t=ACX.currentTime;
    [[f1,0],[f2,.11]].forEach(([f,d])=>{const o=ACX.createOscillator(),g=ACX.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.06,t+d+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d+.4);o.connect(g);g.connect(ACX.destination);o.start(t+d);o.stop(t+d+.45)});
  }catch(e){}
}
function paintSnd(){const b=$('#snd');if(b){b.textContent=SOUND?'🔔 Sound on':'🔕 Sound off';b.classList.toggle('off',!SOUND)}}
$('#snd').onclick=()=>{SOUND=!SOUND;try{localStorage.setItem('mimu-admin-snd',SOUND?'1':'0')}catch(e){}paintSnd();if(SOUND)ding()};
function confetti(n=70){
  const c=$('#cf');if(!c||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const g=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const cols=['#ffc233','#3b8cff','#2fd36b','#ff5fa8','#a66bff','#19d3c5','#ff4d4d'];
  const ps=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*220,y:innerHeight*.38,vx:(Math.random()-.5)*15,vy:-Math.random()*13-4,r:Math.random()*5+3,c:cols[Math.random()*cols.length|0],a:Math.random()*6.3,va:(Math.random()-.5)*.4}));
  let f=0;(function step(){g.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;g.save();g.translate(p.x,p.y);g.rotate(p.a);g.fillStyle=p.c;g.fillRect(-p.r,-p.r/2,p.r*2,p.r);g.restore()});if(++f<110)requestAnimationFrame(step);else g.clearRect(0,0,c.width,c.height)})();
}

/* ---------- actions ---------- */`);
rep("  campTick();\n  refresh();paintLive();pollLive(true);", "  campTick();greet();paintSnd();\n  refresh();paintLive();pollLive(true);");

/* ---------- the page ---------- */
const css = `
:root{--bg:#06070b;--panel:#0f1218;--panel2:#161a24;--line:#262c3b;--cream:#f4efe3;--muted:#8f97ab;
 --gold:#ffc233;--blue:#3b8cff;--green:#2fd36b;--red:#ff4d4d;--purple:#a66bff;--teal:#19d3c5;--pink:#ff5fa8;--amber:#ffb000;--sky:#4cc3ff;
 --up:#46e08a;--bad:#ff6b6b;--gap:20px;
 --mono:'IBM Plex Mono',ui-monospace,Consolas,monospace;--cond:'Oswald','Arial Narrow',Impact,sans-serif}
*{box-sizing:border-box;margin:0}
html{background:var(--bg);-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{min-height:100vh;color:var(--cream);font:400 13px/1.5 var(--mono);padding:22px 20px 70px;
 background:radial-gradient(900px 520px at 10% -8%,rgba(59,140,255,.20),transparent 60%),radial-gradient(800px 520px at 92% -6%,rgba(166,107,255,.18),transparent 60%),radial-gradient(1000px 620px at 50% 112%,rgba(255,194,51,.09),transparent 60%),var(--bg);background-attachment:fixed}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
a{color:var(--gold);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1180px;margin:0 auto}
.page{display:grid;gap:var(--gap)}
.row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gap);align-items:stretch}
@media(max-width:900px){.row2{grid-template-columns:minmax(0,1fr)}}

/* login */
#login{max-width:360px;margin:16vh auto 0;text-align:center;padding:30px 26px;border-radius:24px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);box-shadow:0 30px 70px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03) inset}
#login h1{font:700 26px var(--cond);letter-spacing:.24em;text-transform:uppercase;margin-bottom:4px;background:linear-gradient(90deg,var(--gold),var(--pink),var(--blue));-webkit-background-clip:text;background-clip:text;color:transparent}
#login p{color:var(--muted);margin-bottom:20px}
#login input{width:100%;padding:14px;border-radius:12px;background:#0b0e14;border:1px solid var(--line);color:var(--cream);font:500 15px var(--mono);outline:0;text-align:center}
#login input:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(255,194,51,.18)}
#login button{margin-top:12px;width:100%;padding:14px;border-radius:12px;background:linear-gradient(180deg,#ffd36a,#f0a61a);color:#2a1d08;font:700 13px var(--mono);letter-spacing:.16em;text-transform:uppercase;box-shadow:0 8px 22px rgba(255,176,0,.35)}
#lerr{min-height:20px;margin-top:12px;color:var(--bad)}

/* top bar */
.bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:var(--gap);padding:12px 16px;border-radius:16px;background:rgba(22,26,36,.75);border:1px solid var(--line);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.bar .brand{display:inline-flex;align-items:center;gap:9px;font:700 15px var(--cond);letter-spacing:.2em;text-transform:uppercase}
.bar .brand i{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green);animation:pulse 2s infinite}
#greet{flex:1;min-width:200px;color:var(--gold);font:500 12.5px var(--mono)}
#upd{color:var(--muted);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.bar button{padding:7px 14px;border:1px solid var(--line);border-radius:999px;color:var(--cream);font:600 11px var(--mono);letter-spacing:.1em;transition:.2s}
.bar button:hover{border-color:var(--gold);color:var(--gold);transform:translateY(-1px)}.bar button.off{color:var(--muted)}
.bar #out{border-color:rgba(255,77,77,.5);color:#ff8a8a}.bar #out:hover{background:rgba(255,77,77,.12);border-color:var(--red);color:#fff}
@keyframes pulse{50%{opacity:.35}}

/* flip clock */
.case{padding:22px 22px 20px;border-radius:26px;background:linear-gradient(180deg,#2a2519,#0e0c09);border:1px solid #4a4026;box-shadow:0 30px 60px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.08),inset 0 -2px 6px rgba(0,0,0,.8),0 0 40px rgba(255,194,51,.07);position:relative;text-align:center}
.case:before,.case:after{content:"";position:absolute;top:12px;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#b3a98f,#2b2720 70%);box-shadow:0 1px 0 #000}
.case:before{left:14px}.case:after{right:14px}
.plate{display:inline-block;margin-bottom:16px;padding:6px 20px;border-radius:7px;background:linear-gradient(180deg,#463d27,#1b1711);border:1px solid #6a5a34;font:600 11px var(--mono);letter-spacing:.42em;text-indent:.42em;text-transform:uppercase;color:var(--gold);text-shadow:0 0 12px rgba(255,194,51,.5)}
.digits{display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:nowrap}
.grp{display:flex;gap:6px}
.fd{position:relative;width:clamp(44px,10vw,98px);height:clamp(66px,15vw,148px);perspective:700px;font:700 clamp(54px,12.4vw,120px)/1 var(--cond)}
.fd .h{position:absolute;left:0;right:0;height:50%;overflow:hidden;background:linear-gradient(180deg,#252219,#15130f);color:#fff7e0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.fd .h span{position:absolute;left:0;right:0;height:200%;display:flex;align-items:center;justify-content:center}
.fd .t,.fd .ft{top:0;border-radius:9px 9px 0 0;border-bottom:1px solid #000;transform-origin:50% 100%;box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.fd .b,.fd .fb{bottom:0;border-radius:0 0 9px 9px;background:linear-gradient(180deg,#171510,#0f0d0a);transform-origin:50% 0;box-shadow:inset 0 -1px 0 rgba(255,255,255,.05)}
.fd .t span,.fd .ft span{top:0}.fd .b span,.fd .fb span{bottom:0}
.fd .ft,.fd .fb{visibility:hidden;z-index:3}
.fd .fb{transform:rotateX(90deg)}
.fd.go .ft{visibility:visible;animation:ft .16s ease-in forwards}
.fd.go .fb{visibility:visible;animation:fb .16s .16s ease-out forwards}
@keyframes ft{to{transform:rotateX(-90deg)}}
@keyframes fb{to{transform:rotateX(0)}}
.fd:after{content:"";position:absolute;left:-3px;right:-3px;top:50%;height:3px;margin-top:-1.5px;background:#050403;z-index:5;box-shadow:0 1px 0 rgba(255,255,255,.07)}
.fd:before{content:"";position:absolute;left:-4px;top:calc(50% - 5px);width:6px;height:10px;border-radius:2px;background:#0b0a08;z-index:6;box-shadow:inset 0 1px 0 #3a3326}
.stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:20px}
.stat{padding:12px 10px 10px;border-radius:14px;background:rgba(0,0,0,.35);border:1px solid var(--c);box-shadow:0 0 18px color-mix(in srgb,var(--c) 22%,transparent),inset 0 0 22px color-mix(in srgb,var(--c) 10%,transparent)}
.stat b{display:block;font:700 26px/1.1 var(--cond);color:var(--c);font-variant-numeric:tabular-nums;text-shadow:0 0 16px color-mix(in srgb,var(--c) 55%,transparent)}
.stat span{display:block;margin-top:3px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.stat.s1{--c:#4cc3ff}.stat.s2{--c:#a66bff}.stat.s3{--c:#2fd36b}.stat.s4{--c:#ffb000}.stat.s5{--c:#ff5fa8}
@media(max-width:820px){.stats{grid-template-columns:repeat(2,minmax(0,1fr))}.stat.s5{grid-column:1/-1}}
.camps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}
@media(max-width:700px){.camps{grid-template-columns:minmax(0,1fr)}}
.camp{padding:12px 16px;border:2px solid var(--red);border-radius:14px;box-shadow:0 0 18px rgba(255,77,77,.3);background:#150808;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
.camp[hidden]{display:none}.camp .cl{color:#ff8f86;font-weight:600}.camp b{font:700 21px var(--cond);letter-spacing:.1em;color:#fff;font-variant-numeric:tabular-nums}
.camp.live{border-color:var(--green);background:#07140b;box-shadow:0 0 18px rgba(47,211,107,.32)}.camp.live .cl{color:#7dffa8}

/* section cards */
.sec{--ac:var(--blue);border-radius:20px;background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-top:3px solid var(--ac);overflow:hidden;box-shadow:0 14px 34px rgba(0,0,0,.4);display:flex;flex-direction:column;min-width:0}
.sec>h2{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 20px 12px;font:700 15px var(--cond);letter-spacing:.2em;text-transform:uppercase;color:var(--ac);border-bottom:1px solid var(--line);text-shadow:0 0 18px color-mix(in srgb,var(--ac) 45%,transparent)}
.sec>h2 small{font:500 10px var(--mono);letter-spacing:.14em;color:var(--muted);text-transform:none;text-shadow:none}
.sec>div{flex:1}
.a-gold{--ac:var(--gold)}.a-purple{--ac:var(--purple)}.a-green{--ac:var(--green)}.a-amber{--ac:var(--amber)}.a-teal{--ac:var(--teal)}.a-pink{--ac:var(--pink)}.a-sky{--ac:var(--sky)}
table{width:100%;border-collapse:collapse}
th{padding:9px 16px;text-align:left;color:var(--muted);font:600 10px var(--mono);letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid var(--line);position:sticky;top:0;background:#12161f;z-index:2}
td{padding:10px 16px;border-bottom:1px solid #1b2030;vertical-align:middle;word-break:break-word}
tr:last-child td{border-bottom:0}tbody tr:hover td{background:rgba(255,255,255,.03)}
td.n{width:48px;white-space:nowrap;color:var(--gold);font:700 15px var(--mono)}td.r{text-align:right;font-variant-numeric:tabular-nums;color:var(--cream);font-weight:600}
.scroll{max-height:380px;overflow:auto;scrollbar-width:thin}
.empty{padding:30px 18px;color:var(--muted);text-align:center}.empty i{display:block;font-style:normal;font-size:30px;margin-bottom:6px}.empty small{color:#6c7488}
.tag{display:inline-block;padding:2px 9px;border-radius:999px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);color:var(--muted)}
.tag.bad{color:#ff8a8a;border-color:#7a2f2f;background:rgba(255,77,77,.1)}.tag.warn{color:#ffc766;border-color:#7a5a12;background:rgba(255,176,0,.1)}
.av{width:26px;height:26px;border-radius:50%;object-fit:cover;background:#000;border:1px solid var(--line);vertical-align:middle;margin-right:8px}
.wal{font-size:11px;color:var(--muted);cursor:copy}.wal:hover{color:var(--cream)}
.btns{display:flex;gap:6px;flex-wrap:wrap}
.btn{padding:6px 13px;border-radius:8px;border:1px solid var(--line);font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;transition:.15s}
.btn.ok{background:rgba(47,211,107,.14);border-color:#2c8a52;color:#5ff09a}.btn.ok:hover{background:rgba(47,211,107,.28)}
.btn.no{background:rgba(255,77,77,.13);border-color:#8a3434;color:#ff8a8a}.btn.no:hover{background:rgba(255,77,77,.28)}
.btn.ghost{color:var(--muted)}.btn.ghost:hover{color:var(--cream);border-color:var(--gold)}
.btn:disabled{opacity:.4;cursor:default}
.flags{display:flex;gap:5px;flex-wrap:wrap}
.xl{color:#8fd0ff}
.toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);padding:12px 22px;border-radius:14px;background:#0c0f16f2;border:1px solid var(--gold);color:var(--cream);z-index:60;display:none;box-shadow:0 12px 36px rgba(0,0,0,.6),0 0 24px rgba(255,194,51,.25)}
#cf{position:fixed;inset:0;pointer-events:none;z-index:80;width:100vw;height:100vh}

/* live runs */
.live3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--gap);padding:20px}
@media(max-width:560px){.live3{grid-template-columns:minmax(0,1fr)}}
.lsq{aspect-ratio:1/.82;border-radius:18px;border:3px solid var(--red);background:radial-gradient(circle at 50% 0,#2a0c0c,#140808);box-shadow:0 0 22px rgba(255,77,77,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:10px;text-align:center;overflow:hidden;position:relative;transition:border-color .3s,background .3s,box-shadow .3s}
.lsq.on{border-color:var(--green);background:radial-gradient(circle at 50% 0,#0e3a1d,#07140b);box-shadow:0 0 30px rgba(47,211,107,.5)}
.lsq .runner{font-size:22px;animation:bob 1s ease-in-out infinite}
@keyframes bob{50%{transform:translateX(5px) translateY(-2px)}}
.lsq .nm{font:600 12.5px var(--mono);color:#fff;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lsq .sc{font:700 clamp(30px,4.6vw,50px)/1 var(--cond);color:#7dffa8;font-variant-numeric:tabular-nums;text-shadow:0 0 22px rgba(47,211,107,.6)}
.lsq small{font:500 10.5px var(--mono);color:#a7c9b4;letter-spacing:.06em}
.lsq em{font:600 12px var(--mono);color:#7dffa8;font-style:normal;letter-spacing:.1em}
.lsq .pulse{position:absolute;top:12px;right:12px;width:10px;height:10px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);animation:pulse 1.4s infinite}
.spin{width:36px;height:36px;border-radius:50%;border:3px solid #4a1d1b;border-top-color:var(--red);animation:spin 1s linear infinite;display:block}
@keyframes spin{to{transform:rotate(360deg)}}

/* the two send boxes: same size, same rhythm */
.mailbox,.hypebox{margin:0;max-width:none;padding:20px;border-radius:20px;display:flex;flex-direction:column;min-width:0}
.mailbox{border:2px solid var(--blue);background:linear-gradient(180deg,#0c1730,#08111f);box-shadow:0 0 30px rgba(59,140,255,.32)}
.hypebox{border:2px solid var(--green);background:linear-gradient(180deg,#0a2314,#07140b);box-shadow:0 0 30px rgba(47,211,107,.3)}
.mailbox h2,.hypebox h2{font:700 15px var(--cond);letter-spacing:.2em;text-transform:uppercase;margin:0 0 14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.mailbox h2{color:#8fbcff;text-shadow:0 0 16px rgba(59,140,255,.5)}.hypebox h2{color:#7dffa8;text-shadow:0 0 16px rgba(47,211,107,.5)}
.mailbox h2 small,.hypebox h2 small{font:500 10px var(--mono);letter-spacing:.12em;color:var(--muted);text-transform:none;text-shadow:none}
.mailbox input[type=text],.mailbox textarea,.hypebox input[type=text],.hypebox textarea{width:100%;padding:12px 14px;border-radius:11px;color:var(--cream);font:500 13px var(--mono);outline:0;resize:vertical;margin-bottom:10px}
.mailbox input[type=text],.mailbox textarea{background:#0b1a33;border:1px solid #2a56a0}
.hypebox input[type=text],.hypebox textarea{background:#0b2216;border:1px solid #1f7a45}
.mailbox input[type=text]:focus,.mailbox textarea:focus{border-color:#6aa2ff;box-shadow:0 0 0 3px rgba(59,140,255,.2)}
.hypebox input[type=text]:focus,.hypebox textarea:focus{border-color:#4be08a;box-shadow:0 0 0 3px rgba(47,211,107,.2)}
.mailbox textarea{flex:1 1 auto;min-height:150px}.hypebox textarea{flex:1 1 auto;min-height:92px}
.mailbox .mrow,.hypebox .hrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:auto}
.mailbox .mattach{padding:9px 14px;border:1px dashed #4a7fd0;border-radius:10px;color:#8fbcff;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:.15s}
.mailbox .mattach:hover{background:#0f2447}
.mailbox .msend,.hypebox .hsend{margin-left:auto;padding:11px 20px;border-radius:11px;font:700 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;transition:.15s}
.mailbox .msend{background:linear-gradient(180deg,#5b9bff,#2160d8);color:#fff;box-shadow:0 8px 20px rgba(59,140,255,.45)}
.hypebox .hsend{background:linear-gradient(180deg,#53e07a,#1f9f48);color:#04150a;box-shadow:0 8px 20px rgba(47,211,107,.4)}
.mailbox .msend:hover,.hypebox .hsend:hover{transform:translateY(-2px)}
.mailbox .msend:disabled,.hypebox .hsend:disabled{opacity:.5;cursor:wait;transform:none}
.mailbox #m-prev[hidden]{display:none}
.mailbox #m-prev{display:block;max-width:100%;max-height:150px;border-radius:10px;margin-top:12px;border:1px solid #2a56a0}
.mailbox #m-st,.hypebox #h-st{min-height:18px;margin-top:10px;font-size:12px;color:var(--muted)}
.mailbox .msent,.hypebox .hsent{margin-top:12px;padding-top:12px;font-size:11.5px;color:var(--muted)}
.mailbox .msent{border-top:1px solid #1d3a6b}.hypebox .hsent{border-top:1px solid #175c34}
.mailbox .msent div{display:flex;gap:10px;align-items:center;padding:4px 0}.mailbox .msent b{color:var(--cream);font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hypebox .hsent div{padding:3px 0;display:flex;gap:8px}.hypebox .hsent b{color:#7dffa8;font-weight:600;white-space:nowrap}.hypebox .hsent span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--cream)}
.hypebox .hpick{border:1px solid #1f7a45;border-radius:12px;background:#0b2216;margin-bottom:10px;overflow:hidden}
.hypebox .hpl{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid #175c34;font:600 12px var(--mono);color:#7dffa8}
.hypebox .hpl span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hypebox .hpl input{width:100px;margin:0;padding:5px 9px;font-size:11px}
.hypebox .hlist{max-height:188px;overflow-y:auto;scrollbar-width:thin}
.hypebox .hrowp{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 12px;border-bottom:1px solid #12452a;cursor:pointer;transition:.12s}
.hypebox .hrowp:hover{background:#12381f}.hypebox .hrowp.sel{background:#1b5a33;box-shadow:inset 3px 0 0 #53e07a}
.hypebox .hrowp i{flex:none;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#2fd36b,#1b8a44);color:#fff;display:grid;place-items:center;font:700 12px var(--mono);font-style:normal;overflow:hidden}
.hypebox .hrowp i img{width:100%;height:100%;object-fit:cover}
.hypebox .hrowp b{flex:1;min-width:0;font:600 12.5px var(--mono);color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hypebox .hrowp small{font:500 10px var(--mono);color:var(--muted);white-space:nowrap}
.hypebox .hempty{padding:16px;text-align:center;color:var(--muted);font-size:12px}
.foot{margin-top:var(--gap);text-align:center;color:#5d667b;font-size:11px;letter-spacing:.12em}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>Admin · Mimu</title>
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<div class="wrap">

<div id="login">
  <h1>Admin</h1>
  <p>Mimu control room</p>
  <form id="lf" autocomplete="off"><input id="pw" type="password" placeholder="password" autocomplete="current-password" autofocus><button type="submit">Enter</button></form>
  <div id="lerr"></div>
</div>

<div id="app" hidden>
  <header class="bar"><span class="brand"><i></i>Mimu admin</span><span id="greet"></span><span id="upd">—</span><button id="snd" type="button">🔔 Sound on</button><button id="out" type="button">Log out</button></header>

  <main class="page">

  <section class="case" aria-label="Visitors">
    <div class="plate">Total site visitors</div>
    <div class="digits" id="digits"></div>
    <div class="stats">
      <div class="stat s1"><b id="s-today">0</b><span>last 24h</span></div>
      <div class="stat s2"><b id="s-visits">0</b><span>total visits</span></div>
      <div class="stat s3"><b id="s-users">0</b><span>players</span></div>
      <div class="stat s4"><b id="s-held">0</b><span>awaiting review</span></div>
      <div class="stat s5"><b id="s-ban">0</b><span>banned</span></div>
    </div>
    <div class="camps">
      <div class="camp" id="camp" hidden><span class="cl" id="camp-l"></span><b id="camp-t"></b></div>
      <div class="camp" id="alm" hidden><span class="cl" id="alm-l"></span><b id="alm-t"></b></div>
    </div>
  </section>

  <section class="sec a-green"><h2>🏃 Live Chair Runs <small id="livecount">happening now</small></h2><div class="live3" id="live3"></div></section>

  <div class="row2">
    <section class="mailbox" aria-label="Send email to all phones">
      <h2><span>✉ Send email to all phones</span> <small id="m-count">only the admin can send</small></h2>
      <input type="text" id="m-sub" maxlength="120" placeholder="Subject" autocomplete="off">
      <textarea id="m-body" rows="6" maxlength="5000" placeholder="Write your message…"></textarea>
      <div class="mrow"><label class="mattach"><input type="file" id="m-file" accept="image/*" hidden>📷 Attach photo</label><span id="m-fn" style="font-size:11px;color:var(--muted)"></span><button class="btn ghost" id="m-clear" type="button" hidden>Remove photo</button><button class="msend" id="m-send" type="button">Send to all phones</button></div>
      <img id="m-prev" alt="" hidden>
      <div id="m-st"></div>
      <div class="msent" id="m-sent"></div>
    </section>
    <section class="hypebox" aria-label="Send a text message as Hype">
      <h2><span>💬 Send a text message as Hype</span> <small id="h-count">one player at a time</small></h2>
      <div class="hpick"><div class="hpl"><span id="h-who">Pick a player below</span><input type="text" id="h-filter" placeholder="filter" autocomplete="off" spellcheck="false"></div><div class="hlist" id="h-list" role="listbox" aria-label="Players"></div></div>
      <textarea id="h-body" rows="4" maxlength="280" placeholder="Type Hype's message… (up to 280 characters)"></textarea>
      <div class="hrow"><span id="h-n" style="font-size:11px;color:var(--muted)">0 / 280</span><button class="hsend" id="h-send" type="button">Send as Hype</button></div>
      <div id="h-st"></div>
      <div class="hsent" id="h-sent"></div>
    </section>
  </div>

  <div class="row2">
    <section class="sec a-gold"><h2>🏆 Top 10 · Chair Run <small id="wk1">this week</small></h2><div id="t-run"></div></section>
    <section class="sec a-purple"><h2>💰 Top 10 · Mutual Mimu <small>$TMF found</small></h2><div id="t-nw"></div></section>
  </div>

  <section class="sec a-amber"><h2>🚩 Review queue <small>held or flagged runs</small></h2><div id="q"></div></section>

  <div class="row2">
    <section class="sec a-teal"><h2>💸 $TMF sent between players <small>Top 5 app · latest 50</small></h2><div class="scroll" id="xfers" style="max-height:340px"></div></section>
    <section class="sec a-pink"><h2>💬 Player texts <small>Messages app · latest 100</small></h2><div class="scroll" id="msgs" style="max-height:340px"></div></section>
  </div>

  <section class="sec a-sky"><h2>👥 Players <small id="ucount">Glyph + username</small></h2><div class="scroll" id="users"></div></section>

  </main>
  <div class="foot">Made with chairs 🪑 · Mimu On Ape</div>
</div>
</div>
<canvas id="cf" aria-hidden="true"></canvas>
<div class="toast" id="toast"></div>

<script>${js}</script>
</body>
</html>
`;
fs.writeFileSync(p, html);
console.log('built', html.length);
