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
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Stock Transfer #{transfer.reference_number}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[transfer.status] || 'bg-slate-100'}`}>
                                    <StatusIcon size={14} />
                                    {transfer.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Created on {new Date(transfer.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transfer Route */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* From/To Card */}
                    <div className="col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Truck size={120} />
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">From Origin</p>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-slate-800 dark:text-white">
                                            {transfer.from_warehouse?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-slate-500">Source Warehouse</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 flex flex-col items-center justify-center text-slate-300">
                                <ArrowRight size={32} />
                                <span className="text-xs font-bold uppercase mt-1">Transfer</span>
                            </div>

                            <div className="flex-1 text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">To Destination</p>
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-slate-800 dark:text-white">
                                            {transfer.to_warehouse?.name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-slate-500">Target Warehouse</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                                        <Store size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Transfer Date</p>
                                <p className="font-bold text-slate-800 dark:text-white">{transfer.transfer_date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Initiated By</p>
                                <p className="font-bold text-slate-800 dark:text-white">{transfer.creator?.name || 'System'}</p>
                            </div>
                        </div>
                        {transfer.completed_at && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Completed At</p>
                                    <p className="font-bold text-slate-800 dark:text-white">{new Date(transfer.completed_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-500" />
                            Transferred Items
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-left">SKU / Code</th>
                                    <th className="px-6 py-4 text-right">Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {transfer.items?.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {item.product?.name || 'Unknown Product'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {item.product?.code || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10">
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-right font-bold text-slate-500 uppercase text-xs">Total Quantity</td>
                                    <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white">
                                        {transfer.items?.reduce((sum, item) => sum + Number(item.quantity), 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Notes */}
                {transfer.notes && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Notes</h3>
                        <p className="text-slate-700 dark:text-slate-300 italic">{transfer.notes}</p>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
