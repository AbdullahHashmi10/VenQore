import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import DualStatCard from '@/Components/DualStatCard';
import ChartSection from '@/Components/ChartSection';
import RightPanel from '@/Components/RightPanel';
import {
    TrendingUp,
    CreditCard,
    Wallet,
    MoreHorizontal,
    Activity,
    ChevronDown
} from 'lucide-react';
import PremiumDropdown from '@/Components/PremiumDropdown';
import TodaysOpportunities from '@/Components/TodaysOpportunities';

export default function Dashboard({
    performance,
    outstanding,
    netProfit,
    salesData,
    topSellingItems,
    lowStockItems,
    recentTransactions,
    plSummary,
    bankAccounts,
    cashAccounts,
    cashData,
    inventoryValue
}) {
    const { auth, store } = usePage().props;
    const isAdmin = auth?.user?.role === 'platform_admin' || auth?.user?.role === 'admin' || auth?.user?.role === 'owner';

    const [profitView, setProfitView] = useState('Month');
    const [performancePeriod, setPerformancePeriod] = useState('Today');
    const [outstandingPeriod, setOutstandingPeriod] = useState('Month');
    const [netProfitPeriod, setNetProfitPeriod] = useState('Month');

    const currentProfit = plSummary[profitView] || { income: 0, expense: 0, profit: 0, status: 'good' };

    return (
        <OneGlanceLayout activeMenu="Dashboard">
            <Head title="Dashboard" />
            <div className="grid grid-cols-12 grid-rows-6 gap-6 h-[calc(100vh-5rem)] w-full animate-in fade-in duration-500 pt-2 pb-2 pr-2">

                {/* --- Row 1: High Level Stats (Top Left) --- */}
                <div id="tour-performance" className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1">
                    <DualStatCard
                        title="Performance"
                        leftLabel="Sales" leftValue={formatCurrency(parseFloat(performance[performancePeriod]?.sales || 0))}
                        rightLabel="Gross Profit" rightValue={formatCurrency(parseFloat(performance[performancePeriod]?.gross_profit || 0))}
                        icon={TrendingUp}
                        colorClass="bg-indigo-500"
                        delay={0}
                        period={performancePeriod}
                        onPeriodChange={setPerformancePeriod}
                        onLeftClick={() => router.visit(route('store.sales.index', { store_slug: store?.slug }))}
                        onRightClick={() => router.visit(route('store.reports.dashboard', { store_slug: store?.slug }))}
                    />
                </div>
                <div id="tour-outstanding" className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1">
                    <DualStatCard
                        title="Outstanding"
                        leftLabel="To Receive" leftValue={formatCurrency(parseFloat(outstanding[outstandingPeriod]?.receivables || 0))}
                        rightLabel="To Pay" rightValue={formatCurrency(parseFloat(outstanding[outstandingPeriod]?.payables || 0))}
                        icon={CreditCard}
                        colorClass="bg-orange-500"
                        delay={100}
                        period={outstandingPeriod}
                        onPeriodChange={setOutstandingPeriod}
                        onLeftClick={() => router.visit(route('store.finance.receivables', { store_slug: store?.slug }))}
                        onRightClick={() => router.visit(route('store.finance.payables', { store_slug: store?.slug }))}
                    />
                </div>
                <div id="tour-net-profit" className="col-span-12 md:col-span-6 lg:col-span-3 row-span-1">
                    {/* Quick Profit Check */}
                    <div
                        onClick={() => router.visit(route('store.reports.profit-loss', { store_slug: store?.slug }))}
                        className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-4 h-full relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
                    >
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="flex justify-between items-center relative z-10 w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl shadow-sm">
                                    <Wallet size={20} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-wide">Net Profit</span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <PremiumDropdown
                                    value={netProfitPeriod}
                                    onChange={setNetProfitPeriod}
                                    options={[
                                        { value: 'Today', label: 'Today' },
                                        { value: 'Month', label: 'Month' },
                                        { value: 'Year', label: 'Year' },
                                        { value: 'All Time', label: 'All Time' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="grid grid-cols-2 gap-4 relative">
                                {/* Vertical Divider */}
                                <div className="absolute left-1/2 top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800 -translate-x-1/2"></div>

                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Current Status</p>
                                    <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{netProfit[netProfitPeriod]?.status || 'N/A'}</h2>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none">{formatCurrency(parseFloat(netProfit[netProfitPeriod]?.value || 0))}</p>
                                    <p className="text-[10px] font-bold text-emerald-500 mt-1">{netProfit[netProfitPeriod]?.growth || ''}</p>
                                    {/* Breakdown Explanation */}
                                    <div className="flex gap-2 justify-center mt-1 text-[9px] font-medium opacity-80">
                                        <span className="text-emerald-600 dark:text-emerald-400" title="Income">In: {formatCurrency(netProfit[netProfitPeriod]?.income || 0)}</span>
                                        <span className="text-red-500" title="Expense">Ex: {formatCurrency(netProfit[netProfitPeriod]?.expense || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL (Spans entire height on Desktop) --- */}
                <div id="tour-right-panel" className="hidden lg:block col-span-3 row-span-6 h-full">
                    <RightPanel
                        recentTransactions={recentTransactions}
                        bankAccounts={bankAccounts}
                        cashAccounts={cashAccounts}
                        cashData={cashData}
                        inventoryValue={inventoryValue}
                    />
                </div>

                {/* --- MIDDLE: Sales Chart & Opportunities --- */}
                <div id="tour-sales-chart" className={`col-span-12 ${isAdmin ? 'lg:col-span-6' : 'lg:col-span-9'} row-span-3 min-h-0`}>
                    <ChartSection salesData={salesData} />
                </div>

                {isAdmin && (
                    <div id="tour-opportunities" className="col-span-12 lg:col-span-3 row-span-3 h-full min-h-0 flex flex-col">
                        <TodaysOpportunities className="flex-1" />
                    </div>
                )}

                {/* --- BOTTOM: Tables (Bottom Left) --- */}

                {/* Top Selling Items */}
                <div id="tour-top-products" className="col-span-12 md:col-span-8 lg:col-span-6 row-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0 group">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full"></div>
                            Top Products
                        </h3>
                        <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"><MoreHorizontal size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="pb-3 pl-2">Product</th>
                                    <th className="pb-3 text-center">Volume</th>
                                    <th className="pb-3 text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSellingItems.map((item, i) => (
                                    <tr key={i} className="group/row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-default rounded-xl">
                                        <td className="py-3 pl-2 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-200 dark:border-slate-700 group-hover/row:scale-110 transition-transform">
                                                    {item.image}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm text-center font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs">{item.sold}</span>
                                        </td>
                                        <td className="py-3 pr-2 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-800/50 group-last/row:border-none">
                                            {item.revenue}
                                        </td>
                                    </tr>
                                ))}
                                {topSellingItems.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">No sales data yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* LOW STOCK ITEMS */}
                <div id="tour-low-stock" className="col-span-12 md:col-span-4 lg:col-span-3 row-span-2 h-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-red-500 rounded-full"></div>
                            Low Stock Alerts
                        </h3>
                        <button className="text-xs text-indigo-600 font-medium hover:underline">View All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar space-y-3">
                        {lowStockItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-32">{item.name}</p>
                                    <p className="text-[10px] text-red-500 font-bold">Stock: {item.stock} / {item.alert}</p>
                                </div>
                                <button
                                    onClick={() => router.visit(route('store.purchases.create', { store_slug: store?.slug, product_id: item.id }))}
                                    className="px-2 py-1 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 hover:text-indigo-600"
                                >
                                    Order
                                </button>
                            </div>
                        ))}
                        {lowStockItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <span className="text-2xl">✅</span>
                                <p className="text-xs mt-2">Stock levels are healthy</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </OneGlanceLayout>
    );
}
