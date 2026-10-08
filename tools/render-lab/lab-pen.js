'use strict';
/* ===== cut the user's pen photo out of its smooth grey backdrop ===== */
function fitBackground(L,W,H){ // quadratic surface fitted to the outer border pixels
  const rows=[],ys=[];const add=(i,j)=>{const x=i/W,y=j/H;rows.push([1,x,y,x*x,x*y,y*y]);ys.push(L[j*W+i])};
  for(let i=0;i<W;i+=3){for(let j=0;j<5;j++){add(i,j);add(i,H-1-j)}}for(let j=0;j<H;j+=3){for(let i=0;i<5;i++){add(i,j);add(W-1-i,j)}}
  const n=6,A=Array.from({length:n},()=>new Array(n+1).fill(0));
  for(let r=0;r<rows.length;r++)for(let a=0;a<n;a++){for(let b=0;b<n;b++)A[a][b]+=rows[r][a]*rows[r][b];A[a][n]+=rows[r][a]*ys[r]}
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];for(let k=c;k<=n;k++)A[r][k]-=f*A[c][k]}}
  const w=new Array(n);for(let r=n-1;r>=0;r--){let s=A[r][n];for(let k=r+1;k<n;k++)s-=A[r][k]*w[k];w[r]=s/A[r][r]}
  return(i,j)=>{const x=i/W,y=j/H;return w[0]+w[1]*x+w[2]*y+w[3]*x*x+w[4]*x*y+w[5]*y*y};
}
function buildPenPhoto(src){
  const W=src.width,H=src.height,d=src.getContext('2d').getImageData(0,0,W,H).data,L=new Float32Array(W*H);
  for(let i=0;i<W*H;i++)L[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];
  const bg=fitBackground(L,W,H),thr=26,m=new Uint8Array(W*H);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(Math.abs(L[j*W+i]-bg(i,j))>thr)m[j*W+i]=1;
  // keep the biggest blob, close gaps, fill holes
  const lab=new Int32Array(W*H),sz=[0];let nl=0;
  for(let s=0;s<W*H;s++){if(!m[s]||lab[s])continue;nl++;let c=0;const st=[s];lab[s]=nl;while(st.length){const k=st.pop();c++;const i=k%W,j=(k/W)|0;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const u=i+a,v=j+b;if(u<0||v<0||u>=W||v>=H)continue;const kk=v*W+u;if(m[kk]&&!lab[kk]){lab[kk]=nl;st.push(kk)}}}sz.push(c)}
  let big=1;for(let i=2;i<=nl;i++)if(sz[i]>sz[big])big=i;
  let mk=new Uint8Array(W*H);for(let i=0;i<W*H;i++)mk[i]=lab[i]===big?1:0;
  const dil=(a,r)=>{const o=new Uint8Array(W*H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){let v=0;for(let b=-r;b<=r&&!v;b++){const jj=j+b;if(jj<0||jj>=H)continue;for(let q=-r;q<=r;q++){const ii=i+q;if(ii<0||ii>=W)continue;if(a[jj*W+ii]){v=1;break}}}o[j*W+i]=v}return o};
  const ero=(a,r)=>{const inv=new Uint8Array(W*H);for(let i=0;i<W*H;i++)inv[i]=a[i]?0:1;const e=dil(inv,r),o=new Uint8Array(W*H);for(let i=0;i<W*H;i++)o[i]=e[i]?0:1;return o};
  mk=ero(dil(mk,3),3);
  const mark=new Uint8Array(W*H),st=[];const p=(i,j)=>{const k=j*W+i;if(!mk[k]&&!mark[k]){mark[k]=1;st.push(k)}};
  for(let i=0;i<W;i++){p(i,0);p(i,H-1)}for(let j=0;j<H;j++){p(0,j);p(W-1,j)}
  while(st.length){const k=st.pop(),i=k%W,j=(k/W)|0;if(i>0)p(i-1,j);if(i<W-1)p(i+1,j);if(j>0)p(i,j-1);if(j<H-1)p(i,j+1)}
  for(let i=0;i<W*H;i++)mk[i]=mark[i]?0:1;
  mk=ero(mk,1);
  { // keep only the dark body + a tight envelope around it (drops the photo's own soft shadow, keeps chrome clip and tip)
    const S0=new Uint8Array(W*H);for(let i=0;i<W*H;i++)S0[i]=(mk[i]&&L[i]<58)?1:0;
    let S1=ero(dil(S0,5),5);
    let sx0=0,sy0=0,n0=0;for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(S1[j*W+i]){sx0+=i;sy0+=j;n0++}
    const mx=sx0/n0,my=sy0/n0;let a=0,b=0,c2=0;for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(S1[j*W+i]){const u=i-mx,v=j-my;a+=u*u;b+=u*v;c2+=v*v}
    const th=.5*Math.atan2(2*b,a-c2),ca=Math.cos(th),sa=Math.sin(th);
    const BIN=2,hw=new Float32Array(1000).fill(0);let smin=1e9,smax=-1e9;
    for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(S1[j*W+i]){const s=(i-mx)*ca+(j-my)*sa,p=Math.abs(-(i-mx)*sa+(j-my)*ca),k=Math.floor((s+500)/BIN);if(p>hw[k])hw[k]=p;if(s<smin)smin=s;if(s>smax)smax=s}
    const env=(s,p)=>{if(s<smin-16||s>smax+16)return false;let k=Math.floor((Math.max(smin,Math.min(smax,s))+500)/BIN),w=0;for(let q=-2;q<=2;q++)w=Math.max(w,hw[k+q]||0);
      const over=s<smin?smin-s:s>smax?s-smax:0;w=w*(1-over/18);return p<=w+1.5};
    const out2=new Uint8Array(W*H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const k=j*W+i;if(S1[k]){out2[k]=1;continue}if(!mk[k])continue;const s=(i-mx)*ca+(j-my)*sa,p=Math.abs(-(i-mx)*sa+(j-my)*ca);if(env(s,p))out2[k]=1}
    mk=ero(dil(out2,2),2);
  }
  // bbox and principal axis of the mask
  let minX=1e9,minY=1e9,maxX=0,maxY=0,sx=0,sy=0,n=0;for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(mk[j*W+i]){if(i<minX)minX=i;if(i>maxX)maxX=i;if(j<minY)minY=j;if(j>maxY)maxY=j;sx+=i;sy+=j;n++}
  const cx=sx/n,cy=sy/n;let sxx=0,sxy=0,syy=0;for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(mk[j*W+i]){const a=i-cx,b=j-cy;sxx+=a*a;sxy+=a*b;syy+=b*b}
  const ang=.5*Math.atan2(2*sxy,sxx-syy);
  // extreme points along the axis = the two ends of the pen
  let tmin=1e9,tmax=-1e9,pA=null,pB=null;for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(mk[j*W+i]){const t=(i-cx)*Math.cos(ang)+(j-cy)*Math.sin(ang);if(t<tmin){tmin=t;pA=[i,j]}if(t>tmax){tmax=t;pB=[i,j]}}
  // soft alpha from the mask
  const A=mkc(W,H),ax=A.getContext('2d'),ai=ax.createImageData(W,H);for(let i=0;i<W*H;i++){ai.data[i*4]=ai.data[i*4+1]=ai.data[i*4+2]=255;ai.data[i*4+3]=mk[i]?255:0}ax.putImageData(ai,0,0);
  const F=mkc(W,H),fx=F.getContext('2d');fx.filter='blur(.8px)';fx.drawImage(A,0,0);const fa=fx.getImageData(0,0,W,H).data;
  const cut=mkc(W,H),cc=cut.getContext('2d'),ci=cc.createImageData(W,H);for(let i=0;i<W*H;i++){ci.data[i*4]=d[i*4];ci.data[i*4+1]=d[i*4+1];ci.data[i*4+2]=d[i*4+2];ci.data[i*4+3]=mk[i]?fa[i*4+3]:Math.min(fa[i*4+3],120)*0}cc.putImageData(ci,0,0);
  const pad=8,bw=maxX-minX+1+pad*2,bh=maxY-minY+1+pad*2,crop=mkc(bw,bh);crop.getContext('2d').drawImage(cut,minX-pad,minY-pad,bw,bh,0,0,bw,bh);
  const K=2.6;let up=upscale(crop,K);sharpen(up,1.3,.6,3);grade(up,[1.0,.985,.95]);
  const info={W:up.width,H:up.height,ends:[[(pA[0]-minX+pad)*K,(pA[1]-minY+pad)*K],[(pB[0]-minX+pad)*K,(pB[1]-minY+pad)*K]],axisDeg:ang*180/Math.PI,bbox:[minX,minY,maxX,maxY]};
  return{pen:up,info};
}
function shadowOnly(layer,margin,spec){const W=layer.width+margin*2,H=layer.height+margin*2,out=mkc(W,H),x=out.getContext('2d'),sil=silhouette(layer,'#140a04');
  for(const[ox,oy,bl,al]of spec){x.save();x.globalAlpha=al;x.filter='blur('+bl+'px)';x.drawImage(sil,margin+ox,margin+oy);x.restore()}
  // knock out the pen itself so the shadow layer is only the cast part
  x.globalCompositeOperation='destination-out';x.drawImage(layer,margin,margin);return out}
function padLayer(layer,margin){const o=mkc(layer.width+margin*2,layer.height+margin*2);o.getContext('2d').drawImage(layer,margin,margin);return o}
window.build.buildPenPhoto=buildPenPhoto;window.build.shadowOnly=shadowOnly;window.build.padLayer=padLayer;
$log('lab-pen ready');
