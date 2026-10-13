// The secret line only records WHO got the number. Whether they text Hype (the player @morethanhype) is not tracked at all.
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const edit = (f, fn) => { const p = new URL(f, root); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const once = (t, a, b) => { if (t.split(a).length - 1 !== 1) throw new Error('miss: ' + a.slice(0, 80)); return t.replace(a, () => b); };

edit('backend/src/index.js', (t) => {
  t = once(t,
"  const mine = !!sess && sess.sub === row.a;\n" +
"  let texted = false;\n" +
"  if (mine) texted = !!(await env.DB.prepare('SELECT 1 x FROM messages WHERE sender=?1 AND recipient=?2 AND ts>=?3 LIMIT 1').bind(row.a, HYPE, row.t).first());\n" +
"  return json(env, req, { found: true, name: row.n || 'a player', pic: row.pic || '', at: row.t, mine, texted });",
"  return json(env, req, { found: true, name: row.n || 'a player', pic: row.pic || '', at: row.t, mine: !!sess && sess.sub === row.a });");
  t = once(t,
"    const m = await env.DB.prepare('SELECT ts, body FROM messages WHERE sender=?1 AND recipient=?2 AND ts>=?3 ORDER BY id DESC LIMIT 1').bind(row.a, HYPE, row.t).first();\n" +
"    return { found: true, name: row.n || 'a player', x: row.x || '', address: row.a, at: row.t, texted: !!m, textedAt: m ? m.ts : 0, body: m ? m.body : '' };",
"    return { found: true, name: row.n || 'a player', x: row.x || '', address: row.a, at: row.t };");
  return t;
});

edit('index.html', (t) => {
  t = once(t, "const SECRET={loaded:false,found:false,name:'',pic:'',at:0,mine:false,texted:false};", "const SECRET={loaded:false,found:false,name:'',pic:'',at:0,mine:false};");
  t = once(t, "SECRET.mine=!!r.mine;SECRET.texted=!!r.texted}catch(e){}", "SECRET.mine=!!r.mine}catch(e){}");
  t = once(t, "const secretNag=()=>{if(SECRET.mine&&!SECRET.texted){_secNag=Date.now();", "const secretNag=()=>{if(SECRET.mine){_secNag=Date.now();");
  t = once(t, "function secretPoll(){const n=Date.now();if(n-_secT>120000)secretLoad();if(SECRET.mine&&!SECRET.texted&&n-_secNag>300000)secretNag()}", "function secretPoll(){if(Date.now()-_secT>120000)secretLoad()}");
  t = once(t, "if(old&&!(SECRET.mine&&!SECRET.texted)){old.remove();return}\n  if(old||!(SECRET.mine&&!SECRET.texted))return;", "if(old&&!SECRET.mine){old.remove();return}\n  if(old||!SECRET.mine)return;");
  t = once(t, "gotIt=true;SECRET.found=true;SECRET.mine=true;SECRET.texted=false;secretLoad();pmPoll();", "gotIt=true;SECRET.found=true;SECRET.mine=true;secretLoad();pmPoll();");
  return t;
});

edit('admin.html', (t) => {
  const a = t.indexOf('let SEC_PREV=null;'), b = t.indexOf('function render(d){', a);
  if (a < 0 || b < 0) throw new Error('admin secret block not found');
  const fn =
"let SEC_PREV=null;\n" +
"function paintSecret(d){\n" +
"  const s=d.secret||{found:false},b=$('#secretbody'),box=$('#secretbox');if(!b)return;\n" +
"  if(!s.found){box.className='sec a-sky';b.innerHTML='<b style=\"color:var(--text);font-size:18px\">Not found yet</b><div style=\"margin-top:4px\">Nobody has dialed it yet. The first signed-in player to dial it is recorded here.</div>';SEC_PREV=false;return}\n" +
"  box.className='sec a-gold';\n" +
"  const when=new Date(s.at).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'})+' PT';\n" +
"  b.innerHTML='<div style=\"font-size:20px;font-weight:700;color:var(--gold)\">&#127942; '+esc(s.name)+' got the number</div><div style=\"margin-top:4px\">They dialed it first at <b>'+when+'</b>.</div>'+\n" +
"    '<div style=\"margin-top:8px;font:12px var(--mono);color:var(--muted);word-break:break-all\">'+esc(s.address||'')+'</div>';\n" +
"  if(SEC_PREV===false){toast('&#9742; '+esc(s.name)+' just found the secret number!');ding(988,1480);confetti(60)}\n" +
"  SEC_PREV=true;\n" +
"}\n";
  return t.slice(0, a) + fn + t.slice(b);
});

edit('backend/test-secret.mjs', (t) => {
  t = once(t, "ok('the reminder is open until they text Hype', sw.b.texted === false);\n", "");
  const i = t.indexOf('// the winner texts Hype back');
  if (i < 0) throw new Error('tail not found');
  return t.slice(0, i).trimEnd() + "\n";
});
console.log('secret line simplified: it only records who got the number');
