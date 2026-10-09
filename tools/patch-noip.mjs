// Removes every trace of IP / location from the admin page and the visitor wording on the site.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (file, fn) => { const p = root + file; let t = fs.readFileSync(p, 'utf8'); t = fn(t); fs.writeFileSync(p, t); };
const must = (t, s) => { if (!t.includes(s)) throw new Error('missing: ' + s.slice(0, 70)); };

edit('admin.html', (t) => {
  // map + recent-IP sections
  const a = t.indexOf('  <section class="sec"><h2>Where people log on from');
  const b0 = t.indexOf('  <section class="sec"><h2>Recent visitors');
  const b = t.indexOf('</section>', b0) + '</section>'.length;
  if (a < 0 || b0 < 0 || b <= a) throw new Error('sections');
  t = t.slice(0, a).replace(/\s+$/, '\n') + t.slice(b).replace(/^\s*\n/, '');
  // map css
  t = t.replace(/^#mapbox\{.*\r?\n#map\{.*\r?\n#mtip\{.*\r?\n\.mleg\{.*\r?\n/m, '');
  // map js
  const j1 = t.indexOf('/* ---------- world map (dot matrix) ---------- */');
  const j2 = t.indexOf('/* ---------- actions ---------- */');
  if (j1 < 0 || j2 <= j1) throw new Error('map js');
  t = t.slice(0, j1) + t.slice(j2);
  t = t.replace(/  \/\/ ips\r?\n  \$\('#ips'\).*\r?\n/, '');
  t = t.replace(/  drawMap\(\);\r?\n/, '');
  must(t, '<th>IP address</th>'); t = t.replace('<th>IP address</th>', '');
  const cell = '<td style="font-size:11px">${esc(u.ip||"unknown")}</td>'; must(t, cell); t = t.replace(cell, '');
  t = t.replace(/Glyph \+ X \+ IP/g, 'Glyph + X');
  must(t, 'loadLand().then(()=>refresh());refresh();'); t = t.replace('loadLand().then(()=>refresh());refresh();', 'refresh();');
  t = t.replace('let timer=null,DATA=null,LAND=null,busy=false;', 'let timer=null,DATA=null,busy=false;');
  t = t.replace(/Top 9 app/g, 'Top 5 app');
  if (/\bip\b|IP address|landmask|drawMap|loadLand|mcount/.test(t.replace(/script|skip|zip/g, ''))) {
    const m = t.match(/.{40}(\bip\b|IP address|landmask|drawMap|loadLand|mcount).{40}/); console.log('WARNING leftover:', m && m[0]);
  }
  return t;
});

edit('index.html', (t) => {
  const old = 'Like most websites, we count visitors: when you open the site we record an anonymous browser ID, your IP address and the approximate place (city and country) your connection comes from, and we keep only the most recent records.';
  must(t, old);
  return t.replace(old, 'Like most websites, we count visitors: when you open the site we record an anonymous browser ID and the time of your visit. Our servers do not store your IP address or your location.');
});
console.log('ok');
