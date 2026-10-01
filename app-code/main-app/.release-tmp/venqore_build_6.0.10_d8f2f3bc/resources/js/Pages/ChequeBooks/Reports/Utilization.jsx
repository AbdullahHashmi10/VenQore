import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    BarChart3, ArrowLeft, Building2, BookOpen
} from 'lucide-react';

export default function ChequeUtilization({ books = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;

    return (
        <OneGlanceLayout title="Chequebook Utilization" activeMenu="Money">
            <Head title="Chequebook Utilization" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                {/* Line 1: Module Navigation Tabs */}
                <MoneyModuleTabs activeTab="cheque-books" className="!mb-0" />

                {/* Line 2: Reports Sub-nav pills */}
                <div className="bg-surface px-3 py-1.5 rounded-xl border border-line shadow-sm flex items-center gap-2 overflow-x-auto shrink-0">
                    <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted shrink-0">Reports:</span>
                    <Link
                        href={route('store.banking.reports.outgoing-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Outgoing Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.incoming-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Incoming Register
                    </Link>
                    <Link
                        href={route('store.banking.reports.cheque-utilization', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Line 3: Full Width Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
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
