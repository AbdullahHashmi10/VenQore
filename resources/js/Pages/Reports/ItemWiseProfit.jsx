import React, { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    TrendingUp, TrendingDown, DollarSign, ArrowLeft,
    Info, HelpCircle, AlertCircle, PieChart as PieIcon, Activity,
    Zap, Target, Lightbulb, ArrowUpRight, ShieldCheck, X, Loader2, Package,
    ChevronDown, ChevronRight, Users, ShoppingBag
} from 'lucide-react';
import { // Recharts
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

export default function ItemWiseProfit({ items = [], filters = {}, allProducts = [] }) {
    const {
        store
    } = usePage().props;

    const { props } = usePage();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [productFilter, setProductFilter] = useState(filters.product_ids || []);
    const [localSearchQuery, setLocalSearchQuery] = useState('');

    // Retrieve active product_id from query parameters so modal persists across reloads
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const selectedProductId = urlParams.get('product_id');
    const selectedProduct = items.find(i => i.product_id === selectedProductId);

    const setSelectedProduct = (item) => {
        const params = new URLSearchParams(window.location.search);
        if (item) {
            params.set('product_id', item.product_id);
        } else {
            params.delete('product_id');
        }
        router.get(route("store.reports.item-wise-profit", { store_slug: store.slug }),
            Object.fromEntries(params.entries()),
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Filter items locally by search query
    const filteredItems = useMemo(() => {
        if (!localSearchQuery) return items;
        const q = localSearchQuery.toLowerCase();
        return items.filter(item => 
            item.name.toLowerCase().includes(q) || 
            (item.sku || '').toLowerCase().includes(q)
        );
    }, [items, localSearchQuery]);

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

    // --- Handlers ---
    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            const params = new URLSearchParams(window.location.search);
            params.set('range', r);
            params.delete('start_date');
            params.delete('end_date');
            router.get(route("store.reports.item-wise-profit", {
                store_slug: store.slug
            }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        const params = new URLSearchParams(window.location.search);
        params.set('range', 'custom');
        params.set('start_date', startDate);
        params.set('end_date', endDate);
        router.get(route("store.reports.item-wise-profit", {
            store_slug: store.slug
        }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
    };

    const toggleProductFilter = (productId) => {
        const next = productFilter.includes(productId)
            ? productFilter.filter(id => id !== productId)
            : [...productFilter, productId];
        setProductFilter(next);
        router.get(route("store.reports.item-wise-profit", {
            store_slug: store.slug
        }), { range, start_date: startDate, end_date: endDate, product_ids: next }, { preserveState: true, preserveScroll: true });
    };

    const clearProductFilter = () => {
        setProductFilter([]);
        router.get(route("store.reports.item-wise-profit", {
            store_slug: store.slug
        }), { range, start_date: startDate, end_date: endDate, product_ids: [] }, { preserveState: true, preserveScroll: true });
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
                insights.push({
                    type: 'danger',
                    title: 'Bleeding Assets',
                    text: `${lossMakers.length} items are selling at a loss. Review pricing immediately.`,
                    products: lossMakers.map(i => ({ id: i.product_id, name: i.name, value: i.profit }))
                });
            }

            // 3. Margin Opportunities
            const lowMarginHighVol = items.filter(i => (i.profit / i.revenue) < 0.05 && i.revenue > (totalRevenue / items.length));
            if (lowMarginHighVol.length > 0) {
                insights.push({
                    type: 'opportunity',
                    title: 'Price Optimization',
                    text: `${lowMarginHighVol.length} high-volume items have margins below 5%. A small price increase here creates massive pure profit.`,
                    products: lowMarginHighVol.map(i => ({ id: i.product_id, name: i.name, value: i.profit }))
                });
            }

            // Correct score logic: start at 100 and apply mathematical penalties
            let score = 100;
            if (paretoRatio > 70) score -= 10;
            if (lossMakers.length > 0) {
                score -= 15; // penalty for having loss makers
                score -= (lossMakers.length * 5); // penalty per item
            }
            if (lowMarginHighVol.length > 0) {
                score -= (lowMarginHighVol.length * 3);
            }
            score = Math.max(0, Math.min(100, score));

            setAnalysisResult({
                score,
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
                        <ProductMultiSelect
                            allProducts={allProducts}
                            selected={productFilter}
                            onToggle={toggleProductFilter}
                        />
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
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
                    <RatioCard title="Total Revenue" value={formatCurrency(totalRevenue, store)} subtitle={`${items.length} Items Sold`} color="blue" icon={<DollarSign />} />
                    <RatioCard title="Total Profit" value={formatCurrency(totalProfit, store)} subtitle={`${avgMargin}% Avg Margin`} color={totalProfit >= 0 ? "emerald" : "rose"} icon={<TrendingUp />} />
                    <RatioCard title="Top Earner" value={topEarner.name.substring(0, 15)} subtitle={formatCurrency(topEarner.profit, store)} color="indigo" icon={<Target />} />
                    <RatioCard title="Active Catalog" value={items.length} subtitle="Items with sales" color="amber" icon={<Package />} />
                </div>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">

                    {/* LEFT COL: Table */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white shrink-0">Item Breakdown</h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search breakdown items..."
                                    value={localSearchQuery}
                                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                                />
                                <div className="absolute left-2.5 top-2.5 text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {productFilter.length > 0 && (
                            <div className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs">
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">{productFilter.length} product(s) selected</span>
                                <button onClick={clearProductFilter} className="text-indigo-500 hover:text-indigo-700 font-bold underline">Clear filter</button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Product Name</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredItems.map((item, idx) => {
                                        return (
                                            <tr
                                                key={item.product_id || idx}
                                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                                onClick={() => setSelectedProduct(item)}
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200 flex justify-between items-center">
                                                    <span>{item.name}</span>
                                                    <span className="text-xs text-indigo-500 font-bold transition-colors">View Details &rarr;</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td className="px-6 py-8 text-center text-slate-400 italic">No products found matching the search.</td>
                                        </tr>
                                    )}
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
                                        <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
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
                                        <p className="text-xs opacity-80 mb-2">{insight.text}</p>
                                        
                                        {/* Interactive product list linking to detail modals */}
                                        {insight.products && insight.products.length > 0 && (
                                            <div className="mt-2 space-y-1 bg-white/50 dark:bg-slate-900/40 p-2 rounded-lg border border-black/5 dark:border-white/5 max-h-40 overflow-y-auto">
                                                {insight.products.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => {
                                                            setAnalysisResult(null);
                                                            setSelectedProduct(items.find(i => i.product_id === p.id));
                                                        }}
                                                        className="w-full flex justify-between items-center text-left py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs transition-all font-semibold text-slate-600 dark:text-slate-300"
                                                    >
                                                        <span className="truncate pr-4 underline hover:text-indigo-500">{p.name}</span>
                                                        <span className="shrink-0 font-bold font-mono text-rose-600">{formatCurrency(p.value, store)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Detail Modal */}
                {selectedProduct && (() => {
                    const activeProduct = items.find(i => i.product_id === selectedProduct.product_id) || selectedProduct;
                    const margin = activeProduct.revenue > 0 ? (activeProduct.profit / activeProduct.revenue) * 100 : 0;
                    const customers = activeProduct.customers || [];
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-6xl w-[92vw] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                                {/* Modal Header */}
                                <div className="bg-indigo-600 p-6 text-white relative overflow-hidden shrink-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <span className="bg-indigo-500/50 text-white border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                Period: {range ? range.replace('_', ' ') : 'this year'} ({filters.start_date || startDate || 'N/A'} to {filters.end_date || endDate || 'N/A'})
                                            </span>
                                            <h2 className="text-2xl font-black tracking-tight mt-1">{activeProduct.name}</h2>
                                            <p className="text-indigo-100 text-xs font-semibold">
                                                SKU: <span className="text-white font-bold">{activeProduct.sku || 'N/A'}</span>
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedProduct(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                    {/* Modal Date Filters */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase">Change Period:</span>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleRangeChange(opt.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
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

                                    {/* Financial KPIs */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Revenue in Period</p>
                                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(activeProduct.revenue, store)}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Profit in Period</p>
                                            <p className={`text-3xl font-black mt-1 ${activeProduct.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {formatCurrency(activeProduct.profit, store)}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Profit Margin</p>
                                            <p className="text-3xl font-black text-indigo-500 dark:text-indigo-400 mt-1">{margin.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                        {/* Per-Item P&L Statement */}
                                        <div className="xl:col-span-5">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <DollarSign size={14} /> Profit &amp; Loss Statement
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <table className="w-full text-xs sm:text-sm">
                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                                        <tr>
                                                            <td className="py-3 px-4 text-slate-500">Revenue (net of returns)</td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-200 font-bold">{formatCurrency(activeProduct.revenue, store)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-4 text-slate-500">Less: Cost of Goods Sold</td>
                                                            <td className="py-3 px-4 text-right font-mono text-rose-500 font-medium">({formatCurrency((activeProduct.revenue || 0) - (activeProduct.profit || 0), store)})</td>
                                                        </tr>
                                                        <tr className="bg-slate-100 dark:bg-slate-800/80">
                                                            <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">Gross Profit</td>
                                                            <td className={`py-3 px-4 text-right font-mono font-bold ${activeProduct.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(activeProduct.profit, store)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-4 text-slate-500">Gross Margin</td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-200 font-bold">{margin.toFixed(1)}%</td>
                                                        </tr>
                                                        <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
                                                            <td className="py-3 px-4 text-slate-400 italic">Purchases in period</td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(activeProduct.purchase_cost || 0, store)}</td>
                                                        </tr>
                                                        <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                                            <td className="py-3 px-4 text-slate-400 italic">Current stock value</td>
                                                            <td className="py-3 px-4 text-right font-mono text-slate-500">{formatCurrency(activeProduct.stock_value || 0, store)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Customer Purchase Detail */}
                                        <div className="xl:col-span-7">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                <Users size={14} /> Customer Purchase Detail
                                            </div>
                                            {customers.length === 0 ? (
                                                <div className="p-12 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center">
                                                    <p className="text-sm text-slate-400 italic">No customer-attributed purchases in this period.</p>
                                                </div>
                                            ) : (
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                                    <table className="w-full text-xs sm:text-sm text-left">
                                                        <thead className="text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                            <tr>
                                                                <th className="py-3 px-4 font-bold">Customer Name</th>
                                                                <th className="text-right py-3 px-4 font-bold">Times Purchased</th>
                                                                <th className="text-right py-3 px-4 font-bold">Qty Bought</th>
                                                                <th className="text-right py-3 px-4 font-bold">Total Spent</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {customers.map((c, ci) => (
                                                                <tr key={ci} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-200">{c.party_name}</td>
                                                                    <td className="py-3 px-4 text-right text-slate-500 font-semibold">{c.purchase_count}</td>
                                                                    <td className="py-3 px-4 text-right text-slate-500 font-semibold">{c.total_qty}</td>
                                                                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300 font-black">{formatCurrency(c.total_spent, store)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0">
                                    <button onClick={() => setSelectedProduct(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors">Close</button>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </ReportsLayout>
    );
}

function ProductMultiSelect({ allProducts, selected, onToggle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    const filtered = query === ''
        ? allProducts.slice(0, 50)
        : allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku || '').toLowerCase().includes(query.toLowerCase())).slice(0, 50);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <ShoppingBag size={14} />
                {selected.length > 0 ? `${selected.length} Product(s)` : 'All Products'}
                <ChevronDown size={12} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-30 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search products..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No products found</p>
                        ) : filtered.map(p => (
                            <label key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => onToggle(p.id)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button onClick={() => setIsOpen(false)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold">Done</button>
                    </div>
                </div>
            )}
        </div>
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
