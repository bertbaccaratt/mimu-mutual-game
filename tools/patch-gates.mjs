// Server: never lock a real Mimu holder out because a side-check or one RPC is having a bad moment.
import fs from 'node:fs';
const base = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/';
const edit = (f, fn) => { let t = fs.readFileSync(base + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); t = fn(t); fs.writeFileSync(base + f, crlf ? t.split('\n').join('\r\n') : t); };
const rep = (t, a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 70)); return t.replace(a, () => b); };

edit('src/index.js', (t) => {
  t = rep(t, `  for (const k of Object.keys(g)) if (g[k]) out[k] = await holds(env, g[k], owner, k);
  let reason = '';`, `  for (const k of ['mimu', 'pass', 'dengs']) {
    if (!g[k]) continue;
    try { out[k] = await holds(env, g[k], owner, k); }
    catch (e) {
      if (k === 'mimu') throw e;                                      // cannot tell whether they hold a Mimu: ask them to retry
      console.error('side check unavailable', k, String(e && e.message || e));
      out[k] = false;                                                 // a blocker rule we cannot read right now never locks a holder out
    }
  }
  let reason = '';`);
  return t;
});
edit('wrangler.toml', (t) => {
  t = rep(t, 'RPC_33139 = "https://apechain.calderachain.xyz/http"', 'RPC_33139 = "https://apechain.calderachain.xyz/http,https://rpc.apechain.com/http,https://33139.rpc.thirdweb.com"   # several = automatic fallback');
  t = rep(t, 'simple = { limit = 10, period = 60 }', 'simple = { limit = 60, period = 60 }');
  return t;
});
console.log('ok');
