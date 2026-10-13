// Gallery: the photo of Mimu at the bus stop is added as the newest shot (p7). Older photos keep their positions.
import fs from 'node:fs';
const src = 'C:/Users/bertb/AppData/Local/Temp/claude/C--Users-bertb-OneDrive-Desktop-tmfxmimu/166456af-bf5a-4142-9f05-675368d7d62d/images/25.webp';
const root = new URL('../', import.meta.url);
fs.copyFileSync(src, new URL('assets/photos/p7.webp', root));
const p = new URL('index.html', root);
let t = fs.readFileSync(p, 'utf8');
const once = (a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 60)); t = t.replace(a, () => b); };
once("const PICS=[1,2,3,4,5,6].map(i=>'assets/photos/p'+i+'.webp');", "const PICS=[1,2,3,4,5,6,7].map(i=>'assets/photos/p'+i+'.webp');");
once('<button class="th" id="gal" aria-label="Open photos"><img src="assets/photos/p1.webp" alt="">', '<button class="th" id="gal" aria-label="Open photos"><img src="assets/photos/p7.webp" alt="">');
fs.writeFileSync(p, t);
console.log('photo 7 added');
