// The call video already has FaceTime's own buttons drawn in. Drop the extra red button; make the video's red end button the real hang-up.
import fs from 'node:fs';
const p = new URL('../index.html', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const once = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 70)); t = t.replace(a, () => b); };
once('.ftb{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:30px 0 42px;display:flex;justify-content:center;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent)}\n', '');
once('.fte{width:68px;height:68px;border-radius:50%;background:#ff3b30;display:grid;place-items:center}.fte svg{width:30px;height:30px;transform:rotate(135deg)}',
  '.fte{position:absolute;z-index:2;left:50%;top:94.6%;width:76px;height:76px;margin:-38px 0 0 -38px;border-radius:50%;background:transparent}   /* sits over the red end button that is part of the video */');
const i = t.indexOf('<div class="ftb">'), j = t.indexOf("</div><button class=\"fta\"");
// the markup lives inside a JS string: find it by its pieces
const a = '<div class="ftb"><button class="fte" aria-label="End call"><svg';
const k = t.indexOf(a);
if (k < 0) throw new Error('ftb markup not found');
const e = t.indexOf('</svg></button></div>', k);
if (e < 0) throw new Error('ftb end not found');
t = t.slice(0, k) + '<button class="fte" aria-label="End call"></button>' + t.slice(e + '</svg></button></div>'.length);
fs.writeFileSync(p, t);
console.log('secret call: single hang-up button');

