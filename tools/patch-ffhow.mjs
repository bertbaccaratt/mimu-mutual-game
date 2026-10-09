// Mutual Mimu: a "?" button with a colourful mind-map explainer, same style as the Chair Run one.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

rep(`best:0,top:0,howSeen:0,`, `best:0,top:0,howSeen:0,ffHow:0,`);

rep(`<div class="sub">The Mimu Fund · round \${f.week}</div></div><div class="sp"></div><div class="pill">`, `<div class="sub">The Mimu Fund · round \${f.week}</div></div><div class="sp"></div><button class="ffq\${P.ffHow?'':' pulse'}" id="ffhow" type="button" aria-label="How Mutual Mimu works">?</button><div class="pill">`);
rep(`    const g=$('[data-go=run]',root);if(g)g.onclick=()=>{goHome();setTimeout(()=>openApp('run'),700)};
  };
  async function ring(){`, `    const g=$('[data-go=run]',root);if(g)g.onclick=()=>{goHome();setTimeout(()=>openApp('run'),700)};
    const hb=$('#ffhow',root);if(hb)hb.onclick=showHow;
  };
  /* how it works: a colourful mind map */
  const mm=(cls,ico,title,body)=>'<div class="fm '+cls+'"><i class="mmd"></i><div class="mmc"><div class="mmh"><span class="mmi">'+ico+'</span><b>'+title+'</b></div><p>'+body+'</p></div></div>';
  function showHow(){
    if(!P.ffHow){P.ffHow=1;saveP();const hb=$('#ffhow',root);if(hb)hb.classList.remove('pulse')}
    const o=document.createElement('div');o.className='howov';
    o.innerHTML='<div class="howc"><div class="mmhub"><span>&#128276;</span><b>MUTUAL MIMU</b><small>how it works</small></div><div class="mmtrunk">'+
      mm('c-gold','🔔','Closing bell','Every <b>4 hours 20 minutes</b> the bell rings. Votes lock, the round settles, and a fresh ballot opens straight away. It rings even while you are away.')+
      mm('c-blue','☀','Weather forecast','A guess at the market mood: risk-on, risk-off or choppy, with a &ldquo;% sure&rdquo; tag. It is a forecast, not a promise. <b>Growth and degen</b> amplify the weather. <b>Safe and gold</b> lean against it.')+
      mm('c-violet','🗳','Proxy ballot','Four proposals, from boring to wild. Tap one to cast your vote. The room votes and the <b>biggest total wins</b>. The risk dots show how bumpy each one is, and &ldquo;last rd&rdquo; shows how it paid last time.')+
      mm('c-green','💰','Stake','Slide how much $TMF rides on your pick, in steps of 10. A heavier stake gives you <b>more weight in the vote</b>. Your stake rides the winner, and you can never lose more than your stake.')+
      mm('c-orange','⚡','Leverage','Choose 1x, 2x or 3x. It multiplies the win <b>and</b> the loss on your stake. Bigger swings, bigger bell.')+
      mm('c-pink','🤝','Voting blocs','Three groups with their own leanings. Pick a proposal first, then <b>court</b> a bloc for 3 $TMF per point of its weight and it follows your pick.')+
      mm('c-red','🏆','The bell pays','If your pick wins, your stake earns the return times your leverage. If the room goes another way you carry that result instead. No vote means you just watch from the gallery.')+
      mm('c-silver','🏅','Season points','Every bell gives <b>+50 season points</b>, and <b>+100 more</b> when you walk away in profit. They fill your Badges meter.')+
      mm('c-rainbow','🪑','Where $TMF comes from','Earn $TMF by running the halls in Chair Run, then bring it here to stake. Mutual Mimu unlocks once you connect Glyph in Chair Run.')+
      '</div><button class="btn gold" id="ffx" style="margin-top:12px">Got it</button></div>';
    root.appendChild(o);
    $('#ffx',o).onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};
  }
  async function ring(){`);

rep(`.rbtn.pulse{`, `.ffq{pointer-events:auto;flex:none;width:34px;height:34px;margin-right:8px;border-radius:12px;background:rgba(20,12,14,.62);border:1px solid var(--gold);color:var(--gold2);font:700 17px var(--serif);display:grid;place-items:center;cursor:pointer}
.ffq.pulse{animation:howp 1.3s ease-in-out infinite}
.rbtn.pulse{`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
