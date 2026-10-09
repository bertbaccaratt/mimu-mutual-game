// Mimu Mail: admin broadcasts an email (subject, body, optional photo) to every Glyph-signed-in phone.
import fs from 'node:fs';
const root = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function edit(file, fn) {
  const p = root + file; let t = fs.readFileSync(p, 'utf8');
  const re = (a) => new RegExp(a.split('\n').map(esc).join('\\r?\\n'));
  fn({ rep(a, b) { if (!re(a).test(t)) throw new Error(file + ' missing: ' + a.slice(0, 80)); t = t.replace(re(a), () => b); }, get t() { return t; }, set t(v) { t = v; } });
  fs.writeFileSync(p, t);
}

/* ================= server ================= */
edit('backend/src/index.js', (e) => {
  e.rep("/* ---------- player-to-player texts (the Messages app) ----------", `/* ---------- Mimu Mail: emails only the admin can send, delivered to every phone signed in with Glyph ---------- */
const MAIL_IMG_MAX = 1000000;                                           // characters of base64 (about 750 KB)
const mailImgUrl = (req, key) => \`\${apiOrigin(req)}/api/mail/img/\${key}\`;
async function handleMailList(env, req) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const rows = (await env.DB.prepare('SELECT b.id, b.ts, b.subject, substr(b.body,1,160) pv, (b.ikey IS NOT NULL) img, EXISTS(SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id) rd FROM broadcasts b ORDER BY b.id DESC LIMIT 50').bind(a.me).all()).results || [];
  const un = await env.DB.prepare('SELECT COUNT(*) c FROM broadcasts b WHERE NOT EXISTS (SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id)').bind(a.me).first();
  return json(env, req, { unread: un.c, mails: rows.map((r) => ({ id: r.id, ts: r.ts, subject: r.subject, preview: r.pv, image: !!r.img, read: !!r.rd })) });
}
async function handleMailItem(env, req, url) {
  const a = await msgAuth(env, req); if (a.err) return a.err;
  const id = Number(url.searchParams.get('id')) || 0;
  const m = await env.DB.prepare('SELECT id, ts, subject, body, ikey FROM broadcasts WHERE id=?1').bind(id).first();
  if (!m) return json(env, req, { error: 'not found' }, 404);
  await env.DB.prepare('INSERT OR IGNORE INTO mail_reads(address,id) VALUES(?1,?2)').bind(a.me, id).run();
  return json(env, req, { id: m.id, ts: m.ts, subject: m.subject, body: m.body, image: m.ikey ? mailImgUrl(req, m.ikey) : null });
}
async function handleMailImg(env, req, url) {
  if (await limited(env, 'RL_READ', clientIp(req))) return tooMany(env, req);
  const key = url.pathname.split('/').pop();
  if (!/^[0-9a-f]{24}$/.test(key)) return new Response('not found', { status: 404 });
  const row = await env.DB.prepare('SELECT img FROM broadcasts WHERE ikey=?1').bind(key).first();
  if (!row || !row.img) return new Response('not found', { status: 404 });
  const [type, b64] = String(row.img).split('|');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) return new Response('not found', { status: 404 });
  return new Response(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)), { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cross-Origin-Resource-Policy': 'cross-origin' } });
}

/* ---------- player-to-player texts (the Messages app) ----------`);
  // unread mail count rides along with the texts poll
  e.rep("  return json(env, req, { unread: threads.reduce((s, t) => s + t.unread, 0), threads });",
        "  const mu = await env.DB.prepare('SELECT COUNT(*) c FROM broadcasts b WHERE NOT EXISTS (SELECT 1 FROM mail_reads r WHERE r.address=?1 AND r.id=b.id)').bind(me).first();\n  return json(env, req, { unread: threads.reduce((s, t) => s + t.unread, 0), threads, mail: mu ? mu.c : 0 });");
  e.rep("      if (url.pathname === '/api/run/beat' && req.method === 'POST') return handleRunBeat(env, req);",
        "      if (url.pathname === '/api/mail' && req.method === 'GET') return handleMailList(env, req);\n      if (url.pathname === '/api/mail/item' && req.method === 'GET') return handleMailItem(env, req, url);\n      if (url.pathname.startsWith('/api/mail/img/') && req.method === 'GET') return handleMailImg(env, req, url);\n      if (url.pathname === '/api/run/beat' && req.method === 'POST') return handleRunBeat(env, req);");
  // admin: send + delete + list in the dashboard
  e.rep("  if (path === 'live' && req.method === 'GET') {", `  if (path === 'mail' && req.method === 'POST') {                      // the ONLY way an email is created: it goes to every phone signed in with Glyph
    const subject = String(b.subject || '').replace(/[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069]/g, ' ').replace(/\\s+/g, ' ').trim();
    const body = String(b.body || '').replace(/[\\u0000-\\u0008\\u000b-\\u001f\\u007f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069]/g, '').replace(/\\r\\n?/g, '\\n').replace(/\\n{4,}/g, '\\n\\n\\n').trim();
    if (!subject || subject.length > 120) return out({ error: 'Subject is required (up to 120 characters).' }, 400);
    if (!body || body.length > 5000) return out({ error: 'Write a message (up to 5000 characters).' }, 400);
    let img = null, ikey = null;
    if (b.image) {
      const m = /^data:image\\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image));
      if (!m || m[1].length > MAIL_IMG_MAX) return out({ error: 'That photo is too big or not a JPG, PNG or WebP.' }, 400);
      let bytes; try { bytes = Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)); } catch { return out({ error: 'bad image' }, 400); }
      const type = sniffImage(bytes);
      if (!type) return out({ error: 'That file is not a real picture.' }, 400);
      img = type + '|' + m[1]; ikey = hex(12);
    }
    const r = await env.DB.prepare('INSERT INTO broadcasts(ts,subject,body,img,ikey) VALUES(?1,?2,?3,?4,?5)').bind(Date.now(), subject, body, img, ikey).run();
    const players = await env.DB.prepare('SELECT COUNT(*) c FROM players').first();
    return out({ ok: true, id: r.meta && r.meta.last_row_id, recipients: players.c });
  }
  if (path === 'delmail' && req.method === 'POST') {
    const id = Number(b.id) || 0;
    await env.DB.prepare('DELETE FROM mail_reads WHERE id=?1').bind(id).run();
    await env.DB.prepare('DELETE FROM broadcasts WHERE id=?1').bind(id).run();
    return out({ ok: true });
  }
  if (path === 'live' && req.method === 'GET') {`);
  e.rep("const [vis, tot, today, run, nw, held, users, banned, transfers, messages]", "const [vis, tot, today, run, nw, held, users, banned, transfers, messages, mails]");
  e.rep("ORDER BY m.id DESC LIMIT 100').all(),\n    ]);", "ORDER BY m.id DESC LIMIT 100').all(),\n      q('SELECT b.id, b.ts, b.subject, (b.ikey IS NOT NULL) img, (SELECT COUNT(*) FROM mail_reads r WHERE r.id=b.id) reads FROM broadcasts b ORDER BY b.id DESC LIMIT 20').all(),\n    ]);");
  e.rep("transfers: transfers.results || [], messages: messages.results || [],", "transfers: transfers.results || [], messages: messages.results || [], mails: mails.results || [], players: users.results ? users.results.length : 0,");
});

/* ================= admin page ================= */
edit('admin.html', (e) => {
  e.rep('.xl{color:#9ad1ff}', `.xl{color:#9ad1ff}
.mailbox{max-width:620px;margin:18px auto 0;padding:16px 18px 16px;border:2px solid #2f7bff;border-radius:18px;background:linear-gradient(180deg,#0b1424,#08101c);box-shadow:0 0 22px rgba(47,123,255,.32)}
.mailbox h2{font:700 14px var(--cond);letter-spacing:.2em;text-transform:uppercase;color:#8ab4ff;margin:0 0 12px;display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.mailbox h2 small{font:500 10px var(--mono);letter-spacing:.12em;color:var(--muted)}
.mailbox input[type=text],.mailbox textarea{width:100%;padding:11px 13px;border-radius:10px;background:#0e1a2e;border:1px solid #234a86;color:var(--cream);font:500 13px var(--mono);outline:0;resize:vertical;margin-bottom:9px}
.mailbox input[type=text]:focus,.mailbox textarea:focus{border-color:#4d8dff}
.mailbox .mrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mailbox .mattach{padding:8px 13px;border:1px dashed #3a6bbd;border-radius:10px;color:#8ab4ff;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
.mailbox .mattach:hover{background:#0e1a2e}
.mailbox .msend{margin-left:auto;padding:10px 18px;border-radius:10px;background:linear-gradient(180deg,#4d8dff,#2160d8);color:#fff;font:700 12px var(--mono);letter-spacing:.1em;text-transform:uppercase;box-shadow:0 6px 16px rgba(47,123,255,.4)}
.mailbox .msend:disabled{opacity:.5;cursor:wait}
.mailbox #m-prev{display:block;max-width:100%;max-height:150px;border-radius:10px;margin-top:10px;border:1px solid #234a86}
.mailbox #m-st{min-height:16px;margin-top:8px;font-size:12px;color:var(--muted)}
.mailbox .msent{margin-top:12px;border-top:1px solid #1c3560;padding-top:10px;font-size:11.5px;color:var(--muted)}
.mailbox .msent div{display:flex;gap:10px;align-items:center;padding:4px 0}.mailbox .msent b{color:var(--cream);font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`);
  // the box sits right under the flip clock
  e.rep('  <div class="two">', `  <section class="mailbox" aria-label="Send email to all phones">
    <h2>&#9993; Send email to all phones <small id="m-count">only the admin can send</small></h2>
    <input type="text" id="m-sub" maxlength="120" placeholder="Subject" autocomplete="off">
    <textarea id="m-body" rows="6" maxlength="5000" placeholder="Write your message&hellip;"></textarea>
    <div class="mrow"><label class="mattach"><input type="file" id="m-file" accept="image/*" hidden>&#128247; Attach photo</label><span id="m-fn" style="font-size:11px;color:var(--muted)"></span><button class="btn ghost" id="m-clear" type="button" hidden>Remove photo</button><button class="msend" id="m-send" type="button">Send to all phones</button></div>
    <img id="m-prev" alt="" hidden>
    <div id="m-st"></div>
    <div class="msent" id="m-sent"></div>
  </section>

  <div class="two">`);
  e.rep("/* ---------- actions ---------- */", `/* ---------- Mimu Mail composer ---------- */
let MAIL_IMG=null;
function shrinkPhoto(file){
  return new Promise((res,rej)=>{
    if(!/^image\\//.test(file.type)||file.size>15e6)return rej(new Error('Choose a picture under 15 MB.'));
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{URL.revokeObjectURL(url);const M=1000,k=Math.min(1,M/Math.max(im.width,im.height)),w=Math.round(im.width*k),h=Math.round(im.height*k),c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(im,0,0,w,h);res(c.toDataURL('image/jpeg',.82))};
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('That file is not a picture I can read.'))};
    im.src=url;
  });
}
$('#m-file').onchange=async e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  try{MAIL_IMG=await shrinkPhoto(f);$('#m-prev').src=MAIL_IMG;$('#m-prev').hidden=false;$('#m-fn').textContent=f.name.slice(0,30);$('#m-clear').hidden=false;$('#m-st').textContent=''}
  catch(err){MAIL_IMG=null;$('#m-st').textContent=err.message}
  e.target.value='';
};
$('#m-clear').onclick=()=>{MAIL_IMG=null;$('#m-prev').hidden=true;$('#m-fn').textContent='';$('#m-clear').hidden=true};
$('#m-send').onclick=async()=>{
  const subject=$('#m-sub').value.trim(),body=$('#m-body').value.trim(),st=$('#m-st');
  if(!subject||!body){st.style.color='var(--bad)';st.textContent='Add a subject and a message first.';return}
  if(!confirm('Send this email to EVERY phone signed in with Glyph?\\n\\n'+subject))return;
  const b=$('#m-send');b.disabled=true;st.style.color='var(--muted)';st.textContent='Sending…';
  try{
    const r=await call('mail',{method:'POST',body:JSON.stringify({subject,body,image:MAIL_IMG})});
    st.style.color='var(--up)';st.textContent='Sent. It will appear on every signed-in phone ('+nf(r.recipients)+' players on record).';
    $('#m-sub').value='';$('#m-body').value='';$('#m-clear').onclick();refresh();
  }catch(err){st.style.color='var(--bad)';st.textContent=err.message}
  b.disabled=false;
};

/* ---------- actions ---------- */`);
  e.rep("  // players\n  $('#ucount')", `  // sent emails
  $('#m-sent').innerHTML=(d.mails||[]).length?'<div style="margin-bottom:4px;letter-spacing:.12em;text-transform:uppercase;font-size:10px">Sent emails</div>'+d.mails.map(m=>\`<div><b title="\${esc(m.subject)}">\${esc(m.subject)}\${m.img?' &#128247;':''}</b><span>\${ago(m.ts)} &middot; opened by \${nf(m.reads)}</span><button class="btn no" data-dmail="\${m.id}">Delete</button></div>\`).join(''):'';
  // players
  $('#ucount')`);
  e.rep("    if(t.dataset.dm){", "    if(t.dataset.dmail){if(!confirm('Delete this email from every phone?'))return;await call('delmail',{method:'POST',body:JSON.stringify({id:+t.dataset.dmail})});toast('Email deleted');return refresh()}\n    if(t.dataset.dm){");
});

/* ================= the phone ================= */
edit('index.html', (e) => {
  // state, badge and poll
  e.rep("const PM={unread:0,threads:[],top:null,topAt:0,timer:null,seen:0};", "const PM={unread:0,threads:[],top:null,topAt:0,timer:null,seen:0,mail:0};");
  e.rep("function stopPMPoll(){clearInterval(PM.timer);PM.timer=null;PM.unread=0;PM.threads=[];PM.seen=0;refreshDockBadge()}", "function stopPMPoll(){clearInterval(PM.timer);PM.timer=null;PM.unread=0;PM.mail=0;PM.threads=[];PM.seen=0;refreshDockBadge();refreshMailBadge()}");
  e.rep("PM.threads=r.threads||[];PM.unread=r.unread||0;", "PM.threads=r.threads||[];PM.unread=r.unread||0;const mailBefore=PM.mail;PM.mail=r.mail||0;if(PM.mail>mailBefore&&PM.seen)toast('&#128236; <span>New mail from <b>Mimu On Ape</b></span>',3400);refreshMailBadge();if(window._mailList)window._mailList();");
  e.rep("function refreshDockBadge(){", `function refreshMailBadge(){
  const b=document.querySelector('.grid [data-open=mail] .ic');if(!b)return;
  let d=b.querySelector('.bd');const n=PM.mail||0;
  if(n){if(!d){d=document.createElement('i');d.className='bd';b.appendChild(d)}d.textContent=n}else if(d)d.remove();
}
function refreshDockBadge(){`);
  // tile: lit up and blue, opens the app
  e.rep('<button class="app-i lk" data-act="soon"><div class="ic" style="background:linear-gradient(135deg,#4a4a52,#2a2a30)">${IC.lock}</div>Mimu Mail</button>', '<button class="app-i mail" data-open="mail"><div class="ic" style="background:linear-gradient(135deg,#5aa8ff,#1d5fd6)">${IC.mail}${PM.mail?`<i class="bd">${PM.mail}</i>`:\'\'}</div>Mimu Mail</button>');
  e.rep("cam:buildCam,set:buildSet,alarm:buildAlarm}", "cam:buildCam,set:buildSet,alarm:buildAlarm,mail:buildMail}");
  e.rep("  alarm:'<svg viewBox=", "  mail:'<svg viewBox=\"0 0 32 32\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4.5\" y=\"7.5\" width=\"23\" height=\"17\" rx=\"3.2\" fill=\"#fff\" fill-opacity=\".16\"/><path d=\"M5.5 10l10.5 8 10.5-8\"/></svg>',\n  alarm:'<svg viewBox=");
  // CSS
  e.rep('.alst{position:relative;', `.app-i.mail .ic{box-shadow:0 0 0 1px rgba(150,200,255,.5),0 0 20px 3px rgba(74,150,255,.6);animation:mailglow 2.8s ease-in-out infinite}
@keyframes mailglow{0%,100%{box-shadow:0 0 0 1px rgba(150,200,255,.45),0 0 14px 2px rgba(74,150,255,.5)}50%{box-shadow:0 0 0 1px rgba(170,215,255,.7),0 0 26px 6px rgba(74,150,255,.85)}}
.mailx{position:absolute;inset:0;background:#1f2023;color:#e8eaed;display:flex;flex-direction:column;padding-top:54px;font-family:var(--sans)}
.mailx .mx-search{flex:none;margin:6px 14px 8px;height:46px;border-radius:24px;background:#2d2e32;display:flex;align-items:center;gap:12px;padding:0 8px 0 16px;color:#9aa0a6;font-size:15px}
.mailx .mx-search .mx-av{margin-left:auto;width:32px;height:32px;border-radius:50%;background:#1a73e8;color:#fff;display:grid;place-items:center;font:600 14px var(--sans)}
.mailx .mx-lbl{flex:none;padding:6px 18px 8px;font:600 11.5px var(--sans);letter-spacing:.08em;text-transform:uppercase;color:#9aa0a6}
.mailx .mx-list{flex:1;min-height:0;overflow-y:auto;scrollbar-width:none}
.mailx .mx-row{display:flex;gap:13px;width:100%;text-align:left;padding:11px 16px;border-bottom:1px solid #ffffff12}
.mailx .mx-row:active{background:#ffffff0d}
.mailx .mx-ava{flex:none;width:40px;height:40px;border-radius:50%;background:#1a73e8;color:#fff;display:grid;place-items:center;font:600 17px var(--sans)}
.mailx .mx-mid{flex:1;min-width:0}
.mailx .mx-l1{display:flex;align-items:baseline;gap:8px}.mailx .mx-l1 b{flex:1;font:500 14.5px var(--sans);color:#bdc1c6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mailx .mx-l1 em{font:500 11.5px var(--sans);color:#9aa0a6;font-style:normal}
.mailx .mx-sub{font:500 14px/1.3 var(--sans);color:#bdc1c6;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mailx .mx-pv{font:400 13px/1.35 var(--sans);color:#9aa0a6;margin-top:1px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.mailx .mx-row.un .mx-l1 b,.mailx .mx-row.un .mx-sub{color:#fff;font-weight:700}.mailx .mx-row.un .mx-l1 em{color:#8ab4f8;font-weight:700}
.mailx .mx-row .mx-clip{color:#9aa0a6;font-size:12px;margin-left:6px}
.mailx .mx-empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:0 40px 70px;color:#9aa0a6}
.mailx .mx-empty .mx-ico{width:88px;height:88px;border-radius:50%;background:#2d2e32;display:grid;place-items:center;margin-bottom:6px}
.mailx .mx-empty .mx-ico svg{width:44px;height:44px}
.mailx .mx-empty b{font:500 18px var(--sans);color:#e8eaed}.mailx .mx-empty span{font:400 14px/1.45 var(--sans)}
.mailx .mx-bar{flex:none;display:flex;align-items:center;gap:6px;padding:4px 10px}
.mailx .mx-back{color:#8ab4f8;font:500 15px var(--sans);padding:8px 6px;display:flex;align-items:center;gap:2px}
.mailx .mx-det{flex:1;min-height:0;overflow-y:auto;padding:4px 18px 24px;scrollbar-width:none}
.mailx .mx-subj{font:500 22px/1.3 var(--sans);color:#fff;margin:6px 0 14px;word-break:break-word}
.mailx .mx-from{display:flex;gap:12px;align-items:center;margin-bottom:16px}
.mailx .mx-from b{display:block;font:500 14.5px var(--sans);color:#e8eaed}.mailx .mx-from span{font:400 12.5px var(--sans);color:#9aa0a6}
.mailx .mx-body{font:400 15px/1.55 var(--sans);color:#e8eaed;white-space:pre-wrap;word-break:break-word}
.mailx .mx-img{display:block;width:100%;border-radius:12px;margin-top:16px;background:#2d2e32}
.mailx .mx-foot{margin-top:22px;padding-top:14px;border-top:1px solid #ffffff12;font:400 12px var(--sans);color:#9aa0a6}
.alst{position:relative;`);

  // the app
  e.rep("function buildTop5(root){", `/* Mimu Mail: an inbox (dark Gmail / iPhone Mail look) for emails only the admin can send */
function buildMail(root){
  let timer=null,items=null,view='list';
  const env='<svg viewBox="0 0 32 32" fill="none" stroke="#9aa0a6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="7.5" width="23" height="17" rx="3.2"/><path d="M5.5 10l10.5 8 10.5-8"/></svg>';
  const when=ts=>{const d=new Date(ts),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString([],{month:'short',day:'numeric'})};
  const initial=()=>((P.handle||'M').replace(/^@/,'')[0]||'M').toUpperCase();
  const top=()=>\`<div class="mx-search"><span>&#9776;</span><span>Search in mail</span><div class="mx-av">\${escH(initial())}</div></div>\`;
  const locked=()=>{root.innerHTML=\`<div class="mailx">\${top()}<div class="mx-empty"><div class="mx-ico">\${env}</div><b>Sign in to get mail</b><span>Connect your Glyph in Chair Run. Emails from the Mimu On Ape team land here.</span></div></div>\`};
  const list=()=>{
    view='list';
    if(!pmOn())return locked();
    const rows=items||[];
    root.innerHTML=\`<div class="mailx">\${top()}<div class="mx-lbl">Inbox</div>\${items===null?'<div class="mx-empty"><span>Loading&hellip;</span></div>':rows.length?\`<div class="mx-list">\${rows.map(m=>\`<button class="mx-row\${m.read?'':' un'}" data-mid="\${m.id}"><div class="mx-ava">M</div><div class="mx-mid"><div class="mx-l1"><b>Mimu On Ape</b><em>\${escH(when(m.ts))}</em></div><div class="mx-sub">\${escH(m.subject)}\${m.image?'<span class="mx-clip">&#128247;</span>':''}</div><div class="mx-pv">\${escH(m.preview||'')}</div></div></button>\`).join('')}</div>\`:\`<div class="mx-empty"><div class="mx-ico">\${env}</div><b>No messages yet</b><span>Your inbox is empty and waiting for its first message.</span></div>\`}</div>\`;
    $$('[data-mid]',root).forEach(b=>b.onclick=()=>{ac();sfx.tap();open(+b.dataset.mid)});
  };
  const load=async()=>{
    if(!pmOn())return list();
    try{const d=await API.j('/api/mail');items=d.mails||[];PM.mail=d.unread||0;refreshMailBadge()}catch(e){if(items===null)items=[]}
    if(view==='list')list();
  };
  const open=async id=>{
    view='item';
    root.innerHTML=\`<div class="mailx"><div class="mx-bar"><button class="mx-back" id="mxb">&lsaquo; Inbox</button></div><div class="mx-det" id="mxd"><div class="mx-empty" style="padding:40px"><span>Opening&hellip;</span></div></div></div>\`;
    $('#mxb',root).onclick=()=>{ac();sfx.tap();view='list';load()};
    try{
      const m=await API.j('/api/mail/item?id='+id);
      const it=(items||[]).find(x=>x.id===id);if(it&&!it.read){it.read=true;PM.mail=Math.max(0,PM.mail-1);refreshMailBadge()}
      const d=$('#mxd',root);if(!d||view!=='item')return;
      d.innerHTML=\`<div class="mx-subj"></div><div class="mx-from"><div class="mx-ava">M</div><div><b>Mimu On Ape</b><span>to me &middot; \${escH(new Date(m.ts).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))}</span></div></div><div class="mx-body"></div>\${m.image&&safeUrl(m.image)?\`<img class="mx-img" alt="" referrerpolicy="no-referrer" src="\${escH(m.image)}">\`:''}<div class="mx-foot">This email was sent by the Mimu On Ape team to every signed-in phone. You can&rsquo;t reply.</div>\`;
      d.querySelector('.mx-subj').textContent=m.subject;d.querySelector('.mx-body').textContent=m.body;
    }catch(e){const d=$('#mxd',root);if(d)d.innerHTML='<div class="mx-empty" style="padding:40px"><span>Could not open this email. Try again in a moment.</span></div>'}
  };
  window._mailList=()=>{if(view==='list'&&pmOn())load()};
  list();load();timer=setInterval(()=>{if(document.body.contains(root)&&view==='list')load()},20000);
  return{destroy(){clearInterval(timer);window._mailList=null}};
}
function buildTop5(root){`);

  // text: guide and terms
  e.rep("Mimu Mail is locked and comes later.</span></div>", "</span></div>\n        <div><b>Mimu Mail</b><span>Your inbox. Emails from the Mimu On Ape team (with a subject, a message and sometimes a photo) arrive here for every phone signed in with Glyph. It starts empty. Only the team can send mail, and you can&rsquo;t reply.</span></div>");
  e.rep("Texts you send to other players in the Messages app are stored on our servers", "Emails from the team arrive in Mimu Mail on every phone signed in with Glyph; players cannot send mail. Texts you send to other players in the Messages app are stored on our servers");
});
console.log('ok');
