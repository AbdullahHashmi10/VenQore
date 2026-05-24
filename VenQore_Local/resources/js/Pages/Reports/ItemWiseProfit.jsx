import React, { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    TrendingUp, TrendingDown, DollarSign, ArrowLeft,
    Info, HelpCircle, AlertCircle, PieChart as PieIcon, Activity,
    Zap, Target, Lightbulb, ArrowUpRight, ShieldCheck, X, Loader2, Package
} from 'lucide-react';
import { // Recharts
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function ItemWiseProfit({ items = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const { props } = usePage();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // --- Derived Metrics ---
    const totalRevenue = items.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
    const totalProfit = items.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);
    const avgMargin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const topEarner = items.reduce((prev, current) => (prev.profit > current.profit) ? prev : current, { name: '-', profit: 0 });

    // --- Chart Data (Top 5 Items by Profit) ---
    const pieData = items
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)
        .map((item, index) => ({
            name: item.name,
            value: item.profit,
            color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][index]
        }));

    // --- Formatters ---
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    // --- Handlers ---
    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.item-wise-profit", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.item-wise-profit", {
            store_slug: store.slug
        }), {
            range: 'custom',
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true, preserveScroll: true });
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const insights = [];

            // 1. Pareto Check
            const sorted = [...items].sort((a, b) => b.profit - a.profit);
            const top20Count = Math.ceil(items.length * 0.2);
            const top20Profit = sorted.slice(0, top20Count).reduce((sum, i) => sum + i.profit, 0);
            const paretoRatio = totalProfit ? (top20Profit / totalProfit) * 100 : 0;

            if (paretoRatio > 70) {
                insights.push({ type: 'warning', title: 'High Dependency', text: `${paretoRatio.toFixed(0)}% of your profit comes from just ${top20Count} items. Diversify your best-sellers.` });
            } else {
                insights.push({ type: 'success', title: 'Balanced Portfolio', text: 'Your profit is well-distributed across your catalog.' });
            }

            // 2. Loss Leaders
            const lossMakers = items.filter(i => i.profit < 0);
            if (lossMakers.length > 0) {
                insights.push({ type: 'danger', title: 'Bleeding Assets', text: `${lossMakers.length} items are selling at a loss. Review pricing immediately.` });
            }

            // 3. Margin Opportunities
            const lowMarginHighVol = items.filter(i => (i.profit / i.revenue) < 0.05 && i.revenue > (totalRevenue / items.length));
            if (lowMarginHighVol.length > 0) {
                insights.push({ type: 'opportunity', title: 'Price Optimization', text: `${lowMarginHighVol.length} high-volume items have margins below 5%. A small price increase here creates massive pure profit.` });
            }

            setAnalysisResult({
                score: Math.min(100, Math.max(0, 50 + (parseFloat(avgMargin) * 2) - (lossMakers.length * 5))),
                insights
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <ReportsLayout title="Item-wise Profit Report">
            <Head title="Item Profitability" />
            <div className="flex flex-col h-full gap-4 w-full relative">

                {/* 1. Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route("store.reports.index", {
                            store_slug: store.slug
                        })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                Profit <span className="text-slate-400 font-medium text-sm">By Item</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Product-level profitability analysis</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[{ id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {range === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" />
                                <span className="text-slate-400 text-xs font-bold">TO</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" />
                                <button onClick={applyCustomRange} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">Apply</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <RatioCard title="Total Revenue" value={formatCurrency(totalRevenue)} subtitle={`${items.length} Items Sold`} color="blue" icon={<DollarSign />} />
                    <RatioCard title="Total Profit" value={formatCurrency(totalProfit)} subtitle={`${avgMargin}% Avg Margin`} color={totalProfit >= 0 ? "emerald" : "rose"} icon={<TrendingUp />} />
                    <RatioCard title="Top Earner" value={topEarner.name.substring(0, 15)} subtitle={formatCurrency(topEarner.profit)} color="indigo" icon={<Target />} />
                    <RatioCard title="Active Catalog" value={items.length} subtitle="Items with sales" color="amber" icon={<Package />} />
                </div>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">

                    {/* LEFT COL: Table */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Profit Breakdown</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Product Name</th>
                                        <th className="px-6 py-3 text-right font-bold">Revenue</th>
                                        <th className="px-6 py-3 text-right font-bold">Profit</th>
                                        <th className="px-6 py-3 text-right font-bold">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {items.map((item, idx) => {
                                        const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                                                <td className="px-6 py-3 text-right text-slate-500 font-mono">{formatCurrency(item.revenue)}</td>
                                                <td className={`px-6 py-3 text-right font-bold font-mono ${item.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                    {formatCurrency(item.profit)}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${margin > 20 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                        {margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COL: Visuals */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-h-[300px] flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <PieIcon size={14} /> Profit Contribution
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="200" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <RechartsTooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold opacity-90 mb-2 flex items-center gap-2">
                                    <HelpCircle size={14} /> Strategy Tip
                                </h3>
                                <div className="text-xs opacity-80 leading-relaxed space-y-2">
                                    <p>Your Top Earner <strong>{topEarner.name}</strong> is generating significant cash flow.</p>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300">
                                        <ShieldCheck size={14} /> Keep in Stock
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Growth Engine */}
                    <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <h3 className="text-base font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400">
                                <Zap size={18} fill="currentColor" /> Growth Engine
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2"><Target size={12} /> Optimization</h4>
                                    <p className="text-[11px] text-slate-300 mobile-relaxed">Run the AI analyzer to detect margin leaks and find hidden pricing opportunities in your catalog.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2"><Lightbulb size={12} /> Insight</h4>
                                    <p className="text-[11px] text-slate-300">Identify "Loss Leaders" that are draining your overall profitability.</p>
                                </div>
                            </div>

                            <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait">
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                {isAnalyzing ? 'Analyzing Item Data...' : 'Run Item Analysis'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analysis Modal */}
                {analysisResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md"><Activity size={24} /></div>
                                        <button onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Catalog Intelligence</h2>
                                    <p className="text-indigo-200 text-sm font-medium">Efficiency Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {analysisResult.insights.map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border-l-4 ${insight.type === 'danger' ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10 text-rose-700' : insight.type === 'warning' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/10 text-amber-700' : insight.type === 'success' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10 text-emerald-700' : 'bg-slate-50 border-indigo-500 dark:bg-slate-800 text-slate-700'}`}>
                                        <h4 className="text-sm font-bold mb-1">{insight.title}</h4>
                                        <p className="text-xs opacity-80">{insight.text}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}
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
