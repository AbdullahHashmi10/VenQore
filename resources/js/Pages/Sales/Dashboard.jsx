import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

import {
    TrendingUp,
    Users,
    ArrowRight,
    DollarSign,
    Calendar,
    Monitor,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Trophy
} from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function SalesDashboard({ stats, recentSales, salesByMethod, topSelling }) {
    const { store } = usePage().props;

    if (!stats) {
        return (
            <OneGlanceLayout title="Sell Command Center" activeMenu="Sell">
                <div className="p-10 text-center text-slate-400">Loading stats...</div>
            </OneGlanceLayout>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, subValue, trend }) => {
        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-700/30 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
                            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                        </div>
                        {trend !== undefined && trend !== 0 && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                    <h3 className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
                    <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                            {value}
                        </p>
                        {subValue && <span className="text-xs text-slate-400 font-medium ml-1">{subValue}</span>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <OneGlanceLayout title="Sell Command Center" activeMenu="Sell">
            <Head title="Sales Hub" />

            {/* Dashboard Container - Full Height, No Scroll */}
            <div className="flex flex-col h-full gap-4 pb-2 overflow-hidden">

                {/* 1. Header & Pulse (Auto Height) */}
                <div className="shrink-0 space-y-4">
                    {/* Secondary Navigation */}
                    <SellModuleTabs activeTab="overview" />

                    {/* Performance Pulse */}
                    <section>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Performance Pulse</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                title="Sales Today"
                                value={formatCurrency(Number(stats.sales_today || 0), store)}
                                icon={DollarSign}
                                color="bg-emerald-500"
                                subValue={`${stats.orders_today || 0} Orders`}
                                trend={stats.sales_today_growth}
                            />
                            <StatCard
                                title="Monthly Revenue"
                                value={formatCurrency(Number(stats.sales_month || 0), store)}
                                icon={Calendar}
                                color="bg-indigo-500"
                                subValue={`${stats.orders_month || 0} Orders`}
                                trend={stats.sales_month_growth}
                            />
                            <StatCard
                                title="Avg. Order Value"
                                value={formatCurrency(Number(stats.avg_order_value || 0), store)}
                                icon={TrendingUp}
                                color="bg-blue-500"
                                trend={stats.avg_order_growth}
                            />
                            <StatCard
                                title="Active Customers"
                                value={(stats.active_customers || 0).toLocaleString()}
                                icon={Users}
                                color="bg-purple-500"
                                subValue="Last 30 Days"
                            />
                        </div>
                    </section>
                </div>

                {/* 2. Middle & Bottom Sections (Flexible Grid) */}
                <div className="flex-1 min-h-0 grid grid-rows-1 xl:grid-rows-2 gap-4">

                    {/* Top Selling & Payment Breakdown */}
                    <section className="min-h-0 grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
                        {/* Top Selling */}
                        <div className="xl:col-span-2 flex flex-col h-full min-h-0">
                            <div className="flex items-center justify-between shrink-0 mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Top Selling Today</h2>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                    {topSelling && topSelling.length > 0 ? (
                                        <div className="space-y-3">
                                            {topSelling.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30`}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[150px]">{item.name}</p>
                                                            <p className="text-[10px] text-slate-500">{item.qty} units</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm text-slate-800 dark:text-white">{formatCurrency(Number(item.revenue || 0), store)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center h-full flex flex-col justify-center items-center text-slate-400">
                                            <Trophy size={40} className="mb-2 opacity-20" />
                                            <p className="text-xs">No sales yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="flex flex-col h-full min-h-0">
                            <div className="flex items-center gap-2 shrink-0 mb-2">
                                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Payment Breakdown</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
                                    {salesByMethod && salesByMethod.length > 0 ? salesByMethod.map((method, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                                <span className="text-slate-500">{method.payment_method}</span>
                                                <span className="text-slate-800 dark:text-white">{formatCurrency(Number(method.total || 0), store)}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500'][idx % 3]}`}
                                                    style={{ width: `${stats.sales_month > 0 ? (method.total / stats.sales_month) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center text-slate-400 text-xs py-8">No data</div>
                                    )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 shrink-0">
                                    <MidnightNebula className="rounded-xl p-3" primaryColor="indigo" secondaryColor="purple">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white/20 rounded-lg">
                                                <TrendingUp className="text-white" size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-100 uppercase">Tip</p>
                                                <p className="text-[10px] text-white font-medium leading-tight">Digital payments bump AOV by 15%.</p>
                                            </div>
                                        </div>
                                    </MidnightNebula>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Live Feed */}
                    <section className="min-h-0 flex flex-col h-full">
                        <div className="flex items-center gap-2 shrink-0 mb-2">
                            <div className="w-1 h-6 bg-emerald-600 rounded-full"></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Live Sales Feed</h2>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-6 py-3">Reference</th>
                                            <th className="px-6 py-3">Customer</th>
                                            <th className="px-6 py-3 text-right">Amount</th>
                                            <th className="px-6 py-3 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                        {recentSales && recentSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <td className="px-6 py-3 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                                    <Link href={route('store.sales.show', { store_slug: store?.slug, sale: sale.id })} className="flex items-center gap-2">
                                                        {sale.reference_number}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium text-xs">
                                                    {sale.party ? sale.party.name : 'Walk-in Customer'}
                                                </td>
                                                <td className="px-6 py-3 text-right font-black text-slate-800 dark:text-white text-xs">
                                                    {formatCurrency(Number(sale.total), store)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter
                                                        ${sale.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            sale.payment_status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }
                                                    `}>
                                                        {sale.payment_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!recentSales || recentSales.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-xs">
                                                    No recent sales found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700 flex justify-center shrink-0 bg-white dark:bg-slate-800">
                                <Link href={route('store.sales.index', { store_slug: store?.slug })} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 hover:underline flex items-center gap-1 transition-colors">
                                    View Full History <ArrowRight size={10} />
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </OneGlanceLayout >
    );
}
