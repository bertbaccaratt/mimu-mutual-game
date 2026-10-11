// The asset table in the Chair Run help, laid out for the phone-width card: one line per asset
// (asset | average | worst 5% to best 5% | wipe-out). The risk dots sit in each class heading.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const esc = (h) => h.replace(/\n/g, '').replace(/"/g, '\\"');
const dots = (n) => '●'.repeat(n) + '○'.repeat(5 - n);
const row = (a, avg, rng, wipe) => `<div class="gtr"><b>${a}</b><em>${avg}</em><span>${rng}</span><span class="gtw${wipe === '0%' ? '' : ' hot'}">${wipe}</span></div>`;
const cls = (n, d) => `<div class="gtc"><span>${n}</span><span class="gtd">${dots(d)}</span></div>`;
const table = `<div class="gtab"><div class="gtr gth"><span>Asset</span><span>Avg</span><span>Worst 5% to best 5%</span><span>Wipe</span></div>
${cls('Safe', 1)}${row('BILLS', '+0.9%', '−6% to +7%', '0%')}${row('STBL', '+1.2%', '−8% to +11%', '0%')}
${cls('Hard asset', 2)}${row('GOLD', '+1.8%', '−35% to +38%', '0%')}${row('VAULT', '+1.5%', '−29% to +32%', '0%')}
${cls('Balanced', 2)}${row('TMKT', '+2.2%', '−45% to +49%', '0%')}${row('DIVS', '+1.8%', '−33% to +37%', '0%')}
${cls('Growth', 4)}${row('CHAIN', '+5.1%', '−92% to +100%', '4%')}${row('AIINF', '+6.1%', '−100% to +112%', '6%')}${row('APE', '+5.2%', '−100% to +108%', '5%')}
${cls('Degen', 5)}${row('DENG', '+13.6%', '−100% to +185%', '18%')}${row('MEME', '+22.8%', '−100% to +243%', '24%')}${row('LEV3', '+35.9%', '−100% to +304%', '29%')}${row('PRE', '+16.8%', '−100% to +201%', '19%')}</div>`;
const a = t.indexOf('<div class=\\"gtab\\">');
const b = t.indexOf('<p style=\\"margin-top:8px\\"><b>Wipe-out</b>');
if (a < 0 || b < a) throw new Error('table bounds');
t = t.slice(0, a) + esc(table) + t.slice(b);

const c0 = t.indexOf('.gtab{margin-top:8px;');
const c1 = t.indexOf('.mmk{display:grid;gap:7px;margin-top:9px;');
if (c0 < 0 || c1 < c0) throw new Error('css bounds');
t = t.slice(0, c0) + `.gtab{margin-top:8px;border-radius:12px;background:rgba(255,255,255,.04);padding:3px 7px 5px}
.gtab .gtr{display:grid;grid-template-columns:46px 38px 1fr 28px;gap:0 6px;align-items:center;padding:3px 0;border-top:1px solid rgba(255,255,255,.06);font:500 9px/1.3 var(--mono);color:var(--cream);white-space:nowrap}
.gtab .gtr b{color:#fff;font-weight:700;font-size:10px}
.gtab .gtr em{font-style:normal;font-weight:700;font-size:10px;color:var(--cc)}
.gtab .gtw{text-align:right;font-weight:700;color:var(--cream);opacity:.8}.gtab .gtw.hot{color:#ff8a80;opacity:1}
.gtab .gth{font:700 8px/1.25 var(--mono);letter-spacing:.04em;text-transform:uppercase;color:var(--cc);border-top:0;padding-bottom:4px}
.gtab .gtc{display:flex;justify-content:space-between;align-items:center;margin:6px 0 1px;font:800 9.5px var(--sans);letter-spacing:.1em;text-transform:uppercase;color:var(--cc)}
.gtab .gtd{font:500 9px var(--mono);letter-spacing:.02em;opacity:.9}
` + t.slice(c1);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
