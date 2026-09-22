import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    Bike, MapPin, Phone, User, Clock, Timer, Check, Undo2,
    RefreshCcw, WifiOff, LayoutGrid, AlertTriangle, Wallet,
    CheckCircle2, Copy, X, CreditCard, ChevronRight, DollarSign,
} from 'lucide-react';
import { DELIVERY_STATES, DELIVERY_META, elapsedLabel, sinceMinutes, isLate } from '@/Pos/Table/Delivery';

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
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px',
        }} onClick={onClose}>
            <div style={{
                background: '#ffffff', borderRadius: '16px', padding: '24px',
                width: '100%', maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid #e4e4e7',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#18181b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Wallet size={20} className="text-brand-600" />
                        Rider Shift Cash-Up & Reconciliation
                    </h2>
                    <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>
                            Rider
                        </label>
                        <select
                            value={selectedRiderId}
                            onChange={e => setSelectedRiderId(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                        >
                            {riders.map(rd => (
                                <option key={rd.id} value={rd.id}>{rd.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: '180px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>Loading deliveries...</div>
                ) : data ? (
                    <>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Expected Cash</span>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                                    Rs {data.total_expected?.toLocaleString()}
                                </div>
                            </div>

                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>Cash Handed In</span>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>
                                    Rs {data.total_collected?.toLocaleString()}
                                </div>
                            </div>

                            <div style={{
                                padding: '16px',
                                background: data.variance < 0 ? '#fef2f2' : '#f8fafc',
                                borderRadius: '12px',
                                border: `1px solid ${data.variance < 0 ? '#fecaca' : '#e2e8f0'}`,
                            }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: data.variance < 0 ? '#991b1b' : '#64748b' }}>
                                    Variance
                                </span>
                                <div style={{
                                    fontSize: '22px', fontWeight: 800,
                                    color: data.variance < 0 ? '#dc2626' : '#0f172a',
                                }}>
                                    {data.variance < 0 ? `-Rs ${Math.abs(data.variance).toLocaleString()}` : `Rs ${data.variance?.toLocaleString()}`}
                                </div>
                            </div>
                        </div>

                        {/* Deliveries Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e4e4e7', textAlign: 'left', color: '#71717a' }}>
                                    <th style={{ padding: '8px' }}>Ticket</th>
                                    <th style={{ padding: '8px' }}>Customer / Address</th>
                                    <th style={{ padding: '8px' }}>Order Total</th>
                                    <th style={{ padding: '8px' }}>Fee</th>
                                    <th style={{ padding: '8px' }}>Pay Method</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.deliveries?.map(d => (
                                    <tr key={d.occupancy_id} style={{ borderBottom: '1px solid #f4f4f5' }}>
                                        <td style={{ padding: '8px', fontWeight: 700 }}>{d.code}</td>
                                        <td style={{ padding: '8px' }}>
                                            <div><b>{d.customer_name || 'Guest'}</b></div>
                                            <div style={{ fontSize: '11px', color: '#71717a' }}>{d.address}</div>
                                        </td>
                                        <td style={{ padding: '8px' }}>Rs {d.order_total}</td>
                                        <td style={{ padding: '8px' }}>Rs {d.delivery_fee}</td>
                                        <td style={{ padding: '8px', textTransform: 'capitalize' }}>{d.payment_method}</td>
                                        <td style={{ padding: '8px' }}>
                                            {d.cash_handed_in ? (
                                                <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Settled</span>
                                            ) : (
                                                <span style={{ color: '#ea580c', fontWeight: 700 }}>Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!data.deliveries || data.deliveries.length === 0) && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa' }}>
                                            No deliveries assigned to this rider on this date.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={handleMarkHandedIn}
                                disabled={saving || !data.deliveries?.some(d => !d.cash_handed_in)}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '8px',
                                    background: '#18181b',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
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
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: `1px solid ${late ? '#fecaca' : '#e4e4e7'}`,
            boxShadow: late ? '0 4px 12px rgba(239,68,68,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#18181b',
                        background: '#f4f4f5',
                        padding: '2px 8px',
                        borderRadius: '6px',
                    }}>
                        {order.code}
                    </span>
                    {late && (
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#dc2626',
                            background: '#fee2e2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                        }}>
                            <AlertTriangle size={11} /> LATE
                        </span>
                    )}
                </div>

                <span style={{ fontSize: '12px', color: '#71717a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <b>{elapsedLabel(del.status_at || order.opened_at)}</b>
                </span>
            </div>

            {/* Customer Details */}
            <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#18181b' }}>
                    {order.customer_name || 'Guest Order'}
                </div>
                {order.phone && (
                    <a
                        href={`tel:${order.phone}`}
                        style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                    >
                        <Phone size={12} /> {order.phone}
                    </a>
                )}
                {order.address && (
                    <div style={{ fontSize: '13px', color: '#52525b', marginTop: '4px', display: 'flex', gap: '4px', alignItems: 'flex-start' }}>
                        <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: '#a1a1aa' }} />
                        <span>{order.address}</span>
                    </div>
                )}
                {del.note && (
                    <div style={{ fontSize: '12px', color: '#d97706', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', marginTop: '6px' }}>
                        "{del.note}"
                    </div>
                )}
            </div>

            {/* Financials & Payment Method */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#71717a', borderTop: '1px solid #f4f4f5', paddingTop: '8px' }}>
                <span>Total: <b>Rs {order.order_total}</b> {del.fee > 0 ? `(+Rs ${del.fee} fee)` : ''}</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{del.payment_method || 'Cash'}</span>
            </div>

            {/* Rider Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={14} className="text-zinc-500" />
                <select
                    value={del.rider_id || ''}
                    onChange={e => onAssignRider(order.occupancy_id, e.target.value)}
                    style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d4d4d8',
                        fontSize: '12px',
                        background: '#ffffff',
                    }}
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
                        style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d4d4d8',
                            background: '#ffffff',
                            cursor: 'pointer',
                            fontSize: '12px',
                        }}
                    >
                        {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                    </button>
                )}
            </div>

            {/* Status Actions */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {prevState && (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(order.occupancy_id, prevState)}
                        title="Move back a step"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e4e4e7',
                            background: '#f4f4f5',
                            cursor: 'pointer',
                        }}
                    >
                        <Undo2 size={14} />
                    </button>
                )}

                {nextState && (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(order.occupancy_id, nextState)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: nextState === 'delivered' ? '#10b981' : '#18181b',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }}
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
export default function Dispatch({ storeSlug, orders: initialOrders = [], riders: initialRiders = [] }) {
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

    return (
        <div style={{ minHeight: '100vh', background: '#f4f4f5', display: 'flex', flexDirection: 'column' }}>
            <Head title="Delivery Dispatch" />

            {/* Top Bar */}
            <header style={{
                background: '#18181b', color: '#ffffff', padding: '12px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800 }}>
                        <Bike size={22} className="text-orange-500" />
                        <span>Delivery Dispatch</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '12px', background: '#27272a', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                            {activeCount} active
                        </span>
                        {lateCount > 0 && (
                            <span style={{ fontSize: '12px', background: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                                {lateCount} late
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        type="button"
                        onClick={() => setShowCashUp(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#27272a', border: '1px solid #3f3f46',
                            color: '#ffffff', padding: '6px 14px', borderRadius: '8px',
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        }}
                    >
                        <Wallet size={14} />
                        <span>Rider Cash-Up</span>
                    </button>

                    <span style={{
                        fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                        color: live ? '#10b981' : '#ef4444',
                    }}>
                        {live ? <RefreshCcw size={12} /> : <WifiOff size={12} />}
                        {live ? 'Live' : 'Offline'}
                    </span>

                    <Link
                        href={route('store.tables.index', { store_slug: storeSlug })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            color: '#a1a1aa', textDecoration: 'none', fontSize: '13px',
                            padding: '6px 12px', borderRadius: '6px',
                        }}
                    >
                        <LayoutGrid size={14} /> Floor
                    </Link>
                </div>
            </header>

            {/* Board Columns */}
            <main style={{
                flex: 1, padding: '24px', display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
                overflowX: 'auto',
            }}>
                {DELIVERY_STATES.map((st) => {
                    const meta = DELIVERY_META[st];
                    const items = grouped[st] || [];
                    const Icon = meta.icon;

                    return (
                        <div key={st} style={{
                            background: '#e4e4e7', borderRadius: '14px',
                            display: 'flex', flexDirection: 'column',
                            maxHeight: 'calc(100vh - 120px)',
                        }}>
                            {/* Column Header */}
                            <div style={{
                                padding: '14px 16px', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid #d4d4d8',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '14px', color: '#18181b' }}>
                                    <Icon size={16} />
                                    <span>{meta.label}</span>
                                </div>
                                <span style={{
                                    fontSize: '12px', fontWeight: 800, background: '#ffffff',
                                    padding: '2px 8px', borderRadius: '10px', color: '#71717a',
                                }}>
                                    {items.length}
                                </span>
                            </div>

                            {/* Column Cards List */}
                            <div style={{
                                flex: 1, padding: '12px', overflowY: 'auto',
                                display: 'flex', flexDirection: 'column', gap: '12px',
                            }}>
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
                                    <div style={{
                                        textAlign: 'center', padding: '32px 16px',
                                        color: '#a1a1aa', fontSize: '13px',
                                    }}>
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
