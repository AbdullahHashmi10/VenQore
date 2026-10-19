/*
 * Smoke test: visits store pages, checks status, console/page errors, dock/rail, list toolbar.
 *
 * HOW TO RUN
 *   1. Start the app (php artisan serve --host=127.0.0.1 --port=8000, and vite/built assets).
 *   2. One-time: npm i -D @playwright/test && npx playwright install chromium
 *      (Playwright is NOT currently installed in node_modules.)
 *   3. TEST_EMAIL=you@example.com TEST_PASSWORD=secret npm run test:smoke
 *
 * Env: BASE_URL (default http://127.0.0.1:8000), STORE_SLUG (default meridian-global),
 *      TEST_EMAIL / TEST_PASSWORD, or STORAGE_STATE=path/to/state.json to reuse a session
 *      (a fresh state is saved to tests/e2e/.auth/state.json after login).
 * Prints a summary table, exits non-zero if any page fails.
 * List pages (LIST: true) additionally require a visible first toolbar row.
 * Toolbar selector can be overridden with TOOLBAR_SELECTOR.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const SLUG = process.env.STORE_SLUG || 'meridian-global';
const STATE = process.env.STORAGE_STATE || 'tests/e2e/.auth/state.json';
const TOOLBAR = process.env.TOOLBAR_SELECTOR || '[data-list-toolbar], [data-testid="list-toolbar"], [data-list-shell] > :first-child';
const DOCK = '#tour-dock-pos, [data-dock-rail], [data-testid="dock-rail"], nav[aria-label*="ock" i], nav[aria-label*="ail" i]';

// [path under /s/{slug}, isListPage]
const PAGES = [
  ['/dashboard', false], ['/home', false], ['/pos', false], ['/profile', false], ['/settings', false],
  ['/notifications', true], ['/activity-log', true],
  ['/sales', true], ['/sales/list', true], ['/sales/master', true], ['/sales/parked', true], ['/sales/pre-sales', true],
  ['/sales-orders', true], ['/returns-history', true], ['/recurring-invoices', true], ['/invoice-reminders', true],
  ['/proposals', true], ['/debit-notes', true],
  ['/purchases', true], ['/purchase-orders', true], ['/suppliers', true], ['/customers', true], ['/parties', true],
  ['/parties/ledgers', true],
  ['/inventory', true], ['/inventory/list', true], ['/inventory/categories', true], ['/inventory/stock', true],
  ['/inventory/stock-levels', true], ['/inventory/production', true], ['/batches', true], ['/serials', true],
  ['/attributes', true], ['/stock-audit', true], ['/stock-operations', true], ['/stock-transfers', true],
  ['/expenses', true], ['/payments', true], ['/payments/in', true], ['/payments/out', true],
  ['/funds', false], ['/funds/cash-history', true], ['/bank-accounts', true], ['/bank-reconciliation', false],
  ['/finance', false], ['/finance/accounts', true], ['/finance/journal', true], ['/finance/payables', true],
  ['/finance/receivables', true], ['/transactions', true],
  ['/accounting', false], ['/accounting/balance-sheet', false], ['/accounting/chart', true], ['/accounting/p-and-l', false],
  ['/reports', false], ['/reports/dashboard', false], ['/reports/sales', false], ['/reports/purchases', false],
  ['/reports/expenses', false], ['/reports/profit-loss', false], ['/reports/tax', false], ['/reports/day-book', false],
  ['/reports/low-stock', false], ['/reports/stock-valuation', false], ['/reports/trial-balance', false],
  ['/staff', true], ['/staff-attendance', true], ['/staff/attendance', true],
  ['/admin', false], ['/admin/dashboard', false], ['/admin/settings', false], ['/admin/users', true],
  ['/admin/staff', true], ['/admin/logs', true], ['/admin/recycle-bin', true], ['/admin/attendance', true],
  ['/admin-panel', false], ['/admin-panel/users', true], ['/admin-panel/staff', true], ['/admin-panel/logs', true],
  ['/cookbook', true], ['/manufacturing/rules', true], ['/marketing/campaigns', true],
  ['/growth-engine', false], ['/growth-engine/dashboard', false], ['/growth-engine/settings', false],
  ['/online-store-manager', false], ['/billing', false], ['/e-invoicing', false], ['/woo/connections', true],
  ['/vensynq', false], ['/vensynq/settings', false],
  ['/v3/dashboard', false], ['/v3/products', true], ['/v3/purchases', true], ['/v3/warehouses', true],
];

const results = [];
const browser = await chromium.launch();
const ctxOpts = { viewport: { width: 1440, height: 900 } };
if (fs.existsSync(STATE)) ctxOpts.storageState = STATE;
const ctx = await browser.newContext(ctxOpts);
const page = await ctx.newPage();

if (!fs.existsSync(STATE)) {
  const { TEST_EMAIL, TEST_PASSWORD } = process.env;
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('Set TEST_EMAIL and TEST_PASSWORD (or STORAGE_STATE).');
    process.exit(2);
  }
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL);
  await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 30000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await ctx.storageState({ path: STATE });
}

for (const [p, isList] of PAGES) {
  const url = `${BASE}/s/${SLUG}${p}`;
  const problems = [];
  const onErr = (e) => problems.push('pageerror: ' + String(e.message).slice(0, 160));
  const onMsg = (m) => { if (m.type() === 'error') problems.push('console: ' + m.text().slice(0, 160)); };
  page.on('pageerror', onErr);
  page.on('console', onMsg);
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    status = res ? res.status() : 0;
    if (status >= 400 || status === 0) problems.push('HTTP ' + status);
    if (!(await page.locator(DOCK).first().isVisible().catch(() => false))) problems.push('dock/rail missing');
    if (isList && !(await page.locator(TOOLBAR).first().isVisible().catch(() => false))) problems.push('toolbar row not visible');
  } catch (e) {
    problems.push('nav: ' + String(e.message).slice(0, 120));
  }
  page.off('pageerror', onErr);
  page.off('console', onMsg);
  results.push({ path: p, status, ok: problems.length === 0, problems: problems.join(' | ') });
}

await browser.close();
console.table(results.map((r) => ({ path: r.path, status: r.status, result: r.ok ? 'PASS' : 'FAIL', problems: r.problems })));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
