import React, { useState, useMemo } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ArrowLeft, Calendar, Clock, Package, DollarSign, Layers, Info, Search,
    Activity, ShieldAlert, CheckCircle2, HelpCircle, Zap, PieChart as PieIcon,
    X, AlertTriangle, ArrowRight, ShieldCheck, Play
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

import { vq } from '@/theme/runtime';
export default function PointInTimeInventory({ data = [], stats = [], meta = {} }) {
    const { store } = usePage().props;
    const [asOfDate, setAsOfDate] = useState(meta.as_of_date || new Date().toISOString().split('T')[0]);
    const [asOfTime, setAsOfTime] = useState(meta.as_of_time || '');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, out, low, healthy, over
    const [sortKey, setSortKey] = useState('stock_value');
    const [sortDir, setSortDir] = useState('desc');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalDetails, setModalDetails] = useState({ ledger: [], batches: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState(null);

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        if (!item) {
            setModalDetails({ ledger: [], batches: [] });
            return;
        }
        setIsLoadingDetails(true);
        fetch(route('store.reports.point-in-time-inventory.details', {
            store_slug: store.slug,
            product_id: item.product_id,
            as_of_date: asOfDate,
            as_of_time: asOfTime || undefined
        }))
        .then(res => res.json())
        .then(json => {
            setModalDetails({
                ledger: json.ledger || [],
                batches: json.batches || []
            });
            setIsLoadingDetails(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoadingDetails(false);
        });
    };

    const applyDate = () => {
        router.get(route('store.reports.point-in-time-inventory', { store_slug: store.slug }), {
            as_of_date: asOfDate,
            as_of_time: asOfTime || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    // Calculate Category distribution for Pie Chart
    const pieData = useMemo(() => {
        const categoriesMap = {};
        let totalVal = 0;
        data.forEach(item => {
            const catName = item.category || 'Uncategorized';
            const val = item.stock_value || 0;
            totalVal += val;
            categoriesMap[catName] = (categoriesMap[catName] || 0) + val;
        });

        const COLORS = [vq.indigo[500], vq.emerald[500], vq.amber[500], vq.blue[500], vq.pink[500], vq.violet[500]];
        const list = Object.entries(categoriesMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        if (list.length > 5) {
            const top = list.slice(0, 4);
            const othersVal = list.slice(4).reduce((sum, item) => sum + item.value, 0);
            top.push({ name: 'Others', value: othersVal });
            return top.map((entry, index) => ({
                ...entry,
                color: COLORS[index % COLORS.length]
            }));
        }

        return list.map((entry, index) => ({
            ...entry,
            color: COLORS[index % COLORS.length]
        }));
    }, [data]);

    // Apply filters and sorting
    const filtered = useMemo(() => {
        return data
            .filter(r => {
                // Search filter
                const matchesSearch = !search || 
                    r.name.toLowerCase().includes(search.toLowerCase()) || 
                    (r.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                    (r.category || '').toLowerCase().includes(search.toLowerCase());
                
                if (!matchesSearch) return false;

                // Status filter
                const qty = r.quantity || 0;
                if (statusFilter === 'out') return qty <= 0;
                if (statusFilter === 'low') return qty > 0 && qty <= 15;
                if (statusFilter === 'healthy') return qty > 15 && qty <= 200;
                if (statusFilter === 'over') return qty > 200;
                
                return true;
            })
            .sort((a, b) => {
                const av = a[sortKey], bv = b[sortKey];
                if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
                return sortDir === 'asc' ? av - bv : bv - av;
            });
    }, [data, search, statusFilter, sortKey, sortDir]);

    // Top Tied Capital Products for Intelligence card
    const topTiedProducts = useMemo(() => {
        return [...data]
            .sort((a, b) => (b.stock_value || 0) - (a.stock_value || 0))
            .slice(0, 3);
    }, [data]);

    // Critical Reorder Products
    const criticalReorder = useMemo(() => {
        return [...data]
            .filter(r => (r.quantity || 0) > 0 && (r.quantity || 0) <= 15)
            .sort((a, b) => (a.quantity || 0) - (b.quantity || 0))
            .slice(0, 3);
    }, [data]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const runInventoryAudit = () => {
        setIsAuditing(true);
        setTimeout(() => {
            const outOfStockCount = data.filter(r => (r.quantity || 0) <= 0).length;
            const lowStockCount = data.filter(r => (r.quantity || 0) > 0 && (r.quantity || 0) <= 15).length;
            const overstockedCount = data.filter(r => (r.quantity || 0) > 200).length;
            const totalValue = data.reduce((sum, r) => sum + (r.stock_value || 0), 0);

            setAuditResult({
                score: Math.max(10, 100 - (outOfStockCount * 4) - (lowStockCount * 2) - (overstockedCount * 1)),
                outOfStockCount,
                lowStockCount,
                overstockedCount,
                healthyCount: data.length - outOfStockCount - lowStockCount - overstockedCount,
                tiedCapital: totalValue,
                potentialBleed: data.filter(r => (r.quantity || 0) > 200).reduce((sum, r) => sum + (r.stock_value || 0) * 0.15, 0)
            });
            setIsAuditing(false);
        }, 800);
    };



    const statIcon = (label) => {
        if (label.includes('As Of') || label.includes('Date')) return <Calendar size={18} />;
        if (label.includes('Value')) return <DollarSign size={18} />;
        if (label.includes('Quantity')) return <Layers size={18} />;
        return <Package size={18} />;
    };

    return (
        <ReportsLayout title="Point-In-Time Inventory">
            <Head title="Point-In-Time Inventory" />
            <div className="flex flex-col h-full gap-5 w-full">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={route('store.reports.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Point-In-Time Inventory</h1>
                            <p className="text-xs text-slate-500 font-medium">Historical inventory ledger valuation & snapshot builder</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-1.5 rounded-xl flex-wrap w-full lg:w-auto">
                        <Calendar size={15} className="text-slate-400 ml-1.5" />
                        <span className="text-2xs font-bold text-slate-400 uppercase tracking-wide">Target Moment:</span>
                        <input
                            type="date"
                            value={asOfDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold"
                        />
                        <Clock size={13} className="text-slate-400" />
                        <input
                            type="time"
                            value={asOfTime}
                            onChange={(e) => setAsOfTime(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300 font-bold w-24"
                        />
                        {asOfTime && (
                            <button
                                onClick={() => setAsOfTime('')}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 font-bold"
                            >
                                ✕
                            </button>
                        )}
                        <button onClick={applyDate} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-md shadow-indigo-500/10">
                            Reconstruct
                        </button>
                    </div>
                </div>

                {/* Info Note Banner */}
                {meta.note && (
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 shrink-0">
                        <Info size={15} className="shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{meta.note}</span>
                    </div>
                )}

                {/* KPI stats section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    {stats.map((s, i) => {
                        let colorClass = "text-indigo-500 bg-indigo-500/10";
                        if (s.label.includes('Value')) colorClass = "text-emerald-500 bg-emerald-500/10";
                        if (s.label.includes('Quantity')) colorClass = "text-blue-500 bg-blue-500/10";
                        return (
                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mt-1">{s.value}</h3>
                                </div>
                                <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
                                    {statIcon(s.label)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Main Content Layout Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
                    
                    {/* LEFT COLUMN: Inventory Snapshot Table list */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-0">
                        
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4 shrink-0">
                            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Inventory Snapshot</h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search catalog snapshot..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Status Filter Pills */}
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                            {[
                                { id: 'all', label: 'All Products', styles: 'hover:bg-slate-100 dark:hover:bg-slate-800' },
                                { id: 'out', label: 'Out of Stock', styles: 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20' },
                                { id: 'low', label: 'Low Stock (≤15)', styles: 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20' },
                                { id: 'healthy', label: 'Healthy (16-200)', styles: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20' },
                                { id: 'over', label: 'Overstocked (>200)', styles: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20' }
                            ].map((opt) => {
                                const isActive = statusFilter === opt.id;
                                let activeStyles = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 ' + opt.styles;
                                if (isActive) {
                                    if (opt.id === 'out') activeStyles = 'bg-rose-600 border-rose-600 text-white shadow-sm';
                                    else if (opt.id === 'low') activeStyles = 'bg-amber-500 border-amber-500 text-white shadow-sm';
                                    else if (opt.id === 'healthy') activeStyles = 'bg-emerald-600 border-emerald-600 text-white shadow-sm';
                                    else if (opt.id === 'over') activeStyles = 'bg-blue-600 border-blue-600 text-white shadow-sm';
                                    else activeStyles = 'bg-slate-800 border-slate-800 dark:bg-slate-200 dark:border-slate-200 text-white dark:text-slate-900 shadow-sm';
                                }
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setStatusFilter(opt.id)}
                                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-all border whitespace-nowrap ${activeStyles}`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Inventory Table */}
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10 border-b border-slate-100 dark:border-slate-800">
                                    <tr>
                                        {[
                                            { key: 'name', label: 'Product' },
                                            { key: 'quantity', label: 'Qty', align: 'right' },
                                            { key: 'stock_value', label: 'Value', align: 'right' }
                                        ].map(col => (
                                            <th
                                                key={col.key}
                                                onClick={() => toggleSort(col.key)}
                                                className={`px-6 py-3 font-bold cursor-pointer select-none hover:text-indigo-500 ${col.align === 'right' ? 'text-right' : ''}`}
                                            >
                                                {col.label} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No inventory matches search criteria.</td></tr>
                                    ) : filtered.map((row, idx) => {
                                        const qty = row.quantity || 0;
                                        let statusBadge = null;
                                        if (qty <= 0) statusBadge = <span className="text-3xs bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ml-1.5">Out</span>;
                                        else if (qty <= 15) statusBadge = <span className="text-3xs bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0 ml-1.5">Low</span>;
                                        return (
                                            <tr 
                                                key={row.product_id || idx} 
                                                className="hover:bg-indigo-50/50 dark:hover:bg-slate-850/40 transition-colors cursor-pointer group"
                                                onClick={() => handleSelectItem(row)}
                                            >
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{row.name}</span>
                                                        {statusBadge}
                                                    </div>
                                                    <div className="text-2xs text-slate-400 font-mono mt-0.5">{row.sku} &bull; <span className="font-sans font-medium text-slate-400/80">{row.category}</span></div>
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">{qty}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 block">{formatCurrency(row.stock_value, store)}</span>
                                                    <span className="text-3xs text-slate-400 font-mono">@{formatCurrency(row.unit_cost, store)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COLUMN: Charts & Analytics */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        
                        {/* Category Value Distribution chart */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <PieIcon size={14} /> Value Distribution
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                        </Pie>
                                        <RechartsTooltip formatter={(val) => formatCurrency(val, store)} contentStyle={{ backgroundColor: vq.slate[800], border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Strategy Tip */}
                        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-bold opacity-90 mb-2 flex items-center gap-2">
                                    <HelpCircle size={14} /> Valuation Logic
                                </h3>
                                <div className="text-xs opacity-80 leading-relaxed space-y-2">
                                    <p>Your stock value is calculated by reconstructing the full historical movement ledger in FIFO order down to the exact second selected.</p>
                                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300">
                                        <ShieldCheck size={14} /> Audit Trail Guaranteed
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Inventory Intelligence Card */}
                    <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                        
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="space-y-4">
                                <h3 className="text-base font-black uppercase tracking-tight mb-2 flex items-center gap-2 text-emerald-400">
                                    <Zap size={18} fill="currentColor" /> Stock Intelligence
                                </h3>

                                {/* Dynamic Audit Result */}
                                {auditResult ? (
                                    <div className="space-y-3 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                            <div>
                                                <span className="text-2xs text-slate-400 font-bold block uppercase">Health Score</span>
                                                <span className="text-2xl font-black text-emerald-400">{auditResult.score}/100</span>
                                            </div>
                                            {auditResult.score >= 80 ? <ShieldCheck className="text-emerald-400" size={32} /> : <AlertTriangle className="text-amber-400" size={32} />}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-2xs">
                                            <div className="bg-white/5 p-2 rounded-lg text-center">
                                                <span className="text-rose-400 font-bold text-sm block">{auditResult.outOfStockCount}</span>
                                                <span className="text-slate-400 uppercase tracking-wide">Out of stock</span>
                                            </div>
                                            <div className="bg-white/5 p-2 rounded-lg text-center">
                                                <span className="text-amber-400 font-bold text-sm block">{auditResult.lowStockCount}</span>
                                                <span className="text-slate-400 uppercase tracking-wide">Low stock</span>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1">
                                            <h4 className="text-2xs font-bold text-emerald-300 uppercase flex items-center gap-1.5"><DollarSign size={10} /> Capital Leaks</h4>
                                            <p className="text-1xs text-slate-300 leading-relaxed">
                                                Estimated carrying costs for overstocked assets: <strong className="text-white">{formatCurrency(auditResult.potentialBleed, store)} / yr</strong>.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2">
                                        <h4 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2"><Activity size={12} /> AI Auditor</h4>
                                        <p className="text-1xs text-slate-300 leading-relaxed">Run the automated snapshot auditor to evaluate inventory turnover and capital leaks.</p>
                                    </div>
                                )}

                                {/* Critical warning list */}
                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <h4 className="text-2xs font-black uppercase text-slate-400 tracking-wider">Tied-Up Capital (Top Value)</h4>
                                    {topTiedProducts.map((p, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => handleSelectItem(p)}
                                            className="flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-1xs transition-all cursor-pointer group"
                                        >
                                            <span className="text-slate-300 font-medium truncate w-32 group-hover:text-indigo-400">{p.name}</span>
                                            <span className="font-mono text-emerald-400 font-bold">{formatCurrency(p.stock_value, store)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button onClick={runInventoryAudit} disabled={isAuditing} className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait shrink-0">
                                {isAuditing ? <span className="animate-spin mr-1">⌛</span> : <Zap size={15} fill="currentColor" />}
                                {isAuditing ? 'Auditing Snapshot...' : 'Run Snapshot Audit'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Point-In-Time Item Detail Modal */}
                {selectedItem && (() => {
                    const status = (selectedItem.quantity || 0) <= 0 ? 'Out of Stock' : (selectedItem.quantity || 0) <= 15 ? 'Low Stock' : 'Healthy';
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                                
                                {/* Modal Header */}
                                <div className="bg-indigo-600 p-5 text-white relative overflow-hidden shrink-0">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <span className="bg-indigo-500/50 text-white border border-indigo-400/30 px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider">
                                                Reconstructed Snapshot: {asOfDate} {asOfTime || '23:59:59'}
                                            </span>
                                            <h2 className="text-2xl font-black tracking-tight mt-1">{selectedItem.name}</h2>
                                            <p className="text-indigo-100 text-xs font-semibold">
                                                SKU: <span className="text-white font-bold">{selectedItem.sku || 'N/A'}</span> &bull; Category: <span className="text-white font-bold">{selectedItem.category || 'N/A'}</span>
                                            </p>
                                        </div>
                                        <button onClick={() => handleSelectItem(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
                                    {/* Financial Details KPIs */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Stock Quantity</p>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{selectedItem.quantity}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Unit Valuation Cost</p>
                                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(selectedItem.unit_cost, store)}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Valuation Basis</p>
                                            <p className="text-2xl font-black text-indigo-500 dark:text-indigo-400 mt-1">FIFO cost</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Total Stock Value</p>
                                            <p className="text-2xl font-black text-emerald-500 mt-1">{formatCurrency(selectedItem.stock_value, store)}</p>
                                        </div>
                                    </div>

                                    {/* Modal Split Columns */}
                                    {isLoadingDetails ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-indigo-500 gap-3">
                                            <span className="animate-spin text-3xl">⌛</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying Ledger...</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            
                                            {/* FIFO Valuation Batches */}
                                            <div className="md:col-span-6 flex flex-col">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Layers size={13} /> Active FIFO Cost Layers</h4>
                                                {modalDetails.batches.length === 0 ? (
                                                    <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic">
                                                        No cost layers—item is out of stock.
                                                    </div>
                                                ) : (
                                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                                                <tr>
                                                                    <th className="py-2.5 px-3">Batch ID</th>
                                                                    <th className="py-2.5 px-3 text-right">Cost Price</th>
                                                                    <th className="py-2.5 px-3 text-right">Remaining Qty</th>
                                                                    <th className="py-2.5 px-3 text-right">Remaining Value</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {modalDetails.batches.map((b, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200">
                                                                            {b.id}
                                                                            <span className="block text-3xs text-slate-400 font-mono">Inwarded {b.date}</span>
                                                                        </td>
                                                                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 font-bold">{formatCurrency(b.cost, store)}</td>
                                                                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 font-semibold">{b.qtyLeft} <span className="text-2xs text-slate-400">/ {b.receivedQty}</span></td>
                                                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(b.qtyLeft * b.cost, store)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent Stock Audit Ledger */}
                                            <div className="md:col-span-6 flex flex-col">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><Activity size={13} /> Reconstruction Audit Trail</h4>
                                                {modalDetails.ledger.length === 0 ? (
                                                    <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic">
                                                        No stock movement ledger transactions found.
                                                    </div>
                                                ) : (
                                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700">
                                                                <tr>
                                                                    <th className="py-2.5 px-3">Date</th>
                                                                    <th className="py-2.5 px-3">Transaction</th>
                                                                    <th className="py-2.5 px-3">Reference</th>
                                                                    <th className="py-2.5 px-3 text-right">Delta Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {modalDetails.ledger.map((l, idx) => (
                                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                                                        <td className="py-2.5 px-3 text-slate-500 font-mono">{l.date}</td>
                                                                        <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200">
                                                                            {l.type}
                                                                            <span className="block text-3xs text-slate-400 font-sans">by {l.user}</span>
                                                                        </td>
                                                                        <td className="py-2.5 px-3 font-mono text-slate-500">{l.ref}</td>
                                                                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${l.qty.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>{l.qty}</td>
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
                                    <button onClick={() => handleSelectItem(null)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors">Close</button>
                                </div>

                            </div>
                        </div>
                    );
                })()}

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
