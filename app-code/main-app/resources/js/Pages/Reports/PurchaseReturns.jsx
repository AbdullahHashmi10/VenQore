import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ArrowLeft, Search, Filter, Calendar, PackageMinus, Printer, FileText, ArrowUpRight
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function PurchaseReturnsReport({ returns = [], filters = {}, suppliers = [] }) {
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [supplierId, setSupplierId] = useState(filters.supplier_id || '');

    // Resolve date range query updates
    const handleFilterChange = (range, supplier) => {
        setDateRange(range);
        setSupplierId(supplier);

        router.get(route('store.reports.purchase-returns', {
            store_slug: store.slug,
            range: range,
            supplier_id: supplier
        }), {}, { preserveState: true });
    };

    const processedData = useMemo(() => {
        let data = [...returns];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(ret =>
                (ret.reference_number || '').toLowerCase().includes(lowerQ) ||
                (ret.supplier?.name || '').toLowerCase().includes(lowerQ) ||
                (ret.reason || '').toLowerCase().includes(lowerQ)
            );
        }

        return data;
    }, [returns, searchQuery]);

    const totalReturnAmount = useMemo(() => {
        return processedData.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    }, [processedData]);

    const chartData = useMemo(() => {
        const groups = {};
        processedData.forEach(r => {
            const dateStr = new Date(r.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
            groups[dateStr] = (groups[dateStr] || 0) + parseFloat(r.amount || 0);
        });

        return Object.entries(groups).map(([date, amount]) => ({
            date,
            amount: parseFloat(amount.toFixed(2))
        })).reverse(); // Oldest first
    }, [processedData]);

    return (
        <ReportsLayout title="Purchase Returns Report" activeTab="purchases">
            <Head title="Purchase Returns Report" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('store.reports.index', { store_slug: store?.slug })}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <PackageMinus className="text-red-500 w-6 h-6" />
                                Purchase Returns
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Track and analyze stock returns and debit notes sent to suppliers.</p>
                        </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Calendar size={16} className="text-slate-400" />
                            <select
                                value={dateRange}
                                onChange={(e) => handleFilterChange(e.target.value, supplierId)}
                                className="border-0 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 p-0 focus:ring-0 focus:outline-none cursor-pointer"
                            >
                                <option value="today">Today</option>
                                <option value="yesterday">Yesterday</option>
                                <option value="this_week">This Week</option>
                                <option value="this_month">This Month</option>
                                <option value="last_month">Last Month</option>
                                <option value="this_year">This Year</option>
                                <option value="all">All Time</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                            <select
                                value={supplierId}
                                onChange={(e) => handleFilterChange(dateRange, e.target.value)}
                                className="border-0 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 p-0 focus:ring-0 focus:outline-none cursor-pointer"
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Total Stats Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Returned Amount</span>
                        <div className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">
                            {formatCurrency(totalReturnAmount, store)}
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl">
                        <PackageMinus className="text-red-500 w-8 h-8" />
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Returns Trend</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                                    <Tooltip 
                                        formatter={(value) => [formatCurrency(value, store), 'Returned']}
                                        contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    />
                                    <Bar dataKey="amount" fill="#F43F5E" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Table search & list */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by Supplier name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs md:text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-2xs">
                                <tr>
                                    <th className="px-6 py-4">Ref Number</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                {processedData.length > 0 ? (
                                    processedData.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                {item.reference_number || `#${item.id}`}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200">
                                                {item.supplier?.name || 'Walk-in'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic">
                                                {item.reason || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-red-650 dark:text-red-400">
                                                {formatCurrency(item.amount, store)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase ${
                                                    item.status === 'refunded' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={route('store.debit-notes.show', { store_slug: store?.slug, id: item.id })}
                                                    className="inline-flex items-center gap-1 text-2xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline uppercase"
                                                >
                                                    View Details <ArrowUpRight size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-slate-400 font-semibold">
                                            No purchase returns found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}
