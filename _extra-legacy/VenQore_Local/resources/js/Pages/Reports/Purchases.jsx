import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Search,
    Filter,
    Calendar,
    Download,
    Printer,
    ArrowUpRight,
    ArrowDownRight,
    Banknote,
    CreditCard,
    AlertCircle,
    Wallet,
    TrendingUp,
    TrendingDown,
    Building2,
    Sparkles,
    BrainCircuit
} from 'lucide-react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { formatCurrency } from '@/Utils/format';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function PurchasesReport({ purchases = [], stats = {}, filters = {}, suppliers = [] }) {
    const {
        store
    } = usePage().props;

    // --- State ---
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(filters.range === 'custom');
    const [customStart, setCustomStart] = useState(filters.start_date || '');
    const [customEnd, setCustomEnd] = useState(filters.end_date || '');

    // --- Helpers ---
    const formatDate = (dateString, options = {}) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-GB', options);
        } catch (e) {
            return dateString;
        }
    };

    // --- Derived Data (Search & Sort) ---
    const processedPurchases = useMemo(() => {
        let data = [...purchases];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.invoice_number || '').toLowerCase().includes(lowerQ) ||
                (item.party?.name || '').toLowerCase().includes(lowerQ)
            );
        }

        return data;
    }, [purchases, searchQuery]);

    // --- Growth Engine Insights (AI Analysis) ---
    const aiInsights = useMemo(() => {
        if (purchases.length === 0) {
            return [{
                type: 'neutral',
                title: 'Waiting for Data',
                message: 'Growth Engine needs transaction data to generate insights. Add purchases to see analysis here.'
            }];
        }

        const totalValue = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);

        // Supplier Concentration
        const supplierSpend = {};
        purchases.forEach(p => {
            const name = p.party?.name || 'Unknown';
            supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount || 0);
        });

        const sortedSuppliers = Object.entries(supplierSpend)
            .sort(([, a], [, b]) => b - a);

        const topSupplier = sortedSuppliers[0];
        const topSupplierShare = (topSupplier[1] / totalValue) * 100;

        // Payment Efficiency
        const paidCount = purchases.filter(p => p.status === 'paid' || p.paid_amount >= p.total_amount).length;
        const unpaidCount = purchases.length - paidCount;
        const unpaidRatio = (unpaidCount / purchases.length) * 100;

        const insights = [];

        if (topSupplierShare > 40) {
            insights.push({
                type: 'warning',
                title: 'High Supplier Dependency',
                message: `${topSupplier[0]} accounts for ${topSupplierShare.toFixed(1)}% of your total spending. Consider diversifying suppliers to reduce risk.`
            });
        } else {
            insights.push({
                type: 'success',
                title: 'Balanced Supplier Mix',
                message: 'Your spending is well-distributed. Top supplier share is ' + topSupplierShare.toFixed(1) + '%.'
            });
        }

        if (unpaidRatio > 50) {
            insights.push({
                type: 'critical',
                title: 'Payment Backlog',
                message: `${unpaidRatio.toFixed(1)}% of bills are unpaid. Prioritize critical vendors to maintain credit lines.`
            });
        }

        return insights;
    }, [purchases]);


    // --- Chart Data Preparation ---
    const chartData = useMemo(() => {
        // Daily Spending
        const dailyMap = {};
        purchases.forEach(p => {
            const date = p.created_at ? p.created_at.split('T')[0] : '';
            if (date) {
                dailyMap[date] = (dailyMap[date] || 0) + parseFloat(p.total_amount || 0);
            }
        });
        const daily = Object.keys(dailyMap).sort().map(date => ({
            name: formatDate(date, { day: '2-digit', month: 'short' }),
            value: dailyMap[date]
        }));

        // Top 5 Suppliers
        const supplierMap = {};
        purchases.forEach(p => {
            const name = p.party?.name || 'Unknown';
            supplierMap[name] = (supplierMap[name] || 0) + parseFloat(p.total_amount || 0);
        });
        const suppliersList = Object.keys(supplierMap)
            .map(name => ({ name, value: supplierMap[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { daily, suppliers: suppliersList };
    }, [purchases]);


    // --- Event Handlers ---
    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r === 'custom') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
            router.get(route("store.reports.purchases", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            router.get(route("store.reports.purchases", {
                store_slug: store.slug
            }), {
                range: 'custom',
                start_date: customStart,
                end_date: customEnd
            }, { preserveState: true, preserveScroll: true });
        }
    };

    // --- Colors ---
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];

    return (
        <ReportsLayout title="Purchases Report">
            <Head title="Purchases Report" />
            {/* Changed from p-6 h-[calc...] to simple container as ReportsLayout handles scroll/padding */}
            <div className="space-y-6 max-w-[1600px] mx-auto min-h-0">

                {/* HEADERS & FILTERS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Wallet className="text-indigo-500" />
                            Purchases & Expenses
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track spending, manage suppliers, and analyze costs</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search bills or suppliers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 w-64"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            {['today', 'this_month', 'this_year', 'custom'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRangeChange(r)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r
                                            ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {r === 'this_month' ? 'This Month' : r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>

                        {showCustomDate && (
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg animate-in slide-in-from-right-5 fade-in duration-300">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
                                />
                                <button
                                    onClick={applyCustomRange}
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs"
                                >
                                    Go
                                </button>
                            </div>
                        )}

                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Purchases"
                        value={stats.total_purchases}
                        isCurrency
                        icon={<Wallet size={20} className="text-white" />}
                        color="bg-indigo-500"
                    />
                    <StatCard
                        title="Amount Paid"
                        value={stats.total_paid}
                        isCurrency
                        icon={<CreditCard size={20} className="text-white" />}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Payable Due"
                        value={stats.total_due}
                        isCurrency
                        icon={<AlertCircle size={20} className="text-white" />}
                        color="bg-rose-500"
                        subtext={stats.total_due > 0 ? "Outstanding Balance" : "All clear"}
                    />
                    <StatCard
                        title="Total Bills"
                        value={stats.count}
                        icon={<Building2 size={20} className="text-white" />}
                        color="bg-slate-500"
                    />
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700 dark:text-slate-200">Recent Transactions</h2>
                            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">{processedPurchases.length} Records</span>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                                        <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedPurchases.length > 0 ? (
                                        processedPurchases.map((item) => {
                                            const paid = parseFloat(item.paid_amount || 0);
                                            const total = parseFloat(item.total_amount || 0);
                                            const isPaid = paid >= total;
                                            const isPartial = paid > 0 && paid < total;

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                                    <td className="p-3 text-sm text-slate-500 font-mono">
                                                        {formatDate(item.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 font-mono group-hover:text-indigo-500">
                                                        {item.invoice_number}
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                        {item.party?.name || 'Unknown'}
                                                    </td>
                                                    <td className="p-3 text-sm font-bold text-slate-800 dark:text-white text-right">
                                                        {formatCurrency(total)}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {isPaid ? (
                                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Paid</span>
                                                        ) : isPartial ? (
                                                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Partial</span>
                                                        ) : (
                                                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Unpaid</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                    <Search size={48} className="mb-2 stroke-1" />
                                                    <p>No transactions found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: CHARTS & AI (1 Col) */}
                    <div className="h-full flex flex-col gap-4 overflow-hidden min-h-0">

                        {/* GROWTH ENGINE CARD */}
                        {aiInsights && aiInsights.length > 0 && (
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center gap-2 mb-3">
                                    <BrainCircuit className="text-indigo-200" size={20} />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-100">Growth Engine AI</h3>
                                </div>
                                <div className="space-y-3">
                                    {aiInsights.map((insight, idx) => (
                                        <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-xs border border-white/10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className={insight.type === 'warning' || insight.type === 'critical' ? 'text-rose-300' : 'text-emerald-300'} />
                                                <span className="font-bold">{insight.title}</span>
                                            </div>
                                            <p className="opacity-90 leading-relaxed">{insight.message}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chart: Top Suppliers (Flex to fill remaining space) */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Top Spending (Suppliers)</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={chartData.suppliers} layout="vertical" margin={{ left: 0, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}

// --- Helper Component ---
function StatCard({ title, value, icon, color, isCurrency = false, subtext }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {isCurrency ? formatCurrency(value || 0) : (value || 0)}
                </h3>
                {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
    );
}
