import React from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { Head, Link, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import PageHeader from '@/Components/PageHeader';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Download,
    PieChart,
    ArrowRight
} from 'lucide-react';

export default function ProfitLoss({ incomeAccounts, expenseAccounts, totalIncome, totalExpense, netProfit }) {
    const { store } = usePage().props;
    return (
        <ReportsLayout title="Profit & Loss Statement">
            <Head title="Profit & Loss" />

            <div className="h-full flex flex-col gap-6 p-6 overflow-hidden">

                <PageHeader
                    title="Profit & Loss"
                    subtitle="Income and expenses summary"
                    icon={PieChart}
                    breadcrumbs={[
                        { label: 'Money' },
                        { label: 'Accounting' },
                        { label: 'Profit & Loss' }
                    ]}
                    actions={
                        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-xl font-bold text-ink-secondary hover:bg-interactive-hover transition-all shadow-sm">
                            <Download size={18} /> Export PDF
                        </button>
                    }
                />

                <div className="overflow-y-auto custom-scrollbar flex-1">

                    {/* Net Profit Card */}
                    <div className={`mb-8 p-8 rounded-2xl border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'} flex flex-col md:flex-row justify-between items-center gap-6`}>
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-lg`}>
                                {netProfit >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                            </div>
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-widest ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Profit</p>
                                <h3 className={`text-4xl font-bold ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {getCurrencySymbol()} {netProfit.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                        <div className="flex gap-8 text-right">
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Income</p>
                                <p className="text-xl font-bold text-ink-secondary">{getCurrencySymbol()} {totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="w-px h-10 bg-sunken"></div>
                            <div>
                                <p className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Total Expenses</p>
                                <p className="text-xl font-bold text-ink-secondary">{getCurrencySymbol()} {totalExpense.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Section */}
                        <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-line bg-emerald-50/30 dark:bg-emerald-900/5">
                                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Operating Income
                                </h3>
                            </div>
                            <div className="divide-y divide-line">
                                {incomeAccounts.map(account => (
                                    <div key={account.id} className="p-4 flex justify-between items-center hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                        <span className="text-sm font-bold text-ink-secondary">{account.name}</span>
                                        <span className="text-sm font-bold text-ink">{getCurrencySymbol()} {parseFloat(account.balance).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="p-6 bg-app flex justify-between items-center">
                                    <span className="text-sm font-bold text-ink uppercase tracking-widest">Total Income</span>
                                    <span className="text-lg font-bold text-emerald-600">{getCurrencySymbol()} {totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Section */}
                        <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-line bg-rose-50/30 dark:bg-rose-900/5">
                                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                    <TrendingDown size={20} />
                                    Operating Expenses
                                </h3>
                            </div>
                            <div className="divide-y divide-line">
                                {expenseAccounts.map(account => (
                                    <div key={account.id} className="p-4 flex justify-between items-center hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                        <span className="text-sm font-bold text-ink-secondary">{account.name}</span>
                                        <span className="text-sm font-bold text-ink">{getCurrencySymbol()} {parseFloat(account.balance).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="p-6 bg-app flex justify-between items-center">
                                    <span className="text-sm font-bold text-ink uppercase tracking-widest">Total Expenses</span>
                                    <span className="text-lg font-bold text-rose-600">{getCurrencySymbol()} {totalExpense.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}
