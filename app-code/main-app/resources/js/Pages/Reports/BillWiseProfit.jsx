import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, TrendingUp, DollarSign, Percent, FileText, PieChart as PieIcon, Trophy, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import {
    RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const RANGES = [
    { id: 'today', label: 'Today' }, { id: 'this_month', label: 'This Month' }, { id: 'this_year', label: 'This Year' }, { id: 'custom', label: 'Custom' },
];

export default function BillWiseProfit({ invoices = [], filters = {} }) {
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState(filters.range || 'this_month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const normalizedInvoices = useMemo(() => invoices.map((inv) => ({
        ...inv,
        invoice_number: inv.reference_number || inv.id || '',
        revenue: Number(inv.net_revenue || 0),
        cost: Number(inv.cogs || 0),
        profit: Number(inv.gross_profit || 0),
        margin: Number(inv.margin_pct || 0),
    })), [invoices]);

    const processedInvoices = useMemo(() => {
        let data = [...normalizedInvoices];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter((inv) => inv.invoice_number.toString().toLowerCase().includes(q));
        }
        data.sort((a, b) => b.profit - a.profit);
        return data;
    }, [normalizedInvoices, searchQuery]);

    const marginOf = (inv) => (inv.revenue > 0 ? (inv.profit / inv.revenue) * 100 : 0);

    const stats = useMemo(() => {
        const revenue = processedInvoices.reduce((a, c) => a + c.revenue, 0);
        const profit = processedInvoices.reduce((a, c) => a + c.profit, 0);
        return { revenue, profit, count: processedInvoices.length, margin: revenue > 0 ? (profit / revenue) * 100 : 0 };
    }, [processedInvoices]);

    const marginDistribution = useMemo(() => {
        let high = 0, medium = 0, low = 0, loss = 0;
        processedInvoices.forEach((inv) => {
            const m = marginOf(inv);
            if (m < 0) loss++; else if (m < 10) low++; else if (m < 25) medium++; else high++;
        });
        return [
            { name: 'High Margin (>25%)', value: high },
            { name: 'Healthy (10-25%)', value: medium },
            { name: 'Low Margin (<10%)', value: low },
            { name: 'Loss Making', value: loss },
        ].filter((d) => d.value > 0);
    }, [processedInvoices]);

    const topBills = processedInvoices.slice(0, 8).map((inv) => ({ label: '#' + inv.invoice_number, value: inv.profit, sub: `${marginOf(inv).toFixed(1)}%` }));
    const worstBills = [...processedInvoices].reverse().slice(0, 8).map((inv) => ({ label: '#' + inv.invoice_number, value: inv.profit, sub: `${marginOf(inv).toFixed(1)}%` }));
    const lossCount = processedInvoices.filter((i) => i.profit < 0).length;

    const handleRangeChange = (r) => {
        setDateRange(r);
        if (r !== 'custom') {
            router.get(route('store.reports.bill-wise-profit', { store_slug: store.slug }), { range: r }, { preserveState: true, preserveScroll: true });
        }
    };
    const applyCustomRange = () => {
        router.get(route('store.reports.bill-wise-profit', { store_slug: store.slug }), { range: 'custom', start_date: customStart, end_date: customEnd }, { preserveState: true, preserveScroll: true });
    };

    const columns = [
        { key: 'invoice_number', label: 'Invoice #', sortable: true, get: (r) => String(r.invoice_number), render: (r) => <span className="font-mono font-bold text-ink"><span className="mr-1 text-ink-muted">#</span>{r.invoice_number}</span> },
        { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (r) => formatCurrency(r.revenue, store) },
        { key: 'cost', label: 'Cost (COGS)', align: 'right', sortable: true, render: (r) => <span className="text-ink-muted">{formatCurrency(r.cost, store)}</span> },
        { key: 'profit', label: 'Profit', align: 'right', sortable: true, render: (r) => <span className={`font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(r.profit, store)}</span> },
        { key: 'margin', label: 'Margin', align: 'right', sortable: true, get: (r) => Number(marginOf(r).toFixed(1)), render: (r) => { const m = marginOf(r); return <span className={`font-bold ${m < 0 ? 'text-rose-600' : m < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{m.toFixed(1)}%</span>; } },
    ];

    const filtersNode = (
        <>
            <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" placeholder="Search invoice #..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${filterInputCls} w-56 pl-8`} />
            </label>
            <RangePicker value={dateRange} onChange={handleRangeChange} options={RANGES} />
            {dateRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeFilter presets={false} from={customStart} to={customEnd} onChange={({ from, to }) => { setCustomStart(from); setCustomEnd(to); }} />
                    <button type="button" onClick={applyCustomRange} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700">Apply</button>
                </div>
            )}
        </>
    );

    return (
        <ReportShell
            title="Profit by Bill" subtitle="Profitability analysis per invoice" activeKey="bill-wise-profit"
            filters={filtersNode}
            exportConfig={{
                filename: 'bill-wise-profit',
                columns: [
                    { label: 'Invoice #', get: (r) => r.invoice_number }, { label: 'Revenue', get: (r) => r.revenue },
                    { label: 'Cost', get: (r) => r.cost }, { label: 'Profit', get: (r) => r.profit },
                    { label: 'Margin %', get: (r) => marginOf(r).toFixed(1) },
                ],
                rows: processedInvoices,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Revenue', value: formatCurrency(stats.revenue, store), icon: DollarSign, tone: 'blue' },
                { label: 'Total Profit', value: formatCurrency(stats.profit, store), icon: TrendingUp, tone: stats.profit >= 0 ? 'emerald' : 'rose', valueTone: stats.profit >= 0 ? 'emerald' : 'rose' },
                { label: 'Avg Margin', value: `${stats.margin.toFixed(1)}%`, icon: Percent, tone: 'violet' },
                { label: 'Invoices', value: stats.count, icon: FileText, tone: 'brand' },
                { label: 'Loss-making Bills', value: lossCount, icon: TrendingDown, tone: 'rose', valueTone: lossCount ? 'rose' : undefined },
            ]} />

            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Margin distribution" subtitle="Invoices by margin band" icon={PieIcon} tone="amber">
                        <DonutChart slices={marginDistribution} unit="integer" height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Most profitable bills" subtitle="Top 8 by profit" icon={Trophy} tone="emerald">
                        <RankBars items={topBills} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Least profitable bills" subtitle="Bottom 8 by profit" icon={TrendingDown} tone="rose">
                        <RankBars items={worstBills} colorIndex={3} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Invoices" subtitle={`${processedInvoices.length} invoices`} icon={FileText} tone="sky" flush>
                <ReportTable columns={columns} rows={processedInvoices} rowKey={(r, i) => `${r.invoice_number}-${i}`} empty="No invoices found" />
            </ReportSection>
        </ReportShell>
    );
}
