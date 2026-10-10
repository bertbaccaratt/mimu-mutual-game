// The pet moves onto the blue post-it stack on the right and is half the size (it is attached to the stack so it always stays with it).
import fs from 'node:fs';
const p = 'C:/Users/bertb/OneDrive/Desktop/tmfxmimu/index.html';
let t = fs.readFileSync(p, 'utf8'); const crlf = t.includes('\r\n'); t = t.split('\r\n').join('\n');
const rep = (a, b) => { if (!t.includes(a)) throw new Error('missing ' + a.slice(0, 80)); t = t.replace(a, () => b); };

// pull the pet markup out of its own prop and put it inside the post-it prop
const s = t.indexOf('  <div class="prop p-gadget" id="pet">');
const e = t.indexOf('</div></div>\n', s);                       // end of the pet block: ...pet-hit"></div></div>
if (s < 0 || e < 0) throw new Error('pet markup');
const pet = t.slice(s, e + '</div></div>'.length);
const petInner = pet.replace('<div class="prop p-gadget" id="pet">', '<div class="p-gadget" id="pet">').trim();
t = t.slice(0, s) + t.slice(e + '</div></div>\n'.length);
rep(`  <div class="prop p-sticky"><img src="assets/postit.webp?v=4" alt=""></div>`, `  <div class="prop p-sticky"><img src="assets/postit.webp?v=4" alt="">${petInner}</div>`);

// CSS: half the old size (88px of the stack's 325px = 27%), sitting on the left edge of the stack
rep(`.p-gadget{left:2.8%;top:45%;width:176px;transform:rotate(-9deg);transition:transform .25s var(--spring,ease)}`,
    `.p-sticky .p-gadget{position:absolute;left:-13%;top:40%;width:27%;z-index:5;transform:rotate(-9deg);transition:transform .25s var(--spring,ease)}`);
rep(`.p-gadget img{display:block;width:100%;height:auto;filter:drop-shadow(9px 13px 9px rgba(0,0,0,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.4));transition:opacity .35s ease}`,
    `.p-gadget img{display:block;width:100%;height:auto;filter:drop-shadow(5px 7px 5px rgba(0,0,0,.5)) drop-shadow(0 1px 2px rgba(0,0,0,.4));transition:opacity .35s ease}`);
// the post-it hover lift must not move the pet's pictures
rep(`.p-sticky:has(.sticky-hit:hover) img{transform:translateY(-5px) rotate(1deg);transition:transform .2s}`, `.p-sticky:has(.sticky-hit:hover)>img{transform:translateY(-5px) rotate(1deg);transition:transform .2s}`);
fs.writeFileSync(p, crlf ? t.split('\n').join('\r\n') : t);
console.log('ok');
