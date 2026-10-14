import React, { useState, useMemo } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import {
 TrendingUp, DollarSign, Activity, Zap, X, Loader2, CreditCard, AlertCircle, FileText,
 Printer, Edit, MessageCircle, Receipt, PieChart as PieIcon, CalendarDays, Users, BarChart3
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import PrintService from '@/Utils/PrintService';
import {
 ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { useTermText } from '@/lib/terms';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The backend names each day "dd Mon"; turn that back into an ISO date, rolling the year forward when months wrap. */
function labelsToIso(rows, startDate) {
 let year = startDate ? Number(String(startDate).slice(0, 4)) : new Date().getFullYear();
 let prev = -1;
 return rows.map((r) => {
 const [dd, mon] = String(r.name || '').split(' ');
 const m = MONTHS.indexOf(mon);
 if (m < 0) return null;
 const stamp = m * 100 + Number(dd);
 if (prev >= 0 && stamp < prev) year += 1;
 prev = stamp;
 return { x: `${year}-${pad(m + 1)}-${pad(Number(dd))}`, y: Number(r.value) || 0 };
 }).filter(Boolean);
}

export default function SalesReport({ sales = [], stats = {}, chartData = [], filters = {} }) {
 const { store } = usePage().props;

 // Guard: Prevent rendering until store context is derived
 if (!store?.slug) return null;

 const tt = useTermText();
 const [startDate, setStartDate] = useState(filters.start_date || '');
 const [endDate, setEndDate] = useState(filters.end_date || '');

 // Analysis State
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [analysisResult, setAnalysisResult] = useState(null);

 // Quick View Modal State
 const [quickViewSale, setQuickViewSale] = useState(null);

 // --- Formatters ---
 const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

 // --- Handlers ---
 const applyRange = ({ from, to }) => {
 setStartDate(from || '');
 setEndDate(to || '');
 if (from && to) {
 router.get(route("store.reports.sales", {
 store_slug: store.slug
 }), { range: 'custom', start_date: from, end_date: to }, { preserveState: true, preserveScroll: true });
 }
 };

 const runAnalysis = () => {
 setIsAnalyzing(true);
 setTimeout(() => {
 const insights = [];

 // 1. Uncollected Revenue
 if (stats.total_due > (stats.total_sales * 0.2)) {
 insights.push({ type: 'danger', title: 'Cash Flow Risk', text: `You have ${formatCurrency(stats.total_due, store)} in unpaid invoices. Follow up with debtors immediately.` });
 }

 // 2. Trend Analysis
 if (chartData.length > 2) {
 const last = chartData[chartData.length - 1].value;
 const prev = chartData[chartData.length - 2].value;
 if (last > prev * 1.1) {
 insights.push({ type: 'success', title: 'Upward Trend', text: 'Sales are picking up! Ensure inventory levels can match this demand.' });
 } else if (last < prev * 0.8) {
 insights.push({ type: 'warning', title: 'Sales Dip', text: 'Recent sales have dropped. Consider running a weekend promotion.' });
 }
 }

 // 3. Ticket Size
 if (stats.avg_ticket < 1000) { // Arbitrary threshold, adjust as needed
 insights.push({ type: 'opportunity', title: 'Upsell Potential', text: `Avg ticket is ${formatCurrency(stats.avg_ticket, store)}. Bundling products could boost this by 15%.` });
 } else {
 insights.push({ type: 'success', title: 'Strong Basket Size', text: tt('Customers are buying multiple items. Maintain this momentum.') });
 }

 setAnalysisResult({
 score: Math.min(100, Math.max(0, 80 - (stats.total_due / stats.total_sales * 50) + (stats.count > 0 ? 10 : 0))),
 insights
 });
 setIsAnalyzing(false);
 }, 1500);
 };

 // --- Derived chart data (from the props the controller already sends) ---
 const trendPoints = useMemo(() => labelsToIso(chartData, startDate), [chartData, startDate]);

 const statusOf = (sale) => {
 const due = (Number(sale.total_amount) || 0) - (Number(sale.paid_amount) || 0);
 return due > 5 ? 'Unpaid' : 'Paid';
 };
 const dateOf = (sale) => sale.posted_at || sale.created_at;

 const topCustomers = useMemo(() => {
 const map = {};
 sales.forEach((s) => {
 const name = s.party?.name || tt('Walk-in Customer');
 map[name] = map[name] || { value: 0, n: 0 };
 map[name].value += Number(s.total_amount) || 0;
 map[name].n += 1;
 });
 return Object.entries(map).map(([label, v]) => ({ label, value: v.value, sub: `${v.n} invoices` })).sort((a, b) => b.value - a.value);
 }, [sales]);

 const byWeekday = useMemo(() => {
 const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
 const totals = names.map(() => 0);
 sales.forEach((s) => {
 const d = dateOf(s);
 if (!d) return;
 const dt = new Date(d);
 if (Number.isNaN(dt.getTime())) return;
 totals[dt.getDay()] += Number(s.total_amount) || 0;
 });
 return names.map((n, i) => ({ x: n, y: totals[i] }));
 }, [sales]);

 const paymentSlices = [
 { name: 'Collected', value: Number(stats.total_paid) || 0 },
 { name: 'Outstanding', value: Number(stats.total_due) || 0 },
 ].filter((s) => s.value > 0);

 const columns = [
 { key: 'ref', label: 'Ref #', sortable: true, get: (s) => `#${s.invoice_number || s.reference_number}`, render: (s) => <span className="font-mono font-bold text-brand-600 dark:text-brand-400">#{s.invoice_number || s.reference_number}</span> },
 { key: 'date', label: 'Date', sortable: true, get: (s) => (dateOf(s) ? ymd(new Date(dateOf(s))) : ''), render: (s) => (dateOf(s) ? formatDate(dateOf(s)) : '') },
 { key: 'customer', label: tt('Customer'), sortable: true, get: (s) => s.party?.name || tt('Walk-in Customer') },
 { key: 'total', label: 'Total', align: 'right', sortable: true, get: (s) => Number(s.total_amount) || 0, render: (s) => <span className="font-bold tabular-nums text-ink">{formatCurrency(Number(s.total_amount) || 0, store)}</span> },
 { key: 'paid', label: 'Paid', align: 'right', sortable: true, get: (s) => Number(s.paid_amount) || 0, render: (s) => formatCurrency(Number(s.paid_amount) || 0, store) },
 { key: 'status', label: 'Status', align: 'center', get: statusOf, render: (s) => (statusOf(s) === 'Unpaid'
 ? <span className="rounded-[12px] bg-rose-100 px-2 py-1 text-2xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Unpaid</span>
 : <span className="rounded-[12px] bg-emerald-100 px-2 py-1 text-2xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Paid</span>) },
 ];

 const kpis = [
 { label: 'Total Sales', value: formatCurrency(stats.total_sales, store), icon: TrendingUp, tone: 'emerald' },
 { label: 'Cash Collected', value: formatCurrency(stats.total_paid, store), icon: CreditCard, tone: 'blue' },
 { label: 'Outstanding', value: formatCurrency(stats.total_due, store), icon: AlertCircle, tone: stats.total_due > 0 ? 'rose' : 'emerald', valueTone: stats.total_due > 0 ? 'rose' : undefined },
 { label: 'Avg Ticket', value: formatCurrency(stats.avg_ticket, store), icon: Activity, tone: 'brand' },
 { label: 'Total Discount', value: formatCurrency(stats.total_discount, store), icon: DollarSign, tone: 'amber' },
 { label: 'Highest Sale', value: formatCurrency(stats.max_sale, store), icon: TrendingUp, tone: 'emerald' },
 { label: 'Total Invoices', value: formatNumber(stats.count), icon: FileText, tone: 'blue' },
 { label: 'Unpaid Count', value: formatNumber(stats.unpaid_count), icon: AlertCircle, tone: stats.unpaid_count > 0 ? 'rose' : 'emerald' },
 ];

 return (
 <ReportShell
 title="Sales Report"
 subtitle="Revenue performance & trends"
 filters={<DateRangeFilter from={startDate} to={endDate} onChange={applyRange} />}
 actions={(
 <button type="button" onClick={runAnalysis} disabled={isAnalyzing}
 className="flex h-10 items-center gap-2 rounded-[12px] bg-brand-600 px-3 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-50">
 {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
 <span className="hidden sm:inline">{isAnalyzing ? 'Scanning Sales...' : 'Run Sales Diagnosis'}</span>
 </button>
 )}
 exportConfig={{
 filename: 'sales-report',
 columns: columns.map((c) => ({ label: c.label, get: c.get })),
 rows: sales,
 }}
 >
 <ReportKpis items={kpis} />

 <ReportGrid>
 <ReportCol span={8}>
 <ReportSection title="Revenue Trend" subtitle="Daily net sales" icon={TrendingUp} tone="emerald">
 <TrendChart points={trendPoints} label="Net sales" type="area" height={280} />
 </ReportSection>
 </ReportCol>
 <ReportCol span={4}>
 <ReportSection title="Collected vs Outstanding" icon={PieIcon} tone="blue">
 <DonutChart slices={paymentSlices} height={280} />
 </ReportSection>
 </ReportCol>
 </ReportGrid>

 <ReportGrid>
 <ReportCol span={6}>
 <ReportSection title={tt('Top Customers')} subtitle="By invoice total" icon={Users} tone="violet">
 <RankBars items={topCustomers} />
 </ReportSection>
 </ReportCol>
 <ReportCol span={6}>
 <ReportSection title="Sales by Day of Week" icon={CalendarDays} tone="amber">
 <TrendChart points={byWeekday} label="Sales" type="bar" height={280} />
 </ReportSection>
 </ReportCol>
 </ReportGrid>

 <ReportSection title="Recent Transactions" subtitle="Click a row for the invoice preview" icon={Receipt} flush>
 <ReportTable columns={columns} rows={sales} rowKey={(s, i) => s.id ?? i} onRowClick={setQuickViewSale} pageSize={25} empty="No sales found for this period." />
 </ReportSection>

 {/* Analysis Modal */}
 {analysisResult && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal">
 <div className="bg-surface w-full max-w-md rounded-[14px] shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal">
 <div className="bg-brand-600 p-6 text-white relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-2">
 <div className="bg-white/20 p-2 rounded-[12px] backdrop-blur-md"><Activity size={24} /></div>
 <button onClick={() => setAnalysisResult(null)} className="text-white/70 hover:text-white transition-colors"><X size={20} /></button>
 </div>
 <h2 className="text-2xl font-bold tracking-tight">Sales Intelligence</h2>
 <p className="text-brand-200 text-sm font-medium">Performance Score: <span className="text-white font-bold">{analysisResult.score.toFixed(0)}/100</span></p>
 </div>
 </div>
 <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
 {analysisResult.insights.map((insight, idx) => (
 <div key={idx} className={`p-4 rounded-[12px] border-l-4 ${insight.type === 'danger' ? 'bg-rose-50 border-rose-500 dark:bg-rose-900/10 text-rose-700' : insight.type === 'warning' ? 'bg-amber-50 border-amber-500 dark:bg-amber-900/10 text-amber-700' : insight.type === 'success' ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10 text-emerald-700' : 'bg-sunken border-brand-500 dark:bg-surface text-ink-secondary'}`}>
 <h4 className="text-sm font-bold mb-1">{insight.title}</h4>
 <p className="text-xs opacity-80">{insight.text}</p>
 </div>
 ))}
 </div>
 <div className="p-4 border-t border-line bg-app flex justify-end">
 <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-white text-xs font-bold rounded-[12px] transition-colors">Dismiss</button>
 </div>
 </div>
 </div>
 )}

 {/* Quick View Modal - Centered Popup */}
 {quickViewSale && (
 <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal" onClick={() => setQuickViewSale(null)}>
 <div
 className="quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-[14px] shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0">
 <div className="flex flex-wrap items-center gap-3">
 <div>
 <p className="text-2xs sm:text-xs font-bold text-ink-muted uppercase tracking-wider">Invoice Preview</p>
 <h3 className="text-lg sm:text-xl font-bold text-brand-600 truncate">{quickViewSale.reference_number || quickViewSale.invoice_number}</h3>
 </div>
 {quickViewSale.source === 'pos' && (
 <span className="text-2xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase shrink-0">POS</span>
 )}
 <span className={`px-2 py-1 rounded-full text-2xs font-bold uppercase ${quickViewSale.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
 quickViewSale.payment_status === 'partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
 }`}>
 {quickViewSale.payment_status || (quickViewSale.total_amount - quickViewSale.paid_amount > 0 ? 'Unpaid' : 'Paid')}
 </span>
 </div>
 <div className="flex items-center gap-2 justify-end">
 <button
 onClick={() => PrintService.quickPrint(quickViewSale)}
 className="px-3 py-1.5 bg-sunken text-ink-secondary text-xs font-bold rounded-[12px] hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-1"
 >
 <Printer size={14} /> Print
 </button>
 <Link
 href={route("store.sales.edit", [store.slug, quickViewSale.id])}
 className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-[12px] hover:bg-brand-700 transition-colors flex items-center gap-1"
 >
 <Edit size={14} /> Edit Invoice
 </Link>
 <button
 onClick={() => setQuickViewSale(null)}
 className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-[12px] text-ink-muted transition-colors"
 >
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-auto p-4">
 {/* Top Info Row */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
 <div className="bg-app p-3 rounded-[12px]">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">{tt('Customer')}</p>
 <p className="font-bold text-ink text-sm">{quickViewSale.party?.name || quickViewSale.customer?.name || 'Walk-in'}</p>
 {quickViewSale.party?.phone && (
 <p className="text-xs text-ink-muted">{quickViewSale.party.phone}</p>
 )}
 </div>
 <div className="bg-app p-3 rounded-[12px]">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Date & Time</p>
 <p className="font-bold text-ink text-sm">{formatDate(quickViewSale.created_at)}</p>
 <p className="text-xs text-ink-muted">{new Date(quickViewSale.created_at).toLocaleTimeString()}</p>
 </div>
 <div className="bg-app p-3 rounded-[12px]">
 <p className="text-2xs font-bold text-ink-muted uppercase mb-1">Payment</p>
 <p className="font-bold text-ink text-sm uppercase">{quickViewSale.payment_method || 'Cash'}</p>
 </div>
 <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-[12px] border border-brand-200 dark:border-brand-800">
 <p className="text-2xs font-bold text-brand-600 uppercase mb-1">Total</p>
 <p className="font-bold text-brand-600 text-lg">{formatCurrency(quickViewSale.total_amount || quickViewSale.total, store)}</p>
 </div>
 </div>

 {/* Items Table */}
 <div className="border border-line rounded-[12px] overflow-hidden">
 <div className="bg-app px-4 py-2 border-b border-line">
 <p className="text-xs font-bold text-ink-secondary uppercase">
 Items in this Invoice ({quickViewSale.sale_items?.length || quickViewSale.items?.length || 0})
 </p>
 </div>
 {/* Desktop Table View */}
 <div className="hidden sm:block max-h-[300px] overflow-auto">
 <table className="w-full text-sm">
 <thead className="sticky top-0 bg-surface border-b border-line">
 <tr>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">#</th>
 <th className="text-left p-3 text-2xs font-bold text-ink-muted uppercase">Item Name</th>
 <th className="text-center p-3 text-2xs font-bold text-ink-muted uppercase">Qty</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Rate</th>
 <th className="text-right p-3 text-2xs font-bold text-ink-muted uppercase">Total</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {(quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (
 (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => (
 <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover">
 <td className="p-3 text-ink-muted font-mono text-xs">{idx + 1}</td>
 <td className="p-3">
 <p className="font-semibold text-ink">{item.product?.name || item.name || 'Unknown Item'}</p>
 </td>
 <td className="p-3 text-center font-bold text-ink-secondary">{formatNumber(item.quantity)}</td>
 <td className="p-3 text-right text-ink-secondary">{formatCurrency(item.unit_price || item.price || 0, store)}</td>
 <td className="p-3 text-right font-bold text-ink">
 {formatCurrency(item.total_price || ((item.quantity) * (item.unit_price || item.price || 0)), store)}
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="p-6 text-center text-ink-muted">
 No items data available
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile Stacked List View */}
 <div className="block sm:hidden divide-y divide-line max-h-[300px] overflow-auto">
 {(quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (
 (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => (
 <div key={idx} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-2">
 <div className="flex items-start justify-between gap-2">
 <div className="flex gap-2 items-start">
 <span className="text-ink-muted font-mono text-xs">{idx + 1}.</span>
 <div>
 <p className="font-semibold text-ink text-xs">{item.product?.name || item.name || 'Unknown Item'}</p>
 </div>
 </div>
 <p className="text-xs font-bold text-ink shrink-0">
 {formatCurrency(item.total_price || ((item.quantity) * (item.unit_price || item.price || 0)), store)}
 </p>
 </div>
 <div className="grid grid-cols-2 gap-2 text-2xs bg-surface/50 dark:bg-app p-2 rounded-[12px] border border-line">
 <div>
 <span className="text-ink-muted block uppercase">Qty</span>
 <span className="font-bold text-ink-secondary">{formatNumber(item.quantity)}</span>
 </div>
 <div>
 <span className="text-ink-muted block uppercase">Rate</span>
 <span className="font-semibold text-ink-secondary">{formatCurrency(item.unit_price || item.price || 0, store)}</span>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="p-6 text-center text-ink-muted text-xs">
 No items data available
 </div>
 )}
 </div>
 </div>

 {/* Payment Info */}
 <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center p-3 bg-app rounded-[12px]">
 <div className="flex gap-3 justify-between w-full sm:w-auto">
 <div>
 <p className="text-2xs text-ink-muted uppercase">Paid Amount</p>
 <p className="font-bold text-emerald-600">{formatCurrency(Number(quickViewSale.paid_amount) || 0, store)}</p>
 </div>
 {(() => {
 const paid = Number(quickViewSale.paid_amount) || 0;
 const total = Number(quickViewSale.total_amount || quickViewSale.total) || 0;
 const balance = total - paid;
 if (balance > 1) {
 return (
 <div>
 <p className="text-2xs text-ink-muted uppercase">Balance Due</p>
 <p className="font-bold text-red-600">{formatCurrency(balance, store)}</p>
 </div>
 );
 }
 return null;
 })()}
 </div>
 <div className="flex gap-2 w-full sm:w-auto justify-end">
 <button className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-[12px] hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1">
 <MessageCircle size={14} /> Share
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 </ReportShell>
 );
}
