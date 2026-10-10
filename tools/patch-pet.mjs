// The Mimu keychain pet on the desk: off by default; one click switches it on for 60 minutes, then it goes back to off.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

rep(`  <div class="prop p-gadget"><img src="assets/mimu-gadget.webp?v=1" alt="" width="400" height="417"></div>`,
    `  <div class="prop p-gadget" id="pet"><img class="pet-off" src="assets/mimu-gadget.webp?v=2" alt="" width="400" height="418"><img class="pet-on" src="assets/mimu-gadget-on.webp?v=2" alt="" width="400" height="418"><div class="pet-hit" role="button" tabindex="0" aria-pressed="false" aria-label="Mimu pet keychain. It is switched off. Press to turn it on for 60 minutes."></div></div>`);

rep(`.p-gadget{left:2.8%;top:45%;width:176px}
.p-gadget img{transform:rotate(-9deg);filter:drop-shadow(9px 13px 9px rgba(0,0,0,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.4))}`,
`.p-gadget{left:2.8%;top:45%;width:176px;transform:rotate(-9deg);transition:transform .25s var(--spring,ease)}
.p-gadget img{display:block;width:100%;height:auto;filter:drop-shadow(9px 13px 9px rgba(0,0,0,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.4));transition:opacity .35s ease}
.p-gadget .pet-on{position:absolute;left:0;top:0;opacity:0}
.p-gadget.on .pet-on{opacity:1}.p-gadget.on .pet-off{opacity:0}
.p-gadget .pet-hit{position:absolute;inset:4% 3% 2% 3%;border-radius:46%;pointer-events:auto;cursor:pointer;outline:none}
.p-gadget .pet-hit:focus-visible{box-shadow:0 0 0 3px #f0d28a}
.p-gadget.wig:not(.pop){animation:petWig .5s ease-in-out infinite}
.p-gadget.pop{animation:petPop .6s ease-out both}
@keyframes petWig{0%,100%{transform:rotate(-9deg)}35%{transform:rotate(-12deg) translateY(-3px)}70%{transform:rotate(-6deg)}}
@keyframes petPop{0%{transform:rotate(-9deg) scale(1)}25%{transform:rotate(-13deg) scale(1.1) translateY(-6px)}55%{transform:rotate(-7deg) scale(.98)}100%{transform:rotate(-9deg) scale(1)}}`);

rep(`/* keyboard + screen-reader access for the desk easter eggs */`, `/* the Mimu keychain pet: click once and it switches on for 60 minutes (it remembers across refreshes), then it switches itself off again */
(function(){
  const pet=$('#pet'),hit=pet&&pet.querySelector('.pet-hit');if(!pet||!hit)return;
  const KEY='mimu_pet_on',LIFE=60*60*1000;
  const read=()=>{try{const v=Number(localStorage.getItem(KEY));return v>0?v:0}catch(e){return 0}};
  const write=v=>{try{if(v)localStorage.setItem(KEY,String(v));else localStorage.removeItem(KEY)}catch(e){}};
  let wasOn=null;
  const paint=()=>{
    const t0=read(),on=t0>0&&Date.now()-t0<LIFE;
    if(!on&&t0)write(0);
    if(on!==wasOn){
      wasOn=on;pet.classList.toggle('on',on);
      hit.setAttribute('aria-pressed',on?'true':'false');
      hit.setAttribute('aria-label',on?'Mimu pet keychain. It is switched on. It switches itself off after 60 minutes.':'Mimu pet keychain. It is switched off. Press to turn it on for 60 minutes.');
    }
  };
  const press=()=>{
    if(!(read()>0&&Date.now()-read()<LIFE)){
      write(Date.now());paint();
      pet.classList.remove('pop');void pet.offsetWidth;pet.classList.add('pop');setTimeout(()=>pet.classList.remove('pop'),650);
      try{ac();tone(880,0,.07,.05,'square');tone(1320,.09,.1,.05,'square')}catch(e){}
    }
  };
  hit.addEventListener('click',press);
  hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();press()}});
  hit.addEventListener('mouseenter',()=>pet.classList.add('wig'));hit.addEventListener('mouseleave',()=>pet.classList.remove('wig'));
  paint();setInterval(paint,15000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint()});
})();

/* keyboard + screen-reader access for the desk easter eggs */`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
