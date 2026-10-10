// The Mimu keychain pet: off -> click -> awake -> (5 minutes) asleep -> click -> awake -> ... for 60 minutes total, then back to off.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

rep(`<img class="pet-off" src="assets/mimu-gadget.webp?v=2" alt="" width="400" height="418"><img class="pet-on" src="assets/mimu-gadget-on.webp?v=2" alt="" width="400" height="418">`,
    `<img class="pet-off" src="assets/mimu-gadget.webp?v=3" alt="" width="400" height="418"><img class="pet-on" src="assets/mimu-gadget-on.webp?v=3" alt="" width="400" height="418"><img class="pet-sleep" src="assets/mimu-gadget-sleep.webp?v=3" alt="" width="400" height="418">`);

rep(`.p-gadget .pet-on{position:absolute;left:0;top:0;opacity:0}
.p-gadget.on .pet-on{opacity:1}.p-gadget.on .pet-off{opacity:0}`,
`.p-gadget .pet-on,.p-gadget .pet-sleep{position:absolute;left:0;top:0;opacity:0}
.p-gadget.on .pet-on{opacity:1}.p-gadget.on .pet-off,.p-gadget.on .pet-sleep{opacity:0}
.p-gadget.zz .pet-sleep{opacity:1}.p-gadget.zz .pet-off,.p-gadget.zz .pet-on{opacity:0}`);

const a = t.indexOf('/* the Mimu keychain pet: click once');
const b = t.indexOf('/* keyboard + screen-reader access for the desk easter eggs */');
if (a < 0 || b < a) throw new Error('pet block anchors');
const block = `/* the Mimu keychain pet. Click it and it wakes up. Five minutes after it woke it falls asleep and waits for a click, and so on.
   After 60 minutes in total (counted from the first click) it switches itself off again. It remembers across refreshes. */
(function(){
  const pet=$('#pet'),hit=pet&&pet.querySelector('.pet-hit');if(!pet||!hit)return;
  const KEY='mimu_pet2',LIFE=60*60*1000,NAP=5*60*1000;
  const read=()=>{try{const o=JSON.parse(localStorage.getItem(KEY)||'null');return o&&o.start>0?o:null}catch(e){return null}};
  const write=o=>{try{if(o)localStorage.setItem(KEY,JSON.stringify(o));else localStorage.removeItem(KEY)}catch(e){}};
  const stateOf=()=>{
    const o=read();if(!o)return'off';
    const n=Date.now();
    if(n-o.start>=LIFE){write(null);return'off'}                 /* 60 minutes are up: back to the base photo */
    return(o.wake>0&&n-o.wake<NAP)?'awake':'asleep';             /* awake for 5 minutes after each wake up, then asleep until clicked */
  };
  let shown=null;
  const paint=()=>{
    const s=stateOf();if(s===shown)return;shown=s;
    pet.classList.toggle('on',s==='awake');pet.classList.toggle('zz',s==='asleep');
    hit.setAttribute('aria-pressed',s==='off'?'false':'true');
    hit.setAttribute('aria-label',s==='off'?'Mimu pet keychain. It is switched off. Press to turn it on.':s==='awake'?'Mimu pet keychain. It is awake and will fall asleep in a few minutes.':'Mimu pet keychain. It is asleep. Press to wake it up.');
  };
  const bounce=()=>{pet.classList.remove('pop');void pet.offsetWidth;pet.classList.add('pop');setTimeout(()=>pet.classList.remove('pop'),650)};
  const press=()=>{
    const s=stateOf(),n=Date.now();
    if(s==='off'){write({start:n,wake:n});paint();bounce();try{ac();tone(880,0,.07,.05,'square');tone(1320,.09,.1,.05,'square')}catch(e){}}
    else if(s==='asleep'){const o=read();write({start:o.start,wake:n});paint();bounce();try{ac();tone(660,0,.06,.05,'square');tone(990,.08,.09,.05,'square')}catch(e){}}
  };
  hit.addEventListener('click',press);
  hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();press()}});
  hit.addEventListener('mouseenter',()=>pet.classList.add('wig'));hit.addEventListener('mouseleave',()=>pet.classList.remove('wig'));
  try{localStorage.removeItem('mimu_pet_on')}catch(e){}
  paint();setInterval(paint,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint()});
})();

`;
t = t.slice(0, a) + block + t.slice(b);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
