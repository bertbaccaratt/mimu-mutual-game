// Gallery: swap positions 8 and 10 (the latte and the OpenSea email). Files keep their names; only the order changes.
import fs from 'node:fs';
const p = new URL('../index.html', import.meta.url);
let t = fs.readFileSync(p, 'utf8');
const a = "const PICS=[1,2,3,4,5,6,7,8,9,11,10,12].map(i=>'assets/photos/p'+i+'.webp');";
if (t.split(a).length - 1 !== 1) throw new Error('gallery list not found');
t = t.replace(a, () => "const PICS=[1,2,3,4,5,6,7,11,9,8,10,12].map(i=>'assets/photos/p'+i+'.webp');");
fs.writeFileSync(p, t);
console.log('swapped: position 8 is now the OpenSea email (p11), position 10 is now the latte (p8)');
