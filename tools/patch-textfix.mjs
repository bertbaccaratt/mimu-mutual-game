// Texts: an empty chat re-drew its input box on every poll (last===0), wiping what was being typed.
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };
rep(`inList=false;let last=0,blocked=false;`, `inList=false;let last=0,blocked=false,loaded=false;`);
rep(`    const drawBot=()=>{
      blk.textContent=blocked?'Unblock':'Block';`, `    const drawBot=()=>{
      const keep=$('#pmt',root)?$('#pmt',root).value:'';            /* never lose what is being typed */
      blk.textContent=blocked?'Unblock':'Block';`);
rep(`      const inp=$('#pmt',root),btn=$('#pms',root),er=$('#pmerr',root);`, `      const inp=$('#pmt',root),btn=$('#pms',root),er=$('#pmerr',root);inp.value=keep;`);
rep(`        if(last===0){thr.innerHTML='';blocked=d.blocked;drawBot()}
        add(d.messages.filter(m=>m.id>last));
        if(last===0&&!d.messages.length)thr.innerHTML=\`<div class="dt">Say hi to \${escH(name)}</div>\`;`,
`        if(!loaded){loaded=true;thr.innerHTML='';if(blocked!==d.blocked){blocked=d.blocked;drawBot()}}
        add(d.messages.filter(m=>m.id>last));
        if(last===0&&!d.messages.length&&!thr.querySelector('.dt'))thr.innerHTML=\`<div class="dt">Say hi to \${escH(name)}</div>\`;
        else if(last>0){const h=thr.querySelector('.dt');if(h)h.remove()}`);
rep(`}catch(e){if(last===0)thr.innerHTML='<div class="dt">Could not load this chat. Try again in a moment.</div>'}`, `}catch(e){if(!loaded&&!thr.querySelector('.dt'))thr.innerHTML='<div class="dt">Could not load this chat. Try again in a moment.</div>'}`);
rep(`blocked=r.blocked;drawBot();if(blocked)thr.innerHTML='';else{last=0;load()}`, `blocked=r.blocked;drawBot();if(blocked)thr.innerHTML='';else{last=0;loaded=false;load()}`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
