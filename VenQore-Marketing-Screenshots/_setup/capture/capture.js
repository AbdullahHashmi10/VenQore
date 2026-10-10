// VenQore screenshot capture. Reads shots.json, logs into the LOCAL demo store, saves lossless 1920x1080 PNGs.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const ROOT = path.resolve(__dirname, '..', '..');           // VenQore-Marketing-Screenshots
const BASE = 'http://127.0.0.1:8001';
const creds = Object.fromEntries(fs.readFileSync(path.join(__dirname, '..', 'demo-login.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const SLUG = creds['store slug'] || 'al-noor-mart';
const only = process.argv[2] || '';                          // optional filter substring on shot name/folder
const shots = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.SHOTS || 'shots.json'), 'utf8'));
const log = (m) => { const l = new Date().toISOString().slice(11, 19) + ' ' + m; console.log(l); fs.appendFileSync(path.join(__dirname, '..', 'capture.log'), l + '\n'); };

async function dismiss(page) {
  for (const t of ['Skip for now', 'Skip tour', 'Skip', 'Got it', 'Maybe later', 'Dismiss']) {
    const b = page.getByRole('button', { name: t, exact: true }).first();
    if (await b.isVisible({ timeout: 300 }).catch(() => false)) await b.click({ timeout: 1500 }).catch(() => {});
  }
  await page.addStyleTag({ content: '[class*="toast" i],[role="status"][class*="Toast" i]{display:none!important}' }).catch(() => {});
}

(async () => {
  fs.writeFileSync(path.join(__dirname, '..', 'capture.log'), '');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const themes = ['light', 'dark'];
  let n = 0, bad = 0;
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: theme });
    await ctx.addInitScript((t) => { try { ['amd_theme', 'vq-theme', 'vq_theme'].forEach(k => localStorage.setItem(k, t)); localStorage.setItem('amd_onboarding_complete', 'true'); localStorage.setItem('amd_onboarding_driver_complete', 'true'); } catch (e) {} }, theme);
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type=email]', creds.email); await page.fill('input[type=password]', creds.password);
    await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.keyboard.press('Enter')]);
    log(`logged in (${theme})`);
    for (const s of shots) {
      if (s.mobile) continue;
      if (only && !(s.folder + '/' + s.name).includes(only)) continue;
      if (s.theme && s.theme !== theme) continue;
      const dir = path.join(ROOT, s.folder, 'Desktop', theme === 'light' ? 'Light' : 'Dark'); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${s.name}-${theme}.png`);
      try {
        await page.goto(BASE + s.url.replace('{slug}', SLUG), { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(s.wait || 3500);
        await dismiss(page);
        for (const a of (s.actions || [])) {
          if (a.click) await page.locator(a.click).first().click({ timeout: 5000 }).catch(e => log('  action fail ' + a.click));
          if (a.text) await page.getByText(a.text, { exact: !!a.exact }).first().click({ timeout: 5000 }).catch(e => log('  action fail text ' + a.text));
          if (a.fill) await page.locator(a.fill[0]).first().fill(a.fill[1]).catch(() => {});
          if (a.scroll) await page.mouse.wheel(0, a.scroll);
          await page.waitForTimeout(a.wait || 1200);
        }
        await page.screenshot({ path: file, fullPage: false });
        n++; log('ok  ' + path.relative(ROOT, file));
      } catch (e) { bad++; log('ERR ' + s.name + ' ' + e.message.split('\n')[0]); }
    }
    await ctx.close();
  }
  // mobile web
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme });
    await ctx.addInitScript((t) => { try { ['amd_theme', 'vq-theme', 'vq_theme'].forEach(k => localStorage.setItem(k, t)); localStorage.setItem('amd_onboarding_complete', 'true'); localStorage.setItem('amd_onboarding_driver_complete', 'true'); } catch (e) {} }, theme);
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type=email]', creds.email); await page.fill('input[type=password]', creds.password);
    await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.keyboard.press('Enter')]);
    for (const s of shots) {
      if (!s.mobile) continue;
      if (only && !(s.folder + '/' + s.name).includes(only)) continue;
      const dir = path.join(ROOT, s.folder, 'Mobile-Web', theme === 'light' ? 'Light' : 'Dark'); fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, `${s.name}-mobile-web-${theme}.png`);
      try {
        await page.goto(BASE + s.url.replace('{slug}', SLUG), { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(s.wait || 3500); await dismiss(page);
        await page.screenshot({ path: file }); n++; log('ok  ' + path.relative(ROOT, file));
      } catch (e) { bad++; log('ERR ' + s.name + ' ' + e.message.split('\n')[0]); }
    }
    await ctx.close();
  }
  await browser.close();
  log(`DONE ${n} saved, ${bad} errors`);
})().catch(e => { log('FATAL ' + e.message); process.exit(1); });
