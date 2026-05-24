import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import { usePage, Head, Link } from '@inertiajs/react';
import { BookOpen, TrendingUp, TrendingDown, DollarSign, ArrowRight, PieChart, Activity } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import MidnightNebula from '@/Components/MidnightNebula';

export default function AccountingDashboard({ stats, recentTransactions }) {
    const { store } = usePage().props;
    const StatCard = ({ title, value, icon: Icon, color, subValue, subLabel }) => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {subValue && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${Number(subValue) >= 0 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                        {subLabel}: {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left">
                {formatCurrency(Number(value), store)}
            </p>
        </div>
    );

    return (
        <OneGlanceLayout title="Accounting Dashboard" activeMenu="Money">
            <Head title="Accounting Dashboard" />

            <div className="space-y-6">
                <MoneyModuleTabs activeTab="accounting" />
                <PageHeader
                    title="Accounting Dashboard"
                    subtitle="Financial overview and reports"
                    icon={PieChart}
                    breadcrumbs={[
                        { label: 'Money' },
                        { label: 'Accounting' }
                    ]}
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Assets"
                        value={stats.total_assets}
                        icon={DollarSign}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Total Liabilities"
                        value={stats.total_liabilities}
                        icon={TrendingDown}
                        color="bg-red-500"
                    />
                    <StatCard
                        title="Total Equity"
                        value={stats.total_equity}
                        icon={PieChart}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Net Profit"
                        value={stats.net_profit}
                        icon={TrendingUp}
                        color="bg-indigo-500"
                        subValue={stats.total_income}
                        subLabel="Income"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-500" />
                                Recent Transactions
                            </h3>
                            <Link href={route('store.accounting.index', { store_slug: store.slug })} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                View Chart of Accounts
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Date</th>
                                        <th className="px-6 py-4 font-medium">Description</th>
                                        <th className="px-6 py-4 font-medium">Reference</th>
                                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {recentTransactions.length > 0 ? (
                                        recentTransactions.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                    {new Date(entry.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                                    {entry.description}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                    {entry.reference || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">
                                                    {/* Display total debit as amount for simplicity */}
                                                    {formatCurrency(Number(entry.items.reduce((sum, item) => sum + Number(item.debit), 0)), store)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                                                No recent transactions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <MidnightNebula className="rounded-2xl p-6 shadow-xl h-full" primaryColor="blue" secondaryColor="indigo">
                        <h3 className="font-bold text-xl mb-2 text-white">Quick Actions</h3>
                        <p className="text-blue-100 mb-6 text-sm">Manage your finances.</p>

                        <div className="space-y-3">
                            <Link href={route('store.accounting.index', { store_slug: store.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Chart of Accounts</span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link href={route('store.accounting.pnl', { store_slug: store.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Profit & Loss</span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link href={route('store.accounting.balance-sheet', { store_slug: store.slug })} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10 text-white">
                                <span className="font-medium">Balance Sheet</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </MidnightNebula>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
