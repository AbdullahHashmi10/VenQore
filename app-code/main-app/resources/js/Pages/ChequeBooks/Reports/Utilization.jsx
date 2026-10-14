import React from 'react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { useChequeReportNavGroups, ToolbarDate } from '@/Components/ChequeReportNav';
import {
    BarChart3, ArrowLeft, Building2, BookOpen
} from 'lucide-react';

export default function ChequeUtilization({ books = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const navGroups = useChequeReportNavGroups();

    return (
        <OneGlanceLayout title="Chequebook Utilization" activeMenu="Money" noPadding>
            <Head title="Chequebook Utilization" />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:flex max-md:flex-col max-md:h-full max-md:bg-app max-md:p-2 max-md:gap-1 max-md:overflow-hidden">
                <ListToolbar title="Chequebook Utilization" navGroups={navGroups} activeId="utilization" />
                <ListStatCards cards={[
                    { label: 'Chequebooks', value: (books || []).length, icon: BookOpen },
                    { label: 'Total leaves', value: (books || []).reduce((a, b) => a + Number(b.total_leaves_count || 0), 0), icon: BookOpen },
                    { label: 'Available', value: (books || []).reduce((a, b) => a + Number(b.available_leaves_count || 0), 0), icon: BookOpen, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Used', value: (books || []).reduce((a, b) => a + Number(b.used_leaves_count || 0), 0), icon: BarChart3, icon_tone: 'bg-blue-50 text-blue-600' },
                ]} />
                <MobileListHeader title="Chequebook Utilization" navGroups={navGroups} activeId="utilization" />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Chequebooks', value: (books || []).length, tone: 'ink', icon: BookOpen },
                    { label: 'Total leaves', value: (books || []).reduce((a, b) => a + Number(b.total_leaves_count || 0), 0), tone: 'ink', icon: BookOpen },
                    { label: 'Available', value: (books || []).reduce((a, b) => a + Number(b.available_leaves_count || 0), 0), tone: 'emerald', icon: BookOpen },
                    { label: 'Used', value: (books || []).reduce((a, b) => a + Number(b.used_leaves_count || 0), 0), tone: 'blue', icon: BarChart3 },
                ]} />

                {/* Line 3: Full Width Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <div className="overflow-x-auto md:overflow-visible">
                        <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700 md:sticky md:top-0 md:z-10">
                                <tr>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Bank Account & Range</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center">Total</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center text-emerald-600">Available</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center text-blue-600">Issued</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center text-purple-600">Cleared</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center text-red-600">Bounced</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5 text-center text-neutral-500">Void / Stopped</th>
                                    <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3.5">Utilization Rate</th>
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
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
