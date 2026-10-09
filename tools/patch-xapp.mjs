// X app tile on the home screen (black, new X logo) that opens the Mimu On Ape profile inside the phone.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rep = (a, b) => { const re = new RegExp(a.split('\n').map(esc).join('\\r?\\n')); if (!re.test(t)) throw new Error('missing: ' + a.slice(0, 80)); t = t.replace(re, () => b); };

// CSP: X's official embed script
rep("https://www.youtube.com https://s.ytimg.com;", "https://www.youtube.com https://s.ytimg.com https://platform.twitter.com;");

// the tile: sits between the countdown and the dock
rep("<i>sec</i></div></div></div>`:''}</div>", "<i>sec</i></div></div></div>`:''}<div class=\"xrow\"><button class=\"app-i xtile\" data-open=\"x\"><div class=\"ic\">${IC.x}</div>X</button></div></div>");
rep("  mail:'<svg viewBox=", "  x:'<svg viewBox=\"0 0 24 24\"><path fill=\"#fff\" d=\"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z\"/></svg>',\n  mail:'<svg viewBox=");
rep("alarm:buildAlarm,mail:buildMail}", "alarm:buildAlarm,mail:buildMail,x:buildX}");

// make room for the tile (tighter vertical rhythm on the home screen)
rep(".widgets{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin-bottom:22px}", ".widgets{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin-bottom:16px}");
rep(".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px 8px}", ".grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px 8px}");
rep(".cdw{margin-top:22px;", ".cdw{margin-top:14px;");

rep(".alst{position:relative;", `.xrow{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px}
.xrow .xtile{grid-column:2}
.xtile .ic{background:#000!important;border:1px solid #3a3a3f;box-shadow:0 0 0 1px rgba(255,255,255,.06),0 6px 16px rgba(0,0,0,.55)}
.xtile .ic svg{width:60%;height:60%}
.xapp{position:absolute;inset:0;background:#000;color:#e7e9ea;display:flex;flex-direction:column;padding-top:54px;font-family:var(--sans)}
.xapp .xh{flex:none;display:flex;align-items:center;gap:10px;padding:6px 16px 10px;border-bottom:1px solid #2f3336}
.xapp .xh svg{width:22px;height:22px;flex:none}
.xapp .xh b{font:700 16px var(--sans);display:block;line-height:1.15}.xapp .xh span{font:400 12.5px var(--sans);color:#71767b}
.xapp .xbody{flex:1;min-height:0;overflow-y:auto;scrollbar-width:thin;position:relative}
.xapp .xload{position:absolute;inset:0;display:grid;place-items:center;color:#71767b;font:500 13px var(--sans)}
.xapp .xcard{padding:28px 24px;text-align:center}
.xapp .xcard .xav{width:84px;height:84px;border-radius:50%;margin:0 auto 12px;border:2px solid #2f3336;overflow:hidden;background:#16181c}
.xapp .xcard .xav img{width:100%;height:100%;object-fit:cover}
.xapp .xcard h3{font:700 19px var(--sans)}.xapp .xcard p{margin:6px 0 18px;font:400 14px/1.45 var(--sans);color:#71767b}
.xapp .xcard a{display:inline-block;padding:11px 24px;border-radius:999px;background:#eff3f4;color:#0f1419;font:700 14px var(--sans);text-decoration:none}
.alst{position:relative;`);

rep("function buildTop5(root){", `/* X app: the Mimu On Ape profile, shown inside the phone with X's official embedded timeline (x.com itself refuses to be framed) */
function buildX(root){
  const HANDLE='mimuonape',URL_='https://x.com/'+HANDLE;
  const logo='<svg viewBox="0 0 24 24"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  root.innerHTML='<div class="xapp"><div class="xh">'+logo+'<div><b>Mimu On Ape</b><span>@'+HANDLE+'</span></div></div><div class="xbody" id="xbody"><div class="xload">Loading the timeline&hellip;</div></div></div>';
  const body=root.querySelector('#xbody');let dead=false,timer=null;
  const fallback=()=>{
    if(dead||!body)return;
    body.innerHTML='<div class="xcard"><div class="xav"><img src="assets/mimu-icon.jpg" alt=""></div><h3>Mimu On Ape</h3><p>@'+HANDLE+' on X. The live timeline could not load inside the phone right now (an ad blocker or privacy setting can block it).</p><a href="'+URL_+'" target="_blank" rel="noopener noreferrer">Open @'+HANDLE+' on X</a></div>';
  };
  const loadScript=()=>new Promise(res=>{
    if(window.twttr&&window.twttr.widgets)return res(true);
    if(window._twP)return window._twP.then(res);
    window._twP=new Promise(r2=>{const s=document.createElement('script');s.src='https://platform.twitter.com/widgets.js';s.async=true;s.charset='utf-8';s.onload=()=>r2(!!(window.twttr&&window.twttr.widgets));s.onerror=()=>{window._twP=null;r2(false)};document.head.appendChild(s);setTimeout(()=>r2(false),8000)});
    window._twP.then(res);
  });
  timer=setTimeout(fallback,12000);
  loadScript().then(ok=>{
    if(dead)return;
    if(!ok)return fallback();
    const holder=document.createElement('div');holder.style.cssText='min-height:300px';
    window.twttr.widgets.createTimeline({sourceType:'profile',screenName:HANDLE},holder,{theme:'dark',chrome:'noheader nofooter transparent noborders',dnt:true,width:Math.max(280,body.clientWidth||340),height:Math.max(400,(body.clientHeight||560)-8)})
      .then(el=>{if(dead)return;clearTimeout(timer);if(!el)return fallback();body.innerHTML='';body.appendChild(holder)},fallback);
  });
  return{destroy(){dead=true;clearTimeout(timer)}};
}
function buildTop5(root){`);

// words
rep("Mimu Mail</b><span>Your inbox.", "X</b><span>The Mimu On Ape profile on X, shown right inside the phone (using X&rsquo;s own embedded timeline).</span></div>\n        <div><b>Mimu Mail</b><span>Your inbox.");
rep("and if you dial a wrong number in the phone app a short recording plays through YouTube&rsquo;s embedded player.", "if you dial a wrong number in the phone app a short recording plays through YouTube&rsquo;s embedded player, and the X app in the phone shows the Mimu On Ape profile through X&rsquo;s embedded timeline.");
fs.writeFileSync(p, t);
console.log('ok');
