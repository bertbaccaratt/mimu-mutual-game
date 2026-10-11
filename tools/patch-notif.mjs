// In-run notifications: shorter, smaller, at most 2 at a time; phone toasts never cover a run in progress (they wait for the end of the run).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { const n = t.split(a).length - 1; if (n !== 1) throw new Error(n + ' matches for ' + a.slice(0, 90)); t = t.replace(a, () => b); };

/* ---- in-run messages: smaller and shorter ---- */
rep(`#rmsg div{padding:6px 14px 7px;border-radius:16px;background:rgba(18,10,12,.66);`, `#rmsg div{padding:5px 12px 6px;border-radius:14px;background:rgba(18,10,12,.56);`);
rep(`animation:msg 3.6s var(--ease) forwards;`, `animation:msg 2.3s var(--ease) forwards;`);
rep(`width:max-content;max-width:300px;text-align:center;`, `width:max-content;max-width:250px;text-align:center;`);
rep(`function msg(t,cls='',sub=''){const d=document.createElement('div');d.className=cls;const b=document.createElement('b');b.textContent=t;d.appendChild(b);if(sub){const s=document.createElement('small');s.textContent=sub;d.appendChild(s)}d.style.top=(msgN++%3)*50+'px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),3700)}`,
    `function msg(t,cls='',sub=''){
    const life=/\\b(big|orb)\\b/.test(cls)?2900:2300;                     /* short, so a notice never sits on the view of the run */
    while(hud.msg.children.length>=2)hud.msg.firstChild.remove();       /* at most two at a time: the newest replaces the oldest */
    const d=document.createElement('div');d.className=cls;d.style.animationDuration=life+'ms';const b=document.createElement('b');b.textContent=t;d.appendChild(b);if(sub){const s=document.createElement('small');s.textContent=sub;d.appendChild(s)}
    d.style.top=(msgN++%2)*46+'px';hud.msg.appendChild(d);setTimeout(()=>d.remove(),life+80)}`);

/* ---- phone toasts wait while a run is in progress ---- */
rep(`let toastT;function toast(h,ms=2600){const t=$('#toast');t.innerHTML=h;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms)}`,
    `let toastT;const _tq=[];
function toast(h,ms=2600){
  let live=false;try{live=!!(window._runLive&&window._runLive())}catch(e){}
  if(live){if(_tq.length<8)_tq.push([h,ms]);return}                    /* a notification never covers a run in progress: it is shown right after the run ends */
  const t=$('#toast');t.innerHTML=h;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms)}
window._toastFlush=()=>{const q=_tq.splice(0);q.forEach((x,i)=>setTimeout(()=>toast(x[0],x[1]),i*2900))};`);
rep(`  const hud={sc:$('#rsc',root),`, `  window._runLive=()=>alive&&S.st!=='idle'&&S.st!=='over';\n  const hud={sc:$('#rsc',root),`);
rep(`if(S.st==='over')return;S.st='over';beatStop();discoStop();`, `if(S.st==='over')return;S.st='over';beatStop();discoStop();setTimeout(()=>{try{window._toastFlush&&window._toastFlush()}catch(e){}},1500);`);
rep(`return{destroy(){alive=false;beatStop();cancelAnimationFrame(raf);`, `return{destroy(){alive=false;window._runLive=null;setTimeout(()=>{try{window._toastFlush&&window._toastFlush()}catch(e){}},300);beatStop();cancelAnimationFrame(raf);`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
