import { describe, it, expect } from 'vitest';
import {
    seedState, applyLocal, enqueue, replayOutbox, FloorRefusal, isLocalId, supportsOffline,
} from '@/lib/offlineFloor';

let n = 0;
const ctx = (over = {}) => ({
    now: () => '2026-10-13T10:00:00.000Z',
    uid: () => `K-${++n}`,
    ref: () => `L-${++n}`,
    token: () => 'tok',
    user: { id: 7, name: 'Ali Raza' },
    routing: null,
    collectsTakeaway: false,
    ...over,
});

const floor = () => seedState({
    positions: [
        { id: 1, kind: 'position', zone: 'Main', code: 'T1', label: 'T1', capacity: 4, sort_order: 1, status: 'available', occupancy_id: null, cart: [] },
        { id: 2, kind: 'position', zone: 'Main', code: 'T2', label: 'T2', capacity: 4, sort_order: 2, status: 'available', occupancy_id: null, cart: [] },
    ],
    tickets: [],
    zones: ['Main'],
});

const line = (over = {}) => ({ id: 10, line_id: 'a', name: 'Karahi', price: 1000, qty: 2, notes: '', sent: false, mods: [], ...over });

// Run a list of [name, body] against a state, return the state and the outbox.
function run(steps, start = floor(), c = ctx()) {
    let st = start; let outbox = []; const responses = [];
    for (const [name, body] of steps) {
        const r = applyLocal(st, name, typeof body === 'function' ? body(st, responses) : body, c);
        st = r.state; outbox = enqueue(outbox, r.outbox); responses.push(r.response);
    }
    return { st, outbox, responses };
}

describe('offline floor: a whole table, start to finish', () => {
    it('opens, orders, fires to the kitchen and pays', () => {
        const { st, outbox, responses } = run([
            ['store.tables.open', { position_id: 1, covers: 3 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line()], covers: 3 })],
            ['store.tables.send', (s, r) => ({ occupancy_id: r[0].position.occupancy_id })],
            ['store.tables.settled', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, sale_id: null })],
        ]);

        const opened = responses[0].position;
        expect(isLocalId(opened.occupancy_id)).toBe(true);
        expect(opened.state).toBe('seated');
        expect(opened.order_total).toBe(0);

        const ordered = responses[1].position;
        expect(ordered.state).toBe('ordered');
        expect(ordered.order_total).toBe(2000);
        expect(ordered.unsent).toBe(1);

        const fired = responses[2];
        expect(fired.sent).toBe(1);
        expect(fired.position.state).toBe('in_kitchen');
        expect(fired.position.unsent).toBe(0);
        expect(fired.kots).toHaveLength(1);
        expect(fired.kots[0].items[0]).toMatchObject({ name: 'Karahi', qty: 2 });
        expect(fired.kots[0].order_type_badge).toBe('DINE-IN');
        expect(JSON.stringify(fired.kots)).not.toMatch(/price/); // kitchen slips carry no prices

        expect(responses[3]).toMatchObject({ ok: true, closed: true });
        expect(st.positions[0].occupancy_id).toBeNull(); // table is free again
        expect(st.positions[0].state).toBe('free');

        // open, order, send(replay), settled -- the order save collapsed with nothing after it? no: send sits between.
        expect(outbox.map((o) => o.name)).toEqual(['store.tables.open', 'store.tables.order', 'store.tables.send', 'store.tables.settled']);
        expect(outbox[2].body.offline_replay).toBe(true);
    });

    it('refuses a table that is already open, like the server', () => {
        const { st } = run([['store.tables.open', { position_id: 1 }]]);
        expect(() => applyLocal(st, 'store.tables.open', { position_id: 1 }, ctx())).toThrow('already open');
    });

    it('collapses repeated saves of one order into the last', () => {
        const { outbox } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line({ qty: 1 })] })],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line({ qty: 2 })] })],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line({ qty: 3 })] })],
        ]);
        expect(outbox.map((o) => o.name)).toEqual(['store.tables.open', 'store.tables.order']);
        expect(outbox[1].body.cart[0].qty).toBe(3);
    });

    it('adds modifier prices and gives a cancellation slip when a fired line is reduced', () => {
        const { responses } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line({ qty: 2, mods: [{ id: 1, name: 'Extra naan', price_delta: 50 }] })] })],
            ['store.tables.send', (s, r) => ({ occupancy_id: r[0].position.occupancy_id })],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line({ qty: 1, mods: [{ id: 1, name: 'Extra naan', price_delta: 50 }], sent: true })] })],
        ]);
        expect(responses[1].position.order_total).toBe(2100); // (1000 + 50) x 2
        expect(responses[3].cancellation_kot.is_cancellation).toBe(true);
        expect(responses[3].cancellation_kot.items[0]).toMatchObject({ name: 'Karahi', qty: 1 });
    });

    it('sends nothing twice', () => {
        const { st } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line()] })],
            ['store.tables.send', (s, r) => ({ occupancy_id: r[0].position.occupancy_id })],
        ]);
        expect(() => applyLocal(st, 'store.tables.send', { occupancy_id: st.positions[0].occupancy_id }, ctx())).toThrow('Nothing new to send.');
    });

    it('will not close an unpaid table unless forced', () => {
        const { st } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line()] })],
        ]);
        const occ = st.positions[0].occupancy_id;
        expect(() => applyLocal(st, 'store.tables.close', { occupancy_id: occ }, ctx())).toThrow('unsettled');
        const forced = applyLocal(st, 'store.tables.close', { occupancy_id: occ, force: true }, ctx());
        expect(forced.state.positions[0].occupancy_id).toBeNull();
    });
});

describe('offline floor: takeaway, delivery, moving tables', () => {
    it('opens a takeaway bag with a number, and a delivery with its fee in the total', () => {
        const { st, responses } = run([
            ['store.tables.lane.open', { order_type: 'takeaway', customer_name: 'Sana' }],
            ['store.tables.lane.open', { order_type: 'delivery', customer_name: 'Omar', address: 'House 4', delivery_fee: 150 }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[1].ticket.occupancy_id, cart: [line({ qty: 1 })] })],
        ]);
        expect(responses[0].ticket.code).toBe('TA-001');
        expect(responses[0].ticket.label).toBe('Sana');
        expect(responses[1].ticket.code).toBe('DL-001');
        expect(responses[1].ticket.delivery.status).toBe('placed');
        expect(responses[2].ticket.order_total).toBe(1150); // 1000 + 150 delivery fee
        expect(st.tickets).toHaveLength(2);
    });

    it('updates a delivery and keeps only what was sent', () => {
        const { responses } = run([
            ['store.tables.lane.open', { order_type: 'delivery', customer_name: 'Omar', address: 'House 4', delivery_note: 'Blue gate' }],
            ['store.tables.delivery', (s, r) => ({ occupancy_id: r[0].ticket.occupancy_id, rider: 'Bilal', status: 'out', eta_minutes: 20 })],
        ]);
        const d = responses[1].ticket.delivery;
        expect(d).toMatchObject({ rider: 'Bilal', status: 'out', eta_minutes: 20, note: 'Blue gate' });
        expect(d.history).toHaveLength(1);
    });

    it('collects a paid takeaway, but not an unpaid one', () => {
        const base = run([
            ['store.tables.lane.open', { order_type: 'takeaway' }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].ticket.occupancy_id, cart: [line()] })],
        ]);
        const occ = base.st.tickets[0].occupancy_id;
        expect(() => applyLocal(base.st, 'store.tables.collected', { occupancy_id: occ }, ctx())).toThrow('not fully paid');
        const paid = applyLocal(base.st, 'store.tables.settled', { occupancy_id: occ, sale_id: 'S1' }, ctx());
        expect(paid.response.closed).toBe(true);
        expect(paid.state.tickets).toHaveLength(0);
    });

    it('keeps a paid bag open while its food is on the pass, when the shop collects takeaway', () => {
        const c = ctx({ collectsTakeaway: true });
        const base = run([
            ['store.tables.lane.open', { order_type: 'takeaway' }],
            ['store.tables.order', (s, r) => ({ occupancy_id: r[0].ticket.occupancy_id, cart: [line()] })],
            ['store.tables.send', (s, r) => ({ occupancy_id: r[0].ticket.occupancy_id })],
        ], floor(), c);
        const occ = base.st.tickets[0].occupancy_id;
        const paid = applyLocal(base.st, 'store.tables.settled', { occupancy_id: occ, sale_id: null }, c);
        expect(paid.response).toMatchObject({ closed: false, awaiting_collection: true });
        expect(paid.state.tickets[0].paid_at).toBeTruthy();
        const done = applyLocal(paid.state, 'store.tables.collected', { occupancy_id: occ }, c);
        expect(done.state.tickets).toHaveLength(0);
    });

    it('moves a table, and refuses a taken one', () => {
        const { st } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.open', { position_id: 2 }],
        ]);
        const occ = st.positions[0].occupancy_id;
        expect(() => applyLocal(st, 'store.tables.transfer', { occupancy_id: occ, to_position: 2 }, ctx())).toThrow('already open');
    });

    it('merges two tables into one bill', () => {
        const { st } = run([
            ['store.tables.open', { position_id: 1, covers: 2 }],
            ['store.tables.open', { position_id: 2, covers: 2 }],
            ['store.tables.order', (s) => ({ occupancy_id: s.positions[0].occupancy_id, cart: [line({ line_id: 'a', qty: 1 })] })],
            ['store.tables.order', (s) => ({ occupancy_id: s.positions[1].occupancy_id, cart: [line({ line_id: 'b', qty: 1 })] })],
        ]);
        const merged = applyLocal(st, 'store.tables.merge', { from_occupancy: st.positions[1].occupancy_id, into_occupancy: st.positions[0].occupancy_id }, ctx());
        expect(merged.state.positions[0].order_total).toBe(2000);
        expect(merged.state.positions[0].covers).toBe(4);
        expect(merged.state.positions[1].occupancy_id).toBeNull();
    });

    it('turns a table into takeaway, freeing the table and keeping the order', () => {
        const { st } = run([
            ['store.tables.open', { position_id: 1 }],
            ['store.tables.order', (s) => ({ occupancy_id: s.positions[0].occupancy_id, cart: [line()] })],
        ]);
        const r = applyLocal(st, 'store.tables.convert', { occupancy_id: st.positions[0].occupancy_id, to: 'takeaway', customer_name: 'Zain' }, ctx());
        expect(r.state.positions[0].occupancy_id).toBeNull();
        expect(r.state.tickets[0]).toMatchObject({ order_type: 'takeaway', order_total: 2000, label: 'Zain' });
        expect(r.outbox.body.client_code).toBe('TA-001');
    });

    it('does not support what it cannot do honestly', () => {
        expect(supportsOffline('store.tables.split')).toBe(false);
        expect(() => applyLocal(floor(), 'store.tables.split', {}, ctx())).toThrow(FloorRefusal);
    });

    it('toggles the 86 list', () => {
        const a = applyLocal(floor(), 'store.tables.kitchen.86', { product_id: 5 }, ctx());
        expect(a.state.eighty_six_ids).toEqual([5]);
        const b = applyLocal(a.state, 'store.tables.kitchen.86', { product_id: 5 }, ctx());
        expect(b.state.eighty_six_ids).toEqual([]);
    });
});

describe('replay to the server', () => {
    const items = () => run([
        ['store.tables.open', { position_id: 1, covers: 2 }],
        ['store.tables.order', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, cart: [line()] })],
        ['store.tables.send', (s, r) => ({ occupancy_id: r[0].position.occupancy_id })],
        ['store.tables.settled', (s, r) => ({ occupancy_id: r[0].position.occupancy_id, sale_id: null })],
    ]).outbox;

    it('sends in order and swaps local ids for the server ids', async () => {
        const calls = [];
        const post = async (name, body) => {
            calls.push([name, body]);
            if (name === 'store.tables.open') return { position: { occupancy_id: 501 } };
            return {};
        };
        const res = await replayOutbox(items(), post);
        expect(res).toMatchObject({ remaining: [], conflicts: [], sent: 4 });
        expect(calls.map((c) => c[0])).toEqual(['store.tables.open', 'store.tables.order', 'store.tables.send', 'store.tables.settled']);
        expect(calls[1][1].occupancy_id).toBe(501);
        expect(calls[3][1].occupancy_id).toBe(501);
        expect(calls[0][1].client_ref).toMatch(/^L-/);
    });

    it('stops and keeps the rest when the network drops again', async () => {
        let k = 0;
        const post = async (name) => {
            k += 1;
            if (k === 2) { const e = new Error('Network Error'); e.code = 'ERR_NETWORK'; throw e; }
            return name === 'store.tables.open' ? { position: { occupancy_id: 9 } } : {};
        };
        const res = await replayOutbox(items(), post);
        expect(res.sent).toBe(1);
        expect(res.remaining.map((i) => i.name)).toEqual(['store.tables.order', 'store.tables.send', 'store.tables.settled']);
    });

    it('sets aside a table someone else took, and everything that depended on it', async () => {
        const post = async (name) => {
            if (name === 'store.tables.open') {
                const e = new Error('x'); e.response = { status: 422, data: { message: 'That table is already open.' } }; throw e;
            }
            return {};
        };
        const res = await replayOutbox(items(), post);
        expect(res.sent).toBe(0);
        expect(res.conflicts).toHaveLength(4);
        expect(res.conflicts[0].message).toBe('That table is already open.');
    });

    it('treats "nothing new to send" on replay as already done', async () => {
        const post = async (name) => {
            if (name === 'store.tables.open') return { position: { occupancy_id: 3 } };
            if (name === 'store.tables.send') { const e = new Error('x'); e.response = { status: 422, data: { message: 'Nothing new to send.' } }; throw e; }
            return {};
        };
        const res = await replayOutbox(items(), post);
        expect(res.conflicts).toEqual([]);
        expect(res.sent).toBe(3);
    });
});
