import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ShoppingCart, Search, Filter, ArrowLeft, Package, Clock, CheckCircle, XCircle, Box
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

export default function SaleOrders({ orders = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'date', direction: 'desc' });
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, cancelled
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Derived Data ---
    const processedOrders = useMemo(() => {
        let data = [...orders];

        // 1. Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(order =>
                order.order_number.toString().toLowerCase().includes(lowerQ) ||
                (order.party?.name || '').toLowerCase().includes(lowerQ)
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            data = data.filter(order => order.status === statusFilter);
        }

        // 3. Sort
        data.sort((a, b) => {
            let valA = a[sortBy.key];
            let valB = b[sortBy.key];

            if (sortBy.key === 'amount') {
                valA = Number(a.total_amount);
                valB = Number(b.total_amount);
            } else if (sortBy.key === 'date') {
                valA = new Date(a.created_at);
                valB = new Date(b.created_at);
            } else if (sortBy.key === 'customer') {
                valA = a.party?.name || '';
                valB = b.party?.name || '';
            }

            if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [orders, searchQuery, sortBy, statusFilter]);

    // --- Stats ---
    const stats = useMemo(() => {
        const total = processedOrders.length;
        const totalValue = processedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

        let pending = 0, completed = 0, cancelled = 0;
        processedOrders.forEach(o => {
            if (o.status === 'pending') pending++;
            else if (o.status === 'completed') completed++;
            else cancelled++;
        });

        return { total, totalValue, pending, completed, cancelled };
    }, [processedOrders]);

    // --- Chart: Status Distribution (Donut) ---
    const statusData = useMemo(() => {
        return [
            { name: 'Completed', value: stats.completed, color: '#10b981' }, // Emerald
            { name: 'Pending', value: stats.pending, color: '#f59e0b' },   // Amber
            { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' } // Red
        ].filter(d => d.value > 0);
    }, [stats]);

    // --- Chart: Daily Volume (Bar) ---
    // Simple grouping by date for the visible filtered dataset
    const timelineData = useMemo(() => {
        const map = {};
        processedOrders.forEach(o => {
            const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!map[date]) map[date] = 0;
            map[date] += 1;
        });

        // Convert to array and take last 7 entries if too many
        let arr = Object.keys(map).map(date => ({ date, count: map[date] }));
        if (arr.length > 7) arr = arr.slice(arr.length - 7);
        return arr;
    }, [processedOrders]);


    const handleSort = (key) => {
        setSortBy(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.sale-orders", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.sale-orders", {
            store_slug: store.slug
        }), {
            range: 'custom',
            start_date: customStart,
            end_date: customEnd
        }, { preserveState: true, preserveScroll: true });
    };


    return (
        <ReportsLayout title="Sales Orders Report">
            <Head title="Order Management" />
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
                                <ShoppingCart className="text-sky-500" size={20} />
                                Sales Orders
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Tracking order pipeline & status</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search Orders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 w-48 transition-all"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center">
                            {['today', 'this_month', 'this_year'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRangeChange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {r.replace('_', ' ')}
                                </button>
                            ))}
                            <div className="flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2">
                                <button
                                    onClick={() => handleRangeChange('custom')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === 'custom'
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400'
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
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-sky-500"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={e => setCustomEnd(e.target.value)}
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-sky-500"
                                        />
                                        <button onClick={applyCustomRange} className="p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
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
                        title="Total Orders"
                        value={stats.total}
                        icon={<Package size={18} />}
                        color="sky"
                        footer={formatCurrency(stats.totalValue)}
                    />
                    <StatCard
                        title="Pending Processing"
                        value={stats.pending}
                        icon={<Clock size={18} />}
                        color="amber"
                        footer="Needs Action"
                    />
                    <StatCard
                        title="Completed"
                        value={stats.completed}
                        icon={<CheckCircle size={18} />}
                        color="emerald"
                        footer={`${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}% Completion`}
                    />
                    <StatCard
                        title="Cancelled"
                        value={stats.cancelled}
                        icon={<XCircle size={18} />}
                        color="rose"
                    />
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Order List</h3>
                                {/* Status Toggle */}
                                <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
                                    {['all', 'pending', 'completed'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStatusFilter(s)}
                                            className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all ${statusFilter === s ? 'bg-white dark:bg-slate-500 shadow-sm text-sky-600' : 'text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {processedOrders.length} Items
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <SortableHeader label="Order #" colKey="order_number" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Date" colKey="date" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Customer" colKey="customer" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Amount" colKey="amount" align="right" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Status" colKey="status" align="center" currentSort={sortBy} onSort={handleSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="h-64">
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                                                        <Box size={32} className="text-slate-300 opacity-50" />
                                                    </div>
                                                    <p className="font-medium text-sm">No orders found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        processedOrders.map((order, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-mono text-xs text-sky-600 dark:text-sky-400 font-bold">#{order.order_number}</td>
                                                <td className="px-6 py-3 text-xs text-slate-500">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {order.party?.name || 'Walk-in Customer'}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                    {formatCurrency(order.total_amount)}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <StatusBadge status={order.status} />
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

                        {/* 1. Status Overview */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Order Status</h3>
                            <div className="flex-1 w-full h-full min-h-0 relative">
                                {statusData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <PieChart>
                                                <Pie
                                                    data={statusData}
                                                    dataKey="value"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="50%"
                                                    outerRadius="70%"
                                                    paddingAngle={5}
                                                >
                                                    {statusData.map((entry, index) => (
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
                                    </>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No data</div>
                                )}
                            </div>
                        </div>

                        {/* 2. Volume Trend */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Daily Volume (Last 7 Days)</h3>
                            <div className="flex-1 w-full h-full min-h-0">
                                {timelineData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={timelineData} margin={{ left: -20, right: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            />
                                            <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No activity</div>
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
        sky: 'bg-sky-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
    };
    const textColors = {
        sky: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
        rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
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
                <div className={`flex flex-col text-[8px] leading-none ${isActive ? 'text-sky-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    <span className={isActive && currentSort.direction === 'asc' ? 'opacity-100' : 'opacity-40'}>?</span>
                    <span className={isActive && currentSort.direction === 'desc' ? 'opacity-100' : 'opacity-40'}>?</span>
                </div>
            </div>
        </th>
    );
}

function StatusBadge({ status }) {
    if (status === 'completed') return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded">Completed</span>;
    if (status === 'pending') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded animate-pulse">Pending</span>;
    if (status === 'cancelled') return <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold rounded">Cancelled</span>;
    return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold rounded">{status}</span>;
}
