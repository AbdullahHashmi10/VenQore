import React, { useState } from 'react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { useChequeReportNavGroups } from '@/Components/ChequeReportNav';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import {
    Calendar, ArrowLeft, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export default function PostDatedCheques({ outgoing = [], incoming = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const navGroups = useChequeReportNavGroups();
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'outgoing' | 'incoming'

    const totalOutgoing = outgoing.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const totalIncoming = incoming.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    return (
        <OneGlanceLayout title="Post-Dated Cheques" activeMenu="Money" noPadding>
            <Head title="Post-Dated Cheques" />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:flex max-md:flex-col max-md:h-full max-md:bg-app max-md:p-2 max-md:gap-1 max-md:overflow-hidden">
                <ListToolbar
                    title="Post-Dated Cheques"
                    navGroups={navGroups}
                    activeId="post-dated"
                    left={<ListFilterPill label="All Upcoming" value={activeTab} allValue="all" onChange={setActiveTab} options={[
                        { value: 'all', label: `All Upcoming (${outgoing.length + incoming.length})` },
                        { value: 'outgoing', label: `Outgoing (${outgoing.length})` },
                        { value: 'incoming', label: `Incoming (${incoming.length})` },
                    ]} />}
                />
                <ListStatCards cards={[
                    { label: 'Outgoing PDCs', value: formatCurrency(totalOutgoing), icon: ArrowUpRight, icon_tone: 'bg-blue-50 text-blue-600' },
                    { label: 'Outgoing cheques', value: outgoing.length, icon: ArrowUpRight, icon_tone: 'bg-blue-50 text-blue-600' },
                    { label: 'Incoming PDCs', value: formatCurrency(totalIncoming), icon: ArrowDownLeft, icon_tone: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Incoming cheques', value: incoming.length, icon: ArrowDownLeft, icon_tone: 'bg-emerald-50 text-emerald-600' },
                ]} />
                <MobileListHeader
                    title="Post-Dated Cheques"
                    navGroups={navGroups}
                    activeId="post-dated"
                    filter={{
                        active: activeTab !== 'all',
                        sections: [{ label: 'Show', value: activeTab, options: [{ value: 'all', label: `All Upcoming (${outgoing.length + incoming.length})` }, { value: 'outgoing', label: `Outgoing (${outgoing.length})` }, { value: 'incoming', label: `Incoming (${incoming.length})` }], onSelect: setActiveTab }],
                    }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Outgoing PDCs', value: formatCurrency(totalOutgoing), tone: 'blue', icon: ArrowUpRight },
                    { label: 'Incoming PDCs', value: formatCurrency(totalIncoming), tone: 'emerald', icon: ArrowDownLeft },
                    { label: 'Outgoing cheques', value: outgoing.length, tone: 'blue', icon: ArrowUpRight },
                    { label: 'Incoming cheques', value: incoming.length, tone: 'emerald', icon: ArrowDownLeft },
                ]} />

                {/* Tables */}
                <div className="max-md:contents md:flex-1 md:min-h-0 md:overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm md:bg-surface md:p-3 md:space-y-2">
                {(activeTab === 'all' || activeTab === 'outgoing') && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <ArrowUpRight className="w-4 h-4 text-blue-600" /> Outgoing Post-Dated Cheques
                        </h3>
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Cheque Number</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Bank Account</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Payee</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Maturity Date</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {outgoing.length > 0 ? (
                                        outgoing.map((o) => (
                                            <tr key={o.id} className="hover:bg-neutral-50">
                                                <td className="px-6 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">{o.display_serial_number}</td>
                                                <td className="px-6 py-3.5 text-xs">{o.bank_account?.name}</td>
                                                <td className="px-6 py-3.5 font-semibold text-neutral-900 dark:text-neutral-100">{o.party?.name || '—'}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-blue-600 font-bold">{o.cheque_date}</td>
                                                <td className="px-6 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(o.amount)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="px-6 py-4 text-center text-neutral-400">No outgoing post-dated cheques</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {(activeTab === 'all' || activeTab === 'incoming') && (
                    <div className="space-y-2 pt-4">
                        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Incoming Post-Dated Cheques
                        </h3>
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Cheque Number</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Drawer Bank</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Customer</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3">Maturity Date</th>
                                        <th className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900 px-6 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {incoming.length > 0 ? (
                                        incoming.map((i) => (
                                            <tr key={i.id} className="hover:bg-neutral-50">
                                                <td className="px-6 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">#{i.cheque_number}</td>
                                                <td className="px-6 py-3.5 text-xs">{i.bank_name}</td>
                                                <td className="px-6 py-3.5 font-semibold text-neutral-900 dark:text-neutral-100">{i.party?.name || 'Walk-in'}</td>
                                                <td className="px-6 py-3.5 font-mono text-xs text-emerald-600 font-bold">{i.cheque_date}</td>
                                                <td className="px-6 py-3.5 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(i.amount)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" className="px-6 py-4 text-center text-neutral-400">No incoming post-dated cheques</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                </div>
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
