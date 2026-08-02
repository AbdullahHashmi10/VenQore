import React, { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ArrowLeft, Calendar, Search, Truck, DollarSign, Activity,
    TrendingUp, Award, Clock, ShoppingBag, X, BarChart2, ShieldCheck, AlertTriangle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

import { vq } from '@/theme/runtime';
export default function SupplierInsights({ data = [], stats = [], filters = {} }) {
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [search, setSearch] = useState('');
    const [selectedPair, setSelectedPair] = useState(null);
    const [modalDetails, setModalDetails] = useState({ purchases: [], other_products: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            const params = new URLSearchParams(window.location.search);
            params.set('range', r);
            params.delete('start_date');
            params.delete('end_date');
            router.get(route('store.reports.supplier-insights', { store_slug: store.slug }), 
                Object.fromEntries(params.entries()), 
                { preserveState: true, preserveScroll: true }
            );
        }
    };

    const applyCustomRange = () => {
        const params = new URLSearchParams(window.location.search);
        params.set('range', 'custom');
        params.set('start_date', startDate);
        params.set('end_date', endDate);
        router.get(route('store.reports.supplier-insights', { store_slug: store.slug }), 
            Object.fromEntries(params.entries()), 
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter data locally
    const filtered = useMemo(() => {
        return data.filter(row => 
            !search || 
            (row.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (row.product_name || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    // Top 5 Highest Variance Pairs for Bar Chart
    const chartData = useMemo(() => {
        const COLORS = [vq.red[500], vq.orange[500], vq.amber[500], vq.yellow[500], vq.lime[500]];
        return [...data]
            .sort((a, b) => (b.cost_variance_pct || 0) - (a.cost_variance_pct || 0))
            .slice(0, 5)
            .map((r, idx) => ({
                name: `${(r.product_name || '').substring(0, 10)} (${(r.supplier_name || '').substring(0, 8)})`,
                value: r.cost_variance_pct || 0,
                color: COLORS[idx % COLORS.length]
            }));
    }, [data]);

    // Top 3 Risk Sourced products
    const highRiskPairs = useMemo(() => {
        return [...data]
            .sort((a, b) => (b.cost_variance_pct || 0) - (a.cost_variance_pct || 0))
            .slice(0, 3);
    }, [data]);

    const handleSelectPair = (pair) => {
        setSelectedPair(pair);
        if (!pair) {
            setModalDetails({ purchases: [], other_products: [] });
            return;
        }
        setIsLoadingDetails(true);
        fetch(route('store.reports.supplier-insights.details', {
            store_slug: store.slug,
            supplier_id: pair.supplier_id,
            product_id: pair.product_id,
            start_date: filters.start_date || startDate,
            end_date: filters.end_date || endDate
        }))
        .then(res => res.json())
        .then(json => {
            setModalDetails({
                purchases: json.purchases || [],
                other_products: json.other_products || []
            });
            setIsLoadingDetails(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoadingDetails(false);
        });
    };

    return (
        <ReportsLayout title="Supplier Insights">
            <Head title="Supplier Insights & Price History" />
            <div className="flex flex-col h-full gap-5 w-full">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={route('store.reports.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Supplier Insights & Price History</h1>
                            <p className="text-xs text-slate-500 font-medium">Trace supplier sourcing performance, unit cost variance, and inflation drifts</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-1.5 rounded-xl flex-wrap w-full lg:w-auto">
                        <Calendar size={15} className="text-slate-400 ml-1.5" />
                        <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Period:</span>
                        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-lg">
                            {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-2.5 py-1 rounded text-2xs font-black uppercase tracking-wider transition-all ${range === opt.id ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-450' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {range === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-slate-600 dark:text-slate-300" />
                                <span className="text-slate-400 text-xs font-bold">TO</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-slate-600 dark:text-slate-300" />
                                <button onClick={applyCustomRange} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">Apply</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPIs Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                    {stats.map((s, i) => {
                        let colorClass = "text-rose-500 bg-rose-500/10";
                        if (s.label.includes('Pairs')) {
                            colorClass = "text-indigo-500 bg-indigo-500/10";
                        }
                        if (s.label.includes('Volume')) {
                            colorClass = "text-emerald-500 bg-emerald-500/10";
                        }
                        return (
                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mt-1">{s.value}</h3>
                                </div>
                                <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
                                    {s.label.includes('Pairs') ? <Truck size={18} /> : <DollarSign size={18} />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Content Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
                    
                    {/* LEFT COLUMN: Supplier Insights Table list */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-0">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4 shrink-0">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Sourcing Price Variance Matrix</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search supplier or product..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Supplier & Sourced Item</th>
                                        <th className="px-4 py-3 text-right font-bold">Purchases</th>
                                        <th className="px-4 py-3 text-right font-bold">Cost Variance</th>
                                        <th className="px-4 py-3 text-right font-bold">Cost Limits (L ➔ H)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No supplier insights found.</td></tr>
                                    ) : filtered.map((row, idx) => (
                                        <tr 
                                            key={idx} 
                                            className="hover:bg-rose-50/30 dark:hover:bg-slate-850/40 transition-all cursor-pointer group"
                                            onClick={() => handleSelectPair(row)}
                                        >
                                            <td className="px-6 py-3.5">
                                                <div className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{row.supplier_name}</div>
                                                <div className="text-2xs text-indigo-500 font-bold mt-0.5">{row.product_name}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-500">
                                                {row.purchase_count}
                                                <span className="block text-2xs text-slate-400 font-sans font-medium">Qty: {row.total_qty_purchased}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-2xs font-black tracking-wide ${row.cost_variance_pct > 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20'}`}>
                                                    {row.cost_variance_pct}%
                                                </span>
                                                <span className="block text-2xs text-slate-400 font-mono mt-0.5">Avg: {formatCurrency(row.avg_unit_cost, store)}</span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-500">
                                                <div className="text-emerald-500 font-bold">{formatCurrency(row.min_unit_cost, store)}</div>
                                                <div className="text-rose-500 font-bold mt-0.5">{formatCurrency(row.max_unit_cost, store)}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: Cost Variance Chart */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <BarChart2 size={14} /> Peak Pricing Variances
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={vq.slate[200]} className="dark:stroke-slate-800" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                        <RechartsTooltip formatter={(val) => `${val}% Cost Spread`} contentStyle={{ backgroundColor: vq.slate[800], border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-rose-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold opacity-90 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Margin Risk Alert
                                </h3>
                                <div className="text-xs opacity-80 leading-relaxed space-y-2">
                                    <p>High cost variance (over 10%) suggests volatile supplier pricing that directly eats into your profit margins. Re-negotiate contract rates or check secondary suppliers.</p>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-amber-300">
                                        <ShieldCheck size={14} /> Price Variance Auditor
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Supplier Intelligence Card */}
                    <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="space-y-4">
                                <h3 className="text-base font-black uppercase tracking-tight mb-2 flex items-center gap-2 text-rose-450">
                                    <Activity size={18} /> Sourcing Risk Audit
                                </h3>

                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2">
                                    <h4 className="text-xs font-bold text-rose-350 mb-0.5 flex items-center gap-2"><AlertTriangle size={12} /> High Price Fluctuation</h4>
                                    <p className="text-1xs text-slate-300">
                                        Pricing for <strong className="text-white">{highRiskPairs[0]?.product_name || 'N/A'}</strong> from <strong className="text-white">{highRiskPairs[0]?.supplier_name || 'N/A'}</strong> shifted by <strong className="text-rose-400">{highRiskPairs[0]?.cost_variance_pct || 0}%</strong>.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <h4 className="text-2xs font-black uppercase text-slate-400 tracking-wider">Top Variance (Pricing Risks)</h4>
                                    {highRiskPairs.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSelectPair(p)}
                                            className="flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-1xs transition-all cursor-pointer group"
                                        >
                                            <div className="truncate w-32 group-hover:text-rose-400">
                                                <span className="text-slate-300 font-medium block">{p.supplier_name}</span>
                                                <span className="text-3xs text-slate-400">{p.product_name}</span>
                                            </div>
                                            <span className="font-mono text-rose-450 font-bold">{p.cost_variance_pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-2xs text-slate-400">
                                Shows real-time incoming PO ledger points. Click on any record to inspect cost movements and bills.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supplier-Product Details popup modal */}
                {selectedPair && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                            
                            {/* Modal Header */}
                            <div className="bg-rose-700 p-5 text-white relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <span className="bg-rose-500/50 text-white border border-rose-400/30 px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider">
                                            Supplier Sourcing Analysis
                                        </span>
                                        <h2 className="text-2xl font-black tracking-tight mt-1">{selectedPair.supplier_name}</h2>
                                        <p className="text-rose-100 text-xs font-semibold">
                                            Sourced Product: <span className="text-white font-bold">{selectedPair.product_name}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => handleSelectPair(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {/* Financial KPIs */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Total Qty Purchased</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{selectedPair.total_qty_purchased}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Average Unit Cost</p>
                                        <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(selectedPair.avg_unit_cost, store)}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Cost Variance</p>
                                        <p className="text-2xl font-black text-amber-500 mt-1">{selectedPair.cost_variance_pct}%</p>
                                    </div>
                                </div>

                                {/* Modal Split Columns */}
                                {isLoadingDetails ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-rose-600 gap-3">
                                        <span className="animate-spin text-3xl">⌛</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Ledger...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        {/* Purchase Invoice log */}
                                        <div className="md:col-span-6 flex flex-col">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Clock size={13} /> Sourcing Purchase History</h4>
                                            {modalDetails.purchases.length === 0 ? (
                                                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic">
                                                    No purchase invoice logs found in this period.
                                                </div>
                                            ) : (
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex-1">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                                            <tr>
                                                                <th className="py-2.5 px-3">Date</th>
                                                                <th className="py-2.5 px-3">PO Bill No</th>
                                                                <th className="py-2.5 px-3 text-right">Cost</th>
                                                                <th className="py-2.5 px-3 text-right">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {modalDetails.purchases.map((pur, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                                    <td className="py-2.5 px-3 text-slate-500 font-mono">{pur.date}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-250">
                                                                        {pur.invoice_no}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600">{formatCurrency(pur.unit_cost, store)} <span className="text-2xs text-slate-400 font-normal">x{pur.quantity}</span></td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{formatCurrency(pur.total, store)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Other products sourced from this supplier */}
                                        <div className="md:col-span-6 flex flex-col">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><ShoppingBag size={13} /> Other Sourced Catalog</h4>
                                            {modalDetails.other_products.length === 0 ? (
                                                <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic">
                                                    No other products sourced from this supplier.
                                                </div>
                                            ) : (
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex-1">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                                            <tr>
                                                                <th className="py-2.5 px-3">Product</th>
                                                                <th className="py-2.5 px-3 text-right">Qty Sourced</th>
                                                                <th className="py-2.5 px-3 text-right">Avg Cost</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                            {modalDetails.other_products.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                                    <td className="py-2.5 px-3">
                                                                        <span className="font-bold text-slate-700 dark:text-slate-250 block">{item.name}</span>
                                                                        <span className="text-3xs text-slate-400 font-mono">{item.sku}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-500">{item.quantity}</td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{formatCurrency(item.avg_cost, store)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0">
                                <button onClick={() => handleSelectPair(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors">Close</button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </ReportsLayout>
    );
}
