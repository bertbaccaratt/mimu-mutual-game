// The wrong-number clip plays with the video hidden; the keypad stays on screen the whole time.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const a = t.indexOf('  const wrongNumber=()=>{');
const b = t.indexOf('  cl.onclick=()=>{', a);
if (a < 0 || b < 0) throw new Error('anchors');
const fn = `  const wrongNumber=()=>{
    ds.innerHTML='<span style="color:#ff9d8a">We&rsquo;re sorry, but the number you dialed is not the right number. Keep trying.</span>';
    const box=document.createElement('div');box.className='ythide';box.setAttribute('aria-hidden','true');box.innerHTML='<div id="ytp"></div>';root.appendChild(box);
    let done=false,player=null,fell=false,watchdog=null;
    const hang=()=>{if(done)return;done=true;clearTimeout(watchdog);hangNow=null;try{if(player&&player.destroy)player.destroy()}catch(e){}box.remove();num='';dn.textContent='';resetCall();tone(480,0,.14,.04);tone(380,.17,.2,.04)};
    hangNow=hang;
    const fallback=()=>{if(done||fell)return;fell=true;try{if(player&&player.destroy)player.destroy()}catch(e){}tone(950,0,.3,.05);tone(1400,.34,.3,.05);tone(1800,.68,.3,.05);setTimeout(hang,6500)};
    watchdog=setTimeout(fallback,9000);
    loadYT().then(ok=>{
      if(done||fell)return;
      if(!ok||!window.YT||!window.YT.Player)return fallback();
      player=new window.YT.Player('ytp',{videoId:'UqHUEGWNzQQ',width:'200',height:'200',playerVars:{autoplay:1,controls:0,rel:0,playsinline:1,modestbranding:1,fs:0,disablekb:1,iv_load_policy:3},
        events:{onReady:ev=>{try{ev.target.unMute();ev.target.setVolume(100);ev.target.playVideo()}catch(x){}},
          onStateChange:ev=>{if(ev.data===1)clearTimeout(watchdog);if(ev.data===0)hang()},onError:()=>fallback()}});
    });
  };
`;
t = t.slice(0, a) + fn + t.slice(b);
// no more on-screen call overlay; the video lives off-screen and the call button pulses while the recording plays
t = t.replace(/\.callov\{[^\n]*\r?\n(?:\.callov [^\n]*\r?\n)+/, '');
if (/\.callov/.test(t)) throw new Error('callov css left');
t = t.replace('.callb.end{background:#e0443c}', '.callb.end{background:#e0443c;animation:callpulse 1.3s ease-out infinite}\n@keyframes callpulse{0%{box-shadow:0 0 0 0 rgba(224,68,60,.55)}100%{box-shadow:0 0 0 22px rgba(224,68,60,0)}}\n.ythide{position:fixed;left:-400px;bottom:0;width:200px;height:200px;opacity:0;pointer-events:none;overflow:hidden}');
if (!t.includes('.ythide')) throw new Error('ythide css');
fs.writeFileSync(p, t);
console.log('ok');
