// Secret phone line, app side: the dial claims the line on the server (only the first player gets the video), the Badges app shows
// the Phone Detective card to everyone (unclaimed, or who won), the winner gets the reminder, and the admin page gets a square on top.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, root); const t = fs.readFileSync(p, 'utf8'); fs.writeFileSync(p, fn(t)); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 80)); return t.replace(a, () => b); };

edit('index.html', (t) => {
  /* ---- shared state + helpers (before the phone/messages code) ---- */
  t = once(t, "const PM={unread:0,threads:[],top:null,topAt:0,timer:null,seen:0,mail:0};",
"const PM={unread:0,threads:[],top:null,topAt:0,timer:null,seen:0,mail:0};\n" +
"/* the secret phone line: one player in the whole game wins the Phone Detective badge (the server decides; everyone can read who won) */\n" +
"const SECRET={loaded:false,found:false,name:'',pic:'',at:0,mine:false,texted:false};\n" +
"let _secT=0,_secNag=0;\n" +
"async function secretLoad(){\n" +
"  if(!API.on())return;_secT=Date.now();\n" +
"  try{const r=await API.j('/api/secret/status');SECRET.loaded=true;SECRET.found=!!r.found;SECRET.name=r.name||'';SECRET.pic=r.pic||'';SECRET.at=r.at||0;SECRET.mine=!!r.mine;SECRET.texted=!!r.texted}catch(e){}\n" +
"  secretLockNote();try{if(window._vaultSecret)window._vaultSecret()}catch(e){}\n" +
"}\n" +
"const secretNag=()=>{if(SECRET.mine&&!SECRET.texted){_secNag=Date.now();try{toast('&#128222; <span><b>Hype</b>: TEXT HYPE THE CODE NOW!</span>',5600)}catch(e){}}};\n" +
"function secretPoll(){const n=Date.now();if(n-_secT>120000)secretLoad();if(SECRET.mine&&!SECRET.texted&&n-_secNag>300000)secretNag()}\n" +
"function secretLockNote(){\n" +
"  const L=document.getElementById('lock');if(!L||L.style.display==='none'||L.classList.contains('go'))return;\n" +
"  const old=document.getElementById('lksecret');if(old&&!(SECRET.mine&&!SECRET.texted)){old.remove();return}\n" +
"  if(old||!(SECRET.mine&&!SECRET.texted))return;\n" +
"  const first=L.querySelector('.notif');if(!first)return;\n" +
"  first.insertAdjacentHTML('beforebegin','<div class=\"notif\" id=\"lksecret\" style=\"background:rgba(32,74,44,.82);border-color:rgba(120,230,150,.5)\"><div class=\"ni\" style=\"background:linear-gradient(135deg,#46d36b,#1f8f43);border-color:#b8f5c9;font-size:15px\">H</div><div><b>Hype <small style=\"font:500 10px var(--mono);color:#9fe8b4;margin-left:4px\">now</small></b><span style=\"color:#d6f5de\">TEXT HYPE THE CODE NOW!</span></div></div>');\n" +
"}\n" +
"function secretCardHTML(){\n" +
"  const S=SECRET,when=S.at?new Date(S.at).toLocaleString('en-US',{timeZone:PT,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' PT':'';\n" +
"  if(!S.found)return`<div class=\"card\" style=\"border-color:rgba(124,192,255,.5);margin-bottom:12px\"><div class=\"row\" style=\"gap:12px;align-items:center\"><div style=\"font-size:34px;line-height:1\">&#128222;</div><div style=\"min-width:0\"><div class=\"lbl\" style=\"color:#7cc0ff\">Phone Detective &middot; 1 of 1</div><div style=\"font:700 17px var(--sans);color:var(--cream);margin-top:2px\">Not found yet</div><div class=\"sub2\" style=\"font-size:12.5px;margin-top:3px\">Only one player in the whole game can win this badge. Somebody is going to find the right number first.</div></div></div></div>`;\n" +
"  const mine=S.mine;\n" +
"  return`<div class=\"card\" style=\"border-color:${mine?'var(--gold)':'rgba(124,192,255,.5)'};margin-bottom:12px;${mine?'box-shadow:0 0 26px rgba(217,178,95,.25)':''}\"><div class=\"row\" style=\"gap:12px;align-items:center\"><div style=\"font-size:34px;line-height:1\">&#128222;</div><div style=\"min-width:0;flex:1\"><div class=\"lbl\" style=\"color:${mine?'var(--gold2)':'#7cc0ff'}\">Phone Detective &middot; 1 of 1 ${mine?'&middot; YOU WON IT':'&middot; won'}</div><div class=\"row\" style=\"gap:8px;margin-top:6px;align-items:center\"><div class=\"av\" style=\"width:34px;height:34px;flex:none\">${imgTag(S.pic&&safeUrl(S.pic)?S.pic:'assets/mimu-icon.jpg')}</div><div style=\"min-width:0\"><div style=\"font:700 17px var(--sans);color:var(--cream);overflow:hidden;text-overflow:ellipsis\">${escH(S.name||'a player')}</div><div class=\"sub2\" style=\"font-size:12px\">found the secret number first${when?' &middot; '+when:''}</div></div></div></div></div></div>`;\n" +
"}\n");

  /* poll the secret status with the text poll */
  t = once(t, "    PM.seen=1;refreshDockBadge();if(window._pmList)window._pmList();\n  }catch(e){}",
              "    PM.seen=1;refreshDockBadge();if(window._pmList)window._pmList();\n    secretPoll();\n  }catch(e){}");
  t = once(t, "function startPMPoll(){stopPMPoll();if(!pmOn())return;pmPoll();PM.timer=setInterval(pmPoll,20000)}",
              "function startPMPoll(){stopPMPoll();if(!pmOn())return;secretLoad();pmPoll();PM.timer=setInterval(pmPoll,20000)}");

  /* ---- phone app: the dial claims the line first ---- */
  t = once(t, "    let done=false,live=false,wd=null,tk=null;\n    const hang=fail=>{if(done)return;done=true;clearTimeout(wd);clearInterval(tk);hangNow=null;try{v.pause();v.removeAttribute('src');v.load()}catch(e){}box.remove();\n      if(fail){wrongNumber();return}\n      num='';dn.textContent='';resetCall();tone(480,0,.14,.04);tone(380,.17,.2,.04)};",
"    let done=false,live=false,wd=null,tk=null,gotIt=false,won=Promise.resolve(false);\n" +
"    /* only the first signed-in player to dial this number gets the video (the server decides); everyone else gets the wrong-number message */\n" +
"    const claim=()=>{won=(API.token&&API.on())?API.j('/api/secret/claim',{method:'POST',body:'{}',timeout:9000}).then(r=>!!(r&&r.won)).catch(()=>false):Promise.resolve(false)};\n" +
"    const hang=fail=>{if(done)return;done=true;clearTimeout(wd);clearInterval(tk);hangNow=null;try{v.pause();v.removeAttribute('src');v.load()}catch(e){}box.remove();\n" +
"      if(fail){wrongNumber();return}\n" +
"      num='';dn.textContent='';resetCall();tone(480,0,.14,.04);tone(380,.17,.2,.04);\n" +
"      if(gotIt)setTimeout(()=>{secretLoad().then(()=>secretNag())},900)};");
  t = once(t, "    return{reveal(){\n      box.classList.add('on');ds.innerHTML='&nbsp;';\n      wd=setTimeout(()=>{if(!live)hang(true)},10000);                   /* never connected (offline or very slow): fall back to the wrong-number recording */\n      const go=()=>{live=true;clearTimeout(wd);ans.hidden=true;tk=setInterval(tick,250);tick()};\n      const pr=v.play();\n      if(pr&&pr.then)pr.then(go).catch(()=>{clearTimeout(wd);ans.hidden=false;ans.onclick=()=>{v.play().then(go).catch(()=>hang(true))}});else go();\n    }};",
"    return{claim,reveal(){\n" +
"      Promise.race([won,new Promise(r=>setTimeout(()=>r(false),9000))]).then(ok=>{\n" +
"        if(done)return;\n" +
"        if(!ok){hang(true);return}                                    /* not the first (or not signed in): the normal wrong-number message */\n" +
"        gotIt=true;SECRET.found=true;SECRET.mine=true;SECRET.texted=false;secretLoad();pmPoll();\n" +
"        box.classList.add('on');ds.innerHTML='&nbsp;';\n" +
"        wd=setTimeout(()=>{if(!live)hang(true)},10000);               /* never connected (offline or very slow): fall back to the wrong-number recording */\n" +
"        const go=()=>{live=true;clearTimeout(wd);ans.hidden=true;tk=setInterval(tick,250);tick()};\n" +
"        const pr=v.play();\n" +
"        if(pr&&pr.then)pr.then(go).catch(()=>{clearTimeout(wd);ans.hidden=false;ans.onclick=()=>{v.play().then(go).catch(()=>hang(true))}});else go();\n" +
"      });\n" +
"    }};");
  t = once(t, "    if(isSecret()){const c=prepCall();tm=setTimeout(()=>c.reveal(),2800);return}",
              "    if(isSecret()){const c=prepCall();c.claim();tm=setTimeout(()=>c.reveal(),2800);return}");

  /* ---- Messages: the Hype thread has no "donate" strip ---- */
  t = once(t, "`<div class=\"pmdon\">Want to help ${escH(name)}? <button id=\"pmdn\">Donate $TMF in Top 5</button></div><div class=\"pmerr\" id=\"pmerr\"></div>",
              "`${name==='Hype'?'':`<div class=\"pmdon\">Want to help ${escH(name)}? <button id=\"pmdn\">Donate $TMF in Top 5</button></div>`}<div class=\"pmerr\" id=\"pmerr\"></div>");
  t = once(t, "      $('#pmdn',root).onclick=()=>{goHome();setTimeout(()=>openApp('top5'),700)};",
              "      {const dnb=$('#pmdn',root);if(dnb)dnb.onclick=()=>{goHome();setTimeout(()=>openApp('top5'),700)}}");

  /* ---- Badges app: the card for everyone ---- */
  t = once(t, "  const draw=()=>keepScroll(root,drawBody);\n  const ring=(f,c,size=84)=>",
              "  const draw=()=>keepScroll(root,drawBody);\n  window._vaultSecret=()=>{if(document.body.contains(root))draw()};secretLoad();\n  const ring=(f,c,size=84)=>");
  t = once(t, "<div class=\"scroll\" style=\"padding-bottom:30px\">\n     <div class=\"shc\"><div class=\"shp\" id=\"scMount\"></div>",
              "<div class=\"scroll\" style=\"padding-bottom:30px\">\n     ${secretCardHTML()}\n     <div class=\"shc\"><div class=\"shp\" id=\"scMount\"></div>");
  return t;
});

edit('admin.html', (t) => {
  t = once(t, '  <section class="case" aria-label="Visitors">',
'  <section class="sec a-sky" id="secretbox" aria-label="Secret phone line"><h2>&#9742; Secret line <small>1-800-239-0413</small></h2><div id="secretbody" style="padding:14px 20px 18px;color:var(--muted);font-size:14px">Loading&hellip;</div></section>\n\n  <section class="case" aria-label="Visitors">');
  t = once(t, "  paintHypeList();paintTop5(d);paintFacts(d);paintCool(d);",
              "  paintHypeList();paintTop5(d);paintFacts(d);paintCool(d);paintSecret(d);");
  t = once(t, "function render(d){\n  DATA=d;",
"let SEC_PREV=null;\n" +
"function paintSecret(d){\n" +
"  const s=d.secret||{found:false},b=$('#secretbody'),box=$('#secretbox');if(!b)return;\n" +
"  if(!s.found){box.className='sec a-sky';b.innerHTML='<b style=\"color:var(--text);font-size:18px\">Not found yet</b><div style=\"margin-top:4px\">Nobody has dialed it. The first signed-in player to dial wins the Phone Detective badge and gets the video.</div>';SEC_PREV=false;return}\n" +
"  box.className='sec a-gold';\n" +
"  const when=new Date(s.at).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})+' PT';\n" +
"  b.innerHTML='<div style=\"font-size:20px;font-weight:700;color:var(--gold)\">&#127942; FOUND by '+esc(s.name)+'</div><div style=\"margin-top:4px\">Dialed the number first at <b>'+when+'</b>. They got the video and the Phone Detective badge.</div>'+\n" +
"    '<div style=\"margin-top:8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.05)\">'+(s.texted?'Texted Hype'+(s.textedAt?' at '+new Date(s.textedAt).toLocaleTimeString('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',minute:'2-digit'})+' PT':'')+': <b>&ldquo;'+esc(s.body||'')+'&rdquo;</b>':'Has <b>not</b> texted Hype yet. Their reminder is still showing.')+'</div>';\n" +
"  if(SEC_PREV===false){toast('&#9742; '+esc(s.name)+' just found the secret number!');ding(988,1480);confetti(60)}\n" +
"  SEC_PREV=true;\n" +
"}\n" +
"function render(d){\n  DATA=d;");
  return t;
});
console.log('secret UI patched');
