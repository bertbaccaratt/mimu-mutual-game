// Cuts the Mimu keychain gadget out of its white photo backdrop (soft matte, de-fringed, key rings and hole interiors kept/cleared properly).
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'backend', 'node_modules', 'sharp'));
const [SRC, OUT, PREVIEW] = process.argv.slice(2);
(async () => {
  const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const R = (i) => data[i * 3], G = (i) => data[i * 3 + 1], B = (i) => data[i * 3 + 2];
  const mn = (i) => Math.min(R(i), G(i), B(i));
  const sat = (i) => Math.max(R(i), G(i), B(i)) - mn(i);
  // 1) candidate background: bright and neutral
  const TH = 236;
  const cand = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const y = (i / W) | 0; cand[i] = (((mn(i) >= TH && sat(i) <= 16) || (y >= 945 && mn(i) >= 55 && sat(i) <= 22) || (y >= 870 && mn(i) >= 170 && sat(i) <= 22) || (y >= 925 && mn(i) >= 70 && sat(i) <= 26))) ? 1 : 0; }   // the floor shadow under the product also goes
  // 2) connected components of candidates; keep the big ones as true background (outer area, ring holes, gaps)
  const comp = new Int32Array(N).fill(-1), sizes = [];
  const q = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (!cand[s] || comp[s] >= 0) continue;
    let h = 0, t = 0; q[t++] = s; comp[s] = sizes.length; let size = 0;
    while (h < t) {
      const i = q[h++]; size++;
      const x = i % W, y = (i / W) | 0;
      if (x > 0 && cand[i - 1] && comp[i - 1] < 0) { comp[i - 1] = comp[s]; q[t++] = i - 1; }
      if (x < W - 1 && cand[i + 1] && comp[i + 1] < 0) { comp[i + 1] = comp[s]; q[t++] = i + 1; }
      if (y > 0 && cand[i - W] && comp[i - W] < 0) { comp[i - W] = comp[s]; q[t++] = i - W; }
      if (y < H - 1 && cand[i + W] && comp[i + W] < 0) { comp[i + W] = comp[s]; q[t++] = i + W; }
    }
    sizes.push(size);
  }
  const MIN_BG = 1800;
  const bg = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (comp[i] >= 0 && sizes[comp[i]] >= MIN_BG) bg[i] = 1;
  // 3) soft matte in a thin band around the background: partial alpha by how far from white, then remove the white spill from the colour
  const dist = new Uint8Array(N).fill(255);       // chessboard distance to background, capped
  const BAND = 3;
  let frontier = [];
  for (let i = 0; i < N; i++) if (bg[i]) { dist[i] = 0; }
  for (let i = 0; i < N; i++) if (!bg[i]) {
    const x = i % W, y = (i / W) | 0;
    if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W])) { dist[i] = 1; frontier.push(i); }
  }
  for (let d = 2; d <= BAND; d++) {
    const next = [];
    for (const i of frontier) {
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && !bg[j] && dist[j] === 255) { dist[j] = d; next.push(j); }
      }
    }
    frontier = next;
  }
  const out = Buffer.alloc(N * 4);
  const BGC = 250;
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let i = 0; i < N; i++) {
    let a = 255, r = R(i), g = G(i), b = B(i);
    if (bg[i]) a = 0;
    else if (dist[i] <= BAND) {
      const m = mn(i);
      // colour of the object right next to this edge pixel: the darkest value in a small window
      const x = i % W, y = (i / W) | 0;
      let lo = 255;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx; if (bg[j]) continue;
        const v = mn(j); if (v < lo) lo = v;
      }
      const obj = Math.max(5, Math.min(170, lo));
      a = Math.max(0, Math.min(1, (BGC - m) / Math.max(40, BGC - obj)));
      a = a * a * (3 - 2 * a);
      if (a > 0.02) {
        const k = 1 - a;
        r = Math.max(0, Math.min(255, (r - k * BGC) / a));
        g = Math.max(0, Math.min(255, (g - k * BGC) / a));
        b = Math.max(0, Math.min(255, (b - k * BGC) / a));
      }
      a = Math.round(a * 255);
    }
    { const yy = (i / W) | 0; if (yy > 962) a = 0; else if (yy > 958) a = Math.min(a, Math.round(255 * (962 - yy) / 4)); }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
    if (a > 40) { const x = i % W, y = (i / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const pad = 8;
  const box = { left: Math.max(0, minX - pad), top: Math.max(0, minY - pad) };
  box.width = Math.min(W, maxX + pad) - box.left; box.height = Math.min(H, maxY + pad) - box.top;
  const cut = sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract(box);
  await cut.clone().resize({ width: 400 }).webp({ quality: 92, alphaQuality: 100 }).toFile(OUT);
  const o = await sharp(OUT).metadata();
  console.log('components', sizes.length, 'bg>=min', sizes.filter((s) => s >= MIN_BG).length, 'box', JSON.stringify(box), '->', o.width + 'x' + o.height);
  if (PREVIEW) {
    const big = await cut.clone().png().toBuffer();
    await sharp({ create: { width: box.width * 2, height: box.height, channels: 4, background: '#7a5230' } })
      .composite([{ input: big, left: 0, top: 0 }, { input: await sharp(big).flatten({ background: '#1b1013' }).png().toBuffer(), left: box.width, top: 0 }])
      .resize({ width: 1400 }).png().toFile(PREVIEW);
  }
})();
