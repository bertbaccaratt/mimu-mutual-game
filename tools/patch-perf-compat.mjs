// Speed + browser-compatibility pass.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
let t = fs.readFileSync(root + 'index.html', 'utf8');
const must = (s) => { if (!t.includes(s)) throw new Error('missing: ' + s.slice(0, 70)); };

// 1. desk background: 852 KB JPEG -> ~300 KB WebP (same picture), preloaded early
if (!fs.existsSync(root + 'assets/desk.webp')) throw new Error('assets/desk.webp not built yet');
t = t.split('assets/desk.jpg').join('assets/desk.webp');
must('<link rel="icon" href="favicon.ico" sizes="48x48">');
t = t.replace('<link rel="icon" href="favicon.ico" sizes="48x48">', '<link rel="preload" as="image" href="assets/desk.webp" type="image/webp" fetchpriority="high">\n<link rel="preconnect" href="https://mimu-mutual-api.mutualmimu.workers.dev" crossorigin>\n<link rel="icon" href="favicon.ico" sizes="48x48">');

// 2. Safari needs the -webkit- prefix for backdrop-filter (older versions ignore the plain one)
t = t.replace(/-webkit-backdrop-filter:[^;}]+;?/g, '');
t = t.replace(/backdrop-filter:([^;}]+)/g, (m, v) => `-webkit-backdrop-filter:${v};backdrop-filter:${v}`);

// 3. browsers without dvh units fall back to vh
t = t.split('height:100dvh').join('height:100vh;height:100dvh');

// 4. stop iOS from inflating text on rotation
const s = t.indexOf('<style>');
if (s < 0) throw new Error('no <style>');
t = t.slice(0, s + 7) + '\nhtml{-webkit-text-size-adjust:100%;text-size-adjust:100%}' + t.slice(s + 7);

fs.writeFileSync(root + 'index.html', t);

// 5. the same prefix on the admin page, and a friendly 404 page
let a = fs.readFileSync(root + 'admin.html', 'utf8');
a = a.replace(/-webkit-backdrop-filter:[^;}]+;?/g, '').replace(/backdrop-filter:([^;}]+)/g, (m, v) => `-webkit-backdrop-filter:${v};backdrop-filter:${v}`);
fs.writeFileSync(root + 'admin.html', a);

fs.writeFileSync(root + '404.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Lost in the halls · Mimu</title><link rel="icon" href="/favicon.ico" sizes="48x48">
<style>html{background:#0b0907}body{margin:0;min-height:100vh;display:grid;place-items:center;color:#f2e7d0;font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px;background:radial-gradient(700px 400px at 50% 0,#2a1a10,transparent 70%),#0b0907}
h1{font:italic 700 64px/1 Georgia,serif;margin:0 0 8px;color:#d9b25f}p{margin:0 0 22px;color:#bfae8c}
a{display:inline-block;padding:13px 26px;border-radius:999px;background:linear-gradient(180deg,#f0d28a,#c4962f);color:#2a1a08;font-weight:700;text-decoration:none;letter-spacing:.06em}</style></head>
<body><main><h1>404</h1><p>This hall doesn&rsquo;t exist. The good chairs are back at the desk.</p><a href="/">Back to the desk</a></main></body></html>
`);
console.log('ok');
