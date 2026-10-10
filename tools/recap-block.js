/* =====================================================================
   SHARE CARD + FINAL RECAP
   A picture of your level and stats (Badges app) and the end-of-campaign recap app (opens when the campaign closes).
   ===================================================================== */
const SHARE_SITE='https://mutualmimu.fun';
const BADGE_LEVELS=[[0,'Rookie'],[100,'Hall Runner'],[300,'Chair Hopper'],[600,'Bell Ringer'],[1000,'Halls Veteran'],[1600,'Mimu Elite'],[2400,'Legend of the Halls'],[3500,'Chairman’s Pick']];
function badgeSummary(){
  const list=achList(),done=list.filter(a=>a.val()>=a.goal),pts=done.reduce((n,a)=>n+10*(a.tier+1),0);
  let li=0;BADGE_LEVELS.forEach((l,i)=>{if(pts>=l[0])li=i});
  const med=[0,0,0,0,0,0];done.forEach(a=>{med[a.med]++});
  return{done:done.length,total:list.length,pts,level:BADGE_LEVELS[li][1],med};
}
let _shareLogo=null;
const shareLogo=()=>_shareLogo||(_shareLogo=new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src='assets/logo-wordmark.webp'}));
/* draws the 1080x1350 card on a canvas; the canvas carries the matching post text in ._text */
async function shareCardCanvas(kind,extra){
  extra=extra||{};
  const logo=await shareLogo();
  const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const c=cv.getContext('2d'),s=badgeSummary(),recap=kind==='recap';
  const RB=['#ff5fa2','#ffb347','#f0c64a','#5be08a','#38c8ff','#9b7bff'];
  const MONO='"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace',SERIF='Georgia,"Times New Roman",serif';
  const rr=(x,y,w,h,r)=>{c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()};
  const T=(t,x,y,font,col,al)=>{c.font=font;c.fillStyle=col;c.textAlign=al||'left';c.textBaseline='alphabetic';c.fillText(t,x,y)};
  const rainbow=(x0,x1)=>{const g=c.createLinearGradient(x0,0,x1,0);RB.forEach((col,i)=>g.addColorStop(i/5,col));return g};
  const best=Math.max(P.top||0,P.best||0),rank=recap?(extra.rank||0):myRank('run');
  /* background, confetti and the rainbow edges */
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#33143a');bg.addColorStop(.55,'#161027');bg.addColorStop(1,'#0c2a3a');c.fillStyle=bg;c.fillRect(0,0,W,H);
  let seed=11;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
  for(let i=0;i<80;i++){const x=rnd()*W,y=rnd()*H,w=8+rnd()*14,h=4+rnd()*8;c.save();c.translate(x,y);c.rotate(rnd()*Math.PI);c.globalAlpha=.16+rnd()*.22;c.fillStyle=RB[i%6];c.fillRect(-w/2,-h/2,w,h);c.restore()}
  c.globalAlpha=1;c.fillStyle=rainbow(0,W);c.fillRect(0,0,W,16);c.fillRect(0,H-16,W,16);
  /* wordmark and title */
  if(logo&&logo.naturalWidth){const k=Math.min(440/logo.naturalWidth,130/logo.naturalHeight),w=logo.naturalWidth*k,h=logo.naturalHeight*k;c.drawImage(logo,(W-w)/2,40+(130-h)/2,w,h)}
  else T('MUTUAL MIMU',W/2,120,'700 70px '+SERIF,'#f2e7d0','center');
  T(recap?'CAMPAIGN RECAP':'MY BADGES',W/2,214,'500 30px '+MONO,'#f0c64a','center');
  /* the player's Mimu */
  const AV=260,ax=(W-AV)/2,ay=240;
  try{
    const m=P.mimu,tmp=document.createElement('canvas');tmp.width=tmp.height=m.hero?160:32;mimuFront(tmp,m);
    c.save();rr(ax,ay,AV,AV,44);c.clip();c.imageSmoothingEnabled=!!m.hero;c.drawImage(tmp,ax,ay,AV,AV);c.restore();
  }catch(e){c.fillStyle='#000';rr(ax,ay,AV,AV,44);c.fill()}
  rr(ax,ay,AV,AV,44);c.lineWidth=8;c.strokeStyle=rainbow(ax,ax+AV);c.stroke();
  /* name and level */
  const name=P.handle||'Mimu';let fs=64;c.font='700 '+fs+'px '+SERIF;while(c.measureText(name).width>900&&fs>30){fs-=2;c.font='700 '+fs+'px '+SERIF}
  T(name,W/2,ay+AV+80,'700 '+fs+'px '+SERIF,'#ffffff','center');
  c.font='600 36px '+MONO;const lw=c.measureText(s.level).width+80,lx=(W-lw)/2,ly=ay+AV+108;
  rr(lx,ly,lw,62,31);c.fillStyle=rainbow(lx,lx+lw);c.fill();T(s.level,W/2,ly+43,'600 36px '+MONO,'#1a0e14','center');
  /* badges count and bar */
  const by=ay+AV+262;
  c.font='700 120px '+MONO;const w1=c.measureText(String(s.done)).width;c.font='500 44px '+MONO;const t2=' / '+s.total+' badges',w2=c.measureText(t2).width,x0=(W-w1-w2)/2;
  T(String(s.done),x0,by,'700 120px '+MONO,'#f0c64a','left');T(t2,x0+w1,by,'500 44px '+MONO,'#c9b99d','left');
  rr(190,by+30,700,24,12);c.fillStyle='rgba(255,255,255,.12)';c.fill();
  if(s.total&&s.done){rr(190,by+30,Math.max(24,700*s.done/s.total),24,12);c.fillStyle=rainbow(190,890);c.fill()}
  /* four stats */
  const card=(x,y,col,icon,val,lab)=>{
    const g=c.createLinearGradient(x,y,x+460,y+150);g.addColorStop(0,col+'55');g.addColorStop(1,'rgba(0,0,0,.4)');
    rr(x,y,460,150,28);c.fillStyle=g;c.fill();c.lineWidth=3;c.strokeStyle=col;c.stroke();
    T(icon,x+30,y+92,'64px sans-serif','#ffffff','left');
    let f=46;c.font='700 '+f+'px '+MONO;while(c.measureText(val).width>310&&f>24){f-=2;c.font='700 '+f+'px '+MONO}
    T(val,x+118,y+78,'700 '+f+'px '+MONO,'#ffffff','left');T(lab.toUpperCase(),x+118,y+118,'500 22px '+MONO,col,'left');
  };
  const cy=by+96;
  card(60,cy,'#f0c64a','🏆',fmt(best),'Best run');
  card(560,cy,'#5aa0ff','🏃',fmt(P.runs||0),'Runs');
  card(60,cy+170,'#f0b84a','🪙',fmt(P.totalCoins||0),'$TMF found');
  card(560,cy+170,'#ff7bd5','📈',rank?'#'+rank:'—',recap?'Final rank':'Weekly rank');
  /* medals */
  const my=cy+170+150+68;
  MEDALS.forEach((m,i)=>{
    const x=150+i*156;
    c.beginPath();c.arc(x,my,28,0,Math.PI*2);c.fillStyle=s.med[i]?m[1]:'rgba(255,255,255,.1)';c.fill();c.lineWidth=3;c.strokeStyle=m[2];c.stroke();
    T(String(s.med[i]),x,my+10,'700 28px '+MONO,s.med[i]?'#1a0e14':'#8c8393','center');
    T(m[0].toUpperCase(),x,my+58,'500 15px '+MONO,'#c9b99d','center');
  });
  T('mutualmimu.fun   ·   @mimuonape',W/2,H-34,'500 24px '+MONO,'#c9b99d','center');
  cv._text=recap
    ?'My Chair Run × Mutual Mimu recap: '+(rank?'final rank #'+rank+', ':'')+'best run '+fmt(best)+', '+fmt(P.totalCoins||0)+' $TMF found, '+s.done+' badges 🎉 @mimuonape'
    :'I’m a '+s.level+' in Chair Run × Mutual Mimu 🏅 '+s.done+'/'+s.total+' badges, best run '+fmt(best)+' @mimuonape';
  return cv;
}
/* share: the phone's share sheet with the picture when it can, otherwise a ready-made X post. save: downloads the PNG. */
async function shareCardAct(cv,how){
  const blob=await new Promise(r=>{try{cv.toBlob(r,'image/png')}catch(e){r(null)}});
  const text=cv._text||'Chair Run × Mutual Mimu';
  if(how==='save'){
    if(!blob){toast('Could not make the picture on this device.');return}
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='mimu-card.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
    toast('🖼 <span>Saved your card. Add it to a post!</span>',2600);return;
  }
  try{
    const file=blob?new File([blob],'mimu-card.png',{type:'image/png'}):null;
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text:text+' '+SHARE_SITE});return}
  }catch(e){if(e&&e.name==='AbortError')return}
  window.open('https://x.com/intent/post?text='+encodeURIComponent(text)+'&url='+encodeURIComponent(SHARE_SITE),'_blank','noopener');
  toast('🖼 <span>Tip: tap <b>Save image</b> and add it to your post.</span>',3600);
}

/* The Final Recap app. Opens when the campaign closes. Everything here is read from the player's own phone plus the public final board. */
function buildRecap(root){
  const KEYC='mimu_recap_cache',FREEZE=Date.UTC(2026,9,16,20,0,0);   /* the weekly boards reset Fri Oct 16, 20:00 UTC: after that the saved copy of the final board is shown */
  let T=null,done=false,cardCv=null;
  const mine=()=>P.glyph&&P.glyph.address?P.glyph.address.toLowerCase():null;
  const cacheGet=()=>{try{return JSON.parse(localStorage.getItem(KEYC)||'null')}catch(e){return null}};
  const cachePut=d=>{try{localStorage.setItem(KEYC,JSON.stringify(d))}catch(e){}};
  const stat=(c,i,v,l)=>`<div class="astat" style="--cc:${c}"><span>${i}</span><b>${v}</b><small>${l}</small></div>`;
  const draw=()=>keepScroll(root,drawBody);
  const drawBody=()=>{
    const rows=T&&T.rows?T.rows:[],me=mine(),mineRow=me?rows.find(r=>String(r.id).toLowerCase()===me):null;
    const s=badgeSummary(),st=ST(),best=Math.max(P.top||0,P.best||0),hops=(P.cleared||[]).reduce((a,b)=>a+b,0);
    const sum=k=>rows.reduce((a,r)=>a+(+r[k]||0),0),maxRun=rows.reduce((a,r)=>Math.max(a,+r.run||0),0);
    const RB=['#ff5fa2','#ffb347','#f0c64a','#5be08a','#38c8ff','#9b7bff'];
    const conf=Array.from({length:22},(_,i)=>`<i style="--x:${(i*47)%100}%;--d:${((i*37)%50)/10}s;--c:${RB[i%6]}"></i>`).join('');
    const POD=[['🥇','#f0c64a'],['🥈','#cfd6e2'],['🥉','#e39a5b'],['4','#7fb4ff'],['5','#c59bff']];
    const pod=rows.slice(0,5).map((r,i)=>`<div class="rcp" style="--cc:${POD[i][1]}"><span class="rcm">${POD[i][0]}</span><div class="rca">${avOf({pic:r.picture,id:r.id})}</div><div class="rcn"><b>${escH(r.name||'Player')}</b><small>${fmt(r.run||0)} run · ${fmt(r.tmf||0)} $TMF</small></div><em>${fmt(r.total||0)}</em></div>`).join('');
    const board=!done?'<div class="sub2" style="padding:6px 2px">Counting the final scores…</div>'
      :rows.length?pod:'<div class="sub2" style="padding:6px 2px">The final board is not available on this phone any more. Your own numbers are below.</div>';
    const crowd=rows.length?`<div class="astats" style="margin-top:12px">${
      stat('#38c8ff','👥',fmt(rows.length)+(rows.length>=300?'+':''),'players on the board')+
      stat('#f0c64a','⭐',fmt(sum('total')),'points scored together')+
      stat('#f0b84a','🪙',fmt(sum('tmf')),'$TMF found together')+
      stat('#ff7bd5','🚀',fmt(maxRun),'best single run')}</div>`:'';
    root.innerHTML=`<div class="sc"><div class="ah"><div><h1>Final Recap</h1><div class="sub">Chair Run × Mutual Mimu</div></div></div><div class="scroll" style="padding-bottom:30px">
     <div class="rchero"><div class="rcconf" aria-hidden="true">${conf}</div><div class="rcbig">That’s a wrap!</div><div class="rcsub">The campaign is closed. Thank you for running the halls with us.</div>
      <div class="rcme"><div class="rcav">${meAv()}</div><div><b>${escH(P.handle||'Mimu')}</b><span>${mineRow?'Final rank #'+mineRow.rank+' of '+fmt(rows.length)+(mineRow.rank<=5?' · top 5!':''):'Here are your final numbers'}</span></div></div></div>
     <div class="lbl rcl" style="color:#ffb347">The final top 5</div>${board}${crowd}
     <div class="lbl rcl" style="color:#5be08a">Your campaign in numbers</div>
     <div class="astats">${
       stat('#f0c64a','🏆',fmt(best),'best run')+stat('#5aa0ff','🏃',fmt(P.runs||0),'runs')+
       stat('#f0b84a','🪙',fmt(P.totalCoins||0),'$TMF found')+stat('#38c8ff','🛣',fmt(P.dist||0)+' m','distance')+
       stat('#38c8ff','⏱',st.longest?durShort(st.longest):'0m','longest run')+stat('#5be08a','🪑',fmt(hops),'chairs hopped')+
       stat('#ff9a4a','🔥',fmt(st.chain||0),'best chain')+stat('#ff7bd5','🌈',fmt(st.mils||0),'million marks')+
       stat('#9b7bff','🗳',fmt(st.gates||0),'gate votes')+stat('#b99bff','🔔',fmt(((P.ff&&P.ff.hist)||[]).length),'bell rounds')+
       stat('#ffd166','🤝',fmt(P.patron||0),'$TMF given')+stat('#7be0d0','🐾',fmt(st.petWakes||0),'Mimugotchi wake-ups')}</div>
     <div class="lbl rcl" style="color:#ff6fb5">Your badges</div>
     <div class="card rcbadge"><div class="row" style="gap:12px"><div style="font-size:34px">🏅</div><div style="flex:1"><div class="alvl" style="font-size:22px">${escH(s.level)}</div><div class="sub2" style="font-size:12px">${fmt(s.done)} of ${fmt(s.total)} badges · ${fmt((P.passes||[]).length)} season badge${(P.passes||[]).length===1?'':'s'}</div></div></div>
      <div class="bar" style="margin-top:10px"><i style="width:${s.total?Math.min(100,s.done/s.total*100):0}%;background:linear-gradient(90deg,#ff7bd5,#f0c64a,#5be08a,#5aa0ff)"></i></div></div>
     <div class="lbl rcl" style="color:#38c8ff">Share your recap</div>
     <div class="shc"><div class="shp" id="rcMount"></div><div class="shb"><div class="sub2" style="font-size:12px;margin:0 0 10px">A picture of your final numbers to post or save.</div><button class="btn gold sm" id="rcShare" type="button">Share on X</button><button class="btn ghost sm" id="rcSave" type="button" style="margin-top:6px">Save image</button></div></div>
     <div class="sub2" style="text-align:center;font-size:12px;margin:16px 6px 4px">Thank you for playing. See you in the halls. 🐒</div></div></div>`;
    const mount=$('#rcMount',root);if(mount&&cardCv){mount.innerHTML='';mount.appendChild(cardCv)}
    const card=async()=>cardCv||(cardCv=await shareCardCanvas('recap',{rank:mineRow?mineRow.rank:0}));
    $('#rcShare',root).onclick=async()=>{sfx.tap();shareCardAct(await card(),'share')};
    $('#rcSave',root).onclick=async()=>{sfx.tap();shareCardAct(await card(),'save')};
  };
  const makeCard=()=>{
    const me=mine(),r=T&&T.rows?T.rows.find(x=>me&&String(x.id).toLowerCase()===me):null;
    shareCardCanvas('recap',{rank:r?r.rank:0}).then(cv=>{cardCv=cv;const m=$('#rcMount',root);if(m){m.innerHTML='';m.appendChild(cv)}}).catch(()=>{});
  };
  const load=async()=>{
    const cached=cacheGet();
    if(Date.now()>=FREEZE&&cached&&cached.rows){T=cached}
    else{
      try{
        const d=await API.j('/api/top9');
        T={week:d.week,rows:(d.rows||[]).slice(0,300).map(r=>({rank:r.rank,id:r.id,name:r.name,picture:r.picture,total:r.total,run:r.run,tmf:r.tmf}))};
        if(Date.now()<FREEZE&&T.rows.length)cachePut(T);
      }catch(e){if(cached&&cached.rows)T=cached}
    }
    done=true;if(document.body.contains(root)){draw();makeCard()}
  };
  try{sfx.win()}catch(e){}
  draw();load();
  return{destroy(){}};
}

