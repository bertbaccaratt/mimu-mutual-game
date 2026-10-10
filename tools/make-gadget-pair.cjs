// Cuts the powered-off and powered-on Mimu keychain photos out of their white backdrops and registers the ON photo onto the OFF photo,
// so swapping between them on the desk keeps the body exactly in place.
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'backend', 'node_modules', 'sharp'));
const [OFF, ON, OUT_OFF, OUT_ON, PREVIEW] = process.argv.slice(2);

async function cutout(src) {
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const R = (i) => data[i * 3], G = (i) => data[i * 3 + 1], B = (i) => data[i * 3 + 2];
  const mn = (i) => Math.min(R(i), G(i), B(i));
  const sat = (i) => Math.max(R(i), G(i), B(i)) - mn(i);
  const TH = 236, cand = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const y = (i / W) | 0;
    cand[i] = (((mn(i) >= TH && sat(i) <= 16) || (y >= 945 && mn(i) >= 55 && sat(i) <= 22) || (y >= 870 && mn(i) >= 170 && sat(i) <= 22) || (y >= 925 && mn(i) >= 70 && sat(i) <= 26))) ? 1 : 0;
  }
  const comp = new Int32Array(N).fill(-1), sizes = [], touch = [], cx = [], cy = [];
  const q = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (!cand[s] || comp[s] >= 0) continue;
    let h = 0, t = 0; q[t++] = s; const id = sizes.length; comp[s] = id; let size = 0, tb = false, sx = 0, sy = 0;
    while (h < t) {
      const i = q[h++]; size++;
      const x = i % W, y = (i / W) | 0; sx += x; sy += y;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) tb = true;
      if (x > 0 && cand[i - 1] && comp[i - 1] < 0) { comp[i - 1] = id; q[t++] = i - 1; }
      if (x < W - 1 && cand[i + 1] && comp[i + 1] < 0) { comp[i + 1] = id; q[t++] = i + 1; }
      if (y > 0 && cand[i - W] && comp[i - W] < 0) { comp[i - W] = id; q[t++] = i - W; }
      if (y < H - 1 && cand[i + W] && comp[i + W] < 0) { comp[i + W] = id; q[t++] = i + W; }
    }
    sizes.push(size); touch.push(tb); cx.push(sx / size); cy.push(sy / size);
  }
  // background = big components outside the screen area (a lit screen is bright too, but it is part of the product)
  const MIN_BG = 1800, bg = new Uint8Array(N);
  const isBg = sizes.map((s, k) => s >= MIN_BG && (touch[k] || !(cx[k] > 300 && cx[k] < 730 && cy[k] > 340 && cy[k] < 780)));
  for (let i = 0; i < N; i++) if (comp[i] >= 0 && isBg[comp[i]]) bg[i] = 1;
  const dist = new Uint8Array(N).fill(255), BAND = 3;
  let frontier = [];
  for (let i = 0; i < N; i++) if (bg[i]) dist[i] = 0;
  for (let i = 0; i < N; i++) if (!bg[i]) {
    const x = i % W, y = (i / W) | 0;
    if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) { dist[i] = 1; frontier.push(i); }
  }
  for (let d = 2; d <= BAND; d++) {
    const next = [];
    for (const i of frontier) {
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && !bg[j] && dist[j] === 255) { dist[j] = d; next.push(j); }
    }
    frontier = next;
  }
  const out = Buffer.alloc(N * 4), BGC = 250;
  for (let i = 0; i < N; i++) {
    let a = 255, r = R(i), g = G(i), b = B(i);
    if (bg[i]) a = 0;
    else if (dist[i] <= BAND) {
      const m = mn(i), x = i % W, y = (i / W) | 0;
      let lo = 255;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx; if (bg[j]) continue; const v = mn(j); if (v < lo) lo = v;
      }
      const obj = Math.max(5, Math.min(170, lo));
      a = Math.max(0, Math.min(1, (BGC - m) / Math.max(40, BGC - obj))); a = a * a * (3 - 2 * a);
      if (a > 0.02) { const k = 1 - a; r = Math.max(0, Math.min(255, (r - k * BGC) / a)); g = Math.max(0, Math.min(255, (g - k * BGC) / a)); b = Math.max(0, Math.min(255, (b - k * BGC) / a)); }
      a = Math.round(a * 255);
    }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
  }
  return { out, W, H, N };
}
// the body + ears + loop (very dark and fully opaque) is used to register the two photos
function darkBox(c) {
  let minX = c.W, minY = c.H, maxX = 0, maxY = 0;
  for (let i = 0; i < c.N; i++) {
    const y = (i / c.W) | 0;
    if (c.out[i * 4 + 3] > 220 && Math.min(c.out[i * 4], c.out[i * 4 + 1], c.out[i * 4 + 2]) < 60) {
      const x = i % c.W; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
function trimBottom(buf, N, W, cut) {   // the contact shadow below the body is not part of the product
  for (let i = 0; i < N; i++) { const y = (i / W) | 0; if (y > cut) buf[i * 4 + 3] = 0; else if (y > cut - 4) buf[i * 4 + 3] = Math.min(buf[i * 4 + 3], Math.round(255 * (cut - y) / 4)); }
}
(async () => {
  const a = await cutout(OFF), b = await cutout(ON);
  const A = darkBox(a), Bx = darkBox(b);
  const s = ((A.w / Bx.w) + (A.h / Bx.h)) / 2;
  console.log('off box', JSON.stringify(A), 'on box', JSON.stringify(Bx), 'scale', s.toFixed(4));
  const bw = Math.round(b.W * s), bh = Math.round(b.H * s);
  const bScaled = await sharp(b.out, { raw: { width: b.W, height: b.H, channels: 4 } }).resize({ width: bw, height: bh, kernel: 'lanczos3' }).png().toBuffer();
  const offX = Math.round((A.minX + A.maxX) / 2 - ((Bx.minX + Bx.maxX) / 2) * s);
  const offY = Math.round((A.minY + A.maxY) / 2 - ((Bx.minY + Bx.maxY) / 2) * s);
  const canvas = { create: { width: a.W, height: a.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } };
  const cropL = Math.max(0, -offX), cropT = Math.max(0, -offY);
  const cropW = Math.min(bw - cropL, a.W - Math.max(0, offX)), cropH = Math.min(bh - cropT, a.H - Math.max(0, offY));
  const cropped = await sharp(bScaled).extract({ left: cropL, top: cropT, width: cropW, height: cropH }).png().toBuffer();
  const bFinal = await sharp(canvas).composite([{ input: cropped, left: Math.max(0, offX), top: Math.max(0, offY) }]).raw().toBuffer();
  trimBottom(a.out, a.N, a.W, A.maxY);       // cut the floor shadow at the same height of the body in both photos
  trimBottom(bFinal, a.N, a.W, A.maxY);
  const union = (buf) => { let x0 = a.W, y0 = a.H, x1 = 0, y1 = 0; for (let i = 0; i < a.N; i++) if (buf[i * 4 + 3] > 40) { const x = i % a.W, y = (i / a.W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, x1, y1 }; };
  const ua = union(a.out), ub = union(bFinal);
  const pad = 8, x0 = Math.max(0, Math.min(ua.x0, ub.x0) - pad), y0 = Math.max(0, Math.min(ua.y0, ub.y0) - pad), x1 = Math.min(a.W, Math.max(ua.x1, ub.x1) + pad), y1 = Math.min(a.H, Math.max(ua.y1, ub.y1) + pad);
  const box = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
  const save = async (buf, out) => sharp(buf, { raw: { width: a.W, height: a.H, channels: 4 } }).extract(box).resize({ width: 400 }).webp({ quality: 92, alphaQuality: 100 }).toFile(out);
  await save(a.out, OUT_OFF); await save(bFinal, OUT_ON);
  const m = await sharp(OUT_OFF).metadata(), m2 = await sharp(OUT_ON).metadata();
  console.log('box', JSON.stringify(box), 'off', m.width + 'x' + m.height, 'on', m2.width + 'x' + m2.height, 'shift', offX, offY);
  if (PREVIEW) {
    const g1 = await sharp(OUT_OFF).flatten({ background: '#6b4a2b' }).png().toBuffer();
    const g2 = await sharp(OUT_ON).flatten({ background: '#6b4a2b' }).png().toBuffer();
    const onHalf = await sharp(OUT_ON).composite([{ input: Buffer.from([0, 0, 0, 128]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in' }]).png().toBuffer();
    const blend = await sharp(g1).composite([{ input: onHalf }]).png().toBuffer();
    const row = await sharp({ create: { width: m.width * 3, height: m.height, channels: 3, background: '#000' } }).composite([{ input: g1, left: 0, top: 0 }, { input: g2, left: m.width, top: 0 }, { input: blend, left: m.width * 2, top: 0 }]).png().toBuffer();
    await sharp(row).toFile(PREVIEW);
  }
})();
