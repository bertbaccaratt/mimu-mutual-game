// Mimugotchi: achievements + season points for waking it, texts from "Mimugotchi" in Messages, and a hover bubble with live countdowns.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

/* ---- badge app: stats, category and achievements ---- */
rep(`night:0,quests:0,bestStreak:0,ffStaked:0,ffLev3:0,ffBlocs:0,ffMaxStake:0,ach:{},achInit:0});`,
    `night:0,quests:0,bestStreak:0,ffStaked:0,ffLev3:0,ffBlocs:0,ffMaxStake:0,petOn:0,petWakes:0,petQuick:0,petHours:0,petPerfect:0,ach:{},achInit:0});`);
rep(`{id:'fun',n:'Fun',c:'#a0f0ff',i:'✨'}];`, `{id:'fun',n:'Fun',c:'#a0f0ff',i:'✨'},{id:'pet',n:'Mimugotchi',c:'#7be0d0',i:'🐾'}];`);
rep(`  L('fun','🦉','night',`, `  L('pet','🔋','on',[1,10,50],['Batteries In','Daily Care','Devoted Owner'],()=>ST().petOn,g=>'Switch your Mimugotchi on '+fmt(g)+' time'+(g>1?'s':''));
  L('pet','⏰','wake',[1,12,60,250],['First Wake','Light Sleeper','Night Nurse','Sleep Whisperer'],()=>ST().petWakes,g=>'Wake your sleeping Mimugotchi '+fmt(g)+' time'+(g>1?'s':''));
  L('pet','⚡','quick',[1,10,50],['Quick Hands','Alarm Clock','Lightning Reflexes'],()=>ST().petQuick,g=>'Wake your Mimugotchi within 30 seconds of it falling asleep, '+fmt(g)+' time'+(g>1?'s':''));
  L('pet','⌛','hours',[1,5,24],['Full Hour','Marathon Pet-Sitter','All-Day Mimugotchi'],()=>ST().petHours,g=>'Keep your Mimugotchi going for a full 60 minutes (wake it at least 6 times), '+fmt(g)+' time'+(g>1?'s':''));
  L('pet','🌟','perfect',[1,3,10],['Perfect Hour','Hat Trick','Gold-Star Sitter'],()=>ST().petPerfect,g=>'Finish a full hour waking it within a minute every time (at least 10 wake-ups), '+fmt(g)+' time'+(g>1?'s':''));
  L('fun','🦉','night',`);

/* ---- messages: let the app pick up the Mimugotchi thread ---- */
rep(`function buildMsgs(root){`, `function buildMsgs(root){
  try{if(window._petSync)window._petSync()}catch(e){}`);

/* ---- CSS: the hover bubble ---- */
rep(`.p-gadget.wig:not(.pop){`, `.p-gadget .pet-tip{position:absolute;left:50%;top:-4%;transform:translate(-50%,-100%) rotate(9deg);z-index:6;width:max-content;max-width:190px;padding:5px 9px;border-radius:12px;background:rgba(18,10,12,.9);border:1px solid var(--gold,#d9b25f);color:#f2e7d0;font:600 10.5px/1.35 'IBM Plex Mono',monospace;text-align:center;pointer-events:none;opacity:0;transition:opacity .18s;box-shadow:0 6px 16px rgba(0,0,0,.45)}
.p-gadget .pet-tip b{color:#ffe28a;font-weight:700}
.p-gadget.tip .pet-tip{opacity:1}
.p-gadget.wig:not(.pop){`);

/* ---- the Mimugotchi itself ---- */
const a = t.indexOf('/* the Mimu keychain pet. Click it and it wakes up.');
const b = t.indexOf('/* keyboard + screen-reader access for the desk easter eggs */');
if (a < 0 || b < a) throw new Error('pet block anchors');
const block = `/* the Mimugotchi (the keychain pet on the post-its). Click it and it wakes up. Five minutes after it woke it falls asleep and waits for a click, and so on.
   After 60 minutes in total (counted from the first click) it switches itself off again. It remembers across refreshes.
   Waking it earns a few season points, texts arrive from "Mimugotchi" in Messages, and badges track how well you look after it. */
(function(){
  const pet=$('#pet'),hit=pet&&pet.querySelector('.pet-hit');if(!pet||!hit)return;
  const KEY='mimu_pet2',LIFE=60*60*1000,NAP=5*60*1000,SP_EACH=5,SP_CAP=12,MIN_WAKES=6,PERFECT_WAKES=10;
  const tip=document.createElement('div');tip.className='pet-tip';tip.id='petTip';tip.setAttribute('aria-hidden','true');pet.appendChild(tip);
  const read=()=>{try{const o=JSON.parse(localStorage.getItem(KEY)||'null');return o&&o.start>0?o:null}catch(e){return null}};
  const write=o=>{try{if(o)localStorage.setItem(KEY,JSON.stringify(o));else localStorage.removeItem(KEY)}catch(e){}};
  const ready=()=>typeof P!=='undefined'&&P&&typeof ST==='function';
  /* ---- texts from Mimugotchi ---- */
  const addText=(ts,body)=>{
    if(!ready())return;
    P.petMsgs=P.petMsgs||[];P.petMsgs.push({ts,body});if(P.petMsgs.length>30)P.petMsgs=P.petMsgs.slice(-30);
    P.mr=P.mr||{};delete P.mr.mgotchi;saveP();sync();try{refreshDockBadge()}catch(e){}
    try{toast('🐾 <span><b>Mimugotchi</b> · '+escH(body.split('. ')[0])+'</span>',3200)}catch(e){}
  };
  const sync=()=>{
    if(!ready()||!P.petMsgs||!P.petMsgs.length)return;
    const m=P.petMsgs,last=m[m.length-1];
    let x=MSGS.find(y=>y.id==='mgotchi');
    if(!x){x={id:'mgotchi',n:'Mimugotchi',img:'assets/mimu-gadget-on.webp',bg:'#000',g:1,t:'now',m:[]};MSGS.unshift(x)}
    x.m=m.slice(-8).map(e=>e.body);x.t=tmAgo(last.ts);
  };
  window._petSync=sync;
  /* ---- season points and stats ---- */
  const award=o=>{
    if(!ready())return;
    const s=ST();
    if((o.sp||0)<SP_CAP){
      o.sp=(o.sp||0)+1;
      const passes=addPP(SP_EACH);saveP();
      try{toast('🐾 <span><b>Mimugotchi</b> · +'+SP_EACH+' season points</span>',2000)}catch(e){}
      if(passes.length&&typeof passCeremony==='function')setTimeout(()=>passCeremony(passes[passes.length-1]),700);
    }
    return s;
  };
  const finish=o=>{                                                 /* the 60 minutes are up */
    if(!ready())return;
    const s=ST();
    if((o.w||0)>=MIN_WAKES){s.petHours++;if((o.w||0)>=PERFECT_WAKES&&!o.late)s.petPerfect++}
    saveP();try{achCheck()}catch(e){}
    addText(o.start+LIFE,'🔋 My batteries are done for the hour. You woke me '+(o.w||0)+' time'+((o.w||0)===1?'':'s')+'. Press me on the desk to start a new hour.');
  };
  const stateOf=()=>{
    const o=read();if(!o)return'off';
    const n=Date.now();
    if(n-o.start>=LIFE){write(null);finish(o);return'off'}         /* 60 minutes are up: back to the base photo */
    return(o.wake>0&&n-o.wake<NAP)?'awake':'asleep';               /* awake for 5 minutes after each wake up, then asleep until clicked */
  };
  let shown=null;
  const label=s=>s==='off'?'Mimugotchi. It is switched off. Press to turn it on.':s==='awake'?'Mimugotchi. It is awake and will fall asleep in a few minutes.':'Mimugotchi. It is asleep. Press to wake it up.';
  const mmss=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const tipText=()=>{
    const s=stateOf(),o=read(),n=Date.now();
    if(s==='off'||!o)return'<b>Mimugotchi</b><br>switched off. Tap to power it on for 60 minutes.';
    const left=mmss(o.start+LIFE-n);
    if(s==='awake')return'<b>Mimugotchi</b> is awake<br>sleeps in '+mmss(o.wake+NAP-n)+' · hour ends in '+left;
    const asleepFor=Math.max(0,Math.floor((n-(o.wake+NAP))/1000));
    return'<b>Mimugotchi</b> is asleep (zzz)<br>tap to wake it'+(asleepFor<30?' fast for a bonus':'')+' · hour ends in '+left;
  };
  const paint=()=>{
    const s=stateOf();
    if(s!==shown){
      shown=s;
      pet.classList.toggle('on',s==='awake');pet.classList.toggle('zz',s==='asleep');
      hit.setAttribute('aria-pressed',s==='off'?'false':'true');hit.setAttribute('aria-label',label(s));
    }
    if(s==='asleep'&&ready()){                                     /* one text per sleep, sent at the moment it fell asleep */
      const o=read();
      if(o&&o.txt!==o.wake){o.txt=o.wake;write(o);addText(o.wake+NAP,'💤 zzz… I fell asleep. Press me on the desk to wake me up!')}
    }
    if(pet.classList.contains('tip'))tip.innerHTML=tipText();
  };
  const bounce=()=>{pet.classList.remove('pop');void pet.offsetWidth;pet.classList.add('pop');setTimeout(()=>pet.classList.remove('pop'),650)};
  const press=()=>{
    const s=stateOf(),n=Date.now();
    if(s==='off'){
      const o={start:n,wake:n,w:0,q:0,late:false,sp:0};write(o);paint();bounce();
      if(ready()){ST().petOn++;award(o);write(o);try{achCheck()}catch(e){}}
      try{ac();tone(880,0,.07,.05,'square');tone(1320,.09,.1,.05,'square')}catch(e){}
    }else if(s==='asleep'){
      const o=read();if(!o)return;
      const delay=n-(o.wake+NAP);                                   /* how long it was left asleep */
      o.w=(o.w||0)+1;if(delay<=30000)o.q=(o.q||0)+1;if(delay>60000)o.late=true;
      o.wake=n;
      if(ready()){const s2=ST();s2.petWakes++;if(delay<=30000)s2.petQuick++;award(o)}
      write(o);paint();bounce();
      if(ready())try{achCheck()}catch(e){}
      try{ac();tone(660,0,.06,.05,'square');tone(990,.08,.09,.05,'square')}catch(e){}
    }
  };
  hit.addEventListener('click',press);
  hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();press()}});
  const showTip=()=>{pet.classList.add('tip');tip.innerHTML=tipText()};
  const hideTip=()=>pet.classList.remove('tip');
  hit.addEventListener('mouseenter',()=>{pet.classList.add('wig');showTip()});hit.addEventListener('mouseleave',()=>{pet.classList.remove('wig');hideTip()});
  hit.addEventListener('focus',showTip);hit.addEventListener('blur',hideTip);
  try{localStorage.removeItem('mimu_pet_on')}catch(e){}
  paint();setInterval(paint,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)paint()});
  setTimeout(sync,1200);
})();

`;
t = t.slice(0, a) + block + t.slice(b);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
