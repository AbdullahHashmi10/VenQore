import React from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { DollarSign, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function SalesAnalytics({ revenue, counts, topProducts, chartData }) {
    return (
        <OneGlanceLayout title="Sales Analytics" activeMenu="Sell">
            <Head title="Sales Analytics" />

            <div className="flex flex-col h-full">
                <SellModuleTabs activeTab="analytics" />

                <div className="pb-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Today's Revenue</p>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(revenue.today)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                {counts.today} sales today
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">This Week</p>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(revenue.week)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                {counts.week} sales this week
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">This Month</p>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(revenue.month)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                {counts.month} sales this month
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(revenue.total)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                Lifetime sales revenue
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart Section (Simplified Visualization) */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Revenue Trend (Last 7 Days)</h3>
                            <div className="h-64 flex items-end justify-between gap-2">
                                {chartData.map((data, index) => {
                                    const maxRevenue = Math.max(...chartData.map(d => parseFloat(d.revenue)));
                                    const heightPercentage = maxRevenue > 0 ? (parseFloat(data.revenue) / maxRevenue) * 100 : 0;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full flex justify-center">
                                                <div
                                                    className="w-full max-w-[40px] bg-indigo-500 rounded-t-lg transition-all duration-500 group-hover:bg-indigo-600"
                                                    style={{ height: `${Math.max(heightPercentage, 2)}%` }} // Min height for visibility
                                                ></div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                                    {formatCurrency(data.revenue)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">{data.date}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Top Selling Products</h3>
                            <div className="space-y-4">
                                {topProducts.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-white truncate">{item.product.name}</p>
                                            <p className="text-xs text-slate-500">{item.total_qty} units sold</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(item.total_revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <p className="text-center text-slate-400 py-4">No sales data yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
