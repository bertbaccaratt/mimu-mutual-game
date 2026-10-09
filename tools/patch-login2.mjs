// Sign once, retry only the network call (never prompts the wallet twice).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const crlf = t.includes('\r\n');
t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 70)); t = t.replace(a, () => b); };

rep(`    const r=await API.j('/api/auth',{method:'POST',body:JSON.stringify({address:addr,nonce:n.nonce,issuedAt:n.issuedAt,signature:sig,name:P.glyph.name,picture:P.glyph.picture})});
    API.token=r.token;return r;`,
`    const body=JSON.stringify({address:addr,nonce:n.nonce,issuedAt:n.issuedAt,signature:sig,name:P.glyph.name,picture:P.glyph.picture});
    let r,err;
    for(let i=0;i<4&&!r;i++){                                   /* same signature, only the request is retried when the service is busy */
      try{r=await API.j('/api/auth',{method:'POST',body});err=null}
      catch(e){err=e;if(e.status&&e.status<500&&e.status!==429)break;await new Promise(z=>setTimeout(z,700*(i+1)+Math.random()*400))}
    }
    if(!r)throw err;
    API.token=r.token;return r;`);

rep(`        let r=null,err=null;
        for(let i=0;i<3&&!r;i++){
          try{r=await API.login();err=null}
          catch(e){err=e;if(e.body&&e.body.gates)break;if(e.status===401||e.status===403)break;await sleep(900*(i+1))}
        }
        if(r){`, `        let r=null,err=null;
        try{r=await API.login()}catch(e){err=e}
        if(r){`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
