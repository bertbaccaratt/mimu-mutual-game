import fs from 'node:fs';
const p='index.html';let t=fs.readFileSync(p,'utf8');
const a=t.indexOf('function buildX(root){'),b=t.indexOf('function buildTop5(root){');
if(a<0||b<a)throw new Error('anchors');
const fn=`function buildX(root){
  const HANDLE='mimuonape',URL_='https://x.com/'+HANDLE;
  const logo='<svg viewBox="0 0 24 24"><path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  root.innerHTML='<div class="xapp"><div class="xh">'+logo+'<div style="flex:1;min-width:0"><b>Mimu On Ape</b><span>@'+HANDLE+'</span></div><a class="xopen" href="'+URL_+'" target="_blank" rel="noopener noreferrer">Open on x.com</a></div><div class="xbody"><div class="xload">Loading @'+HANDLE+'&hellip;</div><iframe class="xfr" title="Mimu On Ape on X" src="https://syndication.twitter.com/srv/timeline-profile/screen-name/'+HANDLE+'?dnt=true&amp;theme=dark&amp;showReplies=false" referrerpolicy="no-referrer" loading="eager"></iframe></div></div>';
  const fr=root.querySelector('.xfr'),ld=root.querySelector('.xload');
  fr.addEventListener('load',()=>{if(ld)ld.remove()});
  return{destroy(){}};
}
`;
t=t.slice(0,a)+fn+t.slice(b);
const css='.xapp .xfr{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;color-scheme:dark}\n.xapp .xopen{flex:none;padding:6px 11px;border-radius:999px;background:#eff3f4;color:#0f1419;font:700 11px var(--sans);text-decoration:none}\n';
t=t.replace(/\.xapp \.xbody\{[^}]*\}/,m=>m.replace('overflow-y:auto;scrollbar-width:thin;',''));
t=t.replace('.xapp .xload{',css+'.xapp .xload{');
t=t.replace('shown right inside the phone (using X&rsquo;s own embedded timeline)','shown right inside the phone');
t=t.replace('through X&rsquo;s embedded timeline','inside the phone');
fs.writeFileSync(p,t);console.log('ok');
