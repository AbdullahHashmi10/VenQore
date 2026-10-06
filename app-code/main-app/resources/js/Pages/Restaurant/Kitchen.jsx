/* ==========================================================================
   THE KITCHEN DISPLAY (V6 System Compliant)
   ==========================================================================
   What this screen is for, in one sentence: a cook standing two metres away
   has to be able to see which ticket is oldest without walking over.

   Everything below follows from that. Tickets are ordered by age, not by
   table. The elapsed clock is the largest thing on a ticket after the food.
   Age is a colour as well as a number, because a number has to be read and a
   colour does not. And the whole board re-reads itself every ten seconds.
   ========================================================================== */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ChefHat, Clock, Check, Undo2, Utensils, ShoppingBag, Bike,
    LayoutGrid, RefreshCcw, WifiOff, Printer, XCircle, X, BarChart3,
    Tv, AlertTriangle, Search, Loader2, ArrowLeft,
} from 'lucide-react';
import { KitchenPrintService } from '@/Utils/KitchenPrintService';
import RestaurantFeatureGate from '@/Components/Restaurant/RestaurantFeatureGate';
import '@/Pos/Table/kds.css';

const POLL_MS = 10000;
const TICK_MS = 1000;
const LS_STATION = 'kds_station';

/* Alert chime for incoming void/cancellation dockets using Web Audio API */
function playAlertChime() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
    } catch (_) {}
}

/* The ladder a ticket climbs. Bump moves it forward, recall moves it back. */
const FLOW = ['pending', 'preparing', 'ready', 'served'];
const NEXT_LABEL = { pending: 'Start', preparing: 'Ready', ready: 'Served', served: 'Done' };

const TYPE_ICON = { dine_in: Utensils, takeaway: ShoppingBag, delivery: Bike };

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

function Ticket({ order, onBump, onRecall, onReprint, onDismiss, busy }) {
    const isCancelled = order.status === 'cancelled';
    const mins = minutesSince(order.fired_at || order.created_at);
    const band = isCancelled ? 'cancelled' : (order.status === 'served' ? 'done' : ageBand(mins));
    const Icon = TYPE_ICON[order.order_type] || Utensils;
    const idx = FLOW.indexOf(order.status);
    const canBump = !isCancelled && idx >= 0 && idx < FLOW.length - 1;
    const canRecall = !isCancelled && idx > 0;
    const orderType = order.order_type || 'dine_in';
    const orderTypeLabel = orderType.replace('_', ' ');

    if (isCancelled) {
        return (
            <article className="kds-ticket border-2 border-red-500 bg-red-50 dark:bg-red-950/40 shadow-sm rounded-2xl overflow-hidden">
                <header className="kds-ticket-h bg-red-600 text-white p-3 flex items-center justify-between">
                    <span className="kds-ticket-where flex items-center gap-2 text-white font-bold text-sm">
                        <XCircle size={16} aria-hidden="true" />
                        <b className="text-white">{order.position_code || order.table_number || order.order_number}</b>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-900 text-white uppercase tracking-wider">
                            VOID / REDUCED
                        </span>
                    </span>
                    <span className="kds-clock vq-num text-red-100 text-xs font-bold ml-auto">
                        {clock(order.fired_at || order.created_at)}
                    </span>
                </header>

                <div className="px-3 py-2 bg-red-100 dark:bg-red-900/50 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle size={15} />
                    <span>STOP / DO NOT PREPARE:</span>
                </div>

                <ul className="kds-items bg-surface p-3 space-y-2">
                    {(order.items || []).map((it, i) => (
                        <li key={i} className="kds-item flex items-start gap-2 text-red-600 dark:text-red-400">
                            <span className="kds-qty vq-num bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold px-1.5 py-0.5 rounded text-xs">-{it.qty || 1}</span>
                            <span className="kds-item-body">
                                <span className="kds-item-name line-through font-bold text-red-800 dark:text-red-300">{it.name}</span>
                                {it.notes && <span className="kds-item-note text-red-600 dark:text-red-400 text-xs block">"{it.notes}"</span>}
                            </span>
                        </li>
                    ))}
                </ul>

                <footer className="kds-ticket-f p-3 bg-red-50 dark:bg-red-950/50 border-t border-red-200 dark:border-red-900 flex gap-2">
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => onReprint?.(order)}
                        disabled={busy}
                        title="Reprint Cancellation docket"
                    >
                        <Printer size={15} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="flex-1 h-9 rounded-xl border-0 bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        onClick={() => onDismiss?.(order.id)}
                        disabled={busy}
                        title="Acknowledge this cancellation to clear it from the screen"
                    >
                        <Check size={16} /> Acknowledge (Dismiss)
                    </button>
                </footer>
            </article>
        );
    }

    return (
        <article className="kds-ticket" data-band={band} data-status={order.status}>
            <header className="kds-ticket-h">
                <span className="kds-ticket-where">
                    <Icon size={14} aria-hidden="true" />
                    <b>{order.position_code || order.table_number || order.order_number}</b>
                    <span
                        className={`text-[10px] font-bold uppercase ml-1.5 px-1.5 py-0.5 rounded text-white ${
                            orderType === 'takeaway'
                                ? 'bg-orange-600'
                                : orderType === 'delivery'
                                ? 'bg-blue-600'
                                : 'bg-emerald-600'
                        }`}
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

/* ── 86 list modal (V6 Design System) ──────────────────────────────────── */

function EightySixModal({ storeSlug, orders, eightySixIds, onToggle, onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        axios.get(route('store.api.sync.products', { store_slug: storeSlug }))
            .then(res => {
                if (isMounted && Array.isArray(res.data)) {
                    setAllProducts(res.data.map(p => ({ id: p.id, name: p.name })));
                }
            })
            .catch(() => { /* silent fallback to active ticket items */ })
            .finally(() => { if (isMounted) setLoading(false); });
        return () => { isMounted = false; };
    }, [storeSlug]);

    /* Combine catalog products with any unique items seen on active tickets */
    const items = useMemo(() => {
        const map = new Map();
        for (const p of allProducts) {
            map.set(p.id, p.name);
        }
        for (const order of orders) {
            for (const it of (order.items || [])) {
                if (it.product_id && !map.has(it.product_id)) {
                    map.set(it.product_id, it.name);
                }
            }
        }
        const list = [...map.entries()].map(([id, name]) => ({ id, name }));
        
        return list.sort((a, b) => {
            const a86 = eightySixIds.includes(a.id);
            const b86 = eightySixIds.includes(b.id);
            if (a86 && !b86) return -1;
            if (!a86 && b86) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [allProducts, orders, eightySixIds]);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;
        const q = searchTerm.toLowerCase();
        return items.filter(it => it.name.toLowerCase().includes(q));
    }, [items, searchTerm]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-lg bg-surface border border-line rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 shrink-0">
                            <XCircle size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-ink flex items-center gap-2">
                                <span>86 List — Unavailable Items</span>
                            </h3>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Mark items as out of stock (86'd) to prevent new orders.
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink p-1.5 rounded-xl hover:bg-sunken transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search menu items to 86..."
                        className="w-full bg-sunken border border-line rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {loading && items.length === 0 ? (
                        <div className="py-8 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-brand-500" />
                            <span>Loading menu items...</span>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-10 text-center px-4">
                            <div className="w-12 h-12 rounded-2xl bg-sunken border border-line flex items-center justify-center mx-auto mb-3 text-ink-muted">
                                <XCircle size={24} />
                            </div>
                            <p className="text-xs text-ink font-semibold mb-1">
                                {searchTerm ? 'No items match your search' : 'No menu items found'}
                            </p>
                            <p className="text-xs text-ink-muted max-w-xs mx-auto">
                                {searchTerm ? 'Try checking for typos.' : 'Menu items will appear here as they are added to catalog or ordered.'}
                            </p>
                        </div>
                    ) : (
                        filteredItems.map(({ id, name }) => {
                            const is86 = eightySixIds.includes(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => onToggle(id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                                        is86
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'
                                            : 'bg-sunken border-line text-ink hover:border-brand-500 hover:bg-surface'
                                    }`}
                                >
                                    <span className={is86 ? 'line-through font-bold' : ''}>{name}</span>
                                    {is86 ? (
                                        <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-700">
                                            86'd (Out of Stock)
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium text-ink-muted group-hover:text-ink">
                                            Available
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Kitchen Performance Analytics Modal (V6 System Compliant) ─────────── */

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-xl bg-surface border border-line rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 shrink-0">
                            <BarChart3 size={22} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-ink">Kitchen Performance Analytics</h3>
                            <p className="text-xs text-ink-muted mt-0.5">Ticket cook times and speed of service.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink p-1.5 rounded-xl hover:bg-sunken transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Period Selector */}
                <div className="flex items-center gap-2 mb-5">
                    {[1, 7, 30].map(d => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                days === d
                                    ? 'bg-brand-600 dark:bg-brand-500 text-white shadow-sm'
                                    : 'bg-sunken border border-line text-ink-muted hover:text-ink hover:bg-surface'
                            }`}
                        >
                            {d === 1 ? 'Today' : `Last ${d} Days`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-xs text-ink-muted flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-brand-500" />
                        <span>Analyzing ticket times...</span>
                    </div>
                ) : data ? (
                    <>
                        {/* Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                            <div className="p-4 bg-sunken rounded-2xl border border-line">
                                <span className="text-xs font-semibold text-ink-muted">Total Served</span>
                                <div className="text-2xl font-bold text-ink mt-1">
                                    {data.total_tickets}
                                </div>
                            </div>
                            <div className="p-4 bg-sunken rounded-2xl border border-line">
                                <span className="text-xs font-semibold text-ink-muted">Avg Cook Time</span>
                                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">
                                    {data.avg_cook_time}m
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-700/50">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">On-Time (≤15m)</span>
                                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                                    {data.on_time_pct}%
                                </div>
                            </div>
                        </div>

                        {/* Station Breakdown */}
                        <div>
                            <h4 className="text-xs font-bold text-ink-secondary uppercase tracking-wider mb-3">
                                Performance by Station
                            </h4>
                            <div className="space-y-2">
                                {data.by_station?.map(st => (
                                    <div key={st.station} className="flex justify-between items-center p-3.5 bg-sunken border border-line rounded-xl text-xs">
                                        <b className="font-bold text-ink capitalize">{st.station}</b>
                                        <div className="flex gap-4 text-ink-muted">
                                            <span>{st.count} tickets</span>
                                            <span className="text-brand-600 dark:text-brand-400 font-bold">Avg {st.avg_mins}m</span>
                                        </div>
                                    </div>
                                ))}
                                {(!data.by_station || data.by_station.length === 0) && (
                                    <div className="text-center py-6 text-xs text-ink-muted bg-sunken rounded-xl border border-line">
                                        No completed tickets in this period.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default function RestaurantKitchen({ storeSlug, orders: initial = [], preparesOrdersEnabled = true }) {
    const [isEnabled, setIsEnabled] = useState(preparesOrdersEnabled);
    const [orders, setOrders] = useState(initial);
    const [status, setStatus] = useState('open');   /* open | all | ready | served | cancelled */
    const [station, setStation] = useState(() => localStorage.getItem(LS_STATION) || 'all');
    const [busyId, setBusyId] = useState(null);
    const [live, setLive] = useState(true);
    const [, setTick] = useState(0);
    const [eightySixIds, setEightySixIds] = useState([]);
    const [show86Modal, setShow86Modal] = useState(false);
    const [showPerfModal, setShowPerfModal] = useState(false);
    const inFlight = useRef(false);
    const knownCancelledRef = useRef(new Set(initial.filter(o => o.status === 'cancelled').map(o => o.id)));

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const handleStationChange = useCallback((s) => {
        setStation(s);
        localStorage.setItem(LS_STATION, s);
    }, []);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        try {
            const { data } = await axios.get(r('store.restaurant.kitchen.state'));
            if (Array.isArray(data?.orders)) {
                setOrders(data.orders);
                const freshCancelled = data.orders.filter(o => o.status === 'cancelled');
                const hasNewCancelled = freshCancelled.some(o => !knownCancelledRef.current.has(o.id));
                if (hasNewCancelled) {
                    playAlertChime();
                }
                freshCancelled.forEach(o => knownCancelledRef.current.add(o.id));
            }
            if (Array.isArray(data?.eighty_six_ids)) setEightySixIds(data.eighty_six_ids);
            setLive(true);
        } catch (_) {
            setLive(false);
        }
    }, [r]);

    useEffect(() => {
        const id = setInterval(refresh, POLL_MS);
        return () => clearInterval(id);
    }, [refresh]);

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
                if (data.order.status === 'dismissed') {
                    setOrders(prev => prev.filter(o => o.id !== data.order.id));
                } else {
                    setOrders(prev => prev.map(o => (o.id === data.order.id ? data.order : o)));
                }
            }
            setLive(true);
        } catch (_) {
            setLive(false);
        } finally {
            inFlight.current = false;
            setBusyId(null);
        }
    };

    const handleDismiss = (id) => act('store.restaurant.order.dismiss', id);

    const handleClearAll = async () => {
        if (!window.confirm('Mark all active tickets as Served and clear the pass?')) return;
        try {
            const { data } = await axios.post(r('store.restaurant.order.clear-all'));
            if (data?.orders) {
                setOrders(data.orders);
            }
        } catch (_) {}
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
        if (status === 'open') list = list.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'cancelled');
        else if (status === 'cancelled') list = list.filter(o => o.status === 'cancelled');
        else if (status !== 'all') list = list.filter(o => o.status === status);
        /* A screen remembers its station filter. If that station no longer
           exists (renamed, merged into one ticket in Kitchen settings), show
           everything rather than an empty screen with no tab to get back. */
        const want = String(station || 'all').toLowerCase();
        if (want !== 'all' && stations.some(s => String(s).toLowerCase() === want)) {
            list = list.filter(o => String(o.station || 'kitchen').toLowerCase() === want);
        }
        return [...list].sort((a, b) => {
            if (a.status === 'cancelled' && b.status !== 'cancelled') return -1;
            if (b.status === 'cancelled' && a.status !== 'cancelled') return 1;
            return new Date(a.fired_at || a.created_at) - new Date(b.fired_at || b.created_at);
        });
    }, [orders, status, station, stations]);

    const lateCount = shown.filter(o =>
        (o.status === 'pending' || o.status === 'preparing')
        && minutesSince(o.fired_at || o.created_at) >= 10).length;

    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

    if (!isEnabled) {
        return (
            <div className="kds min-h-screen bg-app text-ink p-6 flex flex-col justify-between">
                <Head title="Kitchen Display — Disabled" />
                <div className="flex items-center justify-between pb-4 border-b border-line">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.restaurant.settings', { store_slug: storeSlug })}
                            onClick={(e) => {
                                if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
                                    e.preventDefault();
                                    window.history.back();
                                }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-surface hover:bg-sunken border border-line text-xs font-semibold text-ink-secondary hover:text-ink transition-all flex items-center gap-1.5"
                            title="Go back to previous page or Restaurant Settings"
                        >
                            <ArrowLeft size={14} aria-hidden="true" />
                            <span>Back</span>
                        </Link>
                        <span className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400">
                            <ChefHat size={22} />
                        </span>
                        <span className="font-bold text-ink text-base">Kitchen Display System (KDS)</span>
                    </div>
                    <Link
                        href={route('store.restaurant.settings', { store_slug: storeSlug })}
                        className="px-3 py-1.5 rounded-xl bg-surface hover:bg-sunken border border-line text-xs font-semibold text-ink-secondary hover:text-ink transition-all"
                    >
                        Restaurant Settings
                    </Link>
                </div>
                <RestaurantFeatureGate
                    storeSlug={storeSlug}
                    title="Kitchen Order Preparation is Disabled"
                    description="Orders and items fired from POS or tables will not route to the kitchen until order preparation is turned on. Enable this to view live tickets and print kitchen dockets."
                    settingKey="prepares_orders"
                    turnOnLabel="Turn Kitchen Preparation On"
                    isEnabled={isEnabled}
                    icon={ChefHat}
                    onToggled={(val) => setIsEnabled(val)}
                    mode="full"
                    badgeText="Hospitality & KDS"
                />
                <div />
            </div>
        );
    }

    return (
        <div className="kds">
            <Head title="Kitchen" />

            <header className="kds-bar">
                <Link
                    href={route('store.restaurant.settings', { store_slug: storeSlug })}
                    onClick={(e) => {
                        if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
                            e.preventDefault();
                            window.history.back();
                        }
                    }}
                    className="kds-link font-semibold"
                    title="Go back to previous page or Restaurant Settings"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>Back</span>
                </Link>

                <span className="kds-brand">
                    <ChefHat size={20} aria-hidden="true" />
                    <b>Kitchen</b>
                </span>

                <div className="kds-seg" role="tablist" aria-label="Which tickets">
                    {[
                        ['open', 'Cooking'],
                        ['ready', 'Ready'],
                        ['served', 'Served'],
                        ...(cancelledCount > 0 ? [['cancelled', `⚠️ Voided (${cancelledCount})`]] : []),
                        ['all', 'All'],
                    ].map(([id, label]) => (
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
                            className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-lg"
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
                    >
                        <BarChart3 size={14} aria-hidden="true" />
                        <span>Stats</span>
                    </button>
                    <button
                        type="button"
                        className="kds-btn"
                        onClick={() => setShow86Modal(true)}
                        title="Manage 86 list (unavailable items)"
                    >
                        <XCircle size={14} aria-hidden="true" />
                        <span>86 List</span>
                    </button>
                    {orders.some(o => o.status !== 'served' && o.status !== 'cancelled') && (
                        <button
                            type="button"
                            className="kds-btn"
                            onClick={handleClearAll}
                            title="Mark all active tickets as complete/served"
                            style={{ color: 'var(--vq-success, #10b981)' }}
                        >
                            <Check size={14} aria-hidden="true" />
                            <span>Clear All</span>
                        </button>
                    )}
                    {lateCount > 0 && (
                        <span className="kds-late" title="Tickets over ten minutes old">
                            {lateCount} late
                        </span>
                    )}
                    <span className="kds-live" data-live={live ? '1' : '0'} title={live ? 'Updating every 10 seconds' : 'Not reaching the server'}>
                        {live ? <RefreshCcw size={13} aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}
                        {live ? 'Live' : 'Offline'}
                    </span>
                    <Link href={route('store.restaurant.queue', { store_slug: storeSlug })} target="_blank" className="kds-link" title="Open Customer Order Status Display on TV or Counter Tablet">
                        <Tv size={14} aria-hidden="true" />
                        <span>Customer Screen</span>
                    </Link>
                    <Link href={route('store.pos', { store_slug: storeSlug })} className="kds-link">
                        <ShoppingBag size={14} aria-hidden="true" />
                        <span>POS</span>
                    </Link>
                    <Link href={route('store.tables.index', { store_slug: storeSlug })} className="kds-link">
                        <LayoutGrid size={14} aria-hidden="true" />
                        <span>Floor</span>
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
                        onDismiss={handleDismiss}
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
                    storeSlug={storeSlug}
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
