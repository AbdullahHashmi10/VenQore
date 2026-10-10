/**
 * The till's offline sale queue in a REAL browser (Chromium via Playwright):
 * the real Dexie database (IndexedDB) and the real useOfflineSync hook,
 * against a small local server that records every sale it receives.
 *
 *  1. Upgrade: rows an old build (schema v3) left behind survive the v4
 *     upgrade, nothing is cleared, and rows with no store / version are held,
 *     never sent.
 *  2. Several tabs: two tabs of the same till syncing at the same moment send
 *     every queued sale exactly once.
 *  3. Storage full: when the browser refuses to store a sale, the queue says
 *     so (returns false) — it never claims the sale was kept.
 *  4. Lost answer: a sale whose response was lost is checked with the server
 *     by the SAME key before anything is resent.
 *
 *   npm install --no-save playwright@1.56.0
 *   npx playwright install chromium
 *   node --test --test-reporter=spec verification/sale-reliability/browser/queue.browser.test.mjs
 *
 * (Installed without saving, as the CI job does, so package.json and the
 * lock file are untouched.)
 */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import { buildHarness } from './build.mjs';

const STORE = { id: 11, slug: 'store-a' };
let outdir, server, base, browser;

// ── the test server ───────────────────────────────────────────────────────
const state = { received: [], lookups: [], committed: new Map(), delayMs: 0, dropFirstAnswer: false };
function resetServer() {
    state.received = []; state.lookups = []; state.committed = new Map(); state.delayMs = 0; state.dropFirstAnswer = false;
}
const page = (script) => `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div>
<script>window.__PAGE__ = ${JSON.stringify({ store: STORE, auth: { user: { id: 7 } } })};</script>
<script src="/${script}.js"></script></body></html>`;

function json(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
}

async function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page('harness')); }
    if (req.method === 'GET' && url.pathname === '/old.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page('old')); }
    if (req.method === 'GET' && /^\/(harness|old)\.js$/.test(url.pathname)) {
        res.writeHead(200, { 'content-type': 'text/javascript' });
        return res.end(fs.readFileSync(path.join(outdir, url.pathname.slice(1))));
    }
    const intent = url.pathname.match(/^\/s\/([^/]+)\/pos\/sales\/intent\/(.+)$/);
    if (req.method === 'GET' && intent) {
        state.lookups.push(decodeURIComponent(intent[2]));
        const sale = state.committed.get(decodeURIComponent(intent[2]));
        return sale ? json(res, 200, { success: true, outcome: 'committed', ...sale }) : json(res, 200, { success: true, outcome: 'not_found', idempotency_key: intent[2] });
    }
    if (req.method === 'POST' && /^\/s\/[^/]+\/pos\/queue-status$/.test(url.pathname)) {
        await new Promise(r => req.on('data', () => {}).on('end', r));
        return json(res, 200, { success: true });
    }
    if (req.method === 'POST' && /^\/s\/[^/]+\/pos\/sales$/.test(url.pathname)) {
        let raw = '';
        await new Promise(r => req.on('data', c => { raw += c; }).on('end', r));
        const body = JSON.parse(raw || '{}');
        state.received.push(body.idempotency_key);
        if (state.delayMs) await new Promise(r => setTimeout(r, state.delayMs));
        // Like the real server: one sale per key, replays get the same sale.
        let sale = state.committed.get(body.idempotency_key);
        if (!sale) {
            sale = { sale_id: `sale-${state.committed.size + 1}`, reference: `INV-${state.committed.size + 1}`, idempotency_key: body.idempotency_key, invoice_total: '100.00' };
            state.committed.set(body.idempotency_key, sale);
        }
        // Committed, but the till gets a gateway error page instead of the answer.
        // (A bare dropped connection is not used: Chromium itself silently
        // resends a POST whose reused keep-alive connection was reset — which
        // is exactly why the server's (store, key) index must hold.)
        if (state.dropFirstAnswer) { state.dropFirstAnswer = false; res.writeHead(504, { 'content-type': 'text/html' }); return res.end('<html>Gateway Timeout</html>'); }
        return json(res, 201, { success: true, outcome: 'committed', status: 'posted', ...sale });
    }
    res.writeHead(404); res.end();
}

before(async () => {
    outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'queue-browser-'));
    await buildHarness(outdir);
    server = http.createServer((req, res) => { handle(req, res).catch(e => { res.writeHead(500); res.end(String(e)); }); });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch();
});
after(async () => {
    await browser?.close();
    server?.close();
    fs.rmSync(outdir, { recursive: true, force: true });
});
beforeEach(() => resetServer());

async function openTill(context, file = '/') {
    const p = await context.newPage();
    p.on('pageerror', e => { throw e; });
    await p.goto(base + file);
    if (file === '/') await p.waitForFunction(() => window.__ready === true);
    return p;
}

/** Keep syncing until no row is waiting to be sent (the 'online' event also starts syncs). */
async function settle(p, { want = ['synced', 'quarantined', 'needs_attention', 'conflict', 'uncertain'], timeoutMs = 15000 } = {}) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        await p.evaluate(() => window.__queue.syncPendingSales());
        const statuses = await p.evaluate(() => window.__queue.rows().then(rs => rs.map(r => r.status)));
        if (statuses.every(st => want.includes(st))) return statuses;
        await p.waitForTimeout(100);
    }
    throw new Error('the queue did not settle');
}

// ── 1. upgrade from the old build ─────────────────────────────────────────
test('rows an old build left behind survive the v4 upgrade and are held, not sent', async () => {
    const context = await browser.newContext();
    const old = await openTill(context, '/old.html');
    await old.waitForFunction(() => window.__oldReady === true);
    const seeded = await old.evaluate(() => window.seedOldBuild([
        { created_at: new Date('2026-10-01T10:00:00Z'), status: 'pending', data: { items: [{ product_id: 'p1', quantity: 1, price: 100 }], total: 100 } },
        { created_at: new Date('2026-10-01T11:00:00Z'), status: 'pending', tenant_id: 11, data: { items: [], total: 50 } },
    ]));
    assert.equal(seeded.rows, 2);
    await old.close();

    const till = await openTill(context);
    assert.equal(await till.evaluate(() => window.__queue.dbVersion()), 4);
    await till.evaluate(() => window.__queue.syncPendingSales());
    const rows = await till.evaluate(() => window.__queue.rows());
    assert.equal(rows.length, 2, 'no queued sale was lost in the upgrade');
    assert.deepEqual(state.received, [], 'nothing from the old build was sent on a guess');
    assert.ok(rows.every(r => r.status === 'quarantined'), JSON.stringify(rows.map(r => [r.status, r.last_error])));
    // The rest of the old database is untouched.
    assert.deepEqual(await till.evaluate(() => window.__queue.products().then(ps => ps.map(p => p.id))), ['p1']);
    // A person can still export what belongs to this store.
    const exported = JSON.parse(await till.evaluate(() => window.__queue.exportUnresolved()));
    assert.equal(exported.rows.length, 1);
    await context.close();
});

// ── 2. two tabs ───────────────────────────────────────────────────────────
test('two tabs syncing at the same moment send every queued sale exactly once', async () => {
    const context = await browser.newContext();
    const a = await openTill(context);
    const b = await openTill(context);

    await context.setOffline(true);
    const keys = await a.evaluate(async () => {
        const out = [];
        for (let i = 0; i < 12; i++) {
            const key = window.__queue.newIntentKey();
            const ok = await window.__queue.saveOfflineSale({ idempotency_key: key, items: [{ product_id: 'p1', quantity: 1, price: 100 }], expected_total: 100, calculation_version: 2 });
            if (!ok) throw new Error('could not queue');
            out.push(key);
        }
        return out;
    });
    assert.equal(keys.length, 12);
    assert.deepEqual(state.received, []);

    state.delayMs = 40; // widen the window for a double send
    await context.setOffline(false);
    await Promise.all([
        a.evaluate(() => window.__queue.syncPendingSales()),
        b.evaluate(() => window.__queue.syncPendingSales()),
        a.evaluate(() => window.__queue.syncPendingSales()),
        b.evaluate(() => window.__queue.syncPendingSales()),
    ]);
    // Whatever was skipped because the other tab held the queue goes on the next pass.
    await settle(b, { want: ['synced'] });
    await settle(a, { want: ['synced'] });

    const counts = {};
    for (const k of state.received) counts[k] = (counts[k] || 0) + 1;
    assert.deepEqual(Object.keys(counts).sort(), [...keys].sort(), 'every queued sale reached the server');
    assert.ok(Object.values(counts).every(n => n === 1), `a sale was sent twice: ${JSON.stringify(counts)}`);
    const rows = await a.evaluate(() => window.__queue.rows());
    assert.ok(rows.every(r => r.status === 'synced'), JSON.stringify(rows.map(r => r.status)));
    await context.close();
});

// ── 3. storage full ───────────────────────────────────────────────────────
test('when the browser refuses to store a sale, the queue says so instead of claiming it', async () => {
    const context = await browser.newContext();
    const blank = await context.newPage();
    const cdp = await context.newCDPSession(blank);
    await cdp.send('Storage.overrideQuotaForOrigin', { origin: base, quotaSize: 1024 });
    const till = await openTill(context);

    await context.setOffline(true);
    const result = await till.evaluate(async () => {
        const big = 'x'.repeat(4 * 1024 * 1024);
        return window.__queue.saveOfflineSale({ idempotency_key: window.__queue.newIntentKey(), items: [{ product_id: 'p1', quantity: 1, price: 100, note: big }], expected_total: 100, calculation_version: 2 });
    });
    assert.equal(result, false, 'a sale the device could not store must not be reported as saved');
    await cdp.send('Storage.overrideQuotaForOrigin', { origin: base });
    await context.close();

    // Control: the same sale with normal storage is kept.
    const ok = await browser.newContext();
    const t2 = await openTill(ok);
    await ok.setOffline(true);
    const id = await t2.evaluate(async () => window.__queue.saveOfflineSale({ idempotency_key: window.__queue.newIntentKey(), items: [{ product_id: 'p1', quantity: 1, price: 100, note: 'x'.repeat(4 * 1024 * 1024) }], expected_total: 100, calculation_version: 2 }));
    assert.ok(id, 'with room to spare the same sale is stored');
    await ok.close();
});

// ── 4. lost answer ────────────────────────────────────────────────────────
test('a sale whose answer was lost is checked by the same key and never rung twice', async () => {
    const context = await browser.newContext();
    const till = await openTill(context);

    await context.setOffline(true);
    const key = await till.evaluate(async () => {
        const key = window.__queue.newIntentKey();
        await window.__queue.saveOfflineSale({ idempotency_key: key, items: [{ product_id: 'p1', quantity: 1, price: 100 }], expected_total: 100, calculation_version: 2 });
        return key;
    });
    state.dropFirstAnswer = true; // the server books it, the till never hears back
    await context.setOffline(false);

    // The till keeps the sale as "status unconfirmed" (never "not saved")...
    const first = await settle(till, { want: ['uncertain', 'synced'] });
    assert.deepEqual(first, ['uncertain']);
    // ...then (after its back-off, here forced) asks the server about the SAME
    // key, finds the sale and marks it synced without ringing it again.
    await till.evaluate(() => window.__queue.rows().then(rs => window.__queue.retryPendingSale(rs[0].id)));
    await settle(till, { want: ['synced'] });
    const row = (await till.evaluate(() => window.__queue.rows()))[0];
    assert.equal(row.sale_id, 'sale-1');
    assert.equal(state.committed.size, 1);
    assert.deepEqual(state.received, [key], `sent once; the second pass found it by its key. lookups=${JSON.stringify(state.lookups)}`);
    assert.ok(state.lookups.includes(key), 'the till asked the server about the same key');
    await context.close();
});
