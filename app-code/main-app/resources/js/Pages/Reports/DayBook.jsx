import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
 Search,
 Download,
 ArrowUpRight,
 ArrowDownRight,
 Wallet,
 TrendingUp,
 TrendingDown,
 Building2,
 Sparkles,
 BrainCircuit,
 ArrowRightLeft
} from 'lucide-react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { formatCurrency } from '@/Utils/format';
import { series, vq } from '@/theme/runtime';
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

export default function DayBook({ transactions = [], stats = {}, filters = {}, date }) {
 const {
 store
 } = usePage().props;

 // --- State ---
 const [dateRange, setDateRange] = useState(filters.range || 'today'); // Default to today for Day Book
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
 const processedTransactions = useMemo(() => {
 let data = [...transactions];

 if (searchQuery) {
 const lowerQ = searchQuery.toLowerCase();
 data = data.filter(item =>
 (item.ref || '').toLowerCase().includes(lowerQ) ||
 (item.desc || '').toLowerCase().includes(lowerQ) ||
 (item.type || '').toLowerCase().includes(lowerQ)
 );
 }

 return data;
 }, [transactions, searchQuery]);

 // --- Growth Engine Insights (AI Analysis) ---
 const aiInsights = useMemo(() => {
 if (transactions.length === 0) {
 return [{
 type: 'neutral',
 title: 'Data Required',
 message: 'Growth Engine needs transaction data to analyze your daily cash flow.'
 }];
 }

 const totalIn = stats.total_in || 0;
 const totalOut = stats.total_out || 0;
 const netCash = totalIn - totalOut;
 const ratio = totalOut > 0 ? totalIn / totalOut : totalIn > 0 ? 100 : 0;

 const insights = [];

 // 1. Net Flow Health
 if (netCash > 0) {
 insights.push({
 type: 'success',
 title: 'Positive Cash Flow',
 message: `You are generating surplus cash (+${formatCurrency(netCash, store)}). Good day for reserves.`
 });
 } else if (netCash < 0) {
 insights.push({
 type: 'warning',
 title: 'Cash Burn Alert',
 message: `Outflow exceeds inflow by ${formatCurrency(Math.abs(netCash), store)}. Monitor expenses closely.`
 });
 }

 // 2. Transaction Volume
 if (transactions.length > 50) {
 insights.push({
 type: 'neutral',
 title: 'High Activity',
 message: `High transaction volume (${transactions.length}) detected today. Ensure staffing is adequate.`
 });
 }

 // 3. Efficiency
 if (ratio > 1.5) {
 insights.push({
 type: 'success',
 title: 'High Efficiency',
 message: 'Inflow is more than 1.5x of outflow. Strong operational efficiency.'
 });
 }

 return insights;
 }, [transactions, stats]);


 // --- Chart Data Preparation ---
 const chartData = useMemo(() => {
 // Group by Type (Sale, Purchase, Expense, etc)
 const typeMap = {};
 transactions.forEach(t => {
 const type = t.type || 'Other';
 if (!typeMap[type]) typeMap[type] = 0;
 typeMap[type] += parseFloat(t.amount || 0);
 });

 return Object.keys(typeMap).map(type => ({
 name: type,
 value: typeMap[type]
 })).sort((a, b) => b.value - a.value);
 }, [transactions]);


 // --- Event Handlers ---
 const handleRangeChange = (r) => {
 setDateRange(r);
 if (r === 'custom') {
 setShowCustomDate(true);
 } else {
 setShowCustomDate(false);
 router.get(route("store.reports.day-book", {
 store_slug: store.slug
 }), { range: r }, { preserveState: true, preserveScroll: true });
 }
 };

 const applyCustomRange = () => {
 if (customStart && customEnd) {
 router.get(route("store.reports.day-book", {
 store_slug: store.slug
 }), {
 range: 'custom',
 start_date: customStart,
 end_date: customEnd
 }, { preserveState: true, preserveScroll: true });
 }
 };

 return (
 <ReportsLayout title="Day Book Report">
 <Head title="Day Book" />
 <div className="space-y-6 max-w-[1600px] mx-auto min-h-0">

 {/* HEADERS & FILTERS */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
 <Building2 className="text-brand-500" />
 Day Book Analysis
 </h1>
 <p className="text-sm text-ink-muted">Daily cash flow, sales, and expense tracking</p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
 <input
 type="text"
 placeholder="Search transactions..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 pr-4 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-brand-500 w-64"
 />
 </div>

 <div className="flex bg-sunken p-1 rounded-lg">
 {['today', 'yesterday', 'this_week', 'custom'].map((r) => (
 <button
 key={r}
 onClick={() => handleRangeChange(r)}
 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r
 ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm'
 : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300'
 }`}
 >
 {r === 'today' ? 'Today' : r.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <StatCard
 title="Total Inflow"
 value={stats.total_in}
 isCurrency
 icon={<TrendingUp size={20} className="text-white" />}
 color="bg-emerald-500"
 store={store}
 />
 <StatCard
 title="Total Outflow"
 value={stats.total_out}
 isCurrency
 icon={<TrendingDown size={20} className="text-white" />}
 color="bg-rose-500"
 store={store}
 />
 <StatCard
 title="Net Cash Flow"
 value={Math.abs(stats.net_cash)}
 isCurrency
 prefix={stats.net_cash >= 0 ? '+' : '-'}
 icon={<Wallet size={20} className="text-white" />}
 color={stats.net_cash >= 0 ? "bg-brand-500" : "bg-amber-500"}
 store={store}
 subtext={stats.net_cash >= 0 ? "Surplus" : "Deficit"}
 />
 </div>

 {/* MAIN CONTENT GRID */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">

 {/* LEFT: TABLE (2 Cols) */}
 <div className="lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
 <div className="p-4 border-b border-line flex justify-between items-center">
 <h2 className="font-bold text-ink-secondary dark:text-ink">Transaction Log</h2>
 <span className="text-xs text-ink-muted bg-sunken px-2 py-1 rounded-full">{processedTransactions.length} Entries</span>
 </div>

 <div className="flex-1 overflow-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-app sticky top-0 z-10">
 <tr>
 <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Type</th>
 <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Reference</th>
 <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">Description</th>
 <th className="p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right">Amount</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {processedTransactions.map((item, idx) => (
 <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group">
 <td className="p-3">
 <span className={`text-2xs font-bold uppercase px-2 py-1 rounded-full ${item.flow === 'in'
 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
 : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
 }`}>
 {item.type}
 </span>
 </td>
 <td className="p-3 text-sm font-mono text-ink-secondary">
 {item.ref || '-'}
 </td>
 <td className="p-3 text-sm font-medium text-ink-secondary">
 {item.desc}
 </td>
 <td className={`p-3 text-sm font-bold text-right ${item.flow === 'in' ? 'text-emerald-600' : 'text-rose-600'
 }`}>
 {item.flow === 'in' ? '+' : '-'} {formatCurrency(item.amount, store)}
 </td>
 </tr>
 ))}
 {processedTransactions.length === 0 && (
 <tr>
 <td colSpan="4" className="h-64 text-center text-ink-muted">
 <div className="flex flex-col items-center justify-center opacity-60">
 <ArrowRightLeft size={48} className="mb-2 stroke-1" />
 <p>No transactions found for this period</p>
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
 <div className="bg-gradient-brand rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-slower">
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
 {aiInsights.length === 0 && (
 <div className="text-xs opacity-70 italic">Analyzing transactions...</div>
 )}
 </div>
 </div>

 {/* CHART */}
 <div className="bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col">
 <h3 className="text-xs font-bold text-ink-muted uppercase mb-2">Transaction Volume</h3>
 <div className="flex-1 w-full min-h-0">
 <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
 <BarChart data={chartData} margin={{ left: 0, right: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
 <XAxis dataKey="name" tick={{ fontSize: 10, fill: vq.slate[400] }} axisLine={false} tickLine={false} />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 cursor={{ fill: vq.slate[100], opacity: 0.4 }}
 formatter={(value) => formatCurrency(value, store)}
 />
 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
 {chartData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={series.light[index % 8]} />
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

function StatCard({ title, value, icon, color, isCurrency = false, prefix = '', subtext, store }) {
 return (
 <div className="bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
 <div>
 <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">{title}</p>
 <h3 className="text-2xl font-bold text-ink">
 {prefix}{isCurrency ? formatCurrency(value || 0, store) : (value || 0)}
 </h3>
 {subtext && <p className="text-2xs text-ink-muted mt-1">{subtext}</p>}
 </div>
 <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg transition-transform`}>
 {icon}
 </div>
 </div>
 );
}
