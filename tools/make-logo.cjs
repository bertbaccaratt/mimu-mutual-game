// Turns the uploaded "MUTUAL MIMU" artwork (white lettering on black) into a transparent wordmark.
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'backend', 'node_modules', 'sharp'));
const SRC = process.argv[2], OUT = process.argv[3], PREVIEW = process.argv[4];
(async () => {
  const meta = await sharp(SRC).metadata();
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const lum = (i) => (data[i * 4] * 299 + data[i * 4 + 1] * 587 + data[i * 4 + 2] * 114) / 1000;
  // flood fill the outside: dark pixels connected to the image border
  const bg = new Uint8Array(N), stack = [];
  const T = 70;
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (bg[i] || lum(i) > T) return; bg[i] = 1; stack.push(i); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) { const i = stack.pop(), x = i % W, y = (i / W) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  // soft edge: pixels next to the background fade by brightness so the white edge is not jagged
  const out = Buffer.alloc(N * 4);
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let i = 0; i < N; i++) {
    let a = 255;
    if (bg[i]) a = 0;
    else {
      const x = i % W, y = (i / W) | 0;
      const nb = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W]);
      if (nb) a = Math.max(0, Math.min(255, Math.round((lum(i) - 20) / 160 * 255)));
    }
    out[i * 4] = data[i * 4]; out[i * 4 + 1] = data[i * 4 + 1]; out[i * 4 + 2] = data[i * 4 + 2]; out[i * 4 + 3] = a;
    if (a > 40) { const x = i % W, y = (i / W) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const pad = 6;
  const box = { left: Math.max(0, minX - pad), top: Math.max(0, minY - pad), width: Math.min(W, maxX + pad) - Math.max(0, minX - pad), height: Math.min(H, maxY + pad) - Math.max(0, minY - pad) };
  const img = sharp(out, { raw: { width: W, height: H, channels: 4 } }).extract(box);
  await img.clone().resize({ height: 176 }).webp({ quality: 92, alphaQuality: 100 }).toFile(OUT);
  const o = await sharp(OUT).metadata();
  console.log('source', meta.width + 'x' + meta.height, 'box', JSON.stringify(box), 'output', o.width + 'x' + o.height);
  if (PREVIEW) await img.clone().resize({ height: 176 }).flatten({ background: '#6b4a2b' }).png().toFile(PREVIEW);
})();
