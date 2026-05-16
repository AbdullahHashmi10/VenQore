import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    Percent, Search, Filter, ArrowLeft, Tag, Users, TrendingUp, AlertTriangle, BadgePercent
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DiscountReport({ invoices = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'discount', direction: 'desc' });
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Derived Data ---
    const processedData = useMemo(() => {
        let data = invoices.filter(inv => Number(inv.discount) > 0); // Only bills with discount

        // 1. Filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(inv =>
                inv.invoice_number.toString().toLowerCase().includes(lowerQ) ||
                (inv.party?.name || '').toLowerCase().includes(lowerQ)
            );
        }

        // 2. Sort
        data.sort((a, b) => {
            let valA = a[sortBy.key];
            let valB = b[sortBy.key];

            // Handle numeric or special keys
            if (sortBy.key === 'party_name') {
                valA = a.party?.name || 'Walk-in';
                valB = b.party?.name || 'Walk-in';
            } else if (sortBy.key === 'percentage') {
                const subTotalA = Number(a.total_amount) + Number(a.discount);
                const subTotalB = Number(b.total_amount) + Number(b.discount);
                valA = subTotalA > 0 ? (Number(a.discount) / subTotalA) * 100 : 0;
                valB = subTotalB > 0 ? (Number(b.discount) / subTotalB) * 100 : 0;
            } else {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [invoices, searchQuery, sortBy]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalDiscount = processedData.reduce((acc, curr) => acc + Number(curr.discount), 0);
        const count = processedData.length;
        const avgDiscount = count > 0 ? totalDiscount / count : 0;

        let maxDiscount = 0;
        let heavyDiscountCount = 0; // > 15%

        processedData.forEach(inv => {
            const val = Number(inv.discount);
            if (val > maxDiscount) maxDiscount = val;

            const subTotal = Number(inv.total_amount) + val;
            const pct = subTotal > 0 ? (val / subTotal) * 100 : 0;
            if (pct > 15) heavyDiscountCount++;
        });

        return { totalDiscount, count, avgDiscount, maxDiscount, heavyDiscountCount };
    }, [processedData]);

    // --- Chart: Discount Severity (Pie) ---
    const severityData = useMemo(() => {
        let low = 0, medium = 0, high = 0;
        processedData.forEach(inv => {
            const subTotal = Number(inv.total_amount) + Number(inv.discount);
            const pct = subTotal > 0 ? (Number(inv.discount) / subTotal) * 100 : 0;

            if (pct < 5) low++;
            else if (pct < 15) medium++;
            else high++;
        });

        return [
            { name: 'Light (<5%)', value: low, color: '#10b981' }, // Emerald
            { name: 'Standard (5-15%)', value: medium, color: '#3b82f6' }, // Blue
            { name: 'Heavy (>15%)', value: high, color: '#f43f5e' } // Rose
        ].filter(d => d.value > 0);
    }, [processedData]);

    // --- Chart: Top Customers by Discount Given (Bar) ---
    const topCustomers = useMemo(() => {
        const map = {};
        processedData.forEach(inv => {
            const name = inv.party?.name || 'Walk-in';
            if (!map[name]) map[name] = 0;
            map[name] += Number(inv.discount);
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [processedData]);


    const handleSort = (key) => {
        setSortBy(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.discount-report", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.discount-report", {
            store_slug: store.slug
        }), {
            range: 'custom',
            start_date: customStart,
            end_date: customEnd
        }, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    return (
        <ReportsLayout title="Discount Report">
            <Head title="Discount Analysis" />
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
                                <BadgePercent className="text-rose-500" size={20} />
                                Discount Analytics
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Tracking giveaways & price reductions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search Customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 w-48 transition-all"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center">
                            {['today', 'this_month', 'this_year'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRangeChange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {r.replace('_', ' ')}
                                </button>
                            ))}
                            {/* Custom Date Trigger */}
                            <div className="flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2">
                                <button
                                    onClick={() => handleRangeChange('custom')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === 'custom'
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Custom
                                </button>
                                {dateRange === 'custom' && (
                                    <div className="flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-300">
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={e => setCustomStart(e.target.value)}
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-rose-500"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={e => setCustomEnd(e.target.value)}
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-rose-500"
                                        />
                                        <button onClick={applyCustomRange} className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                                            <ArrowLeft size={10} className="rotate-180" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <StatCard
                        title="Total Discounts"
                        value={formatCurrency(stats.totalDiscount)}
                        icon={<Tag size={18} />}
                        color="rose"
                    />
                    <StatCard
                        title="Discounted Bills"
                        value={stats.count}
                        icon={<Percent size={18} />}
                        color="indigo"
                        footer={`${stats.count > 0 ? ((stats.count / invoices.length) * 100).toFixed(1) : 0}% of Total Bills`}
                    />
                    <StatCard
                        title="Avg per Bill"
                        value={formatCurrency(stats.avgDiscount)}
                        icon={<TrendingUp size={18} />}
                        color="blue"
                    />
                    <StatCard
                        title="Heavy Discounts"
                        value={stats.heavyDiscountCount}
                        icon={<AlertTriangle size={18} />}
                        color="amber"
                        footer="Bills with > 15%"
                    />
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Discount Details</h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {processedData.length} Records
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <SortableHeader label="Invoice" colKey="invoice_number" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Date" colKey="created_at" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Customer" colKey="party_name" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Bill Total" colKey="total_amount" align="right" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Amount Off" colKey="discount" align="right" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="%" colKey="percentage" align="right" currentSort={sortBy} onSort={handleSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedData.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="h-64">
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                                                        <Tag size={32} className="text-slate-300 opacity-50" />
                                                    </div>
                                                    <p className="font-medium text-sm">No discounts found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        processedData.map((inv, idx) => {
                                            const subTotal = Number(inv.total_amount) + Number(inv.discount);
                                            const pct = subTotal > 0 ? (Number(inv.discount) / subTotal) * 100 : 0;
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">#{inv.invoice_number}</td>
                                                    <td className="px-6 py-3 text-xs text-slate-500">
                                                        {new Date(inv.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                        {inv.party?.name || 'Walk-in'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-xs text-slate-500 font-mono">
                                                        {formatCurrency(inv.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                                                        -{formatCurrency(inv.discount)}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <DiscountBadge pct={pct} />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: CHARTS (1 Col) - Flex Split */}
                    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">

                        {/* 1. By Severity */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Discount Range</h3>
                            <div className="flex-1 w-full h-full min-h-0 relative">
                                {severityData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <PieChart>
                                                <Pie
                                                    data={severityData}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="50%"
                                                    outerRadius="70%"
                                                    paddingAngle={5}
                                                >
                                                    {severityData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                            <div className="text-center">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Avg</p>
                                                <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                                                    {stats.count > 0 ? (stats.totalDiscount / (stats.totalDiscount + processedData.reduce((a, c) => a + Number(c.total_amount), 0)) * 100).toFixed(1) : 0}%
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No data</div>
                                )}
                            </div>
                        </div>

                        {/* 2. Top Customers */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Top Discounted Customers</h3>
                            <div className="flex-1 w-full h-full min-h-0">
                                {topCustomers.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={topCustomers} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                formatter={(value) => formatCurrency(value)}
                                            />
                                            <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={16} background={{ fill: 'transparent' }} />
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
        rose: 'bg-rose-500',
        indigo: 'bg-indigo-500',
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
    };
    const textColors = {
        rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
        indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
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
            <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                <div className={`flex flex-col text-[8px] leading-none ${isActive ? 'text-rose-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    <span className={isActive && currentSort.direction === 'asc' ? 'opacity-100' : 'opacity-40'}>▲</span>
                    <span className={isActive && currentSort.direction === 'desc' ? 'opacity-100' : 'opacity-40'}>▼</span>
                </div>
            </div>
        </th>
    );
}

function DiscountBadge({ pct }) {
    if (pct < 5) return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded">{pct.toFixed(1)}%</span>;
    if (pct < 15) return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded">{pct.toFixed(1)}%</span>;
    return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold rounded animate-pulse">{pct.toFixed(1)}%</span>;
}
