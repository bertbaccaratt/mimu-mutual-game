// Gallery: the OpenSea email (file p11) and the mimuonape DM screenshot (file p12), in the order they were sent:
// ... 9, OpenSea email, corgi (file p10, already live), DM. Old photos keep their positions.
import fs from 'node:fs';
const imgs = 'C:/Users/bertb/AppData/Local/Temp/claude/C--Users-bertb-OneDrive-Desktop-tmfxmimu/166456af-bf5a-4142-9f05-675368d7d62d/images/';
const root = new URL('../', import.meta.url);
const take = (from, to) => {
  const b = fs.readFileSync(imgs + from);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(from + ' is not a webp');
  fs.copyFileSync(imgs + from, new URL('assets/photos/' + to, root));
  const v = b.toString('ascii', 12, 16) === 'VP8X' ? `${1 + b.readUIntLE(24, 3)}x${1 + b.readUIntLE(27, 3)}` : '';
  console.log(to, v, b.length + ' bytes');
};
take('28.webp', 'p11.webp');
take('30.webp', 'p12.webp');
const p = new URL('index.html', root);
let t = fs.readFileSync(p, 'utf8');
const once = (a, c) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 60)); t = t.replace(a, () => c); };
once("const PICS=[1,2,3,4,5,6,7,8,9,10].map(i=>'assets/photos/p'+i+'.webp');", "const PICS=[1,2,3,4,5,6,7,8,9,11,10,12].map(i=>'assets/photos/p'+i+'.webp');");
once('<img src="assets/photos/p10.webp" alt=""><b id="pn">', '<img src="assets/photos/p12.webp" alt=""><b id="pn">');
fs.writeFileSync(p, t);
console.log('photos added: gallery order is p1-p9, p11 (OpenSea email), p10 (corgi), p12 (DM)');
