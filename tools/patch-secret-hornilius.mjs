// The reminder comes from Hornilius (red), not Hype. The Hype thread is left exactly as it was: no text is inserted from Hype,
// and the earlier change to the Hype thread's donate strip is reverted.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, root); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 80)); return t.replace(a, () => b); };

edit('index.html', (t) => {
  // 1) put the Hype thread back exactly as it was
  t = once(t, "`${name==='Hype'?'':`<div class=\"pmdon\">Want to help ${escH(name)}? <button id=\"pmdn\">Donate $TMF in Top 5</button></div>`}<div class=\"pmerr\" id=\"pmerr\"></div>",
              "`<div class=\"pmdon\">Want to help ${escH(name)}? <button id=\"pmdn\">Donate $TMF in Top 5</button></div><div class=\"pmerr\" id=\"pmerr\"></div>");
  t = once(t, "      {const dnb=$('#pmdn',root);if(dnb)dnb.onclick=()=>{goHome();setTimeout(()=>openApp('top5'),700)}}",
              "      $('#pmdn',root).onclick=()=>{goHome();setTimeout(()=>openApp('top5'),700)};");
  // 2) the banner reminder is from Hornilius, in red
  t = once(t, "try{toast('&#128222; <span><b>Hype</b>: TEXT HYPE THE CODE NOW!</span>',5600)}catch(e){}",
              "try{toast('&#128222; <span style=\"color:#ff5a52\"><b style=\"color:#ff3b30\">Hornilius</b> &middot; <b style=\"color:#ff5a52\">TEXT HYPE THE CODE NOW!</b></span>',6000)}catch(e){}");
  // 3) the lock-screen reminder: red, from Hornilius
  t = once(t, "<div class=\"notif\" id=\"lksecret\" style=\"background:rgba(32,74,44,.82);border-color:rgba(120,230,150,.5)\"><div class=\"ni\" style=\"background:linear-gradient(135deg,#46d36b,#1f8f43);border-color:#b8f5c9;font-size:15px\">H</div><div><b>Hype <small style=\"font:500 10px var(--mono);color:#9fe8b4;margin-left:4px\">now</small></b><span style=\"color:#d6f5de\">TEXT HYPE THE CODE NOW!</span></div></div>",
              "<div class=\"notif\" id=\"lksecret\" style=\"background:rgba(120,18,18,.88);border-color:rgba(255,90,82,.75);box-shadow:0 0 22px rgba(255,59,48,.35)\"><div class=\"ni\" style=\"background:linear-gradient(135deg,#ff453a,#a3150f);border-color:#ffb3ad;font-size:17px\">&#128222;</div><div><b>Hornilius <small style=\"font:500 10px var(--mono);color:#ffb3ad;margin-left:4px\">now</small></b><span style=\"color:#ffd9d6;font-weight:700\">TEXT HYPE THE CODE NOW!</span></div></div>");
  return t;
});

edit('backend/src/index.js', (t) => {
  // no text is put into the Hype thread; the reminder is an on-screen notification from Hornilius
  t = once(t,
"  if (first) {                                                       // the reminder: a text from Hype, right in their Messages\n" +
"    await env.DB.prepare(\"INSERT OR IGNORE INTO players(address,name,picture,glyph_name,updated_at) VALUES(?1,'Hype','','Hype',?2)\").bind(HYPE, now).run();\n" +
"    await env.DB.prepare('INSERT INTO messages(ts,sender,recipient,body,read) VALUES(?1,?2,?3,?4,0)').bind(now, HYPE, sess.sub, 'TEXT HYPE THE CODE NOW!').run();\n" +
"  }\n", '');
  return t;
});

edit('backend/test-secret.mjs', (t) => {
  const a = t.indexOf("// the reminder text from Hype is in the winner");
  const b = t.indexOf("// the winner texts Hype back");
  if (a < 0 || b < 0) throw new Error('test block not found');
  t = t.slice(0, a) +
"// no text is put into anyone's Hype thread by the claim (the reminder is an on-screen notification from Hornilius)\n" +
"const tw = await call('/api/messages/threads', {}, W.token);\n" +
"ok('the claim does not put a text into the Hype thread', !(tw.b.threads || []).some((t) => /hype/i.test(t.name || '')), JSON.stringify(tw.b.threads));\n\n" + t.slice(b);
  return t;
});
console.log('hornilius reminder applied; hype thread restored');
