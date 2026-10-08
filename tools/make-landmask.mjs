// Builds the dot-matrix world map used by admin.html.
//   cd tools && npm i --no-save world-atlas && node make-landmask.mjs > ../assets/landmask.txt
// Output: W H, then H rows of '0'/'1' (1 = land), equirectangular, row 0 = 85N, last row = 60S.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const topo = JSON.parse(fs.readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8'));

const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; }); });
const ring = (idx) => { const pts = []; for (const i of idx) { const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse(); for (let k = pts.length ? 1 : 0; k < a.length; k++) pts.push(a[k]); } return pts; };

const polys = [];                                    // each polygon: array of rings (first = outer)
const land = topo.objects.land;
const geoms = land.type === 'GeometryCollection' ? land.geometries : [land];
for (const g of geoms) {
  if (g.type === 'Polygon') polys.push(g.arcs.map(ring));
  else if (g.type === 'MultiPolygon') for (const p of g.arcs) polys.push(p.map(ring));
}
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const isLand = (x, y) => { for (const p of polys) { if (!inRing(x, y, p[0])) continue; let hole = false; for (let k = 1; k < p.length; k++) if (inRing(x, y, p[k])) { hole = true; break; } if (!hole) return true; } return false; };

const W = 180, TOP = 85, BOT = -60, STEP = 360 / W;
const H = Math.round((TOP - BOT) / STEP);
const rows = [];
for (let r = 0; r < H; r++) {
  const lat = TOP - (r + 0.5) * STEP; let s = '';
  for (let c = 0; c < W; c++) s += isLand(-180 + (c + 0.5) * STEP, lat) ? '1' : '0';
  rows.push(s);
}
console.log(W + ' ' + H + ' ' + TOP + ' ' + BOT);
console.log(rows.join('\n'));
