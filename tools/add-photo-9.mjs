// Gallery: the cafe photo (laptop, latte, phone) is added as the newest shot (p9). Older photos keep their positions.
import fs from 'node:fs';
const src = 'C:/Users/bertb/AppData/Local/Temp/claude/C--Users-bertb-OneDrive-Desktop-tmfxmimu/166456af-bf5a-4142-9f05-675368d7d62d/images/27.webp';
const root = new URL('../', import.meta.url);
const b = fs.readFileSync(src);
if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not a webp');
fs.copyFileSync(src, new URL('assets/photos/p9.webp', root));
const p = new URL('index.html', root);
let t = fs.readFileSync(p, 'utf8');
const once = (a, c) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 60)); t = t.replace(a, () => c); };
once("const PICS=[1,2,3,4,5,6,7,8].map(i=>'assets/photos/p'+i+'.webp');", "const PICS=[1,2,3,4,5,6,7,8,9].map(i=>'assets/photos/p'+i+'.webp');");
once('<img src="assets/photos/p8.webp" alt=""><b id="pn">', '<img src="assets/photos/p9.webp" alt=""><b id="pn">');
fs.writeFileSync(p, t);
let dim = '';
if (b.toString('ascii', 12, 16) === 'VP8X') dim = `${1 + b.readUIntLE(24, 3)}x${1 + b.readUIntLE(27, 3)}`;
console.log('photo 9 added', dim, b.length + ' bytes');
