/**
 * The Front of House floor, kept on THIS device while the server cannot be reached.
 *
 * WHY THIS EXISTS
 * A restaurant that loses its internet still has guests at its tables. One device
 * (the owner's tablet, the counter PC) must keep seating, ordering, firing to the
 * kitchen, taking takeaway and delivery, and taking payment. This file is that
 * floor: the same cards, the same rules, run locally, with every change written to
 * an outbox that is replayed to the server, in order, when it can be reached again.
 *
 * WHAT IT IS NOT
 * It does not make two devices agree. While offline, each device has its own floor;
 * the first to reach the server wins a table, and the other's work for that table is
 * set aside as a "conflict" for a person to look at (see replayOutbox). The rule we
 * tell customers: offline, run each table from ONE device.
 *
 * The rules below are a port of app/Http/Controllers/TableServiceController.php
 * (shape / ticketShape / derivedState / the mutating actions). If a rule there
 * changes, change it here and in tests/offlineFloor.test.js.
 *
 * Everything in this file is pure: state in, state out. Time and ids are passed in
 * (ctx) so the tests can pin them. Storage is the only side effect (load/saveFloor).
 */

/* ── small helpers ─────────────────────────────────────────────────────── */

const num = (v) => Number(v) || 0;
const r2 = (v) => Math.round((num(v) + Number.EPSILON) * 100) / 100;
const r4 = (v) => Math.round((num(v) + Number.EPSILON) * 10000) / 10000;
const clone = (v) => JSON.parse(JSON.stringify(v));

export const isLocalId = (v) => typeof v === 'string' && v.startsWith('L-');

/** A refusal that mirrors the server's 422 so the screen shows the same words. */
export class FloorRefusal extends Error {
    constructor(message, extra = {}) {
        super(message);
        this.name = 'FloorRefusal';
        this.response = { status: 422, data: { message, ...extra } };
    }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function humanTime(iso) {
    const d = new Date(iso);
    const h = d.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h12)}:${pad(d.getMinutes())} ${h >= 12 ? 'PM' : 'AM'} · ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ── money (same helpers, same rounding as the controller) ─────────────── */

const lineUnit = (l) => r4(num(l.price) + (l.mods || []).reduce((a, m) => a + num(m.price_delta), 0));
const lineTotal = (l) => r2(lineUnit(l) * num(l.qty));
const cartTotal = (cart) => r2((cart || []).reduce((a, l) => a + lineTotal(l), 0));
const lineKey = (l) => String(l.line_id ?? l.id ?? '');
const unpaidLines = (cart) => (cart || []).filter((l) => !l.paid_sale_id);
const paidLines = (cart) => (cart || []).filter((l) => !!l.paid_sale_id);
const priceLine = (l) => ({ ...l, mods: [...(l.mods || [])], unit_price: lineUnit(l) });

function unpaidTotal(s) {
    let owed = cartTotal(unpaidLines(s.cart)) - num(s.off_paid);
    if (s.order_type === 'delivery' && s.delivery && num(s.delivery.fee)) owed += num(s.delivery.fee);
    return r2(Math.max(0, owed));
}

const sentQtyOf = (l) => (l.sent_qty != null ? num(l.sent_qty) : (l.sent ? num(l.qty ?? 1) : 0));
const lineIsUnsent = (l) => !l.sent || num(l.qty ?? 1) > sentQtyOf(l);

/** A settled line is neither editable nor deletable (controller: preservePaidLines). */
function preservePaidLines(submitted, stored) {
    const paid = new Map();
    (stored || []).forEach((l) => { if (l.paid_sale_id) paid.set(lineKey(l), l); });
    const out = [];
    (submitted || []).forEach((l0) => {
        const l = { ...l0 };
        delete l.paid_sale_id;
        const k = lineKey(l);
        if (paid.has(k)) { out.push(paid.get(k)); paid.delete(k); return; }
        out.push(l);
    });
    paid.forEach((l) => out.push(l));
    return out;
}

/* ── the session a card carries ────────────────────────────────────────── */

/**
 * The server publishes cards, not raw sessions. A card is turned back into the
 * session its numbers came from the first time this device touches it, and the
 * session then rides on the card as `_s`.
 */
function sessionOf(card) {
    if (card._s) return card._s;
    const cart = Array.isArray(card.cart) ? card.cart : [];
    return {
        order_type: card.order_type || (card.kind === 'ticket' ? 'takeaway' : 'dine_in'),
        covers: num(card.covers),
        cart,
        note: card.note || '',
        sent_at: card._sent_at || null,
        check_dropped_at: card.check_dropped_at || null,
        delivery: card.delivery || null,
        customer_name: card.customer_name || '',
        phone: card.phone || '',
        address: card.address || '',
        paid_at: card.paid_at || null,
        collected_at: card.collected_at || null,
        pending_settle: card.pending_settle || null,
        off_paid: Math.max(0, r2(num(card.paid_total) - cartTotal(paidLines(cart)))),
        fired: num(card.kitchen_progress?.fired),
        served: num(card.kitchen_progress?.served),
        ready: num(card.kitchen_progress?.ready),
        opened_at: card.opened_at || null,
    };
}

function derivedState(s, occupied, pstatus, now) {
    if (!occupied) {
        if (pstatus === 'cleaning' || pstatus === 'reserved') return { state: pstatus, state_since: now };
        return { state: 'free', state_since: null };
    }
    if (s.check_dropped_at && unpaidTotal(s) > 0) return { state: 'check_dropped', state_since: s.check_dropped_at };
    if (!s.cart.length) return { state: 'seated', state_since: s.opened_at };
    if (s.cart.some((l) => !l.sent)) return { state: 'ordered', state_since: s.opened_at };
    // Everything is fired. Nothing here can mark a kitchen ticket served (that
    // happens on the kitchen screen), so a fired order stays "in kitchen" until paid.
    if (s.fired - s.served > 0) return { state: 'in_kitchen', state_since: s.sent_at || s.opened_at };
    return { state: 'served', state_since: s.sent_at || s.opened_at };
}

function counts(s) {
    let unsent = 0; let customerPending = 0;
    s.cart.forEach((l) => {
        if (lineIsUnsent(l)) { unsent += 1; if (l.customer_pending) customerPending += 1; }
    });
    return { unsent, customerPending };
}

const guestCall = (s) => ((s.guest_call && !s.guest_call.handled_at) ? (s.guest_call.kind || 'waiter') : null);

/** Rebuild a TABLE card from its session. `card` supplies the static fields. */
function shapePosition(card, s, ctx) {
    const occupied = !!card.occupancy_id;
    const pstatus = card._pstatus || 'available';
    const unpaid = occupied ? unpaidTotal(s) : 0;
    const paid = occupied ? r2(cartTotal(paidLines(s.cart)) + num(s.off_paid)) : 0;
    const d = derivedState(s, occupied, pstatus, ctx.now());
    const c = occupied ? counts(s) : { unsent: 0, customerPending: 0 };
    return {
        id: card.id, kind: 'position', zone: card.zone, code: card.code, label: card.label,
        capacity: card.capacity, sort_order: card.sort_order,
        status: occupied ? 'open' : (pstatus === 'reserved' || pstatus === 'cleaning' ? pstatus : 'available'),
        state: d.state, state_since: d.state_since,
        occupancy_id: occupied ? card.occupancy_id : null,
        opened_at: occupied ? s.opened_at : null,
        order_type: occupied ? s.order_type : 'dine_in',
        covers: occupied ? num(s.covers) : 0,
        server: occupied ? (card.server || null) : null,
        order_total: unpaid, paid_total: paid, unpaid_total: unpaid,
        pending_settle: occupied ? (s.pending_settle || null) : null,
        lines: occupied ? s.cart.length : 0,
        unsent: c.unsent, customer_pending: c.customerPending,
        guest_call: occupied ? guestCall(s) : null,
        note: occupied ? (s.note || '') : '',
        cart: occupied ? s.cart : [],
        check_dropped_at: occupied ? (s.check_dropped_at || null) : null,
        kitchen_progress: occupied ? { fired: s.fired, ready: s.ready, served: s.served } : { fired: 0, ready: 0, served: 0 },
        _pstatus: pstatus,
        _s: occupied ? s : null,
    };
}

/** Rebuild a TAKEAWAY / DELIVERY ticket card from its session. */
function shapeTicket(card, s, ctx) {
    const unpaid = unpaidTotal(s);
    const paid = r2(cartTotal(paidLines(s.cart)) + num(s.off_paid));
    const d = derivedState(s, true, 'available', ctx.now());
    const c = counts(s);
    const name = String(s.customer_name || '').trim();
    return {
        id: card.id, occupancy_id: card.occupancy_id, kind: 'ticket',
        order_type: s.order_type || 'takeaway',
        code: card.code, label: name !== '' ? name : card.code,
        state: d.state, state_since: d.state_since, opened_at: s.opened_at,
        order_total: unpaid, paid_total: paid, unpaid_total: unpaid,
        pending_settle: s.pending_settle || null,
        lines: s.cart.length, unsent: c.unsent, customer_pending: c.customerPending,
        guest_call: guestCall(s), note: s.note || '', cart: s.cart,
        customer_name: String(s.customer_name || ''), phone: String(s.phone || ''), address: String(s.address || ''),
        delivery: s.order_type === 'delivery' ? freshDelivery(s.delivery || {}, ctx) : null,
        check_dropped_at: s.check_dropped_at || null,
        server: card.server || null,
        kitchen_progress: { fired: s.fired, ready: s.ready, served: s.served },
        paid_at: s.paid_at || null, collected_at: s.collected_at || null,
        _s: s,
    };
}

export const DELIVERY_STATES = ['placed', 'preparing', 'out', 'delivered'];

function freshDelivery(given, ctx) {
    const status = DELIVERY_STATES.includes(given.status) ? given.status : 'placed';
    return {
        status,
        status_at: given.status_at || ctx.now(),
        rider: String(given.rider || ''),
        rider_id: given.rider_id ?? null,
        note: String(given.note || ''),
        fee: r2(given.fee),
        eta_minutes: given.eta_minutes !== undefined && given.eta_minutes !== null && given.eta_minutes !== '' ? Math.round(num(given.eta_minutes)) : null,
        payment_method: given.payment_method || 'cash',
        collected_amount: r2(given.collected_amount),
        cash_handed_in: !!given.cash_handed_in,
        commission_rate: num(given.commission_rate),
        tracking_token: given.tracking_token || ctx.token(),
        history: Array.isArray(given.history) ? given.history : [],
    };
}

/* ── the state object ──────────────────────────────────────────────────── */

/**
 * Take what the server (or the page props) published and make it workable.
 * Cards keep their server fields; `_s` / `_pstatus` are added lazily.
 */
export function seedState(raw = {}) {
    return {
        positions: (raw.positions || []).map((p) => ({ ...p, _pstatus: p._pstatus || (p.status === 'reserved' || p.status === 'cleaning' ? p.status : 'available') })),
        tickets: [...(raw.tickets || [])],
        zones: [...(raw.zones || [])],
        kitchen: num(raw.kitchen),
        eighty_six_ids: [...(raw.eighty_six_ids || [])],
    };
}

/** The server-shaped floor answer (strips this file's private keys? No: they are harmless and needed to continue). */
const floorOf = (st) => ({
    positions: st.positions, tickets: st.tickets, zones: st.zones, kitchen: st.kitchen, eighty_six_ids: st.eighty_six_ids,
});

function findOcc(st, occId) {
    const id = String(occId);
    const pi = st.positions.findIndex((p) => p.occupancy_id !== null && p.occupancy_id !== undefined && String(p.occupancy_id) === id);
    if (pi !== -1) return { list: 'positions', index: pi, card: st.positions[pi] };
    const ti = st.tickets.findIndex((t) => String(t.occupancy_id) === id);
    if (ti !== -1) return { list: 'tickets', index: ti, card: st.tickets[ti] };
    return null;
}

function put(st, list, index, card) {
    const next = { ...st, [list]: st[list].slice() };
    next[list][index] = card;
    return next;
}

const cardKey = (hit) => (hit.list === 'positions' ? 'position' : 'ticket');

function reshape(hit, s, ctx) {
    return hit.list === 'positions' ? shapePosition(hit.card, s, ctx) : shapeTicket(hit.card, s, ctx);
}

function nextTicketCode(st, type, ctx) {
    const prefix = type === 'delivery' ? 'DL' : 'TA';
    let max = 0;
    st.tickets.forEach((t) => {
        const m = new RegExp(`^${prefix}-(\\d+)$`).exec(String(t.code || ''));
        if (m) max = Math.max(max, Number(m[1]));
    });
    max = Math.max(max, num(ctx.ticketSeq && ctx.ticketSeq(prefix)));
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

/* ── kitchen slips (offline: one station, grouped by course) ───────────── */

function buildKots(card, s, lines, ctx, label) {
    const routing = ctx.routing || {};
    const byCourse = new Map();
    lines.forEach((l) => {
        const course = Number(l.course) || 1;
        if (!byCourse.has(course)) byCourse.set(course, []);
        byCourse.get(course).push(l);
    });
    const stamp = ctx.now();
    return [...byCourse.entries()].sort((a, b) => a[0] - b[0]).map(([course, ls]) => ({
        ticket_id: ctx.uid(),
        order_number: label,
        table_number: card.kind === 'ticket' ? card.code : (card.code || label),
        order_type: s.order_type,
        order_type_badge: s.order_type === 'takeaway' ? 'TAKEAWAY' : (s.order_type === 'delivery' ? 'DELIVERY' : 'DINE-IN'),
        customer_name: s.customer_name || '',
        server_name: card.server?.name || ctx.user?.name || 'Staff',
        station: routing.main_name || 'Kitchen',
        printer_name: null,
        printer_role: routing.main_printer || 'kitchen',
        course,
        fired_at: stamp,
        fired_at_human: humanTime(stamp),
        items: ls.map((l) => ({
            name: l.name || 'Item',
            qty: num(l.sendQty != null ? l.sendQty : (l.qty ?? 1)),
            notes: l.notes || '',
            course,
            modifiers: (l.mods || []).map((m) => String(m.name || '')),
        })),
        is_reprint: false,
        is_cancellation: false,
    }));
}

function cancellationKot(card, s, items, ctx, label) {
    const routing = ctx.routing || {};
    const stamp = ctx.now();
    return {
        ticket_id: ctx.uid(),
        order_number: label,
        table_number: card.kind === 'ticket' ? card.code : (card.code || label),
        order_type: s.order_type,
        order_type_badge: s.order_type === 'takeaway' ? 'TAKEAWAY' : (s.order_type === 'delivery' ? 'DELIVERY' : 'DINE-IN'),
        customer_name: s.customer_name || '',
        server_name: ctx.user?.name || 'Staff',
        station: routing.main_name || 'Kitchen',
        printer_role: routing.main_printer || 'kitchen',
        course: 1,
        fired_at: stamp,
        fired_at_human: humanTime(stamp),
        items: items.map((it) => ({ name: it.name || 'Item', qty: num(it.qty), notes: it.notes || 'CANCELLED BY WAITER/CASHIER', modifiers: it.modifiers || [] })),
        is_reprint: false,
        is_cancellation: true,
    };
}

/* ── the actions ───────────────────────────────────────────────────────── */

/**
 * Each action: (state, body, ctx) -> { state, response }.
 * Throws FloorRefusal for anything the server would refuse with a 422.
 * Returns `outbox: false` for actions that change nothing worth replaying.
 */
const ACTIONS = {
    'store.tables.open'(st, body, ctx) {
        const pi = st.positions.findIndex((p) => String(p.id) === String(body.position_id));
        if (pi === -1) throw new FloorRefusal('That table does not exist.');
        const pos = st.positions[pi];
        if (pos.occupancy_id) throw new FloorRefusal('That table is already open.');
        const occId = body.client_ref || ctx.ref();
        const now = ctx.now();
        const s = {
            order_type: body.order_type || 'dine_in', covers: num(body.covers) || 1, cart: [], note: '', sent_at: null,
            check_dropped_at: null, delivery: null, customer_name: '', phone: '', address: '', paid_at: null, collected_at: null,
            pending_settle: null, off_paid: 0, fired: 0, served: 0, ready: 0, opened_at: now,
        };
        const card = shapePosition({ ...pos, occupancy_id: occId, server: ctx.user ? { id: ctx.user.id, name: ctx.user.name, initials: initials(ctx.user.name) } : null }, s, ctx);
        return { state: put(st, 'positions', pi, card), response: { position: card }, body: { ...body, client_ref: occId } };
    },

    'store.tables.order'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) return { state: st, response: { message: 'Table session is closed.', closed: true }, outbox: false };
        const s = { ...sessionOf(hit.card) };
        const oldCart = s.cart;
        const newCart = (body.cart || []).map((l) => ({ ...l }));

        const cancelled = [];
        oldCart.forEach((ol) => {
            const oldSent = sentQtyOf(ol);
            if (oldSent <= 0) return;
            const oid = ol.line_id ?? ol.id ?? null;
            const idx = newCart.findIndex((nl) => oid !== null && (nl.line_id ?? nl.id ?? null) !== null && String(oid) === String(nl.line_id ?? nl.id));
            const newQty = idx === -1 ? 0 : num(newCart[idx].qty);
            if (newQty < oldSent) {
                cancelled.push({ name: ol.name, qty: oldSent - newQty, notes: ol.notes || '', modifiers: (ol.mods || []).map((m) => String(m.name || '')) });
                if (idx !== -1) newCart[idx].sent_qty = newQty;
            }
        });

        s.cart = preservePaidLines(newCart, oldCart).map(priceLine);
        if (body.covers !== undefined && body.covers !== null) s.covers = num(body.covers);
        if (body.order_type) s.order_type = body.order_type;
        if (body.note !== undefined && body.note !== null) s.note = String(body.note);

        const card = reshape(hit, s, ctx);
        const label = hit.card.kind === 'ticket' ? hit.card.code : (hit.card.label || hit.card.code);
        const response = { [cardKey(hit)]: card, cancellation_kot: cancelled.length ? cancellationKot(hit.card, s, cancelled, ctx, label) : null };
        return { state: put(st, hit.list, hit.index, card), response };
    },

    'store.tables.send'(st, body, ctx) {
        return fire(st, body, ctx, null);
    },

    'store.tables.kitchen.course-fire'(st, body, ctx) {
        return fire(st, body, ctx, Number(body.course) || 1);
    },

    'store.tables.transfer'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) throw new FloorRefusal('That table is not open.');
        if (hit.list !== 'positions') throw new FloorRefusal('Moving a takeaway or delivery order to a table works online, or use Convert.');
        const di = st.positions.findIndex((p) => String(p.id) === String(body.to_position));
        if (di === -1) throw new FloorRefusal('That table does not exist.');
        if (st.positions[di].occupancy_id) throw new FloorRefusal('That table is already open. Merge instead.');
        const s = sessionOf(hit.card);
        const base = { ...st.positions[di], occupancy_id: hit.card.occupancy_id, server: hit.card.server };
        const moved = shapePosition(base, s, ctx);
        const freed = shapePosition({ ...hit.card, occupancy_id: null, _pstatus: 'available' }, s, ctx);
        let next = put(st, 'positions', di, moved);
        next = put(next, 'positions', hit.index, freed);
        return { state: next, response: floorOf(next) };
    },

    'store.tables.merge'(st, body, ctx) {
        const from = findOcc(st, body.from_occupancy);
        const into = findOcc(st, body.into_occupancy);
        if (!from || !into) throw new FloorRefusal('Those tables could not be merged.');
        const sa = sessionOf(into.card); const sb = sessionOf(from.card);
        if (sa.pending_settle || sb.pending_settle) throw new FloorRefusal('One of these tables has a split at the till. Settle or cancel it first.');
        const merged = { ...sa, cart: [...sa.cart, ...sb.cart], off_paid: r2(num(sa.off_paid) + num(sb.off_paid)), covers: num(sa.covers) + num(sb.covers), fired: sa.fired + sb.fired, served: sa.served + sb.served, ready: sa.ready + sb.ready };
        let next = put(st, into.list, into.index, reshape(into, merged, ctx));
        next = dropOcc(next, from, ctx);
        return { state: next, response: floorOf(next) };
    },

    'store.tables.close'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) return { state: st, response: floorOf(st), outbox: false };
        const total = unpaidTotal(sessionOf(hit.card));
        if (total > 0 && !body.force) throw new FloorRefusal('This table has an unsettled order. Settle it, or confirm to discard.', { total });
        const next = dropOcc(st, hit, ctx);
        return { state: next, response: floorOf(next) };
    },

    'store.tables.status'(st, body, ctx) {
        const pi = st.positions.findIndex((p) => String(p.id) === String(body.position_id));
        if (pi === -1) throw new FloorRefusal('That table does not exist.');
        const pos = st.positions[pi];
        const card = shapePosition({ ...pos, _pstatus: body.status === 'available' ? 'available' : body.status }, pos._s || sessionOf(pos), ctx);
        const next = put(st, 'positions', pi, card);
        return { state: next, response: floorOf(next) };
    },

    'store.tables.check'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) throw new FloorRefusal('That table is not open.');
        const s = { ...sessionOf(hit.card) };
        s.check_dropped_at = body.clear ? null : ctx.now();
        const card = reshape(hit, s, ctx);
        return { state: put(st, hit.list, hit.index, card), response: { [cardKey(hit)]: card } };
    },

    'store.tables.lane.open'(st, body, ctx) {
        const type = body.order_type === 'delivery' ? 'delivery' : 'takeaway';
        const occId = body.client_ref || ctx.ref();
        const code = body.client_code || nextTicketCode(st, type, ctx);
        const now = ctx.now();
        const s = {
            order_type: type, covers: 0, cart: [], note: '', sent_at: null,
            customer_name: String(body.customer_name || ''), phone: String(body.phone || ''), address: String(body.address || '').trim(),
            check_dropped_at: null, delivery: null, paid_at: null, collected_at: null, pending_settle: null, off_paid: 0,
            fired: 0, served: 0, ready: 0, opened_at: now,
        };
        if (type === 'delivery') {
            s.delivery = freshDelivery({
                note: body.delivery_note, fee: body.delivery_fee, rider: body.rider, rider_id: body.rider_id,
                eta_minutes: body.eta_minutes, payment_method: body.payment_method || 'cash',
            }, ctx);
        }
        const card = shapeTicket({
            id: `t${occId}`, occupancy_id: occId, code,
            server: ctx.user ? { id: ctx.user.id, name: ctx.user.name, initials: initials(ctx.user.name) } : null,
        }, s, ctx);
        const next = { ...st, tickets: [...st.tickets, card] };
        return { state: next, response: { ticket: card }, body: { ...body, client_ref: occId, client_code: code } };
    },

    'store.tables.delivery'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) throw new FloorRefusal('That ticket is not open.');
        const s = { ...sessionOf(hit.card) };
        if (s.order_type !== 'delivery') throw new FloorRefusal('That ticket is not a delivery.');
        const d = freshDelivery(s.delivery || {}, ctx);
        const has = (k) => Object.prototype.hasOwnProperty.call(body, k);
        if (has('note')) d.note = String(body.note ?? '');
        if (has('eta_minutes')) d.eta_minutes = body.eta_minutes === null || body.eta_minutes === '' ? null : Math.round(num(body.eta_minutes));
        if (has('fee')) d.fee = r2(body.fee);
        if (has('payment_method')) d.payment_method = body.payment_method;
        if (has('collected_amount')) d.collected_amount = r2(body.collected_amount);
        if (has('rider_id')) { d.rider_id = body.rider_id; if (!body.rider_id) d.rider = ''; else if (has('rider')) d.rider = String(body.rider || ''); }
        else if (has('rider')) d.rider = String(body.rider || '');
        if (body.status && body.status !== d.status) {
            if (!DELIVERY_STATES.includes(body.status)) throw new FloorRefusal('That delivery status is not valid.');
            d.status = body.status; d.status_at = ctx.now();
            d.history = [...d.history, { status: body.status, at: d.status_at }].slice(-12);
        }
        ['customer_name', 'phone', 'address'].forEach((k) => { if (has(k)) s[k] = String(body[k] ?? ''); });
        s.delivery = d;
        const card = reshape(hit, s, ctx);
        return { state: put(st, hit.list, hit.index, card), response: { ticket: card } };
    },

    'store.tables.convert'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) throw new FloorRefusal('That order is already closed.');
        const s = { ...sessionOf(hit.card) };
        const from = hit.list === 'positions' ? 'dine_in' : (s.order_type === 'delivery' ? 'delivery' : 'takeaway');
        const to = body.to;
        if (from === to) return { state: st, response: { [cardKey(hit)]: hit.card }, outbox: false };
        if (s.pending_settle) throw new FloorRefusal('A part of this bill is waiting at the till. Finish or cancel the split first.');

        let next = st;
        let card;
        if (to === 'dine_in') {
            if (!body.position_id) throw new FloorRefusal('Choose a table first.');
            const di = st.positions.findIndex((p) => String(p.id) === String(body.position_id));
            if (di === -1) throw new FloorRefusal('That table does not exist.');
            if (st.positions[di].occupancy_id) throw new FloorRefusal('That table is already open.');
            s.order_type = 'dine_in';
            s.covers = num(body.covers) || Math.max(1, num(s.covers));
            s.paid_at = null;
            card = shapePosition({ ...st.positions[di], occupancy_id: hit.card.occupancy_id, server: hit.card.server }, s, ctx);
            next = put(st, 'positions', di, card);
            next = { ...next, tickets: next.tickets.filter((t) => String(t.occupancy_id) !== String(hit.card.occupancy_id)) };
        } else {
            s.order_type = to;
            s.covers = 0;
            ['customer_name', 'phone', 'address'].forEach((k) => { if (body[k] !== undefined && body[k] !== null) s[k] = k === 'address' ? String(body[k]).trim() : String(body[k]); });
            if (to === 'delivery') {
                const given = { ...s.delivery };
                if (body.delivery_fee !== undefined && body.delivery_fee !== null) given.fee = body.delivery_fee;
                s.delivery = freshDelivery(given, ctx);
            }
            if (hit.list === 'positions') {
                const code = body.client_code || nextTicketCode(st, to, ctx);
                card = shapeTicket({ id: `t${hit.card.occupancy_id}`, occupancy_id: hit.card.occupancy_id, code, server: hit.card.server }, s, ctx);
                const freed = shapePosition({ ...hit.card, occupancy_id: null, _pstatus: 'available' }, s, ctx);
                next = put(st, 'positions', hit.index, freed);
                next = { ...next, tickets: [...next.tickets, card] };
                body = { ...body, client_code: code };
            } else {
                card = shapeTicket(hit.card, s, ctx);
                next = put(st, 'tickets', hit.index, card);
            }
        }
        return { state: next, response: { [card.kind === 'ticket' ? 'ticket' : 'position']: card, state: floorOf(next) }, body };
    },

    'store.tables.collected'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit || hit.list !== 'tickets') return { state: st, response: floorOf(st), outbox: false };
        const s = sessionOf(hit.card);
        if (unpaidTotal(s) > 0.004) throw new FloorRefusal('This order is not fully paid yet.');
        const next = { ...st, tickets: st.tickets.filter((_, i) => i !== hit.index) };
        return { state: next, response: floorOf(next) };
    },

    'store.tables.settled'(st, body, ctx) {
        const hit = findOcc(st, body.occupancy_id);
        if (!hit) return { state: st, response: { ok: true, closed: true, remaining_total: 0 }, outbox: false };
        const s0 = sessionOf(hit.card);
        if (body.part_id || s0.pending_settle) throw new FloorRefusal('Paying part of a bill works online. Pay the whole bill here, or reconnect to split it.');
        const stamp = body.sale_id === null || body.sale_id === undefined || body.sale_id === '' ? 'settled' : body.sale_id;
        const s = { ...s0, cart: s0.cart.map((l) => (l.paid_sale_id ? l : { ...l, paid_sale_id: stamp })), pending_settle: null };
        s.settled_sale_id = body.sale_id ?? null;

        // A paid bag whose food is still on the pass stays visible until someone hands it over.
        const awaiting = hit.list === 'tickets' && !!ctx.collectsTakeaway && s.fired - s.served > 0;
        if (awaiting) {
            s.paid_at = ctx.now();
            // There is no kitchen screen to bump offline, so a paid bag counts as ready to hand over.
            s.ready = s.fired;
            const card = shapeTicket(hit.card, s, ctx);
            return { state: put(st, 'tickets', hit.index, card), response: { ok: true, closed: false, remaining_total: 0, awaiting_collection: true } };
        }
        const next = dropOcc(st, hit, ctx);
        return { state: next, response: { ok: true, closed: true, remaining_total: 0, awaiting_collection: false } };
    },

    'store.tables.kitchen.86'(st, body) {
        const id = Number(body.product_id);
        const has = st.eighty_six_ids.includes(id);
        const ids = has ? st.eighty_six_ids.filter((x) => x !== id) : [...st.eighty_six_ids, id];
        return { state: { ...st, eighty_six_ids: ids }, response: { eighty_six_ids: ids } };
    },
};

const NEEDS_INTERNET = {
    'store.tables.split': 'Splitting a bill needs internet. Pay the whole bill here, or reconnect to split it.',
    'store.tables.split.cancel': 'Splitting a bill needs internet.',
};

/** Free a table / remove a ticket when its bill is done. */
function dropOcc(st, hit, ctx) {
    if (hit.list === 'positions') {
        const freed = shapePosition({ ...hit.card, occupancy_id: null, _pstatus: 'available' }, sessionOf(hit.card), ctx);
        return put(st, 'positions', hit.index, freed);
    }
    return { ...st, tickets: st.tickets.filter((_, i) => i !== hit.index) };
}

function fire(st, body, ctx, onlyCourse) {
    const hit = findOcc(st, body.occupancy_id);
    if (!hit) throw new FloorRefusal('That table is not open.');
    const s = { ...sessionOf(hit.card) };
    const eligible = [];
    s.cart.forEach((l, i) => {
        const qty = num(l.qty ?? 1);
        const delta = Math.max(0, qty - sentQtyOf(l));
        if (delta <= 0 && l.sent) return;
        const course = Number(l.course) || 1;
        if (onlyCourse !== null) { if (course !== onlyCourse) return; } else if (l.is_held) return;
        eligible.push(i);
    });
    if (!eligible.length) throw new FloorRefusal(onlyCourse !== null ? 'No unsent items in that course.' : 'Nothing new to send.');

    const label = hit.card.kind === 'ticket' ? hit.card.code : (hit.card.label || hit.card.code);
    const toPrint = eligible.map((i) => ({ ...s.cart[i], sendQty: Math.max(0, num(s.cart[i].qty ?? 1) - sentQtyOf(s.cart[i])) || num(s.cart[i].qty ?? 1) }));
    const kots = buildKots(hit.card, s, toPrint, ctx, label);

    s.cart = s.cart.map((l, i) => (eligible.includes(i) ? { ...l, sent_qty: num(l.qty ?? 1), sent: true, is_held: false } : l));
    s.sent_at = ctx.now();
    s.fired += kots.length;
    const card = reshape(hit, s, ctx);
    return {
        state: put(st, hit.list, hit.index, card),
        response: { [cardKey(hit)]: card, sent: eligible.length, kot: kots[0] || null, kots },
        // The server fires from its own copy of the cart, so it needs to know when and which course.
        body: { occupancy_id: body.occupancy_id, offline_replay: true, fired_at: s.sent_at, course: onlyCourse },
        name: 'store.tables.send',
    };
}

/**
 * Run one table-service action on the local floor.
 * @returns {{ state, response, outbox: null | {name, body, at} }}
 */
export function applyLocal(state, name, body, ctx) {
    if (NEEDS_INTERNET[name]) throw new FloorRefusal(NEEDS_INTERNET[name]);
    const fn = ACTIONS[name];
    if (!fn) throw new FloorRefusal('This action needs internet.');
    const out = fn(state, body || {}, ctx);
    const item = out.outbox === false ? null : { name: out.name || name, body: out.body || body || {}, at: ctx.now() };
    return { state: out.state, response: out.response, outbox: item };
}

export const supportsOffline = (name) => !!ACTIONS[name];

/** Append to the outbox. Consecutive saves of the same order collapse to the last one. */
export function enqueue(outbox, item) {
    if (!item) return outbox;
    const last = outbox[outbox.length - 1];
    if (last && item.name === 'store.tables.order' && last.name === 'store.tables.order' && String(last.body.occupancy_id) === String(item.body.occupancy_id)) {
        return [...outbox.slice(0, -1), item];
    }
    return [...outbox, item];
}

/* ── replay ────────────────────────────────────────────────────────────── */

const OCC_KEYS = ['occupancy_id', 'from_occupancy', 'into_occupancy'];

export const isNetworkError = (e) => !!e && (e.isOfflineBlocked === true
    || (!e.response && (e.code === 'ERR_NETWORK' || e.message === 'Network Error' || e.name === 'TypeError' || e.code === 'ECONNABORTED' || e.name === 'AbortError')));

/** Worth trying again later (the server is down, busy or the session needs renewing) - never a reason to throw work away. */
export const isRetryable = (e) => isNetworkError(e) || (!!e?.response && (e.response.status >= 500 || [401, 419, 429].includes(e.response.status)));

/** Answers the server gives when the thing already happened: not a conflict. */
function benign(item, e) {
    const msg = String(e?.response?.data?.message || '');
    if (item.name === 'store.tables.send' && /nothing new to send|no unsent items/i.test(msg)) return true;
    return false;
}

/**
 * Send the outbox to the server in order.
 *
 * @param {Array} items            queued actions
 * @param {(name, body) => Promise<any>} post   performs one request, resolves with the response data
 * @returns {{ remaining: Array, conflicts: Array, sent: number, idmap: object }}
 *   remaining: not yet sent (the network dropped again) - keep for the next try
 *   conflicts: set aside for a person (the server refused them)
 */
export async function replayOutbox(items, post) {
    const idmap = {};
    const dead = new Map(); // local id -> reason
    const conflicts = [];
    let sent = 0;

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const body = { ...item.body };
        let blocked = null;
        for (const k of OCC_KEYS) {
            if (body[k] === undefined || body[k] === null) continue;
            const v = body[k];
            if (idmap[v] !== undefined) body[k] = idmap[v];
            else if (isLocalId(v)) blocked = dead.get(v) || 'The table it belonged to could not be opened on the server.';
        }
        if (blocked) { conflicts.push({ item, message: blocked }); continue; }

        try {
            const data = await post(item.name, body);
            sent += 1;
            if (item.name === 'store.tables.open' && data?.position?.occupancy_id) idmap[item.body.client_ref] = data.position.occupancy_id;
            if (item.name === 'store.tables.lane.open' && data?.ticket?.occupancy_id) idmap[item.body.client_ref] = data.ticket.occupancy_id;
        } catch (e) {
            if (isRetryable(e)) return { remaining: items.slice(i), conflicts, sent, idmap };
            if (benign(item, e)) continue;
            const message = e?.response?.data?.message || e?.message || 'The server refused this change.';
            conflicts.push({ item, message });
            if ((item.name === 'store.tables.open' || item.name === 'store.tables.lane.open') && item.body.client_ref) dead.set(item.body.client_ref, message);
        }
    }
    return { remaining: [], conflicts, sent, idmap };
}

/** A line a person can read in the "needs a look" list. */
export function describeConflict(c, state) {
    const b = c.item.body || {};
    const what = {
        'store.tables.open': 'Opening a table',
        'store.tables.lane.open': 'A takeaway/delivery order',
        'store.tables.order': 'An order',
        'store.tables.send': 'Sending to the kitchen',
        'store.tables.settled': 'A payment',
        'store.tables.close': 'Closing a table',
        'store.tables.transfer': 'Moving a table',
        'store.tables.merge': 'Merging tables',
        'store.tables.convert': 'Changing an order type',
    }[c.item.name] || 'A change';
    const where = b.position_id && state ? (state.positions.find((p) => String(p.id) === String(b.position_id))?.label || '') : '';
    return `${what}${where ? ` (${where})` : ''} made at ${c.item.at ? new Date(c.item.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'an earlier time'} was not applied: ${c.message}`;
}

/* ── storage (the only side effect) ────────────────────────────────────── */

const keyFor = (slug) => `vq_floor_v1_${slug}`;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function loadFloor(slug) {
    try {
        const raw = localStorage.getItem(keyFor(slug));
        if (!raw) return null;
        const v = JSON.parse(raw);
        if (!v || v.version !== 1) return null;
        // A snapshot with nothing waiting in it is just an old copy of the floor: ignore it after a week.
        if (!(v.outbox && v.outbox.length) && Date.now() - num(v.savedAt) > MAX_AGE_MS) return null;
        return v;
    } catch { return null; }
}

export function saveFloor(slug, { state, outbox, conflicts }) {
    try {
        localStorage.setItem(keyFor(slug), JSON.stringify({ version: 1, savedAt: Date.now(), state, outbox: outbox || [], conflicts: conflicts || [] }));
        return true;
    } catch { return false; }
}

export function clearFloor(slug) {
    try { localStorage.removeItem(keyFor(slug)); } catch { /* nothing to clear */ }
}

/** Real clock, ids and tokens for the browser. Tests pass their own. */
export function browserContext({ user = null, routing = null, collectsTakeaway = false, ticketSeq = null } = {}) {
    const rand = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);
    return {
        now: () => new Date().toISOString(),
        uid: () => `K-${rand()}`,
        ref: () => `L-${rand()}`,
        token: () => `${rand()}${rand()}`,
        user, routing, collectsTakeaway, ticketSeq,
    };
}
