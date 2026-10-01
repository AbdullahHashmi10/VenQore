import React, { useState, useMemo } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    PackageCheck, 
    Search, 
    Calendar, 
    Truck, 
    Building2, 
    Clock, 
    CheckCircle2, 
    ArrowLeft, 
    FileText, 
    Hash, 
    AlertCircle,
    ChevronRight,
    Boxes
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { fireToast } from '@/lib/approval-response';
import axios from 'axios';

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function GoodsIn({ pendingPurchases = [], selectedPurchaseId = null }) {
    const { store, settings } = usePage().props;
    const currency = getCurrencySymbol(store || settings);

    const [selectedId, setSelectedId] = useState(selectedPurchaseId || (pendingPurchases[0]?.id || ''));
    const [searchQuery, setSearchQuery] = useState('');
    const [notes, setNotes] = useState('');
    const [linesState, setLinesState] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Filter purchases
    const filteredPurchases = useMemo(() => {
        if (!searchQuery.trim()) return pendingPurchases;
        const q = searchQuery.toLowerCase();
        return pendingPurchases.filter(p => 
            (p.invoice_number && p.invoice_number.toLowerCase().includes(q)) ||
            (p.reference && p.reference.toLowerCase().includes(q)) ||
            (p.supplier_name && p.supplier_name.toLowerCase().includes(q))
        );
    }, [pendingPurchases, searchQuery]);

    const activePurchase = useMemo(() => {
        return pendingPurchases.find(p => String(p.id) === String(selectedId)) || null;
    }, [pendingPurchases, selectedId]);

    // Initialize line quantities when activePurchase changes
    const items = useMemo(() => {
        if (!activePurchase) return [];
        return (activePurchase.items || []).map(i => {
            const ordered = num(i.qty || i.quantity);
            const received = num(i.received_qty);
            const remaining = Math.max(0, ordered - received);
            const userLine = linesState[i.id] || {};
            return {
                ...i,
                ordered_qty: ordered,
                received_qty: received,
                remaining_qty: remaining,
                receiving_qty: userLine.receiving_qty !== undefined ? userLine.receiving_qty : remaining,
                batch_number: userLine.batch_number !== undefined ? userLine.batch_number : '',
                expiry_date: userLine.expiry_date !== undefined ? userLine.expiry_date : '',
            };
        });
    }, [activePurchase, linesState]);

    const handleLineChange = (itemId, field, value) => {
        setLinesState(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || {}),
                [field]: value
            }
        }));
    };

    const totalArrivingValue = useMemo(() => {
        return items.reduce((sum, it) => sum + (num(it.receiving_qty) * num(it.unit_cost)), 0);
    }, [items]);

    const totalUnitsArriving = useMemo(() => {
        return items.reduce((sum, it) => sum + num(it.receiving_qty), 0);
    }, [items]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!activePurchase) return;

        const payloadItems = items
            .filter(i => num(i.receiving_qty) > 0)
            .map(i => ({
                purchase_item_id: i.id,
                receiving_qty: num(i.receiving_qty),
                batch_number: i.batch_number || null,
                expiry_date: i.expiry_date || null,
            }));

        if (payloadItems.length === 0) {
            fireToast('Please specify a receiving quantity for at least one item.', 'warning');
            return;
        }

        // Validate over-receiving
        const overLine = items.find(i => num(i.receiving_qty) > i.remaining_qty + 0.0001);
        if (overLine) {
            fireToast(`Cannot receive more than ${overLine.remaining_qty} remaining units for ${overLine.product_name}.`, 'error');
            return;
        }

        setSubmitting(true);
        const url = route('store.purchases.receive.store', { store_slug: store?.slug, purchase: activePurchase.id });

        axios.post(url, {
            items: payloadItems,
            notes: notes || null
        })
        .then(res => {
            const msg = res.data?.message || 'Goods received and posted to warehouse inventory successfully!';
            fireToast(msg, 'success');
            router.visit(route('store.purchases.index', { store_slug: store?.slug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || 'Failed to record goods receipt.';
            fireToast(msg, 'error');
            setSubmitting(false);
        });
    };

    return (
        <OneGlanceLayout title="Goods In · Warehouse Receipt">
            <Head title="Goods In · Receive Goods" />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-line shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                            <PackageCheck size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-ink">Goods In (Receive Shipments)</h1>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold border border-teal-500/20">
                                    GRN · Inward Flow
                                </span>
                            </div>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Receive physical stock against purchases entered in advance
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('store.purchases.index', { store_slug: store?.slug })}
                        className="px-3.5 py-1.5 rounded-xl border border-line text-xs font-semibold text-ink-secondary hover:bg-interactive-hover transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft size={14} /> Back to Purchases
                    </Link>
                </div>

                {pendingPurchases.length === 0 ? (
                    <div className="p-12 text-center bg-surface border border-line rounded-2xl space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 mx-auto flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-base font-bold text-ink">All Purchase Shipments are Fully Received</h3>
                        <p className="text-xs text-ink-muted max-w-md mx-auto">
                            There are currently no purchases waiting for physical goods arrival. When a purchase is saved with "Goods received later", it will appear here for check-in.
                        </p>
                        <Link
                            href={route('store.purchases.create', { store_slug: store?.slug })}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs mt-2"
                        >
                            + Record New Purchase
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Left Column: Pending Purchase Selector (Span 4) */}
                        <div className="lg:col-span-4 bg-surface rounded-2xl border border-line p-4 space-y-4 shadow-xs">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                                        Pending Purchases ({filteredPurchases.length})
                                    </h3>
                                </div>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search invoice or supplier..."
                                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-app border border-line text-ink outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                {filteredPurchases.map(p => {
                                    const isSelected = String(p.id) === String(selectedId);
                                    const itemCount = p.items?.length || 0;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedId(p.id);
                                                setLinesState({});
                                            }}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                                isSelected
                                                    ? 'bg-teal-500/10 border-teal-500 text-ink shadow-2xs ring-1 ring-teal-500/30'
                                                    : 'bg-app border-line hover:border-ink-muted text-ink-secondary'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-bold text-xs text-ink line-clamp-1">
                                                    {p.supplier_name || 'Supplier'}
                                                </span>
                                                <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-surface border border-line text-ink-muted shrink-0">
                                                    #{p.invoice_number || p.reference || 'PO'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-2xs text-ink-muted mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={11} /> {p.purchase_date}
                                                </span>
                                                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right Column: Active Purchase Item Receiving Table (Span 8) */}
                        <div className="lg:col-span-8 bg-surface rounded-2xl border border-line p-6 space-y-6 shadow-xs">
                            {activePurchase ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Active Purchase Summary Banner */}
                                    <div className="p-4 rounded-xl bg-sunken border border-line flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <span className="text-3xs uppercase font-bold text-ink-muted block">Selected Purchase</span>
                                            <h2 className="text-base font-bold text-ink">
                                                {activePurchase.supplier_name}
                                            </h2>
                                            <p className="text-xs text-ink-muted flex items-center gap-2 mt-0.5 font-mono">
                                                <span>Invoice: #{activePurchase.invoice_number || 'N/A'}</span>
                                                <span>•</span>
                                                <span>Date: {activePurchase.purchase_date}</span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-3xs uppercase font-bold text-ink-muted block">Arrival Value</span>
                                            <span className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
                                                {formatCurrency(totalArrivingValue, currency)}
                                            </span>
                                            <span className="text-2xs text-ink-muted block">
                                                {totalUnitsArriving} units checked in
                                            </span>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3 flex items-center gap-1.5">
                                            <Boxes size={14} className="text-teal-600" /> Receiving Line Items
                                        </h3>

                                        <div className="overflow-x-auto border border-line rounded-xl">
                                            <table className="w-full text-left text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-sunken border-b border-line text-ink-muted uppercase text-3xs font-bold">
                                                        <th className="p-3">Product / Item</th>
                                                        <th className="p-3 text-right">Ordered</th>
                                                        <th className="p-3 text-right">Received</th>
                                                        <th className="p-3 text-right">Remaining</th>
                                                        <th className="p-3 text-right w-28 text-teal-700 dark:text-teal-400">Receiving Now</th>
                                                        <th className="p-3 w-28">Batch #</th>
                                                        <th className="p-3 w-32">Expiry</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-line">
                                                    {items.map(item => (
                                                        <tr key={item.id} className="hover:bg-interactive-hover transition-colors">
                                                            <td className="p-3">
                                                                <span className="font-semibold text-ink block">{item.product_name}</span>
                                                                <span className="text-2xs font-mono text-ink-muted">{item.sku || 'No SKU'} • {item.base_unit || 'pcs'}</span>
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-medium text-ink-muted">
                                                                {item.ordered_qty}
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-medium text-ink-muted">
                                                                {item.received_qty}
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
                                                                    value={item.receiving_qty}
                                                                    onChange={e => handleLineChange(item.id, 'receiving_qty', e.target.value)}
                                                                    className="w-full text-right p-1.5 text-xs font-bold font-mono rounded-lg border border-teal-500/40 bg-surface text-ink focus:border-teal-500 focus:ring-1 ring-teal-500 outline-none"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Optional"
                                                                    value={item.batch_number}
                                                                    onChange={e => handleLineChange(item.id, 'batch_number', e.target.value)}
                                                                    className="w-full p-1.5 text-xs rounded-lg border border-line bg-surface text-ink outline-none font-mono"
                                                                />
                                                            </td>
                                                            <td className="p-2">
                                                                <input
                                                                    type="date"
                                                                    value={item.expiry_date}
                                                                    onChange={e => handleLineChange(item.id, 'expiry_date', e.target.value)}
                                                                    className="w-full p-1.5 text-xs rounded-lg border border-line bg-surface text-ink outline-none"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Arrival Notes */}
                                    <div>
                                        <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
                                            Arrival Condition / Notes
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Condition on arrival, driver remarks, packaging notes..."
                                            className="w-full p-2.5 text-xs rounded-xl bg-app border border-line text-ink outline-none"
                                        />
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-4 border-t border-line">
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('store.purchases.index', { store_slug: store?.slug }))}
                                            className="px-4 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || totalUnitsArriving <= 0}
                                            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                                        >
                                            <PackageCheck size={16} />
                                            <span>{submitting ? 'Posting Receipt…' : 'Receive & Post Stock'}</span>
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-8 text-center text-ink-muted text-xs">
                                    Select a pending purchase from the left list to receive goods.
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>
        </OneGlanceLayout>
    );
}
