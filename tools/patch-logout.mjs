// Log everyone out: sessions issued before SESSIONS_VALID_AFTER are refused (no secret change needed).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/backend/src/index.js';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };
const NOW = Date.now();
rep(`async function readToken(env, req) {`, `/* Every sign-in session issued before this moment is refused, so everyone has to sign in again (launch reset, ${new Date(NOW).toISOString()}). The env value SESSIONS_VALID_AFTER can move it later. */
const SESSIONS_VALID_AFTER = ${NOW};
async function readToken(env, req) {`);
rep(`    return p.sub && p.exp > Date.now() ? p : null;          // sign-in sessions only (X proofs and OAuth state carry no "sub")`,
    `    if (p.sub && p.exp - SESSION_MS < (Number(env.SESSIONS_VALID_AFTER) || SESSIONS_VALID_AFTER)) return null;   // signed in before the launch reset
    return p.sub && p.exp > Date.now() ? p : null;          // sign-in sessions only (X proofs and OAuth state carry no "sub")`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok', NOW);
