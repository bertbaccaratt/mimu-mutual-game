// A rejected session (server says 401) signs the phone out cleanly, so a server-side logout takes effect everywhere.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };
rep(`    if(!r.ok){const e=new Error(b.error||('http '+r.status));e.status=r.status;e.body=b;throw e}`,
`    if(!r.ok){
      if(r.status===401&&API.token&&!/^\/api\/(nonce|auth)/.test(path)){          /* the server no longer accepts this session: sign out cleanly */
        API.token=null;GATE.ok=false;clearSess();
        try{syncLocks();stopPMPoll();toast('🔒 <span>You were signed out. Tap <b>Mutual Mimu</b> to sign in again.</span>',5200)}catch(x){}
      }
      const e=new Error(b.error||('http '+r.status));e.status=r.status;e.body=b;throw e
    }`);
rep(`if(restoreSess()){try{syncLocks();startPMPoll()}catch(e){}}`, `if(restoreSess()){try{syncLocks();startPMPoll();API.j('/api/mybest').catch(()=>{})}catch(e){}}   /* a quick check that the remembered session is still accepted */`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
