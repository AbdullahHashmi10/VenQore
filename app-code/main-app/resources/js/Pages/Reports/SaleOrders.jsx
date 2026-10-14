import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Search, Package, Clock, CheckCircle, XCircle, DollarSign, Receipt, TrendingUp, PieChart as PieIcon, Users, BarChart3,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Dates the current server range covers, so the date filter can show what is active. */
function rangeDates(filters) {
    const now = new Date();
    const range = filters.range || 'this_month';
    if (range === 'today') return [ymd(now), ymd(now)];
    if (range === 'this_month') return [ymd(new Date(now.getFullYear(), now.getMonth(), 1)), ymd(now)];
    if (range === 'this_year') return [ymd(new Date(now.getFullYear(), 0, 1)), ymd(now)];
    return [filters.start_date || '', filters.end_date || ''];
}

const STATUSES = ['all', 'pending', 'completed', 'cancelled'];

export default function SaleOrders({ orders = [], filters = {} }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, pending, completed, cancelled
    const [[from, to], setDates] = useState(() => rangeDates(filters));

    // --- Derived Data ---
    const processedOrders = useMemo(() => {
        let data = [...orders];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter(order =>
                order.order_number.toString().toLowerCase().includes(lowerQ) ||
                (order.party?.name || '').toLowerCase().includes(lowerQ)
            );
        }
        if (statusFilter !== 'all') {
            data = data.filter(order => order.status === statusFilter);
        }
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return data;
    }, [orders, searchQuery, statusFilter]);

    // --- Stats ---
    const stats = useMemo(() => {
        const total = processedOrders.length;
        const totalValue = processedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

        let pending = 0, completed = 0, cancelled = 0;
        processedOrders.forEach(o => {
            if (o.status === 'pending') pending++;
            else if (o.status === 'completed') completed++;
            else cancelled++;
        });

        return { total, totalValue, pending, completed, cancelled };
    }, [processedOrders]);

    const statusSlices = [
        { name: 'Completed', value: stats.completed },
        { name: 'Pending', value: stats.pending },
        { name: 'Cancelled', value: stats.cancelled },
    ].filter(d => d.value > 0);

    // Daily value + volume
    const daily = useMemo(() => {
        const map = {};
        processedOrders.forEach(o => {
            const k = ymd(new Date(o.created_at));
            map[k] = map[k] || { value: 0, count: 0 };
            map[k].value += Number(o.total_amount) || 0;
            map[k].count += 1;
        });
        return Object.keys(map).sort().map(k => ({ x: k, value: map[k].value, count: map[k].count }));
    }, [processedOrders]);

    const topCustomers = useMemo(() => {
        const map = {};
        processedOrders.forEach(o => {
            const name = o.party?.name || tt('Walk-in Customer');
            map[name] = map[name] || { value: 0, n: 0 };
            map[name].value += Number(o.total_amount) || 0;
            map[name].n += 1;
        });
        return Object.entries(map).map(([label, v]) => ({ label, value: v.value, sub: `${v.n} orders` })).sort((a, b) => b.value - a.value);
    }, [processedOrders]);

    const applyRange = ({ from: f, to: t }) => {
        setDates([f || '', t || '']);
        if (f && t) {
            router.get(route("store.reports.sale-orders", {
                store_slug: store.slug
            }), { range: 'custom', start_date: f, end_date: t }, { preserveState: true, preserveScroll: true });
        }
    };

    const statusBadge = (status) => {
        const cls = status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
            : 'bg-sunken text-ink-secondary';
        return <span className={`rounded-[12px] px-2 py-1 text-2xs font-bold capitalize ${cls}`}>{status}</span>;
    };

    const columns = [
        { key: 'order_number', label: tt('Order #'), sortable: true, get: (o) => `#${o.order_number}`, render: (o) => <span className="font-mono font-bold text-sky-600 dark:text-sky-400">#{o.order_number}</span> },
        { key: 'date', label: 'Date', sortable: true, get: (o) => ymd(new Date(o.created_at)), render: (o) => new Date(o.created_at).toLocaleDateString() },
        { key: 'customer', label: tt('Customer'), sortable: true, get: (o) => o.party?.name || tt('Walk-in Customer') },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, get: (o) => Number(o.total_amount) || 0, render: (o) => <span className="font-bold tabular-nums text-ink">{formatCurrency(o.total_amount, store)}</span> },
        { key: 'status', label: 'Status', align: 'center', sortable: true, get: (o) => o.status, render: (o) => statusBadge(o.status) },
    ];

    const kpis = [
        { label: tt('Total Orders'), value: formatNumber(stats.total), icon: Package, tone: 'sky' },
        { label: 'Order Value', value: formatCurrency(stats.totalValue, store), icon: DollarSign, tone: 'brand' },
        { label: 'Avg Order', value: formatCurrency(stats.total > 0 ? stats.totalValue / stats.total : 0, store), icon: Receipt, tone: 'blue' },
        { label: 'Pending Processing', value: formatNumber(stats.pending), icon: Clock, tone: 'amber', sub: 'Needs action' },
        { label: 'Completed', value: formatNumber(stats.completed), icon: CheckCircle, tone: 'emerald', sub: `${stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : 0}% completion` },
        { label: 'Cancelled', value: formatNumber(stats.cancelled), icon: XCircle, tone: 'rose' },
    ];

    const filterNode = (
        <>
            <DateRangeFilter from={from} to={to} onChange={applyRange} />
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={14} />
                <input type="text" placeholder={tt('Search Orders...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${filterInputCls} w-56 pl-9`} />
            </div>
            <div className="flex flex-wrap items-center gap-1">
                {STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => setStatusFilter(s)}
                        className={`h-10 rounded-[12px] px-3 text-sm font-semibold capitalize transition-colors ${statusFilter === s ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
                        {s}
                    </button>
                ))}
            </div>
        </>
    );

    return (
        <ReportShell
            title="Sales Orders Report"
            subtitle={tt('Tracking order pipeline & status')}
            filters={filterNode}
            exportConfig={{ filename: 'sales-orders', columns: columns.map((c) => ({ label: c.label, get: c.get })), rows: processedOrders }}
        >
            <ReportKpis items={kpis} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Order Value Trend" subtitle="Value of orders placed per day" icon={TrendingUp} tone="sky">
                        <TrendChart points={daily.map(d => ({ x: d.x, y: d.value }))} label="Order value" type="area" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title={tt('Order Status')} icon={PieIcon} tone="amber">
                        <DonutChart slices={statusSlices} unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <ReportSection title="Daily Volume" subtitle="Orders per day" icon={BarChart3} tone="blue">
                        <TrendChart points={daily.map(d => ({ x: d.x, y: d.count }))} label="Orders" type="bar" unit="integer" height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={6}>
                    <ReportSection title={tt('Top Customers')} subtitle="By order value" icon={Users} tone="violet">
                        <RankBars items={topCustomers} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title={tt('Order List')} subtitle={`${processedOrders.length} orders`} icon={Receipt} flush>
                <ReportTable columns={columns} rows={processedOrders} rowKey={(o, i) => o.id ?? i} pageSize={25} empty={tt('No orders found')} />
            </ReportSection>
        </ReportShell>
    );
}
