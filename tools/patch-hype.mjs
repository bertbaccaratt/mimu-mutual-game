// "Send a text as Hype": the admin texts one chosen player from the Hype account.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function edit(file, fn) {
  const p = root + file; let t = fs.readFileSync(p, 'utf8');
  const re = (a) => new RegExp(a.split('\n').map(esc).join('\\r?\\n'));
  fn({ rep(a, b) { if (!re(a).test(t)) throw new Error(file + ' missing: ' + a.slice(0, 80)); t = t.replace(re(a), () => b); } });
  fs.writeFileSync(p, t);
}

/* ---------------- server ---------------- */
edit('backend/src/index.js', (e) => {
  e.rep("const MSG_MAX = 280;", "const MSG_MAX = 280;\nconst HYPE = '0x' + '0'.repeat(39) + '1';                 // the \"Hype\" account: nobody holds a key for it, only the admin page can text as Hype");
  e.rep("  if (path === 'mail' && req.method === 'POST') {", `  if (path === 'hype' && req.method === 'POST') {                      // a one-on-one text from Hype to the chosen player
    const to = String(b.to || '').toLowerCase();
    const text = String(b.body || '').replace(/[\\u0000-\\u0008\\u000b-\\u001f\\u007f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069]/g, '').replace(/[ \\t]+/g, ' ').replace(/\\n{3,}/g, '\\n\\n').trim();
    if (!/^0x[0-9a-f]{40}$/.test(to) || to === HYPE) return out({ error: 'Pick a player first.' }, 400);
    if (!text) return out({ error: 'Type a message first.' }, 400);
    if (text.length > MSG_MAX) return out({ error: 'Keep it under ' + MSG_MAX + ' characters.' }, 400);
    const who = await env.DB.prepare('SELECT name FROM players WHERE address=?1').bind(to).first();
    if (!who) return out({ error: 'That player has not signed in yet.' }, 404);
    await env.DB.prepare("INSERT OR IGNORE INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,'Hype','','Hype',?2)").bind(HYPE, Date.now()).run();
    const r = await env.DB.prepare('INSERT INTO messages(ts,sender,recipient,body,read) VALUES(?1,?2,?3,?4,0)').bind(Date.now(), HYPE, to, text).run();
    return out({ ok: true, id: r.meta && r.meta.last_row_id, to: who.name });
  }
  if (path === 'mail' && req.method === 'POST') {`);
  // keep the Hype account out of the admin player list and the recipient count
  e.rep("FROM players p ORDER BY p.updated_at DESC LIMIT 1000`", "FROM players p WHERE p.address<>'${HYPE}' ORDER BY p.updated_at DESC LIMIT 1000`");
  e.rep("const players = await env.DB.prepare('SELECT COUNT(*) c FROM players').first();", "const players = await env.DB.prepare('SELECT COUNT(*) c FROM players WHERE address<>?1').bind(HYPE).first();");
  e.rep("const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails]", "const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails, hypes]");
  e.rep("(SELECT COUNT(*) FROM mail_reads r WHERE r.id=b.id) reads FROM broadcasts b ORDER BY b.id DESC LIMIT 20').all(),\n    ]);", "(SELECT COUNT(*) FROM mail_reads r WHERE r.id=b.id) reads FROM broadcasts b ORDER BY b.id DESC LIMIT 20').all(),\n      q('SELECT m.id, m.ts, m.body, pr.name rn FROM messages m LEFT JOIN players pr ON pr.address=m.recipient WHERE m.sender=?1 ORDER BY m.id DESC LIMIT 8', HYPE).all(),\n    ]);");
  e.rep("mails: mails.results || [],", "mails: mails.results || [], hypes: hypes.results || [],");
});

/* ---------------- admin page ---------------- */
edit('admin.html', (e) => {
  e.rep('.xl{color:#9ad1ff}', `.xl{color:#9ad1ff}
.boxes{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;align-items:flex-start;margin-top:18px}
.boxes .mailbox{margin:0;flex:1 1 380px;max-width:620px}
.hypebox{flex:1 1 320px;max-width:460px;padding:16px 18px;border:2px solid #2fd36b;border-radius:18px;background:linear-gradient(180deg,#09180f,#07120b);box-shadow:0 0 22px rgba(47,211,107,.3)}
.hypebox h2{font:700 14px var(--cond);letter-spacing:.2em;text-transform:uppercase;color:#7dffa8;margin:0 0 12px;display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.hypebox h2 small{font:500 10px var(--mono);letter-spacing:.12em;color:var(--muted)}
.hypebox input[type=text],.hypebox textarea{width:100%;padding:11px 13px;border-radius:10px;background:#0c1f14;border:1px solid #1f6b3e;color:var(--cream);font:500 13px var(--mono);outline:0;resize:vertical;margin-bottom:9px}
.hypebox input[type=text]:focus,.hypebox textarea:focus{border-color:#4be08a}
.hypebox .hrow{display:flex;align-items:center;gap:10px}
.hypebox .hsend{margin-left:auto;padding:10px 18px;border-radius:10px;background:linear-gradient(180deg,#46d36b,#1f9f48);color:#04150a;font:700 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;box-shadow:0 6px 16px rgba(47,211,107,.35)}
.hypebox .hsend:disabled{opacity:.5;cursor:wait}
.hypebox #h-st{min-height:16px;margin-top:8px;font-size:12px;color:var(--muted)}
.hypebox .hsent{margin-top:12px;border-top:1px solid #174d2c;padding-top:10px;font-size:11.5px;color:var(--muted)}
.hypebox .hsent div{padding:3px 0;display:flex;gap:8px}.hypebox .hsent b{color:#7dffa8;font-weight:600;white-space:nowrap}.hypebox .hsent span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--cream)}`);
  e.rep('  <section class="mailbox" aria-label="Send email to all phones">', '  <div class="boxes">\n  <section class="mailbox" aria-label="Send email to all phones">');
  e.rep('    <div class="msent" id="m-sent"></div>\n  </section>', `    <div class="msent" id="m-sent"></div>
  </section>
  <section class="hypebox" aria-label="Send a text message as Hype">
    <h2>&#128172; Send a text message as Hype <small id="h-count">one player at a time</small></h2>
    <input type="text" id="h-to" list="h-list" placeholder="Pick a username, like @name" autocomplete="off" spellcheck="false">
    <datalist id="h-list"></datalist>
    <textarea id="h-body" rows="4" maxlength="280" placeholder="Type Hype's message&hellip; (up to 280 characters)"></textarea>
    <div class="hrow"><span id="h-n" style="font-size:11px;color:var(--muted)">0 / 280</span><button class="hsend" id="h-send" type="button">Send as Hype</button></div>
    <div id="h-st"></div>
    <div class="hsent" id="h-sent"></div>
  </section>
  </div>`);
  e.rep("/* ---------- actions ---------- */", `/* ---------- Hype texts: one player at a time ---------- */
$('#h-body').oninput=()=>{$('#h-n').textContent=$('#h-body').value.length+' / 280'};
$('#h-send').onclick=async()=>{
  const name=$('#h-to').value.trim().toLowerCase(),body=$('#h-body').value.trim(),st=$('#h-st');
  const u=((DATA&&DATA.users)||[]).find(x=>String(x.n||'').toLowerCase()===name);
  st.style.color='var(--bad)';
  if(!u){st.textContent='Pick a player from the list (type their @username).';return}
  if(!body){st.textContent='Type a message first.';return}
  const b=$('#h-send');b.disabled=true;st.style.color='var(--muted)';st.textContent='Sending…';
  try{
    const r=await call('hype',{method:'POST',body:JSON.stringify({to:u.a,body})});
    st.style.color='var(--up)';st.textContent='Sent to '+r.to+' as Hype. It is waiting in their Messages.';
    $('#h-body').value='';$('#h-n').textContent='0 / 280';refresh();
  }catch(err){st.style.color='var(--bad)';st.textContent=err.message}
  b.disabled=false;
};

/* ---------- actions ---------- */`);
  e.rep("  // sent emails\n", `  // Hype: player list for the picker and the last texts sent as Hype
  $('#h-list').innerHTML=d.users.slice(0,500).map(u=>\`<option value="\${esc(u.n)}" label="\${esc(short(u.a))}"></option>\`).join('');
  $('#h-sent').innerHTML=(d.hypes||[]).length?'<div style="margin-bottom:4px;letter-spacing:.12em;text-transform:uppercase;font-size:10px">Sent as Hype</div>'+d.hypes.map(h=>\`<div><b>\${esc(h.rn||'player')}</b><span>\${esc(h.body)}</span></div>\`).join(''):'';
  // sent emails
`);
});

/* ---------------- the phone: Hype gets a green avatar ---------------- */
edit('index.html', (e) => {
  e.rep("const pAv=pic=>`<div class=\"av\">${imgTag(safeUrl(pic)?pic:'assets/mimu-icon.jpg')}</div>`;", "const pAv=(pic,name)=>name==='Hype'?'<div class=\"av\" style=\"background:linear-gradient(135deg,#46d36b,#1f8f43);color:#fff;font:700 17px var(--sans)\">H</div>':`<div class=\"av\">${imgTag(safeUrl(pic)?pic:'assets/mimu-icon.jpg')}</div>`;");
  e.rep("data-pc=\"${escH(t.picture||'')}\">${pAv(t.picture)}", "data-pc=\"${escH(t.picture||'')}\">${pAv(t.picture,t.name)}");
});
console.log('ok');
