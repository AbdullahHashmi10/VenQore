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
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <RefreshCcw className="w-6 h-6 text-indigo-500" />
                            Refund Reasons Summary
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Breakdown of sales returns and refund reasons across your store.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 font-bold uppercase">
                                <th className="p-4">Refund Reason</th>
                                <th className="p-4 text-center">Total Returns</th>
                                <th className="p-4 text-right">Total Refunded</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {reasons.length > 0 ? (
                                reasons.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                                            {item.refund_reason || 'Unspecified Reason'}
                                        </td>
                                        <td className="p-4 text-center font-bold text-slate-600 dark:text-slate-400">
                                            {item.count}
                                        </td>
                                        <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {formatCurrency(item.total_amount || 0, store)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 mb-2 text-slate-300 dark:text-slate-600" />
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
