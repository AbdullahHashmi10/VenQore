import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    Package, Search, Filter, ArrowLeft, Layers, ShoppingBag, DollarSign, Tag
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency } from '@/Utils/format';

export default function SaleOrderItems({ items = [], filters = {} }) {
    const {
        store
    } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState({ key: 'subtotal', direction: 'desc' });
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // --- Derived Data ---
    const processedItems = useMemo(() => {
        let data = [...items];

        // 1. Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.sales_order?.order_number || '').toString().toLowerCase().includes(lowerQ) ||
                (item.product?.name || '').toLowerCase().includes(lowerQ)
            );
        }

        // 2. Sort
        data.sort((a, b) => {
            let valA = a[sortBy.key];
            let valB = b[sortBy.key];

            if (sortBy.key === 'order_number') {
                valA = Number(a.sales_order?.order_number || 0);
                valB = Number(b.sales_order?.order_number || 0);
            } else if (sortBy.key === 'product') {
                valA = a.product?.name || '';
                valB = b.product?.name || '';
            } else if (sortBy.key === 'subtotal') {
                valA = Number(a.quantity) * Number(a.price);
                valB = Number(b.quantity) * Number(b.price);
            } else if (sortBy.key === 'quantity') {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return sortBy.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortBy.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [items, searchQuery, sortBy]);

    // --- Stats ---
    const stats = useMemo(() => {
        const totalItems = processedItems.reduce((acc, curr) => acc + Number(curr.quantity), 0);
        const totalRevenue = processedItems.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.price)), 0);
        const count = processedItems.length;
        const avgPrice = count > 0 ? totalRevenue / count : 0;

        // Find most popular
        const productCounts = {};
        processedItems.forEach(i => {
            const name = i.product?.name || 'Unknown';
            if (!productCounts[name]) productCounts[name] = 0;
            productCounts[name] += Number(i.quantity);
        });

        const topProduct = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalItems,
            totalRevenue,
            avgPrice,
            topProductEntry: topProduct ? { name: topProduct[0], qty: topProduct[1] } : null
        };
    }, [processedItems]);

    // --- Chart: Top Selling Products (Bar) ---
    const topProducts = useMemo(() => {
        const map = {};
        processedItems.forEach(i => {
            const name = i.product?.name || 'Unknown';
            if (!map[name]) map[name] = 0;
            map[name] += Number(i.quantity);
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [processedItems]);

    // --- Chart: Revenue Share (Pie) ---
    const revenueShare = useMemo(() => {
        const map = {};
        processedItems.forEach(i => {
            const name = i.product?.name || 'Unknown';
            if (!map[name]) map[name] = 0;
            map[name] += (Number(i.quantity) * Number(i.price));
        });

        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 by revenue
    }, [processedItems]);

    // Add colors for charts
    const pieColors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];


    const handleSort = (key) => {
        setSortBy(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.sale-order-items", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.sale-order-items", {
            store_slug: store.slug
        }), {
            range: 'custom',
            start_date: customStart,
            end_date: customEnd
        }, { preserveState: true, preserveScroll: true });
    };


    return (
        <ReportsLayout title="Order Items Report">
            <Head title="Item Analysis" />
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
                                <Layers className="text-violet-500" size={20} />
                                Order Items
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Product performance in sales orders</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="Search Item or Order #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 w-52 transition-all"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center">
                            {['today', 'this_month', 'this_year'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRangeChange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {r.replace('_', ' ')}
                                </button>
                            ))}
                            {/* Custom Trigger */}
                            <div className="flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2">
                                <button
                                    onClick={() => handleRangeChange('custom')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === 'custom'
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400'
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
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-violet-500"
                                        />
                                        <span className="text-slate-400">-</span>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={e => setCustomEnd(e.target.value)}
                                            className="p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-violet-500"
                                        />
                                        <button onClick={applyCustomRange} className="p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700">
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
                        title="Total Items Sold"
                        value={stats.totalItems.toLocaleString()}
                        icon={<ShoppingBag size={18} />}
                        color="violet"
                        footer="Units moved"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats.totalRevenue, store)}
                        icon={<DollarSign size={18} />}
                        color="emerald"
                    />
                    <StatCard
                        title="Avg Unit Price"
                        value={formatCurrency(stats.avgPrice, store)}
                        icon={<Tag size={18} />}
                        color="blue"
                    />
                    <StatCard
                        title="Top Seller"
                        value={stats.topProductEntry ? stats.topProductEntry.name.substring(0, 15) + (stats.topProductEntry.name.length > 15 ? '...' : '') : 'N/A'}
                        icon={<Package size={18} />}
                        color="amber"
                        footer={stats.topProductEntry ? `${stats.topProductEntry.qty} Units` : ''}
                    />
                </div>

                {/* 3. MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Item Details</h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {processedItems.length} Rows
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar relative">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr>
                                        <SortableHeader label="Order #" colKey="order_number" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Product Name" colKey="product" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Qty" colKey="quantity" align="center" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Price" colKey="price" align="right" currentSort={sortBy} onSort={handleSort} />
                                        <SortableHeader label="Total" colKey="subtotal" align="right" currentSort={sortBy} onSort={handleSort} />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedItems.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="h-64">
                                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
                                                        <Search size={32} className="text-slate-300 opacity-50" />
                                                    </div>
                                                    <p className="font-medium text-sm">No items found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        processedItems.map((item, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-3 font-mono text-xs text-violet-600 dark:text-violet-400 font-bold">
                                                    #{item.sales_order?.order_number}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    {item.product?.name || 'Unknown Product'}
                                                    {/* Optional: Add status dot from sales order */}
                                                    {item.sales_order?.status && (
                                                        <span className={`ml-2 w-1.5 h-1.5 inline-block rounded-full ${item.sales_order.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`} title={`Order is ${item.sales_order.status}`} />
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-center text-sm text-slate-500">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-3 text-right text-xs text-slate-500 font-mono">
                                                    {formatCurrency(item.price, store)}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                    {formatCurrency(item.quantity * item.price, store)}
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

                        {/* 1. Top Products by Volume */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Most Ordered Items</h3>
                            <div className="flex-1 w-full h-full min-h-0">
                                {topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} background={{ fill: 'transparent' }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">No data</div>
                                )}
                            </div>
                        </div>

                        {/* 2. Top Products by Revenue */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Top Revenue Generators</h3>
                            <div className="flex-1 w-full h-full min-h-0 relative">
                                {revenueShare.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <PieChart>
                                            <Pie
                                                data={revenueShare}
                                                dataKey="value"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="50%"
                                                outerRadius="70%"
                                                paddingAngle={5}
                                            >
                                                {revenueShare.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(val) => formatCurrency(val, store)}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                                        </PieChart>
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
        violet: 'bg-violet-500',
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        amber: 'bg-amber-500',
    };
    const textColors = {
        violet: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-2 rounded-lg ${textColors[color]} shrink-0`}>
                    {icon}
                </div>
                {footer && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate max-w-[100px]">{footer}</span>}
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
                <div className={`flex flex-col text-[8px] leading-none ${isActive ? 'text-violet-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    <span className={isActive && currentSort.direction === 'asc' ? 'opacity-100' : 'opacity-40'}>?</span>
                    <span className={isActive && currentSort.direction === 'desc' ? 'opacity-100' : 'opacity-40'}>?</span>
                </div>
            </div>
        </th>
    );
}
