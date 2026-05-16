import React, { useState } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    TrendingUp, TrendingDown, DollarSign, ArrowLeft,
    Info, HelpCircle, Activity, Zap, Target, Lightbulb,
    ArrowUpRight, ShieldCheck, X, Loader2, CreditCard, AlertCircle, FileText,
    Printer, Edit, MessageCircle, RefreshCcw
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function SalesReport({ sales = [], stats = {}, chartData = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    // Guard: Prevent rendering until store context is derived
    if (!store?.slug) return null;

    const { props } = usePage();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // Quick View Modal State
    const [quickViewSale, setQuickViewSale] = useState(null);

    // --- Formatters ---
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(Number(val) || 0);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- Handlers ---
    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.sales", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.sales", {
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

            // 1. Uncollected Revenue
            if (stats.total_due > (stats.total_sales * 0.2)) {
                insights.push({ type: 'danger', title: 'Cash Flow Risk', text: `You have ${formatCurrency(stats.total_due)} in unpaid invoices. Follow up with debtors immediately.` });
            }

            // 2. Trend Analysis
            if (chartData.length > 2) {
                const last = chartData[chartData.length - 1].value;
                const prev = chartData[chartData.length - 2].value;
                if (last > prev * 1.1) {
                    insights.push({ type: 'success', title: 'Upward Trend', text: 'Sales are picking up! Ensure inventory levels can match this demand.' });
                } else if (last < prev * 0.8) {
                    insights.push({ type: 'warning', title: 'Sales Dip', text: 'Recent sales have dropped. Consider running a weekend promotion.' });
                }
            }

            // 3. Ticket Size
            if (stats.avg_ticket < 1000) { // Arbitrary threshold, adjust as needed
                insights.push({ type: 'opportunity', title: 'Upsell Potential', text: `Avg ticket is ${formatCurrency(stats.avg_ticket)}. Bundling products could boost this by 15%.` });
            } else {
                insights.push({ type: 'success', title: 'Strong Basket Size', text: 'Customers are buying multiple items. Maintain this momentum.' });
            }

            setAnalysisResult({
                score: Math.min(100, Math.max(0, 80 - (stats.total_due / stats.total_sales * 50) + (stats.count > 0 ? 10 : 0))),
                insights
            });
            setIsAnalyzing(false);
        }, 1500);
    };

    return (
        <ReportsLayout title="Sales Report">
            <Head title="Sales Intelligence" />
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
                                Sales <span className="text-slate-400 font-medium text-sm">Overview</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Revenue performance & trends</p>
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

                {/* 2. KPIs - Restored 8 Cards */}
                {/* 2. KPIs - Horizontal Scroll for Compact Height */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                    <RatioCard title="Total Sales" value={formatCurrency(stats.total_sales)} color="emerald" icon={<TrendingUp />} />
                    <RatioCard title="Cash Collected" value={formatCurrency(stats.total_paid)} color="blue" icon={<CreditCard />} />
                    <RatioCard title="Outstanding" value={formatCurrency(stats.total_due)} color={stats.total_due > 0 ? "rose" : "emerald"} icon={<AlertCircle />} />
                    <RatioCard title="Avg Ticket" value={formatCurrency(stats.avg_ticket)} color="indigo" icon={<Activity />} />

                    <RatioCard title="Total Discount" value={formatCurrency(stats.total_discount)} color="amber" icon={<DollarSign />} />
                    <RatioCard title="Highest Sale" value={formatCurrency(stats.max_sale)} color="emerald" icon={<TrendingUp />} />
                    <RatioCard title="Total Invoices" value={stats.count} color="blue" icon={<FileText />} />
                    <RatioCard title="Unpaid Count" value={stats.unpaid_count} color={stats.unpaid_count > 0 ? "rose" : "emerald"} icon={<AlertCircle />} />
                </div>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">

                    {/* LEFT COL: Table */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Ref #</th>
                                        <th className="px-6 py-3 font-bold">Customer</th>
                                        <th className="px-6 py-3 text-right font-bold">Total</th>
                                        <th className="px-6 py-3 text-right font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sales.length > 0 ? sales.map((sale, idx) => {
                                        const total = Number(sale.total_amount) || 0;
                                        const paid = Number(sale.paid_amount) || 0;
                                        const due = total - paid;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setQuickViewSale(sale)}>
                                                <td className="px-6 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{sale.invoice_number || sale.reference_number}</td>
                                                <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{sale.party?.name || 'Walk-in Customer'}</td>
                                                <td className="px-6 py-3 text-right font-bold font-mono text-slate-800 dark:text-white">{formatCurrency(total)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    {due > 5 ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Unpaid</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-8 text-center text-slate-400 italic">No sales found for this period.</td>
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
                                <TrendingUp size={14} /> Revenue Trend
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <RechartsTooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                        <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold opacity-90 mb-2 flex items-center gap-2">
                                    <HelpCircle size={14} /> Sales Tip
                                </h3>
                                <div className="text-xs opacity-80 leading-relaxed space-y-2">
                                    <p>Focus on converting <strong>Walk-in</strong> customers into registered profiles to track repeat business.</p>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300">
                                        <Target size={14} /> Boost Retention
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
                                <Zap size={18} fill="currentColor" /> Sales Engine
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2"><Activity size={12} /> Live Pulse</h4>
                                    <p className="text-[11px] text-slate-300 mobile-relaxed">Monitor real-time sales velocity and detect dips before they become trends.</p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2"><Lightbulb size={12} /> Smart Insight</h4>
                                    <p className="text-[11px] text-slate-300">Reducing total outstanding by 10% improves cash flow significantly.</p>
                                </div>
                            </div>

                            <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait">
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                {isAnalyzing ? 'Scanning Sales...' : 'Run Sales Diagnosis'}
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
                                    <h2 className="text-2xl font-black tracking-tight">Sales Intelligence</h2>
                                    <p className="text-indigo-200 text-sm font-medium">Performance Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
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

                {/* Quick View Modal - Centered Popup */}
                {quickViewSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setQuickViewSale(null)}>
                        <div
                            className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Preview</p>
                                        <h3 className="text-xl font-black text-indigo-600">{quickViewSale.reference_number || quickViewSale.invoice_number}</h3>
                                    </div>
                                    {quickViewSale.source === 'pos' && (
                                        <span className="text-[10px] font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase">POS</span>
                                    )}
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${quickViewSale.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                        quickViewSale.payment_status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                        }`}>
                                        {quickViewSale.payment_status || (quickViewSale.total_amount - quickViewSale.paid_amount > 0 ? 'Unpaid' : 'Paid')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={route("store.sales.print", [store.slug, quickViewSale.id])}
                                        target="_blank"
                                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                                    >
                                        <Printer size={14} /> Print
                                    </a>
                                    <Link
                                        href={route("store.sales.edit", [store.slug, quickViewSale.id])}
                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                    >
                                        <Edit size={14} /> Edit Invoice
                                    </Link>
                                    <button
                                        onClick={() => setQuickViewSale(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-auto p-4">
                                {/* Top Info Row */}
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{quickViewSale.party?.name || quickViewSale.customer?.name || 'Walk-in'}</p>
                                        {quickViewSale.party?.phone && (
                                            <p className="text-xs text-slate-500">{quickViewSale.party.phone}</p>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Date & Time</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{formatDate(quickViewSale.created_at)}</p>
                                        <p className="text-xs text-slate-500">{new Date(quickViewSale.created_at).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Payment</p>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm uppercase">{quickViewSale.payment_method || 'Cash'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Total</p>
                                        <p className="font-black text-indigo-600 text-lg">{formatCurrency(quickViewSale.total_amount || quickViewSale.total)}</p>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                                            Items in this Invoice ({quickViewSale.sale_items?.length || quickViewSale.items?.length || 0})
                                        </p>
                                    </div>
                                    <div className="max-h-[300px] overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase">#</th>
                                                    <th className="text-left p-3 text-[10px] font-bold text-slate-400 uppercase">Item Name</th>
                                                    <th className="text-center p-3 text-[10px] font-bold text-slate-400 uppercase">Qty</th>
                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Rate</th>
                                                    <th className="text-right p-3 text-[10px] font-bold text-slate-400 uppercase">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {(quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (
                                                    (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                                                            <td className="p-3">
                                                                <p className="font-semibold text-slate-800 dark:text-white">{item.product?.name || item.name || 'Unknown Item'}</p>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price || item.price || 0)}</td>
                                                            <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                                {formatCurrency(item.total_price || ((item.quantity) * (item.unit_price || item.price || 0)))}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={5} className="p-6 text-center text-slate-400">
                                                            No items data available
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="mt-4 flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <div className="flex gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Paid Amount</p>
                                            <p className="font-bold text-emerald-600">{formatCurrency(Number(quickViewSale.paid_amount) || 0)}</p>
                                        </div>
                                        {(() => {
                                            const paid = Number(quickViewSale.paid_amount) || 0;
                                            const total = Number(quickViewSale.total_amount || quickViewSale.total) || 0;
                                            const balance = total - paid;
                                            if (balance > 1) {
                                                return (
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 uppercase">Balance Due</p>
                                                        <p className="font-bold text-red-600">{formatCurrency(balance)}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1">
                                            <MessageCircle size={14} /> Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ReportsLayout>
    );
}

function RatioCard({ title, value, color, icon }) {
    const colors = { indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };

    return (
        <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 hover:shadow-md transition-all group">
            <div className={`p-2 rounded-lg ${colors[color]} shrink-0 group-hover:scale-105 transition-transform`}>
                {React.cloneElement(icon, { size: 16 })}
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</span>
            <span className="ml-auto text-base font-black text-slate-800 dark:text-white tracking-tight">{value}</span>
        </div>
    );
}
