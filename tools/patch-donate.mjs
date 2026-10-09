// $TMF gifts only work during the 24-hour donation window (Tue Oct 13 6:00 AM -> Wed Oct 14 6:00 AM Pacific), enforced by the server.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const edit = (f, fn) => { let t = fs.readFileSync(root + f, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n'); const rep = (a, b) => { if (!t.includes(a)) throw new Error(f + ' missing ' + a.slice(0, 80)); t = t.replace(a, () => b); }; fn(rep); fs.writeFileSync(root + f, crlf ? t.split('\n').join('\r\n') : t); };

edit('backend/src/index.js', (rep) => {
  rep(`async function handleSendStatus(env, req) {`, `/* The 24-hour donation window: opens when the alarm goes off (Tue Oct 13 2026, 6:00 AM Pacific) and ends when the campaign closes (Wed Oct 14, 6:00 AM Pacific). Staging overrides it so the tests can run. */
function donateWindow(env, now = Date.now()) {
  const num = (v, d) => (v != null && v !== '' && Number.isFinite(Number(v))) ? Number(v) : d;
  const from = num(env.DONATE_FROM, Date.UTC(2026, 9, 13, 13, 0, 0)), until = num(env.DONATE_UNTIL, Date.UTC(2026, 9, 14, 13, 0, 0));
  return { from, until, open: now >= from && now < until, state: now < from ? 'early' : now >= until ? 'closed' : 'open' };
}
async function handleSendStatus(env, req) {`);
  rep(`return json(env, req, { week, balance, rank, total: mine ? mine.sc : 0, top9: inTop, canSend: !inTop && balance > 0 });`,
      `const dw = donateWindow(env);
  return json(env, req, { week, balance, rank, total: mine ? mine.sc : 0, top9: inTop, canSend: dw.open && !inTop && balance > 0, donate: { open: dw.open, state: dw.state, from: dw.from, until: dw.until } });`);
  rep(`  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const to = String(b.to || '').toLowerCase(), all = b.all === true;`, `  const dw = donateWindow(env);
  if (!dw.open) return json(env, req, { error: dw.state === 'early' ? 'Donations are not open yet. They open when the alarm goes off, Tue Oct 13 at 6:00 AM PST, for 24 hours.' : 'The 24-hour donation window has closed.', donate: { open: false, state: dw.state, from: dw.from, until: dw.until } }, 403);
  let b = {}; try { b = await req.json(); } catch { return json(env, req, { error: 'bad json' }, 400); }
  const to = String(b.to || '').toLowerCase(), all = b.all === true;`);
});

edit('backend/wrangler.staging.toml', (rep) => {
  rep(`X_REQUIRED = "1"`, `DONATE_FROM = "0"            # staging: gifts always open so the tests can run
DONATE_UNTIL = "99999999999999"
X_REQUIRED = "1"`);
});

edit('index.html', (rep) => {
  rep(`    const all=T?T.rows:[],me=mine(),can=!!(st&&st.canSend);`, `    const all=T?T.rows:[],me=mine(),can=!!(st&&st.canSend);
    const dn=st&&st.donate?st.donate:{open:Date.now()>=ALARM_AT&&Date.now()<CAMPAIGN.close,state:Date.now()<ALARM_AT?'early':Date.now()>=CAMPAIGN.close?'closed':'open'};`);
  rep(`      :st.top9?\`<div class="card" style="border-color:rgba(224,103,95,.5)">`, `      :!dn.open?\`<div class="card" style="border-color:rgba(217,178,95,.5)"><div class="lbl" style="color:var(--gold)">\${dn.state==='early'?'Donations open soon':'Donations closed'}</div><div class="sub2" style="margin-top:4px">\${dn.state==='early'?'Giving $TMF is locked until the alarm goes off. The <b style="color:var(--cream)">24-hour donation window</b> opens <b style="color:var(--cream)">Tue Oct 13 at 6:00 AM PST</b> and runs until Wed Oct 14 at 6:00 AM PST. Keep collecting $TMF until then.':'The 24-hour donation window has ended. Thanks for playing.'}</div></div>\`
      :st.top9?\`<div class="card" style="border-color:rgba(224,103,95,.5)">`);
  rep(`      if(!st||!st.canSend){toast(st&&st.top9?`, `      if(st&&st.donate&&!st.donate.open){toast(st.donate.state==='early'?'&#128274; <span>Donations open when the alarm goes off, <b>Tue 6:00 AM PST</b>.</span>':'&#128274; <span>The donation window has closed.</span>',3600);return}
      if(!st||!st.canSend){toast(st&&st.top9?`);
  rep(`<li>Anyone outside the top 5 can <b style="color:var(--cream)">give all their $TMF to one top 5 runner</b>`, `<li><b style="color:var(--gold2)">Giving opens only during the 24-hour donation window</b> (Tue Oct 13, 6:00 AM PST to Wed Oct 14, 6:00 AM PST).</li>
       <li>Anyone outside the top 5 can <b style="color:var(--cream)">give all their $TMF to one top 5 runner</b>`);
});
console.log('ok');
