import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { getCurrencySymbol } from '@/Utils/format';
import {
    Calendar, ArrowLeft, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

const formatCurrency = (val) =>
    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));

export default function PostDatedCheques({ outgoing = [], incoming = [] }) {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'outgoing' | 'incoming'

    const totalOutgoing = outgoing.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const totalIncoming = incoming.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    return (
        <OneGlanceLayout>
            <Head title="Post-Dated Cheques (PDC) Schedule" />

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
                            <Calendar className="w-6 h-6 text-brand-600" />
                            Post-Dated Cheques (PDC) Schedule
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Upcoming liquidity commitments and receivables maturing in the future.
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
                        className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    >
                        Chequebook Utilization
                    </Link>
                    <Link
                        href={route('store.banking.reports.post-dated-cheques')}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                    >
                        Post-Dated Cheques
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-blue-200 dark:border-blue-800/40 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4" /> Outgoing PDCs (Due to Vendors)
                            </p>
                            <p className="text-2xl font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                                {formatCurrency(totalOutgoing)}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">{outgoing.length} cheques pending maturity</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-800/40 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <ArrowDownLeft className="w-4 h-4" /> Incoming PDCs (Due from Customers)
                            </p>
                            <p className="text-2xl font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                                {formatCurrency(totalIncoming)}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">{incoming.length} cheques awaiting deposit/clearance</p>
                        </div>
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
