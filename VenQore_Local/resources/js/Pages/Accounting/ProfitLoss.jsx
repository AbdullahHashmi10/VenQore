import React from 'react';
import { Head, Link } from '@inertiajs/react';
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
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                            <Download size={18} /> Export PDF
                        </button>
                    }
                />

                <div className="overflow-y-auto custom-scrollbar flex-1">

                    {/* Net Profit Card */}
                    <div className={`mb-8 p-8 rounded-3xl border ${netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'} flex flex-col md:flex-row justify-between items-center gap-6`}>
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl ${netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-lg`}>
                                {netProfit >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
                            </div>
                            <div>
                                <p className={`text-sm font-bold uppercase tracking-widest ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Profit</p>
                                <h3 className={`text-4xl font-black ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    Rs {netProfit.toLocaleString()}
                                </h3>
                            </div>
                        </div>
                        <div className="flex gap-8 text-right">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Income</p>
                                <p className="text-xl font-bold text-slate-700 dark:text-slate-300">Rs {totalIncome.toLocaleString()}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                                <p className="text-xl font-bold text-slate-700 dark:text-slate-300">Rs {totalExpense.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-emerald-900/5">
                                <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                    <TrendingUp size={20} />
                                    Operating Income
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {incomeAccounts.map(account => (
                                    <div key={account.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{account.name}</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Rs {parseFloat(account.balance).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Income</span>
                                    <span className="text-lg font-black text-emerald-600">Rs {totalIncome.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expense Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-900/5">
                                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                    <TrendingDown size={20} />
                                    Operating Expenses
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                {expenseAccounts.map(account => (
                                    <div key={account.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{account.name}</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Rs {parseFloat(account.balance).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Total Expenses</span>
                                    <span className="text-lg font-black text-rose-600">Rs {totalExpense.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}
