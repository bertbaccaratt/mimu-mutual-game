'use strict';
/* ===== final asset builders (use the user's photos where supplied) ===== */
const mkc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function silhouette(src,color){const c=mkc(src.width,src.height),x=c.getContext('2d');x.drawImage(src,0,0);x.globalCompositeOperation='source-in';x.fillStyle=color||'#000';x.fillRect(0,0,c.width,c.height);return c}
/* cast several layered shadows (light from the top-left) under a cut-out layer. spec: [[offX,offY,blur,alpha],...] */
function withShadow(layer,margin,spec){
  const W=layer.width+margin*2,H=layer.height+margin*2,out=mkc(W,H),x=out.getContext('2d');
  const sil=silhouette(layer,'#140a04');
  for(const [ox,oy,bl,al] of spec){x.save();x.globalAlpha=al;x.filter='blur('+bl+'px)';x.drawImage(sil,margin+ox,margin+oy);x.restore()}
  x.drawImage(layer,margin,margin);return out;
}
function grade(c,mul){const x=c.getContext('2d'),im=x.getImageData(0,0,c.width,c.height),d=im.data;for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]*mul[0]);d[i+1]=Math.min(255,d[i+1]*mul[1]);d[i+2]=Math.min(255,d[i+2]*mul[2])}x.putImageData(im,0,0);return c}

/* ---- cup & saucer: the user's top-view photo ---- */
function buildCup(cupSrc){
  const g=fitGrid(cupSrc,6),cut=cutout(cupSrc,{grid:g,dark:213,tol:3,band:16,brightMin:240,close:2,erode:1,feather:.9});
  const cx=312.7,cy=313.1,R=239.5,S=Math.ceil(R*2+6),layer=mkc(S,S),x=layer.getContext('2d');
  // clip to the saucer circle (kills leftover checker specks) with a soft rim
  const m=mkc(S,S),mx=m.getContext('2d');mx.filter='blur(.9px)';mx.fillStyle='#fff';mx.beginPath();mx.arc(S/2,S/2,R-.6,0,6.2832);mx.fill();
  x.drawImage(cut,S/2-cx,S/2-cy);x.globalCompositeOperation='destination-in';x.drawImage(m,0,0);
  grade(layer,[1.0,.972,.93]);
  return withShadow(layer,110,[[34,46,34,.46],[14,20,14,.5],[4,6,4,.55],[1,2,1.5,.5]]);
}
window.build={buildCup};
$log('lab-build ready');

/* ---- unsharp mask + fine grain, to bring small photos up to display size ---- */
function sharpen(c,radius,amount,grain){
  const W=c.width,H=c.height,x=c.getContext('2d'),o=x.getImageData(0,0,W,H);
  const b=mkc(W,H),bx=b.getContext('2d');bx.filter='blur('+radius+'px)';bx.drawImage(c,0,0);const bd=bx.getImageData(0,0,W,H).data,d=o.data;
  for(let i=0;i<d.length;i+=4){if(d[i+3]===0)continue;const g=(Math.random()-.5)*grain;
    for(let k=0;k<3;k++){const v=d[i+k]+(d[i+k]-bd[i+k])*amount+g;d[i+k]=v<0?0:v>255?255:v}}
  x.putImageData(o,0,0);return c}
function upscale(src,k){let cur=src;const steps=Math.ceil(Math.log2(k)),each=Math.pow(k,1/steps);
  for(let s=0;s<steps;s++){const c=mkc(Math.round(cur.width*each),Math.round(cur.height*each)),x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(cur,0,0,c.width,c.height);cur=c}return cur}

/* ---- white mug on dark slate (user's 474px thumbnail): cut the mug out ---- */
function buildMug(src){
  const W=src.width,H=src.height,d=src.getContext('2d').getImageData(0,0,W,H).data,L=new Float32Array(W*H);
  for(let i=0;i<W*H;i++)L[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];
  // bright components in the middle of the frame -> the mug rim + handle
  const lab=new Int32Array(W*H),sz=[0];let n=0;const x0=150,x1=345,y0=85,y1=225;
  for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++){const s=j*W+i;if(L[s]<205||lab[s])continue;n++;let c=0;const st=[s];lab[s]=n;while(st.length){const k=st.pop();c++;const ii=k%W,jj=(k/W)|0;
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const u=ii+a,v=jj+b;if(u<x0||u>=x1||v<y0||v>=y1)continue;const kk=v*W+u;if(!lab[kk]&&L[kk]>=205){lab[kk]=n;st.push(kk)}}}sz.push(c)}
  let big=1;for(let i=2;i<=n;i++)if(sz[i]>sz[big])big=i;
  let minX=1e9,maxX=-1,minY=1e9,maxY=-1;for(let j=y0;j<y1;j++)for(let i=x0;i<x1;i++)if(lab[j*W+i]===big){if(i<minX)minX=i;if(i>maxX)maxX=i;if(j<minY)minY=j;if(j>maxY)maxY=j}
  const D=maxY-minY+1,r=D/2,cx=minX+r,cy=(minY+maxY+1)/2;
  const cutc=mkc(W,H),cx2=cutc.getContext('2d'),im=cx2.createImageData(W,H),o=im.data;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i,dist=Math.hypot(i+.5-cx,j+.5-cy);let a=Math.max(0,Math.min(1,r+.5-dist));
    if(i+.5>cx+r*.55&&Math.abs(j+.5-cy)<r*.4){const t=Math.max(0,Math.min(1,(L[k]-175)/45));a=Math.max(a,t*t*(3-2*t)*(lab[k]===big||i+.5<maxX+3?1:0))}
    o[k*4]=d[k*4];o[k*4+1]=d[k*4+1];o[k*4+2]=d[k*4+2];o[k*4+3]=Math.round(a*255)}
  cx2.putImageData(im,0,0);
  const crop=mkc(Math.ceil(maxX-minX+12),Math.ceil(D+12)),cc=crop.getContext('2d');cc.drawImage(cutc,minX-6,minY-6,crop.width,crop.height,0,0,crop.width,crop.height);
  window.__mugInfo={cx,cy,r,minX,maxX,minY,maxY,cropW:crop.width,cropH:crop.height};
  let up=upscale(crop,2.7);sharpen(up,1.4,.7,3.5);grade(up,[1.0,.975,.935]);
  return withShadow(up,80,[[26,34,26,.46],[10,14,11,.5],[3,5,3.4,.55],[1,2,1.4,.5]]);
}
window.build.buildMug=buildMug;