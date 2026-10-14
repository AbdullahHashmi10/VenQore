import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    TrendingUp, TrendingDown, DollarSign, CreditCard, ShoppingCart, CheckCircle, AlertCircle, Receipt,
    PieChart as PieIcon, CalendarDays, BarChart3, Trophy, Percent, Clock,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import {
    RangePicker, ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, FilterSelect,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RANGES = [
    { id: 'today', label: 'Today' },
    { id: '7_days', label: '7 Days' },
    { id: '30_days', label: '30 Days' },
    { id: 'year', label: 'Year' },
    { id: 'custom', label: 'Custom' },
];

/** Backend labels: 'dd Mon' (daily), 'Mon' (monthly), 'hh AM' (hourly). Rebuild ISO dates so the chart gets a real time axis. */
function toIsoPoints(rows, mode, startYear) {
    if (mode === 'hour') return null;
    if (mode === 'month') {
        const y = new Date().getFullYear();
        return rows.map((r) => ({ r, m: MONTHS.indexOf(r.name) })).filter((o) => o.m >= 0).map((o) => ({ ...o.r, iso: `${y}-${pad(o.m + 1)}-01` }));
    }
    let year = startYear;
    let prev = -1;
    const out = [];
    rows.forEach((r) => {
        const [dd, mon] = String(r.name || '').split(' ');
        const m = MONTHS.indexOf(mon);
        if (m < 0) return;
        const stamp = m * 100 + Number(dd);
        if (prev >= 0 && stamp < prev) year += 1;
        prev = stamp;
        out.push({ ...r, iso: `${year}-${pad(m + 1)}-${pad(Number(dd))}` });
    });
    return out;
}

export default function GraphAnalytics({ trendData = [], paymentStatus = [], stats = {}, filters = {}, module = 'sales' }) {
    const { store } = usePage().props;

    const [range, setRange] = useState(filters?.range || '30_days');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');

    const modules = [
        { value: 'sales', label: 'Sales Analytics' },
        { value: 'purchases', label: 'Purchases Analytics' },
        { value: 'expenses', label: 'Expenses Analytics' },
    ];
    const currentModule = modules.find((m) => m.value === module) || modules[0];
    const title = currentModule.label;

    const handleModuleChange = (moduleId) => {
        router.get(route("store.reports.analytics", {
            store_slug: store.slug
        }), { module: moduleId }, { preserveState: false });
    };

    // Sync state with filters from server (e.g. on reload or back button)
    React.useEffect(() => {
        setRange(filters?.range || '30_days');
        setStartDate(filters?.start_date || '');
        setEndDate(filters?.end_date || '');
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

    const mode = (filters?.range || range) === 'today' ? 'hour' : (filters?.range || range) === 'year' ? 'month' : 'day';

    const dated = useMemo(() => {
        const back = (filters?.range || range) === '7_days' ? 6 : 29;
        const d = new Date(); d.setDate(d.getDate() - back);
        const startYear = filters?.start_date ? Number(String(filters.start_date).slice(0, 4)) : d.getFullYear();
        return toIsoPoints(trendData, mode, startYear);
    }, [trendData, mode, filters]);

    const salesPoints = mode === 'hour'
        ? trendData.map((r) => ({ x: r.name, y: Number(r.sales) || 0 }))
        : (dated || []).map((r) => ({ x: r.iso, y: Number(r.sales) || 0 }));
    const countPoints = mode === 'hour'
        ? trendData.map((r) => ({ x: r.name, y: Number(r.count) || 0 }))
        : (dated || []).map((r) => ({ x: r.iso, y: Number(r.count) || 0 }));

    const byWeekday = useMemo(() => {
        if (mode !== 'day' || !dated) return [];
        const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const totals = names.map(() => 0);
        dated.forEach((r) => { totals[new Date(`${r.iso}T00:00:00`).getDay()] += Number(r.sales) || 0; });
        return names.map((n, i) => ({ x: n, y: totals[i] }));
    }, [dated, mode]);

    const bestPeriods = useMemo(() => [...trendData]
        .filter((r) => Number(r.sales) > 0)
        .sort((a, b) => b.sales - a.sales)
        .map((r) => ({ label: r.name, value: Number(r.sales) || 0, sub: `${r.count || 0} sales` })), [trendData]);

    const best = bestPeriods[0];
    const paidValue = Number(paymentStatus?.[0]?.value) || 0;
    const recovery = (stats?.total_revenue > 0 && paidValue) ? Math.round((paidValue / stats.total_revenue) * 100) : 0;
    const slices = (paymentStatus || []).map((p) => ({ name: p.name, value: Number(p.value) || 0 })).filter((p) => p.value > 0);

    const periodLabel = mode === 'hour' ? 'Hour' : mode === 'month' ? 'Month' : 'Day';
    const columns = [
        { key: 'period', label: periodLabel, get: (r) => r.name },
        { key: 'sales', label: 'Revenue', align: 'right', sortable: true, get: (r) => Number(r.sales) || 0, render: (r) => <span className="font-bold tabular-nums text-ink">{formatCurrency(Number(r.sales) || 0, store)}</span> },
        { key: 'count', label: 'Transactions', align: 'right', sortable: true, get: (r) => Number(r.count) || 0 },
        { key: 'avg', label: 'Avg Ticket', align: 'right', sortable: true, get: (r) => (Number(r.count) > 0 ? Number(r.sales) / Number(r.count) : 0), render: (r) => formatCurrency(Number(r.count) > 0 ? Number(r.sales) / Number(r.count) : 0, store) },
    ];

    const kpis = [
        { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue || 0, store), icon: DollarSign, tone: 'brand' },
        { label: 'Transactions', value: formatNumber(stats?.total_transactions || 0), icon: CreditCard, tone: 'blue' },
        { label: 'Avg Ticket Size', value: formatCurrency(stats?.avg_ticket || 0, store), icon: TrendingUp, tone: 'emerald' },
        { label: 'Highest Sale', value: formatCurrency(stats?.max_sale || 0, store), icon: CalendarDays, tone: 'amber' },
        { label: 'Growth', value: `${Math.abs(insights.growth)}%`, icon: insights.trend === 'down' ? TrendingDown : TrendingUp, tone: insights.trend === 'down' ? 'rose' : 'emerald', trend: insights.trend === 'up' ? 'up' : insights.trend === 'down' ? 'down' : 'flat', sub: 'Second half vs first half' },
        { label: `Best ${periodLabel}`, value: best ? best.label : '-', icon: Trophy, tone: 'violet', sub: best ? formatCurrency(best.value, store) : undefined },
        { label: 'Collected', value: formatCurrency(paymentStatus?.[0]?.value || 0, store), icon: CheckCircle, tone: 'emerald' },
        { label: 'Unpaid', value: formatCurrency(paymentStatus?.[1]?.value || 0, store), icon: AlertCircle, tone: 'rose', valueTone: (paymentStatus?.[1]?.value || 0) > 0 ? 'rose' : undefined },
        { label: 'Recovery', value: `${recovery}%`, icon: Percent, tone: 'sky' },
    ];

    const filterNode = (
        <>
            <FilterSelect value={module} onChange={handleModuleChange} options={modules} />
            <RangePicker value={range} onChange={handleRangeChange} options={RANGES} />
            {range === 'custom' && (
                <>
                    <DateRangeFilter from={startDate} to={endDate} presets={false} onChange={({ from, to }) => { setStartDate(from || ''); setEndDate(to || ''); }} />
                    <button type="button" onClick={applyCustomRange}
                        className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700">Apply</button>
                </>
            )}
        </>
    );

    return (
        <ReportShell
            title={title}
            subtitle="Trends, collections and best periods"
            filters={filterNode}
            exportConfig={{ filename: 'sales-analytics', columns: columns.map((c) => ({ label: c.label, get: c.get })), rows: trendData }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Revenue Trend" subtitle={mode === 'hour' ? 'Revenue by hour' : mode === 'month' ? 'Revenue by month' : 'Revenue by day'} icon={TrendingUp} tone="brand"
                        right={insights.trend !== 'neutral' ? (
                            <span className={`inline-flex h-8 items-center gap-1 rounded-[12px] px-2 text-xs font-bold ${insights.trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'}`}>
                                {insights.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(insights.growth)}%
                            </span>
                        ) : null}>
                        <TrendChart points={salesPoints} label="Revenue" type={mode === 'hour' ? 'bar' : 'area'} height={280} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Payment Recovery" subtitle={`${recovery}% collected`} icon={PieIcon} tone="emerald">
                        <DonutChart slices={slices} height={280} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <ReportSection title="Transactions" subtitle={`Sales count per ${periodLabel.toLowerCase()}`} icon={ShoppingCart} tone="blue">
                        <TrendChart points={countPoints} label="Transactions" type="bar" unit="integer" height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={6}>
                    {byWeekday.length > 0 ? (
                        <ReportSection title="Revenue by Day of Week" icon={CalendarDays} tone="amber">
                            <TrendChart points={byWeekday} label="Revenue" type="bar" height={240} />
                        </ReportSection>
                    ) : (
                        <ReportSection title={`Best ${periodLabel}s`} subtitle="Ranked by revenue" icon={Trophy} tone="violet">
                            <RankBars items={bestPeriods} />
                        </ReportSection>
                    )}
                </ReportCol>
            </ReportGrid>

            {byWeekday.length > 0 && (
                <ReportSection title={`Best ${periodLabel}s`} subtitle="Ranked by revenue" icon={Trophy} tone="violet">
                    <RankBars items={bestPeriods} />
                </ReportSection>
            )}

            <ReportSection title="Period Breakdown" subtitle={`Revenue and transactions per ${periodLabel.toLowerCase()}`} icon={Receipt} flush>
                <ReportTable columns={columns} rows={trendData} rowKey={(r, i) => `${r.name}-${i}`} pageSize={31} empty="No data for this period" />
            </ReportSection>
        </ReportShell>
    );
}
