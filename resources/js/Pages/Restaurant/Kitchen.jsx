/* ==========================================================================
   THE KITCHEN DISPLAY
   ==========================================================================
   What this screen is for, in one sentence: a cook standing two metres away
   has to be able to see which ticket is oldest without walking over.

   Everything below follows from that. Tickets are ordered by age, not by
   table. The elapsed clock is the largest thing on a ticket after the food.
   Age is a colour as well as a number, because a number has to be read and a
   colour does not. And the whole board re-reads itself every ten seconds --
   the previous version was static until somebody clicked, which on a wall
   screen with nobody near it means it was never right.

   `time_elapsed_mins` is deliberately NOT used for the clock: it is a stored
   integer nothing increments, so it froze at whatever it was when the ticket
   was written. The clock counts from `fired_at`, which is a fact.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ChefHat, Clock, Check, Undo2, Utensils, ShoppingBag, Bike,
    LayoutGrid, RefreshCcw, WifiOff, Printer, XCircle, X, BarChart3,
} from 'lucide-react';
import { KitchenPrintService } from '@/Utils/KitchenPrintService';
import '@/Pos/Table/kds.css';

const POLL_MS = 10000;
const TICK_MS = 1000;
const LS_STATION = 'kds_station';

/* The ladder a ticket climbs. Bump moves it forward, recall moves it back. */
const FLOW = ['pending', 'preparing', 'ready', 'served'];
const NEXT_LABEL = { pending: 'Start', preparing: 'Ready', ready: 'Served', served: 'Done' };

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };

/* Age bands. Chosen to be about a kitchen, not about a colour scale: under
   five minutes is normal, ten is the point a waiter starts being asked, and
   past twenty something has gone wrong and the ticket should be the loudest
   thing on the wall. */
const ageBand = (mins) => (mins >= 20 ? 'late' : mins >= 10 ? 'slow' : mins >= 5 ? 'on' : 'new');

function minutesSince(iso) {
    if (!iso) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function clock(iso) {
    if (!iso) return '—';
    const total = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        return `${h}h ${String(m % 60).padStart(2, '0')}m`;
    }
    return `${m}:${String(sec).padStart(2, '0')}`;
}

function Ticket({ order, onBump, onRecall, onReprint, busy }) {
    const mins = minutesSince(order.fired_at || order.created_at);
    const band = order.status === 'served' ? 'done' : ageBand(mins);
    const Icon = TYPE_ICON[order.order_type] || Utensils;
    const idx = FLOW.indexOf(order.status);
    const canBump = idx >= 0 && idx < FLOW.length - 1;
    const canRecall = idx > 0;
    const orderType = order.order_type || 'dine_in';
    const orderTypeLabel = orderType.replace('_', ' ');

    return (
        <article className="kds-ticket" data-band={band} data-status={order.status}>
            <header className="kds-ticket-h">
                <span className="kds-ticket-where">
                    <Icon size={14} aria-hidden="true" />
                    <b>{order.position_code || order.table_number || order.order_number}</b>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            marginLeft: '6px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: orderType === 'takeaway' ? '#c2410c' : orderType === 'delivery' ? '#1d4ed8' : '#047857',
                            color: '#ffffff',
                        }}
                    >
                        {orderTypeLabel}
                    </span>
                </span>
                {order.course > 1 && (
                    <span className="kds-course">Course {order.course}</span>
                )}
                <span className="kds-clock vq-num" title={`Fired ${order.fired_at || order.created_at}`}>
                    <Clock size={13} aria-hidden="true" />
                    {clock(order.fired_at || order.created_at)}
                </span>
            </header>

            <ul className="kds-items">
                {(order.items || []).map((it, i) => (
                    <li key={i} className="kds-item">
                        <span className="kds-qty vq-num">{it.qty || 1}</span>
                        <span className="kds-item-body">
                            <span className="kds-item-name">{it.name}</span>
                            {Array.isArray(it.mods) && it.mods.length > 0 && (
                                <span className="kds-item-mods">
                                    {it.mods.map(m => m.name).join(' · ')}
                                </span>
                            )}
                            {Array.isArray(it.modifiers) && it.modifiers.length > 0 && (
                                <span className="kds-item-mods">{it.modifiers.join(' · ')}</span>
                            )}
                            {it.notes && <span className="kds-item-note">"{it.notes}"</span>}
                        </span>
                    </li>
                ))}
                {(order.items || []).length === 0 && (
                    <li className="kds-item kds-item-empty">Ticket has no items</li>
                )}
            </ul>

            <footer className="kds-ticket-f">
                {canRecall && (
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => onRecall(order.id)}
                        disabled={busy}
                        title="Put this ticket back a step"
                    >
                        <Undo2 size={15} aria-hidden="true" />
                    </button>
                )}
                <button
                    type="button"
                    className="kds-btn"
                    onClick={() => onReprint?.(order)}
                    disabled={busy}
                    title="Reprint KOT docket"
                >
                    <Printer size={15} aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="kds-btn kds-btn-go"
                    onClick={() => onBump(order.id)}
                    disabled={busy || !canBump}
                >
                    <Check size={16} aria-hidden="true" />
                    {NEXT_LABEL[order.status] || 'Done'}
                </button>
            </footer>
        </article>
    );
}

/* ── 86 list modal ──────────────────────────────────────────────────────── */

function EightySixModal({ orders, eightySixIds, onToggle, onClose }) {
    /* Collect all unique items that have appeared in any ticket. The kitchen
       needs to be able to 86 items that are in open tickets; not just a
       static product list. */
    const items = useMemo(() => {
        const seen = new Map();
        for (const order of orders) {
            for (const it of (order.items || [])) {
                if (it.product_id && !seen.has(it.product_id)) {
                    seen.set(it.product_id, it.name);
                }
            }
        }
        return [...seen.entries()].map(([id, name]) => ({ id, name }));
    }, [orders]);

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999,
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#1c1c1e', borderRadius: '12px', padding: '24px',
                    minWidth: '340px', maxWidth: '480px', width: '90%',
                    maxHeight: '80vh', overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                        <XCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle', color: '#ef4444' }} aria-hidden="true" />
                        86 List — Unavailable Items
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: 4 }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {items.length === 0 && (
                    <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                        No items seen in current tickets. Items appear here once they appear on a KOT.
                    </p>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map(({ id, name }) => {
                        const is86 = eightySixIds.includes(id);
                        return (
                            <li key={id}>
                                <button
                                    type="button"
                                    onClick={() => onToggle(id)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: `2px solid ${is86 ? '#ef4444' : '#3f3f46'}`,
                                        background: is86 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                                        color: is86 ? '#fca5a5' : '#d4d4d8',
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontWeight: is86 ? 600 : 400,
                                        textDecoration: is86 ? 'line-through' : 'none',
                                    }}
                                >
                                    {name}
                                    {is86 && (
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em' }}>
                                            86'd
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function KitchenPerformanceModal({ storeSlug, onClose }) {
    const [days, setDays] = useState(7);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        axios.get(route('store.restaurant.reports.kitchen-performance', { store_slug: storeSlug, days }))
            .then(res => {
                if (mounted) setData(res.data);
            })
            .catch(err => console.error(err))
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, [storeSlug, days]);

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 9999, padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#1c1c1e', borderRadius: '16px', padding: '24px',
                    minWidth: '360px', maxWidth: '640px', width: '90%',
                    maxHeight: '85vh', overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid #27272a',
                    color: '#ffffff',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} style={{ color: '#3b82f6' }} />
                        Kitchen Performance Analytics
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: 4 }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Period Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {[1, 7, 30].map(d => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            style={{
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                background: days === d ? '#3b82f6' : '#27272a',
                                color: days === d ? '#ffffff' : '#a1a1aa',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            {d === 1 ? 'Today' : `Last ${d} Days`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>Analyzing ticket times...</div>
                ) : data ? (
                    <>
                        {/* Highlights */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ padding: '16px', background: '#27272a', borderRadius: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Total Served</span>
                                <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>
                                    {data.total_tickets}
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: '#27272a', borderRadius: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>Avg Cook Time</span>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
                                    {data.avg_cook_time}m
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: '#27272a', borderRadius: '12px' }}>
                                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>On-Time (≤15m)</span>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                                    {data.on_time_pct}%
                                </div>
                            </div>
                        </div>

                        {/* Station Breakdown */}
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#d4d4d8', marginBottom: '10px' }}>
                                Performance by Station
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {data.by_station?.map(st => (
                                    <div key={st.station} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '10px 14px', background: '#27272a', borderRadius: '8px', fontSize: '13px',
                                    }}>
                                        <b style={{ textTransform: 'capitalize' }}>{st.station}</b>
                                        <div style={{ display: 'flex', gap: '16px', color: '#a1a1aa' }}>
                                            <span>{st.count} tickets</span>
                                            <span style={{ color: '#60a5fa', fontWeight: 700 }}>Avg {st.avg_mins}m</span>
                                        </div>
                                    </div>
                                ))}
                                {(!data.by_station || data.by_station.length === 0) && (
                                    <div style={{ color: '#71717a', fontSize: '13px' }}>No completed tickets in this period.</div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function RestaurantKitchen({ storeSlug, orders: initial = [] }) {
    const [orders, setOrders] = useState(initial);
    const [status, setStatus] = useState('open');   /* open | all | ready | served */
    /* Persist station selection across page reloads — a KDS never changes
       station once it's been set up, so localStorage is exactly right here. */
    const [station, setStation] = useState(() => localStorage.getItem(LS_STATION) || 'all');
    const [busyId, setBusyId] = useState(null);
    const [live, setLive] = useState(true);
    const [, setTick] = useState(0);
    const [eightySixIds, setEightySixIds] = useState([]);
    const [show86Modal, setShow86Modal] = useState(false);
    const [showPerfModal, setShowPerfModal] = useState(false);
    const inFlight = useRef(false);

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    /* Persist station to localStorage whenever it changes. */
    const handleStationChange = useCallback((s) => {
        setStation(s);
        localStorage.setItem(LS_STATION, s);
    }, []);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        try {
            const { data } = await axios.get(r('store.restaurant.kitchen.state'));
            if (Array.isArray(data?.orders)) setOrders(data.orders);
            if (Array.isArray(data?.eighty_six_ids)) setEightySixIds(data.eighty_six_ids);
            setLive(true);
        } catch (_) {
            /* A wall screen that has lost the server must SAY so. A kitchen
               reading a frozen board is worse than a kitchen reading none. */
            setLive(false);
        }
    }, [r]);

    useEffect(() => {
        const id = setInterval(refresh, POLL_MS);
        return () => clearInterval(id);
    }, [refresh]);

    /* The clock is a second-by-second read-out, so it ticks on its own rather
       than waiting for the poll. */
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), TICK_MS);
        return () => clearInterval(id);
    }, []);

    const act = async (name, id) => {
        setBusyId(id);
        inFlight.current = true;
        try {
            const { data } = await axios.post(r(name, { id }));
            if (data?.order) {
                setOrders(prev => prev.map(o => (o.id === data.order.id ? data.order : o)));
            }
            setLive(true);
        } catch (_) {
            setLive(false);
        } finally {
            inFlight.current = false;
            setBusyId(null);
        }
    };

    const handleReprint = async (order) => {
        try {
            const { data } = await axios.post(r('store.tables.kitchen.reprint'), {
                ticket_id: order.id,
            });
            if (data?.kot) {
                KitchenPrintService.printKOT(data.kot, { isReprint: true });
            }
        } catch (err) {
            console.error('Failed to reprint ticket:', err);
        }
    };

    const handleToggle86 = async (productId) => {
        try {
            const { data } = await axios.post(r('store.tables.kitchen.86'), { product_id: productId });
            if (Array.isArray(data?.eighty_six_ids)) setEightySixIds(data.eighty_six_ids);
        } catch (err) {
            console.error('Failed to update 86 list:', err);
        }
    };

    const stations = useMemo(() => {
        const set = new Set(orders.map(o => o.station).filter(Boolean));
        return [...set].sort();
    }, [orders]);

    const shown = useMemo(() => {
        let list = orders;
        if (status === 'open') list = list.filter(o => o.status === 'pending' || o.status === 'preparing');
        else if (status !== 'all') list = list.filter(o => o.status === status);
        if (station !== 'all') list = list.filter(o => (o.station || 'kitchen') === station);
        /* Oldest first, always. A kitchen board sorted any other way asks the
           cook to work out what is late. */
        return [...list].sort((a, b) =>
            new Date(a.fired_at || a.created_at) - new Date(b.fired_at || b.created_at));
    }, [orders, status, station]);

    const lateCount = shown.filter(o =>
        (o.status === 'pending' || o.status === 'preparing')
        && minutesSince(o.fired_at || o.created_at) >= 10).length;

    return (
        <div className="kds">
            <Head title="Kitchen" />

            <header className="kds-bar">
                <span className="kds-brand">
                    <ChefHat size={20} aria-hidden="true" />
                    <b>Kitchen</b>
                </span>

                <div className="kds-seg" role="tablist" aria-label="Which tickets">
                    {[['open', 'Cooking'], ['ready', 'Ready'], ['served', 'Served'], ['all', 'All']].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={status === id}
                            data-on={status === id ? '1' : '0'}
                            onClick={() => setStatus(id)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {stations.length > 1 && (
                    <div className="kds-seg" role="tablist" aria-label="Station">
                        <button type="button" role="tab" aria-selected={station === 'all'}
                                data-on={station === 'all' ? '1' : '0'} onClick={() => handleStationChange('all')}>
                            All stations
                        </button>
                        {stations.map(s => (
                            <button key={s} type="button" role="tab" aria-selected={station === s}
                                    data-on={station === s ? '1' : '0'} onClick={() => handleStationChange(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                <span className="kds-bar-end">
                    {eightySixIds.length > 0 && (
                        <span
                            style={{
                                fontSize: '12px', fontWeight: 700, color: '#ef4444',
                                background: 'rgba(239,68,68,0.15)', borderRadius: '4px',
                                padding: '2px 8px', marginRight: '4px',
                            }}
                            title="Items currently 86'd"
                        >
                            86: {eightySixIds.length}
                        </span>
                    )}
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => setShowPerfModal(true)}
                        title="View Kitchen Performance Analytics"
                        style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}
                    >
                        <BarChart3 size={14} aria-hidden="true" />
                        Stats
                    </button>
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => setShow86Modal(true)}
                        title="Manage 86 list (unavailable items)"
                        style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}
                    >
                        <XCircle size={14} aria-hidden="true" />
                        86
                    </button>
                    {lateCount > 0 && (
                        <span className="kds-late" title="Tickets over ten minutes old">
                            {lateCount} late
                        </span>
                    )}
                    <span className="kds-live" data-live={live ? '1' : '0'} title={live ? 'Updating every 10 seconds' : 'Not reaching the server'}>
                        {live ? <RefreshCcw size={13} aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}
                        {live ? 'Live' : 'Offline'}
                    </span>
                    <Link href={route('store.tables.index', { store_slug: storeSlug })} className="kds-link">
                        <LayoutGrid size={14} aria-hidden="true" />
                        Floor
                    </Link>
                </span>
            </header>

            <main className="kds-board">
                {shown.map(o => (
                    <Ticket
                        key={o.id}
                        order={o}
                        busy={busyId === o.id}
                        onBump={id => act('store.restaurant.order.bump', id)}
                        onRecall={id => act('store.restaurant.order.recall', id)}
                        onReprint={handleReprint}
                    />
                ))}

                {shown.length === 0 && (
                    <div className="kds-empty">
                        <ChefHat size={40} strokeWidth={1.5} aria-hidden="true" />
                        <p>{status === 'open' ? 'Nothing on. The pass is clear.' : 'No tickets here.'}</p>
                    </div>
                )}
            </main>

            {show86Modal && (
                <EightySixModal
                    orders={orders}
                    eightySixIds={eightySixIds}
                    onToggle={handleToggle86}
                    onClose={() => setShow86Modal(false)}
                />
            )}

            {showPerfModal && (
                <KitchenPerformanceModal
                    storeSlug={storeSlug}
                    onClose={() => setShowPerfModal(false)}
                />
            )}
        </div>
    );
}

