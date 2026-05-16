import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    Clock, Search, Filter, ArrowLeft, Users, TrendingUp, AlertTriangle, AlertOctagon, Calendar
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

export default function SaleAging({ invoices = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'days', direction: 'desc' });
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [bucketFilter, setBucketFilter] = useState('all'); // all, 0-30, 31-60, 61-90, 90+

    // --- Derived Data ---
    const processedInvoices = useMemo(() => {
        let data = [...invoices];

        // 1. Search Filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(inv =>
                inv.invoice_number.toString().toLowerCase().includes(lowerQ) ||
                (inv.party || '').toLowerCase().includes(lowerQ)
            );
        }

        // 2. Bucket Filter
        if (bucketFilter !== 'all') {
            data = data.filter(inv => inv.category === bucketFilter);
        }

        // 3. Sort
        data.sort((a, b) => {
            let valA = a[sortBy.key];
            let valB = b[sortBy.key];

            if (sortBy.key === 'amount') {
                valA = Number(valA);
                valB = Number(valB);
            } else if (sortBy.key === 'days') {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [invoices, searchQuery, sortBy, bucketFilter]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalOutstanding = processedInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const count = processedInvoices.length;

        // Buckets
        const buckets = { '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 };
        let criticalAmount = 0;

        processedInvoices.forEach(inv => {
            const amt = Number(inv.amount);
            if (buckets[inv.category] !== undefined) buckets[inv.category] += amt;
            else buckets['90+'] += amt; // Fallback

            if (inv.category === '90+' || inv.category === '60-90') criticalAmount += amt;
        });

        const riskScore = totalOutstanding > 0 ? (criticalAmount / totalOutstanding) * 100 : 0;

        return { totalOutstanding, count, buckets, criticalAmount, riskScore };
    }, [processedInvoices]);

    // --- Chart: Aging Distribution (Donut) ---
    const agingData = useMemo(() => {
        const data = [
            { name: '0-30 Days', value: stats.buckets['0-30'], color: '#10b981', category: '0-30' },
            { name: '30-60 Days', value: stats.buckets['30-60'], color: '#3b82f6', category: '30-60' },
            { name: '60-90 Days', value: stats.buckets['60-90'], color: '#f59e0b', category: '60-90' },
            { name: '90+ Days', value: stats.buckets['90+'], color: '#ef4444', category: '90+' }
        ].filter(d => d.value > 0);
        return data;
    }, [stats]);

    // --- Chart: Top Debtors (Bar) ---
    const topDebtors = useMemo(() => {
        const map = {};
        processedInvoices.forEach(inv => {
            const name = inv.party || 'Unknown';
            if (!map[name]) map[name] = 0;
            map[name] += Number(inv.amount);
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [processedInvoices]);

    const handleSort = (key) => {
        setSortBy(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };


    return (
        <ReportsLayout title="Sale Aging Report">
            <Head title="Aging Analysis" />
            <div className="flex flex-col h-full gap-4 w-full">

                {/* 1. HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route("store.reports.index", {
                            store_slug: store.slug
                        })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                <Clock className="text-orange-500" size={20} />
                                Sale Aging
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Tracking outstanding receivables</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search Debtor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 w-48 transition-all"
                            />
                        </div>

                        {/* Bucket Quick Filter */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {['all', '90+', '60-90'].map((b) => (
                                <button
                                    key={b}
                                    onClick={() => setBucketFilter(b)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${bucketFilter === b
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-orange-600 dark:text-orange-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {b === 'all' ? 'All Buckets' : b + ' Days'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <StatCard
                        title="Total Outstanding"
                        value={formatCurrency(stats.totalOutstanding)}
                        icon={<AlertOctagon size={18} />}
                        color="indigo"
                        footer={`${stats.count} Open Invoices`}
                    />
                    <StatCard
                        title="Critical Amount (>60d)"
                        value={formatCurrency(stats.criticalAmount)}
                        icon={<AlertTriangle size={18} />}
                        color="red"
                        footer="Immediate Action Reqd"
                    />
                    <StatCard
                        title="Risk Exposure"
                        value={stats.riskScore.toFixed(1) + '%'}
                        icon={<TrendingUp size={18} />}
                        color="orange"
                        footer="% of Debt > 60 Days"
                    />
                    <StatCard
                        title="Fresh Debt (<30d)"
                        value={formatCurrency(stats.buckets['0-30'])}
                        icon={<Calendar size={18} />}
                        color="emerald"
                        footer="Healthy Receivables"
                    />
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Aging Details</h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {processedInvoices.length} Bills
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <SortableHeader label="Invoice" colKey="invoice_number" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Customer" colKey="party" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Owed Amount" colKey="amount" align="right" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Days Old" colKey="days" align="center" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Status" colKey="category" align="center" currentSort={sortBy} onSort={handleSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="h-64">
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                                                        <Clock size={32} className="text-slate-300 opacity-50" />
                                                    </div>
                                                    <p className="font-medium text-sm">No outstanding bills found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        processedInvoices.map((inv, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-mono text-xs text-slate-500">#{inv.invoice_number}</td>
                                                <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {inv.party}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                    {formatCurrency(inv.amount)}
                                                </td>
                                                <td className="px-6 py-3 text-center text-xs text-slate-500 font-mono">
                                                    {inv.days}d
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <AgingBadge category={inv.category} />
                                                </td>
                                            </tr>
                                        )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: CHARTS (1 Col) - Flex Split */}
                    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">

                        {/* 1. Aging Breakdown */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Aging Breakdown</h3>
                            <div className="flex-1 w-full h-full min-h-0 relative">
                                {agingData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <PieChart>
                                                <Pie
                                                    data={agingData}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="50%"
                                                    outerRadius="70%"
                                                    paddingAngle={5}
                                                >
                                                    {agingData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(val) => formatCurrency(val)}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                                                <p className="text-lg font-black text-slate-700 dark:text-white">
                                                    {((stats.totalOutstanding / 1000).toFixed(1))}k
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No data</div>
                                )}
                            </div>
                        </div>

                        {/* 2. Top Debtors */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Top Debtors</h3>
                            <div className="flex-1 w-full h-full min-h-0">
                                {topDebtors.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={topDebtors} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                formatter={(value) => formatCurrency(value)}
                                            />
                                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} background={{ fill: 'transparent' }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No data</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}

// --- Components ---
function StatCard({ title, value, icon, color, footer }) {
    const bgColors = {
        red: 'bg-red-500',
        indigo: 'bg-indigo-500',
        emerald: 'bg-emerald-500',
        orange: 'bg-orange-500',
    };
    const textColors = {
        red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
        indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
        orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-2 rounded-lg ${textColors[color]} shrink-0`}>
                    {icon}
                </div>
                {footer && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{footer}</span>}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5">{value}</h3>
            </div>
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none group-hover:scale-110 transition-transform duration-500`} />
        </div>
    );
}

function SortableHeader({ label, colKey, align = 'left', currentSort, onSort }) {
    const isActive = currentSort.key === colKey;
    return (
        <th
            onClick={() => onSort(colKey)}
            className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none`}
            style={{ textAlign: align }}
        >
            <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                <div className={`flex flex-col text-[8px] leading-none ${isActive ? 'text-orange-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    <span className={isActive && currentSort.direction === 'asc' ? 'opacity-100' : 'opacity-40'}>▲</span>
                    <span className={isActive && currentSort.direction === 'desc' ? 'opacity-100' : 'opacity-40'}>▼</span>
                </div>
            </div>
        </th>
    );
}

function AgingBadge({ category }) {
    if (category === '90+') return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded animate-pulse">Critical 90+</span>;
    if (category === '60-90') return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold rounded">High 60-90</span>;
    if (category === '30-60') return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded">At Risk 30-60</span>;
    return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded">Fresh 0-30</span>;
}
