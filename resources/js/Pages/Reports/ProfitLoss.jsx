import React, { useState, useMemo, useEffect } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    TrendingUp, TrendingDown, DollarSign, ArrowLeft, Filter,
    Info, HelpCircle, AlertCircle, PieChart as PieIcon, Activity,
    Zap, Target, Lightbulb, ArrowUpRight, ShieldCheck, X, Check, Loader2
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

export default function ProfitLoss({ stats = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    const { props } = usePage();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [range, setRange] = useState(filters.range || 'this_month');

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    // --- Derived Metrics ---
    const revenue = parseFloat(stats.revenue || 0);
    const cogs = parseFloat(stats.cogs || 0);
    const expenses = parseFloat(stats.expenses || 0);
    const grossProfit = parseFloat(stats.gross_profit || 0);
    const netProfit = parseFloat(stats.net_profit || 0);

    const grossMargin = revenue ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
    const netMargin = revenue ? ((netProfit / revenue) * 100).toFixed(1) : 0;
    const cogsRatio = revenue ? ((cogs / revenue) * 100).toFixed(1) : 0;
    const expenseRatio = revenue ? ((expenses / revenue) * 100).toFixed(1) : 0;

    // --- Chart Data ---
    const breakdownData = [
        { name: 'COGS', value: cogs, color: '#f59e0b' },     // Amber
        { name: 'Expenses', value: expenses, color: '#ef4444' }, // Red
        { name: 'Net Profit', value: Math.max(0, netProfit), color: '#10b981' } // Emerald
    ].filter(d => d.value > 0);

    // --- formatters ---
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    // --- Handlers ---
    const handleRangeChange = (r) => {
        setRange(r);
        if (r !== 'custom') {
            router.get(route("store.reports.profit-loss", {
                store_slug: store.slug
            }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        router.get(route("store.reports.profit-loss", {
            store_slug: store.slug
        }), {
            range: 'custom',
            start_date: startDate,
            end_date: endDate
        }, { preserveState: true, preserveScroll: true });
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        // Simulate complex calculation delay
        setTimeout(() => {
            const insights = [];

            // Logic derived from actual stats
            if (grossMargin < 20) {
                insights.push({ type: 'danger', title: 'Low Gross Margin', text: 'Your production costs (COGS) are eating most of your revenue. Negotiate better rates with suppliers.' });
            } else {
                insights.push({ type: 'success', title: 'Healthy Gross Margin', text: 'Your core product pricing is solid. You have good room for overheads.' });
            }

            if (expenseRatio > 40) {
                insights.push({ type: 'warning', title: 'High Overheads', text: `Your operating expenses are ${expenseRatio}% of revenue. This is higher than the recommended 30% benchmark.` });
            }

            if (revenue === 0) {
                insights.push({ type: 'neutral', title: 'No Data', text: 'Start making sales to unlock deeper insights.' });
            } else if (netProfit > 0) {
                insights.push({ type: 'opportunity', title: 'Growth Opportunity', text: 'You are profitable! Consider reinvesting 20% of net profit into marketing to accelerate growth.' });
            }

            setAnalysisResult({
                score: Math.max(0, Math.min(100, (parseFloat(netMargin) + 50))), // Rough score algo
                insights
            });
            setIsAnalyzing(false);
        }, 2000);
    };

    return (
        <ReportsLayout title="Profit & Loss Statement">
            <Head title="Profit & Loss" />
            <div className="flex flex-col h-full gap-4 w-full relative">

                {/* 1. Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route("store.reports.index", {
                            store_slug: store.slug
                        })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                Profit & Loss <span className="text-slate-400 font-medium text-sm">Statement</span>
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Financial performance for the selected period</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {[
                                { id: 'this_month', label: 'This Month' },
                                { id: 'last_month', label: 'Last Month' },
                                { id: 'this_year', label: 'This Year' },
                                { id: 'custom', label: 'Custom' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleRangeChange(opt.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id
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
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                                />
                                <span className="text-slate-400 text-xs font-bold">TO</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                                />
                                <button
                                    onClick={applyCustomRange}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Top Level KPI Cards (Key Ratios) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                    <RatioCard
                        title="Net Profit"
                        value={formatCurrency(netProfit)}
                        subtitle={`${netMargin}% of Revenue`}
                        color={netProfit >= 0 ? "emerald" : "rose"}
                        icon={<DollarSign />}
                    />
                    <RatioCard
                        title="Gross Profit"
                        value={formatCurrency(grossProfit)}
                        subtitle={`${grossMargin}% Margin`}
                        color="blue"
                        icon={<TrendingUp />}
                    />
                    <RatioCard
                        title="Total Expenses"
                        value={formatCurrency(expenses)}
                        subtitle={`${expenseRatio}% of Revenue`}
                        color="rose"
                        icon={<TrendingDown />}
                    />
                    <RatioCard
                        title="Revenue Efficiency"
                        value={`${(100 - expenseRatio - cogsRatio).toFixed(1)}%`}
                        subtitle="Retained from Sales"
                        color="indigo"
                        icon={<Activity />}
                    />
                </div>

                {/* 3. Main Content: 3-COLUMN LAYOUT */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">

                    {/* LEFT COL: Detailed P&L Statement (Spans 2 cols) */}
                    <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Income Statement</h2>
                            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                Download PDF
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="px-6 py-3 rounded-l-lg">Description</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3 text-right rounded-r-lg">% Sales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <StatementRow
                                        label="Sales Revenue"
                                        amount={revenue}
                                        percent={100}
                                        info="Total income from goods sold before any deductions."
                                        isHeader
                                    />
                                    <StatementRow
                                        label="Cost of Goods Sold (COGS)"
                                        amount={-cogs}
                                        percent={cogsRatio}
                                        info="Direct costs attributable to the production of the goods sold (e.g., material cost)."
                                        isNegative
                                        action={() => props.meta?.cogs_account_id && router.visit(route("store.reports.account-ledger", {
                                            store_slug: store.slug,
                                            account_id: props.meta.cogs_account_id,
                                            start_date: filters.start_date,
                                            end_date: filters.end_date
                                        }))}
                                    />
                                    <SummaryRow
                                        label="Gross Profit"
                                        amount={grossProfit}
                                        type="subtotal"
                                        info="Revenue minus COGS. Indicates how efficiently you produce goods."
                                    />
                                    <StatementRow
                                        label="Operating Expenses"
                                        amount={-expenses}
                                        percent={expenseRatio}
                                        info="Expenses incurred in normal business operations (Rent, Utilities, Salaries)."
                                        isNegative
                                    />
                                    <SummaryRow
                                        label="Net Profit / (Loss)"
                                        amount={netProfit}
                                        type="total"
                                        info="The 'Bottom Line'. Total earnings after subtracting all expenses and costs."
                                    />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MIDDLE COL: Visuals (1 col) */}
                    <div className="xl:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-h-[300px] flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                                <PieIcon size={14} /> Revenue Distribution
                            </h3>
                            <div className="flex-1 relative">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie
                                            data={breakdownData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {breakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            formatter={(val) => formatCurrency(val)}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Net Margin</p>
                                        <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {netMargin}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" />

                            <div className="relative z-10">
                                <h3 className="text-xs font-bold opacity-90 mb-2 flex items-center gap-2">
                                    <HelpCircle size={14} /> Health Check
                                </h3>
                                <div className="text-xs opacity-80 leading-relaxed space-y-2">
                                    <p>Your <strong className="text-white">OpEx Ratio</strong> is {expenseRatio}%. {expenseRatio > 40 ? 'Consider reducing overheads.' : 'This is healthy.'}</p>
                                    <div className="mt-2 pt-2 border-t border-white/10">
                                        {netMargin > 20 ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                                                <ShieldCheck size={14} /> Excellent Health
                                            </span>
                                        ) : netMargin > 5 ? (
                                            <span className="inline-flex items-center gap-1 text-blue-300 font-bold">
                                                <Activity size={14} /> Stable
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-rose-300 font-bold">
                                                <AlertCircle size={14} /> Needs Attention
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Growth Engine (New Section using Side Space) */}
                    <div className="xl:col-span-1 flex flex-col gap-4 h-full">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <h3 className="text-base font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400">
                                <Zap size={18} fill="currentColor" /> Growth Engine
                            </h3>

                            <div className="space-y-4">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2">
                                        <Target size={12} /> Profit Optimization
                                    </h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        {netMargin < 10
                                            ? "Your margin is tight. Focus on high-margin items and reduce 'Loss Leaders' this week."
                                            : "Strong margins! Reinvest surplus into marketing best-sellers to scale volume."}
                                    </p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <h4 className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-2">
                                        <Lightbulb size={12} /> Smart Insight
                                    </h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        Increasing your average ticket size by just <strong>10%</strong> would add
                                        <strong className="text-white ml-1">{formatCurrency(revenue * 0.1)}</strong> to your revenue without new customers.
                                    </p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors">
                                    <h4 className="text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2">
                                        <ArrowUpRight size={12} /> Action Plan
                                    </h4>
                                    <ul className="text-[10px] text-slate-300 space-y-1.5 mt-2">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            Review Supplier Costs
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            Audit Utility Expenses
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            Push Upsells at Checkout
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={runAnalysis}
                                disabled={isAnalyzing}
                                className="w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                {isAnalyzing ? 'Scanning Data...' : 'Run Full Analysis'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Analysis Report Modal (Overlay) */}
                {analysisResult && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                            <Activity size={24} />
                                        </div>
                                        <button onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight">Analysis Report</h2>
                                    <p className="text-indigo-200 text-sm font-medium">Business Health Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {analysisResult.insights.map((insight, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border-l-4 ${insight.type === 'danger' ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10' :
                                            insight.type === 'warning' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/10' :
                                                insight.type === 'success' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10' :
                                                    'bg-slate-50 border-indigo-500 dark:bg-slate-800'
                                        }`}>
                                        <h4 className={`text-sm font-bold mb-1 ${insight.type === 'danger' ? 'text-rose-700 dark:text-rose-400' :
                                                insight.type === 'warning' ? 'text-amber-700 dark:text-amber-400' :
                                                    insight.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' :
                                                        'text-slate-800 dark:text-white'
                                            }`}>
                                            {insight.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {insight.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                                <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                                >
                                    Dismiss Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ReportsLayout>
    );
}

// ... Sub-components remain unchanged ...
function RatioCard({ title, value, subtitle, color, icon }) {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${colors[color]} shrink-0`}>
                    {React.cloneElement(icon, { size: 18 })}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight my-1">{value}</h3>
                <p className={`text-xs font-medium ${color === 'rose' ? 'text-rose-500' : 'text-slate-400'}`}>{subtitle}</p>
            </div>
        </div>
    );
}

function StatementRow({ label, amount, percent, info, isHeader, isNegative, action }) {
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);

    return (
        <tr className={`group transition-colors ${action ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer' : ''}`} onClick={action}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className={`font-medium ${isHeader ? 'text-slate-800 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                        {label}
                    </span>
                    <div className="group/tooltip relative">
                        <Info size={14} className="text-slate-300 hover:text-indigo-500 transition-colors cursor-help" />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                            {info}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                        </div>
                    </div>
                </div>
                {action && <p className="text-[10px] text-indigo-500 font-bold mt-0.5 ml-1">View Ledger &rarr;</p>}
            </td>
            <td className={`px-6 py-4 text-right font-bold ${isNegative ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {formatCurrency(amount)}
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className="text-xs text-slate-400 font-medium">{percent}%</span>
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 dark:bg-slate-600 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                    </div>
                </div>
            </td>
        </tr>
    );
}

function SummaryRow({ label, amount, type, info }) {
    const formatCurrency = (val) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(val);
    const isTotal = type === 'total';
    const isLoss = amount < 0;

    return (
        <tr className={`bg-slate-50/80 dark:bg-slate-800/30 ${isTotal ? 'border-t-2 border-slate-200 dark:border-slate-700' : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className={`uppercase tracking-wider ${isTotal ? 'text-base font-black text-slate-900 dark:text-white' : 'text-sm font-bold text-slate-700 dark:text-slate-200'}`}>
                        {label}
                    </span>
                    <div className="group/tooltip relative">
                        <Info size={14} className="text-slate-400 hover:text-indigo-500 transition-colors cursor-help" />
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl">
                            {info}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                        </div>
                    </div>
                </div>
            </td>
            <td className={`px-6 py-4 text-right ${isTotal ? 'text-xl font-black' : 'text-lg font-bold'} ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(amount)}
            </td>
            <td className="px-6 py-4 text-right"></td>
        </tr>
    );
}
