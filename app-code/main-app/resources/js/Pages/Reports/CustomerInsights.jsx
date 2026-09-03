import React, { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ArrowLeft, Calendar, Search, Users, DollarSign, Activity,
    TrendingUp, Award, Clock, ShoppingBag, X, BarChart2, ShieldCheck, Zap, HelpCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

import { series, vq } from '@/theme/runtime';
export default function CustomerInsights({ data = [], stats = [], filters = {} }) {
    const { store } = usePage().props;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalDetails, setModalDetails] = useState({ invoices: [], top_items: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            const params = new URLSearchParams(window.location.search);
            params.set('range', r);
            params.delete('start_date');
            params.delete('end_date');
            router.get(route('store.reports.customer-insights', { store_slug: store.slug }), 
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
        router.get(route('store.reports.customer-insights', { store_slug: store.slug }), 
            Object.fromEntries(params.entries()), 
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter data locally
    const filtered = useMemo(() => {
        return data.filter(c => 
            !search || 
            (c.party_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.favorite_category || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.most_bought_item || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    // Top 5 Customers by spend for Bar Chart
    const chartData = useMemo(() => {
        const COLORS = series.light.slice(0, 5);
        return [...data]
            .sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0))
            .slice(0, 5)
            .map((c, idx) => ({
                name: (c.party_name || '').substring(0, 15),
                value: c.total_spend || 0,
                color: COLORS[idx % COLORS.length]
            }));
    }, [data]);

    // Top 3 Vip spenders for loyalty sidebar
    const vipCustomers = useMemo(() => {
        return [...data]
            .sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0))
            .slice(0, 3);
    }, [data]);

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        if (!customer) {
            setModalDetails({ invoices: [], top_items: [] });
            return;
        }
        setIsLoadingDetails(true);
        fetch(route('store.reports.customer-insights.details', {
            store_slug: store.slug,
            party_id: customer.party_id,
            start_date: filters.start_date || startDate,
            end_date: filters.end_date || endDate
        }))
        .then(res => res.json())
        .then(json => {
            setModalDetails({
                invoices: json.invoices || [],
                top_items: json.top_items || []
            });
            setIsLoadingDetails(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoadingDetails(false);
        });
    };

    return (
        <ReportsLayout title="Customer Insights">
            <Head title="Customer Insights" />
            <div className="flex flex-col h-full gap-5 w-full">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 rounded-2xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={route('store.reports.index', { store_slug: store.slug })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-ink tracking-tight">Customer Insights</h1>
                            <p className="text-xs text-ink-muted font-medium">Real-time cohort spend tracking and favorite category patterns</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-app border border-line p-1.5 rounded-xl flex-wrap w-full lg:w-auto">
                        <Calendar size={15} className="text-ink-muted ml-1.5" />
                        <span className="text-2xs font-bold text-ink-muted uppercase tracking-wide">Period:</span>
                        <div className="flex bg-sunken p-0.5 rounded-lg">
                            {[{ id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'last_month', label: 'Last Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' }].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-2.5 py-1 rounded text-2xs font-bold uppercase tracking-wider transition-all ${range === opt.id ? 'bg-sunken shadow-sm text-brand-600 dark:text-brand-400' : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'}`}
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

                {/* KPIs Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                    {stats.map((s, i) => {
                        let colorClass = "text-brand-500 bg-brand-500/10";
                        let valPrefix = "";
                        if (s.label.includes('Revenue')) {
                            colorClass = "text-emerald-500 bg-emerald-500/10";
                            valPrefix = "$ ";
                        }
                        if (s.label.includes('Spend / Customer')) {
                            colorClass = "text-blue-500 bg-blue-500/10";
                            valPrefix = "$ ";
                        }
                        return (
                            <div key={i} className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-xl font-bold text-ink tracking-tight mt-1">{valPrefix}{s.value}</h3>
                                </div>
                                <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
                                    {s.label.includes('Customers') ? <Users size={18} /> : <DollarSign size={18} />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Content Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
                    
                    {/* LEFT COLUMN: Customer Insights Table list */}
                    <div className="xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden min-h-0">
                        <div className="p-4 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center bg-sunken/50 dark:bg-surface gap-4 shrink-0">
                            <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Customer Loyalty Registry</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 text-ink-muted" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search customer patterns..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 w-full bg-surface border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-ink-muted uppercase bg-app sticky top-0 z-10 border-b border-line">
                                    <tr>
                                        <th className="px-6 py-3 font-bold">Customer</th>
                                        <th className="px-4 py-3 text-right font-bold">Invoices</th>
                                        <th className="px-4 py-3 text-right font-bold">Total Spent</th>
                                        <th className="px-4 py-3 font-bold">Preferences</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-ink-muted italic">No customer insights found.</td></tr>
                                    ) : filtered.map((row, idx) => (
                                        <tr 
                                            key={row.party_id || idx} 
                                            className="hover:bg-brand-50/50 dark:hover:bg-interactive-hover transition-all cursor-pointer group"
                                            onClick={() => handleSelectCustomer(row)}
                                        >
                                            <td className="px-6 py-3.5">
                                                <div className="font-bold text-ink-secondary dark:text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{row.party_name}</div>
                                                <div className="text-3xs text-ink-muted font-mono mt-0.5">Last Active: {row.last_purchase_at || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-mono font-semibold text-ink-muted">{row.invoice_count}</td>
                                            <td className="px-4 py-3.5 text-right font-mono font-bold text-ink">
                                                {formatCurrency(row.total_spend, store)}
                                                <span className="block text-2xs text-ink-muted font-sans font-medium">Avg: {formatCurrency(row.avg_invoice_value, store)}</span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="text-2xs font-bold text-brand-500 flex items-center gap-1">
                                                    <Award size={10} /> {row.favorite_category || 'N/A'}
                                                </div>
                                                <div className="text-3xs text-ink-muted italic mt-0.5 truncate w-36">Top: {row.most_bought_item || 'N/A'}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: Revenue Distribution Chart */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm flex flex-col min-h-[300px]">
                            <h3 className="text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2">
                                <BarChart2 size={14} /> Top Customer Contribution
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={vq.slate[200]} className="dark:stroke-slate-800" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} />
                                        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                        <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: vq.slate[800], border: 'none', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
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
                                    <p>Identify your top spenders to create targeted customer rewards or discounts to drive catalog engagement.</p>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300">
                                        <ShieldCheck size={14} /> Retention Focused
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Customer Intelligence Card */}
                    <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="space-y-4">
                                <h3 className="text-base font-bold uppercase tracking-tight mb-2 flex items-center gap-2 text-emerald-400">
                                    <Zap size={18} fill="currentColor" /> Cohort intelligence
                                </h3>

                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2">
                                    <h4 className="text-xs font-bold text-brand-300 mb-0.5 flex items-center gap-2"><Award size={12} /> Top Spender</h4>
                                    <p className="text-1xs text-neutral-300">
                                        Your top buyer in this period is <strong className="text-white">{vipCustomers[0]?.party_name || 'N/A'}</strong> with a total spend of <strong className="text-emerald-400">{formatCurrency(vipCustomers[0]?.total_spend || 0, store)}</strong>.
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <h4 className="text-2xs font-bold uppercase text-ink-muted tracking-wider">Top Spenders (VIP Cluster)</h4>
                                    {vipCustomers.map((c, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSelectCustomer(c)}
                                            className="flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-1xs transition-all cursor-pointer group"
                                        >
                                            <span className="text-neutral-300 font-medium truncate w-32 group-hover:text-brand-400">{c.party_name}</span>
                                            <span className="font-mono text-emerald-400 font-bold">{formatCurrency(c.total_spend, store)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-2xs text-ink-muted">
                                Displays live ledger summaries. Click on any row to open the complete invoice log and itemized purchase breakdown.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Details popup modal */}
                {selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal">
                        <div className="bg-surface w-full max-w-5xl rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[85vh]">
                            
                            {/* Modal Header */}
                            <div className="bg-brand-600 p-5 text-white relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <span className="bg-brand-500/50 text-white border border-brand-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider">
                                            Spender Profile Analysis
                                        </span>
                                        <h2 className="text-2xl font-bold tracking-tight mt-1">{selectedCustomer.party_name}</h2>
                                        <p className="text-brand-100 text-xs font-semibold">
                                            Last Active Purchase: <span className="text-white font-bold">{selectedCustomer.last_purchase_at || 'N/A'}</span>
                                        </p>
                                    </div>
                                    <button onClick={() => handleSelectCustomer(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6 overflow-y-auto flex-1">
                                {/* Financial KPIs */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-app p-4 rounded-xl border border-line">
                                        <p className="text-xs font-bold text-ink-muted uppercase">Total Spent in Period</p>
                                        <p className="text-2xl font-bold text-ink mt-1">{formatCurrency(selectedCustomer.total_spend, store)}</p>
                                    </div>
                                    <div className="bg-app p-4 rounded-xl border border-line">
                                        <p className="text-xs font-bold text-ink-muted uppercase">Invoices Registered</p>
                                        <p className="text-2xl font-bold text-brand-500 mt-1">{selectedCustomer.invoice_count}</p>
                                    </div>
                                    <div className="bg-app p-4 rounded-xl border border-line">
                                        <p className="text-xs font-bold text-ink-muted uppercase">Average Ticket Value</p>
                                        <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(selectedCustomer.avg_invoice_value, store)}</p>
                                    </div>
                                </div>

                                {/* Modal Split Columns */}
                                {isLoadingDetails ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-brand-500 gap-3">
                                        <span className="animate-spin text-3xl">⌛</span>
                                        <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">Querying Ledger...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                        {/* Purchase Invoice log */}
                                        <div className="md:col-span-6 flex flex-col">
                                            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Clock size={13} /> Invoice Purchase History</h4>
                                            {modalDetails.invoices.length === 0 ? (
                                                <div className="p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic">
                                                    No invoice transaction logs found in this period.
                                                </div>
                                            ) : (
                                                <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-app text-ink-muted uppercase border-b border-line">
                                                            <tr>
                                                                <th className="py-2.5 px-3">Date</th>
                                                                <th className="py-2.5 px-3">Invoice No</th>
                                                                <th className="py-2.5 px-3 text-right">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-line">
                                                            {modalDetails.invoices.map((inv, idx) => (
                                                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
                                                                    <td className="py-2.5 px-3 text-ink-muted font-mono">{inv.date}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-ink-secondary dark:text-ink">
                                                                        {inv.invoice_no}
                                                                        <span className={`inline-block ml-2 px-1 text-4xs rounded uppercase font-bold ${inv.status === 'posted' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/20'}`}>{inv.status}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink">{formatCurrency(inv.amount, store)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Top purchased products breakdown */}
                                        <div className="md:col-span-6 flex flex-col">
                                            <h4 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><ShoppingBag size={13} /> Product Buying Preferences</h4>
                                            {modalDetails.top_items.length === 0 ? (
                                                <div className="p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic">
                                                    No products purchases found.
                                                </div>
                                            ) : (
                                                <div className="border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1">
                                                    <table className="w-full text-xs text-left">
                                                        <thead className="bg-app text-ink-muted uppercase border-b border-line">
                                                            <tr>
                                                                <th className="py-2.5 px-3">Product</th>
                                                                <th className="py-2.5 px-3 text-right">Qty Bought</th>
                                                                <th className="py-2.5 px-3 text-right">Total Spent</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-line">
                                                            {modalDetails.top_items.map((item, idx) => (
                                                                <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
                                                                    <td className="py-2.5 px-3">
                                                                        <span className="font-bold text-ink-secondary dark:text-ink block">{item.name}</span>
                                                                        <span className="text-3xs text-ink-muted font-mono">{item.sku}</span>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-ink-muted">{item.quantity}</td>
                                                                    <td className="py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink">{formatCurrency(item.total_spent, store)}</td>
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
                            <div className="p-4 border-t border-line bg-app flex justify-end shrink-0">
                                <button onClick={() => handleSelectCustomer(null)} className="px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors">Close</button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </ReportsLayout>
    );
}
