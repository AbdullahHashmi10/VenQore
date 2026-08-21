import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency, formatDate } from '@/Utils/format';
import { ArrowLeft, Beaker, Package, Layers, Wallet } from 'lucide-react';

const statusColors = {
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    reversed: 'bg-neutral-200 text-ink-secondary dark:bg-raised dark:text-ink-secondary',
};

export default function ProductionRunShow({ run, materials = [], outputBatch = null }) {
    const { store } = usePage().props;
    const totalMaterialCost = materials.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0);

    return (
        <OneGlanceLayout title={`Production Run #${run?.run_number || run?.id || ''}`} activeMenu="Stock">
            <Head title={`Production Run #${run?.run_number || run?.id || ''}`} />

            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="p-2 text-ink-muted hover:text-ink-secondary rounded-lg">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-ink">Production Run #{run?.run_number || run?.id}</h1>
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[run?.status] || 'bg-sunken text-ink-secondary'}`}>
                        {run?.status?.replace('_', ' ')}
                    </span>
                </div>

                {/* Summary */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Product</p>
                            <p className="text-lg font-bold text-ink">{run?.product?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Total Cost</p>
                            <p className="text-2xl font-bold text-ink">{formatCurrency(run?.total_cost, store)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-6 border-t border-line">
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Date</p>
                            <p className="text-sm font-medium text-ink">{formatDate(run?.date, store)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Planned Qty</p>
                            <p className="text-sm font-medium text-ink">{run?.planned_qty ?? run?.quantity ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Actual Qty</p>
                            <p className="text-sm font-medium text-ink">{run?.actual_qty ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Material / Labor</p>
                            <p className="text-sm font-medium text-ink">
                                {formatCurrency(run?.material_cost, store)} / {formatCurrency(run?.labor_cost, store)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* WIP Balance */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Wallet size={16} /> Work-In-Progress Balance
                    </h3>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-ink-muted">
                            {run?.status === 'completed'
                                ? 'This run has been completed — WIP was closed out to the finished-goods batch below.'
                                : 'This run is still in progress — material and labor costs are held in WIP until completion.'}
                        </p>
                        <p className={`text-xl font-bold ${parseFloat(run?.wip_balance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {formatCurrency(run?.wip_balance, store)}
                        </p>
                    </div>
                </div>

                {/* BOM Consumption */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Beaker size={16} /> Raw Materials Consumed
                    </h3>
                    {materials.length === 0 ? (
                        <p className="text-sm text-ink-muted">No BOM consumption records found for this run.</p>
                    ) : (
                        <>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider">
                                        <th className="py-2">Raw Material</th>
                                        <th className="py-2 text-right">Qty Deducted</th>
                                        <th className="py-2 text-right">Unit Cost</th>
                                        <th className="py-2 text-right">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {materials.map((m) => (
                                        <tr key={m.id}>
                                            <td className="py-3 font-medium text-ink">{m.product_name}</td>
                                            <td className="py-3 text-right text-ink-secondary">{m.qty_deducted}</td>
                                            <td className="py-3 text-right text-ink-secondary">{formatCurrency(m.unit_cost, store)}</td>
                                            <td className="py-3 text-right font-medium text-ink">{formatCurrency(m.total_cost, store)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end mt-4 pt-4 border-t border-line text-sm">
                                <span className="text-ink-muted mr-2">Total Material Cost:</span>
                                <span className="font-bold text-ink">{formatCurrency(totalMaterialCost, store)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Output Batch */}
                <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                    <h3 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package size={16} /> Finished Goods Output
                    </h3>
                    {outputBatch ? (
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Qty Produced</p>
                                <p className="text-sm font-medium text-ink">{outputBatch.remaining_qty ?? outputBatch.original_qty}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Layers size={12} /> Computed Unit Cost
                                </p>
                                <p className="text-sm font-medium text-ink">{formatCurrency(outputBatch.unit_cost, store)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-1">Batch Created</p>
                                <p className="text-sm font-medium text-ink">{formatDate(outputBatch.created_at, store)}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-muted">
                            No finished-goods batch has been created yet — this run has not been completed.
                        </p>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
