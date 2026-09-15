/* ==========================================================================
   TABLE SERVICE — the data layer for the Table terminal
   ==========================================================================
   The register is one screen with two terminals. In `counter` mode the unit
   of work is the sale. In `table` mode the unit of work is the TABLE, and the
   sale is a property of it -- which is why Hold disappears there: a table IS
   a held sale, and holding one would be asking the operator to park a park.

   This hook owns everything the floor knows and nothing about money. The
   cart, the tender panel, the journal posting and the offline queue stay in
   the register, in one copy, exactly as they are for a counter till. What
   crosses between them is a list of lines and an occupancy id.

   Ownership, stated once so it cannot drift:

     the SERVER owns   which tables exist, who is sitting at them, what has
                       been fired to the kitchen, and what has been paid;
     this HOOK owns    the poll, the optimistic echo, and the debounce that
                       keeps a waiter's typing off the wire;
     the REGISTER owns the cart in front of the operator and the payment.
   ========================================================================== */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

/* How often the floor re-reads itself. A restaurant floor changes on human
   timescales -- a table is seated, a course goes out -- so a 15s poll is
   indistinguishable from live to the person holding the tablet, and it is
   cheap enough to leave running on every device in the building. */
const POLL_MS = 15000;

/* The elapsed-time relabel ("24m", "1h 10m") ticks on its own, far slower
   than the poll, because it needs no network and re-rendering the floor for
   a clock is wasteful. */
const TICK_MS = 30000;

/* A waiter types into a line; we do not put a request on the wire per
   keystroke. Long enough to coalesce a burst, short enough that walking away
   from the tablet cannot lose an order. */
const SAVE_MS = 500;

/* THE STATE LADDER.

   Every one of these is DERIVED on the server from data the bill already
   carries -- there is no status column for anyone to keep up to date, which
   is the only way a floor stays honest during a rush. The frontend's job is
   to say what each one means and which two are alarms.

   `alert` is the whole idea of the floor screen. A table that has been sitting
   for eight minutes with nobody taking its order, and a bill that was dropped
   twelve minutes ago and not paid, are the two things a manager needs to walk
   over to. Everything else is just reporting. */
export const STATES = {
    free:          { label: 'Free',        tone: 'free' },
    seated:        { label: 'Seated',      tone: 'seated',  alertAfter: 8 * 60000 },
    ordered:       { label: 'Ordered',     tone: 'ordered' },
    in_kitchen:    { label: 'In kitchen',  tone: 'kitchen' },
    served:        { label: 'Served',      tone: 'served' },
    check_dropped: { label: 'Check',       tone: 'check',   alertAfter: 12 * 60000 },
    cleaning:      { label: 'Cleaning',    tone: 'cleaning' },
    reserved:      { label: 'Reserved',    tone: 'reserved' },
};

/* Is this card asking for someone to walk over? Returns the minutes it has
   been waiting, or 0. Read by the tile for its ring and by the sort, so a
   table that needs attention is both louder AND nearer the top -- one of
   those alone is missable on a busy floor. */
export function alertAge(card, now = Date.now()) {
    const spec = STATES[card?.state];
    if (!spec || !spec.alertAfter || !card.state_since) return 0;
    const age = now - new Date(card.state_since).getTime();
    return age >= spec.alertAfter ? Math.floor(age / 60000) : 0;
}

export const ORDER_TYPES = [
    { value: 'dine_in',  label: 'Dine-in' },
    { value: 'takeaway', label: 'Takeaway' },
    { value: 'delivery', label: 'Delivery' },
];

/* ── shape translation ──────────────────────────────────────────────────
   The server's cart line and the register's cart line are not the same
   object and never will be: one is a row in a JSON document, the other is a
   live thing with a stable React key, a stock ceiling and a tax rate. These
   two functions are the ONLY place that knows how to cross between them. */

export function serverLineToCart(l, i) {
    const mods = Array.isArray(l.mods) ? l.mods : [];
    const delta = mods.reduce((a, m) => a + (Number(m.price_delta) || 0), 0);
    const base = Number(l.base_price != null ? l.base_price : l.price) || 0;
    return {
        /* A stable key matters more here than anywhere else in the register:
           the poll replaces this array wholesale, and a key derived from
           Date.now() would remount every row and drop the caret out of the
           note the waiter is in the middle of typing. */
        cartItemId: l.line_id || `srv-${l.id}-${i}`,
        lineId: l.line_id || null,
        id: l.id,
        name: l.name,
        price: base + delta,
        original_price: base,
        basePrice: base,
        mods,
        qty: Number(l.qty) || 1,
        freeQuantity: 0,
        discount: 0,
        notes: l.notes || '',
        sent: !!l.sent,
        course: Number(l.course) || 1,
        paidSaleId: l.paid_sale_id || null,
        /* The kitchen has already committed the stock for a fired line, and a
           waiter cannot be blocked mid-service by a stock ceiling they have no
           way to clear. Stock is enforced when the sale posts. */
        stock: Number.MAX_SAFE_INTEGER,
        unit: l.unit || 'pcs',
        tax_rate: Number(l.tax_rate) || 0,
    };
}

export function cartLineToServer(l) {
    return {
        line_id: l.lineId || l.cartItemId,
        id: l.id,
        name: l.name,
        price: Number(l.basePrice != null ? l.basePrice : (l.original_price != null ? l.original_price : l.price)) || 0,
        qty: Number(l.qty) || 0,
        notes: l.notes || '',
        sent: !!l.sent,
        course: Number(l.course) || 1,
        mods: Array.isArray(l.mods) ? l.mods.map(m => ({
            id: m.id, name: m.name, price_delta: Number(m.price_delta) || 0,
        })) : [],
    };
}

/* A cart signature that changes when something worth SAVING changes, and not
   when something cosmetic does. Without it the debounce fires on every
   re-render and the floor saves an unchanged order forever. */
const signature = (lines) => JSON.stringify((lines || []).map(cartLineToServer));

export function useTableService({
    enabled = false,
    storeSlug,
    initialPositions = [],
    initialTickets = [],
    initialZones = [],
    initialKitchen = 0,
    lanes = { takeaway: false, delivery: false },
    onError,
    onNotice,
} = {}) {
    const [positions, setPositions] = useState(initialPositions);
    /* A takeaway bag is an open bill with no seat. Modelling it as a fake
       table would put phantom rows on the floor plan and break every covers
       and capacity number on the screen, so lane tickets are their own list
       and share every action a table has. */
    const [tickets, setTickets] = useState(initialTickets);
    const [zones, setZones] = useState(initialZones);
    const [kitchen, setKitchen] = useState(initialKitchen);
    const [zone, setZone] = useState('all');
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [, setTick] = useState(0);

    /* A poll must never overwrite a change that has not landed yet. One flag,
       checked by the poll and held for the whole life of a mutation, is the
       difference between "the floor is live" and "the covers I just typed
       jumped back to 2". */
    const inFlight = useRef(false);
    const saveTimer = useRef(null);
    const lastPushed = useRef(null);

    const r = useCallback(
        (name, params = {}) => route(name, { store_slug: storeSlug, ...params }),
        [storeSlug],
    );

    const fail = useCallback((e, fallback) => {
        const msg = e?.response?.data?.message || fallback;
        if (onError) onError(msg);
        return null;
    }, [onError]);

    /* ── reading ──────────────────────────────────────────────────────── */

    const applyState = useCallback((d) => {
        if (!d) return;
        if (Array.isArray(d.positions)) setPositions(d.positions);
        if (Array.isArray(d.tickets)) setTickets(d.tickets);
        if (Array.isArray(d.zones)) setZones(d.zones);
        if (typeof d.kitchen === 'number') setKitchen(d.kitchen);
    }, []);

    const refresh = useCallback(async () => {
        if (!enabled || inFlight.current) return;
        try {
            const { data } = await axios.get(r('store.tables.state'));
            applyState(data);
        } catch (_) {
            /* A failed poll is not worth a toast. The next one is 15s away and
               the operator has lost nothing -- saying so on every dropped
               packet is how a status line becomes noise nobody reads. */
        }
    }, [enabled, r, applyState]);

    useEffect(() => {
        if (!enabled) return undefined;
        const id = setInterval(refresh, POLL_MS);
        return () => clearInterval(id);
    }, [enabled, refresh]);

    useEffect(() => {
        if (!enabled) return undefined;
        const id = setInterval(() => setTick(t => t + 1), TICK_MS);
        return () => clearInterval(id);
    }, [enabled]);

    /* ── writing ──────────────────────────────────────────────────────── */

    const post = useCallback(async (name, body, fallbackMsg) => {
        setBusy(true);
        inFlight.current = true;
        try {
            const { data } = await axios.post(r(name), body);
            if (data?.positions) setPositions(data.positions);
            if (data?.tickets) setTickets(data.tickets);
            if (data?.position) {
                setPositions(prev => prev.map(p => (p.id === data.position.id ? data.position : p)));
            }
            /* One shape, two lists. Every mutation answers with the card it
               changed and it may be either kind, so the writer does not have
               to know which -- and a ticket cannot fall through into the
               positions list and appear as a table. */
            if (data?.ticket) {
                setTickets(prev => {
                    const i = prev.findIndex(t => t.id === data.ticket.id);
                    if (i === -1) return [...prev, data.ticket];
                    const next = prev.slice(); next[i] = data.ticket; return next;
                });
            }
            return data;
        } catch (e) {
            return fail(e, fallbackMsg);
        } finally {
            inFlight.current = false;
            setBusy(false);
        }
    }, [r, fail]);

    const selected = useMemo(
        () => positions.find(p => p.id === selectedId)
            || tickets.find(t => t.id === selectedId)
            || null,
        [positions, tickets, selectedId],
    );

    /* Which cards the chosen tab shows. Takeaway and delivery are VIRTUAL
       zones sitting in the same strip as the real ones: a dark kitchen sees
       only those two tabs, a dine-in-only room never sees them at all, and
       neither case needs a second screen. */
    const visible = useMemo(() => {
        if (zone === 'takeaway') return tickets.filter(t => t.order_type === 'takeaway');
        if (zone === 'delivery') return tickets.filter(t => t.order_type === 'delivery');
        if (zone === 'all') return [...positions, ...tickets];
        return positions.filter(p => p.zone === zone);
    }, [positions, tickets, zone]);

    /* The tabs, in the order they are read: every real area, then the lanes
       the shop has turned on. */
    const tabs = useMemo(() => {
        const out = zones.map(z => ({ id: z, label: z, kind: 'zone' }));
        if (lanes.takeaway) {
            out.push({ id: 'takeaway', label: 'Takeaway', kind: 'lane',
                       count: tickets.filter(t => t.order_type === 'takeaway').length });
        }
        if (lanes.delivery) {
            out.push({ id: 'delivery', label: 'Delivery', kind: 'lane',
                       count: tickets.filter(t => t.order_type === 'delivery').length });
        }
        return out;
    }, [zones, lanes.takeaway, lanes.delivery, tickets]);

    const counts = useMemo(() => {
        const now = Date.now();
        const open = positions.filter(p => p.occupancy_id);
        const billing = [...open, ...tickets];
        return {
            open: open.length,
            free: positions.filter(p => !p.occupancy_id && p.status === 'available').length,
            tickets: tickets.length,
            covers: open.reduce((a, p) => a + (Number(p.covers) || 0), 0),
            /* Money on the floor includes the bags on the pass. It is the
               answer to "what would we lose if the power went out", and a
               takeaway order is exactly as lost as a table's. */
            due: billing.reduce((a, p) => a + (Number(p.order_total) || 0), 0),
            unsent: billing.reduce((a, p) => a + (Number(p.unsent) || 0), 0),
            alerts: billing.filter(c => alertAge(c, now) > 0).length,
        };
    }, [positions, tickets]);

    /* ── the actions ──────────────────────────────────────────────────── */

    const openTable = useCallback(async (positionId, opts = {}) => {
        const data = await post('store.tables.open', {
            position_id: positionId,
            covers: opts.covers ?? 2,
            order_type: opts.orderType ?? 'dine_in',
            party_id: opts.partyId ?? null,
        }, 'That table could not be opened.');
        if (data?.position) setSelectedId(data.position.id);
        return data?.position || null;
    }, [post]);

    /* Saving the order is debounced and, critically, is the ONLY writer of the
       cart. `flush` exists because two moments cannot wait out a debounce:
       firing to the kitchen, and handing the bill to the tender panel. Firing
       a stale order cooks the wrong food; settling a stale one charges for it. */
    const pushOrder = useCallback((occupancyId, lines, meta = {}, immediate = false) => {
        if (!occupancyId) return;
        const sig = signature(lines);
        if (!immediate && sig === lastPushed.current) return;
        lastPushed.current = sig;

        const body = {
            occupancy_id: occupancyId,
            cart: (lines || []).map(cartLineToServer),
            covers: meta.covers,
            order_type: meta.orderType,
            note: meta.note ?? '',
            party_id: meta.partyId ?? null,
        };

        clearTimeout(saveTimer.current);
        if (immediate) {
            return post('store.tables.order', body, 'The order could not be saved.');
        }
        saveTimer.current = setTimeout(() => {
            post('store.tables.order', body, 'The order could not be saved.');
        }, SAVE_MS);
        return undefined;
    }, [post]);

    /* Loading a table's order into the register is not an EDIT of it. Without
       this the very first save after opening a table would post back the
       identical cart the server just sent -- a write with nothing in it, on
       every table the waiter touches. */
    const prime = useCallback((lines) => { lastPushed.current = signature(lines); }, []);

    const flushOrder = useCallback(async (occupancyId, lines, meta) => {
        clearTimeout(saveTimer.current);
        lastPushed.current = signature(lines);
        return post('store.tables.order', {
            occupancy_id: occupancyId,
            cart: (lines || []).map(cartLineToServer),
            covers: meta?.covers,
            order_type: meta?.orderType,
            note: meta?.note ?? '',
            party_id: meta?.partyId ?? null,
        }, 'The order could not be saved.');
    }, [post]);

    const sendToKitchen = useCallback(async (occupancyId) => {
        const data = await post('store.tables.send', { occupancy_id: occupancyId },
            'Nothing was sent to the kitchen.');
        if (data && onNotice) {
            onNotice(`${data.sent} item${data.sent === 1 ? '' : 's'} fired to the kitchen`);
        }
        return data;
    }, [post, onNotice]);

    const transfer = useCallback((occupancyId, toPosition) =>
        post('store.tables.transfer', { occupancy_id: occupancyId, to_position: toPosition },
            'That table could not be moved.'), [post]);

    const merge = useCallback((fromOccupancy, intoOccupancy) =>
        post('store.tables.merge', { from_occupancy: fromOccupancy, into_occupancy: intoOccupancy },
            'Those tables could not be merged.'), [post]);

    const closeTable = useCallback(async (occupancyId, force = false) => {
        const data = await post('store.tables.close', { occupancy_id: occupancyId, force },
            'That table could not be closed.');
        if (data) setSelectedId(null);
        return data;
    }, [post]);

    /* A bag or a delivery run, opened with no seat. */
    const openLane = useCallback(async (orderType, meta = {}) => {
        const data = await post('store.tables.lane.open', {
            order_type: orderType,
            customer_name: meta.customerName ?? null,
            phone: meta.phone ?? null,
            address: meta.address ?? null,
        }, 'That ticket could not be opened.');
        if (data?.ticket) setSelectedId(data.ticket.id);
        return data?.ticket || null;
    }, [post]);

    /* The bill has been printed and they have not paid yet. It is the state
       that turns into an alarm twelve minutes later, which is the whole
       reason it is worth recording rather than leaving in a waiter's head. */
    const dropCheck = useCallback((occupancyId, clear = false) =>
        post('store.tables.check', { occupancy_id: occupancyId, clear },
            'That could not be recorded.'), [post]);

    const setStatus = useCallback((positionId, status) =>
        post('store.tables.status', { position_id: positionId, status },
            'That table’s status could not be changed.'), [post]);

    const split = useCallback((occupancyId, spec) =>
        post('store.tables.split', { occupancy_id: occupancyId, ...spec },
            'That bill could not be split.'), [post]);

    const cancelSplit = useCallback((occupancyId) =>
        post('store.tables.split.cancel', { occupancy_id: occupancyId },
            'The split could not be cancelled.'), [post]);

    /* Called by the register once the money is banked. It is deliberately
       forgiving: the sale is already posted, so a table left showing as open
       is a nuisance to be reported, never a reason to fail a completed sale. */
    const markSettled = useCallback(async (occupancyId, saleId, partId = null) => {
        try {
            const { data } = await axios.post(r('store.tables.settled'), {
                occupancy_id: occupancyId,
                sale_id: saleId ?? null,
                part_id: partId,
            });
            await refresh();
            return data;
        } catch (e) {
            if (onError) onError('Paid, but the table did not clear. Free it from the floor.');
            return null;
        }
    }, [r, refresh, onError]);

    useEffect(() => () => clearTimeout(saveTimer.current), []);

    return {
        enabled,
        positions, tickets, visible, zones, tabs, zone, setZone, kitchen, counts, lanes,
        selected, selectedId, select: setSelectedId,
        busy,
        refresh,
        openTable, openLane, dropCheck, prime, pushOrder, flushOrder, sendToKitchen,
        transfer, merge, closeTable, setStatus,
        split, cancelSplit, markSettled,
    };
}

export default useTableService;
