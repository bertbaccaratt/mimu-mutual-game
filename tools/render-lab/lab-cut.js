'use strict';
/* ===== cut a subject out of an image that has a fake checkerboard baked into its pixels ===== */
function cutout(src,o){
  const W=src.width,H=src.height,x=src.getContext('2d'),im=x.getImageData(0,0,W,H),d=im.data;
  const L=new Float32Array(W*H);for(let i=0;i<W*H;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/3;
  const G=o.grid;const par0=G?((i,j)=>{const sx=Math.floor((i-G.ax)/G.px)+1,sy=Math.floor((j-G.ay)/G.py)+1;return(((sx+sy)%2)+2)%2}):null;const flip=G?par0(2,2):0;const par=G?((i,j)=>par0(i,j)^flip):((i,j)=>{const sx=i<o.bx0?0:Math.floor((i-o.bx0)/o.px)+1,sy=j<o.by0?0:Math.floor((j-o.by0)/o.py)+1;return(sx+sy)&1});
  const isBg=new Uint8Array(W*H);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const k=j*W+i,r=d[k*4],g=d[k*4+1],b=d[k*4+2],gr=L[k];
    const neutral=Math.abs(r-g)<=o.tol&&Math.abs(b-r)<=o.tol&&Math.abs(b-g)<=o.tol;
    if(!neutral)continue;
    if(o.simple){if(gr>=o.minL)isBg[k]=1;continue}
    if(par(i,j)){if(Math.abs(gr-o.dark)<=o.band)isBg[k]=1}else if(gr>=(o.brightMin||244))isBg[k]=1;
  }
  // close one-pixel grid seams so the flood can cross squares
  const dil=(m,rad)=>{const out=new Uint8Array(W*H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){let v=0;for(let dj=-rad;dj<=rad&&!v;dj++){const jj=j+dj;if(jj<0||jj>=H)continue;for(let di=-rad;di<=rad;di++){const ii=i+di;if(ii<0||ii>=W)continue;if(m[jj*W+ii]){v=1;break}}}out[j*W+i]=v}return out};
  const ero=(m,rad)=>{const inv=new Uint8Array(W*H);for(let i=0;i<W*H;i++)inv[i]=m[i]?0:1;const e=dil(inv,rad);const out=new Uint8Array(W*H);for(let i=0;i<W*H;i++)out[i]=e[i]?0:1;return out};
  const closed=ero(dil(isBg,o.close||2),o.close||2);
  // flood from the borders
  const bg=new Uint8Array(W*H),stack=[];
  const push=(i,j)=>{const k=j*W+i;if(closed[k]&&!bg[k]){bg[k]=1;stack.push(k)}};
  for(let i=0;i<W;i++){push(i,0);push(i,H-1)}for(let j=0;j<H;j++){push(0,j);push(W-1,j)}
  while(stack.length){const k=stack.pop(),i=k%W,j=(k/W)|0;if(i>0)push(i-1,j);if(i<W-1)push(i+1,j);if(j>0)push(i,j-1);if(j<H-1)push(i,j+1)}
  let fg=new Uint8Array(W*H);for(let i=0;i<W*H;i++)fg[i]=bg[i]?0:1;
  // drop specks of foreground that are not part of the main body, fill pinholes
  const lab=new Int32Array(W*H),sizes=[0];let nl=0;
  for(let s=0;s<W*H;s++){if(!fg[s]||lab[s])continue;nl++;let cnt=0;const st=[s];lab[s]=nl;while(st.length){const k=st.pop();cnt++;const i=k%W,j=(k/W)|0;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=W||jj>=H)continue;const kk=jj*W+ii;if(fg[kk]&&!lab[kk]){lab[kk]=nl;st.push(kk)}}}sizes.push(cnt)}
  let big=1;for(let i=2;i<=nl;i++)if(sizes[i]>sizes[big])big=i;
  for(let i=0;i<W*H;i++)fg[i]=lab[i]===big?1:0;
  // fill interior holes (background-coloured pixels not connected to the border)
  const out2=new Uint8Array(W*H);{const st=[];const mark=new Uint8Array(W*H);const p=(i,j)=>{const k=j*W+i;if(!fg[k]&&!mark[k]){mark[k]=1;st.push(k)}};
    for(let i=0;i<W;i++){p(i,0);p(i,H-1)}for(let j=0;j<H;j++){p(0,j);p(W-1,j)}
    while(st.length){const k=st.pop(),i=k%W,j=(k/W)|0;if(i>0)p(i-1,j);if(i<W-1)p(i+1,j);if(j>0)p(i,j-1);if(j<H-1)p(i,j+1)}
    for(let i=0;i<W*H;i++)out2[i]=mark[i]?0:1}
  if(o.open){const r=o.open,e1=ero(out2,r);const d1=dil(e1,r);for(let i=0;i<W*H;i++)out2[i]=d1[i]}
  // erode a touch to lose the checker fringe, then feather
  const core=ero(out2,o.erode==null?1:o.erode);
  const A=document.createElement('canvas');A.width=W;A.height=H;const ax=A.getContext('2d'),ai=ax.createImageData(W,H);
  for(let i=0;i<W*H;i++){ai.data[i*4]=ai.data[i*4+1]=ai.data[i*4+2]=255;ai.data[i*4+3]=core[i]?255:0}
  ax.putImageData(ai,0,0);
  const F=document.createElement('canvas');F.width=W;F.height=H;const fx=F.getContext('2d');fx.filter='blur('+(o.feather||.9)+'px)';fx.drawImage(A,0,0);
  const fd=fx.getImageData(0,0,W,H).data;
  for(let i=0;i<W*H;i++){d[i*4+3]=core[i]||fd[i*4+3]>0?Math.min(255,fd[i*4+3]*(core[i]?1:1)):0}
  const out=document.createElement('canvas');out.width=W;out.height=H;out.getContext('2d').putImageData(im,0,0);
  return out;
}
window.cutout=cutout;
/* least-squares fit of the baked-in checkerboard (sub-pixel period and phase) from its clean top and left margins */
function fitGrid(cv,margin){
  const W=cv.width,H=cv.height,d=cv.getContext('2d').getImageData(0,0,W,H).data,m=margin||6;
  const lum=(i,j)=>{const o=(j*W+i)*4;return(d[o]+d[o+1]+d[o+2])/3};
  const axis=(len,sample)=>{const P=new Float32Array(len);for(let i=0;i<len;i++){let s=0;for(let k=1;k<=m;k++)s+=sample(i,k);P[i]=s/m}
    const mid=(255+Math.min(...Array.from(P).filter(v=>v<235)))/2||234;const tr=[];let prev=P[0]>mid;
    for(let i=1;i<len;i++){const cur=P[i]>mid;if(cur!==prev){const a=P[i-1],b=P[i];tr.push(i-1+(mid-a)/(b-a));prev=cur}}return{tr,first:P[2]>mid}};
  const fit=(tr)=>{ // drop an initial partial/short interval, then regress position on index
    const use=tr.filter((v,i)=>i>0&&v>3);const n=use.length;let sx=0,sy=0,sxx=0,sxy=0;for(let i=0;i<n;i++){sx+=i;sy+=use[i];sxx+=i*i;sxy+=i*use[i]}
    const p=(n*sxy-sx*sy)/(n*sxx-sx*sx),a=(sy-p*sx)/n;return{p,a,n}};
  const ax=axis(W,(i,k)=>lum(i,k)),ay=axis(H,(j,k)=>lum(k,j));
  const fx=fit(ax.tr),fy=fit(ay.tr);
  return{px:fx.p,ax:fx.a,py:fy.p,ay:fy.a,nx:fx.n,ny:fy.n,firstBright:ax.first}
}
window.fitGrid=fitGrid;

window.view=(cv,sx,sy,sw,sh,w=780,bg='#7a5230')=>{const p=document.getElementById('prev');p.innerHTML='';const c=document.createElement('canvas');c.width=w;c.height=Math.round(w*sh/sw);const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,c.width,c.height);x.imageSmoothingQuality='high';x.drawImage(cv,sx,sy,sw,sh,0,0,c.width,c.height);c.style.display='block';p.appendChild(c);window.scrollTo(0,0)};
window.load=(u)=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);res(c)};im.onerror=rej;im.src=u});