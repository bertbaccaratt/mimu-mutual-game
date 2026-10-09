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
  e.rep("<h3>9 · Texts and conduct</h3><p>After you connect your Glyph you can text other players on the leaderboard.", "<h3>9 · Mail, texts and conduct</h3><p>Emails from the team arrive in Mimu Mail on every phone signed in with Glyph; players cannot send mail. After you connect your Glyph you can text other players on the leaderboard.");
});
console.log('ok');
