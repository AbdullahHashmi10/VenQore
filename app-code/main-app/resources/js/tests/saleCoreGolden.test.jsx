// @vitest-environment jsdom
/**
 * CHARACTERISATION TEST — FOH plan, Phase 0.
 *
 * Mounts the REAL Pos.jsx, seeds a cart, presses Pay, and records
 *   (a) the totals the register shows, and
 *   (b) the exact body POSTed to store.pos.sales.store.
 * The recorded output is compared to resources/js/tests/fixtures/sale-core/*.json.
 *
 * Phase 1 (Sale Core extraction) must keep every fixture byte-for-byte equal.
 * To (re)record from today's code:  UPDATE_GOLDEN=1 npx vitest run resources/js/tests/saleCoreGolden.test.jsx
 * Never re-record to make a failing refactor pass.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import { CASES } from './fixtures/sale-core/cases.js';

const posts = [];
let seededSessions = [];

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    return {
        usePage: () => ({
            url: '/stores/test/pos',
            props: {
                auth: { user: { id: 1, name: 'Owner', is_owner: true, role: 'owner', permissions: [] } },
                store: { slug: 'test', name: 'Test Store', currency_code: 'PKR' },
                modules: [],
                terms: {},
                flash: {},
            },
        }),
        router: { on: () => () => {}, post: vi.fn(), get: vi.fn(), visit: vi.fn(), reload: vi.fn() },
        Link: ({ children, href, ...p }) => React.createElement('a', { href, ...p }, children),
        Head: () => null,
        useForm: (init = {}) => ({ data: init, setData() {}, post() {}, put() {}, patch() {}, delete() {}, get() {}, processing: false, errors: {}, reset() {}, clearErrors() {}, setError() {}, transform() {}, isDirty: false }),
        useRemember: (v) => [v, () => {}],
    };
});

vi.mock('@/Contexts/WorkspaceContext', () => ({
    useWorkspace: () => ({
        posSessions: seededSessions,
        currentPosId: seededSessions[0]?.id,
        setCurrentPosId: () => {},
        addPosSession: () => {},
        updatePosSession: () => {},
        removePosSession: () => {},
    }),
}));

vi.mock('@/DB/LocalDB', () => {
    const chain = () => {
        const p = Promise.resolve([]);
        return new Proxy(p, { get: (t, k) => (k in t ? (typeof t[k] === 'function' ? t[k].bind(t) : t[k]) : () => chain()) });
    };
    const table = new Proxy({}, { get: () => () => chain() });
    const db = new Proxy({}, { get: (_, k) => (k === 'then' ? undefined : k === 'transaction' ? async (...a) => { const f = a[a.length - 1]; return typeof f === 'function' ? f() : undefined; } : table) });
    return { db, default: db };
});

vi.mock('axios', () => {
    const ok = (data = {}) => Promise.resolve({ data, status: 200 });
    const api = {
        get: vi.fn(() => ok([])),
        post: vi.fn((url, body) => {
            if (url === 'store.pos.sales.store') {
                posts.push(JSON.parse(JSON.stringify(body)));
                return ok({ success: true, sale_id: 1, reference: 'INV-0001', notifications: [] });
            }
            return ok({});
        }),
        put: vi.fn(() => ok({})),
        patch: vi.fn(() => ok({})),
        delete: vi.fn(() => ok({})),
        defaults: { headers: { common: {} } },
        interceptors: { request: { use() {} }, response: { use() {} } },
    };
    return { default: api, ...api };
});

beforeEach(() => {
    posts.length = 0;
    localStorage.clear();
    sessionStorage.clear();
    globalThis.route = (name) => (name === undefined ? { current: () => false, has: () => false, params: {} } : name);
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.HTMLElement.prototype.scrollBy = () => {};
    window.HTMLElement.prototype.scrollTo = () => {};
    window.scrollTo = () => {};
    cleanup();
});

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures/sale-core');

describe('Sale core characterisation (today\'s Pos.jsx)', () => {
    for (const c of CASES) {
        it(c.name, async () => {
            Object.entries({ pos_auto_fill_cash: 'true', pos_round_off: 'false', pos_enable_tax: 'true', ...(c.local || {}) })
                .forEach(([k, v]) => localStorage.setItem(k, v));
            seededSessions = [{
                id: 'S1', type: 'pos', cashReceived: '', searchTerm: '', customer: null,
                discountType: 'fixed', discountValue: 0, ...(c.sale || {}), cart: c.cart,
            }];

            const { default: Pos } = await import('@/Pages/Pos');
            const { container } = render(
                <Pos
                    settings={{ business_name: 'Test', currency_symbol: 'Rs', decimal_places: '2', default_tax_rate: '0', ...(c.settings || {}) }}
                    bankAccounts={[]}
                    warehouses={[]}
                    terminal={c.terminal || 'counter'}
                />,
            );

            const pay = await waitFor(() => {
                const b = container.querySelector('#tour-pos-checkout') || container.querySelector('button[data-primary="1"]');
                if (!b) throw new Error('Pay button not found');
                return b;
            }, { timeout: 8000 });
            const shownBefore = (container.textContent.match(/Total payable[^0-9-]*([0-9][0-9,]*\.?[0-9]*)/) || [])[1] || null;
            await act(async () => { fireEvent.click(pay); });
            await waitFor(() => expect(posts.length).toBe(1), { timeout: 8000 });

            const recorded = { case: c.name, shown_total_payable: shownBefore, request_body: posts[0] };

            const file = path.join(FIXTURE_DIR, `${c.id}.json`);
            if (process.env.UPDATE_GOLDEN) {
                fs.writeFileSync(file, JSON.stringify(recorded, null, 2) + '\n');
            } else {
                expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual(JSON.parse(JSON.stringify(recorded)));
            }
        }, 30000);
    }
});
