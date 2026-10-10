// @vitest-environment jsdom
/**
 * FOH plan, Phase 0 — regression tests for the three bugs fixed before the Sale Core extraction.
 *  1. Auto-manufacturing message: the server sends `notifications`, the POS read `manufacturing_notifications`.
 *  2. Rider edit / quick toggle: the route is PUT only, the page sent PATCH (and the toggle omitted the required name).
 *  3. Counter terminal: <ModifierSheet> was only mounted when tableMode, so add-on products never opened on the counter.
 */
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act, waitFor, cleanup } from '@testing-library/react';

const posts = [];
let responseBody = { success: true, sale_id: 1, reference: 'INV-0001', notifications: [] };
const axiosApi = vi.hoisted(() => ({}));

vi.mock('@inertiajs/react', () => {
    const React = require('react');
    return {
        usePage: () => ({
            url: '/stores/test/pos',
            props: {
                auth: { user: { id: 1, name: 'Owner', is_owner: true, role: 'owner', permissions: [] } },
                store: { slug: 'test', name: 'Test Store', currency_code: 'PKR' },
                modules: [], terms: {}, flash: {},
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
        posSessions: [{ id: 'S1', type: 'pos', cashReceived: '', searchTerm: '', customer: null, discountType: 'fixed', discountValue: 0,
            cart: [{ cartItemId: '1-', id: 1, variant_id: null, name: 'Tea', price: 100, original_price: 100, discount: 0, qty: 1, freeQuantity: 0, stock: 9999 }] }],
        currentPosId: 'S1', setCurrentPosId: () => {}, addPosSession: () => {}, updatePosSession: () => {}, removePosSession: () => {},
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
            // A contract-v2 server echoes the receipt key it was sent.
            if (url === 'store.pos.sales.store') { posts.push(body); return ok({ ...responseBody, idempotency_key: body?.idempotency_key }); }
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

import axios from 'axios';

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
    vi.clearAllMocks();
    cleanup();
});

const SRC = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');

describe('Phase 0 bug fixes', () => {
    it('1. shows the auto-manufacturing message from the server\'s `notifications` field', async () => {
        responseBody = { success: true, sale_id: 1, reference: 'INV-0001', notifications: ['Made 5 x Dough'] };
        localStorage.setItem('pos_auto_fill_cash', 'true');
        localStorage.setItem('pos_enable_tax', 'false');
        const { default: Pos } = await import('@/Pages/Pos');
        const { container } = render(<Pos settings={{ business_name: 'T', currency_symbol: 'Rs', decimal_places: '2' }} bankAccounts={[]} warehouses={[]} terminal="counter" />);
        const pay = await waitFor(() => {
            const b = container.querySelector('#tour-pos-checkout') || container.querySelector('button[data-primary="1"]');
            if (!b) throw new Error('no pay button');
            return b;
        }, { timeout: 8000 });
        await act(async () => { fireEvent.click(pay); });
        await waitFor(() => expect(document.body.textContent).toContain('Auto-Manufacturing'), { timeout: 8000 });
        expect(document.body.textContent).toContain('Made 5 x Dough');
    }, 30000);

    it('2. rider quick-toggle sends PUT with the required name (never PATCH)', async () => {
        const { default: Riders } = await import('@/Pages/Restaurant/Riders');
        const riders = [{ id: 7, name: 'Ali Raza', phone: '0300', commission_rate: 0, status: 'active', notes: null }];
        const { container } = render(<Riders storeSlug="test" riders={riders} deliveryEnabled preparesOrdersEnabled />);
        const toggle = await waitFor(() => {
            const b = container.querySelector('button[title="Click to toggle status"]');
            if (!b) throw new Error('no toggle');
            return b;
        }, { timeout: 8000 });
        await act(async () => { fireEvent.click(toggle); });
        await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
        expect(axios.patch).not.toHaveBeenCalled();
        const [url, body] = axios.put.mock.calls[0];
        expect(url).toBe('store.restaurant.riders.update');
        expect(body).toMatchObject({ name: 'Ali Raza', status: 'inactive' });
    }, 30000);

    it('3. <ModifierSheet> is mounted for every terminal, not only tableMode', () => {
        const src = SRC('Pages/Pos.jsx');
        const at = src.indexOf('<ModifierSheet');
        expect(at).toBeGreaterThan(-1);
        const before = src.slice(Math.max(0, at - 80), at);
        expect(before).not.toMatch(/tableMode\s*&&\s*\(\s*$/);
    });
});
