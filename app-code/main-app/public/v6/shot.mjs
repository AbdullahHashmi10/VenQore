import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const dist = '/home/claude/v6/dist';
const out = '/home/claude/v6/shots';
fs.mkdirSync(out, { recursive: true });

const args  = process.argv.slice(2);
const only  = args.filter(a => !a.startsWith('-'));
const dark  = args.includes('--dark');
const steps = args.includes('--steps');
const width = parseInt((args.find(a => a.startsWith('--w=')) || '--w=1440').slice(4), 10);
const dsf   = parseFloat((args.find(a => a.startsWith('--dsf=')) || '--dsf=1').slice(6));
const vh    = parseInt((args.find(a => a.startsWith('--vh=')) || '--vh=900').slice(5), 10);

const pages = only.length ? only : fs.readdirSync(dist).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--font-render-hinting=none'],
});
const ctx = await browser.newContext({
  viewport: { width, height: vh },
  deviceScaleFactor: dsf,
  colorScheme: dark ? 'dark' : 'light',
});
const errors = [];
const tag = (dark ? '-dark' : '') + (width !== 1440 ? '-w' + width : '');

for (const name of pages) {
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  p.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  await p.goto('file://' + path.join(dist, name + '.html'), { waitUntil: 'load' });
  if (dark) await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.classList.add('dark'); });

  // Fire every reveal and let charts draw.
  await p.addStyleTag({content:'html{scroll-behavior:auto !important}'});
  await p.evaluate(async () => {
    const H = document.body.scrollHeight;
    for (let y = 0; y < H; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
  });
  await p.waitForTimeout(2600);

  const H = await p.evaluate(() => document.body.scrollHeight);
  const n = Math.min(Math.ceil(H / vh), 30);
  for (let i = 0; i < n; i++) {
    await p.evaluate(y => window.scrollTo(0, y), i * vh);
    await p.waitForTimeout(steps ? 260 : 160);
    await p.screenshot({ path: path.join(out, `${name}${tag}-${String(i).padStart(2, '0')}.png`) });
  }
  await p.close();
  console.log('▸', name + tag, `${n} frames · ${H}px`);
}
await browser.close();
if (errors.length) { console.log('\n⚠ console errors:'); [...new Set(errors)].slice(0, 24).forEach(e => console.log('  ', e)); }
else console.log('\n✓ no console errors');
