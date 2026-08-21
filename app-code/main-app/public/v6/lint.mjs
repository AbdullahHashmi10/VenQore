/* Conformance sweep — DESIGN-RULES.md §16 adapted to a static build. */
import fs from 'node:fs';
import path from 'node:path';

const dist = '/home/claude/v6/dist';
const html = fs.readdirSync(dist).filter(f => f.endsWith('.html'));
const css = fs.readFileSync(path.join(dist, 'assets/venqore.css'), 'utf8');
const js = fs.readFileSync(path.join(dist, 'assets/venqore.js'), 'utf8');

let fails = 0, warns = 0;
const fail = (m) => { console.log('  ✗ ' + m); fails++; };
const warn = (m) => { console.log('  ⚠ ' + m); warns++; };
const ok = (m) => console.log('  ✓ ' + m);

console.log('\n── Tokens & values ──────────────────────────────────────────');

// Durations: only 120/200/320/520/9000 are legal.
const durs = [...css.matchAll(/(?:transition|animation)(?:-duration)?:[^;]*?(\d+(?:\.\d+)?)m?s/g)]
  .map(m => m[1]).filter(v => !['120', '200', '320', '520', '9000'].includes(v));
const cssNoDelay = css.replace(/animation-delay:[^;]*;/g, '').replace(/animation-duration:\s*\.01ms[^;]*;/g, '').replace(/transition-duration:\s*\.01ms[^;]*;/g, '');
const durLit = [...cssNoDelay.matchAll(/\b(\d+)ms\b/g)].map(m => m[1])
  .filter(v => !['120', '200', '320', '520', '9000', '60', '0'].includes(v));
if (durLit.length) warn(`literal durations outside the four + stagger: ${[...new Set(durLit)].join(', ')}ms`);
else ok('every duration is --vq-dur-1..4 or the 60ms stagger');

// Radii above the 36px ceiling (999px full is legal).
const rad = [...css.matchAll(/border-radius:\s*(\d+)px/g)].map(m => +m[1]).filter(v => v > 36 && v !== 999);
if (rad.length) fail(`radius above the 36px ceiling: ${[...new Set(rad)].join(', ')}px`);
else ok('no radius above the 36px ceiling');

// Weight above 700.
if (/font-weight:\s*(800|900)/.test(css)) fail('font-weight above 700');
else ok('no font-weight above 700');

// Arbitrary z-index outside the ladder.
const LADDER = [0, 1, 2, 3, 10, 20, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const zs = [...css.matchAll(/z-index:\s*(-?\d+)/g)].map(m => +m[1]).filter(v => !LADDER.includes(v));
if (zs.length) fail(`z-index outside the ladder: ${[...new Set(zs)].join(', ')}`);
else ok('z-index stays on the ladder');

// Cold neutrals — slate/zinc/gray/stone have no place next to this teal.
const cold = /#(?:[0-9a-f]{6})/gi;
const known = new Set(['#ffffff', '#0a0b0f', '#021416', '#0f3b30', '#134e40', '#327882', '#ecf9fb', '#f8f9fa', '#05100e', '#062421', '#06100e', '#0a1614', '#0c1211', '#f4f6f8']);
const hexes = [...css.matchAll(cold)].map(m => m[0].toLowerCase());
const vqHexes = new Set(['#e6fbf5', '#c6f5e9', '#93ebd6', '#59dbc0', '#23c4a6', '#0baa8f', '#088975', '#076b5e', '#0a5049', '#0b3a35',
  '#f8faf8', '#f1f5f2', '#e6ece8', '#d3dcd7', '#b4c0ba', '#8b9a93', '#6b7a73', '#536159', '#3c4841', '#29332d', '#17201b', '#0d1412', '#060a09',
  '#eef9d7', '#c8ee7e', '#a9e34b', '#8ccb2e', '#5e8c15', '#ffe8e1', '#ffae96', '#ff8a6b', '#f26a47', '#b94526',
  '#fff3d6', '#ffdd8e', '#ffcd5b', '#f5b32e', '#a6740a', '#ddf2fb', '#8fd9f5', '#55c4ec', '#2ba5d1', '#1b7096',
  '#e0b4e0', '#c98bc9', '#b266a8', '#7e3e76', '#12855c', '#e4f6ec', '#a9e0c4', '#a6690a', '#f2d08a', '#c4443a', '#fdeae7', '#f3b7af',
  '#a8dcf0', '#f0a79e', '#6fdcc3', '#2cd3b3', '#c6f5e9', '#4bd99b', '#f7c05a', '#ff8a7e', '#7bd4e6', '#edf2ef', '#a8b4ae',
  '#1a2220', '#080d0c', '#1d2624', '#141b19', '#0a0f0e', '#041816', '#073b36', '#2a332f',
  '#e9efeb', '#2a0705']);
const stray = [...new Set(hexes)].filter(h => !vqHexes.has(h) && !known.has(h));
if (stray.length) warn(`hex values outside the V6 ramps: ${stray.join(', ')}`);
else ok('every hex resolves to a V6 ramp or a preserved hero value');

console.log('\n── Links ────────────────────────────────────────────────────');
const localPages = new Set(html);
let dead = [];
for (const f of html) {
  const src = fs.readFileSync(path.join(dist, f), 'utf8');
  for (const m of src.matchAll(/href="([^"#][^"]*)"/g)) {
    const h = m[1].split('#')[0];
    if (!h || h.startsWith('http') || h.startsWith('mailto:') || h.startsWith('/')) continue;
    if (h.endsWith('.html') && !localPages.has(h)) dead.push(`${f} → ${h}`);
    else if (!h.endsWith('.html') && !fs.existsSync(path.join(dist, h))) dead.push(`${f} → ${h}`);
  }
}
if (dead.length) fail(`dead local links:\n     ${[...new Set(dead)].join('\n     ')}`);
else ok(`${html.length} pages, every local link resolves`);

const abs = new Set();
for (const f of html) {
  const src = fs.readFileSync(path.join(dist, f), 'utf8');
  for (const m of src.matchAll(/href="(\/[^"]*)"/g)) abs.add(m[1]);
}
if (abs.size) warn(`app-root links that must exist on the host: ${[...abs].join(', ')}`);

console.log('\n── Structure ────────────────────────────────────────────────');
for (const f of html) {
  const src = fs.readFileSync(path.join(dist, f), 'utf8');
  const h1 = (src.match(/<h1\b/g) || []).length;
  if (h1 !== 1) warn(`${f}: ${h1} <h1> (want exactly 1)`);
  if (!/<meta name="description"/.test(src)) fail(`${f}: no meta description`);
  const italics = (src.match(/class="vq-italic"/g) || []).length;
  if (italics > 1) fail(`${f}: ${italics} italic words — the rule is exactly one per page`);
  const accentCards = (src.match(/vq-card--accent|vq-dcard--accent/g) || []).length;
  if (/vq-cards/.test(src)) {
    const perGrid = (src.match(/vq-dcard--accent/g) || []).length;
    const grids = (src.match(/class="vq-cards"/g) || []).length;
    if (grids && perGrid !== grids) warn(`${f}: ${perGrid} filled dashboard cards across ${grids} grid(s) — M1 wants exactly one per grid`);
  }
  if (!/href="#main"/.test(src) && !/vq-bare/.test(src)) warn(`${f}: no skip link`);
}
ok('per-page structure checked');

console.log('\n── Weight ───────────────────────────────────────────────────');
const size = (p) => fs.statSync(p).size;
const fonts = fs.readdirSync(path.join(dist, 'assets/fonts')).reduce((n, f) => n + size(path.join(dist, 'assets/fonts', f)), 0);
console.log(`  css ${(css.length / 1024).toFixed(1)} KB · js ${(js.length / 1024).toFixed(1)} KB · fonts ${(fonts / 1024).toFixed(0)} KB · logo ${(size(path.join(dist, 'assets/logo.png')) / 1024).toFixed(0)} KB`);
const biggest = html.map(f => [f, size(path.join(dist, f))]).sort((a, b) => b[1] - a[1])[0];
console.log(`  largest page: ${biggest[0]} ${(biggest[1] / 1024).toFixed(1)} KB`);

console.log(`\n${fails ? '✗' : '✓'} ${fails} failure(s), ${warns} warning(s)\n`);
