// VenQore capture worker. Stays running, watches ../queue/*.json for capture jobs (declarative steps only), writes results to ../queue/done/.
// Job: { "id":"x", "themes":["light","dark"], "mobile":false, "scenarios":[ { "folder":"01-Dashboard", "steps":[ {goto:"/s/{slug}/dashboard"}, {click:"css"}, {text:"Label"}, {fill:["css","value"]}, {press:"Escape"}, {scroll:600}, {wait:1500}, {shot:"name"}, {preview:"name"}, {dump:"name"} ] } ] }
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const S = path.resolve(__dirname, '..'), ROOT = path.resolve(S, '..'), Q = path.join(S, 'queue');
const BASE = 'http://127.0.0.1:8001';
const creds = () => Object.fromEntries(fs.readFileSync(path.join(S, 'demo-login.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const log = (m) => { const l = new Date().toISOString().slice(11, 19) + ' ' + m; console.log(l); fs.appendFileSync(path.join(S, 'worker.log'), l + '\n'); };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function newSession(browser, theme, mobile) {
  const c = creds();
  const ctx = await browser.newContext(mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, colorScheme: theme });
  await ctx.addInitScript((t) => { try { ['amd_theme', 'vq-theme', 'vq_theme'].forEach(k => localStorage.setItem(k, t)); localStorage.setItem('amd_onboarding_complete', 'true'); localStorage.setItem('amd_onboarding_driver_complete', 'true'); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type=email]', c.email); await page.fill('input[type=password]', c.password);
  await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.keyboard.press('Enter')]);
  return { ctx, page, slug: c['store slug'] || 'al-noor-mart' };
}
async function dismiss(page) {
  for (const t of ['Skip for now', 'Skip tour', 'Got it', 'Maybe later', 'Dismiss']) {
    const b = page.getByRole('button', { name: t, exact: true }).first();
    if (await b.isVisible({ timeout: 250 }).catch(() => false)) await b.click({ timeout: 1500 }).catch(() => {});
  }
  await page.addStyleTag({ content: '[class*="toast" i]{display:none!important}' }).catch(() => {});
}
async function runScenario(sess, theme, sc, mobile, res) {
  const { page, slug } = sess;
  const dir = path.join(ROOT, sc.folder, mobile ? 'Mobile-Web' : 'Desktop', theme === 'light' ? 'Light' : 'Dark'); fs.mkdirSync(dir, { recursive: true });
  for (const st of sc.steps) {
    try {
      if (st.theme && st.theme !== theme) { if (st.shot || st.preview) continue; }
      if (st.goto) { await page.goto(BASE + st.goto.replace('{slug}', slug), { waitUntil: 'domcontentloaded', timeout: 45000 }); await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(st.wait || 3500); await dismiss(page); }
      else if (st.click) { await page.locator(st.click).first().click({ timeout: 6000 }); await page.waitForTimeout(st.wait || 1200); }
      else if (st.text) { await page.getByText(st.text, { exact: !!st.exact }).first().click({ timeout: 6000 }); await page.waitForTimeout(st.wait || 1200); }
      else if (st.role) { await page.getByRole(st.role[0], { name: st.role[1] }).first().click({ timeout: 6000 }); await page.waitForTimeout(st.wait || 1200); }
      else if (st.xy) { await page.mouse.click(st.xy[0], st.xy[1]); await page.waitForTimeout(st.wait || 1200); }
      else if (st.fill) { await page.locator(st.fill[0]).first().fill(st.fill[1]); await page.waitForTimeout(st.wait || 600); }
      else if (st.type) { await page.keyboard.type(st.type, { delay: 25 }); await page.waitForTimeout(st.wait || 600); }
      else if (st.press) { await page.keyboard.press(st.press); await page.waitForTimeout(st.wait || 800); }
      else if (st.scroll !== undefined) { await page.mouse.move(960, 600); await page.mouse.wheel(0, st.scroll); await page.waitForTimeout(st.wait || 900); }
      else if (st.wait) { await page.waitForTimeout(st.wait); }
      else if (st.shot) { const f = path.join(dir, `${st.shot}${mobile ? '-mobile-web' : ''}-${theme}.png`); await page.screenshot({ path: f }); res.saved.push(path.relative(ROOT, f)); }
      else if (st.preview) { const f = path.join(S, 'preview', `${st.preview}-${theme}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 70 }); res.previews.push(path.relative(S, f)); }
      else if (st.dump) { const t = await page.evaluate(() => ({ url: location.href, title: document.title, buttons: [...document.querySelectorAll('button,a[href],[role=tab]')].filter(e => e.getBoundingClientRect().width > 0).map(e => (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || e.className.toString().slice(0, 40)).trim().replace(/\s+/g, ' ').slice(0, 50)).filter(Boolean).slice(0, 120), text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 1500) })); fs.writeFileSync(path.join(S, 'preview', `${st.dump}-${theme}.json`), JSON.stringify(t, null, 1)); res.previews.push(`preview/${st.dump}-${theme}.json`); }
    } catch (e) { res.errors.push(`${sc.folder} ${JSON.stringify(st).slice(0, 80)} :: ${e.message.split('\n')[0]}`); if (st.required) break; }
  }
}
async function processJob(browser, file) {
  const job = JSON.parse(fs.readFileSync(file, 'utf8')); const id = job.id || path.basename(file, '.json');
  const res = { id, saved: [], previews: [], errors: [], started: new Date().toISOString() };
  log('job ' + id);
  for (const theme of (job.themes || ['light', 'dark'])) {
    const sess = await newSession(browser, theme, !!job.mobile).catch(e => { res.errors.push('login ' + e.message); return null; });
    if (!sess) continue;
    for (const sc of job.scenarios) await runScenario(sess, theme, sc, !!job.mobile, res);
    await sess.ctx.close();
  }
  res.finished = new Date().toISOString();
  fs.writeFileSync(path.join(Q, 'done', id + '.result.json'), JSON.stringify(res, null, 1));
  fs.renameSync(file, path.join(Q, 'done', path.basename(file)));
  log(`job ${id} done: ${res.saved.length} saved, ${res.previews.length} previews, ${res.errors.length} errors`);
}
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  log('worker ready - watching ' + Q);
  for (;;) {
    const jobs = fs.readdirSync(Q).filter(f => f.endsWith('.json')).sort();
    for (const j of jobs) { try { await processJob(browser, path.join(Q, j)); } catch (e) { log('job fail ' + j + ' ' + e.message); try { fs.renameSync(path.join(Q, j), path.join(Q, 'done', j + '.failed')); } catch (_) {} } }
    await sleep(2000);
  }
})();
