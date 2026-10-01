import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { RefreshCcw, FileText } from 'lucide-react';

export default function RefundReasons({ reasons = [] }) {
    const { props } = usePage();
    const store = props.store || {};

    return (
        <OneGlanceLayout title="Refund Reasons Report" activeMenu="Reports">
            <Head title="Refund Reasons Report" />

            <div className="space-y-6 p-4">
                <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-line shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                            <RefreshCcw className="w-6 h-6 text-brand-500" />
                            Refund Reasons Summary
                        </h2>
                        <p className="text-xs text-ink-muted mt-1">
                            Breakdown of sales returns and refund reasons across your store.
                        </p>
                    </div>
                </div>

                <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-app border-b border-line text-xs text-ink-muted font-bold uppercase">
                                <th className="p-4">Refund Reason</th>
                                <th className="p-4 text-center">Total Returns</th>
                                <th className="p-4 text-right">Total Refunded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {reasons.length > 0 ? (
                                reasons.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
                                        <td className="p-4 font-semibold text-ink">
                                            {item.refund_reason || 'Unspecified Reason'}
                                        </td>
                                        <td className="p-4 text-center font-bold text-ink-secondary">
                                            {item.count}
                                        </td>
                                        <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(item.total_amount || 0, store)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-ink-muted">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 mb-2 text-neutral-300 dark:text-ink-secondary" />
                                            <p className="font-semibold">No refund records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
