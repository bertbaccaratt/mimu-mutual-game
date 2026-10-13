// The secret code check (no network): spaces and capitals do not matter, the text only has to contain the code,
// it has to go to the Hype account (@morethenhype) after the number was found, and nothing is returned without the server secret.
//   node test-secret-code.mjs
import { codeMatches, codeCheck } from './src/secret.js';
const ok = (n, c, x = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) process.exitCode = 1; };
const CODE = 'OPEN SESAME';        // a throwaway code for these tests; the real one lives only on the server (SECRET_CODE)

ok('exact', codeMatches('OPEN SESAME', CODE));
ok('lower case', codeMatches('open sesame', CODE));
ok('mixed case', codeMatches('Open Sesame', CODE));
ok('no spaces', codeMatches('opensesame', CODE));
ok('extra spaces', codeMatches('  open    sesame ', CODE));
ok('spaces in odd places', codeMatches('op en ses ame', CODE));
ok('inside a longer text', codeMatches('hey hype!! open sesame. found it', CODE));
ok('on its own line', codeMatches('hello\nopen sesame\nthanks', CODE));
ok('a wrong code does not match', !codeMatches('open barley', CODE));
ok('part of the code does not match', !codeMatches('open', CODE));
ok('empty text does not match', !codeMatches('', CODE));
ok('no code configured never matches', !codeMatches('anything', '') && !codeMatches('', ''));

// a tiny fake database: players, then the winner's texts
const HYPE_ADDR = '0xhypeaccount', WIN = '0xwinner', OTHER = '0xother';
const mk = (msgs, players) => ({
  SECRET_CODE: CODE,
  DB: { prepare: (sql) => ({ bind: (...a) => ({
    first: async () => /FROM players/.test(sql) ? (players.find((p) => p.x === a[0]) ? { address: players.find((p) => p.x === a[0]).address } : null) : null,
    all: async () => ({ results: msgs.filter((m) => m.sender === a[0] && m.recipient === a[1] && m.ts >= a[2]).sort((x, y) => x.id - y.id) }),
  }) }) },
});
const players = [{ x: 'morethenhype', address: HYPE_ADDR }];
const found = { a: WIN, t: 1000 };

let r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'open sesame' }], players), found);
ok('winner texts the code to the Hype account: correct', r.codeOk === true && r.codeAt === 2000 && r.codeText === 'open sesame', JSON.stringify(r));

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'oPeN  sEsAmE!!' }], players), found);
ok('any spacing and capitals count', r.codeOk === true);

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'hi' }, { id: 2, ts: 3000, sender: WIN, recipient: HYPE_ADDR, body: 'open sesame' }], players), found);
ok('a wrong text first, then the right one: correct', r.codeOk === true && r.codeAt === 3000);

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'open barley' }], players), found);
ok('wrong code: no check mark', !r.codeOk);

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: OTHER, body: 'open sesame' }], players), found);
ok('the right code sent to someone else: no check mark', !r.codeOk);

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: OTHER, recipient: HYPE_ADDR, body: 'open sesame' }], players), found);
ok('another player sending the code: no check mark (only the finder counts)', !r.codeOk);

r = await codeCheck(mk([{ id: 1, ts: 500, sender: WIN, recipient: HYPE_ADDR, body: 'open sesame' }], players), found);
ok('a text sent before the number was found does not count', !r.codeOk);

r = await codeCheck(Object.assign(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'open sesame' }], players), { SECRET_CODE: '' }), found);
ok('no secret configured: nothing is returned', !r.codeOk);

r = await codeCheck(mk([{ id: 1, ts: 2000, sender: WIN, recipient: HYPE_ADDR, body: 'open sesame' }], []), found);
ok('Hype account not found: nothing is returned', !r.codeOk);

