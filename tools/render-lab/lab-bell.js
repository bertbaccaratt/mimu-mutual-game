'use strict';
/* ===== polished brass desk bell, ray-marched with the same camera and lamp as the other props ===== */
const bellScene={name:'bell',
  map(x,y,z){
    const r=Math.sqrt(x*x+z*z);
    let d=Math.max(r-4.95,Math.abs(y-.17)-.17)*.8-.03;this.mat=1;               /* base plate */
    const ex=x/4.05,ey=(y-.42)/3.95,ez=z/4.05;
    let dd=(Math.sqrt(ex*ex+ey*ey+ez*ez)-1)*3.95*.8;dd=Math.max(dd,(.42-y)*.85);    /* dome */
    if(dd<d){d=dd;this.mat=1}
    const tr=Math.sqrt((r-4.12)*(r-4.12)+(y-.5)*(y-.5))-.27;if(tr<d){d=tr;this.mat=1}  /* lip ring */
    const ds=Math.max(r-.30,Math.abs(y-4.38)-.3);if(ds<d){d=ds;this.mat=2}              /* stem */
    const bx=Math.sqrt(r*r+(y-4.78)*(y-4.78))-.56;if(bx<d){d=bx;this.mat=2}               /* chrome button */
    return d;
  },
  shade(S,px,py,pz,nx,ny,nz,vx,vy,vz,out){
    const mat=S.mat,ndv=Math.max(0,nx*vx+ny*vy+nz*vz),rx=2*ndv*nx-vx,ry=2*ndv*ny-vy,rz=2*ndv*nz-vz;
    const dl=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]);
    const sh=dl>0?softShadow(S,px+nx*.06,py+ny*.06,pz+nz*.06,12):0,ao=aoAt(S,px,py,pz,nx,ny,nz);
    const fr=Math.pow(1-ndv,5);env(rx,ry,rz);const c=.5+.5*ao;
    if(mat===2){const F=.84+.16*fr;out[0]=eR*.94*F*c+.03;out[1]=eG*.95*F*c+.03;out[2]=eB*.97*F*c+.035;return}
    // polished brass: tinted mirror reflection of the room + a little warm diffuse
    const F=.80+.20*fr,diff=dl*(.25+.75*sh)*.16,r2=Math.sqrt(px*px+pz*pz);
    const band=(py>1.15&&py<1.42&&r2>1)?.72:1;               /* a slightly darker engraved band around the dome */
    const g=.34+.52*clamp(ry*1.35,0,1)+(ry<0?.14:0);out[0]=(eR*.88*F*c*g+diff*.7+.02)*band;out[1]=(eG*.50*F*c*g+diff*.38+.01)*band;out[2]=(eB*.10*F*c*g+diff*.08+.003)*band;
  },
  W:760,u0:-6.2,u1:10.4,v0:-9.4,v1:6.6,elev:58*Math.PI/180,center:[0,2.4,0],ytop:6.4,bound:[0,0,6.8],shadowReach:12,shadowK:9,shadowStrength:.66,aoStrength:.62,mat:1,part:0
};
async function genBell(W){
  const S=Object.assign({},bellScene);if(W)S.W=W;S.H=Math.round(S.W*(S.v1-S.v0)/(S.u1-S.u0));
  const res=await renderScene(S);$log('bell hits '+res.hits);
  const out=document.createElement('canvas');out.width=S.W;out.height=S.H;const c=out.getContext('2d');c.drawImage(res.shadow,0,0);c.drawImage(res.body,0,0);return out;
}
window.gen.genBell=genBell;
$log('lab-bell ready');
