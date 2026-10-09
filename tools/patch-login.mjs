// Sign-in: the Worker (cached, several RPC fallbacks) is the one source of truth; no fragile browser-side chain calls.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8');
const crlf = t.includes('\r\n');
t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 70)); t = t.replace(a, () => b); };

rep(`      if(!gatesConfigured())return{mimu:true,pass:false,dengs:false};          /* no rules set yet: everyone passes */
      const h=await window.MimuGlyph.checkHoldings(GAME_CONFIG.gates,g.address);`,
`      if(!gatesConfigured())return{mimu:true,pass:false,dengs:false};          /* no rules set yet: everyone passes */
      if(API.on()){                                                            /* the server decides (cached, several RPC fallbacks); no fragile browser-side chain calls */
        let r=null,err=null;
        for(let i=0;i<3&&!r;i++){
          try{r=await API.login();err=null}
          catch(e){err=e;if(e.body&&e.body.gates)break;if(e.status===401||e.status===403)break;await sleep(900*(i+1))}
        }
        if(r){serverRes=r;const q=r.gates||{};return{mimu:q.mimu==null?true:!!q.mimu,pass:!!q.pass,dengs:!!q.dengs}}
        if(err&&err.body&&err.body.gates){serverErr=err;const q=err.body.gates;return{mimu:q.mimu==null?true:!!q.mimu,pass:!!q.pass,dengs:!!q.dengs}}
        serverErr=err||new Error('no answer');throw serverErr;
      }
      const h=await window.MimuGlyph.checkHoldings(GAME_CONFIG.gates,g.address);`);

rep(`    const demo=demoGate();
    const found=(async()=>{`, `    const demo=demoGate();let serverRes=null,serverErr=null;
    const found=(async()=>{`);

rep(`    try{res=await found}catch(e){if(alive())problem('Couldn’t check your wallet','The holdings check failed. Try again in a moment.',verify);return}`,
`    try{res=await found}catch(e){if(alive())problem('Couldn’t sign you in',e&&e.status===401?'The signature was rejected. Try again.':e&&e.status===429?'Lots of players are signing in right now. Wait a few seconds and press Try again.':e&&e.status===403&&e.body&&e.body.error==='blocked'?'This wallet has been blocked.':'It is busy right now. Press Try again, it usually works on the second try.',verify);return}`);

rep(`    if(!reason&&API.on()&&!demo){
      try{const r=await API.login();if(r&&r.gates&&!r.gates.allowed)reason=r.gates.reason;else if(r){if(r.x&&(!P.x||P.x.handle!==r.x))P.x={handle:r.x,proof:null,pic:''};if(r.needX)needX=true}}
      catch(e){
        if(e.body&&e.body.gates&&e.body.gates.reason)reason=e.body.gates.reason;
        else{if(alive())problem('Couldn’t sign you in',e.status===401?'The signature was rejected. Try again.':'The leaderboard service didn’t answer. Try again in a moment.',verify);return}
      }
    }`,
`    if(serverErr&&serverErr.body&&serverErr.body.gates&&serverErr.body.gates.reason)reason=serverErr.body.gates.reason;
    else if(serverRes){const r=serverRes;if(r.gates&&!r.gates.allowed)reason=r.gates.reason||reason;else{if(r.x&&(!P.x||P.x.handle!==r.x))P.x={handle:r.x,proof:null,pic:''};if(r.needX)needX=true}}`);

fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
