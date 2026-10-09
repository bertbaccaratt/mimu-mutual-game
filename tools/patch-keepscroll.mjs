// Apps that refresh themselves (Top 5, Leaderboards, Mail, Texts list, Settings, Badges) keep their scroll position when they redraw.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

rep(`function morph(a,html){`, `/* run a redraw of an app and put every scrolled area back where it was, so a refresh never throws the reader back to the top */
function keepScroll(root,fn){
  const sig=e=>e.tagName+'.'+e.className,snap=[],cnt={};
  [root,...root.querySelectorAll('*')].forEach(e=>{const k=sig(e),i=cnt[k]=(cnt[k]||0);cnt[k]++;if(e.scrollTop>0||e.scrollLeft>0)snap.push([k,i,e.scrollTop,e.scrollLeft])});
  fn();
  if(!snap.length)return;
  const idx={},c2={};
  [root,...root.querySelectorAll('*')].forEach(e=>{const k=sig(e),i=c2[k]=(c2[k]||0);c2[k]++;(idx[k]=idx[k]||[])[i]=e});
  snap.forEach(([k,i,top,left])=>{const e=idx[k]&&idx[k][i];if(e){e.scrollTop=top;e.scrollLeft=left}});
}
function morph(a,html){`);

const n = t.split('\n  const draw=()=>{\n').length - 1;
if (n !== 5) throw new Error('expected 5 draw functions, found ' + n);
t = t.split('\n  const draw=()=>{\n').join('\n  const draw=()=>keepScroll(root,drawBody);\n  const drawBody=()=>{\n');

rep(`  const list=()=>{
    view='list';`, `  const list=()=>keepScroll(root,list0);
  const list0=()=>{
    view='list';`);
rep(`  const paintPM=()=>{
    const box=$('#pmbox',root);if(!box)return;`, `  const paintPM=()=>keepScroll(root,paintPM0);
  const paintPM0=()=>{
    const box=$('#pmbox',root);if(!box)return;`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
