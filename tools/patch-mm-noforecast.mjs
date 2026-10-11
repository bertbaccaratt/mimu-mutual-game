// Mutual Mimu "?" help: remove the Weather forecast card (and the tip that pointed at it).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const marker = '<span class=\\"mmi\\">☀</span><b>Weather forecast</b>';
const i = t.indexOf(marker);
if (i < 0 || t.indexOf(marker, i + 1) >= 0) throw new Error('forecast card marker');
const start = t.lastIndexOf('<div class=\\"fm', i);
const end = t.indexOf('<div class=\\"fm', i + marker.length);
if (start < 0 || end < 0) throw new Error('card bounds');
const removed = t.slice(start, end);
if (!/Weather forecast/.test(removed) || /The proxy ballot/.test(removed)) throw new Error('removed the wrong slice');
t = t.slice(0, start) + t.slice(end);
const tip = '<li>Check the forecast and its confidence before choosing growth or degen.</li>';
if (t.split(tip).length - 1 !== 1) throw new Error('tip');
t = t.replace(tip, '');
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('removed', removed.length, 'chars');
