import fs from 'node:fs';
const p='index.html';let t=fs.readFileSync(p,'utf8');
const a=t.indexOf('function buildX(root){'),b=t.indexOf('function buildTop5(root){');
if(a<0||b<a)throw new Error('anchors');
const fn=`function buildX(root){
  const HANDLE='mimuonape',URL_='https://x.com/'+HANDLE;
  const logo='<svg viewBox="0 0 24 24"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  root.innerHTML='<div class="xapp"><div class="xh">'+logo+'<div style="flex:1;min-width:0"><b>Mimu On Ape</b><span>@'+HANDLE+'</span></div><a class="xopen" href="'+URL_+'" target="_blank" rel="noopener noreferrer">Open on X</a></div><div class="xbody"><img class="xshot" src="assets/x-profile.jpg" alt="The Mimu On Ape profile on X: MIMU, @mimuonape, 3,470 followers" width="750" height="1624" decoding="async"></div></div>';
  return{destroy(){}};
}
`;
t=t.slice(0,a)+fn+t.slice(b);
t=t.replace('.xapp .xbody{flex:1;min-height:0;position:relative}','.xapp .xbody{flex:1;min-height:0;position:relative;overflow-y:auto;scrollbar-width:none}\n.xapp .xshot{display:block;width:100%;height:auto}');
fs.writeFileSync(p,t);console.log(t.includes('.xshot{')?'ok':'css missing');
