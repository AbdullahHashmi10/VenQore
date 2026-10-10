import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { buildSalePayload } from '@/Sell/core/salePayload';

const mem = vi.hoisted(() => ({ rows: [], post: vi.fn(), get: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mem.post, get: mem.get } }));
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: {
    store: { id: 11, slug: 'store-a' }, auth: { user: { id: 7 } },
} }) }));
vi.mock('@/Utils/db', () => ({ isOnline: () => true, db: { sales_queue: {
    where: key => ({ equals: value => ({ toArray: async () => structuredClone(mem.rows.filter(r => r[key] === value)) }) }),
    update: async (id, changes) => Object.assign(mem.rows.find(r => r.id === id), changes),
    add: async row => { const id = mem.rows.length + 1; mem.rows.push({ id, ...structuredClone(row) }); return id; },
} } }));
import { useOfflineSync, classifyOutcome } from '@/Hooks/useOfflineSync';

const row = (over = {}) => ({
    id: 1, tenant_id: 11, store_slug: 'store-a', status: 'pending', payload_version: 2,
    occurred_at: '2026-10-07T11:38:21Z',
    data: { idempotency_key: 'intent-one', items: [{ product_id: 'p', quantity: 1, price: 100 }] }, ...over,
});
beforeEach(() => {
    mem.rows = [];
    mem.post.mockReset().mockResolvedValue({ status: 201, data: { success: true, sale_id: 'sale-one', idempotency_key: 'intent-one' } });
    mem.get.mockReset().mockResolvedValue({ data: { outcome: 'not_found' } });
    vi.stubGlobal('route', (name, p) => `/s/${p.store_slug}/${name}`);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function replay() {
    const hook = renderHook(() => useOfflineSync());
    await act(async () => { await hook.result.current.syncPendingSales(); });
    return hook;
}

it('does not count a credit promise as physically tendered cash', () => {
    const body = buildSalePayload({
        sale: { customer: { id: 'customer' }, cart: [{ id: 'p', qty: 1, price: 100 }] },
        totals: { cartTotal: 100, globalDiscount: 0, additionalCharges: 0, serviceCharge: 0, tipAmount: 0, taxAmount: 0, taxRate: 0 },
        paymentData: { payments: [{ method: 'cash', amount: 40 }, { method: 'credit', amount: 60 }] },
        settings: {}, warehouseId: 'w',
    });
    expect(body.tendered_amount).toBe(40);
    expect(body.change_return).toBe(0);
});

it('carries original occurrence time to the server on next-day replay', async () => {
    mem.rows = [row()];
    await replay();
    const body = mem.post.mock.calls[0][1];
    expect(body.sale_date ?? body.occurred_at).toBe(mem.rows[0].occurred_at);
});

it('holds unknown future payload versions instead of posting them', async () => {
    mem.rows = [row({ payload_version: 999 })];
    await replay();
    expect(mem.post).not.toHaveBeenCalled();
});

it('does not confirm a status response belonging to another intent', async () => {
    mem.rows = [row({ status: 'uncertain' })];
    mem.get.mockResolvedValue({ data: { outcome: 'committed', sale_id: 'other-sale', idempotency_key: 'different-intent' } });
    mem.post.mockRejectedValue(new Error('Network unavailable'));
    await replay();
    expect(mem.rows[0].status).not.toBe('synced');
});

it('requires the matching key in a claimed canonical POST success', () => {
    const decision = classifyOutcome({ intentKey: 'intent-one', response: {
        status: 201, data: { success: true, sale_id: 'some-sale' },
    } });
    expect(decision.state).not.toBe('synced');
});

it('does not export unresolved sales from other stores', async () => {
    mem.rows = [row(), row({ id: 2, tenant_id: 22, store_slug: 'store-b' })];
    const hook = renderHook(() => useOfflineSync());
    let exported;
    await act(async () => { exported = JSON.parse(await hook.result.current.exportUnresolved()); });
    expect(exported.rows.map(r => r.tenant_id)).toEqual([11]);
});

it('does not trust a stored slug inconsistent with its tenant id', async () => {
    mem.rows = [row({ store_slug: 'store-b' })];
    await replay();
    expect(mem.post).not.toHaveBeenCalled();
});
