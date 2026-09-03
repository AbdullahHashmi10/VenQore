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
import { formatCurrency, formatNumber } from '@/Utils/format';

import { vq } from '@/theme/runtime';
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
 insights.push({ type: 'danger', title: 'Cash Flow Risk', text: `You have ${formatCurrency(stats.total_due, store)} in unpaid invoices. Follow up with debtors immediately.` });
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
 insights.push({ type: 'opportunity', title: 'Upsell Potential', text: `Avg ticket is ${formatCurrency(stats.avg_ticket, store)}. Bundling products could boost this by 15%.` });
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
 <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0">
 <div className="flex items-center gap-3 pl-2">
 <Link href={route("store.reports.index", {
 store_slug: store.slug
 })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors">
 <ArrowLeft size={18} />
 </Link>
 <div>
 <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
 Sales <span className="text-ink-muted font-medium text-sm">Overview</span>
 </h1>
 <p className="text-xs text-ink-muted font-medium">Revenue performance & trends</p>
 </div>
 </div>

 <div className="flex flex-col md:flex-row items-center gap-2">
 <div className="flex bg-sunken p-1 rounded-xl">
 {[{ id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
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

 {/* 2. KPIs - Restored 8 Cards */}
 {/* 2. KPIs - Horizontal Scroll for Compact Height */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
 <RatioCard title="Total Sales" value={formatCurrency(stats.total_sales, store)} color="emerald" icon={<TrendingUp />} />
 <RatioCard title="Cash Collected" value={formatCurrency(stats.total_paid, store)} color="blue" icon={<CreditCard />} />
 <RatioCard title="Outstanding" value={formatCurrency(stats.total_due, store)} color={stats.total_due > 0 ? "rose" : "emerald"} icon={<AlertCircle />} />
 <RatioCard title="Avg Ticket" value={formatCurrency(stats.avg_ticket, store)} color="indigo" icon={<Activity />} />

 <RatioCard title="Total Discount" value={formatCurrency(stats.total_discount, store)} color="amber" icon={<DollarSign />} />
 <RatioCard title="Highest Sale" value={formatCurrency(stats.max_sale, store)} color="emerald" icon={<TrendingUp />} />
 <RatioCard title="Total Invoices" value={stats.count} color="blue" icon={<FileText />} />
 <RatioCard title="Unpaid Count" value={stats.unpaid_count} color={stats.unpaid_count > 0 ? "rose" : "emerald"} icon={<AlertCircle />} />
 </div>

 {/* 3. Main Content Grid */}
 <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">

 {/* LEFT COL: Table */}
 <div className="xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden">
 <div className="p-5 border-b border-line flex justify-between items-center bg-sunken/50 dark:bg-surface">
 <h2 className="text-lg font-bold text-ink">Recent Transactions</h2>
 </div>
 <div className="flex-1 overflow-y-auto">
 <table className="w-full text-sm text-left">
 <thead className="text-xs text-ink-muted uppercase bg-app sticky top-0 backdrop-blur-sm z-10">
 <tr>
 <th className="px-6 py-3 font-bold">Ref #</th>
 <th className="px-6 py-3 font-bold">Customer</th>
 <th className="px-6 py-3 text-right font-bold">Total</th>
 <th className="px-6 py-3 text-right font-bold">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {sales.length > 0 ? sales.map((sale, idx) => {
 const total = Number(sale.total_amount) || 0;
 const paid = Number(sale.paid_amount) || 0;
 const due = total - paid;
 return (
 <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer" onClick={() => setQuickViewSale(sale)}>
 <td className="px-6 py-3 font-mono font-bold text-brand-600 dark:text-brand-400">#{sale.invoice_number || sale.reference_number}</td>
 <td className="px-6 py-3 font-medium text-ink-secondary dark:text-ink">{sale.party?.name || 'Walk-in Customer'}</td>
 <td className="px-6 py-3 text-right font-bold font-mono text-ink">{formatCurrency(total, store)}</td>
 <td className="px-6 py-3 text-right">
 {due > 5 ? (
 <span className="px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Unpaid</span>
 ) : (
 <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>
 )}
 </td>
 </tr>
 );
 }) : (
 <tr>
 <td colSpan="4" className="px-6 py-8 text-center text-ink-muted italic">No sales found for this period.</td>
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
 <TrendingUp size={14} /> Revenue Trend
 </h3>
 <div className="flex-1 relative">
 <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={vq.emerald[500]} stopOpacity={0.3} />
 <stop offset="95%" stopColor={vq.emerald[500]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke={vq.slate[700]} opacity={0.1} vertical={false} />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: vq.slate[400] }} />
 <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: vq.slate[800], border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
 <Area type="monotone" dataKey="value" stroke={vq.emerald[500]} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-brand-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
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
 <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden">
 <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

 <h3 className="text-base font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400">
 <Zap size={18} fill="currentColor" /> Sales Engine
 </h3>

 <div className="space-y-4">
 <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
 <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2"><Activity size={12} /> Live Pulse</h4>
 <p className="text-1xs text-neutral-300 mobile-relaxed">Monitor real-time sales velocity and detect dips before they become trends.</p>
 </div>
 <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
 <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2"><Lightbulb size={12} /> Smart Insight</h4>
 <p className="text-1xs text-neutral-300">Reducing total outstanding by 10% improves cash flow significantly.</p>
 </div>
 </div>

 <button onClick={runAnalysis} disabled={isAnalyzing} className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait">
 {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
 {isAnalyzing ? 'Scanning Sales...' : 'Run Sales Diagnosis'}
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
 <h2 className="text-2xl font-bold tracking-tight">Sales Intelligence</h2>
 <p className="text-brand-200 text-sm font-medium">Performance Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
 </div>
 </div>
 <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
 {analysisResult.insights.map((insight, idx) => (
 <div key={idx} className={`p-4 rounded-xl border-l-4 ${insight.type === 'danger' ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10 text-rose-700' : insight.type === 'warning' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/10 text-amber-700' : insight.type === 'success' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10 text-emerald-700' : 'bg-sunken border-brand-500 dark:bg-surface text-ink-secondary'}`}>
 <h4 className="text-sm font-bold mb-1">{insight.title}</h4>
 <p className="text-xs opacity-80">{insight.text}</p>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-line bg-app flex justify-end">
 <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-white text-xs font-bold rounded-lg transition-colors">Dismiss</button>
 </div>
 </div>
 </div>
 )}

 {/* Quick View Modal - Centered Popup */}
 {quickViewSale && (
 <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal" onClick={() => setQuickViewSale(null)}>
 <div
 className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0">
 <div className="flex flex-wrap items-center gap-3">
 <div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-wider">Invoice Preview</p>
 <h3 className="text-lg sm:text-xl font-bold text-brand-600 truncate">{quickViewSale.reference_number || quickViewSale.invoice_number}</h3>
 </div>
 {quickViewSale.source === 'pos' && (
 <span className="text-2xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase shrink-0">POS</span>
 )}
 <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${quickViewSale.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
 quickViewSale.payment_status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
 }`}>
 {quickViewSale.payment_status || (quickViewSale.total_amount - quickViewSale.paid_amount > 0 ? 'Unpaid' : 'Paid')}
 </span>
 </div>
 <div className="flex items-center gap-2 justify-end">
 <a
 href={route("store.sales.print", [store.slug, quickViewSale.id])}
 target="_blank"
 className="px-3 py-1.5 bg-sunken text-ink-secondary text-xs font-bold rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-1"
 >
 <Printer size={14} /> Print
 </a>
 <Link
 href={route("store.sales.edit", [store.slug, quickViewSale.id])}
 className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1"
 >
 <Edit size={14} /> Edit Invoice
 </Link>
 <button
 onClick={() => setQuickViewSale(null)}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-auto p-4">
 {/* Top Info Row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Customer</p>
 <p className="font-bold text-ink text-sm">{quickViewSale.party?.name || quickViewSale.customer?.name || 'Walk-in'}</p>
 {quickViewSale.party?.phone && (
 <p className="text-xs text-ink-muted">{quickViewSale.party.phone}</p>
 )}
 </div>
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Date & Time</p>
 <p className="font-bold text-ink text-sm">{formatDate(quickViewSale.created_at)}</p>
 <p className="text-xs text-ink-muted">{new Date(quickViewSale.created_at).toLocaleTimeString()}</p>
 </div>
 <div className="bg-app p-3 rounded-xl">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Payment</p>
 <p className="font-bold text-ink text-sm uppercase">{quickViewSale.payment_method || 'Cash'}</p>
 </div>
 <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-xl border border-brand-200 dark:border-brand-800">
 <p className="text-2xs font-bold text-brand-600 uppercase mb-1">Total</p>
 <p className="font-bold text-brand-600 text-lg">{formatCurrency(quickViewSale.total_amount || quickViewSale.total, store)}</p>
 </div>
 </div>

 {/* Items Table */}
 <div className="border border-line rounded-xl overflow-hidden">
 <div className="bg-app px-4 py-2 border-b border-line">
 <p className="text-xs font-bold text-ink-secondary uppercase">
 Items in this Invoice ({quickViewSale.sale_items?.length || quickViewSale.items?.length || 0})
 </p>
 </div>
 {/* Desktop Table View */}
 <div className="hidden sm:block max-h-[300px] overflow-auto">
 <table className="w-full text-sm">
 <thead className="sticky top-0 bg-surface border-b border-line">
 <tr>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">#</th>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">Item Name</th>
 <th className="text-center p-3 text-2xs font-bold text-ink-muted uppercase">Qty</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Rate</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {(quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (
 (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => (
 <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
 <td className="p-3 text-ink-muted font-mono text-xs">{idx + 1}</td>
 <td className="p-3">
 <p className="font-semibold text-ink">{item.product?.name || item.name || 'Unknown Item'}</p>
 </td>
 <td className="p-3 text-center font-bold text-ink-secondary">{formatNumber(item.quantity)}</td>
 <td className="p-3 text-right text-ink-secondary">{formatCurrency(item.unit_price || item.price || 0, store)}</td>
 <td className="p-3 text-right font-bold text-ink">
 {formatCurrency(item.total_price || ((item.quantity) * (item.unit_price || item.price || 0)), store)}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="p-6 text-center text-ink-muted">
 No items data available
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile Stacked List View */}
 <div className="block sm:hidden divide-y divide-line max-h-[300px] overflow-auto">
 {(quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (
 (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => (
 <div key={idx} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-2">
 <div className="flex items-start justify-between gap-2">
 <div className="flex gap-2 items-start">
 <span className="text-ink-muted font-mono text-xs">{idx + 1}.</span>
 <div>
 <p className="font-semibold text-ink text-xs">{item.product?.name || item.name || 'Unknown Item'}</p>
 </div>
 </div>
 <p className="text-xs font-bold text-ink shrink-0">
 {formatCurrency(item.total_price || ((item.quantity) * (item.unit_price || item.price || 0)), store)}
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2 text-2xs bg-surface/50 dark:bg-app p-2 rounded-lg border border-line">
 <div>
 <span className="text-ink-muted block uppercase">Qty</span>
 <span className="font-bold text-ink-secondary">{formatNumber(item.quantity)}</span>
 </div>
 <div>
 <span className="text-ink-muted block uppercase">Rate</span>
 <span className="font-semibold text-ink-secondary">{formatCurrency(item.unit_price || item.price || 0, store)}</span>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-6 text-center text-ink-muted text-xs">
 No items data available
 </div>
 )}
 </div>
 </div>

 {/* Payment Info */}
 <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center p-3 bg-app rounded-xl">
 <div className="flex gap-6 justify-between w-full sm:w-auto">
 <div>
 <p className="text-2xs text-ink-muted uppercase">Paid Amount</p>
 <p className="font-bold text-emerald-600">{formatCurrency(Number(quickViewSale.paid_amount) || 0, store)}</p>
 </div>
 {(() => {
 const paid = Number(quickViewSale.paid_amount) || 0;
 const total = Number(quickViewSale.total_amount || quickViewSale.total) || 0;
 const balance = total - paid;
 if (balance > 1) {
 return (
 <div>
 <p className="text-2xs text-ink-muted uppercase">Balance Due</p>
 <p className="font-bold text-red-600">{formatCurrency(balance, store)}</p>
 </div>
 );
 }
 return null;
 })()}
 </div>
 <div className="flex gap-2 w-full sm:w-auto justify-end">
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
 const colors = { indigo: 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400', emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400', rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400', blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' };

 return (
 <div className="bg-surface px-4 py-3 rounded-xl border border-line shadow-sm flex items-center gap-3 hover:shadow-md transition-all group">
 <div className={`p-2 rounded-lg ${colors[color]} shrink-0 transition-transform`}>
 {React.cloneElement(icon, { size: 16 })}
 </div>
 <span className="text-1xs font-bold text-ink-muted uppercase tracking-wider">{title}</span>
 <span className="ml-auto text-base font-bold text-ink tracking-tight">{value}</span>
 </div>
 );
}
