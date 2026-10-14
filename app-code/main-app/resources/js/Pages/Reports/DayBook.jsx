import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, Wallet, TrendingUp, TrendingDown, Sparkles, BrainCircuit, ArrowRightLeft, Hash } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const RANGES = ['today', 'yesterday', 'this_week', 'custom'];
const rangeLabel = (r) => (r === 'today' ? 'Today' : r.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));

export default function DayBook({ transactions = [], stats = {}, filters = {}, date }) {
    const { store } = usePage().props;

    const [dateRange, setDateRange] = useState(filters.range || 'today');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomDate, setShowCustomDate] = useState(filters.range === 'custom');
    const [customStart, setCustomStart] = useState(filters.start_date || '');
    const [customEnd, setCustomEnd] = useState(filters.end_date || '');

    const processedTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter((item) =>
            (item.ref || '').toLowerCase().includes(q) ||
            (item.desc || '').toLowerCase().includes(q) ||
            (item.type || '').toLowerCase().includes(q));
    }, [transactions, searchQuery]);

    // Growth Engine insights
    const aiInsights = useMemo(() => {
        if (transactions.length === 0) {
            return [{ type: 'neutral', title: 'Data Required', message: 'Growth Engine needs transaction data to analyze your daily cash flow.' }];
        }
        const totalIn = stats.total_in || 0;
        const totalOut = stats.total_out || 0;
        const netCash = totalIn - totalOut;
        const ratio = totalOut > 0 ? totalIn / totalOut : totalIn > 0 ? 100 : 0;
        const insights = [];
        if (netCash > 0) {
            insights.push({ type: 'success', title: 'Positive Cash Flow', message: `You are generating surplus cash (+${formatCurrency(netCash, store)}). Good day for reserves.` });
        } else if (netCash < 0) {
            insights.push({ type: 'warning', title: 'Cash Burn Alert', message: `Outflow exceeds inflow by ${formatCurrency(Math.abs(netCash), store)}. Monitor expenses closely.` });
        }
        if (transactions.length > 50) {
            insights.push({ type: 'neutral', title: 'High Activity', message: `High transaction volume (${transactions.length}) detected today. Ensure staffing is adequate.` });
        }
        if (ratio > 1.5) {
            insights.push({ type: 'success', title: 'High Efficiency', message: 'Inflow is more than 1.5x of outflow. Strong operational efficiency.' });
        }
        return insights;
    }, [transactions, stats]);

    // Charts: by type (donut) and in/out by type (bar)
    const typeMap = {};
    transactions.forEach((t) => {
        const type = t.type || 'Other';
        typeMap[type] = typeMap[type] || { in: 0, out: 0 };
        typeMap[type][t.flow === 'in' ? 'in' : 'out'] += parseFloat(t.amount || 0);
    });
    const typeNames = Object.keys(typeMap);
    const flowSeries = [
        { name: 'In', points: typeNames.map((n) => ({ x: n, y: typeMap[n].in })) },
        { name: 'Out', points: typeNames.map((n) => ({ x: n, y: typeMap[n].out })) },
    ];
    const slices = typeNames.map((n) => ({ name: n, value: typeMap[n].in + typeMap[n].out })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);

    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r === 'custom') {
            setShowCustomDate(true);
        } else {
            setShowCustomDate(false);
            router.get(route('store.reports.day-book', { store_slug: store.slug }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };

    const applyCustomRange = () => {
        if (customStart && customEnd) {
            router.get(route('store.reports.day-book', { store_slug: store.slug }), {
                range: 'custom', start_date: customStart, end_date: customEnd,
            }, { preserveState: true, preserveScroll: true });
        }
    };

    const columns = [
        { key: 'type', label: 'Type', sortable: true, render: (item) => (
            <span className={`rounded-full px-2 py-1 text-2xs font-bold uppercase ${item.flow === 'in'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>{item.type}</span>
        ) },
        { key: 'ref', label: 'Reference', render: (item) => <span className="font-mono text-sm text-ink-secondary">{item.ref || '-'}</span> },
        { key: 'desc', label: 'Description', render: (item) => <span className="font-medium text-ink-secondary">{item.desc}</span> },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (item) => (
            <span className={`font-bold tabular-nums ${item.flow === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.flow === 'in' ? '+' : '-'} {formatCurrency(item.amount, store)}
            </span>
        ) },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${filterInputCls} w-64 pl-9`}
                />
            </div>
            <RangePicker value={dateRange} onChange={handleRangeChange} options={RANGES.map((r) => ({ id: r, label: rangeLabel(r) }))} />
            {showCustomDate && (
                <div className="flex items-center gap-2">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={filterInputCls} aria-label="From date" />
                    <span className="text-sm text-ink-muted">to</span>
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={filterInputCls} aria-label="To date" />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700">Go</button>
                </div>
            )}
        </>
    );

    const net = stats.net_cash || 0;

    return (
        <ReportShell
            title="Day Book"
            subtitle="Daily cash flow, sales and expense tracking"
            activeKey="day-book"
            filters={filterNode}
            exportConfig={{
                filename: 'day-book',
                columns: [
                    { label: 'Type', get: (r) => r.type },
                    { label: 'Flow', get: (r) => r.flow },
                    { label: 'Reference', get: (r) => r.ref },
                    { label: 'Description', get: (r) => r.desc },
                    { label: 'Amount', get: (r) => r.amount },
                ],
                rows: processedTransactions,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Inflow', value: formatCurrency(stats.total_in || 0, store), icon: TrendingUp, tone: 'emerald', valueTone: 'emerald' },
                { label: 'Total Outflow', value: formatCurrency(stats.total_out || 0, store), icon: TrendingDown, tone: 'rose', valueTone: 'rose' },
                { label: 'Net Cash Flow', value: `${net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(net), store)}`, icon: Wallet, tone: net >= 0 ? 'brand' : 'amber', sub: net >= 0 ? 'Surplus' : 'Deficit', trend: net >= 0 ? 'up' : 'down' },
                { label: 'Entries', value: String(transactions.length), icon: Hash, tone: 'slate' },
            ]} />

            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Inflow vs outflow" subtitle="By transaction type">
                        <TrendChart series={flowSeries} type="bar" height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Transaction volume">
                        <DonutChart slices={slices} height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={3}>
                    <ReportSection title="Growth Engine" icon={BrainCircuit} tone="violet" bodyClassName="flex flex-col gap-2">
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} className="rounded-[12px] bg-app p-3 text-xs">
                                <div className="mb-1 flex items-center gap-2">
                                    <Sparkles size={12} className={insight.type === 'warning' || insight.type === 'critical' ? 'text-rose-500' : 'text-emerald-500'} />
                                    <span className="font-bold text-ink">{insight.title}</span>
                                </div>
                                <p className="leading-relaxed text-ink-secondary">{insight.message}</p>
                            </div>
                        ))}
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Transaction log" subtitle={`${processedTransactions.length} entries`} flush>
                <ReportTable columns={columns} rows={processedTransactions} rowKey={(r, i) => `${r.ref}-${i}`} emptyIcon={ArrowRightLeft} empty="No transactions found for this period" />
            </ReportSection>
        </ReportShell>
    );
}
