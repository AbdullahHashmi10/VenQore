import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    ClipboardList,
    User,
    Store,
    FileText
} from 'lucide-react';

export default function Show({ audit }) {
    if (!audit) return null;

    const statusColors = {
        draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    };

    return (
        <OneGlanceLayout title={`Stock Audit #${audit.reference_number || audit.id}`} activeMenu="Stock">
            <Head title={`Audit #${audit.reference_number || audit.id}`} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('store.stock-takes.index', { store_slug: store.slug })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    Stock Audit #{audit.reference_number || audit.id}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColors[audit.status] || 'bg-slate-100'}`}>
                                    {audit.status}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Created on {new Date(audit.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Details Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Warehouse Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                                <Store size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Warehouse</p>
                                <p className="font-bold text-slate-800 dark:text-white">{audit.warehouse?.name || 'Unknown'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Audit Date</p>
                                <p className="font-bold text-slate-800 dark:text-white">{audit.date}</p>
                            </div>
                        </div>
                    </div>

                    {/* Creator Info */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Audited By</p>
                                <p className="font-bold text-slate-800 dark:text-white">{audit.creator?.name || 'System'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Notes</p>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2">
                                    {audit.notes || 'No notes provided.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{audit.items?.length || 0}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Total Items</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <p className="text-2xl font-black text-rose-500">
                                    {audit.items?.filter(i => i.difference !== 0).length || 0}
                                </p>
                                <p className="text-xs font-bold text-slate-400 uppercase">Discrepancies</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-500" />
                            Audit Results
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4 text-right">Expected</th>
                                    <th className="px-6 py-4 text-right">Counted</th>
                                    <th className="px-6 py-4 text-right">Difference</th>
                                    <th className="px-6 py-4 text-right">Cost Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {audit.items?.map((item) => {
                                    const diff = parseFloat(item.difference);
                                    const diffColor = diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-500' : 'text-rose-500';
                                    const impact = diff * (item.cost_price || 0);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                {item.product?.name || 'Unknown Product'}
                                                <span className="block text-xs text-slate-400 font-mono mt-0.5">
                                                    {item.product?.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500">
                                                {parseFloat(item.expected_quantity)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200">
                                                {parseFloat(item.counted_quantity)}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${diffColor}`}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-mono ${diff === 0 ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {impact === 0 ? '-' : (impact > 0 ? `+${impact.toFixed(2)}` : impact.toFixed(2))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
