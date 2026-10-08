'use strict';
/* ===== render lab: shared helpers, wood desk, ray-marched cup and pen ===== */
const $log=m=>{const d=document.getElementById('log');if(d)d.textContent+=m+'\n';document.title=String(m).slice(0,60);console.log(m)};
const clamp=(x,a,b)=>x<a?a:x>b?b:x,mix=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function hash(ix,iy,seed){let h=(Math.imul(ix|0,374761393)+Math.imul(iy|0,668265263)+Math.imul(seed|0,1274126177))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296}
function vnoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);
  const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed),c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy}
function fbm(x,y,oct,seed){let s=0,a=.5,f=1;for(let i=0;i<oct;i++){s+=a*vnoise(x*f,y*f,seed+i*17);a*=.5;f*=2.03}return s/(1-Math.pow(.5,oct))}
const yieldUI=()=>new Promise(r=>setTimeout(r,0));
async function save(name,canvas,type,q){const blob=await new Promise(r=>canvas.toBlob(r,type,q));const res=await fetch('/save/'+name,{method:'POST',body:blob});$log('saved '+name+' '+blob.size+'B '+await res.text());return blob.size}
function preview(canvas,label){const p=document.getElementById('prev');if(!p)return;const d=document.createElement('div');d.style.cssText='display:inline-block;margin:6px;color:#aaa';const c=document.createElement('canvas');c.width=Math.min(520,canvas.width);c.height=c.width/canvas.width*canvas.height;c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);c.style.background='#6b4a2c';d.appendChild(c);d.appendChild(document.createTextNode(label));p.appendChild(d)}

/* ================= WOOD DESK ================= */
async function genDesk(W,H){
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const img=ctx.createImageData(W,H),D=img.data;
  const planks=[];let x=-90,i=0;
  while(x<W+10){const w=Math.round(236+hash(i,1,5)*130);
    planks.push({x0:x,w,s:i*7+3,tone:[.82+hash(i,2,5)*.34,.82+hash(i,12,5)*.34],ringF:6+hash(i,3,5)*6.5,ph:hash(i,4,5)*6.28,jy:Math.round(H*(.16+.68*hash(i,5,5))),hue:hash(i,6,5)});x+=w;i++}
  const idx=new Int16Array(W);{let p=0;for(let xx=0;xx<W;xx++){while(p<planks.length-1&&xx>=planks[p+1].x0)p++;idx[xx]=p}}
  const knots=[];for(let k=0;k<4;k++){const pk=planks[1+Math.floor(hash(k,9,9)*(planks.length-2))];knots.push({cx:pk.x0+pk.w*(.3+.4*hash(k,10,9)),cy:H*(.1+.8*hash(k,11,9)),sx:24+hash(k,12,9)*20,sy:56+hash(k,13,9)*46})}
  const DARK=[58,31,14],MID=[126,76,38],LIGHT=[204,146,88];
  for(let y=0;y<H;y++){
    for(let xx=0;xx<W;xx++){
      const P=planks[idx[xx]],seg=y>P.jy?1:0,sd=P.s+seg*101,tone=P.tone[seg];
      const xl=xx-P.x0,t=(xl/P.w-.5)*2;
      const warp=fbm(xx*.0021+sd*.37,y*.0010+sd*.11,3,sd)*2-1;
      let ring=Math.abs(t+.16*warp+.10*Math.sin(y*.0026+P.ph+seg*2))*P.ringF+warp*2.4;
      let kcore=0;
      for(let k=0;k<4;k++){const kn=knots[k],dx=(xx-kn.cx)/kn.sx,dy=(y-kn.cy)/kn.sy,e=dx*dx+dy*dy;if(e<9){const ex=Math.exp(-e);ring+=3.2*ex;kcore+=Math.exp(-e*4)}}
      const g=ring-Math.floor(ring);
      let v=g<.78?g/.78:(1-g)/.22;v=Math.pow(v,.85);
      const s=fbm(xx*.17,y*.0046,3,sd+9);
      const pore=sstep(.80,.93,vnoise(xx*.55,y*.045,sd+4));
      const blot=fbm(xx*.0013,y*.0016,3,sd+21);
      let k=.20+.52*v+.30*s-.30*pore+(blot-.5)*.40-.50*Math.min(1,kcore);
      k=clamp(k,0,1);
      let r,gg,b;
      if(k<.5){const q=k*2;r=mix(DARK[0],MID[0],q);gg=mix(DARK[1],MID[1],q);b=mix(DARK[2],MID[2],q)}
      else{const q=(k-.5)*2;r=mix(MID[0],LIGHT[0],q);gg=mix(MID[1],LIGHT[1],q);b=mix(MID[2],LIGHT[2],q)}
      const hu=(P.hue-.5);r*=tone*(1+hu*.10);gg*=tone;b*=tone*(1-hu*.16);
      // seams and butt joints, bevelled
      const e=Math.min(xl,P.w-xl),ej=Math.abs(y-P.jy);
      let sh=(.16+.84*sstep(0,2.8,e))*(.80+.20*sstep(2.8,10,e));
      if(xl>2.8&&xl<6)sh*=1.13;
      const sj=(.18+.82*sstep(0,2.4,ej))*(.86+.14*sstep(2.4,8,ej));
      sh*=sj;if(y>P.jy&&y<P.jy+5)sh*=1.1;
      // lamp from the top-left, vignette
      const Lx=(xx/W-.30)/.95,Ly=(y/H-.06)/.9,lamp=Math.exp(-(Lx*Lx+Ly*Ly)*.9);
      const vx=xx/W-.5,vy=y/H-.5,vig=1-.62*Math.pow(vx*vx+vy*vy,1.2)*2.6;
      const light=(.58+.66*lamp)*Math.max(.35,vig);
      const noise=(hash(xx,y,99)-.5)*6;
      const o=(y*W+xx)*4;
      D[o]=clamp(r*sh*light+noise,0,255);D[o+1]=clamp(gg*sh*light+noise*.85,0,255);D[o+2]=clamp(b*sh*light+noise*.7,0,255);D[o+3]=255;
    }
    if(y%40===0){$log('desk row '+y+'/'+H);await yieldUI()}
  }
  ctx.putImageData(img,0,0);
  // window reflection on the varnish (soft, mullioned)
  const wr=document.createElement('canvas');wr.width=W;wr.height=H;const w=wr.getContext('2d');
  const quad=(u0,v0,u1,v1)=>{const A=[.05*W,.02*H],B=[.40*W,-.01*H],C=[.45*W,.34*H],Dd=[.09*W,.37*H];
    const P=(u,v)=>{const tx=A[0]+(B[0]-A[0])*u,ty=A[1]+(B[1]-A[1])*u,bx=Dd[0]+(C[0]-Dd[0])*u,by=Dd[1]+(C[1]-Dd[1])*u;return[tx+(bx-tx)*v,ty+(by-ty)*v]};
    w.beginPath();[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)].forEach((p,n)=>n?w.lineTo(p[0],p[1]):w.moveTo(p[0],p[1]));w.closePath();w.fill()};
  w.fillStyle='#fff';const gap=.018;for(let a=0;a<3;a++)for(let b=0;b<2;b++)quad(a/3+gap,b/2+gap,(a+1)/3-gap,(b+1)/2-gap);
  ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.12;ctx.filter='blur(16px)';ctx.drawImage(wr,0,0);ctx.restore();
  // broad diagonal sheen
  const gr=ctx.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,235,200,.0)');gr.addColorStop(.28,'rgba(255,235,200,.07)');gr.addColorStop(.5,'rgba(255,235,200,0)');
  ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);ctx.restore();
  // fine scratches and dust
  ctx.save();ctx.lineCap='round';
  for(let n=0;n<700;n++){const sx=hash(n,1,77)*W,sy=hash(n,2,77)*H,len=20+hash(n,3,77)*150,ang=(hash(n,4,77)<.7?Math.PI/2:hash(n,5,77)*6.28)+(hash(n,6,77)-.5)*.35;
    ctx.strokeStyle=hash(n,7,77)<.6?`rgba(255,238,215,${.03+hash(n,8,77)*.07})`:`rgba(0,0,0,${.03+hash(n,8,77)*.06})`;ctx.lineWidth=.5+hash(n,9,77)*.9;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(ang)*len,sy+Math.sin(ang)*len);ctx.stroke()}
  ctx.restore();
  return cv;
}

/* ================= tiny ray-marcher (orthographic, soft shadows, AO, window reflections) ================= */
const LIGHT=(()=>{const x=-.36,y=.78,z=-.50,l=Math.hypot(x,y,z);return[x/l,y/l,z/l]})();
const LRIGHT=(()=>{const L=LIGHT,x=L[2],y=0,z=-L[0],l=Math.hypot(x,y,z);return[x/l,y/l,z/l]})();
const LUP=(()=>{const L=LIGHT,R=LRIGHT;return[L[1]*R[2]-L[2]*R[1],L[2]*R[0]-L[0]*R[2],L[0]*R[1]-L[1]*R[0]]})();
const RIM=(()=>{const x=.8,y=.45,z=.25,l=Math.hypot(x,y,z);return[x/l,y/l,z/l]})();
let eR=0,eG=0,eB=0;
function env(rx,ry,rz){
  let r,g,b;
  if(ry>=0){const k=.5+.5*ry;r=.50+.50*k;g=.50+.48*k;b=.50+.44*k}
  else{const k=Math.min(1,-ry*1.5);r=.36*(1-.35*k);g=.215*(1-.35*k);b=.115*(1-.35*k)}
  const w=rx*LIGHT[0]+ry*LIGHT[1]+rz*LIGHT[2];
  if(w>.25){const u=(rx*LRIGHT[0]+ry*LRIGHT[1]+rz*LRIGHT[2])/w,v=(rx*LUP[0]+ry*LUP[1]+rz*LUP[2])/w;
    const m=(1-sstep(.30,.34,Math.abs(u)))*(1-sstep(.22,.26,Math.abs(v)));
    if(m>0){const mu=1-.9*(1-sstep(0,.022,Math.abs(u))),mv=1-.9*(1-sstep(0,.022,Math.abs(v)));const I=6.5*m*mu*mv;r+=I;g+=I*.94;b+=I*.84}}
  const q=rx*RIM[0]+ry*RIM[1]+rz*RIM[2];if(q>0){const I=1.2*Math.pow(q,22);r+=I*.9;g+=I*.95;b+=I}
  eR=r;eG=g;eB=b;
}
function nrm(S,x,y,z,o){const e=.0016;
  const a=S.map(x+e,y-e,z-e),b=S.map(x-e,y-e,z+e),c=S.map(x-e,y+e,z-e),d=S.map(x+e,y+e,z+e);
  let nx=a-b-c+d,ny=-a-b+c+d,nz=-a+b-c+d;const l=Math.hypot(nx,ny,nz)||1;o[0]=nx/l;o[1]=ny/l;o[2]=nz/l}
function softShadow(S,px,py,pz,k){let res=1,t=.05;for(let i=0;i<64;i++){const h=S.map(px+LIGHT[0]*t,py+LIGHT[1]*t,pz+LIGHT[2]*t);if(h<.0007)return 0;res=Math.min(res,k*h/t);t+=clamp(h,.02,.45);if(t>16)break}res=clamp(res,0,1);return res*res*(3-2*res)}
function aoAt(S,px,py,pz,nx,ny,nz){let occ=0,sc=1;for(let k=1;k<=5;k++){const h=.03+.15*k,d=S.map(px+nx*h,py+ny*h,pz+nz*h);occ+=(h-d)*sc;sc*=.72}return clamp(1-1.5*occ,0,1)}
const tone=c=>Math.pow(1-Math.exp(-c*1.18),1/2.2)*255;

async function renderScene(S){
  const W=S.W,H=S.H,se=Math.sin(S.elev),ce=Math.cos(S.elev),dY=-se,dZ=-ce,uY=ce,uZ=-se;
  const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');return{c,x,im:x.createImageData(W,H)}};
  const B=mk(),Sh=mk(),Bd=B.im.data,Sd=Sh.im.data,n3=[0,0,0],out=[0,0,0];
  const [bcx,bcz,br]=S.bound;let nHit=0;
  for(let j=0;j<H;j++){
    const v=S.v1-(j+.5)/H*(S.v1-S.v0);
    for(let i=0;i<W;i++){
      const u=S.u0+(i+.5)/W*(S.u1-S.u0),ox=S.center[0]+u,oy=S.center[1]+uY*v,oz=S.center[2]+uZ*v;
      const tTop=(S.ytop-oy)/dY,tBot=(0-oy)/dY,o4=(j*W+i)*4;
      // does the vertical slab of this ray come near the objects?
      const ax=ox,az=oz+dZ*tTop,bz=oz+dZ*tBot,sx=0,sz=bz-az,sl=sz*sz||1e-9;
      let tt=clamp(((bcx-ax)*0+(bcz-az)*sz)/sl,0,1);const cxp=ax,czp=az+sz*tt;
      const near=Math.hypot(cxp-bcx,czp-bcz)<br;
      let hit=false,t=tTop;
      if(near){for(let n=0;n<140;n++){const py=oy+dY*t,pz=oz+dZ*t,d=S.map(ox,py,pz);if(d<.0011){hit=true;break}t+=d*.88;if(t>tBot+.05)break}}
      if(hit){
        const px=ox,py=oy+dY*t,pz=oz+dZ*t,mat=S.mat,part=S.part;
        nrm(S,px,py,pz,n3);S.mat=mat;S.part=part;
        S.shade(S,px,py,pz,n3[0],n3[1],n3[2],0,-dY,-dZ,out);
        Bd[o4]=tone(out[0]);Bd[o4+1]=tone(out[1]);Bd[o4+2]=tone(out[2]);Bd[o4+3]=255;nHit++;
      }else{
        const px=ox,pz=oz+dZ*tBot,rr=Math.hypot(px-bcx,pz-bcz);
        if(rr<S.shadowReach){
          const sh=softShadow(S,px,.0,pz,S.shadowK||9),ao=aoAt(S,px,.0,pz,0,1,0);
          const a=1-(1-S.shadowStrength*(1-sh))*(1-S.aoStrength*(1-ao));
          if(a>.004){Sd[o4]=16;Sd[o4+1]=8;Sd[o4+2]=3;Sd[o4+3]=Math.round(clamp(a,0,1)*255)}
        }
      }
    }
    if(j%30===0){$log('render '+S.name+' row '+j+'/'+H);await yieldUI()}
  }
  B.x.putImageData(B.im,0,0);Sh.x.putImageData(Sh.im,0,0);
  return{body:B.c,shadow:Sh.c,hits:nHit};
}

/* ----- cup, saucer, coffee, spoon ----- */
const COFFEE_BUBBLES=(()=>{const a=[];for(let i=0;i<22;i++){const ang=hash(i,1,31)*6.28,rad=2.6+hash(i,2,31)*1.25,r=.08+hash(i,3,31)*.22;a.push([Math.cos(ang)*rad,Math.sin(ang)*rad,r])}
  for(let i=0;i<9;i++){const ang=hash(i,5,32)*6.28,rad=hash(i,6,32)*2.3,r=.05+hash(i,7,32)*.12;a.push([Math.cos(ang)*rad,Math.sin(ang)*rad,r])}return a})();
const CUPY=.17,COFY=4.55,RCOF=3.93;
const cupScene={name:'cup',
  map(x,y,z){
    const r=Math.sqrt(x*x+z*z);
    const h=.16+.40*sstep(3.3,6.7,r)+.10*sstep(6.5,7.0,r);
    let d=Math.max(y-h,h-.24-y,r-7.05,-y)*.7-.02;this.mat=1;
    const yc=y-CUPY,t=clamp(yc/5.05,0,1),Ro=2.15+2.2*Math.sin(t*1.42),Ri=Ro-.30;
    const dOut=Math.max((r-Ro)*.82,yc-5.1,-yc),dCav=Math.max((r-Ri)*.82,.38-yc);
    let dc=Math.max(dOut,-dCav)-.03;
    const qx=x-4.25,qy=(y-3.25)*.82,tt=Math.sqrt(qx*qx+qy*qy)-1.78,zz=z*1.12;
    let dh=Math.sqrt(tt*tt+zz*zz)-.46;dh=Math.max(dh,-.55-qx,-dCav)*.8;
    if(dh<dc)dc=dh;
    if(dc<d){d=dc;this.mat=1}
    const dco=Math.max(r-RCOF,Math.abs(y-(CUPY+COFY))-.06);
    if(dco<d){d=dco;this.mat=2}
    // spoon: bowl + handle
    const bx=x+2.0,by=y-.46,bz=z-4.5;
    let eb=(Math.sqrt((bx/1.5)*(bx/1.5)+(by/.34)*(by/.34)+(bz/.95)*(bz/.95))-1)*.34;
    const ei=(Math.sqrt((bx/1.36)*(bx/1.36)+((by-.22)/.34)*((by-.22)/.34)+(bz/.8)*(bz/.8))-1)*.34;
    let dsp=Math.max(eb,-ei);
    const pax=x+.9,pay=(y-.50)*1.8,paz=z-4.55,bax=6.2,bay=.12*1.8,baz=-.35,hh=clamp((pax*bax+pay*bay+paz*baz)/(bax*bax+bay*bay+baz*baz),0,1);
    const hx=pax-bax*hh,hy=pay-bay*hh,hz=paz-baz*hh,dsh=Math.sqrt(hx*hx+hy*hy+hz*hz)-(.10+.10*hh);
    if(dsh<dsp)dsp=dsh;
    if(dsp<d){d=dsp;this.mat=3}
    return d;
  },
  shade(S,px,py,pz,nx,ny,nz,vx,vy,vz,out){
    const mat=S.mat;const ndv=Math.max(0,nx*vx+ny*vy+nz*vz);
    const rx=2*ndv*nx-vx,ry=2*ndv*ny-vy,rz=2*ndv*nz-vz;
    const dl=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]),dlw=(dl+.12)/1.12;
    const sh=dl>0?softShadow(S,px+nx*.06,py+ny*.06,pz+nz*.06,12):0,ao=aoAt(S,px,py,pz,nx,ny,nz);
    const fr=Math.pow(1-ndv,5);env(rx,ry,rz);
    if(mat===3){ // chrome spoon
      const F=.78+.22*fr;out[0]=eR*.92*F*(.5+.5*ao)+.03;out[1]=eG*.93*F*(.5+.5*ao)+.03;out[2]=eB*.96*F*(.5+.5*ao)+.035;return}
    if(mat===2){ // coffee
      const cx=px,cz=pz,rad=Math.sqrt(cx*cx+cz*cz)/RCOF,ang=Math.atan2(cz,cx);
      const swirl=.5+.5*Math.sin(ang*1.0+rad*3.4+Math.sin(rad*5.2)*.8+vnoise(cx*.9,cz*.9,5)*2.4);
      const tex=vnoise(cx*3.1,cz*3.1,9)*.5+vnoise(cx*7.7,cz*7.7,4)*.5;
      let base=[.060,.022,.007],crema=clamp(swirl*sstep(.0,.65,rad)*.26+tex*.09+sstep(.80,1,rad)*.42,0,.62);
      let cr=mix(base[0],.42,crema),cg=mix(base[1],.20,crema),cb=mix(base[2],.062,crema);
      let nxx=nx,nyy=ny,nzz=nz,bub=0,bubHL=0;
      for(let i=0;i<COFFEE_BUBBLES.length;i++){const b=COFFEE_BUBBLES[i],dx=cx-b[0],dz=cz-b[1],dd=Math.sqrt(dx*dx+dz*dz)/b[2];
        if(dd<1.15){const q=Math.min(dd,1);const hgt=Math.sqrt(1-q*q*.92);nxx+=dx/b[2]*.9;nzz+=dz/b[2]*.9;bub=Math.max(bub,1-sstep(.85,1.15,dd));if(dd>.78&&dd<1.05)cr+=.05,cg+=.03,cb+=.015;
          const hdx=dx/b[2]+.35,hdz=dz/b[2]+.35;bubHL=Math.max(bubHL,(1-sstep(0,.32,Math.sqrt(hdx*hdx+hdz*hdz)))*.9)}}
      const men=sstep(.74,1.0,rad);nxx+=-(cx/RCOF)*men*1.1+(vnoise(cx*.8,cz*.8,3)-.5)*.035;nzz+=-(cz/RCOF)*men*1.1+(vnoise(cx*.8+9,cz*.8,6)-.5)*.035;
      const l=Math.hypot(nxx,nyy,nzz);const nn=[nxx/l,nyy/l,nzz/l];
      const ndv2=Math.max(0,nn[0]*vx+nn[1]*vy+nn[2]*vz),r2x=2*ndv2*nn[0]-vx,r2y=2*ndv2*nn[1]-vy,r2z=2*ndv2*nn[2]-vz;env(r2x,r2y,r2z);
      const F=.04+.96*Math.pow(1-ndv2,5);
      const wallShade=.55+.45*sstep(.0,.25,1-rad)+.0; // meniscus darkening at edge
      const dif=(dlw*1.25*(.35+.65*sh)+.30)*ao*(.75+.25*wallShade);
      out[0]=cr*dif+eR*F*.9*(.4+.6*ao)+bubHL*.35;out[1]=cg*dif+eG*F*.9*(.4+.6*ao)+bubHL*.34;out[2]=cb*dif+eB*F*.9*(.4+.6*ao)+bubHL*.3;
      // bubbles reflect the window too
      if(bub>0){out[0]+=bub*eR*.18;out[1]+=bub*eG*.18;out[2]+=bub*eB*.18}
      return}
    // porcelain
    let al=[.925,.915,.885];
    const rr=Math.sqrt(px*px+pz*pz),yc=py-CUPY;
    if(rr<4.05&&yc>3.9&&yc<5.15&&py<5.0){const st=sstep(3.9,4.55,yc)*(1-sstep(4.55,4.9,yc))*.55;al=[mix(al[0],.60,st),mix(al[1],.46,st),mix(al[2],.30,st)]}
    const F=.05+.95*fr;
    const key=1.35*dlw*(.25+.75*sh),amb=(.30+.20*Math.max(0,ny))*ao;
    const bounce=(.34*Math.max(0,-ny*.7+.35)*ao);
    const cavity=(ny>.2&&rr<4.0&&yc>.4&&yc<5.1)?.8:1;
    let r=al[0]*(key+amb*cavity)+eR*F*(.35+.65*ao)+bounce*.9,g=al[1]*(key+amb*cavity)+eG*F*(.35+.65*ao)+bounce*.55,b=al[2]*(key+amb*cavity)+eB*F*(.35+.65*ao)+bounce*.28;
    out[0]=r;out[1]=g;out[2]=b;
  },
  W:1100,u0:-10.5,u1:13.5,v0:-11.5,v1:7.5,elev:58*Math.PI/180,center:[0,2.0,0],ytop:7.4,bound:[0,0,8.4],shadowReach:15.5,shadowK:9,shadowStrength:.66,aoStrength:.62,mat:1,part:0
};
async function genCup(W){
  const S=Object.assign({},cupScene);if(W)S.W=W;S.H=Math.round(S.W*(S.v1-S.v0)/(S.u1-S.u0));
  const res=await renderScene(S);$log('cup hits '+res.hits);
  const out=document.createElement('canvas');out.width=S.W;out.height=S.H;const c=out.getContext('2d');c.drawImage(res.shadow,0,0);c.drawImage(res.body,0,0);
  return out;
}

/* ----- fountain pen resting on the desk, screen angle ~26deg ----- */
const PEN_PHI=27.7*Math.PI/180,PAX=Math.cos(PEN_PHI),PAZ=-Math.sin(PEN_PHI),PNX=PAZ,PNZ=-PAX;
const PEN_PROFILE=[[-7.5,0],[-7.3,.36],[-6.9,.60],[-6.3,.675],[-1.5,.68],[-1.45,.715],[-1.18,.715],[-1.12,.68],[-1.05,.64],[-1.0,.62],[3.3,.62],[3.38,.66],[3.62,.66],[3.7,.60],[3.78,.56],[5.7,.40],[5.78,.44],[6.0,.44],[6.06,.30]];
function penR(s){const P=PEN_PROFILE;if(s<=P[0][0])return 0;for(let i=1;i<P.length;i++){if(s<=P[i][0]){const a=P[i-1],b=P[i],t=(s-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t}}return .3}
const isGold=s=>(s>-1.5&&s<-1.12)||(s>3.3&&s<3.7)||(s>5.7&&s<6.07);
const penScene={name:'pen',
  map(x,y,z){
    const py=y-.68,s=x*PAX+z*PAZ,lat=x*PNX+z*PNZ,rho=Math.sqrt(lat*lat+py*py);
    let d=Math.max((rho-penR(s))*.9,-7.5-s,s-6.08);this.mat=1;this.part=0;
    // clip
    const qx=Math.abs(s+4.35)-1.8,qy=Math.abs(py-.735)-.07,qz=Math.abs(lat)-.19;
    const dcl=Math.sqrt(Math.max(qx,0)**2+Math.max(qy,0)**2+Math.max(qz,0)**2)+Math.min(Math.max(qx,qy,qz),0)-.03;
    if(dcl<d){d=dcl;this.part=1}
    const bx=s+6.12,bz=py-.74,dball=Math.sqrt(bx*bx+lat*lat+bz*bz)-.14;if(dball<d){d=dball;this.part=1}
    // nib
    const tn=clamp((s-6.0)/1.4,0,1),Wn=.40*(1-Math.pow(tn,1.7)),dn=Math.max(Math.abs(py+.04)-.035,Math.abs(lat)-Wn,s-7.4,5.98-s)*.8-.008;
    if(dn<d){d=dn;this.part=2}
    return d;
  },
  shade(S,px,py,pz,nx,ny,nz,vx,vy,vz,out){
    const part=S.part,s=px*PAX+pz*PAZ,lat=px*PNX+pz*PNZ;
    const ndv=Math.max(0,nx*vx+ny*vy+nz*vz),rx=2*ndv*nx-vx,ry=2*ndv*ny-vy,rz=2*ndv*nz-vz;
    const dl=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]),dlw=(dl+.1)/1.1;
    const sh=dl>0?softShadow(S,px+nx*.02,py+ny*.02,pz+nz*.02,14):0,ao=aoAt(S,px,py,pz,nx,ny,nz);
    const fr=Math.pow(1-ndv,5);env(rx,ry,rz);
    const gold=part===1||(part===0&&isGold(s));
    if(part===2){ // nib: warm steel/gold
      const slit=Math.abs(lat)<.014&&s>6.35,hole=Math.hypot(s-6.55,lat)<.07;
      if(slit||hole){out[0]=out[1]=out[2]=.01;return}
      const F=.7+.3*fr,c=(.5+.5*ao);out[0]=eR*.9*F*c+.03;out[1]=eG*.72*F*c+.025;out[2]=eB*.42*F*c+.012;return}
    if(gold){const F=.82+.18*fr,c=(.5+.5*ao);out[0]=eR*.85*F*c+.02;out[1]=eG*.58*F*c+.012;out[2]=eB*.16*F*c+.004;return}
    // black lacquer: deep diffuse + strong glossy reflection of the room
    const F=.045+.955*fr,key=.09*dlw*(.2+.8*sh),amb=.03*ao,c=(.45+.55*ao);
    out[0]=.006+key*.7+amb*.6+eR*F*c*.58;out[1]=.006+key*.7+amb*.6+eG*F*c*.58;out[2]=.008+key*.7+amb*.6+eB*F*c*.6;
  },
  W:1170,u0:-9.6,u1:9.6,v0:-5.3,v1:5.0,elev:58*Math.PI/180,center:[0,.68,0],ytop:2.2,bound:[0,0,8.2],shadowReach:11,shadowK:11,shadowStrength:.7,aoStrength:.75,mat:1,part:0
};
async function genPen(W){
  const S=Object.assign({},penScene);if(W)S.W=W;S.H=Math.round(S.W*(S.v1-S.v0)/(S.u1-S.u0));
  const res=await renderScene(S);$log('pen hits '+res.hits);return{body:res.body,shadow:res.shadow,W:S.W,H:S.H,scale:S.W/(S.u1-S.u0)};
}
window.gen={genDesk,genCup,genPen};
$log('lab1 ready');
