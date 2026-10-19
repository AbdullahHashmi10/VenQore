// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const post = vi.hoisted(() => vi.fn());
const get = vi.hoisted(() => vi.fn());
const printKOT = vi.hoisted(() => vi.fn());
vi.mock('axios', () => ({ default: { post, get } }));
vi.mock('@/Utils/KitchenPrintService', () => ({ KitchenPrintService: { printKOT } }));

import { useTableService } from '@/Pos/Table/useTableService';
import { reportRequest, isOnline } from '@/lib/connectivity';

const table = { id: 1, kind: 'position', zone: 'Main', code: 'T1', label: 'T1', capacity: 4, sort_order: 1, status: 'available', occupancy_id: null, cart: [] };
const floor = { positions: [table], tickets: [], zones: ['Main'], kitchen: 0, eighty_six_ids: [] };
const dish = { cartItemId: 'a', lineId: 'a', id: 10, name: 'Karahi', price: 1000, basePrice: 1000, qty: 2, mods: [], notes: '', course: 1 };

beforeEach(() => {
    localStorage.clear();
    post.mockReset(); get.mockReset(); printKOT.mockReset();
    globalThis.route = (name) => name;
    get.mockResolvedValue({ data: floor });
    reportRequest({ ok: true });
});

const mount = () => renderHook(() => useTableService({
    enabled: true, storeSlug: 'shop', initialPositions: floor.positions, initialTickets: [], initialZones: ['Main'],
    lanes: { takeaway: true, delivery: true }, actor: { id: 1, name: 'Ali Raza' }, onError: vi.fn(), onNotice: vi.fn(),
}));

describe('Front of House with no internet', () => {
    it('seats, orders and fires a table without touching the network, then sends it all when the server is back', async () => {
        const { result } = mount();
        await act(async () => { await Promise.resolve(); });

        act(() => { reportRequest({ ok: false }); });
        expect(isOnline()).toBe(false);
        post.mockClear();

        let seated;
        await act(async () => { seated = await result.current.openTable(1, { covers: 2 }); });
        expect(post).not.toHaveBeenCalled();
        expect(seated.occupancy_id).toMatch(/^L-/);
        expect(result.current.offline.pending).toBe(1);

        await act(async () => { await result.current.flushOrder(seated.occupancy_id, [dish], { covers: 2, orderType: 'dine_in' }); });
        expect(result.current.positions[0].order_total).toBe(2000);

        let fired;
        await act(async () => { fired = await result.current.sendToKitchen(seated.occupancy_id); });
        expect(fired.kots).toHaveLength(1);
        expect(printKOT).toHaveBeenCalledTimes(1); // the slip prints from this device
        expect(result.current.positions[0].state).toBe('in_kitchen');
        expect(post).not.toHaveBeenCalled();

        // the work is on the device, and survives a reload
        const stored = JSON.parse(localStorage.getItem('vq_floor_v1_shop'));
        expect(stored.outbox.map((o) => o.name)).toEqual(['store.tables.open', 'store.tables.order', 'store.tables.send']);

        // the internet returns: it is replayed in order, with the server's id swapped in
        post.mockImplementation(async (name) => (name === 'store.tables.open' ? { data: { position: { occupancy_id: 900 } } } : { data: {} }));
        act(() => { reportRequest({ ok: true }); });
        await waitFor(() => expect(result.current.offline.pending).toBe(0));

        expect(post.mock.calls.map((c) => c[0])).toEqual(['store.tables.open', 'store.tables.order', 'store.tables.send']);
        expect(post.mock.calls[1][1].occupancy_id).toBe(900);
        expect(post.mock.calls[2][1]).toMatchObject({ occupancy_id: 900, offline_replay: true });
        expect(result.current.offline.conflicts).toEqual([]);
    });

    it('opens a takeaway offline and takes payment, and the table clears without the server', async () => {
        const { result } = mount();
        await act(async () => { await Promise.resolve(); });
        act(() => { reportRequest({ ok: false }); });

        let ticket;
        await act(async () => { ticket = await result.current.openLane('takeaway', { customerName: 'Sana' }); });
        expect(ticket.code).toBe('TA-001');
        await act(async () => { await result.current.flushOrder(ticket.occupancy_id, [dish], { orderType: 'takeaway' }); });
        let paid;
        await act(async () => { paid = await result.current.markSettled(ticket.occupancy_id, null, null); });
        expect(paid).toMatchObject({ ok: true, closed: true });
        expect(result.current.tickets).toHaveLength(0);
        expect(post).not.toHaveBeenCalled();
    });

    it('falls back to the device when the connection drops under a live request', async () => {
        const { result } = mount();
        await act(async () => { await Promise.resolve(); });
        post.mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));
        let seated;
        await act(async () => { seated = await result.current.openTable(1, { covers: 2 }); });
        expect(seated).toBeTruthy();
        expect(result.current.offline.pending).toBe(1);
        // the same reference is kept, so a retry cannot open a second table
        expect(post.mock.calls[0][1].client_ref).toBe(seated.occupancy_id);
    });

    it('says plainly what needs internet', async () => {
        const onError = vi.fn();
        const { result } = renderHook(() => useTableService({ enabled: true, storeSlug: 'shop', initialPositions: floor.positions, onError }));
        await act(async () => { await Promise.resolve(); });
        act(() => { reportRequest({ ok: false }); });
        await act(async () => { await result.current.split(5, { mode: 'covers' }); });
        expect(onError).toHaveBeenCalledWith(expect.stringMatching(/Splitting a bill needs internet/));
    });
});
