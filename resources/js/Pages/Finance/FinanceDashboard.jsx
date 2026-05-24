import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Building2,
    History,
    Users,
    TrendingUp,
    ChevronRight,
    DollarSign
} from 'lucide-react';

export default function FinanceIndex({ stats, topReceivables, topPayables, recentEntries }) {
    const { store } = usePage().props;
    const statCards = [
        {
            title: 'Cash on Hand',
            value: stats.cash,
            icon: Wallet,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-100 dark:border-emerald-800'
        },
        {
            title: 'Bank Balance',
            value: stats.bank,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800'
        },
        {
            title: 'Total Receivables',
            value: stats.receivables,
            icon: ArrowDownLeft,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            border: 'border-indigo-100 dark:border-indigo-800',
            link: route('store.finance.receivables', { store_slug: store?.slug })
        },
        {
            title: 'Total Payables',
            value: stats.payables,
            icon: ArrowUpRight,
            color: 'text-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-100 dark:border-rose-800',
            link: route('store.finance.payables', { store_slug: store?.slug })
        }
    ];

    return (
        <OneGlanceLayout title="Finance Overview" activeMenu="Money">
            <Head title="Finance Overview" />

            <div className="p-6 h-full overflow-y-auto custom-scrollbar">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card, i) => (
                        <div key={i} className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border ${card.border} shadow-sm hover:shadow-md transition-all group`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                                    <card.icon size={24} />
                                </div>
                                {card.link && (
                                    <Link href={card.link} className="text-slate-400 hover:text-indigo-500 transition-colors">
                                        <ChevronRight size={20} />
                                    </Link>
                                )}
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{card.title}</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(card.value, store)}
                            </h3>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <History size={20} className="text-indigo-500" />
                                    Recent Transactions
                                </h3>
                                <Link href={route('store.accounting.index', { store_slug: store?.slug })} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                                    View Ledger
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {recentEntries.length > 0 ? recentEntries.map((entry) => (
                                    <div key={entry.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{entry.description || 'No description'}</p>
                                                <p className="text-xs text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(entry.items.reduce((sum, item) => sum + parseFloat(item.debit), 0), store)}
                                                </p>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Amount</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {entry.items.map((item, idx) => (
                                                <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    {item.account.name}: {parseFloat(item.debit) > 0 ? `Dr ${formatCurrency(parseFloat(item.debit), store)}` : `Cr ${formatCurrency(parseFloat(item.credit), store)}`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-12 text-center text-slate-400">
                                        No recent transactions found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Panels */}
                    <div className="space-y-8">
                        {/* Top Receivables */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <ArrowDownLeft size={20} className="text-indigo-500" />
                                    Top Receivables
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {topReceivables.length > 0 ? topReceivables.map((party) => (
                                    <div key={party.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-bold">
                                                {party.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{party.name}</p>
                                                <p className="text-xs text-slate-500">Customer</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-indigo-600">{formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-4">No pending receivables.</p>
                                )}
                                <Link href={route('store.finance.receivables', { store_slug: store?.slug })} className="block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors border-t border-slate-50 dark:border-slate-800 mt-2 pt-4">
                                    View All Receivables
                                </Link>
                            </div>
                        </div>

                        {/* Top Payables */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <ArrowUpRight size={20} className="text-rose-500" />
                                    Top Payables
                                </h3>
                            </div>
                            <div className="p-4 space-y-4">
                                {topPayables.length > 0 ? topPayables.map((party) => (
                                    <div key={party.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 font-bold">
                                                {party.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">{party.name}</p>
                                                <p className="text-xs text-slate-500">Supplier</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-rose-600">{formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 text-center py-4">No pending payables.</p>
                                )}
                                <Link href={route('store.finance.payables', { store_slug: store?.slug })} className="block w-full text-center py-2 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors border-t border-slate-50 dark:border-slate-800 mt-2 pt-4">
                                    View All Payables
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
