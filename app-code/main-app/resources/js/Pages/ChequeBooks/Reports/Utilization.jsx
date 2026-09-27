import React from 'react';
import { Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    BarChart3, ArrowLeft, Building2, BookOpen
} from 'lucide-react';

export default function ChequeUtilization({ books = [] }) {
    return (
        <OneGlanceLayout>
            <Head title="Chequebook Utilization Report" />

            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('store.banking.cheque-books.index')}
                        className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 text-neutral-600 dark:text-neutral-300"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-brand-600" />
                            Chequebook Utilization & Lifecycle Report
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Monitor leaf consumption, clearance velocity, and remaining inventory across bank accounts.
                        </p>
                    </div>
                </div>

                {/* Subnavigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" />

                {/* Secondary navigation for Cheque reports */}
                <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-2">Reports:</span>
                    <Link
                        href={route('store.banking.reports.outgoing-cheques')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Outgoing Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.incoming-cheques')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Incoming Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.cheque-utilization')}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques')}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="px-6 py-3.5">Bank Account & Range</th>
                                    <th className="px-6 py-3.5 text-center">Total</th>
                                    <th className="px-6 py-3.5 text-center text-emerald-600">Available</th>
                                    <th className="px-6 py-3.5 text-center text-blue-600">Issued</th>
                                    <th className="px-6 py-3.5 text-center text-purple-600">Cleared</th>
                                    <th className="px-6 py-3.5 text-center text-red-600">Bounced</th>
                                    <th className="px-6 py-3.5 text-center text-neutral-500">Void / Stopped</th>
                                    <th className="px-6 py-3.5">Utilization Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {books && books.length > 0 ? (
                                    books.map((b) => (
                                        <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {b.bank_account?.name}
                                                </p>
                                                <p className="font-mono text-xs text-neutral-500">
                                                    {b.series_prefix ? `${b.series_prefix}-` : ''}
                                                    {String(b.start_number).padStart(b.padding_zeros || 6, '0')} ... {String(b.end_number).padStart(b.padding_zeros || 6, '0')}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-center font-bold text-neutral-900 dark:text-neutral-100">
                                                {b.total_leaves_count}
                                            </td>

                                            <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                                                {b.available_leaves_count}
                                            </td>

                                            <td className="px-6 py-4 text-center font-semibold text-blue-600">
                                                {b.issued_leaves_count}
                                            </td>

                                            <td className="px-6 py-4 text-center font-semibold text-purple-600">
                                                {b.cleared_leaves_count}
                                            </td>

                                            <td className="px-6 py-4 text-center font-semibold text-red-600">
                                                {b.bounced_leaves_count}
                                            </td>

                                            <td className="px-6 py-4 text-center font-semibold text-neutral-500">
                                                {(b.void_leaves_count || 0) + (b.stopped_leaves_count || 0)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="w-40">
                                                    <div className="flex justify-between text-xs font-semibold mb-1 text-neutral-700 dark:text-neutral-300">
                                                        <span>{b.used_leaves_count} / {b.total_leaves_count}</span>
                                                        <span>{b.utilization_percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${
                                                                b.utilization_percentage >= 90 ? 'bg-amber-500' : 'bg-brand-600'
                                                            }`}
                                                            style={{ width: `${b.utilization_percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-neutral-400">
                                            No chequebooks registered yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
