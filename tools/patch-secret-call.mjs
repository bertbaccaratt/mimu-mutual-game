// Phone app: dialing the secret number 1-800-239-0413 rings twice, then Hornilius picks up on a FaceTime-style video call
// (sound on); the call hangs up when the video ends. Every other number does what it did before (the wrong-number recording).
import fs from 'node:fs';
const p = new URL('../index.html', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const once = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); t = t.replace(a, () => b); };

/* ---- style ---- */
once('.ythide{position:fixed;left:-400px;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;overflow:hidden}',
  '.ythide{position:fixed;left:-400px;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;overflow:hidden}\n' +
  '.ftc{position:absolute;inset:0;background:#000;z-index:40;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .35s}.ftc.on{opacity:1;pointer-events:auto}\n' +
  '.ftc video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}\n' +
  '.ftt{position:relative;z-index:2;padding:48px 20px 44px;background:linear-gradient(180deg,rgba(0,0,0,.65),transparent);text-align:center;color:#fff}.ftt b{display:block;font:600 22px var(--sans);letter-spacing:.2px}.ftt span{display:block;margin-top:3px;font:400 13px var(--sans);opacity:.85}\n' +
  '.ftb{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:30px 0 42px;display:flex;justify-content:center;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent)}\n' +
  '.fte{width:68px;height:68px;border-radius:50%;background:#ff3b30;display:grid;place-items:center}.fte svg{width:30px;height:30px;transform:rotate(135deg)}\n' +
  '.fta{position:absolute;z-index:3;left:50%;top:50%;transform:translate(-50%,-50%);padding:16px 30px;border-radius:30px;background:#2fbd55;color:#fff;font:600 17px var(--sans)}');

/* ---- behaviour ---- */
const callOld =
  "  cl.onclick=()=>{\n" +
  "    if(calling){clearTimeout(tm);if(hangNow)hangNow();else resetCall();return}\n" +
  "    if(!num){ds.textContent='Tap a number first';return}\n" +
  "    calling=true;cl.classList.add('end');ds.textContent='calling…';ac();tone(440,0,.4,.04);tone(480,0,.4,.04);tone(440,1.2,.4,.04);tone(480,1.2,.4,.04);\n" +
  "    loadYT();tm=setTimeout(wrongNumber,2800);\n" +
  "  };";
const hangPath = 'M9.600 5.500l3.400-.8c.7-.2 1.400.2 1.700.9l1.400 3.600c.2.600.1 1.200-.4 1.600l-2 1.600c1.200 2.700 3.200 4.700 5.900 5.900l1.600-2c.4-.5 1-.6 1.600-.4l3.600 1.400c.7.300 1.100 1 .9 1.700l-.8 3.400c-.2.800-.9 1.300-1.700 1.300C14.200 24.700 7.300 17.800 7.300 7.200c0-.8.5-1.500 1.300-1.700z';
const callNew =
  "  /* the secret line: 1-800-239-0413 rings twice, then Hornilius picks up on a FaceTime-style video call (sound on); the call hangs up when the video ends */\n" +
  "  const isSecret=()=>{const d=num.replace(/\\D/g,'');return d==='18002390413'||d==='8002390413'};\n" +
  "  const prepCall=()=>{\n" +
  "    const sc=root.querySelector('.sc')||root,box=document.createElement('div');box.className='ftc';\n" +
  "    box.innerHTML='<video playsinline webkit-playsinline preload=\"auto\" src=\"assets/hornilius-call.mp4?v=1\"></video><div class=\"ftt\"><b>Hornilius</b><span class=\"ftm\">FaceTime Video &middot; connecting&hellip;</span></div><div class=\"ftb\"><button class=\"fte\" aria-label=\"End call\"><svg viewBox=\"0 0 32 32\"><path d=\"" + hangPath + "\" fill=\"#fff\"/></svg></button></div><button class=\"fta\" hidden>Tap to answer</button>';\n" +
  "    sc.appendChild(box);\n" +
  "    const v=box.querySelector('video'),tmx=box.querySelector('.ftm'),ans=box.querySelector('.fta');\n" +
  "    let done=false,live=false,wd=null,tk=null;\n" +
  "    const hang=fail=>{if(done)return;done=true;clearTimeout(wd);clearInterval(tk);hangNow=null;try{v.pause();v.removeAttribute('src');v.load()}catch(e){}box.remove();\n" +
  "      if(fail){wrongNumber();return}\n" +
  "      num='';dn.textContent='';resetCall();tone(480,0,.14,.04);tone(380,.17,.2,.04)};\n" +
  "    hangNow=()=>hang(false);\n" +
  "    box.querySelector('.fte').onclick=()=>hang(false);\n" +
  "    const mmss=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');\n" +
  "    const tick=()=>{if(live)tmx.textContent='FaceTime Video · '+mmss(v.currentTime)};\n" +
  "    v.onended=()=>setTimeout(()=>hang(false),500);\n" +
  "    v.onerror=()=>hang(true);\n" +
  "    return{reveal(){\n" +
  "      box.classList.add('on');ds.innerHTML='&nbsp;';\n" +
  "      wd=setTimeout(()=>{if(!live)hang(true)},10000);                   /* never connected (offline or very slow): fall back to the wrong-number recording */\n" +
  "      const go=()=>{live=true;clearTimeout(wd);ans.hidden=true;tk=setInterval(tick,250);tick()};\n" +
  "      const pr=v.play();\n" +
  "      if(pr&&pr.then)pr.then(go).catch(()=>{clearTimeout(wd);ans.hidden=false;ans.onclick=()=>{v.play().then(go).catch(()=>hang(true))}});else go();\n" +
  "    }};\n" +
  "  };\n" +
  "  cl.onclick=()=>{\n" +
  "    if(calling){clearTimeout(tm);if(hangNow)hangNow();else resetCall();return}\n" +
  "    if(!num){ds.textContent='Tap a number first';return}\n" +
  "    calling=true;cl.classList.add('end');ds.textContent='calling…';ac();tone(440,0,.4,.04);tone(480,0,.4,.04);tone(440,1.2,.4,.04);tone(480,1.2,.4,.04);\n" +
  "    if(isSecret()){const c=prepCall();tm=setTimeout(()=>c.reveal(),2800);return}\n" +
  "    loadYT();tm=setTimeout(wrongNumber,2800);\n" +
  "  };";
once(callOld, callNew);
fs.writeFileSync(p, t);
console.log('secret call patched');
