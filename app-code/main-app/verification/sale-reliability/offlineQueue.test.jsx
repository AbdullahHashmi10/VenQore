import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

const state = vi.hoisted(() => ({ rows: [], online: true, post: vi.fn(), telemetry: vi.fn() }));
// Queue telemetry goes to its own spy so the sale-transport assertions stay exact.
vi.mock('axios', () => ({ default: { post: (url, ...rest) => (String(url).endsWith('/queue-status') ? state.telemetry(url, ...rest) : state.post(url, ...rest)) } }));
vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { store: { id: 11, slug: 'store-a' }, auth: { user: { id: 7 } } } }),
}));
vi.mock('@/Utils/db', () => ({
    isOnline: () => state.online,
    db: { sales_queue: {
        where: field => ({ equals: value => ({
            count: async () => state.rows.filter(row => row[field] === value).length,
            toArray: async () => state.rows.filter(row => row[field] === value).map(row => structuredClone(row)),
        }) }),
        get: async id => structuredClone(state.rows.find(row => row.id === id)),
        add: async row => { state.rows.push({ id: state.rows.length + 1, ...structuredClone(row) }); },
        update: async (id, changes) => { Object.assign(state.rows.find(row => row.id === id), changes); },
        delete: async id => { state.rows = state.rows.filter(row => row.id !== id); },
    } },
}));

import { useOfflineSync, resetQueueTelemetry, summarizeQueue } from '@/Hooks/useOfflineSync';

// Rows written by a contract-v2 till always carry payload_version 2.
const pending = (id = 1, tenantId = 11) => ({
    id, status: 'pending', tenant_id: tenantId, payload_version: 2,
    store_slug: tenantId === 11 ? 'store-a' : 'store-b',
    data: { idempotency_key: `intent-${id}`, items: [{ product_id: 'p', quantity: 1, price: 100 }] },
});
// A contract-v2 server always echoes the receipt key in a canonical success.
const ok = id => ({ status: 201, data: { success: true, sale_id: `sale-${id}`, reference: `INV-${id}`, idempotency_key: `intent-${id}` } });

beforeEach(() => {
    state.rows = [];
    state.online = true;
    state.post.mockReset().mockResolvedValue(ok(1));
    state.telemetry.mockReset().mockResolvedValue({ status: 200, data: { success: true } });
    resetQueueTelemetry();
    vi.stubGlobal('route', (name, params) => (name === 'store.pos.queue-status' ? `/s/${params.store_slug}/pos/queue-status` : `/s/${params.store_slug}/pos/sales`));
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function sync() {
    const hook = renderHook(() => useOfflineSync());
    await act(async () => { await hook.result.current.syncPendingSales(); });
    return hook;
}

describe('Offline sale queue behavior with mocked storage and transport', () => {
    it('reuses the persisted intent key on a successful replay', async () => {
        state.rows = [pending()];
        await sync();
        // Third argument: request options (timeout). The body must carry the persisted key.
        expect(state.post).toHaveBeenCalledWith('/s/store-a/pos/sales', expect.objectContaining({ idempotency_key: 'intent-1' }), expect.anything());
        expect(state.rows[0].status).toBe('synced');
    });

    it('does not replay another store sale into the currently open store', async () => {
        state.rows = [pending(1, 22)];
        await sync();
        expect(state.post).not.toHaveBeenCalled();
        expect(state.rows[0].status).not.toBe('synced');
    });

    it('does not guess the owner of a legacy queue row with no store identity', async () => {
        const row = pending();
        delete row.tenant_id;
        delete row.store_slug;
        state.rows = [row];
        await sync();
        expect(state.post).not.toHaveBeenCalled();
    });

    it('requires confirmed sale identity before marking a 200 response as synced', async () => {
        state.rows = [pending()];
        state.post.mockResolvedValue({ status: 200, data: { success: false, message: 'Not posted' } });
        await sync();
        expect(state.rows[0].status).not.toBe('synced');
    });

    it('does not automatically retry a definitive validation rejection', async () => {
        state.rows = [pending()];
        state.post.mockRejectedValue({ response: { status: 422, data: { message: 'Choose a customer' } } });
        const hook = await sync();
        await act(async () => { await hook.result.current.syncPendingSales(); });
        expect(state.post).toHaveBeenCalledTimes(1);
        expect(state.rows[0].status).not.toBe('synced');
    });

    it('allows a second eligible sale to sync when the first one fails', async () => {
        state.rows = [pending(1), pending(2)];
        state.post.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Failed' } } })
            .mockResolvedValueOnce(ok(2));
        await sync();
        expect(state.post).toHaveBeenCalledTimes(2);
        expect(state.rows[0].status).not.toBe('synced');
        expect(state.rows[1].status).toBe('synced');
    });

    it('preserves the original payload after transport failure', async () => {
        state.rows = [pending()];
        const before = structuredClone(state.rows[0].data);
        state.post.mockRejectedValue(new Error('Network Error'));
        await sync();
        expect(state.rows[0].data).toEqual(before);
        expect(state.rows[0].status).not.toBe('synced');
    });
});

describe('Uncertain outcomes are reconciled by the same receipt key', () => {
    it('confirms a sale the server already committed without sending it again', async () => {
        state.rows = [{ ...pending(), status: 'uncertain' }];
        const get = vi.fn().mockResolvedValue({ data: { outcome: 'committed', sale_id: 'sale-1', idempotency_key: 'intent-1' } });
        const axios = (await import('axios')).default;
        axios.get = get;
        await sync();
        expect(get).toHaveBeenCalledTimes(1);
        expect(state.post).not.toHaveBeenCalled();
        expect(state.rows[0].status).toBe('synced');
        expect(state.rows[0].sale_id).toBe('sale-1');
        delete axios.get;
    });

    it('treats a 200 HTML page (login redirect) as unconfirmed, not synced', async () => {
        state.rows = [pending()];
        state.post.mockResolvedValue({ status: 200, data: '<!doctype html><title>Login</title>' });
        await sync();
        expect(state.rows[0].status).toBe('uncertain');
        expect(state.rows[0].data.idempotency_key).toBe('intent-1');
    });

    it('a 500 is never reported as "not saved" and keeps the key for the next attempt', async () => {
        state.rows = [pending()];
        state.post.mockRejectedValue({ response: { status: 500, data: { code: 'server_error', outcome: 'unknown', correlation_id: 'sale-abc' } } });
        await sync();
        expect(state.rows[0].status).toBe('uncertain');
        expect(state.rows[0].last_error).toMatch(/unconfirmed/i);
        expect(state.rows[0].next_retry_at).toBeInstanceOf(Date);
    });

    it('rejects a success response that names a different receipt key', async () => {
        state.rows = [pending()];
        state.post.mockResolvedValue({ status: 201, data: { success: true, sale_id: 's', idempotency_key: 'someone-else' } });
        await sync();
        expect(state.rows[0].status).not.toBe('synced');
    });
});

describe('Reconnect telemetry (counts and ages only)', () => {
    it('reports this store\'s unresolved rows by state after a sync, with no sale content', async () => {
        const old = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
        state.rows = [
            { ...pending(1), status: 'needs_attention', created_at: old },
            { ...pending(2), status: 'quarantined', created_at: new Date().toISOString() },
            { ...pending(3, 22), status: 'needs_attention', created_at: old }, // another store: not reported here
        ];
        await sync();
        expect(state.telemetry).toHaveBeenCalledTimes(1);
        const [url, body] = state.telemetry.mock.calls[0];
        expect(url).toBe('/s/store-a/pos/queue-status');
        expect(body.counts).toEqual({ needs_attention: 1, quarantined: 1 });
        expect(body.oldest_age_seconds).toBeGreaterThanOrEqual(7190);
        expect(body.device_id).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
        expect(JSON.stringify(body)).not.toContain('intent-');
        expect(JSON.stringify(body)).not.toContain('product_id');
    });

    it('does not repeat an unchanged report straight away, and a failed report never touches the queue', async () => {
        state.rows = [{ ...pending(1), status: 'needs_attention', created_at: new Date().toISOString() }];
        state.telemetry.mockRejectedValue(new Error('offline again'));
        await sync();
        await sync();
        expect(state.telemetry).toHaveBeenCalledTimes(1);
        expect(state.rows[0].status).toBe('needs_attention');
    });

    it('summarizes ages from the oldest row', () => {
        const now = Date.parse('2026-10-09T10:00:00Z');
        expect(summarizeQueue([
            { status: 'pending', created_at: '2026-10-09T09:00:00Z' },
            { status: 'pending', created_at: '2026-10-09T09:59:00Z' },
        ], now)).toEqual({ counts: { pending: 2 }, oldest_age_seconds: 3600 });
        expect(summarizeQueue([], now)).toEqual({ counts: {}, oldest_age_seconds: null });
    });
});

describe('Force Sync and old unassigned rows', () => {
    it('Force Sync sends a row that is waiting out its back-off; a background pass says why it waits', async () => {
        state.rows = [{ ...pending(1), next_retry_at: new Date(Date.now() + 3600e3) }];
        const hook = renderHook(() => useOfflineSync());
        await act(async () => { await hook.result.current.syncPendingSales(); });
        expect(state.post).not.toHaveBeenCalled();
        expect(hook.result.current.syncErrors[1]).toMatch(/Waiting to retry/);
        await act(async () => { await hook.result.current.syncPendingSales({ force: true }); });
        expect(state.post).toHaveBeenCalledTimes(1);
        expect(state.rows[0].status).toBe('synced');
    });

    it('an owner can adopt an old row with no store; it keeps its key and is sent once', async () => {
        const row = { id: 1, status: 'pending', created_at: new Date().toISOString(), data: { idempotency_key: 'intent-1', items: [{ product_id: 'p', quantity: 1, price: 100 }] } };
        state.rows = [row];
        const hook = renderHook(() => useOfflineSync());
        await act(async () => { await hook.result.current.syncPendingSales(); });
        expect(state.post).not.toHaveBeenCalled();
        expect(state.rows[0].status).toBe('quarantined');
        await act(async () => { await hook.result.current.adoptUnassigned(1); });
        expect(state.rows[0]).toMatchObject({ tenant_id: 11, store_slug: 'store-a', adopted_legacy: true, intent_key: 'intent-1' });
        await act(async () => { await hook.result.current.syncPendingSales({ force: true }); });
        expect(state.post).toHaveBeenCalledWith('/s/store-a/pos/sales', expect.objectContaining({ idempotency_key: 'intent-1' }), expect.anything());
        expect(state.rows[0].status).toBe('synced');
    });

    it('a row with no key is not adopted unless a new key is given', async () => {
        state.rows = [{ id: 1, status: 'pending', created_at: new Date().toISOString(), data: { items: [] } }];
        const hook = renderHook(() => useOfflineSync());
        let ok;
        await act(async () => { ok = await hook.result.current.adoptUnassigned(1); });
        expect(ok).toBe(false);
        await act(async () => { ok = await hook.result.current.adoptUnassigned(1, { newKey: 'fresh-key-1' }); });
        expect(ok).toBe(true);
        expect(state.rows[0].data.idempotency_key).toBe('fresh-key-1');
    });
});
