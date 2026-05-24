import React, { useState, useMemo } from 'react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Calendar, TrendingUp, TrendingDown, DollarSign,
    CreditCard, ArrowLeft, Filter, ShoppingCart, ChevronDown, CheckCircle, AlertCircle, Clock
} from 'lucide-react';

export default function GraphAnalytics({ trendData, paymentStatus, stats, filters, module = 'sales' }) {
    const {
        store
    } = usePage().props;

    const [range, setRange] = useState(filters.range || '30_days');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);

    const modules = [
        { id: 'sales', label: 'Sales', icon: TrendingUp, color: 'text-indigo-600' },
        { id: 'purchases', label: 'Purchases', icon: ShoppingCart, color: 'text-amber-600' },
        { id: 'expenses', label: 'Expenses', icon: CreditCard, color: 'text-rose-600' },
    ];

    const currentModule = modules.find(m => m.id === module) || modules[0];

    const handleModuleChange = (moduleId) => {
        router.get(route("store.reports.analytics", {
            store_slug: store.slug
        }), { module: moduleId }, { preserveState: false });
        setIsModuleMenuOpen(false);
    };

    // Sync state with filters from server (e.g. on reload or back button)
    React.useEffect(() => {
        setRange(filters.range || '30_days');
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
    }, [filters]);

    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.analytics", {
                store_slug: store.slug
            }), { module, range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.analytics", {
            store_slug: store.slug
        }), {
            module,
            range: 'custom',
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true, preserveScroll: true });
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    // Calculate Insights (Derived Data)
    const insights = useMemo(() => {
        if (!trendData || trendData.length < 2) return { growth: 0, trend: 'neutral' };
        const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2)).reduce((acc, curr) => acc + (curr.sales || 0), 0);
        const secondHalf = trendData.slice(Math.floor(trendData.length / 2)).reduce((acc, curr) => acc + (curr.sales || 0), 0);
        const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
        return {
            growth: growth.toFixed(1),
            trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'
        };
    }, [trendData]);

    return (
        <ReportsLayout title={`${currentModule.label} Analytics`}>
            <Head title={`${currentModule.label} Analytics`} />
            {/* Main Container */}
            <div className="flex flex-col h-full gap-2 overflow-hidden">

                {/* 1. Header & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route("store.reports.index", {
                            store_slug: store.slug
                        })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={16} />
                        </Link>
                        <div className="relative">
                            <button
                                onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <h1 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <currentModule.icon className={currentModule.color} size={18} /> {currentModule.label} Analytics
                                </h1>
                                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isModuleMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Module Dropdown */}
                            {isModuleMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {modules.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => handleModuleChange(m.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${module === m.id ? 'bg-slate-50 dark:bg-slate-700/50 font-bold' : ''}`}
                                        >
                                            <m.icon size={16} className={m.color} />
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[
                                { id: 'today', label: 'Today' },
                                { id: '7_days', label: '7 Days' },
                                { id: '30_days', label: '30 Days' },
                                { id: 'year', label: 'Year' },
                                { id: 'custom', label: 'Custom' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${range === opt.id
                                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {range === 'custom' && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                                />
                                <span className="text-slate-400 text-[10px] font-bold">TO</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                                />
                                <button
                                    onClick={applyCustomRange}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* 2. Key Metrics Cards (Compact) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0">
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(stats.total_revenue)}
                        icon={<DollarSign />}
                        color="indigo"
                    />
                    <StatCard
                        title="Transactions"
                        value={stats.total_transactions}
                        icon={<CreditCard />}
                        color="blue"
                    />
                    <StatCard
                        title="Avg Ticket Size"
                        value={formatCurrency(stats.avg_ticket)}
                        icon={<TrendingUp />}
                        color="emerald"
                    />
                    <StatCard
                        title="Highest Sale"
                        value={formatCurrency(stats.max_sale)}
                        icon={<Calendar />}
                        color="amber"
                    />
                </div>

                {/* 3. MAIN ANALYTICS SECTION - Balanced Split */}
                <div className="flex-1 min-h-0 flex flex-col gap-2">

                    {/* A. SALES TREND */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden flex-[1.2]">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">Sales Trend Analysis</h3>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${insights.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                                    insights.trend === 'down' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' :
                                        'bg-slate-50 text-slate-600 dark:bg-slate-800'
                                }`}>
                                {insights.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {Math.abs(insights.growth)}% Growth
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <AreaChart data={trendData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        dy={5}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        tickFormatter={(val) => `${val / 1000}k`}
                                    />
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#f8fafc' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                        activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* B. PAYMENT STATUS & RECOVERY - Adjusted Ratio & Internal Sizing */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight">Payment Recovery</h3>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-between min-h-0">
                            {/* Left: Chart - Bigger */}
                            <div className="relative h-full flex-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie
                                            data={paymentStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="65%"
                                            outerRadius="85%"
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={4}
                                        >
                                            {paymentStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val) => formatCurrency(val)}
                                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#f8fafc' }}
                                            itemStyle={{ color: '#f8fafc' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-2">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Recovery</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white">
                                            {stats.total_revenue > 0 ? Math.round((paymentStatus[0].value / stats.total_revenue) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Detailed Breakdown - More Spacing & Larger Text */}
                            <div className="flex flex-col justify-center gap-3 pr-6 flex-[1.2]">
                                {paymentStatus.map((status, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.fill }}></div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{status.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{formatCurrency(status.value)}</p>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-1 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-snug">
                                        <strong>Tip:</strong> Outstanding payments typically clear within 7 days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </ReportsLayout>
    );
}

function StatCard({ title, value, icon, color }) {
    const colors = {
        indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
        emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
        blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {/* Decorative Background */}
            <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-800/50 opacity-50 group-hover:w-24 transition-all duration-500" />

            {/* Left: Icon + Label */}
            <div className="flex items-center gap-3 relative z-10">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>
                    {React.cloneElement(icon, { size: 16 })}
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
            </div>

            {/* Right: Value */}
            <div className="relative z-10 text-right">
                <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
