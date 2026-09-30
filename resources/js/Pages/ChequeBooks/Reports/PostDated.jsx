import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import {
    Calendar, ArrowLeft, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export default function PostDatedCheques({ outgoing = [], incoming = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'outgoing' | 'incoming'

    const totalOutgoing = outgoing.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const totalIncoming = incoming.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    return (
        <OneGlanceLayout title="Post-Dated Cheques" activeMenu="Money">
            <Head title="Post-Dated Cheques" />

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
                        className="px-3 py-1 text-xs font-bold rounded-lg text-ink-muted hover:bg-interactive-hover shrink-0"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques', { store_slug: storeSlug })}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shrink-0"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Line 3: 2 Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                                <ArrowUpRight size={14} /> Outgoing PDCs (Vendor Obligations)
                            </p>
                            <p className="text-base font-bold text-ink mt-0.5">{formatCurrency(totalOutgoing)}</p>
                        </div>
                        <span className="text-xs font-bold text-ink-muted">{outgoing.length} cheques</span>
                    </div>

                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-2xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                                <ArrowDownLeft size={14} /> Incoming PDCs (Customer Receivables)
                            </p>
                            <p className="text-base font-bold text-ink mt-0.5">{formatCurrency(totalIncoming)}</p>
                        </div>
                        <span className="text-xs font-bold text-ink-muted">{incoming.length} cheques</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-700">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'all'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        All Upcoming ({outgoing.length + incoming.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'outgoing'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        Outgoing ({outgoing.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeTab === 'incoming'
                                ? 'border-brand-600 text-brand-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                    >
                        Incoming ({incoming.length})
                    </button>
                </div>

                {/* Tables */}
                {(activeTab === 'all' || activeTab === 'outgoing') && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                            <ArrowUpRight className="w-4 h-4 text-blue-600" /> Outgoing Post-Dated Cheques
                        </h3>
                        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="px-6 py-3">Cheque Number</th>
                                        <th className="px-6 py-3">Bank Account</th>
                                        <th className="px-6 py-3">Payee</th>
                                        <th className="px-6 py-3">Maturity Date</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
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
                                        <th className="px-6 py-3">Cheque Number</th>
                                        <th className="px-6 py-3">Drawer Bank</th>
                                        <th className="px-6 py-3">Customer</th>
                                        <th className="px-6 py-3">Maturity Date</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
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
        </OneGlanceLayout>
    );
}
