import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatDate } from '@/Utils/format';
import { ArrowLeft, Warehouse, CheckCircle2, ShoppingCart, RotateCcw, AlertTriangle, ArrowRightLeft, History } from 'lucide-react';

const statusConfig = {
    available: { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    sold: { label: 'Sold', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: ShoppingCart },
    returned: { label: 'Returned', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: RotateCcw },
    defective: { label: 'Defective', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
    transfer: { label: 'In Transfer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: ArrowRightLeft },
};

export default function SerialShow({ serial }) {
    const { store } = usePage().props;
    const status = statusConfig[serial?.status] || statusConfig.available;
    const StatusIcon = status.icon;

    // Movement history: there is no dedicated serial_movements/audit table for
    // ProductSerial — only created_at (received into stock) and the current
    // status/sale_id are tracked. We build a best-effort timeline from what
    // actually exists rather than fabricating intermediate events.
    const timeline = [
        { label: 'Received into stock', date: serial?.created_at, detail: serial?.warehouse?.name ? `Warehouse: ${serial.warehouse.name}` : null },
    ];
    if (serial?.status === 'sold' && serial?.sale) {
        timeline.push({ label: 'Sold', date: serial?.updated_at, detail: `Invoice #${serial.sale.reference_number || serial.sale.id}` });
    } else if (serial?.status === 'returned') {
        timeline.push({ label: 'Returned', date: serial?.updated_at, detail: null });
    } else if (serial?.status === 'defective') {
        timeline.push({ label: 'Marked defective', date: serial?.updated_at, detail: serial?.notes });
    } else if (serial?.status === 'transfer') {
        timeline.push({ label: 'In transfer', date: serial?.updated_at, detail: null });
    }

    return (
        <OneGlanceLayout title={`Serial #${serial?.serial_number || serial?.id || ''}`} activeMenu="Stock">
            <Head title={`Serial #${serial?.serial_number || serial?.id || ''}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Serial: {serial?.serial_number || serial?.id}</h1>
                </div>

                {/* Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{serial?.product?.name || 'N/A'}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase px-3 py-1.5 rounded-full ${status.color}`}>
                            <StatusIcon size={14} /> {status.label}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Warehouse size={12} /> Current Location
                            </p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{serial?.warehouse?.name || 'Unassigned'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Origin Purchase</p>
                            {/* TODO: ProductSerial.purchase_id references purchase_orders, but the
                                model's purchase() relation targets the "purchases" table (mismatch) —
                                showing the raw id only, no live link, to avoid pointing at the wrong record. */}
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {serial?.purchase_id ? `PO #${serial.purchase_id}` : 'Not recorded'}
                            </p>
                        </div>
                    </div>

                    {serial?.sale && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sold On Invoice</p>
                            <Link
                                href={route('store.sales.show', { store_slug: store?.slug, sale: serial.sale_id })}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                {serial.sale.reference_number || `Sale #${serial.sale_id}`}
                                {serial.sale.customer?.name ? ` — ${serial.sale.customer.name}` : ''} →
                            </Link>
                        </div>
                    )}

                    {serial?.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{serial.notes}</p>
                        </div>
                    )}
                </div>

                {/* Movement History */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <History size={16} /> Movement History
                    </h3>
                    {/* TODO: no dedicated serial-movement ledger table exists yet — this timeline
                        is inferred from product_serials.created_at/updated_at + current status/sale,
                        not from a granular per-event audit log. */}
                    <div className="space-y-4">
                        {timeline.map((event, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1.5" />
                                    {idx < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
                                </div>
                                <div className="pb-4">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{event.label}</p>
                                    <p className="text-xs text-slate-500">{formatDate(event.date, store)}</p>
                                    {event.detail && <p className="text-xs text-slate-500 mt-0.5">{event.detail}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
