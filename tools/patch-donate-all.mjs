// Donate all: everyone outside the top 5 can give ALL their Chair Run points and ALL their $TMF to one player they choose.
// A new option on /api/transfer ({to, everything:true}); the existing $TMF-only buttons and every rule and time stay exactly as they were.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, root); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss (' + (t.split(a).length - 1) + '): ' + a.slice(0, 90)); return t.replace(a, () => b); };

/* ---------------- server ---------------- */
edit('backend/src/index.js', (t) => {
  t = once(t, 'async function handleSendStatus(env, req) {',
`/* ---------- Donate all: transfers keep how many Chair Run points moved (the column is added the first time it is needed) ---------- */
let TRANSFERS_POINTS = false;
async function transfersPoints(env) {
  if (TRANSFERS_POINTS) return;
  try { await env.DB.prepare('ALTER TABLE transfers ADD COLUMN points INTEGER NOT NULL DEFAULT 0').run(); } catch { /* the column is already there */ }
  TRANSFERS_POINTS = true;
}
async function handleSendStatus(env, req) {`);

  // status: also say how many points the player holds and whether Donate all is possible (everything else in the answer is unchanged)
  t = once(t, "env.DB.prepare(`SELECT ${TOTAL} AS sc, run_best, coins_total FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first()]);\n  const inTop = top.includes(sess.sub), balance = mine ? mine.coins_total : 0;",
              "env.DB.prepare(`SELECT ${TOTAL} AS sc, run_best, boost, coins_total FROM scores WHERE address=?1 AND week=?2`).bind(sess.sub, week).first()]);\n  const inTop = top.includes(sess.sub), balance = mine ? mine.coins_total : 0;");
  t = once(t, "top9: inTop, canSend: dw.open && !inTop && balance > 0, donate:",
              "top9: inTop, canSend: dw.open && !inTop && balance > 0, points: mine ? mine.run_best + mine.boost : 0, canAll: dw.open && !inTop && (mine ? mine.sc : 0) > 0, donate:");

  // the transfer
  t = once(t, "  const to = String(b.to || '').toLowerCase(), all = b.all === true;\n  let amount = Number(b.amount);\n  if (!/^0x[0-9a-f]{40}$/.test(to) || (!all && (!Number.isInteger(amount) || amount < 1 || amount > 1e9)))",
              "  const to = String(b.to || '').toLowerCase(), all = b.all === true, everything = b.everything === true;\n  let amount = Number(b.amount);\n  if (!/^0x[0-9a-f]{40}$/.test(to) || (!all && !everything && (!Number.isInteger(amount) || amount < 1 || amount > 1e9)))");
  t = once(t, "  if (all) {                                                          // give everything the sender holds right now\n",
`  if (everything) {                                                   // DONATE ALL: every Chair Run point and every $TMF the sender holds, in one all-or-nothing step
    await transfersPoints(env);
    const mineE = await env.DB.prepare('SELECT run_best rb, boost bo, coins_total c FROM scores WHERE address=?1 AND week=?2').bind(sess.sub, week).first();
    const pts = mineE ? mineE.rb + mineE.bo : 0, coinsE = mineE ? mineE.c : 0;
    if (!mineE || pts + coinsE < 1) return json(env, req, { error: 'You have nothing to give yet.' }, 409);
    const nowE = Date.now(), boostE = top.includes(to) ? coinsE * BOOST_PER_TMF : 0;     // the $TMF part boosts a top-5 runner exactly as before; points move one for one
    const resE = await env.DB.batch([
      env.DB.prepare('UPDATE scores SET run_best=0, boost=0, coins_total=0 WHERE address=?1 AND week=?2 AND run_best=?3 AND boost=?4 AND coins_total=?5').bind(sess.sub, week, mineE.rb, mineE.bo, mineE.c),
      env.DB.prepare('UPDATE scores SET run_best=run_best+?1, coins_total=coins_total+?2, boost=boost+?3 WHERE address=?4 AND week=?5 AND (SELECT changes())>0').bind(pts, coinsE, boostE, to, week),
      env.DB.prepare('INSERT INTO transfers(ts,week,sender,recipient,amount,boost,points) SELECT ?1,?2,?3,?4,?5,?6,?7 WHERE (SELECT changes())>0').bind(nowE, week, sess.sub, to, coinsE, boostE, pts),
    ]);
    if (!resE[0].meta || !resE[0].meta.changes) return json(env, req, { error: 'Your score just changed. Try again.' }, 409);
    return json(env, req, { ok: true, sent: coinsE, points: pts, total: pts + coinsE, boosted: boostE, balance: 0 });
  }
  if (all) {                                                          // give everything the sender holds right now
`);

  // admin dashboard: the transfers list carries the points too (the column is made sure of first)
  t = once(t, "q('SELECT t.ts, t.amount, t.boost, t.sender sa,", "q('SELECT t.ts, t.amount, t.boost, t.points, t.sender sa,");
  t = once(t, "    const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails, hypes] = await Promise.all([",
              "    await transfersPoints(env);\n    const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails, hypes] = await Promise.all([");
  return t;
});

/* ---------------- app ---------------- */
edit('index.html', (t) => {
  t = once(t, ".t5 .btn{flex:none}",
".t5 .btn{flex:none}\n.t5 .t5b{display:flex;flex-direction:column;gap:6px;flex:none;align-items:stretch}.t5 .t5b .btn{width:100%}\n.btn.dall{background:linear-gradient(180deg,#ff9a4a,#d9622a);border-color:#ffb36b;color:#1a0c04}.btn.dall.ghost{background:transparent;color:var(--dim);border-color:var(--line2)}");

  t = once(t, "const all=T?T.rows:[],me=mine(),can=!!(st&&st.canSend);",
              "const all=T?T.rows:[],me=mine(),can=!!(st&&st.canSend),canAll=!!(st&&st.canAll),showAll=!!(st&&!st.top9);");
  t = once(t, "        const act=isMe?'':r.tmf<1?'<span class=\"tag\">no $TMF yet</span>':gold?",
              "        const act0=isMe?'':r.tmf<1?'<span class=\"tag\">no $TMF yet</span>':gold?");
  t = once(t, ">Send</button>`;\n        return `<div class=\"t5 ${gold?'g9':''}",
              ">Send</button>`;\n        /* Donate all sits next to the existing $TMF button, for everyone outside the top 5 */\n        const act=(act0&&showAll&&!isMe&&r.tmf>=1)?`<div class=\"t5b\">${act0}<button class=\"btn sm dall ${canAll?'':'ghost'}\" data-everything=\"${escH(r.id)}\" ${canAll?'':'disabled'}>Donate all</button></div>`:act0;\n        return `<div class=\"t5 ${gold?'g9':''}");

  t = once(t, "    $$('[data-all]',root).forEach(b=>b.onclick=()=>start(b.dataset.all,true));\n",
"    $$('[data-all]',root).forEach(b=>b.onclick=()=>start(b.dataset.all,true));\n" +
"    const startAll=async id=>{\n" +
"      sfx.select();await Promise.all([loadTop(),loadStatus()]);draw();\n" +
"      const r=T&&T.rows.find(x=>x.id===id);if(!r)return;\n" +
"      if(st&&st.donate&&!st.donate.open){toast(st.donate.state==='early'?'&#128274; <span>Donations open when the alarm goes off, <b>Tue 6:00 AM PT</b>.</span>':'&#128274; <span>The donation window has closed.</span>',3600);return}\n" +
"      if(!st||!st.canAll){toast(st&&st.top9?'&#128274; <span>You are in the top 5 right now, so you can&rsquo;t send.</span>':'&#128274; <span>You have nothing to give right now.</span>',3200);return}\n" +
"      if(r.tmf<1){toast('That player has no $TMF yet, so they can&rsquo;t receive.',3000);return}\n" +
"      openAll(r);\n" +
"    };\n" +
"    $$('[data-everything]',root).forEach(b=>b.onclick=()=>startAll(b.dataset.everything));\n");

  t = once(t, "  const openSend=(r,giveAll)=>{\n",
"  /* Donate all: every Chair Run point and every $TMF, to one player. The numbers on screen come from the server's own status. */\n" +
"  const openAll=r=>{\n" +
"    const pts=st.points||0,coins=st.balance||0,tot=pts+coins,gain=pts+coins+(r.top9?coins*2:0);\n" +
"    sheet(`<div class=\"lbl\" style=\"color:var(--gold)\">Top 5 &middot; donate all</div><div class=\"h2\" style=\"margin:6px 0 10px;font-size:24px\">Give everything to <em>${escH(r.name)}</em></div>\n" +
"      <div class=\"sub2\" style=\"font-size:12.5px;margin-bottom:10px\">You give <b style=\"color:var(--cream)\">${fmt(coins)}</b> $TMF and <b style=\"color:var(--cream)\">${fmt(pts)}</b> Chair Run points: <b style=\"color:var(--cream)\">${fmt(tot)}</b> in total. Your own score goes to 0. <b style=\"color:var(--cream)\">This is final.</b></div>\n" +
"      <div class=\"sub2\" style=\"font-size:12.5px;margin:-2px 0 12px;color:var(--gold2)\">${r.top9?`This runner is in the top 5: they gain <b>+${fmt(gain)} total score</b> (${fmt(pts)} points, ${fmt(coins)} $TMF and ${fmt(coins*2)} bonus points).`:`They gain <b>+${fmt(tot)} total score</b>.`}</div>\n" +
"      <div class=\"hint\" id=\"senderr\" style=\"min-height:18px;color:#e0675f;margin-top:6px\"></div>\n" +
"      <button class=\"btn gold\" id=\"sendgo\" style=\"padding:15px;margin-top:6px\">Donate all ${fmt(tot)}</button><button class=\"btn ghost\" data-act=\"closesheet\" style=\"margin-top:8px\">Not now</button>`);\n" +
"    setTimeout(()=>{\n" +
"      const go=document.getElementById('sendgo');if(!go)return;\n" +
"      go.onclick=async()=>{\n" +
"        const er=document.getElementById('senderr');go.disabled=true;er.textContent='';\n" +
"        try{\n" +
"          const res=await API.j('/api/transfer',{method:'POST',body:JSON.stringify({to:r.id,everything:true})});\n" +
"          closeSheet();sfx.coin(6);setTimeout(()=>sfx.win(),180);confetti(r.top9?30:0);\n" +
"          toast(`&hearts; <span>You gave <b>${fmt(res.points)} points</b> and <b>${fmt(res.sent)} $TMF</b> to <b>${escH(r.name)}</b>.${res&&res.boosted?` Their score is up <b>+${fmt((res.total||0)+res.boosted)}</b>.`:''}</span>`,4200);\n" +
"          await Promise.all([refreshBoards(),loadStatus(),loadTop()]);if(window._t5)window._t5();\n" +
"        }catch(e){go.disabled=false;er.textContent=(e&&e.message)||'Could not send. Try again.';if(e&&e.body&&e.body.top9){loadStatus().then(()=>{if(window._t5)window._t5()})}}\n" +
"      };\n" +
"    },60);\n" +
"  };\n" +
"  const openSend=(r,giveAll)=>{\n");

  // one line in the Top 5 rules card and one in the guide chapter
  t = once(t, "<li>Gifts are final and can&rsquo;t be taken back. $TMF here is virtual and has no cash value.</li></ul></div>`;",
              "<li><b style=\"color:var(--cream)\">Donate all</b> (anyone outside the top 5) gives <b style=\"color:var(--cream)\">all your Chair Run points and all your $TMF</b> to one player you choose. The $TMF-only buttons work as before.</li>\n       <li>Gifts are final and can&rsquo;t be taken back. $TMF here is virtual and has no cash value.</li></ul></div>`;");
  t = once(t, "<li><b>Gifts are final.</b> They cannot be taken back.</li></ul></div></div></div></section>",
              "<li><b>Donate all:</b> anyone outside the top 5 can give <b>all their Chair Run points and all their $TMF</b> to one player they choose. The $TMF-only buttons still work as before.</li><li><b>Gifts are final.</b> They cannot be taken back.</li></ul></div></div></div></section>");
  return t;
});

/* ---------------- admin ---------------- */
edit('admin.html', (t) => {
  t = once(t, '<th style="text-align:right">$TMF</th></tr></thead>', '<th style="text-align:right">$TMF</th></tr></thead>');
  t = once(t, '<td class="r">${nf(x.amount)}</td></tr>`).join(\'\')',
              '<td class="r">${nf(x.amount)}${x.points?`<br><small style="color:var(--gold)">+${nf(x.points)} pts</small>`:\'\'}</td></tr>`).join(\'\')');
  return t;
});
console.log('donate all applied');
