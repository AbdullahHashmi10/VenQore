import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Beaker, Package, Layers, Wallet } from 'lucide-react';

const statusColors = {
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    reversed: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function ProductionRunShow({ run, materials = [], outputBatch = null }) {
    const { store } = usePage().props;
    const totalMaterialCost = materials.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0);

    return (
        <OneGlanceLayout title={`Production Run #${run?.run_number || run?.id || ''}`} activeMenu="Stock">
            <Head title={`Production Run #${run?.run_number || run?.id || ''}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Production Run #{run?.run_number || run?.id}</h1>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[run?.status] || 'bg-slate-100 text-slate-600'}`}>
                        {run?.status?.replace('_', ' ')}
                    </span>
                </div>

                {/* Summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{run?.product?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cost</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(run?.total_cost, store)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(run?.date, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Planned Qty</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{run?.planned_qty ?? run?.quantity ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Actual Qty</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">{run?.actual_qty ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Material / Labor</p>
                            <p className="text-sm font-medium text-slate-800 dark:text-white">
                                {formatCurrency(run?.material_cost, store)} / {formatCurrency(run?.labor_cost, store)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* WIP Balance */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Wallet size={16} /> Work-In-Progress Balance
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            {run?.status === 'completed'
                                ? 'This run has been completed — WIP was closed out to the finished-goods batch below.'
                                : 'This run is still in progress — material and labor costs are held in WIP until completion.'}
                        </p>
                        <p className={`text-xl font-black ${parseFloat(run?.wip_balance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatCurrency(run?.wip_balance, store)}
                        </p>
                    </div>
                </div>

                {/* BOM Consumption */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Beaker size={16} /> Raw Materials Consumed
                    </h3>
                    {materials.length === 0 ? (
                        <p className="text-sm text-slate-500">No BOM consumption records found for this run.</p>
                    ) : (
                        <>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="py-2">Raw Material</th>
                                        <th className="py-2 text-right">Qty Deducted</th>
                                        <th className="py-2 text-right">Unit Cost</th>
                                        <th className="py-2 text-right">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {materials.map((m) => (
                                        <tr key={m.id}>
                                            <td className="py-3 font-medium text-slate-800 dark:text-white">{m.product_name}</td>
                                            <td className="py-3 text-right text-slate-600 dark:text-slate-300">{m.qty_deducted}</td>
                                            <td className="py-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(m.unit_cost, store)}</td>
                                            <td className="py-3 text-right font-medium text-slate-800 dark:text-white">{formatCurrency(m.total_cost, store)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                                <span className="text-slate-500 mr-2">Total Material Cost:</span>
                                <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(totalMaterialCost, store)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Output Batch */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package size={16} /> Finished Goods Output
                    </h3>
                    {outputBatch ? (
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Qty Produced</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{outputBatch.remaining_qty ?? outputBatch.original_qty}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Layers size={12} /> Computed Unit Cost
                                </p>
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{formatCurrency(outputBatch.unit_cost, store)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Created</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-white">{formatDate(outputBatch.created_at, store)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">
                            No finished-goods batch has been created yet — this run has not been completed.
                        </p>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
