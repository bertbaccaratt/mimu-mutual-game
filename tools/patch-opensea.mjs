// OpenSea app tile (right of X): a phone-view picture of the Mimu On Ape collection, with an Open on OpenSea button.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

const SHIP = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M11.2 3.6c.2-.4.7-.3.8.1.9 2.4 1.5 5 1.5 7.600 0 .3-.2.5-.5.5H6.100c-.4 0-.6-.4-.4-.7zM14.600 8.500c0-.2.3-.3.4-.1 1.600 1.600 3.200 3.900 4 5.800.1.2-.1.4-.3.4h-4.100c-.3 0-.5-.2-.5-.5zM4 15.200c0-.2.2-.3.3-.3h15.400c.3 0 .4.2.4.4-.4 2.300-2.200 4.100-4.500 4.100H9.100C6.300 19.400 4.100 17.600 4 15.200z"/></svg>';
rep(`  x:'<svg viewBox="0 0 24 24">`, `  os:'${SHIP}',\n  x:'<svg viewBox="0 0 24 24">`);

rep(`<div class="ic">\${IC.x}</div>X</button></div></div>`, `<div class="ic">\${IC.x}</div>X</button><button class="app-i ostile" data-open="os"><div class="ic">\${IC.os}</div>OpenSea</button></div></div>`);
rep(`mail:buildMail,x:buildX}`, `mail:buildMail,x:buildX,os:buildOS}`);
rep(`.xtile .ic svg{width:60%;height:60%}`, `.xtile .ic svg{width:60%;height:60%}
.xrow .ostile{grid-column:3}
.ostile .ic{background:linear-gradient(160deg,#3a96f0,#1868b7)!important;border:1px solid rgba(255,255,255,.22);box-shadow:0 0 0 1px rgba(255,255,255,.06),0 6px 16px rgba(0,0,0,.5)}
.ostile .ic svg{width:64%;height:64%}
.xapp .osw{aspect-ratio:750/1400;overflow:hidden}.xapp .osw img{display:block;width:100%;height:auto}`);

rep(`function buildTop5(root){
  if(!(API.on()`, `/* OpenSea app: a phone-view picture of the Mimu On Ape collection (opensea.io does not allow being shown inside another page) */
function buildOS(root){
  const URL_='https://opensea.io/collection/mimuonape';
  const logo='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#2081e2"/><path fill="#fff" d="M11.200 4.800c.2-.4.7-.3.8.1.8 2 1.300 4.200 1.300 6.400 0 .3-.2.5-.5.500H7c-.4 0-.6-.4-.4-.7zM14.400 9c0-.2.3-.3.4-.1 1.400 1.400 2.700 3.300 3.400 5 .1.2-.1.4-.3.4h-3.500c-.3 0-.5-.2-.5-.5zM5.400 15.400c0-.2.2-.3.3-.3h12.600c.3 0 .4.2.4.4-.3 1.900-1.900 3.400-3.800 3.400H9.200c-2.100 0-3.700-1.400-3.800-3.500z"/></svg>';
  root.innerHTML='<div class="xapp"><div class="xh">'+logo+'<div style="flex:1;min-width:0"><b>MIMU On Ape</b><span>OpenSea collection</span></div><a class="xopen" href="'+URL_+'" target="_blank" rel="noopener noreferrer">Open on OpenSea</a></div><div class="xbody"><div class="osw"><img src="assets/opensea-collection.jpg" alt="The MIMU On Ape collection on OpenSea: 5,555 items, floor price, volume and owners" width="750" height="1624" decoding="async"></div></div></div>';
  return{destroy(){}};
}
function buildTop5(root){
  if(!(API.on()`);

rep(`<div><b>Long-run badges</b>`, `<div><b>X and OpenSea</b><span>Two apps on the home screen show the Mimu On Ape pages on X and on OpenSea as phone-view pictures. Each has an Open button that takes you to the real page.</span></div>
        <div><b>Long-run badges</b>`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
