/* The secret phone line: did the player who found the number text the correct code to the Hype user account (@morethenhype)?
   The code lives only on the server (the SECRET_CODE secret). Spaces and capital letters do not matter, and the text only has to CONTAIN the code. */
export const normCode = (s) => String(s == null ? '' : s).toUpperCase().replace(/\s+/g, '');
export const codeMatches = (text, code) => { const c = normCode(code); return !!c && normCode(text).includes(c); };

/* finder = { a: wallet address of the player who found it, t: when they found it }. Returns {} unless a correct text exists. */
export async function codeCheck(env, finder) {
  const code = String(env.SECRET_CODE || '').trim();
  if (!code || !finder || !finder.a) return {};
  const handle = String(env.SECRET_HYPE_HANDLE || 'morethenhype').trim().toLowerCase();
  const hype = await env.DB.prepare('SELECT address FROM players WHERE lower(x_handle)=?1 LIMIT 1').bind(handle).first();
  if (!hype || !hype.address) return {};
  const rows = (await env.DB.prepare('SELECT ts, body FROM messages WHERE sender=?1 AND recipient=?2 AND ts>=?3 ORDER BY id ASC LIMIT 500').bind(finder.a, hype.address, finder.t || 0).all()).results || [];
  const hit = rows.find((m) => codeMatches(m.body, code));
  return hit ? { codeOk: true, codeAt: hit.ts, codeText: String(hit.body || '').slice(0, 280) } : {};
}
