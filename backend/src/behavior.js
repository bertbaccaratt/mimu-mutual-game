/* Bot detection for verified runs.
 *
 * The server replays every run, so it can look at HOW it was played, not just the final score. Three signals, all
 * judged from the recorded inputs (never from anything the browser claims):
 *
 *   metronome      nearly every input lands on the same beat (tick modulo k). A script that checks the game every
 *                  N frames does this; a human's presses are spread evenly across the beat.
 *   uniform-jumps  jumps and slides are triggered at almost exactly the same distance from the obstacle, over and over.
 *   flawless       four minutes or more at top speed without a single hit.
 *
 * A flagged run is not rejected. It is verified and stored, but held out of the leaderboard until a person releases it.
 * Thresholds are deliberately strict so honest players are very unlikely to be held.
 */
const D0 = 4;

export function newStats() { return { n: 0, last: -99, res: {}, jn: 0, js: 0, jq: 0 }; }

/* call just before an input is applied (S = the sim state at that moment) */
export function observe(st, S, tick, code) {
  if (code > 3) return;                                   // second-wind choices aren't gameplay timing
  const gap = tick - st.last; st.last = tick;
  if (gap >= 5) {                                         // ignore key-repeat bursts
    st.n++;
    for (let k = 2; k <= 16; k++) { const a = st.res[k] || (st.res[k] = new Array(k).fill(0)); a[tick % k]++; }
  }
  if (code === 2 || code === 3) {                         // jump / slide: how far was the obstacle when it was triggered?
    let best = 1e9;
    for (const o of S.obj) {
      if (o.hit || o.dead || Math.abs(o.x - S.lane) >= .5) continue;
      if (!((code === 2 && o.t === 'chair') || (code === 3 && o.t === 'banner'))) continue;
      const dz = o.z - S.dist;
      if (dz > D0 + .2 && dz < 26 && dz < best) best = dz;
    }
    if (best < 1e9) { st.jn++; st.js += best; st.jq += best * best; }
  }
}

/* final judgement: returns a list of reasons (empty = looks human) */
export function judge(st, S, ticks, min = 40) {      // min = how many inputs are needed before timing is judged (lowered only on the test server)
  const reasons = [];
  if (st.n >= min) {
    for (let k = 2; k <= 16; k++) {
      const a = st.res[k]; if (!a) continue;
      if (Math.max(...a) / st.n >= .85) { reasons.push('metronome(k=' + k + ')'); break; }
    }
  }
  if (st.jn >= Math.min(30, min)) {
    const mean = st.js / st.jn, sd = Math.sqrt(Math.max(0, st.jq / st.jn - mean * mean));
    if (sd < .35) reasons.push('uniform-jumps(sd=' + sd.toFixed(2) + ')');
  }
  if (ticks >= 14400 && S.lives === 3 && !S.revived && S.speed >= 22) reasons.push('flawless');
  return reasons;
}
