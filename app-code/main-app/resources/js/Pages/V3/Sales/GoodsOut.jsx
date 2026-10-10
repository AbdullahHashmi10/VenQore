import React, { useState, useMemo } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    PackageMinus, 
    Search, 
    Calendar, 
    Truck, 
    Building2, 
    CheckCircle2, 
    ArrowLeft, 
    FileText, 
    Hash, 
    AlertCircle,
    Boxes,
    Navigation
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { fireToast } from '@/lib/approval-response';
import axios from 'axios';

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function GoodsOut({ pendingSales = [], selectedSaleId = null, warehouses = [], availability = {} }) {
    const { store, settings } = usePage().props;
    const currency = getCurrencySymbol(store || settings);

    const [selectedId, setSelectedId] = useState(selectedSaleId || (pendingSales[0]?.id || ''));
    const [searchQuery, setSearchQuery] = useState('');
    const [carrierName, setCarrierName] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [linesState, setLinesState] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [warehouseId, setWarehouseId] = useState('');

    // Filter pending sales
    const filteredSales = useMemo(() => {
        if (!searchQuery.trim()) return pendingSales;
        const q = searchQuery.toLowerCase();
        return pendingSales.filter(s => 
            (s.reference_number && s.reference_number.toLowerCase().includes(q)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(q))
        );
    }, [pendingSales, searchQuery]);

    const activeSale = useMemo(() => {
        return pendingSales.find(s => String(s.id) === String(selectedId)) || null;
    }, [pendingSales, selectedId]);

    // Dispatch from the invoice's warehouse unless the user picks another one.
    const dispatchWarehouseId = warehouseId || activeSale?.warehouse_id || warehouses[0]?.id || '';
    const stockHere = (productId) => num(availability?.[productId]?.[dispatchWarehouseId]);

    // Initialize line quantities when activeSale changes
    const items = useMemo(() => {
        if (!activeSale) return [];
        return (activeSale.items || []).map(i => {
            const invoiced = num(i.quantity);
            const delivered = num(i.delivered_qty);
            const remaining = Math.max(0, invoiced - delivered);
            const userLine = linesState[i.id] || {};
            return {
                ...i,
                invoiced_qty: invoiced,
                delivered_qty: delivered,
                remaining_qty: remaining,
                dispatching_qty: userLine.dispatching_qty !== undefined ? userLine.dispatching_qty : remaining,
            };
        });
    }, [activeSale, linesState]);

    const handleLineChange = (itemId, field, value) => {
        setLinesState(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || {}),
                [field]: value
            }
        }));
    };

    const totalDispatchValue = useMemo(() => {
        return items.reduce((sum, it) => sum + (num(it.dispatching_qty) * num(it.unit_price)), 0);
    }, [items]);

    const totalUnitsDispatching = useMemo(() => {
        return items.reduce((sum, it) => sum + num(it.dispatching_qty), 0);
    }, [items]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!activeSale) return;

        const payloadItems = items
            .filter(i => num(i.dispatching_qty) > 0)
            .map(i => ({
                sale_item_id: i.id,
                dispatching_qty: num(i.dispatching_qty),
            }));

        if (payloadItems.length === 0) {
            fireToast('Please specify a dispatch quantity for at least one item.', 'warning');
            return;
        }

        // Validate over-dispatching
        const overLine = items.find(i => num(i.dispatching_qty) > i.remaining_qty + 0.0001);
        if (overLine) {
            fireToast(`Cannot dispatch more than ${overLine.remaining_qty} remaining units for ${overLine.product_name}.`, 'error');
            return;
        }

        setSubmitting(true);
        const url = route('store.sales.dispatch.store', { store_slug: store?.slug, sale: activeSale.id });

        axios.post(url, {
            items: payloadItems,
            warehouse_id: dispatchWarehouseId || null,
            carrier_name: carrierName || null,
            tracking_number: trackingNumber || null,
            notes: notes || null
        })
        .then(res => {
            const msg = res.data?.message || 'Goods delivery dispatched and stock deducted successfully!';
            fireToast(msg, 'success');
            if (res.data?.challan_url) window.open(res.data.challan_url, '_blank');
            router.visit(route('store.sales.index', { store_slug: store?.slug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || 'Failed to record goods dispatch.';
            fireToast(msg, 'error');
            setSubmitting(false);
        });
    };

    return (
        <OneGlanceLayout title="Goods Out · Delivery Dispatch">
            <Head title="Goods Out · Dispatch Goods" />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <PackageMinus size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-ink">Goods Out (Dispatch Deliveries)</h1>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/20">
                                    GDN · Outward Flow
                                </span>
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Dispatch goods against sales invoices and backorders
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('store.sales.index', { store_slug: store?.slug })}
                        className="px-3.5 py-1.5 rounded-xl border border-line text-xs font-semibold text-ink-secondary hover:bg-interactive-hover transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft size={14} /> Back to Sales
                    </Link>
                </div>

                {pendingSales.length === 0 ? (
                    <div className="p-5 sm:p-12 text-center bg-surface border border-line rounded-2xl space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 mx-auto flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-base font-bold text-ink">All Sales Invoices are Fully Dispatched</h3>
                        <p className="text-xs text-ink-muted max-w-md mx-auto">
                            There are currently no sales orders waiting for delivery. When an invoice is created with "Deliver later" or backordered items, it will appear here for dispatch.
                        </p>
                        <Link
                            href={route('store.sales.invoice.create', { store_slug: store?.slug })}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs mt-2"
                        >
                            + Create Sales Invoice
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Left Column: Pending Sales Selector (Span 4) */}
                        <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-4 space-y-4 shadow-xs">
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-y-2 mb-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                                        Pending Deliveries ({filteredSales.length})
                                    </h3>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search invoice or customer..."
                                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-app border border-line text-ink outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                {filteredSales.map(s => {
                                    const isSelected = String(s.id) === String(selectedId);
                                    const itemCount = s.items?.length || 0;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedId(s.id);
                                                setLinesState({});
                                            }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                                isSelected
                                                    ? 'bg-indigo-500/10 border-indigo-500 text-ink shadow-2xs ring-1 ring-indigo-500/30'
                                                    : 'bg-app border-line hover:border-ink-muted text-ink-secondary'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-xs text-ink line-clamp-1">
                                                    {s.customer_name || 'Walk-in Customer'}
                                                </span>
                                                <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-surface border border-line text-ink-muted shrink-0">
                                                    #{s.reference_number || 'INV'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between gap-y-2 text-2xs text-ink-muted mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} /> {s.created_at ? s.created_at.slice(0, 10) : 'Today'}
                                                </span>
                                                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Active Sale Dispatch Form (Span 8) */}
                        <div className="lg:col-span-8 bg-surface rounded-2xl border border-line p-6 space-y-6 shadow-xs">
                            {activeSale ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Active Sale Summary Banner */}
                                    <div className="p-4 rounded-xl bg-sunken border border-line flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <span className="text-3xs uppercase font-bold text-ink-muted block">Selected Customer</span>
                                            <h2 className="text-base font-bold text-ink">
                                                {activeSale.customer_name || 'Walk-in Customer'}
                                            </h2>
                                            <p className="text-xs text-ink-muted flex items-center gap-2 mt-0.5 font-mono">
                                                <span>Invoice: #{activeSale.reference_number || 'N/A'}</span>
                                                <span>•</span>
                                                <span>Total: {formatCurrency(activeSale.total, currency)}</span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-3xs uppercase font-bold text-ink-muted block">Dispatch Value</span>
                                            <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                                {formatCurrency(totalDispatchValue, currency)}
                                            </span>
                                            <span className="text-2xs text-ink-muted block">
                                                {totalUnitsDispatching} units departing
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-1.5">
                                            <Boxes size={14} className="text-indigo-600" /> Dispatch Line Items
                                        </h3>

                                        <div className="overflow-x-auto border border-line rounded-xl">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-sunken border-b border-line text-ink-muted uppercase text-3xs font-bold">
                                                        <th className="p-3">Product / Item</th>
                                                        <th className="p-3 text-right">Invoiced</th>
                                                        <th className="p-3 text-right">Dispatched</th>
                                                        <th className="p-3 text-right">Remaining</th>
                                                        <th className="p-3 text-right w-36 text-indigo-700 dark:text-indigo-400">Dispatching Now</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-line">
                                                    {items.map(item => (
                                                        <tr key={item.id} className="hover:bg-interactive-hover transition-colors">
                                                            <td className="p-3">
                                                                <span className="font-semibold text-ink block">{item.product_name}</span>
                                                                <span className={`text-2xs ${stockHere(item.product_id) < num(item.dispatching_qty) ? 'text-red-600' : 'text-ink-muted'}`}>In this warehouse: {stockHere(item.product_id)}</span>
                                                                <span className="text-2xs font-mono text-ink-muted">{item.sku || 'No SKU'} • {item.base_unit || 'pcs'}</span>
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-medium text-ink-muted">
                                                                {item.invoiced_qty}
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-medium text-ink-muted">
                                                                {item.delivered_qty}
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                                                {item.remaining_qty}
                                                            </td>
                                                            <td className="p-2 text-right">
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    min="0"
                                                                    max={item.remaining_qty}
                                                                    value={item.dispatching_qty}
                                                                    onChange={e => handleLineChange(item.id, 'dispatching_qty', e.target.value)}
                                                                    className="w-full text-right p-1.5 text-xs font-bold font-mono rounded-lg border border-indigo-500/40 bg-surface text-ink focus:border-indigo-500 focus:ring-1 ring-indigo-500 outline-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                <label className="block text-xs font-semibold text-ink-muted mb-1">Dispatch from warehouse</label>
                                <select value={dispatchWarehouseId} onChange={e => setWarehouseId(e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-sm">
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{w.location ? ` — ${w.location}` : ''}</option>)}
                                </select>
                            </div>
                                    {/* Logistics & Carrier Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                                                Carrier / Rider Name
                                            </label>
                                                                        <div className="relative">
                                                <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                                <input
                                                    type="text"
                                                    value={carrierName}
                                                    onChange={e => setCarrierName(e.target.value)}
                                                    placeholder="e.g. TCS, Rider John, Self Pickup"
                                                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-app border border-line text-ink outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                                                Tracking / Delivery Ref
                                            </label>
                                            <div className="relative">
                                                <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                                <input
                                                    type="text"
                                                    value={trackingNumber}
                                                    onChange={e => setTrackingNumber(e.target.value)}
                                                    placeholder="e.g. TRK-990142"
                                                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-app border border-line text-ink font-mono outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dispatch Notes */}
                                    <div>
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                                            Dispatch Notes / Remarks
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Special handling instructions, recipient signature memo..."
                                            className="w-full p-2.5 text-xs rounded-xl bg-app border border-line text-ink outline-none"
                                        />
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4 border-t border-line">
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('store.sales.index', { store_slug: store?.slug }))}
                                            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || totalUnitsDispatching <= 0}
                                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                                        >
                                            <PackageMinus size={16} />
                                            <span>{submitting ? 'Dispatching…' : 'Dispatch & Release Stock'}</span>
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-4 sm:p-8 text-center text-ink-muted text-xs">
                                    Select a pending sales invoice from the left list to dispatch goods.
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </OneGlanceLayout>
    );
}
