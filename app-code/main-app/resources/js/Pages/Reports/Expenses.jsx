import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Tag,
    PieChart as PieIcon,
    CreditCard,
    Sparkles,
    BrainCircuit,
    Receipt
} from 'lucide-react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { formatCurrency } from '@/Utils/format';
import { vq } from '@/theme/runtime';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export default function ExpenseReport({ expenses = [], stats = {}, filters = {}, categories = [] }) {
    const {
        store
    } = usePage().props;

    // --- State ---
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
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
    const processedExpenses = useMemo(() => {
        let data = [...expenses];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.description || '').toLowerCase().includes(lowerQ) ||
                (item.reference || '').toLowerCase().includes(lowerQ) ||
                (typeof item.category === 'string' ? item.category : item.category?.name || '').toLowerCase().includes(lowerQ)
            );
        }

        if (selectedCategory) {
            data = data.filter(item =>
                (item.category_id && String(item.category_id) === String(selectedCategory)) ||
                (item.category?.id && String(item.category.id) === String(selectedCategory))
            );
        }

        return data;
    }, [expenses, searchQuery, selectedCategory]);

    // --- Growth Engine Insights (AI Analysis) ---
    const aiInsights = useMemo(() => {
        if (expenses.length === 0) {
            return [{
                type: 'neutral',
                title: 'Data Required',
                message: 'Add expenses to unlock Growth Engine cost analysis.'
            }];
        }

        const insights = [];
        const totalExp = stats.total_expenses || 0;

        // 1. High Spend Alert (Top Category)
        if (stats.top_category && totalExp > 0) {
            const topCatShare = (stats.top_category.total / totalExp) * 100;
            if (topCatShare > 40) {
                insights.push({
                    type: 'warning',
                    title: 'Concentrated Spending',
                    message: `${stats.top_category.name} consumes ${topCatShare.toFixed(1)}% of your budget. Inspect this category for savings.`
                });
            } else {
                insights.push({
                    type: 'success',
                    title: 'Balanced Budget',
                    message: `Expense categories are well distributed. Top category is only ${topCatShare.toFixed(1)}%.`
                });
            }
        }

        // 2. Average Check
        if (stats.avg_daily > 10000) { // Threshold example
            insights.push({
                type: 'neutral',
                title: 'High Burn Rate',
                message: `Average daily expense is ${formatCurrency(stats.avg_daily)}. Ensure high revenue days match this outflow.`
            });
        }

        return insights;
    }, [expenses, stats]);


    // --- Chart Data (By Category) ---
    const chartData = useMemo(() => {
        const catMap = {};
        expenses.forEach(e => {
            const catName = typeof e.category === 'string' ? e.category : (e.category?.name || 'Uncategorized');
            catMap[catName] = (catMap[catName] || 0) + parseFloat(e.amount || 0);
        });

        return Object.keys(catMap).map(name => ({
            name,
            value: catMap[name]
        })).sort((a, b) => b.value - a.value).slice(0, 6);
    }, [expenses]);


    // --- Event Handlers ---
    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r === 'custom') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
            applyFilters(r, selectedCategory);
        }
    };

    const handleCategoryChange = (e) => {
        const cat = e.target.value;
        setSelectedCategory(cat);
        applyFilters(dateRange, cat);
    }

    const applyFilters = (range, cat) => {
        const params = { range };
        if (cat) params.category_id = cat;
        if (range === 'custom') {
            if (customStart) params.start_date = customStart;
            if (customEnd) params.end_date = customEnd;
        }

        router.get(route("store.reports.expenses", {
            store_slug: store.slug
        }), params, { preserveState: true, preserveScroll: true });
    };

    const applyCustomRange = () => {
        applyFilters('custom', selectedCategory);
    };

    return (
        <ReportsLayout title="Expense Report">
            <Head title="Expense Report" />
            <div className="space-y-6 max-w-[1600px] mx-auto min-h-0">

                {/* HEADERS & FILTERS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
                            <CreditCard className="text-rose-500" />
                            Expense Analytics
                        </h1>
                        <p className="text-sm text-ink-muted">Track company spending and overheads</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-brand-500 w-48"
                            />
                        </div>

                        {categories.length > 0 && (
                            <select
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                                className="py-2 pl-3 pr-8 text-sm border border-line rounded-lg bg-surface text-ink-secondary focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}

                        <div className="flex bg-sunken p-1 rounded-lg">
                            {['this_month', 'last_month', 'this_year', 'custom'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => handleRangeChange(r)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r
                                        ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm'
                                        : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'
                                        }`}
                                >
                                    {r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                        </div>

                        {showCustomDate && (
                            <div className="flex items-center gap-2 bg-sunken p-1 rounded-lg animate-in slide-in-from-right-5 fade-in duration-slow">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-xs border-none bg-transparent focus:ring-0 p-1 text-ink-secondary"
                                />
                                <span className="text-ink-muted">-</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-xs border-none bg-transparent focus:ring-0 p-1 text-ink-secondary"
                                />
                                <button
                                    onClick={applyCustomRange}
                                    className="bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded text-xs"
                                >
                                    Go
                                </button>
                            </div>
                        )}

                        <button className="p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg border border-line">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Expenses"
                        value={stats.total_expenses}
                        isCurrency
                        icon={<DollarSign size={20} className="text-white" />}
                        color="bg-rose-500"
                    />
                    <StatCard
                        title="Avg Daily Spend"
                        value={stats.avg_daily}
                        isCurrency
                        icon={<PieIcon size={20} className="text-white" />}
                        color="bg-brand-500"
                    />
                    <StatCard
                        title="Top Category"
                        value={stats.top_category?.name || 'N/A'}
                        subtext={stats.top_category ? formatCurrency(stats.top_category.total) : ''}
                        icon={<Tag size={20} className="text-white" />}
                        color="bg-violet-500"
                    />
                    <StatCard
                        title="Total Records"
                        value={stats.count}
                        icon={<Receipt size={20} className="text-white" />}
                        color="bg-neutral-500"
                    />
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">

                    {/* LEFT: TABLE (2 Cols) */}
                    <div className="lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
                        <div className="p-4 border-b border-line flex justify-between items-center">
                            <h2 className="font-bold text-ink-secondary dark:text-ink">Expense History</h2>
                            <span className="text-xs text-ink-muted bg-sunken px-2 py-1 rounded-full">{processedExpenses.length} Records</span>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-app sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Date</th>
                                        <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Reference</th>
                                        <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Category</th>
                                        <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Description</th>
                                        <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {processedExpenses.map((expense, idx) => (
                                        <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group">
                                            <td className="p-3 text-sm text-ink-muted font-mono">
                                                {formatDate(expense.date)}
                                            </td>
                                            <td className="p-3 text-sm font-bold text-ink-secondary font-mono group-hover:text-brand-500">
                                                {expense.reference}
                                            </td>
                                            <td className="p-3">
                                                <span className="px-2 py-1 rounded-full text-2xs font-bold uppercase bg-sunken text-ink-secondary">
                                                    {(typeof expense.category === 'string' ? expense.category : expense.category?.name) || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-ink-secondary">
                                                {expense.description}
                                            </td>
                                            <td className="p-3 text-sm font-bold text-rose-600 dark:text-rose-400 text-right">
                                                {formatCurrency(expense.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    {processedExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="h-64 text-center text-ink-muted">
                                                <div className="flex flex-col items-center justify-center opacity-60">
                                                    <CreditCard size={48} className="mb-2 stroke-1" />
                                                    <p>No expenses found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: CHART & AI (1 Col) */}
                    <div className="h-full flex flex-col gap-4 overflow-hidden min-h-0">

                        {/* GROWTH ENGINE CARD */}
                        <div className="bg-gradient-to-br from-brand-600 to-violet-600 rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-slower">
                            <div className="flex items-center gap-2 mb-3">
                                <BrainCircuit className="text-brand-200" size={20} />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-100">Growth Engine AI</h3>
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

                        {/* CHART */}
                        <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
                            <h3 className="text-xs font-bold text-ink-muted uppercase mb-2">Category Breakdown</h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: vq.slate[400] }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={[vq.rose[500], vq.pink[500], vq.fuchsia[500], vq.purple[500], vq.violet[500]][index % 5]} />
                                            ))}
                                        </Bar>
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

function StatCard({ title, value, icon, color, isCurrency = false, prefix = '', subtext }) {
    return (
        <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-ink">
                    {prefix}{isCurrency ? formatCurrency(value || 0) : (value || 0)}
                </h3>
                {subtext && <p className="text-2xs text-ink-muted mt-1">{subtext}</p>}
            </div>
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg  transition-transform`}>
                {icon}
            </div>
        </div>
    );
}
