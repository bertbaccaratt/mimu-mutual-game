import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
const banner = `/*! Chair Run x Mutual Mimu - Glyph bridge bundle.
 * This Glyph Code is licensed by Yuga Labs, Inc. and may only be used in accordance with the Glyph Software License v1.0 published at https://useglyph.io/license
 */`;
await build({
  entryPoints: ['src/entry.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  platform: 'browser',
  outfile: '../assets/glyph-connect.js',
  banner: { js: banner },
  legalComments: 'none',
  jsx: 'automatic',
  loader: { '.js': 'jsx', '.svg': 'dataurl', '.png': 'dataurl', '.css': 'empty' },
  define: { 'process.env.NODE_ENV': '"production"', 'global': 'globalThis' },
  logLevel: 'info',
});
mkdirSync('../assets', { recursive: true });
console.log('built ../assets/glyph-connect.js');
