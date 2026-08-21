import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src  = path.join(root, 'src');
const dist = path.join(root, 'dist');

fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

/* ── CSS ─────────────────────────────────────────────────────────────── */
const cssParts = ['01-tokens.css', '02-base.css', '03-components.css', '04-product.css', '05-hero.css'];
let css = cssParts.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n\n');

/* The viewer has three theme states, not two: an explicit choice stamps
   data-theme on <html>, and the default "system" setting stamps nothing at
   all. The dark palette is authored once against [data-theme="dark"]; this
   re-emits the same declarations for the un-stamped case, guarded so an
   explicit light choice still beats a dark OS. */
const darkBlock = css.match(/:root\[data-theme="dark"\], \.vq-dark, html\.dark \{([\s\S]*?)\n\}/);
if (darkBlock) {
  css += `\n\n/* ── Un-stamped "system" state — generated from the block above ── */\n` +
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {${darkBlock[1]}\n  }\n}\n`;
}
fs.writeFileSync(path.join(dist, 'assets', 'venqore.css'), css);

/* ── JS ──────────────────────────────────────────────────────────────── */
fs.copyFileSync(path.join(src, 'venqore.js'), path.join(dist, 'assets', 'venqore.js'));
for (const f of ['fluid.js', 'logo.png']) {
  const p = path.join(root, 'assets', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dist, 'assets', f));
}
/* fonts are copied into dist/assets/fonts once by setup-fonts.sh */

/* ── Pages ───────────────────────────────────────────────────────────── */
const pagesDir = path.join(src, 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js')).sort();
let n = 0;
for (const f of files) {
  const mod = await import(path.join(pagesDir, f) + '?t=' + Date.now());
  const out = f.replace(/\.js$/, '.html');
  fs.writeFileSync(path.join(dist, out), mod.default);
  n++;
}

const bytes = (p) => (fs.statSync(p).size / 1024).toFixed(1) + ' KB';
console.log(`✓ ${n} pages · css ${bytes(path.join(dist, 'assets', 'venqore.css'))} · js ${bytes(path.join(dist, 'assets', 'venqore.js'))}`);
for (const f of fs.readdirSync(dist).filter(x => x.endsWith('.html')).sort()) {
  console.log(`   ${f.padEnd(20)} ${bytes(path.join(dist, f))}`);
}
