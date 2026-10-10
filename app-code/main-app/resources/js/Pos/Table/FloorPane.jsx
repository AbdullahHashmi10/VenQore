/* ==========================================================================
   THE FLOOR — the pane a restaurant shift starts from
   ==========================================================================
   One question drives every pixel here: "where should I walk next?"

   - The STATS BAR answers it for the room: tables in use, guests, money on
     the floor, and how many tables need a person right now (tap it to see
     only those).
   - FILTER CHIPS answer it for a job: free tables when a party walks in,
     paying tables when you are holding the card machine.
   - FIVE VIEWS answer it for a screen:
       map       the room as it really is — tables drawn as round, square or
                 long tables with chairs, where the manager placed them
       cards     smart cards, tables that need someone first
       sections  the same cards, grouped by area
       grid      seating chart — a big number per table
       list      one line per table, for narrow screens
   - Every table carries a NEXT ACTION ("Take the order", "Send 2 to
     kitchen", "Collect payment") so a new waiter knows what the colour means.

   The engine still decides width: a column too narrow for cards gets the
   list, and too narrow for a room gets the seating chart.

   Speed: cards are memoised and receive stable callbacks, so a 15-second
   poll that changes one table repaints one table. Dragging in Arrange mode
   moves the element directly and commits once, on release.
   ========================================================================== */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Users, Clock, Plus, ShoppingBag, Bike, AlertTriangle, Phone, Calendar, Map as MapIcon,
    LayoutGrid, Rows3, Grid3x3, List, Move, RotateCw, Circle, Square,
    RectangleHorizontal, Bell, Check, Undo2, CircleDot, Loader2, Hand, Shrink, Expand, Pencil,
} from 'lucide-react';
import { STATES, alertAge } from './useTableService';
import { DeliveryChip, isLate } from './Delivery';
import ReservationModal from './ReservationModal';
import { kitchenOn, cookWord } from './kitchenWord';
import { useTermText } from '@/lib/terms';
import './floor.css';

/* Minutes since something happened, said the way a person says it. */
export function elapsed(iso) {
    if (!iso) return '';
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

/* Kept for callers that only need the coarse answer. */
export function toneOf(card) {
    return STATES[card?.state]?.tone || (card?.occupancy_id ? 'ordered' : 'free');
}

const LANE_ICON = { takeaway: ShoppingBag, delivery: Bike };

const minsSince = (iso, now) => (iso ? Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000)) : 0);

/* How long a party has been in, as a level: a table at 95 minutes is a
   different conversation from one at 20. */
function timerLevel(card, now) {
    if (!card.opened_at) return 0;
    const m = minsSince(card.opened_at, now);
    return m >= 90 ? 2 : m >= 60 ? 1 : 0;
}

/* The one thing to do next, in the words a shift lead would use. */
export function nextAction(c) {
    const unsent = kitchenOn() ? Number(c.unsent) || 0 : 0;
    const fromGuest = Number(c.customer_pending) || 0;
    if (c.guest_call) return { text: c.guest_call === 'bill' ? 'Guest wants the bill' : 'Guest called a waiter', tone: 'warn' };
    if (fromGuest > 0) return { text: `${fromGuest} new from guest`, tone: 'warn' };
    switch (c.state) {
        case 'free':          return { text: c.kind === 'ticket' ? 'Start order' : 'Seat guests', tone: 'quiet' };
        case 'reserved':      return { text: 'Reserved', tone: 'quiet' };
        case 'cleaning':      return { text: 'Clear & reset', tone: 'quiet' };
        case 'seated':        return { text: 'Take the order', tone: 'warn' };
        case 'check_dropped': return { text: 'Collect payment', tone: 'warn' };
        default: break;
    }
    if (unsent > 0) return { text: `Send ${unsent} to kitchen`, tone: 'warn' };
    if (c.state === 'in_kitchen') return { text: cookWord(), tone: 'calm' };
    if (c.state === 'served') return { text: 'Offer the bill', tone: 'calm' };
    if (c.state === 'ordered') return { text: 'Ordered', tone: 'calm' };
    return { text: (STATES[c.state] || STATES.free).label, tone: 'calm' };
}

const titleOf = (p) => {
    const same = p.label && p.label.trim().toLowerCase() === String(p.code).trim().toLowerCase();
    return (!p.label || same) ? `Table ${p.code}` : p.label;
};

function ariaFor(c, money, alert) {
    return `${c.kind === 'ticket' ? `${c.order_type} ${c.code}` : titleOf(c)}, ${(STATES[c.state] || {}).label || ''}`
        + `${Number(c.order_total) ? `, ${money(Number(c.order_total))} due` : ''}`
        + `${alert ? `, waiting ${alert} minutes` : ''}`;
}

function Avatar({ server }) {
    if (!server) return null;
    return <span className="vqf-avatar" title={`Opened by ${server.name}`} aria-label={`Server ${server.name}`}>{server.initials}</span>;
}

function Badges({ c }) {
    const unsent = kitchenOn() ? Number(c.unsent) || 0 : 0;
    const fromGuest = Number(c.customer_pending) || 0;
    if (!unsent && !fromGuest && !c.guest_call) return null;
    return (
        <span className="vqf-badges">
            {c.guest_call && <span className="vqf-badge" data-tone="guest"><Bell size={10} aria-hidden="true" />{c.guest_call === 'bill' ? 'Bill' : 'Call'}</span>}
            {fromGuest > 0 && <span className="vqf-badge" data-tone="guest"><ShoppingBag size={10} aria-hidden="true" />{fromGuest} new</span>}
            {unsent > 0 && <span className="vqf-badge"><CircleDot size={10} aria-hidden="true" />{unsent} unsent</span>}
        </span>
    );
}

/* ── A TABLE AS A CARD (cards, sections, list) ───────────────────────── */
const TableCard = memo(function TableCard({ p, selected, onPick, money, variant, now, show, dim }) {
    const alert = alertAge(p, now);
    const due = Number(p.order_total) || 0;
    const busy = !!p.occupancy_id;
    const act = nextAction(p);
    const lvl = busy ? timerLevel(p, now) : 0;
    const showMoney = show.showMoney !== false;
    const showTime = show.showTime !== false;
    const showServer = show.showServer !== false;
    const title = titleOf(p);
    const named = title !== `Table ${p.code}`;

    return (
        <button type="button" onClick={() => onPick(p)} className="vqf-card" data-variant={variant}
                data-tone={toneOf(p)} data-busy={busy ? '1' : '0'} data-selected={selected ? '1' : '0'}
                data-alert={alert ? '1' : '0'} data-dim={dim ? '1' : '0'} aria-pressed={selected}
                aria-label={ariaFor(p, money, alert)}>
            <span className="vqf-rail" aria-hidden="true" />
            <span className="vqf-card-top">
                <span className="vqf-code vq-num">{p.code}</span>
                <span className="vqf-card-name">
                    <span className="vqf-name">{named ? title : (STATES[p.state] || STATES.free).label}</span>
                    <span className="vqf-meta">
                        <Users size={11} aria-hidden="true" />
                        <span className="vq-num">{busy ? `${p.covers || 1}/${p.capacity || 2}` : `${p.capacity || 2} seats`}</span>
                        {busy && showTime && (
                            <span className="vqf-timer" data-level={lvl}>
                                <Clock size={11} aria-hidden="true" />
                                <span className="vq-num">{elapsed(p.opened_at)}</span>
                            </span>
                        )}
                    </span>
                </span>
                {showServer && variant !== 'list' && <Avatar server={p.server} />}
            </span>
            <Badges c={p} />
            <span className="vqf-card-foot">
                <span className="vqf-act" data-tone={alert ? 'alert' : act.tone}>
                    {alert ? <AlertTriangle size={11} aria-hidden="true" /> : <span className="vqf-dot" aria-hidden="true" />}
                    {alert ? `${act.text} · ${alert}m` : act.text}
                </span>
                {showMoney && busy && due > 0 && <span className="vqf-due vq-num">{money(due)}</span>}
            </span>
        </button>
    );
});

/* ── A LANE TICKET (takeaway / delivery) ─────────────────────────────── */
const TicketCard = memo(function TicketCard({ t, selected, onPick, money, variant, now, onUpdateDelivery, dim }) {
    const alert = alertAge(t, now);
    const lateRun = isLate(t.delivery);
    const due = Number(t.order_total) || 0;
    const Icon = LANE_ICON[t.order_type] || ShoppingBag;
    const isDelivery = t.order_type === 'delivery';
    const same = t.customer_name && t.customer_name.trim().toLowerCase() === String(t.code).trim().toLowerCase();
    const title = (!t.customer_name || same) ? (isDelivery ? 'Delivery' : 'Takeaway') : t.customer_name;
    const act = nextAction(t);

    return (
        <button type="button" onClick={() => onPick(t)} className="vqf-card vqf-ticket" data-variant={variant}
                data-tone={toneOf(t)} data-busy="1" data-selected={selected ? '1' : '0'}
                data-alert={(alert || lateRun) ? '1' : '0'} data-dim={dim ? '1' : '0'} data-lane={t.order_type}
                aria-pressed={selected} aria-label={ariaFor(t, money, alert)}>
            <span className="vqf-rail" aria-hidden="true" />
            <span className="vqf-card-top">
                <span className="vqf-code vqf-code-lane vq-num"><Icon size={13} aria-hidden="true" />{t.code}</span>
                <span className="vqf-card-name">
                    <span className="vqf-name">{title}</span>
                    <span className="vqf-meta">
                        <Clock size={11} aria-hidden="true" />
                        <span className="vq-num">{elapsed(t.opened_at)}</span>
                        {t.phone && <><Phone size={11} aria-hidden="true" /><span className="vq-num">{t.phone}</span></>}
                    </span>
                </span>
                {variant !== 'list' && <Avatar server={t.server} />}
            </span>
            {isDelivery && variant !== 'list' && (t.address || t.delivery) && (
                <span className="vqf-ticket-run">
                    {t.address && <span className="vqf-addr">{t.address}</span>}
                    {t.delivery && <DeliveryChip delivery={t.delivery} compact />}
                    {t.delivery?.rider && <span className="vqf-addr">{t.delivery.rider}</span>}
                </span>
            )}
            <Badges c={t} />
            <span className="vqf-card-foot">
                {isDelivery && t.delivery && !['out', 'delivered'].includes(t.delivery.status) && onUpdateDelivery ? (
                    <span role="button" tabIndex={0} className="vqf-dispatch"
                          onClick={(e) => { e.stopPropagation(); onUpdateDelivery(t.occupancy_id, { status: 'out' }); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onUpdateDelivery(t.occupancy_id, { status: 'out' }); } }}>
                        <Bike size={11} aria-hidden="true" />Send out
                    </span>
                ) : (
                    <span className="vqf-act" data-tone={(alert || lateRun) ? 'alert' : act.tone}>
                        {(alert || lateRun) ? <AlertTriangle size={11} aria-hidden="true" /> : <span className="vqf-dot" aria-hidden="true" />}
                        {lateRun ? 'Running late' : alert ? `${act.text} · ${alert}m` : act.text}
                    </span>
                )}
                {due > 0 && <span className="vqf-due vq-num">{money(due)}</span>}
            </span>
        </button>
    );
});

/* ── SEATING CHART SQUARE ───────────────────────────────────────────── */
const SeatSquare = memo(function SeatSquare({ p, selected, onPick, money, now, show, dim }) {
    const alert = alertAge(p, now);
    const busy = !!p.occupancy_id;
    const due = Number(p.order_total) || 0;
    const badge = (kitchenOn() ? Number(p.unsent) || 0 : 0) + (Number(p.customer_pending) || 0) > 0 || !!p.guest_call;
    return (
        <button type="button" onClick={() => onPick(p)} className="vqf-seat" data-tone={toneOf(p)}
                data-selected={selected ? '1' : '0'} data-alert={alert ? '1' : '0'} data-dim={dim ? '1' : '0'}
                aria-pressed={selected} aria-label={ariaFor(p, money, alert)} title={titleOf(p)}>
            <span className="vqf-seat-code vq-num">{p.code}</span>
            <span className="vqf-seat-sub vq-num">
                {alert ? `${alert}m wait` : busy ? (show.showTime !== false ? elapsed(p.opened_at) : `${p.covers || 1} guests`) : `${p.capacity || 2} seats`}
            </span>
            {show.showMoney !== false && busy && due > 0 && <span className="vqf-seat-due vq-num">{money(due)}</span>}
            {badge && <span className="vqf-pip" aria-hidden="true" />}
        </button>
    );
});

/* ── THE ROOM MAP ───────────────────────────────────────────────────── */

/* Shape from size when the manager has not chosen one: two-tops are round,
   four-tops square, anything bigger a long table. */
export function shapeFor(p, saved) {
    if (saved?.shape) return saved.shape;
    const cap = Number(p.capacity) || 2;
    return cap <= 2 ? 'round' : cap <= 4 ? 'square' : 'long';
}

function scaleFor(cap) {
    return cap <= 2 ? 0.82 : cap <= 4 ? 1 : cap <= 6 ? 1.08 : cap <= 8 ? 1.18 : 1.28;
}

/* Chairs around a table, as % of the table's footprint. */
function chairsFor(shape, n, rot) {
    n = Math.max(1, Math.min(14, n));
    const out = [];
    if (shape === 'round') {
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2;
            out.push({ x: 50 + 44 * Math.cos(a), y: 50 + 44 * Math.sin(a), a: (a * 180) / Math.PI + 90 });
        }
        return out;
    }
    const sides = { top: 0, bottom: 0, left: 0, right: 0 };
    if (shape === 'square') {
        const order = ['top', 'bottom', 'left', 'right'];
        for (let i = 0; i < n; i++) sides[order[i % 4]]++;
    } else {
        const ends = n >= 5 ? 2 : 0;
        sides.left = ends / 2; sides.right = ends / 2;
        sides.top = Math.ceil((n - ends) / 2); sides.bottom = n - ends - sides.top;
    }
    const along = (k, m) => 18 + 64 * ((k + 1) / (m + 1));
    for (let k = 0; k < sides.top; k++) out.push({ x: along(k, sides.top), y: 7, a: 0 });
    for (let k = 0; k < sides.bottom; k++) out.push({ x: along(k, sides.bottom), y: 93, a: 180 });
    for (let k = 0; k < sides.left; k++) out.push({ x: 7, y: along(k, sides.left), a: 270 });
    for (let k = 0; k < sides.right; k++) out.push({ x: 93, y: along(k, sides.right), a: 90 });
    return rot === 90 ? out.map(c => ({ x: 100 - c.y, y: c.x, a: c.a + 90 })) : out;
}

function roomGrid(n) {
    const cols = n <= 2 ? 2 : Math.max(2, Math.min(8, Math.round(Math.sqrt(n * 2.2))));
    const rows = Math.max(1, Math.ceil(n / cols));
    return { cols, rows };
}

const MapTable = memo(function MapTable({
    p, x, y, shape, rot, selected, onPick, money, now, show, dim, arranging, picked, onDragStart,
}) {
    const alert = alertAge(p, now);
    const busy = !!p.occupancy_id;
    const due = Number(p.order_total) || 0;
    const cap = Number(p.capacity) || 2;
    const covers = busy ? Math.min(cap, Number(p.covers) || 1) : 0;
    const chairs = useMemo(() => chairsFor(shape, cap, rot), [shape, cap, rot]);
    const long = shape === 'long';
    const wide = long && rot !== 90;
    const tall = long && rot === 90;
    const lvl = busy ? timerLevel(p, now) : 0;
    const badge = (kitchenOn() ? Number(p.unsent) || 0 : 0) + (Number(p.customer_pending) || 0) > 0 || !!p.guest_call;

    return (
        <button type="button" className="vqf-mt" data-shape={shape} data-tone={toneOf(p)}
                data-selected={selected ? '1' : '0'} data-alert={alert ? '1' : '0'} data-dim={dim ? '1' : '0'}
                data-arranging={arranging ? '1' : '0'} data-picked={picked ? '1' : '0'}
                data-id={p.id}
                style={{
                    left: `${x * 100}%`, top: `${y * 100}%`,
                    '--s': scaleFor(cap), '--w': wide ? 1.62 : 1, '--h': tall ? 1.62 : 1,
                }}
                onClick={arranging ? undefined : () => onPick(p)}
                onPointerDown={arranging ? (e) => onDragStart(e, p.id) : undefined}
                aria-pressed={selected} aria-label={ariaFor(p, money, alert)}>
            {chairs.map((c, i) => (
                <span key={i} className="vqf-chair" data-on={i < covers ? '1' : '0'}
                      style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `translate(-50%,-50%) rotate(${c.a}deg)` }} />
            ))}
            <span className="vqf-top">
                <span className="vqf-top-code vq-num">{p.code}</span>
                <span className="vqf-top-sub vq-num" data-level={alert ? 3 : lvl}>
                    {alert ? `${alert}m` : busy ? (show.showTime !== false ? elapsed(p.opened_at) : `${covers}/${cap}`) : `${cap}`}
                </span>
                {show.showServer !== false && p.server && <span className="vqf-top-srv">{p.server.initials}</span>}
                {badge && <span className="vqf-pip" aria-hidden="true" />}
            </span>
            {show.showMoney !== false && busy && due > 0 && <span className="vqf-tag vq-num">{money(due)}</span>}
        </button>
    );
});

/* Pack the room to its tables. Tables keep their arrangement, but empty margins and
   empty rows are trimmed, and (in compact spacing) the gaps between tables close up
   until they are about to touch. All maths is in pixels so nothing can overlap. */
const COMPACT_MIN = 0.45;
function packRoom(sorted, layout, W, H0, cols, rows, spacing) {
    const u = Math.min(W / cols, (H0 / rows) * 1.05, 190);
    const pts = sorted.map((p, i) => {
        const saved = layout[p.id];
        const shape = shapeFor(p, saved);
        const long = shape === 'long';
        const rot = saved?.rot || 0;
        const k = u * 0.66 * scaleFor(Number(p.capacity) || 2);
        const w = Math.max(long && rot !== 90 ? 87 : 54, k * (long && rot !== 90 ? 1.62 : 1));
        const h = Math.max(long && rot === 90 ? 87 : 54, k * (long && rot === 90 ? 1.62 : 1));
        const x = (saved ? saved.x : ((i % cols) + 0.5) / cols) * W;
        const y = (saved ? saved.y : (Math.floor(i / cols) + 0.5) / rows) * H0;
        return { id: p.id, x, y, w, h };
    });
    if (!pts.length) return null;
    const GX = 28, GY = 40; /* chairs + the amount tag under a table */
    const clash = (fx, fy, cx, cy) => {
        for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
            const A = pts[a], B = pts[b];
            const dx = Math.abs(A.x - B.x) * fx, dy = Math.abs(A.y - B.y) * fy;
            if (dx < (A.w + B.w) / 2 + GX && dy < (A.h + B.h) / 2 + GY) return true;
        }
        return false;
    };
    const minx = Math.min(...pts.map(t => t.x)), maxx = Math.max(...pts.map(t => t.x));
    const miny = Math.min(...pts.map(t => t.y)), maxy = Math.max(...pts.map(t => t.y));
    const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
    /* Each axis closes up on its own: pick the tightest pair of factors that still leaves every table clear. */
    let fx = 1, fy = 1;
    if (spacing === 'compact') {
        let best = null;
        for (let a = COMPACT_MIN; a <= 1.0001; a += 0.05) for (let b = COMPACT_MIN; b <= 1.0001; b += 0.05) {
            if ((!best || a * b < best.a * best.b) && !clash(a, b, cx, cy)) best = { a, b };
        }
        if (best) { fx = best.a; fy = best.b; }
    }
    const sp = pts.map(t => ({ ...t, x: cx + (t.x - cx) * fx, y: cy + (t.y - cy) * fy }));
    const L = Math.min(...sp.map(t => t.x - t.w / 2 - 14)), R = Math.max(...sp.map(t => t.x + t.w / 2 + 14));
    const T = Math.min(...sp.map(t => t.y - t.h / 2 - 16)), B = Math.max(...sp.map(t => t.y + t.h / 2 + 34));
    const H = Math.max(150, Math.min(H0, B - T));
    const sx = W / 2 - (L + R) / 2;
    const out = {};
    sp.forEach(t => { out[t.id] = { x: (t.x + sx) / W, y: (t.y - T) / H }; });
    return { pos: out, height: H, rows: rows * (H / H0) };
}

function Room({
    title, tables, layout, selectedId, onPick, money, now, show, dimOf, arranging, pickedId,
    onDragStart, showTitle, spacing = 'compact',
}) {
    const sorted = useMemo(() => [...tables].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        || String(a.code).localeCompare(String(b.code), undefined, { numeric: true })), [tables]);
    const { cols, rows } = roomGrid(sorted.length);
    const busy = sorted.filter(t => t.occupancy_id).length;
    const ar = (rows * 0.92 + 0.12) / cols;
    const ref = useRef(null);
    const [W, setW] = useState(0);
    useEffect(() => {
        const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return undefined;
        const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
        ro.observe(el); return () => ro.disconnect();
    }, []);
    const packed = useMemo(() => {
        if (arranging || !W) return null;
        const H0 = Math.max(180, Math.min((W - 24) * ar, rows * 190 + 24));
        return packRoom(sorted, layout, W, H0, cols, rows, spacing);
    }, [arranging, W, sorted, layout, cols, rows, ar, spacing]);
    return (
        <div className="vqf-room-wrap">
            {showTitle && (
                <div className="vqf-room-h">
                    <span>{title}</span>
                    <span className="vq-num">{busy}/{sorted.length} in use</span>
                </div>
            )}
            <div ref={ref} className="vqf-room" data-arranging={arranging ? '1' : '0'} data-packed={packed ? '1' : '0'}
                 style={{ '--cols': cols, '--rows': packed ? packed.rows : rows, '--ar': ar,
                          ...(packed ? { height: `${Math.round(packed.height)}px`, minHeight: 0 } : null) }}>
                {sorted.map((p, i) => {
                    const saved = layout[p.id];
                    const ax = ((i % cols) + 0.5) / cols;
                    const ay = (Math.floor(i / cols) + 0.5) / rows;
                    const at = packed?.pos[p.id];
                    return (
                        <MapTable key={p.id} p={p}
                                  x={at ? at.x : saved ? saved.x : ax} y={at ? at.y : saved ? saved.y : ay}
                                  shape={shapeFor(p, saved)} rot={saved?.rot || 0}
                                  selected={p.id === selectedId} onPick={onPick} money={money} now={now}
                                  show={show} dim={dimOf(p)} arranging={arranging}
                                  picked={pickedId === p.id} onDragStart={onDragStart} />
                    );
                })}
            </div>
        </div>
    );
}

/* ── VIEW + FILTER DEFINITIONS ───────────────────────────────────────── */
const VIEWS = [
    { id: 'map', label: 'Room map', icon: MapIcon },
    { id: 'cards', label: 'Smart cards', icon: LayoutGrid },
    { id: 'sections', label: 'By area', icon: Rows3 },
    { id: 'grid', label: 'Seating chart', icon: Grid3x3 },
    { id: 'list', label: 'List', icon: List },
];
const LEGEND = [
    ['free', 'Free'], ['seated', 'Seated'], ['ordered', 'Ordered'], ['kitchen', 'Kitchen'],
    ['served', 'Served'], ['check', 'Paying'], ['reserved', 'Reserved'],
];

export default function FloorPane({
    positions = [],
    tabs = [],
    zone = 'all',
    setZone,
    counts,
    selectedId,
    onPick,
    onNewTicket,
    onUpdateDelivery,
    onSetup,
    onRefresh,
    money,
    /* 'map' | 'list' — the engine's width decision */
    variant = 'map',
    view = 'cards',
    setView,
    sort = 'attention',
    size = 'normal',
    show = {},
    embedded = false,
    title = 'Floor',
    storeSlug = null,
    /* Room drawing: { tables: { id: {x,y,shape,rot} } } */
    floorMap = null,
    onSaveFloorMap,
    canArrange = false,
    now = Date.now(),
}) {
    const tt = useTermText();
    const [showReservations, setShowReservations] = useState(false);
    /* No filter chips: the floor is one picture of the room. */
    const filter = 'all';

    /* Stable callbacks, so memoised cards only repaint when their table did. */
    const pickRef = useRef(onPick); pickRef.current = onPick;
    const moneyRef = useRef(money); moneyRef.current = money;
    const pick = useCallback((c) => pickRef.current?.(c), []);
    const fmt = useCallback((n) => moneyRef.current?.(n) ?? String(n), []);
    const showKey = `${show.showMoney !== false}${show.showTime !== false}${show.showServer !== false}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const showStable = useMemo(() => show, [showKey]);

    /* ── effective view ─────────────────────────────────────────────── */
    const narrow = variant === 'list';
    let eff = view;
    if (narrow && (view === 'cards' || view === 'sections')) eff = 'list';
    if (narrow && view === 'map') eff = 'grid';
    const laneTab = tabs.find(t => t.id === zone && t.kind === 'lane');
    if (laneTab && (eff === 'map' || eff === 'grid')) eff = narrow ? 'list' : 'cards';

    const passes = useCallback(() => true, []);

    /* ── order ──────────────────────────────────────────────────────── */
    const ordered = useMemo(() => {
        const rank = (c) => {
            if (alertAge(c, now)) return 0;
            if ((Number(c.unsent) || 0) + (Number(c.customer_pending) || 0) > 0) return 1;
            if (c.occupancy_id) return 2;
            if (c.state === 'cleaning') return 3;
            if (c.state === 'reserved') return 4;
            return 5;
        };
        const byNumber = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            || String(a.code).localeCompare(String(b.code), undefined, { numeric: true });
        if (sort === 'number') {
            return [...positions].sort((a, b) => ((a.kind === 'ticket' ? 0 : 1) - (b.kind === 'ticket' ? 0 : 1)) || byNumber(a, b));
        }
        return [...positions].sort((a, b) => {
            const ra = rank(a); const rb = rank(b);
            if (ra !== rb) return ra - rb;
            if (ra === 0) return alertAge(b, now) - alertAge(a, now);
            return byNumber(a, b);
        });
    }, [positions, now, sort]);

    const shown = useMemo(() => (filter === 'all' ? ordered : ordered.filter(passes)), [ordered, filter, passes]);

    const sections = useMemo(() => {
        if (eff !== 'sections') return null;
        const out = new Map();
        for (const c of shown) {
            const key = c.kind === 'ticket' ? (c.order_type === 'delivery' ? 'Delivery' : 'Takeaway') : (c.zone || 'Tables');
            if (!out.has(key)) out.set(key, []);
            out.get(key).push(c);
        }
        return [...out.entries()];
    }, [shown, eff]);

    /* ── room map: rooms per area + the lane rail ──────────────────── */
    const zoneOrder = useMemo(() => tabs.filter(t => t.kind !== 'lane').map(t => t.id), [tabs]);
    const rooms = useMemo(() => {
        if (eff !== 'map') return null;
        const out = new Map();
        for (const c of positions) {
            if (c.kind === 'ticket') continue;
            const key = c.zone || 'Tables';
            if (!out.has(key)) out.set(key, []);
            out.get(key).push(c);
        }
        return [...out.entries()].sort((a, b) => {
            const ia = zoneOrder.indexOf(a[0]); const ib = zoneOrder.indexOf(b[0]);
            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
        });
    }, [positions, eff, zoneOrder]);
    const laneRail = useMemo(() => (eff === 'map' ? ordered.filter(c => c.kind === 'ticket') : []), [ordered, eff]);

    /* ── ARRANGE MODE ──────────────────────────────────────────────── */
    const [arranging, setArranging] = useState(false);
    const [spacing, setSpacingState] = useState(() => { try { return localStorage.getItem('foh_floor_spacing') || 'compact'; } catch { return 'compact'; } });
    const toggleSpacing = () => setSpacingState((v) => { const n = v === 'compact' ? 'roomy' : 'compact'; try { localStorage.setItem('foh_floor_spacing', n); } catch { /* private mode */ } return n; });
    const [layout, setLayout] = useState(() => floorMap?.tables || {});
    const [pickedId, setPickedId] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const dirty = useRef(false);
    const saveTimer = useRef(null);
    const layoutRef = useRef(layout); layoutRef.current = layout;

    useEffect(() => {
        if (!dirty.current) setLayout(floorMap?.tables || {});
    }, [floorMap]);

    const flushSave = useCallback(() => {
        clearTimeout(saveTimer.current);
        if (!dirty.current || !onSaveFloorMap) return;
        setSaveState('saving');
        Promise.resolve(onSaveFloorMap(layoutRef.current))
            .then(() => { dirty.current = false; setSaveState('saved'); })
            .catch(() => setSaveState('error'));
    }, [onSaveFloorMap]);

    const commit = useCallback((updater) => {
        setLayout(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            layoutRef.current = next;
            return next;
        });
        dirty.current = true;
        setSaveState('pending');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(flushSave, 700);
    }, [flushSave]);

    useEffect(() => () => { clearTimeout(saveTimer.current); }, []);
    useEffect(() => { if (eff !== 'map' && arranging) { setArranging(false); flushSave(); } }, [eff, arranging, flushSave]);

    const posOf = useCallback((id) => {
        const el = document.querySelector(`.vqf-mt[data-id="${CSS.escape(String(id))}"]`);
        if (!el) return null;
        return { x: parseFloat(el.style.left) / 100, y: parseFloat(el.style.top) / 100 };
    }, []);

    const drag = useRef(null);
    const SNAP = 0.025;
    const clamp = (v) => Math.min(0.97, Math.max(0.03, v));
    const snap = (v) => clamp(Math.round(v / SNAP) * SNAP);

    const onDragStart = useCallback((e, id) => {
        if (e.button !== undefined && e.button !== 0) return;
        const el = e.currentTarget;
        const room = el.closest('.vqf-room');
        if (!room) return;
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        drag.current = {
            id, el, rect: room.getBoundingClientRect(), sx: e.clientX, sy: e.clientY,
            ox: parseFloat(el.style.left) / 100, oy: parseFloat(el.style.top) / 100, moved: false, nx: null, ny: null,
        };
        const move = (ev) => {
            const d = drag.current; if (!d) return;
            const dx = (ev.clientX - d.sx) / d.rect.width;
            const dy = (ev.clientY - d.sy) / d.rect.height;
            if (!d.moved && Math.abs(ev.clientX - d.sx) + Math.abs(ev.clientY - d.sy) < 4) return;
            d.moved = true;
            d.nx = snap(d.ox + dx); d.ny = snap(d.oy + dy);
            d.el.style.left = `${d.nx * 100}%`; d.el.style.top = `${d.ny * 100}%`;
            d.el.dataset.dragging = '1';
        };
        const up = () => {
            const d = drag.current; drag.current = null;
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
            if (!d) return;
            delete d.el.dataset.dragging;
            setPickedId(d.id);
            if (d.moved && d.nx != null) {
                commit(prev => ({ ...prev, [d.id]: { ...(prev[d.id] || {}), x: d.nx, y: d.ny, shape: prev[d.id]?.shape ?? null, rot: prev[d.id]?.rot ?? 0 } }));
            }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
    }, [commit]);

    const pickedTable = pickedId ? positions.find(p => p.id === pickedId) : null;
    const editPicked = (patch) => {
        if (!pickedTable) return;
        const here = layout[pickedId] || posOf(pickedId) || { x: 0.5, y: 0.5 };
        commit(prev => ({ ...prev, [pickedId]: { x: here.x, y: here.y, shape: shapeFor(pickedTable, prev[pickedId]), rot: prev[pickedId]?.rot || 0, ...patch } }));
    };
    const resetArea = () => {
        const ids = new Set(positions.filter(p => p.kind !== 'ticket').map(p => String(p.id)));
        commit(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => !ids.has(String(k)))));
        setPickedId(null);
    };

    /* Arrow keys nudge the picked table — exact placement without a mouse. */
    useEffect(() => {
        if (!arranging || !pickedId) return undefined;
        const onKey = (e) => {
            const map = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (e.key === 'Escape') { setPickedId(null); return; }
            const d = map[e.key]; if (!d) return;
            e.preventDefault(); e.stopPropagation();
            const here = layoutRef.current[pickedId] || posOf(pickedId); if (!here) return;
            editPicked({ x: snap(here.x + d[0] * SNAP), y: snap(here.y + d[1] * SNAP) });
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    });

    const finishArrange = () => { setArranging(false); setPickedId(null); flushSave(); };

    /* ── lanes ─────────────────────────────────────────────────────── */
    const zoneTabs = useMemo(() => tabs.filter(t => t.kind !== 'lane'), [tabs]);
    const takeawayTab = tabs.find(t => t.id === 'takeaway');
    const deliveryTab = tabs.find(t => t.id === 'delivery');
    const laneBtn = (tab, kind, Icon, label) => {
        if (tab === undefined) return null;
        const n = tab ? (tab.count || 0) : (counts?.[`${kind}Count`] || 0);
        return (
            <span className="vqf-lane" data-on={zone === kind ? '1' : '0'} data-kind={kind}>
                {n > 0 && (
                    <button type="button" className="vqf-lane-filter" onClick={() => setZone(zone === kind ? 'all' : kind)}
                            title={zone === kind ? `Showing ${label.toLowerCase()} (tap to show all)` : `Show ${label.toLowerCase()} orders`}>
                        <Icon size={13} aria-hidden="true" /><span>{label}</span><b className="vq-num">{n}</b>
                    </button>
                )}
                <button type="button" className="vqf-lane-add" onClick={() => onNewTicket?.(kind)}
                        title={`New ${label.toLowerCase()} order`} aria-label={`New ${label.toLowerCase()} order`}>
                    {n > 0 ? <Plus size={14} strokeWidth={2.5} /> : <><Icon size={13} aria-hidden="true" /><span>{label}</span><Plus size={13} strokeWidth={2.5} /></>}
                </button>
            </span>
        );
    };

    const dimOf = useCallback((c) => filter !== 'all' && !passes(c), [filter, passes]);
    const cardVariant = eff === 'list' ? 'list' : 'card';

    const renderCard = (c) => (c.kind === 'ticket'
        ? <TicketCard key={c.id} t={c} variant={eff === 'grid' ? 'list' : cardVariant} now={now} selected={c.id === selectedId}
                      onPick={pick} money={fmt} onUpdateDelivery={onUpdateDelivery} />
        : eff === 'grid'
            ? <SeatSquare key={c.id} p={c} now={now} show={showStable} selected={c.id === selectedId} onPick={pick} money={fmt} />
            : <TableCard key={c.id} p={c} variant={cardVariant} now={now} show={showStable}
                         selected={c.id === selectedId} onPick={pick} money={fmt} />);

    return (
        <section className={`vqf ${embedded ? 'vqf-embedded' : 'vq-pane bg-surface border border-line/80 shadow-md'}`}
                 data-pane="floor" data-view={eff}>
            {/* ── HEADER ─────────────────────────────────────────────── */}
            <header className="vqf-head vq-pane-fixed">
                <span className="vqf-title">
                    <span className="vqf-live" aria-hidden="true" />
                    {title}
                </span>
                {setView && (
                    <span className="vqf-views" role="radiogroup" aria-label="Floor view">
                        {VIEWS.map(v => {
                            const Icon = v.icon;
                            const off = narrow && (v.id === 'cards' || v.id === 'sections' || v.id === 'map');
                            return (
                                <button key={v.id} type="button" role="radio" aria-checked={view === v.id}
                                        data-on={eff === v.id ? '1' : '0'} disabled={off}
                                        title={off ? `${v.label} needs a wider column` : v.label} aria-label={v.label}
                                        onClick={() => setView(v.id)}>
                                    <Icon size={15} aria-hidden="true" />
                                </button>
                            );
                        })}
                    </span>
                )}
                <button type="button" className="vqf-hbtn" onClick={() => setShowReservations(true)} title="Bookings and waitlist">
                    <Calendar size={15} aria-hidden="true" /><span>Bookings</span>
                </button>
                {eff === 'map' && !arranging && (
                    <button type="button" className="vqf-hbtn" onClick={toggleSpacing} aria-pressed={spacing === 'compact'}
                            title={spacing === 'compact' ? 'Tables are packed close. Tap to spread them out.' : 'Tables are spread out. Tap to pack them close.'}>
                        {spacing === 'compact' ? <Expand size={14} aria-hidden="true" /> : <Shrink size={14} aria-hidden="true" />}<span>{spacing === 'compact' ? 'Spread out' : 'Pack closer'}</span>
                    </button>
                )}
                {canArrange && storeSlug && !arranging && (
                    <a className="vqf-hbtn" href={route('store.tables.plan', { store_slug: storeSlug })} target="_blank" rel="noreferrer" title="Add, remove or rename tables and areas">
                        <Pencil size={14} aria-hidden="true" /><span>Update floor</span>
                    </a>
                )}
                {eff === 'map' && canArrange && onSaveFloorMap && !arranging && (
                    <button type="button" className="vqf-hbtn" onClick={() => setArranging(true)} title="Move tables to match your room">
                        <Move size={14} aria-hidden="true" /><span>Arrange</span>
                    </button>
                )}
            </header>

            {/* ── AREAS + LANES ──────────────────────────────────────── */}
            <div className="vqf-bar vq-pane-fixed">
                <div className="vqf-zones" role="tablist" aria-label="Areas">
                    <button type="button" role="tab" aria-selected={zone === 'all'} data-on={zone === 'all' ? '1' : '0'}
                            onClick={() => setZone('all')}>All areas</button>
                    {zoneTabs.map(t => (
                        <button key={t.id} type="button" role="tab" aria-selected={zone === t.id}
                                data-on={zone === t.id ? '1' : '0'} onClick={() => setZone(t.id)}>{t.label}</button>
                    ))}
                </div>
                <div className="vqf-lanes">
                    {laneBtn(takeawayTab, 'takeaway', ShoppingBag, 'Takeaway')}
                    {laneBtn(deliveryTab, 'delivery', Bike, 'Delivery')}
                </div>
            </div>

            {/* ── FILTERS / ARRANGE BAR ──────────────────────────────── */}
            {arranging ? (
                <div className="vqf-arrange vq-pane-fixed" role="toolbar" aria-label="Arrange tables">
                    <Hand size={14} aria-hidden="true" />
                    <span className="vqf-arrange-hint">
                        {pickedTable ? <>Table <b>{pickedTable.code}</b> — drag it, or use the arrow keys</> : 'Drag a table to where it stands in your room'}
                    </span>
                    {pickedTable && (
                        <span className="vqf-seg" role="radiogroup" aria-label="Table shape">
                            {[['round', Circle, 'Round'], ['square', Square, 'Square'], ['long', RectangleHorizontal, 'Long']].map(([s, Icon, label]) => (
                                <button key={s} type="button" role="radio" aria-checked={shapeFor(pickedTable, layout[pickedId]) === s}
                                        data-on={shapeFor(pickedTable, layout[pickedId]) === s ? '1' : '0'} title={label} aria-label={label}
                                        onClick={() => editPicked({ shape: s })}>
                                    <Icon size={14} aria-hidden="true" />
                                </button>
                            ))}
                            <button type="button" title="Turn" aria-label="Turn table" disabled={shapeFor(pickedTable, layout[pickedId]) !== 'long'}
                                    onClick={() => editPicked({ rot: (layout[pickedId]?.rot || 0) === 90 ? 0 : 90 })}>
                                <RotateCw size={14} aria-hidden="true" />
                            </button>
                        </span>
                    )}
                    <span className="vqf-save" data-state={saveState}>
                        {saveState === 'saving' || saveState === 'pending' ? <><Loader2 size={12} className="animate-spin" aria-hidden="true" />Saving</>
                            : saveState === 'error' ? 'Not saved' : saveState === 'saved' ? <><Check size={12} aria-hidden="true" />Saved</> : null}
                    </span>
                    <button type="button" className="vqf-hbtn" onClick={resetArea} title="Put tables back in a tidy grid">
                        <Undo2 size={14} aria-hidden="true" /><span>Tidy</span>
                    </button>
                    <button type="button" className="vqf-hbtn vqf-hbtn-primary" onClick={finishArrange}>
                        <Check size={14} aria-hidden="true" /><span>Done</span>
                    </button>
                </div>
            ) : null}

            {/* ── BODY ───────────────────────────────────────────────── */}
            <div className="vq-pane-body vqf-body" data-view={eff} data-size={size}>
                {laneTab && (
                    <button type="button" className="vqf-new" onClick={() => onNewTicket?.(zone)}>
                        <Plus size={16} aria-hidden="true" />New {laneTab.label.toLowerCase()} order
                    </button>
                )}

                {eff === 'map' && rooms && (
                    <>
                        {laneRail.length > 0 && !arranging && (
                            <div className="vqf-rail-strip" aria-label="Takeaway and delivery">
                                {laneRail.map(c => (
                                    <TicketCard key={c.id} t={c} variant="list" now={now} selected={c.id === selectedId}
                                                onPick={pick} money={fmt} dim={dimOf(c)} />
                                ))}
                            </div>
                        )}
                        {rooms.map(([z, list]) => (
                            <Room key={z} title={z} tables={list} layout={layout} selectedId={selectedId}
                                  onPick={pick} money={fmt} now={now} show={showStable} dimOf={dimOf}
                                  arranging={arranging} pickedId={pickedId} onDragStart={onDragStart}
                                  showTitle={rooms.length > 1 || zone === 'all'} spacing={spacing} />
                        ))}
                        {!arranging && rooms.length > 0 && (
                            <div className="vqf-legend" aria-hidden="true">
                                {LEGEND.map(([tone, label]) => <span key={tone} data-tone={tone}><i />{tone === 'kitchen' ? (kitchenOn() ? 'Kitchen' : 'Preparing') : label}</span>)}
                                <span data-tone="alert"><i />Needs you</span>
                            </div>
                        )}
                    </>
                )}

                {eff !== 'map' && (
                    <div className="vqf-grid" data-view={eff} data-size={size}>
                        {(sections || [[null, shown]]).map(([sec, cards]) => (
                            <React.Fragment key={sec || 'all'}>
                                {sec && (
                                    <div className="vqf-sec-h">
                                        <span>{sec}</span>
                                        <span className="vq-num">{cards.filter(c => c.occupancy_id).length} busy · {cards.length}</span>
                                    </div>
                                )}
                                {cards.map(renderCard)}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {positions.length === 0 && (
                    <div className="vqf-empty">
                        <span className="vqf-empty-ic"><Plus size={24} strokeWidth={2} /></span>
                        <p className="vqf-empty-t">
                            {laneTab ? `No ${laneTab.label.toLowerCase()} orders open` : tt('No tables in this area')}
                        </p>
                        {laneTab ? (
                            <p className="vqf-empty-d">Start one above.</p>
                        ) : (
                            <>
                                <p className="vqf-empty-d">{tt('Tables come from the floor plan. Build it once and this fills in.')}</p>
                                <button type="button" className="vqf-new" onClick={onSetup}>
                                    <Plus size={16} strokeWidth={2.5} aria-hidden="true" />Set up the floor plan
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showReservations && (
                <ReservationModal storeSlug={storeSlug} positions={positions} onRefresh={onRefresh}
                                  onClose={() => setShowReservations(false)} />
            )}
        </section>
    );
}

