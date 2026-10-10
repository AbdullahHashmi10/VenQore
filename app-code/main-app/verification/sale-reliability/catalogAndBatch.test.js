import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const memory = vi.hoisted(() => ({ tables: {}, get: vi.fn(), post: vi.fn() }));
vi.mock('axios', () => ({ default: { get: memory.get, post: memory.post } }));
vi.mock('@/DB/LocalDB', () => {
    const db = {};
    for (const name of ['orders', 'products', 'customers', 'suppliers', 'inventory', 'taxes', 'users']) {
        db[name] = {
            where: field => ({ equals: value => ({
                toArray: async () => structuredClone(memory.tables[name].filter(row => row[field] === value)),
            }) }),
            update: async (id, changes) => Object.assign(memory.tables[name].find(row => row.id === id), changes),
            clear: async () => { memory.tables[name] = []; },
            bulkPut: async rows => {
                if (name === 'products') throw new Error('Simulated IndexedDB write failure');
                memory.tables[name].push(...structuredClone(rows));
            },
        };
    }
    db.transaction = async (...args) => {
        const before = structuredClone(memory.tables);
        try { return await args.at(-1)(); }
        catch (error) { memory.tables = before; throw error; }
    };
    return { db };
});

import { SyncService } from '@/Services/SyncService';

beforeEach(() => {
    memory.tables = { orders: [], products: [], customers: [], suppliers: [], inventory: [], taxes: [], users: [] };
    memory.get.mockReset().mockResolvedValue({ data: [] });
    memory.post.mockReset();
    vi.spyOn(SyncService, 'getStoreSlug').mockReturnValue('store-a');
    vi.stubGlobal('route', name => name);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Catalog and second offline queue contracts', () => {
    it('does not mark an entire batch synced when the server reports zero successes', async () => {
        memory.tables.orders = [{ id: 'a', status: 'pending' }, { id: 'b', status: 'pending' }];
        memory.post.mockResolvedValue({ status: 200, data: { status: 'synced', count: 0 } });
        await SyncService.syncOrders();
        expect(memory.tables.orders.every(row => row.status !== 'synced')).toBe(true);
    });

    it('does not guess which batch member succeeded from a count alone', async () => {
        memory.tables.orders = [{ id: 'a', status: 'pending' }, { id: 'b', status: 'pending' }];
        memory.post.mockResolvedValue({ status: 200, data: { status: 'synced', count: 1 } });
        await SyncService.syncOrders();
        expect(memory.tables.orders.filter(row => row.status === 'synced')).toHaveLength(0);
    });

    it('retains the previous product catalog when replacement storage fails', async () => {
        memory.tables.products = [{ id: 'old', name: 'Known product' }];
        memory.get.mockImplementation(async name => ({
            data: name === 'store.api.sync.products' ? [{ id: 'new', name: 'New product' }] : [],
        }));
        await SyncService.hydrate();
        expect(memory.tables.products).toEqual([{ id: 'old', name: 'Known product' }]);
    });
});

describe('Per-order batch acknowledgement', () => {
    it('marks only the orders the server names as committed', async () => {
        memory.tables.orders = [
            { id: 'a', status: 'pending', store_slug: 'store-a' },
            { id: 'b', status: 'pending', store_slug: 'store-a' },
            { id: 'c', status: 'pending', store_slug: 'store-b' },
        ];
        memory.post.mockResolvedValue({ status: 200, data: { status: 'partial', count: 1, results: [
            { client_sale_id: 'a', outcome: 'committed', sale_id: 'S-1' },
            { client_sale_id: 'b', outcome: 'rejected', code: 'walk_in_unpaid', message: 'Walk-in sales must be paid in full.' },
        ] } });
        await SyncService.syncOrders();
        const by = Object.fromEntries(memory.tables.orders.map(o => [o.id, o]));
        expect(by.a.status).toBe('synced');
        expect(by.a.sale_id).toBe('S-1');
        expect(by.b.status).toBe('needs_attention');
        expect(by.c.status).toBe('pending');
        expect(memory.post.mock.calls[0][1].orders.map(o => o.id)).toEqual(['a', 'b']);
    });
});
