import React, { useState } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    TrendingUp, DollarSign, ArrowLeft, PieChart as PieIcon,
    ChevronDown, ChevronRight, Users, Package, Layers
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

export default function CategoryProfitability({ data = [], filters = {} }) {
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [expandedCategory, setExpandedCategory] = useState(null);

    const applyDateRange = () => {
        router.get(route('store.reports.item-category-wise-profit-loss', { store_slug: store.slug }), {
            start_date: startDate,
            end_date: endDate,
        }, { preserveState: true, preserveScroll: true });
    };

    const totalRevenue = data.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
    const totalProfit = data.reduce((sum, r) => sum + (parseFloat(r.profit) || 0), 0);
    const avgMargin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const topCategory = data.reduce((prev, cur) => ((cur.profit || 0) > (prev.profit || 0) ? cur : prev), { name: '-', profit: 0 });

    const pieData = [...data]
        .sort((a, b) => (b.profit || 0) - (a.profit || 0))
        .slice(0, 5)
        .map((r, i) => ({
            name: r.name,
            value: r.profit,
            color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i],
        }));

    return (
        <ReportsLayout title="Category Profitability">
            <Head title="Category Profitability" />
            <div className="flex flex-col h-full gap-4 w-full">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route('store.reports.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                Profit <span className="text-slate-400 font-medium text-sm">By Category</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Category-level profitability, purchases, stock value, and customer detail</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" />
                        <span className="text-slate-400 text-xs font-bold">TO</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" />
                        <button onClick={applyDateRange} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">Apply</button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <RatioCard title="Total Revenue" value={formatCurrency(totalRevenue, store)} subtitle={`${data.length} Categories`} color="blue" icon={<DollarSign />} />
                    <RatioCard title="Total Profit" value={formatCurrency(totalProfit, store)} subtitle={`${avgMargin}% Avg Margin`} color={totalProfit >= 0 ? 'emerald' : 'rose'} icon={<TrendingUp />} />
                    <RatioCard title="Top Category" value={(topCategory.name || '-').substring(0, 18)} subtitle={formatCurrency(topCategory.profit || 0, store)} color="indigo" icon={<Layers />} />
                    <RatioCard title="Total Stock Value" value={formatCurrency(data.reduce((s, r) => s + (r.stock_value || 0), 0), store)} subtitle="Across all categories" color="amber" icon={<Package />} />
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Category Breakdown</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold w-8"></th>
                                        <th className="px-6 py-3 font-bold">Category</th>
                                        <th className="px-6 py-3 text-right font-bold">Revenue</th>
                                        <th className="px-6 py-3 text-right font-bold">Profit</th>
                                        <th className="px-6 py-3 text-right font-bold">Margin</th>
                                        <th className="px-6 py-3 text-right font-bold">Purchases</th>
                                        <th className="px-6 py-3 text-right font-bold">Stock Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {data.map((row, idx) => {
                                        const isExpanded = expandedCategory === (row.category_id ?? idx);
                                        const customers = row.customers || [];
                                        const cogs = (row.revenue || 0) - (row.profit || 0);
                                        return (
                                            <React.Fragment key={row.category_id ?? idx}>
                                                <tr
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                                    onClick={() => setExpandedCategory(isExpanded ? null : (row.category_id ?? idx))}
                                                >
                                                    <td className="px-6 py-3 text-slate-400">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                                                    <td className="px-6 py-3 text-right text-slate-500 font-mono">{formatCurrency(row.revenue, store)}</td>
                                                    <td className={`px-6 py-3 text-right font-bold font-mono ${row.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                        {formatCurrency(row.profit, store)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(row.margin || 0) > 20 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                            {(row.margin || 0).toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-500 font-mono">{formatCurrency(row.purchase_cost || 0, store)}</td>
                                                    <td className="px-6 py-3 text-right text-slate-500 font-mono">{formatCurrency(row.stock_value || 0, store)}</td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/20">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                {/* Per-Category P&L Statement */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                                                                        <DollarSign size={14} /> Profit &amp; Loss Statement
                                                                        <span className="text-slate-400 font-normal normal-case">— {row.name}, for the selected period</span>
                                                                    </div>
                                                                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                                        <table className="w-full text-xs">
                                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                <tr>
                                                                                    <td className="py-2 px-4 text-slate-500">Revenue (net of returns)</td>
                                                                                    <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-200">{formatCurrency(row.revenue, store)}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="py-2 px-4 text-slate-500">Less: Cost of Goods Sold (FIFO)</td>
                                                                                    <td className="py-2 px-4 text-right font-mono text-rose-500">({formatCurrency(cogs, store)})</td>
                                                                                </tr>
                                                                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                                                    <td className="py-2 px-4 font-bold text-slate-700 dark:text-slate-200">Gross Profit</td>
                                                                                    <td className={`py-2 px-4 text-right font-mono font-bold ${row.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(row.profit, store)}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="py-2 px-4 text-slate-500">Gross Margin</td>
                                                                                    <td className="py-2 px-4 text-right font-mono text-slate-700 dark:text-slate-200">{(row.margin || 0).toFixed(1)}%</td>
                                                                                </tr>
                                                                                <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                                                                                    <td className="py-2 px-4 text-slate-400 italic">Purchases in period (reference)</td>
                                                                                    <td className="py-2 px-4 text-right font-mono text-slate-400">{formatCurrency(row.purchase_cost || 0, store)}</td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td className="py-2 px-4 text-slate-400 italic">Current stock value (reference)</td>
                                                                                    <td className="py-2 px-4 text-right font-mono text-slate-400">{formatCurrency(row.stock_value || 0, store)}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {/* Customer Purchase Detail */}
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                                                                        <Users size={14} /> Top Customers in This Category
                                                                        <span className="text-slate-400 font-normal normal-case">— who bought from it, how often, and how much</span>
                                                                    </div>
                                                                    {customers.length === 0 ? (
                                                                        <p className="text-xs text-slate-400 italic">No customer-attributed purchases in this period.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-xs">
                                                                                <thead className="text-slate-400 uppercase">
                                                                                    <tr>
                                                                                        <th className="text-left py-1 pr-4 font-bold">Customer</th>
                                                                                        <th className="text-right py-1 pr-4 font-bold">Times Purchased</th>
                                                                                        <th className="text-right py-1 pr-4 font-bold">Qty Bought</th>
                                                                                        <th className="text-right py-1 font-bold">Total Spent</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                                    {customers.map((c, ci) => (
                                                                                        <tr key={ci}>
                                                                                            <td className="py-1.5 pr-4 font-medium text-slate-600 dark:text-slate-300">{c.party_name}</td>
                                                                                            <td className="py-1.5 pr-4 text-right text-slate-500">{c.purchase_count}</td>
                                                                                            <td className="py-1.5 pr-4 text-right text-slate-500">{c.total_qty}</td>
                                                                                            <td className="py-1.5 text-right font-mono text-slate-600 dark:text-slate-300">{formatCurrency(c.total_spent, store)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <PieIcon size={14} /> Profit Contribution by Category
                        </h3>
                        <div className="flex-1 relative min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}

function RatioCard({ title, value, subtitle, color, icon }) {
    const colors = { indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2"><div className={`p-2 rounded-lg ${colors[color]} shrink-0`}>{React.cloneElement(icon, { size: 18 })}</div></div>
            <div><p className="text-xs font-bold text-slate-500 uppercase">{title}</p><h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight my-1">{value}</h3><p className="text-xs font-medium text-slate-400">{subtitle}</p></div>
        </div>
    );
}
