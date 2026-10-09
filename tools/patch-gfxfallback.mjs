// Live picture fallback: when a player's game is not sending pictures (older page), rebuild it from the run state the server already verified.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/src/index.js';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };
rep(`        for (const r of top3) { const s = m[r.id]; if (s && s.state) { try { r.gfx = JSON.parse(s.state); r.sat = s.at; } catch { /* skip */ } } }`,
`        for (const r of top3) {
          const s = m[r.id];
          if (s && s.state && now - s.at < 8000) { try { r.gfx = JSON.parse(s.state); r.sat = s.at; continue; } catch { /* fall through */ } }
          try {                                                        // no fresh picture from the game: rebuild it from the last run state the server verified
            const run = await env.DB.prepare('SELECT seed, wallet, snapshot FROM runs WHERE id=?1').bind(r.id).first();
            if (run && run.snapshot) {
              const sim = Sim.create(run.seed, { wallet: run.wallet }); sim.restore(run.snapshot);
              const S = sim.S, ob = [];
              for (const o of S.obj) {
                if (o.dead) continue; const dz = o.z - S.dist; if (dz < -3 || dz > 70) continue;
                const c = o.t === 'chair' ? 'c' : o.t === 'banner' ? 'b' : o.t === 'coin' ? 'o' : o.t === 'pick' ? (o.k === 'magnet' ? 'm' : o.k === 'shield' ? 's' : 'x') : o.t === 'gate' ? 'g' : null;
                if (c) ob.push([c, o.x, dz, o.type | 0]);
              }
              ob.sort((a, b) => a[2] - b[2]);
              r.gfx = cleanState({ l: S.px, y: S.py, s: S.slide > 0, v: S.speed, d: S.dist, lv: S.lives, sh: S.shield > 0, mg: S.magnet > 0 ? Math.ceil(S.magnet) : 0, x2: S.mult > 0 ? Math.ceil(S.mult) : 0, ch: S.chain, cm: S.cm, ob });
              r.sat = now - 16000;                                    // the verified state is on average about half a piece old
              r.est = 1;
            }
          } catch (e) { console.error('picture rebuild', String(e && e.message || e)); }
        }`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
