/* Bridge between the plain-HTML site and Glyph's React kit.
 * Loaded only when someone opens Chair Run. Exposes window.MimuGlyph:
 *   connect()            -> { name, picture, address }   opens Glyph sign-in if needed
 *   getUser()            -> the connected Glyph user or null
 *   signMessage(text)    -> signature string
 *   checkHoldings(gates, address) -> { mimu, pass, dengs }   true/false, or null when a rule isn't configured
 *   disconnect()
 */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GlyphWalletProvider, useGlyph, useNativeGlyphConnection } from '@use-glyph/sdk-react';
import { useAccount, useDisconnect } from 'wagmi';
import { createPublicClient, fallback, http, parseAbi } from 'viem';

const S = { glyph: null, address: null, user: null, authenticated: false, ready: false, nativeConnect: null, nativeDisconnect: null, wagmiDisconnect: null, subs: new Set() };
const notify = () => S.subs.forEach((f) => f());

function Bridge() {
  const glyph = useGlyph();
  const { address } = useAccount();
  const native = useNativeGlyphConnection();
  const { disconnect } = useDisconnect();
  S.glyph = glyph; S.nativeConnect = native.connect; S.nativeDisconnect = native.disconnect; S.wagmiDisconnect = disconnect;
  useEffect(() => {
    S.ready = glyph.ready; S.authenticated = glyph.authenticated; S.user = glyph.user; S.address = address || null;
    notify();
  }, [glyph.ready, glyph.authenticated, glyph.user, address]);
  return null;
}

const identity = () => {
  const u = S.user;
  const address = S.address || (u && u.evmWallet) || null;
  if (!S.authenticated || !u || !address) return null;
  return { name: u.name || '', picture: u.picture || '', address };
};

const ERC721 = parseAbi(['function balanceOf(address owner) view returns (uint256)']);
const RPCS = {
  33139: ['https://apechain.calderachain.xyz/http', 'https://rpc.apechain.com/http'],
  1: ['https://ethereum-rpc.publicnode.com'],
  8453: ['https://base-rpc.publicnode.com'],
};
async function holds(gate, owner) {
  const urls = RPCS[gate.chainId];
  if (!urls) throw new Error('No RPC for chain ' + gate.chainId);
  const client = createPublicClient({ transport: fallback(urls.map((u) => http(u))) });
  const n = await client.readContract({ address: gate.address, abi: ERC721, functionName: 'balanceOf', args: [owner] });
  return n > 0n;
}

window.MimuGlyph = {
  getUser: identity,
  connect() {
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (fn, v) => { if (done) return; done = true; S.subs.delete(check); clearTimeout(t); fn(v); };
      const check = () => { const id = identity(); if (id) finish(resolve, id); };
      const t = setTimeout(() => finish(reject, new Error('Glyph took too long. Try again.')), 180000);
      S.subs.add(check);
      if (identity()) return check();
      try {
        if (!S.address && S.nativeConnect) S.nativeConnect();
        else if (S.glyph && !S.authenticated) S.glyph.login();      // connected but not signed in yet (popup was blocked)
      } catch (e) { finish(reject, e); }
    });
  },
  async signMessage(message) {
    if (!S.glyph) throw new Error('Glyph is not ready');
    return S.glyph.signMessage({ message });
  },
  async checkHoldings(gates, address) {
    const out = { mimu: null, pass: null, dengs: null };
    for (const k of Object.keys(out)) {
      const g = gates && gates[k];
      if (g && g.address && g.chainId) out[k] = await holds(g, address);
    }
    return out;
  },
  disconnect() {
    try { if (S.nativeDisconnect) S.nativeDisconnect(); } catch (e) {}
    try { if (S.glyph) S.glyph.logout(); } catch (e) {}
    try { if (S.wagmiDisconnect) S.wagmiDisconnect(); } catch (e) {}
  },
};

const el = document.createElement('div');
el.id = 'mimu-glyph-root';
el.style.display = 'none';
document.body.appendChild(el);
createRoot(el).render(
  <GlyphWalletProvider askForSignature={true}>
    <Bridge />
  </GlyphWalletProvider>
);
