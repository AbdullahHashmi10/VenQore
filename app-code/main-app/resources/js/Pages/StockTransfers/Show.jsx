import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    ClipboardList,
    User,
    Store,
    ArrowRight,
    Truck,
    CheckCircle,
    Clock
} from 'lucide-react';

export default function Show({ transfer }) {
    const { store } = usePage().props;
    if (!transfer) return null;

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };

    const statusIcons = {
        pending: Clock,
        in_progress: Truck,
        completed: CheckCircle,
    };

    const StatusIcon = statusIcons[transfer.status] || Clock;

    return (
        <OneGlanceLayout title={`Stock Transfer #${transfer.reference_number || transfer.id}`} activeMenu="Stock">
            <Head title={`Transfer #${transfer.reference_number || transfer.id}`} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('store.stock-transfers.index', { store_slug: store.slug })}
                            className="p-2 rounded-xl bg-surface border border-line hover:bg-interactive-hover transition-colors"
                        >
                            <ArrowLeft size={20} className="text-ink-muted" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-ink">
                                    Stock Transfer #{transfer.reference_number}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[transfer.status] || 'bg-sunken'}`}>
                                    <StatusIcon size={14} />
                                    {transfer.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-ink-muted">
                                Created on {new Date(transfer.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transfer Route */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* From/To Card */}
                    <div className="col-span-2 bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Truck size={120} />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-ink-muted uppercase mb-2">From Origin</p>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600">
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-ink">
                                            {transfer.from_warehouse?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-ink-muted">Source Warehouse</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 flex flex-col items-center justify-center text-neutral-300">
                                <ArrowRight size={32} />
                                <span className="text-xs font-bold uppercase mt-1">Transfer</span>
                            </div>

                            <div className="flex-1 text-right">
                                <p className="text-xs font-bold text-ink-muted uppercase mb-2">To Destination</p>
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-ink">
                                            {transfer.to_warehouse?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-ink-muted">Target Warehouse</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                                        <Store size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-surface p-6 rounded-2xl border border-line shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-app rounded-lg text-ink-muted">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase">Transfer Date</p>
                                <p className="font-bold text-ink">{transfer.transfer_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-app rounded-lg text-ink-muted">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase">Initiated By</p>
                                <p className="font-bold text-ink">{transfer.creator?.name || 'System'}</p>
                            </div>
                        </div>
                        {transfer.completed_at && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-ink-muted uppercase">Completed At</p>
                                    <p className="font-bold text-ink">{new Date(transfer.completed_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-line">
                        <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                            <ClipboardList size={20} className="text-brand-500" />
                            Transferred Items
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-app text-ink-muted font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-left">SKU / Code</th>
                                    <th className="px-6 py-4 text-right">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {transfer.items?.map((item) => (
                                    <tr key={item.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                        <td className="px-6 py-4 font-bold text-ink">
                                            {item.product?.name || 'Unknown Product'}
                                        </td>
                                        <td className="px-6 py-4 text-ink-muted font-mono text-xs">
                                            {item.product?.code || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/10">
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-app border-t border-line">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-right font-bold text-ink-muted uppercase text-xs">Total Quantity</td>
                                    <td className="px-6 py-4 text-right font-bold text-ink">
                                        {transfer.items?.reduce((sum, item) => sum + Number(item.quantity), 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Notes */}
                {transfer.notes && (
                    <div className="bg-app p-6 rounded-2xl border border-line">
                        <h3 className="text-sm font-bold text-ink-muted uppercase mb-2">Notes</h3>
                        <p className="text-ink-secondary italic">{transfer.notes}</p>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
