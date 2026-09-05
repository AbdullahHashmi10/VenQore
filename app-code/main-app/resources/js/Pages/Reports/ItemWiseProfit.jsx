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

import { vq } from '@/theme/runtime';
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
    const [marginFilter, setMarginFilter] = useState('all');

    // Retrieve active product_id from query parameters so modal persists across reloads
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const selectedProductId = urlParams.get('product_id');

    // Local state to keep the product modal open even during reloads when product is temporarily missing from data
    const [selectedProduct, setSelectedProductState] = useState(null);

    React.useEffect(() => {
        if (selectedProductId) {
            const found = items.find(i => i.product_id === selectedProductId);
            if (found) {
                setSelectedProductState(found);
            }
        } else {
            setSelectedProductState(null);
        }
    }, [selectedProductId, items]);

    const setSelectedProduct = (item) => {
        const url = new URL(window.location.href);
        if (item) {
            url.searchParams.set('product_id', item.product_id.toString());
            setSelectedProductState(item);
        } else {
            url.searchParams.delete('product_id');
            setSelectedProductState(null);
        }
        window.history.replaceState({}, '', url.toString());
    };

    // Filter items locally by search query & margin percentage
    const filteredItems = useMemo(() => {
        let list = items;

        if (marginFilter !== 'all') {
            list = list.filter(item => {
                const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                if (marginFilter === 'negative') return margin < 0;
                if (marginFilter === '0_10') return margin >= 0 && margin <= 10;
                if (marginFilter === '10_30') return margin > 10 && margin <= 30;
                if (marginFilter === '30_50') return margin > 30 && margin <= 50;
                if (marginFilter === '50_plus') return margin > 50;
                return true;
            });
        }

        if (localSearchQuery) {
            const q = localSearchQuery.toLowerCase();
            list = list.filter(item => 
                item.name.toLowerCase().includes(q) || 
                (item.sku || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [items, localSearchQuery, marginFilter]);

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
            color: [vq.emerald[500], vq.blue[500], vq.violet[500], vq.amber[500], vq.red[500]][index]
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
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route("store.reports.index", {
                            store_slug: store.slug
                        })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
                                Profit <span className="text-ink-muted font-medium text-sm">By Item</span>
                            </h1>
                            <p className="text-xs text-ink-muted font-medium">Product-level profitability analysis</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <ProductMultiSelect
                            allProducts={allProducts}
                            selected={productFilter}
                            onToggle={toggleProductFilter}
                        />
                        <div className="flex bg-sunken p-1 rounded-xl">
                            {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? 'bg-sunken shadow-sm text-brand-600 dark:text-brand-400' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {range === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1 rounded-xl">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" />
                                <span className="text-ink-muted text-xs font-bold">TO</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" />
                                <button onClick={applyCustomRange} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">Apply</button>
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
                    <div className="xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center bg-sunken/50 dark:bg-surface gap-4">
                            <h2 className="text-lg font-bold text-ink shrink-0">Item Breakdown</h2>
                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search breakdown items..."
                                    value={localSearchQuery}
                                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-surface border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary"
                                />
                                <div className="absolute left-2.5 top-2.5 text-ink-muted">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Margin Percentage Filter Pills */}
                        <div className="px-5 py-3 bg-sunken/30 dark:bg-surface border-b border-line flex flex-wrap gap-1.5 items-center">
                            <span className="text-2xs font-bold text-ink-muted uppercase tracking-wider mr-1">Margins:</span>
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'negative', label: 'Loss (<0%)', hover: 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 hover:border-rose-300' },
                                { id: '0_10', label: '0% - 10%', hover: 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-455 hover:border-amber-300' },
                                { id: '10_30', label: '10% - 30%', hover: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 hover:border-blue-300' },
                                { id: '30_50', label: '30% - 50%', hover: 'hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/20 dark:hover:text-brand-400 hover:border-brand-300' },
                                { id: '50_plus', label: '50%+', hover: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 hover:border-emerald-300' }
                            ].map((opt) => {
                                const isActive = marginFilter === opt.id;
                                let activeStyles = 'bg-surface border-line text-ink-secondary ' + opt.hover;
                                if (isActive) {
                                    if (opt.id === 'negative') activeStyles = 'bg-rose-600 border-rose-600 text-white shadow-sm';
                                    else if (opt.id === '0_10') activeStyles = 'bg-amber-500 border-amber-500 text-white shadow-sm';
                                    else if (opt.id === '10_30') activeStyles = 'bg-blue-600 border-blue-600 text-white shadow-sm';
                                    else if (opt.id === '30_50') activeStyles = 'bg-brand-600 border-brand-600 text-white shadow-sm';
                                    else if (opt.id === '50_plus') activeStyles = 'bg-emerald-600 border-emerald-600 text-white shadow-sm';
                                    else activeStyles = 'bg-neutral-800 border-neutral-800 dark:bg-neutral-200 dark:border-line text-white dark:text-ink shadow-sm';
                                }
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setMarginFilter(opt.id)}
                                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all border ${activeStyles}`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        {productFilter.length > 0 && (
                            <div className="px-5 py-2 bg-brand-50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-900/30 flex items-center justify-between text-xs">
                                <span className="text-brand-600 dark:text-brand-400 font-bold">{productFilter.length} product(s) selected</span>
                                <button onClick={clearProductFilter} className="text-brand-500 hover:text-brand-700 font-bold underline">Clear filter</button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-ink-muted uppercase bg-app sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Product Name</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filteredItems.map((item, idx) => {
                                        return (
                                            <tr
                                                key={item.product_id || idx}
                                                className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer"
                                                onClick={() => setSelectedProduct(item)}
                                            >
                                                <td className="px-6 py-4 font-medium text-ink-secondary dark:text-ink flex justify-between items-center">
                                                    <span>{item.name}</span>
                                                    <span className="text-xs text-brand-500 font-bold transition-colors">View Details &rarr;</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td className="px-6 py-8 text-center text-ink-muted italic">No products found matching the search.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COL: Visuals */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm flex-1 min-h-[300px] flex flex-col">
                            <h3 className="text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2">
                                <PieIcon size={14} /> Profit Contribution
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="200" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: vq.slate[800], border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-brand-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
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
                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <h3 className="text-base font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400">
                                <Zap size={18} fill="currentColor" /> Growth Engine
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2"><Target size={12} /> Optimization</h4>
                                    <p className="text-1xs text-neutral-300 mobile-relaxed">Run the AI analyzer to detect margin leaks and find hidden pricing opportunities in your catalog.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2"><Lightbulb size={12} /> Insight</h4>
                                    <p className="text-1xs text-neutral-300">Identify "Loss Leaders" that are draining your overall profitability.</p>
                                </div>
                            </div>

                            <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait">
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                {isAnalyzing ? 'Analyzing Item Data...' : 'Run Item Analysis'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analysis Modal */}
                {analysisResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal">
                        <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal">
                            <div className="bg-brand-600 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md"><Activity size={24} /></div>
                                        <button onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight">Catalog Intelligence</h2>
                                    <p className="text-brand-200 text-sm font-medium">Efficiency Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
                                </div>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {analysisResult.insights.map((insight, idx) => {
                                    let containerClass = "bg-app text-ink border-l-slate-400";
                                    let titleClass = "text-ink font-bold text-sm mb-1";
                                    let textClass = "text-xs opacity-90 text-ink-secondary mb-2";
                                    let listBgClass = "bg-surface border border-line";
                                    let nameClass = "text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400";
                                    let valueClass = "text-ink-secondary";

                                    if (insight.type === 'danger') {
                                        containerClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 border-l-rose-600 border border-y border-r border-rose-200/60 dark:border-rose-900/30";
                                        titleClass = "text-rose-900 dark:text-rose-200 font-bold text-sm mb-1";
                                        textClass = "text-rose-800/90 dark:text-rose-300/90 text-xs mb-2";
                                        listBgClass = "bg-white/80 dark:bg-app border border-rose-200/50 dark:border-rose-900/30";
                                        nameClass = "text-ink hover:text-brand-600 dark:hover:text-brand-400";
                                        valueClass = "text-rose-600 dark:text-rose-400 font-bold";
                                    } else if (insight.type === 'warning') {
                                        containerClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-l-amber-600 border border-y border-r border-amber-200/60 dark:border-amber-900/30";
                                        titleClass = "text-amber-900 dark:text-amber-200 font-bold text-sm mb-1";
                                        textClass = "text-amber-800/90 dark:text-amber-300/90 text-xs mb-2";
                                    } else if (insight.type === 'success') {
                                        containerClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-l-emerald-600 border border-y border-r border-emerald-200/60 dark:border-emerald-900/30";
                                        titleClass = "text-emerald-900 dark:text-emerald-200 font-bold text-sm mb-1";
                                        textClass = "text-emerald-800/90 dark:text-emerald-300/90 text-xs mb-2";
                                    } else if (insight.type === 'opportunity') {
                                        containerClass = "bg-brand-50 dark:bg-brand-950/20 text-brand-900 dark:text-brand-100 border-l-indigo-600 border border-y border-r border-brand-200/60 dark:border-brand-900/30";
                                        titleClass = "text-brand-900 dark:text-brand-200 font-bold text-sm mb-1";
                                        textClass = "text-brand-800/90 dark:text-brand-300/90 text-xs mb-2";
                                        listBgClass = "bg-white/80 dark:bg-app border border-brand-200/50 dark:border-brand-900/30";
                                        nameClass = "text-ink hover:text-brand-600 dark:hover:text-brand-400";
                                        valueClass = "text-brand-600 dark:text-brand-400 font-bold";
                                    }

                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border-l-4 ${containerClass}`}>
                                            <h4 className={titleClass}>{insight.title}</h4>
                                            <p className={textClass}>{insight.text}</p>
                                            
                                            {/* Interactive product list linking to detail modals */}
                                            {insight.products && insight.products.length > 0 && (
                                                <div className={`mt-2 space-y-1 p-2 rounded-lg max-h-40 overflow-y-auto ${listBgClass}`}>
                                                    {insight.products.map((p) => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => {
                                                                setAnalysisResult(null);
                                                                setSelectedProduct(items.find(i => i.product_id === p.id));
                                                            }}
                                                            className="w-full flex justify-between items-center text-left py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs transition-all font-semibold"
                                                        >
                                                            <span className={`truncate pr-4 underline ${nameClass}`}>{p.name}</span>
                                                            <span className={`shrink-0 font-bold font-mono ${valueClass}`}>{formatCurrency(p.value, store)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 border-t border-line bg-app flex justify-end">
                                <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-white text-xs font-bold rounded-lg transition-colors">Dismiss</button>
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
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal">
                            <div className="bg-surface w-full max-w-6xl w-[92vw] rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[90vh]">
                                {/* Modal Header */}
                                <div className="bg-brand-600 p-6 text-white relative overflow-hidden shrink-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <span className="bg-brand-500/50 text-white border border-brand-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider">
                                                Period: {range ? range.replace('_', ' ') : 'this year'} ({filters.start_date || startDate || 'N/A'} to {filters.end_date || endDate || 'N/A'})
                                            </span>
                                            <h2 className="text-2xl font-bold tracking-tight mt-1">{activeProduct.name}</h2>
                                            <p className="text-brand-100 text-xs font-semibold">
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
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-app p-4 rounded-xl border border-line shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-ink-muted uppercase">Change Period:</span>
                                            <div className="flex bg-sunken p-1 rounded-xl">
                                                {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleRangeChange(opt.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? 'bg-sunken shadow-sm text-brand-600 dark:text-brand-400' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {range === 'custom' && (
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1 rounded-xl">
                                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" />
                                                <span className="text-ink-muted text-xs font-bold">TO</span>
                                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" />
                                                <button onClick={applyCustomRange} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">Apply</button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Financial KPIs */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-app p-4 rounded-xl border border-line">
                                            <p className="text-xs font-bold text-ink-muted uppercase">Revenue in Period</p>
                                            <p className="text-3xl font-bold text-ink mt-1">{formatCurrency(activeProduct.revenue, store)}</p>
                                        </div>
                                        <div className="bg-app p-4 rounded-xl border border-line">
                                            <p className="text-xs font-bold text-ink-muted uppercase">Profit in Period</p>
                                            <p className={`text-3xl font-bold mt-1 ${activeProduct.profit < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {formatCurrency(activeProduct.profit, store)}
                                            </p>
                                        </div>
                                        <div className="bg-app p-4 rounded-xl border border-line">
                                            <p className="text-xs font-bold text-ink-muted uppercase">Profit Margin</p>
                                            <p className="text-3xl font-bold text-brand-500 dark:text-brand-400 mt-1">{margin.toFixed(1)}%</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                        {/* Per-Item P&L Statement */}
                                        <div className="xl:col-span-5">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                <DollarSign size={14} /> Profit &amp; Loss Statement
                                            </div>
                                            <div className="bg-app rounded-xl border border-line overflow-hidden">
                                                <table className="w-full text-xs sm:text-sm">
                                                    <tbody className="divide-y divide-line">
                                                        <tr>
                                                            <td className="py-3 px-4 text-ink-muted">Revenue (net of returns)</td>
                                                            <td className="py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold">{formatCurrency(activeProduct.revenue, store)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-4 text-ink-muted">Less: Cost of Goods Sold</td>
                                                            <td className="py-3 px-4 text-right font-mono text-rose-500 font-medium">({formatCurrency((activeProduct.revenue || 0) - (activeProduct.profit || 0), store)})</td>
                                                        </tr>
                                                        <tr className="bg-sunken">
                                                            <td className="py-3 px-4 font-bold text-ink-secondary dark:text-ink">Gross Profit</td>
                                                            <td className={`py-3 px-4 text-right font-mono font-bold ${activeProduct.profit < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>{formatCurrency(activeProduct.profit, store)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-4 text-ink-muted">Gross Margin</td>
                                                            <td className="py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold">{margin.toFixed(1)}%</td>
                                                        </tr>
                                                        <tr className="border-t border-line bg-sunken/50 dark:bg-surface">
                                                            <td className="py-3 px-4 text-ink-muted italic">Purchases in period</td>
                                                            <td className="py-3 px-4 text-right font-mono text-ink-muted">{formatCurrency(activeProduct.purchase_cost || 0, store)}</td>
                                                        </tr>
                                                        <tr className="bg-sunken/50 dark:bg-surface">
                                                            <td className="py-3 px-4 text-ink-muted italic">Current stock value</td>
                                                            <td className="py-3 px-4 text-right font-mono text-ink-muted">{formatCurrency(activeProduct.stock_value || 0, store)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Customer Purchase Detail */}
                                        <div className="xl:col-span-7">
                                            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                <Users size={14} /> Customer Purchase Detail
                                            </div>
                                            {customers.length === 0 ? (
                                                <div className="p-12 rounded-xl bg-app border border-dashed border-line flex flex-col items-center justify-center text-center">
                                                    <p className="text-sm text-ink-muted italic">No customer-attributed purchases in this period.</p>
                                                </div>
                                            ) : (
                                                <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-sm">
                                                    <table className="w-full text-xs sm:text-sm text-left">
                                                        <thead className="text-ink-muted uppercase bg-app border-b border-line">
                                                            <tr>
                                                                <th className="py-3 px-4 font-bold">Customer Name</th>
                                                                <th className="text-right py-3 px-4 font-bold">Times Purchased</th>
                                                                <th className="text-right py-3 px-4 font-bold">Qty Bought</th>
                                                                <th className="text-right py-3 px-4 font-bold">Total Spent</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-line">
                                                            {customers.map((c, ci) => (
                                                                <tr key={ci} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                                    <td className="py-3 px-4 font-bold text-ink-secondary dark:text-ink">{c.party_name}</td>
                                                                    <td className="py-3 px-4 text-right text-ink-muted font-semibold">{c.purchase_count}</td>
                                                                    <td className="py-3 px-4 text-right text-ink-muted font-semibold">{c.total_qty}</td>
                                                                    <td className="py-3 px-4 text-right font-mono text-ink-secondary font-bold">{formatCurrency(c.total_spent, store)}</td>
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
                                <div className="p-4 border-t border-line bg-app flex justify-end shrink-0">
                                    <button onClick={() => setSelectedProduct(null)} className="px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors">Close</button>
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
                className="flex items-center gap-2 px-3 py-1.5 bg-sunken rounded-xl text-xs font-bold text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
            >
                <ShoppingBag size={14} />
                {selected.length > 0 ? `${selected.length} Product(s)` : 'All Products'}
                <ChevronDown size={12} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-surface rounded-[14px] shadow-xl border border-line z-30 overflow-hidden">
                    <div className="p-2 border-b border-line">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Search products..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full px-3 py-1.5 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-ink-muted text-center py-4">No products found</p>
                        ) : filtered.map(p => (
                            <label key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(p.id)}
                                    onChange={() => onToggle(p.id)}
                                    className="rounded border-line text-brand-600 focus:ring-brand-500"
                                />
                                <span className="text-ink-secondary truncate">{p.name}</span>
                            </label>
                        ))}
                    </div>
                    <div className="p-2 border-t border-line flex justify-end">
                        <button onClick={() => setIsOpen(false)} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function RatioCard({ title, value, subtitle, color, icon }) {
    const colors = { indigo: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };
    return (
        <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2"><div className={`p-2 rounded-lg ${colors[color]} shrink-0`}>{React.cloneElement(icon, { size: 18 })}</div></div>
            <div><p className="text-xs font-bold text-ink-muted uppercase">{title}</p><h3 className="text-2xl font-bold text-ink tracking-tight my-1">{value}</h3><p className="text-xs font-medium text-ink-muted">{subtitle}</p></div>
        </div>
    );
}
