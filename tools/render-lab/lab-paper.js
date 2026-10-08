'use strict';
/* ===== paper sheet (rectified from the user's photo), pinned post-it, pass card, desk ===== */
const smoothS=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};

/* ---- perspective maths ---- */
function homography(s,d){
  const A=[],B=[];for(let i=0;i<4;i++){const[x,y]=s[i],[u,v]=d[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);B.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);B.push(v)}
  const n=8;for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];[B[c],B[p]]=[B[p],B[c]];
    for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];for(let k=c;k<n;k++)A[r][k]-=f*A[c][k];B[r]-=f*B[c]}}
  const h=new Array(n);for(let r=n-1;r>=0;r--){let s2=B[r];for(let k=r+1;k<n;k++)s2-=A[r][k]*h[k];h[r]=s2/A[r][r]}
  return(x,y)=>{const w=h[6]*x+h[7]*y+1;return[(h[0]*x+h[1]*y+h[2])/w,(h[3]*x+h[4]*y+h[5])/w]};
}
function sampleBilinear(d,W,H,x,y,out){x=Math.max(0,Math.min(W-1.001,x));y=Math.max(0,Math.min(H-1.001,y));const i=x|0,j=y|0,fx=x-i,fy=y-j,o=(j*W+i)*4;
  for(let k=0;k<3;k++)out[k]=(d[o+k]*(1-fx)+d[o+4+k]*fx)*(1-fy)+(d[o+W*4+k]*(1-fx)+d[o+W*4+4+k]*fx)*fy}

/* ---- the clean sheet: find its 4 corners in the photo, flatten it, keep only its soft lighting ---- */
function rectifySheet(src,RW,RH){
  const W=src.width,H=src.height,d=src.getContext('2d').getImageData(0,0,W,H).data;
  let tl=[0,1e9],tr=[0,-1e9],br=[0,-1e9],bl=[0,1e9];const pts={tl:null,tr:null,br:null,bl:null};let sc={tl:1e9,tr:-1e9,br:-1e9,bl:1e9};
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const o=(j*W+i)*4,L=.299*d[o]+.587*d[o+1]+.114*d[o+2];if(L<172)continue;
    const a=i+j,b=i-j;if(a<sc.tl){sc.tl=a;pts.tl=[i,j]}if(b>sc.tr){sc.tr=b;pts.tr=[i,j]}if(a>sc.br){sc.br=a;pts.br=[i,j]}if(b<sc.bl){sc.bl=b;pts.bl=[i,j]}}
  const quad=[pts.tl,pts.tr,pts.br,pts.bl];
  const Hm=homography([[0,0],[RW,0],[RW,RH],[0,RH]],quad);
  const out=mkc(RW,RH),ox=out.getContext('2d'),im=ox.createImageData(RW,RH),od=im.data,tmp=[0,0,0];
  for(let v=0;v<RH;v++)for(let u=0;u<RW;u++){const[x,y]=Hm(u+.5,v+.5);sampleBilinear(d,W,H,x,y,tmp);const k=(v*RW+u)*4;od[k]=tmp[0];od[k+1]=tmp[1];od[k+2]=tmp[2];od[k+3]=255}
  ox.putImageData(im,0,0);
  return{rect:out,quad};
}
function paperTexture(RW,RH,rect,tint){
  // soft lighting from the photo, fibre grain from procedural noise
  const bl=mkc(RW,RH),bx=bl.getContext('2d');bx.filter='blur(55px)';bx.drawImage(rect,-80,-80,RW+160,RH+160);
  const bd=bx.getImageData(0,0,RW,RH).data;let mean=0;for(let i=0;i<RW*RH;i++)mean+=bd[i*4];mean/=RW*RH;
  const c=mkc(RW,RH),x=c.getContext('2d'),im=x.createImageData(RW,RH),o=im.data;
  for(let j=0;j<RH;j++)for(let i=0;i<RW;i++){
    const k=(j*RW+i)*4,f=Math.max(.80,Math.min(1.10,bd[k]/mean)),fl=Math.pow(f,.85);
    const n=(fbm(i*.55,j*.55,3,11)-.5)*.045+(fbm(i*.06,j*.06,3,5)-.5)*.02+(hash(i,j,41)-.5)*.018;
    // faint long fibres
    const fib=(vnoise(i*.9,j*.03,3)-.5)*.014+(vnoise(i*.03,j*.9,8)-.5)*.014;
    const m=fl*(1+n+fib);
    o[k]=Math.min(255,tint[0]*m);o[k+1]=Math.min(255,tint[1]*m);o[k+2]=Math.min(255,tint[2]*m);o[k+3]=255}
  x.putImageData(im,0,0);return c;
}
/* ---- ballpoint handwriting, drawn character by character ---- */
function handChars(ctx,text,x,y,size,o){o=o||{};ctx.font=(o.weight||600)+' '+size+'px Caveat';let cx=x;
  for(const ch of text){const w=ctx.measureText(ch).width;ctx.save();ctx.translate(cx+w/2,y+(Math.random()-.5)*size*.07);ctx.rotate((Math.random()-.5)*.08+(o.slant||0));ctx.globalAlpha=(o.alpha||.9)*(.82+Math.random()*.18);ctx.scale(1,1+(Math.random()-.5)*.06);ctx.fillText(ch,-w/2,0);ctx.restore();cx+=w*(1+(Math.random()-.5)*.03)}return cx}
function handLoose(ctx,text,x,y,size,o){o=o||{};ctx.save();ctx.translate(x,y);ctx.rotate(o.tilt||0);ctx.font=(o.weight||700)+' '+size+'px Caveat';let cx=0;const chars=[...text],n=chars.length,rise=o.rise||0;
  chars.forEach((ch,i)=>{const w=ctx.measureText(ch).width,sz=1+(Math.random()-.5)*.14;ctx.save();
    ctx.translate(cx+w/2,rise*(i/n)+Math.sin(i*.9+(o.ph||0))*size*.05+(Math.random()-.5)*size*.1);
    ctx.rotate((o.slant||0)+(Math.random()-.5)*.22+Math.sin(i*.7)*.04);
    ctx.globalAlpha=.78+Math.random()*.2;ctx.scale(sz,sz*(1+(Math.random()-.5)*.1));ctx.fillText(ch,-w/2,0);ctx.restore();
    cx+=w*(ch===" "?1.9:1.04)*(1+(Math.random()-.5)*.08)});
  ctx.restore();return cx}
function scribble(ctx,x1,y,x2,lw,col){ctx.save();ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(x1,y);ctx.bezierCurveTo(x1+(x2-x1)*.3,y+4,x1+(x2-x1)*.65,y-4,x2,y+1);ctx.stroke();ctx.restore()}
function coffeeRing(ctx,cx,cy,r){
  ctx.save();ctx.translate(cx,cy);ctx.globalCompositeOperation='multiply';ctx.filter='blur(.8px)';
  const poly=(rr,amp,seed)=>{ctx.beginPath();for(let a=0;a<=360;a+=3){const t=a*Math.PI/180,k=rr+amp*(vnoise(Math.cos(t)*1.7+seed,Math.sin(t)*1.7,seed)-.5)*2;ctx.lineTo(Math.cos(t)*k,Math.sin(t)*k)}ctx.closePath()};
  poly(r-6,3,2);ctx.fillStyle='rgba(165,112,52,.07)';ctx.fill();
  poly(r,4,4);ctx.strokeStyle='rgba(122,72,26,.26)';ctx.lineWidth=9;ctx.stroke();
  ctx.beginPath();for(let a=-150;a<=70;a+=3){const t=a*Math.PI/180,k=r+1+3*(vnoise(Math.cos(t)*1.7+9,Math.sin(t)*1.7,9)-.5);ctx.lineTo(Math.cos(t)*k,Math.sin(t)*k)}ctx.strokeStyle='rgba(88,48,16,.42)';ctx.lineWidth=3.6;ctx.stroke();
  for(let i=0;i<7;i++){const a=hash(i,3,7)*6.28,rr=r+8+hash(i,4,7)*26,sz=1+hash(i,5,7)*3.2;ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,sz,0,6.3);ctx.fillStyle='rgba(110,64,22,.32)';ctx.fill()}
  ctx.restore();
}

/* ---- notebook stack: the user's clean sheet, flattened, with handwritten daily tasks ---- */
async function buildNotebook(sheetSrc){
  await document.fonts.load('600 50px Caveat');await document.fonts.load('700 50px Caveat');
  const RW=700,RH=990,{rect,quad}=rectifySheet(sheetSrc,RW,RH);window.__quad=quad;
  const tex=paperTexture(RW,RH,rect,[252,250,244]);
  // front sheet content
  const front=mkc(RW,RH),fx=front.getContext('2d');fx.drawImage(tex,0,0);
  const ink=mkc(RW,RH),ix=ink.getContext('2d');ix.fillStyle='#1b2f8c';ix.strokeStyle='#1b2f8c';
  handChars(ix,'Mutual Mimu - daily tasks',64,112,58,{weight:700,slant:-.02});scribble(ix,64,128,590,4,'#1b2f8c');
  const L=[['every day:',64,230,52],['1. run the halls',64,308,50],['2. hop chairs, grab $TMF',64,386,50],['3. pick a lane at each',64,464,50],['ballot gate',112,536,50],['4. vote every 4h 20m',64,614,50],['5. bell rings, cash out',64,692,50],['6. check the leaderboards',64,770,50],['7. beat your best ✦',64,848,50],['8. pay the phone bill',64,926,50]];
  L.forEach(([t,x,y,s],i)=>handChars(ix,t,x,y,s,{slant:(Math.random()-.5)*.03}));
  scribble(ix,64,246,250,3,'#1b2f8c');scribble(ix,64,946,500,3,'#1b2f8c');
  fx.save();fx.globalCompositeOperation='multiply';fx.filter='blur(.55px)';fx.drawImage(ink,0,0);fx.filter='none';fx.globalAlpha=.55;fx.drawImage(ink,0,0);fx.restore();
  coffeeRing(fx,508,742,92);
  // slight crease shading across the page, as if it was folded once in a bag
  const cg=fx.createLinearGradient(0,RH*.52,0,RH*.54);cg.addColorStop(0,'rgba(0,0,0,0)');cg.addColorStop(.5,'rgba(70,55,35,.06)');cg.addColorStop(1,'rgba(255,255,255,.05)');fx.fillStyle=cg;fx.fillRect(0,RH*.5,RW,RH*.06);
  // back sheets: same stock, no writing
  const back1=mkc(RW,RH);back1.getContext('2d').drawImage(paperTexture(RW,RH,rect,[246,243,236]),0,0);
  const back2=mkc(RW,RH);back2.getContext('2d').drawImage(paperTexture(RW,RH,rect,[243,240,232]),0,0);
  // compose the stack, rotated, each sheet shadowing the one below
  const M=200,CW=RW+M*2,CH=RH+M*2,stack=mkc(CW,CH),sx=stack.getContext('2d');
  const put=(img,ang,dx,dy,contact)=>{
    const lay=mkc(CW,CH),lx=lay.getContext('2d');lx.translate(CW/2+dx,CH/2+dy);lx.rotate(ang*Math.PI/180);
    // paper thickness: a darker sliver along the lower-right edges
    lx.fillStyle='#cfc8b8';lx.fillRect(-RW/2+1.5,-RH/2+2.4,RW,RH);lx.drawImage(img,-RW/2,-RH/2);
    // soft edge shading so the sheet isn't a perfect plane
    const eg=lx.createLinearGradient(-RW/2,-RH/2,RW/2,RH/2);eg.addColorStop(0,'rgba(255,255,255,.05)');eg.addColorStop(1,'rgba(40,30,15,.07)');lx.fillStyle=eg;lx.fillRect(-RW/2,-RH/2,RW,RH);
    if(contact){const sil=silhouette(lay,'#1a0e05');sx.save();sx.globalAlpha=contact[1];sx.filter='blur('+contact[0]+'px)';sx.drawImage(sil,contact[2],contact[3]);sx.restore()}
    sx.drawImage(lay,0,0)};
  put(back2,5.2,-24,22,null);put(back1,-1.8,-8,10,[7,.38,4,6]);put(front,-6.5,6,-4,[8,.4,5,7]);
  return withShadow(stack,60,[[40,56,40,.44],[16,24,16,.46],[5,8,5,.5]]);
}

/* ---- the user's pinned post-it ---- */
async function buildPostit(src){
  await document.fonts.load('700 60px Caveat');
  const W=src.width,H=src.height,d=src.getContext('2d').getImageData(0,0,W,H).data,cut=mkc(W,H),cx=cut.getContext('2d'),im=cx.createImageData(W,H),o=im.data;
  let minX=1e9,minY=1e9,maxX=0,maxY=0;
  for(let k=0;k<W*H;k++){const r=d[k*4],g=d[k*4+1],b=d[k*4+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,a=smoothS(.17,.30,sat);
    o[k*4]=r;o[k*4+1]=g;o[k*4+2]=b;o[k*4+3]=Math.round(a*255);if(a>.5){const i=k%W,j=(k/W)|0;if(i<minX)minX=i;if(i>maxX)maxX=i;if(j<minY)minY=j;if(j>maxY)maxY=j}}
  cx.putImageData(im,0,0);
  const pad=6,cw=maxX-minX+pad*2,ch=maxY-minY+pad*2,crop=mkc(cw,ch);crop.getContext('2d').drawImage(cut,minX-pad,minY-pad,cw,ch,0,0,cw,ch);
  // tilt of the note, measured from its top edge in the photo
  const ang=Math.atan2(163-200,1217-545);
  const lay=crop,lx=lay.getContext('2d'),ncx=(545+1263)/2-(minX-pad),ncy=(163+845)/2-(minY-pad),nw=700,nh=660;
  const ink=mkc(cw,ch),ix=ink.getContext('2d');ix.translate(ncx,ncy);ix.rotate(ang);ix.fillStyle='#1a160a';
  handLoose(ix,'TMF X MIMU',-nw*.40,nh*.0,nw*.13,{tilt:-.075,rise:-nw*.015,slant:.11,ph:.4});
  ix.save();ix.translate(-nw*.40,nh*.05);ix.rotate(-.085);scribble(ix,0,0,nw*.5,4,'#1a160a');ix.restore();handLoose(ix,'WE CAN’T STOP NOW',-nw*.395,nh*.205,nw*.09,{tilt:-.05,rise:-nw*.012,slant:.14,ph:1.7});
  handLoose(ix,'RUN VOTE CLIMB',-nw*.385,nh*.345,nw*.06,{tilt:-.1,rise:-nw*.008,slant:.1,ph:3.1});
  lx.save();lx.globalCompositeOperation='source-atop';lx.globalAlpha=.9;lx.filter='blur(.4px)';lx.drawImage(ink,0,0);lx.restore();
  const s=Math.min(1,560/cw),fin=mkc(Math.round(cw*s),Math.round(ch*s)),fxx=fin.getContext('2d');fxx.imageSmoothingQuality='high';fxx.drawImage(lay,0,0,fin.width,fin.height);
  grade(fin,[1.0,.985,.95]);
  return withShadow(fin,60,[[16,22,18,.44],[6,9,6,.5],[1.5,2.4,1.6,.46]]);
}

/* ---- TMF pass card prop ---- */
async function buildPasscard(){
  await document.fonts.load('italic 700 120px Newsreader');await document.fonts.load('500 24px "IBM Plex Mono"');
  const CW=900,CH=420,card=mkc(CW,CH),x=card.getContext('2d'),R=34;
  const rr=(c,x0,y0,w,h,r)=>{c.beginPath();c.moveTo(x0+r,y0);c.arcTo(x0+w,y0,x0+w,y0+h,r);c.arcTo(x0+w,y0+h,x0,y0+h,r);c.arcTo(x0,y0+h,x0,y0,r);c.arcTo(x0,y0,x0+w,y0,r);c.closePath()};
  rr(x,0,0,CW,CH,R);x.save();x.clip();
  let g=x.createLinearGradient(0,0,CW,CH);g.addColorStop(0,'#a2353f');g.addColorStop(.55,'#6a1f27');g.addColorStop(1,'#3a1015');x.fillStyle=g;x.fillRect(0,0,CW,CH);
  // guilloche, very faint
  x.strokeStyle='rgba(240,200,120,.10)';x.lineWidth=1.2;for(let k=0;k<26;k++){x.beginPath();for(let a=0;a<=CW;a+=6){const y=CH*.5+Math.sin(a*.021+k*.55)*(70+k*3)*Math.sin(a*.0035+k*.12)+ (k-13)*9;a?x.lineTo(a,y):x.moveTo(a,y)}x.stroke()}
  // grain
  const im=x.getImageData(0,0,CW,CH),dd=im.data;for(let i=0;i<dd.length;i+=4){const n=(hash(i>>2,7,3)-.5)*14;dd[i]+=n;dd[i+1]+=n*.8;dd[i+2]+=n*.7}x.putImageData(im,0,0);
  // gold foil border
  const fg=x.createLinearGradient(0,0,CW,CH);fg.addColorStop(0,'#f6e3a0');fg.addColorStop(.3,'#b98a2e');fg.addColorStop(.55,'#f1d98b');fg.addColorStop(.8,'#9a6f22');fg.addColorStop(1,'#e8c76b');
  x.strokeStyle=fg;x.lineWidth=7;rr(x,14,14,CW-28,CH-28,R-8);x.stroke();x.lineWidth=2;x.globalAlpha=.8;rr(x,28,28,CW-56,CH-56,R-16);x.stroke();x.globalAlpha=1;
  // embossed foil title
  x.font='italic 700 168px Newsreader';x.textBaseline='alphabetic';
  x.fillStyle='rgba(20,5,5,.65)';x.fillText('TMF Pass',64+3,214+4);
  x.fillStyle='rgba(255,236,170,.55)';x.fillText('TMF Pass',64-1.5,214-1.5);
  const tg=x.createLinearGradient(0,90,0,230);tg.addColorStop(0,'#fbe9a8');tg.addColorStop(.45,'#d6a640');tg.addColorStop(.6,'#f6dc8c');tg.addColorStop(1,'#a77a25');x.fillStyle=tg;x.fillText('TMF Pass',64,214);
  x.font='500 25px "IBM Plex Mono"';x.fillStyle='rgba(246,232,205,.92)';x.fillText('A CHANCE FOR TOP SCORERS',68,282);x.fillText('NOT GUARANTEED',68,316);
  // barcode
  x.fillStyle='rgba(235,200,120,.85)';let bx=CW-300;for(let i=0;i<46;i++){const w=1+Math.floor(hash(i,1,9)*4);x.fillRect(bx,CH-120,w,56);bx+=w+2+Math.floor(hash(i,2,9)*3)}
  // sheen
  const sh=x.createLinearGradient(0,0,CW,CH);sh.addColorStop(0,'rgba(255,255,255,.16)');sh.addColorStop(.35,'rgba(255,255,255,.02)');sh.addColorStop(1,'rgba(0,0,0,.12)');x.fillStyle=sh;x.fillRect(0,0,CW,CH);
  x.restore();
  // ticket notches on both sides
  x.globalCompositeOperation='destination-out';[0,CW].forEach(px=>{x.beginPath();x.arc(px,CH/2,30,0,6.3);x.fill()});x.globalCompositeOperation='source-over';
  // rotate (-9deg) and cast the shadow
  const M=120,rw=CW+M*2,rh=CH+M*2,rot=mkc(rw,rh),rx=rot.getContext('2d');rx.translate(rw/2,rh/2);rx.rotate(-9*Math.PI/180);rx.drawImage(card,-CW/2,-CH/2);
  return withShadow(rot,50,[[26,36,28,.46],[10,15,10,.5],[3,5,3,.52]]);
}
window.build.buildNotebook=buildNotebook;window.build.buildPostit=buildPostit;window.build.buildPasscard=buildPasscard;
$log('lab-paper ready');
