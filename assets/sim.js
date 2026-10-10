/* Chair Run simulation core.
 *
 * Pure game logic, no DOM and no audio. The browser plays the game with it, and the leaderboard server replays the
 * same code from the run's seed and the player's recorded inputs to work out the real score. A run can only be
 * submitted as inputs, never as a score, so scores can't be made up.
 *
 * Everything that matters is deterministic: a seeded random generator, fixed 1/60 s ticks, and no Math.random.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MimuSim = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DT = 1 / 60, FAR = 72, NEAR = 2.55, D0 = 4, G = 24;
  const CHAIR_H = [.85, 1.0, .95, 1.0, 1.25, 1.0, .8, 1.6];
  const BETA = { safe: .1, hard: -.3, bal: .5, growth: 1, degen: 1.5 };
  const ASSETS = [
    { sym: 'BILLS', c: 'safe', mu: .001, sg: .004 }, { sym: 'STBL', c: 'safe', mu: .0014, sg: .006 },
    { sym: 'GOLD', c: 'hard', mu: .002, sg: .024 }, { sym: 'VAULT', c: 'hard', mu: .0016, sg: .02 },
    { sym: 'TMKT', c: 'bal', mu: .0024, sg: .03 }, { sym: 'DIVS', c: 'bal', mu: .002, sg: .022 },
    { sym: 'CHAIN', c: 'growth', mu: .0046, sg: .062 }, { sym: 'AIINF', c: 'growth', mu: .0052, sg: .07 },
    { sym: 'APE', c: 'growth', mu: .0044, sg: .068 }, { sym: 'DENG', c: 'degen', mu: .003, sg: .12 },
    { sym: 'MEME', c: 'degen', mu: .002, sg: .16 }, { sym: 'LEV3', c: 'degen', mu: .004, sg: .2 },
    { sym: 'PRE', c: 'degen', mu: .0044, sg: .13 }
  ];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const BY_SYM = {}; ASSETS.forEach((a) => { BY_SYM[a.sym] = a; });

  /* input codes recorded for a run */
  const ACT = { L: 0, R: 1, U: 2, D: 3, REVIVE: 4, DECLINE: 5 };
  const ACT_NAME = ['L', 'R', 'U', 'D'];

  function create(seed, opts) {
    opts = opts || {};
    const wallet = Math.max(0, Math.floor(opts.wallet || 0));
    let rs = (seed >>> 0) || 1;
    const rand = () => {                                            // mulberry32
      rs = (rs + 0x6D2B79F5) | 0;
      let t = Math.imul(rs ^ (rs >>> 15), 1 | rs);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const wpick = (w) => { let s = 0; for (const x of w) s += x; let x = rand() * s; for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; };
    const rp = (a) => a[Math.floor(rand() * a.length)];
    const shuffle3 = () => { const a = [-1, 0, 1]; for (let i = 2; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };

    const S = {
      dist: 0, speed: 11, lane: 0, px: 0, vx: 0, py: 0, vy: 0, slide: 0, lives: 3, shield: 0, magnet: 0, mult: 0,
      coins: 0, score: 0, inv: 0, time: 0, obj: [], pend: [], spawnZ: 55, gateZ: 650, cleared: [0, 0, 0, 0, 0, 0, 0, 0],
      slow: 0, combo: 0, cid: 0, weather: 0, chain: 0, ct: 0, mxChain: 0, revived: false, nextMs: 250, cm: 1, buf: 0,
      tick: 0, dead: false, wait: null, walletPaid: 0,
    };
    let ev = [];
    const emit = (t, a, b) => { ev.push(b === undefined ? (a === undefined ? { t } : { t, ...a }) : { t, a, b }); };

    /* ---- chain ---- */
    function gain(n) {
      S.chain += n; S.ct = 4; S.mxChain = Math.max(S.mxChain, S.chain);
      const m = Math.min(5, 1 + Math.floor(S.chain / 10));
      if (m > S.cm) emit('chainup', { m });
      S.cm = m; emit('pop');
    }
    function breakChain() { if (S.chain >= 10) emit('chainbreak'); S.chain = 0; S.cm = 1; S.ct = 0; }

    /* ---- spawning ---- */
    /* every world object has the same fields, so the engine can run the tick loop fast */
    const mk = (t, x, z) => { const o = { id: S.cid++, t, x, y: 0, z, type: 0, h: 0, roll: false, dead: false, hit: false, clr: false, k: '', opts: null, w: 0, f: 0, done: false, pick: 0 }; S.obj.push(o); return o; };
    const chair = (l, z, roll) => { const d = Math.min(1, S.dist / 3500); const t = wpick([34, 22, 24, 16, 7 + d * 3, 5 + d * 4, 3 + d * 3, 1 + d * 6]); const o = mk('chair', l, z); o.type = t; o.h = CHAIR_H[t]; o.roll = !!roll; return o; };
    const coin = (l, z, y) => { const o = mk('coin', l, z); o.y = y === undefined ? .6 : y; return o; };
    const coinLine = (l, z, n) => { for (let i = 0; i < n; i++) coin(l, z + i * 1.6); };
    const coinArc = (l, z, n) => { for (let i = 0; i < n; i++) { const k = i / (n - 1); coin(l, z + i * 1.4, .55 + Math.sin(k * Math.PI) * 1.9); } };
    const other = (l) => rp([-1, 0, 1].filter((x) => x !== l));
    function pattern() {
      const z = S.spawnZ, d = Math.min(1, S.dist / 3500), r = rand(), L = Math.floor(rand() * 3) - 1; let len = 8;
      if (r < .2) { chair(L, z); coinLine(other(L), z - 3, 6); len = 9; }
      else if (r < .36) { [-1, 0, 1].forEach((l) => { if (l !== L) chair(l, z); }); coinLine(L, z - 3, 7); len = 9; }
      else if (r < .5) { chair(L, z); coinArc(L, z - 4, 8); len = 10; }
      else if (r < .62) { const n = 1 + (d > .35 && rand() < .6 ? 1 : 0); const ls = shuffle3().slice(0, n); ls.forEach((l) => mk('banner', l, z)); coinLine(other(ls[0]), z - 2, 5); len = 7; }
      else if (r < .74) { let l = rand() < .5 ? -1 : 1; for (let i = 0; i < 3; i++) { chair(l, z + i * 8); coinLine(0, z + i * 8 + 3, 3); l = -l; } len = 22; }
      else if (r < .83 && d > .15) { [-1, 0, 1].forEach((l) => chair(l, z)); coinArc(0, z - 4, 8); len = 10; }
      else if (r < .9 && d > .12) { chair(L, z + 12, true); coinLine(other(L), z, 6); len = 10; }
      else { let l = L; for (let i = 0; i < 2; i++) { coinLine(l, z + i * 7, 5); l = other(l); } len = 14; }
      if (rand() < .11) { const k = rp(['magnet', 'shield', 'x2']), px = rp([-1, 0, 1]); const o = mk('pick', px, z - 5); o.k = k; }
      S.spawnZ += len + Math.max(7, S.speed * (1.15 - .45 * d));
    }
    function spawnGate() {
      const pick = (cs) => rp(ASSETS.filter((a) => cs.includes(a.c)));
      const opts3 = [pick(['safe', 'hard']), pick(['bal', 'growth']), pick(['degen', 'growth'])];
      const w = clamp(S.weather * .5 + gauss() * .6, -1, 1); S.weather = w;
      { const g = mk('gate', 0, S.gateZ); g.opts = opts3; g.w = w; g.f = clamp(w * .7 + gauss() * .4, -1, 1); }
      for (let l = -1; l <= 1; l++) coinLine(l, S.gateZ - 9, 3);
      S.gateZ += 900;
    }

    /* ---- input ---- */
    function act(a) {
      if (S.dead || S.wait) return;
      if (a === 'L' && S.lane > -1) { S.lane--; emit('lane'); }
      else if (a === 'R' && S.lane < 1) { S.lane++; emit('lane'); }
      else if (a === 'U' && S.py < .05) { S.vy = 9.4; S.slide = 0; S.buf = 0; emit('jump'); }
      else if (a === 'U' && S.vy <= 0 && S.py < 1.4) { S.buf = .16; }
      else if (a === 'D') { if (S.py > .05) { S.vy = -16; } else if (S.slide <= 0) { S.slide = .65; emit('slide'); } }
    }

    /* ---- hits, second wind, closing bell ---- */
    function hit(o) {
      o.hit = true; if (S.inv > 0) return;
      if (S.shield > 0) { S.shield = 0; S.inv = 1.2; emit('shield'); return; }
      S.lives--; S.inv = 1.5; S.slow = 1.1; S.combo = 0; breakChain(); emit('hit');
      if (S.lives <= 0) {
        if (!S.revived && S.coins + wallet >= 30) { S.wait = 'revive'; emit('offer'); }
        else { S.dead = true; emit('dead'); }
      } else emit('msg', S.lives === 1 ? '⚠ Last chance' : '💥 Stumble', 'bad');
    }
    function revive() {
      if (S.wait !== 'revive') return false;
      const a = Math.min(30, S.coins); S.coins -= a; S.walletPaid = 30 - a;
      S.revived = true; S.lives = 1; S.inv = 2.6; S.slow = .8; S.wait = null;
      S.obj = S.obj.filter((o) => o.t === 'gate' || o.z - S.dist > D0 + 22);
      emit('revived'); return true;
    }
    function decline() { if (S.wait === 'revive') { S.wait = null; S.dead = true; emit('dead'); } }
    function resolveGate(g) {
      const a = g.a, ret = a.mu + BETA[a.c] * g.f * .035 + a.sg * gauss();
      let d = Math.round((20 + S.coins) * ret * 9); d = Math.max(d, -S.coins);
      S.coins += d; S.score += d * 10;
      emit('bell', { sym: a.sym, ret, d });
    }

    /* ---- one fixed tick ---- */
    function step() {
      if (S.dead || S.wait) return false;
      const dt = DT;
      S.tick++; S.time += dt;
      /* the first 3 minutes ramp exactly as before (11 + 1 per 230 m, up to 23). After that the top speed steps up +0.5 every 3 minutes, to a ceiling of 30 at minute 42, so long runs keep tightening. */
      const stairs = Math.min(7, .5 * Math.floor(S.tick / 10800));
      const target = (Math.min(23, 11 + S.dist / 230) + stairs) * (S.slow > 0 ? .62 : 1);
      S.speed += (target - S.speed) * Math.min(1, dt * 1.6); S.slow = Math.max(0, S.slow - dt);
      S.dist += S.speed * dt;
      S.px += (S.lane - S.px) * Math.min(1, dt * 13); S.vx = S.lane - S.px;
      if (S.py > 0 || S.vy > 0) { S.vy -= G * dt; S.py += S.vy * dt; if (S.py <= 0) { S.py = 0; if (S.vy < -6) emit('land'); S.vy = 0; } }
      if (S.buf > 0) { S.buf -= dt; if (S.py < .05 && S.vy === 0) { S.buf = 0; act('U'); } }
      if (S.slide > 0) S.slide -= dt; S.inv = Math.max(0, S.inv - dt);
      if (S.magnet > 0) S.magnet -= dt; if (S.mult > 0) S.mult -= dt;
      while (S.spawnZ < S.dist + FAR) pattern();
      if (S.gateZ < S.dist + FAR) spawnGate();
      const mult = S.mult > 0 ? 2 : 1;
      for (const o of S.obj) {
        if (o.roll) o.z -= 7 * dt;
        const dz = o.z - S.dist;
        if (dz > D0 + 12 && !o.roll) continue;                       // nothing out there can touch the runner yet
        if (o.t === 'coin' && S.magnet > 0 && dz < D0 + 11 && dz > D0 - 1) { o.x += (S.px - o.x) * Math.min(1, dt * 9); o.y += (.7 - o.y) * Math.min(1, dt * 5); o.z -= (dz - D0) * Math.min(1, dt * 3); }
        if (o.dead) continue;
        const inx = Math.abs(o.x - S.px);
        if (o.t === 'coin') {
          if (dz < D0 + .55 && dz > D0 - .6 && inx < .65 && Math.abs(o.y - (S.py + .7)) < 1.15) {
            o.dead = true; S.coins += mult; S.combo++; S.score += 10 * mult * S.cm; gain(1); emit('coin', { x: o.x, y: o.y, z: o.z, combo: S.combo });
          }
        } else if (o.t === 'pick') {
          if (dz < D0 + .6 && dz > D0 - .6 && inx < .7) {
            o.dead = true;
            if (o.k === 'magnet') S.magnet = 9; else if (o.k === 'shield') S.shield = 1; else S.mult = 10;
            emit('pick', { k: o.k, x: o.x, z: o.z });
          }
        } else if (o.t === 'chair' || o.t === 'banner') {
          if (!o.hit && dz < D0 + .45 && dz > D0 - .45 && inx < .62) { const bad = o.t === 'chair' ? S.py < o.h * .82 : !(S.slide > 0 && S.py < .25); if (bad) hit(o); }
          if (!o.hit && !o.clr && dz < D0 - .55) {
            o.clr = true;
            if (o.t === 'chair' && inx < .7 && S.py > .2) {
              S.cleared[o.type]++; S.score += 15 * mult * S.cm; S.combo = 0; gain(3);
              let n = 0; for (const c of S.cleared) n += c;
              emit('hop', { nice: S.chain % 5 < 3 && n % 5 === 0 });
            }
          }
        } else if (o.t === 'gate') {
          if (!o.done && dz < D0) { o.done = true; o.pick = clamp(Math.round(S.px), -1, 1) + 1; const a = o.opts[o.pick]; S.pend.push({ a, f: o.f, at: o.z + 110 }); emit('vote', { sym: a.sym }); }
        }
        if (S.dead || S.wait) break;                                  // a fatal hit ends the tick
      }
      for (const p of S.pend) { if (!p.res && S.dist >= p.at) { p.res = true; resolveGate(p); } }
      { let w = 0; for (let i = 0; i < S.pend.length; i++) { const p = S.pend[i]; if (!p.res) S.pend[w++] = p; } S.pend.length = w; }
      { let w = 0; const lim = S.dist + NEAR - 2; for (let i = 0; i < S.obj.length; i++) { const o = S.obj[i]; if (o.z > lim && !o.dead) S.obj[w++] = o; } S.obj.length = w; }
      S.score += S.speed * dt * mult * S.cm;
      if (S.chain > 0) { S.ct -= dt; if (S.ct <= 0) breakChain(); }
      if (S.dist >= S.nextMs) { const k = Math.round(S.nextMs / 250), b = 50 * k * S.cm; S.nextMs += 250; S.score += b; emit('mile', { m: Math.round(S.nextMs - 250), b }); }
      return true;
    }

    /* ---- save / load (the server replays a run in short chunks) ---- */
    function snapshot() {
      return JSON.stringify({
        rs, S: Object.assign({}, S, {
          obj: S.obj.map((o) => (o.t === 'gate' ? Object.assign({}, o, { opts: o.opts.map((a) => a.sym) }) : o)),
          pend: S.pend.map((p) => Object.assign({}, p, { a: p.a.sym })),
        }),
      });
    }
    function restore(str) {
      const d = JSON.parse(str); rs = d.rs >>> 0;
      Object.keys(S).forEach((k) => delete S[k]);
      Object.assign(S, d.S);
      S.obj = S.obj.map((o) => (o.t === 'gate' ? Object.assign({}, o, { opts: o.opts.map((s) => BY_SYM[s]) }) : o));
      S.pend = S.pend.map((p) => Object.assign({}, p, { a: BY_SYM[p.a] }));
    }

    return {
      S, step, act, revive, decline, snapshot, restore,
      drain() { const e = ev; ev = []; return e; },
    };
  }

  /* apply one recorded input code to a sim */
  function applyCode(sim, code) {
    if (code === ACT.REVIVE) sim.revive();
    else if (code === ACT.DECLINE) sim.decline();
    else if (code >= 0 && code <= 3) sim.act(ACT_NAME[code]);
  }

  /* bump this whenever the rules change: the server only accepts runs from a game page on the same version */
  const VERSION = 2;
  return { create, applyCode, ACT, DT, ASSETS, CHAIR_H, VERSION };
});
