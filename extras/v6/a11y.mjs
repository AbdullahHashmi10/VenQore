/* Contrast sweep. DESIGN-RULES §15: body text ≥ 4.5:1, large text and UI
   boundaries ≥ 3:1, in BOTH themes. */
import { chromium } from 'playwright';
import fs from 'node:fs';

const dist = '/home/claude/v6/dist';
const pages = fs.readdirSync(dist).filter(f => f.endsWith('.html')).map(f => f.replace('.html', ''));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const AUDIT = `(() => {
  const lum = (r,g,b) => { const f = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const parse = s => { const m = s.match(/rgba?\\(([\\d.]+)[,\\s]+([\\d.]+)[,\\s]+([\\d.]+)(?:[,/\\s]+([\\d.]+))?/);
    return m ? [+m[1],+m[2],+m[3], m[4]===undefined?1:+m[4]] : null; };
  const over = (fg,bg) => fg[3]>=1 ? fg : [0,1,2].map(i => fg[i]*fg[3] + bg[i]*(1-fg[3])).concat([1]);
  const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16), 1];
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const c = parse(cs.backgroundColor);
      if (c && c[3] > 0.85) return c;                 // an opaque own background wins
      const known = cs.getPropertyValue('--vq-known-bg').trim();
      if (known === 'skip') return 'skip';
      if (known.startsWith('#')) return hex(known);
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [255,255,255,1];
  };
  const out = [];
  const sel = 'p, li, span, a, b, td, th, h1, h2, h3, h4, label, button, .vq-caption, .vq-small, .vq-eyebrow';
  const seen = new Set();
  document.querySelectorAll(sel).forEach(el => {
    if (!el.textContent.trim()) return;
    if (el.closest('.watermark-wrapper, .vq-footer__mark')) return;
    if (el.querySelector(sel)) return;              // only leaf text
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity < 0.15) return;
    const fg0 = parse(cs.color); if (!fg0) return;
    const bg = bgOf(el);
    if (bg === 'skip') return;
    const fg = over(fg0, bg);
    const L1 = lum(fg[0],fg[1],fg[2]), L2 = lum(bg[0],bg[1],bg[2]);
    const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    const px = parseFloat(cs.fontSize), w = +cs.fontWeight || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5;
    if (ratio + 0.03 < need) {
      const key = cs.color + '|' + bg.join(',') + '|' + Math.round(px);
      if (seen.has(key)) return; seen.add(key);
      out.push({ t: el.textContent.trim().slice(0,44), r: +ratio.toFixed(2), need,
                 px: Math.round(px), cls: (el.className||'').toString().slice(0,42) });
    }
  });
  return out;
})()`;

let total = 0;
for (const dark of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
  console.log(`\n══ ${dark ? 'DARK' : 'LIGHT'} ══`);
  for (const name of pages) {
    const p = await ctx.newPage();
    await p.goto(`file://${dist}/${name}.html`, { waitUntil: 'load' });
    if (dark) await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); document.documentElement.classList.add('dark'); });
    await p.addStyleTag({ content: 'html{scroll-behavior:auto !important} .vq-reveal{opacity:1 !important;transform:none !important}' });
    await p.waitForTimeout(500);
    const res = await p.evaluate(AUDIT);
    if (res.length) {
      console.log(` ${name}:`);
      res.slice(0, 8).forEach(r => console.log(`   ${String(r.r).padStart(5)} (need ${r.need}) ${String(r.px).padStart(2)}px  "${r.t}"  .${r.cls}`));
      total += res.length;
    }
    await p.close();
  }
  await ctx.close();
}
console.log(`\n${total ? '⚠' : '✓'} ${total} contrast finding(s)\n`);
await b.close();
