import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Bike, MapPin, Phone, User, Clock, Timer, Check, Undo2,
    RefreshCcw, WifiOff, LayoutGrid, AlertTriangle, Wallet,
    CheckCircle2, Copy, X, CreditCard, ChevronRight, DollarSign, ArrowLeft,
} from 'lucide-react';
import { DELIVERY_STATES, DELIVERY_META, elapsedLabel, sinceMinutes, isLate } from '@/Pos/Table/Delivery';
import RestaurantFeatureGate from '@/Components/Restaurant/RestaurantFeatureGate';

const POLL_MS = 15000;
const TICK_MS = 1000;

/* ── Rider Cash-Up Modal ───────────────────────────────────────────────── */
function RiderCashUpModal({ storeSlug, riders, onClose }) {
    const [selectedRiderId, setSelectedRiderId] = useState(riders[0]?.id || '');
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(null);

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const loadCashUp = useCallback(async () => {
        if (!selectedRiderId) return;
        setLoading(true);
        try {
            const res = await axios.get(r('store.restaurant.dispatch.rider-cashup'), {
                params: { rider_id: selectedRiderId, date },
            });
            setData(res.data);
        } catch (err) {
            console.error('Failed to load rider cash-up:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedRiderId, date, r]);

    useEffect(() => {
        loadCashUp();
    }, [loadCashUp]);

    const handleMarkHandedIn = async () => {
        if (!data?.deliveries?.length) return;
        const unpaidIds = data.deliveries.filter(d => !d.cash_handed_in).map(d => d.occupancy_id);
        if (!unpaidIds.length) return;

        setSaving(true);
        try {
            await axios.post(r('store.restaurant.dispatch.cash-up'), {
                occupancy_ids: unpaidIds,
            });
            await loadCashUp();
        } catch (err) {
            console.error('Failed to mark cash handed in:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl bg-surface border border-line rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
                    <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                        <Wallet size={20} className="text-brand-600 dark:text-brand-400" />
                        <span>Rider Shift Cash-Up & Reconciliation</span>
                    </h2>
                    <button type="button" onClick={onClose} className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-sunken">
                        <X size={18} />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-ink-secondary mb-1">
                            Rider
                        </label>
                        <select
                            value={selectedRiderId}
                            onChange={e => setSelectedRiderId(e.target.value)}
                            className="w-full bg-sunken border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                            {riders.map(rd => (
                                <option key={rd.id} value={rd.id}>{rd.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full sm:w-48">
                        <label className="block text-xs font-semibold text-ink-secondary mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-sunken border border-line rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-sm text-ink-muted">Loading deliveries...</div>
                ) : data ? (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                            <div className="p-4 bg-sunken rounded-2xl border border-line">
                                <span className="text-xs font-semibold text-ink-muted">Expected Cash</span>
                                <div className="text-xl font-bold text-ink mt-0.5">
                                    Rs {data.total_expected?.toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-700/50">
                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Cash Handed In</span>
                                <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                                    Rs {data.total_collected?.toLocaleString()}
                                </div>
                            </div>

                            <div className={`p-4 rounded-2xl border ${
                                data.variance < 0
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                                    : 'bg-sunken border border-line'
                            }`}>
                                <span className={`text-xs font-semibold ${data.variance < 0 ? 'text-red-700 dark:text-red-400' : 'text-ink-muted'}`}>
                                    Variance
                                </span>
                                <div className={`text-xl font-bold mt-0.5 ${data.variance < 0 ? 'text-red-700 dark:text-red-300' : 'text-ink'}`}>
                                    {data.variance < 0 ? `-Rs ${Math.abs(data.variance).toLocaleString()}` : `Rs ${data.variance?.toLocaleString()}`}
                                </div>
                            </div>
                        </div>

                        {/* Deliveries Table */}
                        <div className="overflow-x-auto border border-line rounded-2xl mb-5">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-line bg-sunken/40 text-ink-muted font-semibold">
                                        <th className="py-2.5 px-3">Ticket</th>
                                        <th className="py-2.5 px-3">Customer / Address</th>
                                        <th className="py-2.5 px-3">Order Total</th>
                                        <th className="py-2.5 px-3">Fee</th>
                                        <th className="py-2.5 px-3">Pay Method</th>
                                        <th className="py-2.5 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {data.deliveries?.map(d => (
                                        <tr key={d.occupancy_id} className="hover:bg-sunken/50 transition-colors">
                                            <td className="py-2.5 px-3 font-bold text-ink">{d.code}</td>
                                            <td className="py-2.5 px-3">
                                                <div className="font-semibold text-ink">{d.customer_name || 'Guest'}</div>
                                                <div className="text-xs text-ink-muted">{d.address}</div>
                                            </td>
                                            <td className="py-2.5 px-3 font-semibold text-ink">Rs {d.order_total}</td>
                                            <td className="py-2.5 px-3 text-ink-muted">Rs {d.delivery_fee}</td>
                                            <td className="py-2.5 px-3 capitalize text-ink-muted">{d.payment_method}</td>
                                            <td className="py-2.5 px-3">
                                                {d.cash_handed_in ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Settled</span>
                                                ) : (
                                                    <span className="text-amber-600 dark:text-amber-400 font-bold">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!data.deliveries || data.deliveries.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="py-6 text-center text-ink-muted">
                                                No deliveries assigned to this rider on this date.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={handleMarkHandedIn}
                                disabled={saving || !data.deliveries?.some(d => !d.cash_handed_in)}
                                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                            >
                                {saving ? 'Recording...' : 'Mark All Cash Handed In'}
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}

/* ── Delivery Card Component ────────────────────────────────────────────── */
function DeliveryCard({ order, riders, onUpdateStatus, onAssignRider }) {
    const del = order.delivery || {};
    const late = isLate(del);
    const [copied, setCopied] = useState(false);

    const copyTracking = (e) => {
        e.stopPropagation();
        if (!del.tracking_token) return;
        const url = `${window.location.origin}/track/${del.tracking_token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const nextState = {
        placed: 'preparing',
        preparing: 'out',
        out: 'delivered',
        delivered: null,
    }[del.status];

    const prevState = {
        placed: null,
        preparing: 'placed',
        out: 'preparing',
        delivered: 'out',
    }[del.status];

    return (
        <div className={`bg-surface rounded-2xl border p-4 flex flex-col gap-3 shadow-sm transition-all ${
            late
                ? 'border-red-300 dark:border-red-700/60 shadow-red-500/10'
                : 'border-line'
        }`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-ink bg-sunken px-2.5 py-0.5 rounded-lg border border-line">
                        {order.code}
                    </span>
                    {late && (
                        <span className="text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-200 dark:border-red-800">
                            <AlertTriangle size={11} /> LATE
                        </span>
                    )}
                </div>

                <span className="text-xs text-ink-muted flex items-center gap-1 font-medium">
                    <Clock size={12} />
                    <b>{elapsedLabel(del.status_at || order.opened_at)}</b>
                </span>
            </div>

            {/* Customer Details */}
            <div>
                <div className="text-sm font-bold text-ink">
                    {order.customer_name || 'Guest Order'}
                </div>
                {order.phone && (
                    <a
                        href={`tel:${order.phone}`}
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                        <Phone size={12} /> {order.phone}
                    </a>
                )}
                {order.address && (
                    <div className="text-xs text-ink-secondary mt-1 flex gap-1 items-start">
                        <MapPin size={13} className="shrink-0 mt-0.5 text-ink-muted" />
                        <span>{order.address}</span>
                    </div>
                )}
                {del.note && (
                    <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded-lg mt-1.5">
                        "{del.note}"
                    </div>
                )}
            </div>

            {/* Financials & Payment Method */}
            <div className="flex justify-between items-center text-xs text-ink-muted border-t border-line pt-2">
                <span>Total: <b className="text-ink">Rs {order.order_total}</b> {del.fee > 0 ? `(+Rs ${del.fee} fee)` : ''}</span>
                <span className="capitalize font-semibold text-ink-secondary">{del.payment_method || 'Cash'}</span>
            </div>

            {/* Rider Selector */}
            <div className="flex items-center gap-2">
                <Bike size={14} className="text-ink-muted shrink-0" />
                <select
                    value={del.rider_id || ''}
                    onChange={e => onAssignRider(order.occupancy_id, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-line text-xs bg-sunken text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                    <option value="">{del.rider ? `Assigned: ${del.rider}` : 'Assign Rider...'}</option>
                    {riders.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>

                {del.tracking_token && (
                    <button
                        type="button"
                        onClick={copyTracking}
                        title="Copy tracking link"
                        className="p-1.5 rounded-xl border border-line bg-surface hover:bg-sunken text-ink-muted hover:text-ink cursor-pointer"
                    >
                        {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                )}
            </div>

            {/* Status Actions */}
            <div className="flex gap-1.5 mt-1">
                {prevState && (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(order.occupancy_id, prevState)}
                        title="Move back a step"
                        className="px-3 py-1.5 rounded-xl border border-line bg-surface hover:bg-sunken text-ink-muted hover:text-ink cursor-pointer transition-colors"
                    >
                        <Undo2 size={14} />
                    </button>
                )}

                {nextState && (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(order.occupancy_id, nextState)}
                        className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all text-white ${
                            nextState === 'delivered'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400'
                        }`}
                    >
                        <span>{DELIVERY_META[nextState]?.label || 'Next'}</span>
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Main Dispatch Page ─────────────────────────────────────────────────── */
export default function Dispatch({
    storeSlug,
    orders: initialOrders = [],
    riders: initialRiders = [],
    deliveryEnabled = true,
    preparesOrdersEnabled = true,
}) {
    const [isDeliveryActive, setIsDeliveryActive] = useState(deliveryEnabled);
    const [orders, setOrders] = useState(initialOrders);
    const [riders, setRiders] = useState(initialRiders);
    const [live, setLive] = useState(true);
    const [showCashUp, setShowCashUp] = useState(false);
    const [, setTick] = useState(0);
    const inFlight = useRef(false);

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const refresh = useCallback(async () => {
        if (inFlight.current) return;
        try {
            const { data } = await axios.get(r('store.restaurant.dispatch.state'));
            if (Array.isArray(data?.orders)) setOrders(data.orders);
            if (Array.isArray(data?.riders)) setRiders(data.riders);
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

    const handleUpdateStatus = async (occupancyId, status) => {
        inFlight.current = true;
        try {
            await axios.post(r('store.tables.delivery'), {
                occupancy_id: occupancyId,
                status,
            });
            await refresh();
        } catch (err) {
            console.error('Failed to update delivery status:', err);
        } finally {
            inFlight.current = false;
        }
    };

    const handleAssignRider = async (occupancyId, riderId) => {
        inFlight.current = true;
        try {
            await axios.post(r('store.tables.delivery'), {
                occupancy_id: occupancyId,
                rider_id: riderId || null,
            });
            await refresh();
        } catch (err) {
            console.error('Failed to assign rider:', err);
        } finally {
            inFlight.current = false;
        }
    };

    const grouped = useMemo(() => {
        const out = { placed: [], preparing: [], out: [], delivered: [] };
        for (const ord of orders) {
            const st = ord.delivery?.status || 'placed';
            if (out[st]) out[st].push(ord);
            else out.placed.push(ord);
        }
        return out;
    }, [orders]);

    const activeCount = (grouped.placed.length + grouped.preparing.length + grouped.out.length);
    const lateCount = orders.filter(o => isLate(o.delivery)).length;

    if (!isDeliveryActive) {
        return (
            <div className="min-h-screen bg-app text-ink p-6 flex flex-col justify-between">
                <Head title="Delivery Dispatch — Disabled" />
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
                        <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                            <Bike size={22} />
                        </span>
                        <span className="font-bold text-lg text-ink">Delivery Dispatch Board</span>
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
                    title="Delivery Orders Are Currently Disabled"
                    description="Delivery service is turned off in restaurant settings. Turn this setting on to start assigning orders to riders, tracking dispatch times, and reconciling cash."
                    settingKey="lane_delivery"
                    turnOnLabel="Turn Delivery & Dispatch On"
                    isEnabled={isDeliveryActive}
                    icon={Bike}
                    onToggled={(val) => setIsDeliveryActive(val)}
                    mode="full"
                    badgeText="Delivery & Dispatch"
                />
                <div />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app flex flex-col">
            <Head title="Delivery Dispatch" />

            {/* Top Bar */}
            <header className="bg-surface border-b border-line text-ink px-6 py-3.5 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
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

                    <div className="flex items-center gap-2 text-base font-bold text-ink">
                        <Bike size={20} className="text-amber-500" />
                        <span>Delivery Dispatch</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-sunken text-ink px-2.5 py-1 rounded-lg font-semibold border border-line">
                            {activeCount} active
                        </span>
                        {lateCount > 0 && (
                            <span className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-lg font-bold border border-red-200 dark:border-red-800">
                                {lateCount} late
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Link
                        href={route('store.restaurant.riders', { store_slug: storeSlug })}
                        className="flex items-center gap-1.5 bg-surface hover:bg-sunken border border-line text-ink-secondary hover:text-ink px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                        <Bike size={14} className="text-amber-500" />
                        <span>Manage Riders</span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowCashUp(true)}
                        className="flex items-center gap-1.5 bg-surface hover:bg-sunken border border-line text-ink-secondary hover:text-ink px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                    >
                        <Wallet size={14} className="text-brand-500" />
                        <span>Rider Cash-Up</span>
                    </button>

                    <span className={`text-xs flex items-center gap-1 font-semibold ${live ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {live ? <RefreshCcw size={12} /> : <WifiOff size={12} />}
                        {live ? 'Live' : 'Offline'}
                    </span>

                    <Link
                        href={route('store.tables.index', { store_slug: storeSlug })}
                        className="flex items-center gap-1.5 text-ink-muted hover:text-ink text-xs px-2.5 py-1.5 rounded-xl hover:bg-sunken transition-all"
                    >
                        <LayoutGrid size={14} /> Floor
                    </Link>
                </div>
            </header>

            {/* Board Columns */}
            <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                {DELIVERY_STATES.map((st) => {
                    const meta = DELIVERY_META[st];
                    const items = grouped[st] || [];
                    const Icon = meta.icon;

                    return (
                        <div key={st} className="bg-sunken border border-line rounded-2xl flex flex-col max-h-[calc(100vh-100px)] overflow-hidden">
                            {/* Column Header */}
                            <div className="p-3.5 px-4 flex justify-between items-center border-b border-line bg-surface/50">
                                <div className="flex items-center gap-2 font-bold text-xs text-ink uppercase tracking-wider">
                                    <Icon size={15} />
                                    <span>{meta.label}</span>
                                </div>
                                <span className="text-xs font-bold bg-surface border border-line px-2.5 py-0.5 rounded-lg text-ink-secondary">
                                    {items.length}
                                </span>
                            </div>

                            {/* Column Cards List */}
                            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                                {items.map(ord => (
                                    <DeliveryCard
                                        key={ord.occupancy_id}
                                        order={ord}
                                        riders={riders}
                                        onUpdateStatus={handleUpdateStatus}
                                        onAssignRider={handleAssignRider}
                                    />
                                ))}

                                {items.length === 0 && (
                                    <div className="text-center py-8 text-xs text-ink-muted">
                                        No tickets in {meta.label.toLowerCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </main>

            {showCashUp && (
                <RiderCashUpModal
                    storeSlug={storeSlug}
                    riders={riders}
                    onClose={() => setShowCashUp(false)}
                />
            )}
        </div>
    );
}
