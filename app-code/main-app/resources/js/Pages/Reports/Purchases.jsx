import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, CreditCard, AlertCircle, Wallet, Building2, Sparkles, BrainCircuit, TrendingUp, Users, PieChart } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import {
    ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    try { return new Date(dateString).toLocaleDateString('en-GB', options); } catch (e) { return dateString; }
};

const badge = {
    Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Unpaid: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const statusOf = (p) => {
    const paid = parseFloat(p.paid_amount || 0);
    const total = parseFloat(p.total_amount || 0);
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Unpaid';
};

export default function PurchasesReport({ purchases = [], stats = {}, filters = {}, suppliers = [] }) {
    const tt = useTermText();
    const { store } = usePage().props;

    const [searchQuery, setSearchQuery] = useState('');
    const [customStart, setCustomStart] = useState(filters.start_date || '');
    const [customEnd, setCustomEnd] = useState(filters.end_date || '');

    const applyRange = ({ from, to }) => {
        setCustomStart(from || '');
        setCustomEnd(to || '');
        if (from && to) {
            router.get(route('store.reports.purchases', { store_slug: store.slug }), {
                range: 'custom', start_date: from, end_date: to,
            }, { preserveState: true, preserveScroll: true });
        }
    };

    const processedPurchases = useMemo(() => {
        if (!searchQuery) return purchases;
        const q = searchQuery.toLowerCase();
        return purchases.filter((item) =>
            (item.invoice_number || '').toLowerCase().includes(q) ||
            (item.party?.name || '').toLowerCase().includes(q));
    }, [purchases, searchQuery]);

    const insights = useMemo(() => {
        if (purchases.length === 0) {
            return [{ type: 'neutral', title: 'Waiting for Data', message: 'Insights appear once purchases are recorded in this period.' }];
        }
        const totalValue = purchases.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
        const spend = {};
        purchases.forEach((p) => { const n = p.party?.name || 'Unknown'; spend[n] = (spend[n] || 0) + parseFloat(p.total_amount || 0); });
        const top = Object.entries(spend).sort(([, a], [, b]) => b - a)[0];
        const share = totalValue > 0 ? (top[1] / totalValue) * 100 : 0;
        const unpaid = purchases.filter((p) => statusOf(p) !== 'Paid').length;
        const unpaidRatio = (unpaid / purchases.length) * 100;
        const out = [];
        if (share > 40) out.push({ type: 'warning', title: 'High Supplier Dependency', message: `${top[0]} accounts for ${share.toFixed(1)}% of your total spending. Consider diversifying suppliers to reduce risk.` });
        else out.push({ type: 'success', title: 'Balanced Supplier Mix', message: `Your spending is well-distributed. Top supplier share is ${share.toFixed(1)}%.` });
        if (unpaidRatio > 50) out.push({ type: 'critical', title: 'Payment Backlog', message: `${unpaidRatio.toFixed(1)}% of bills are unpaid. Prioritize critical vendors to maintain credit lines.` });
        return out;
    }, [purchases]);

    const charts = useMemo(() => {
        const daily = {};
        const bySupplier = {};
        const byStatus = { Paid: 0, Partial: 0, Unpaid: 0 };
        purchases.forEach((p) => {
            const amt = parseFloat(p.total_amount || 0);
            const d = p.created_at ? p.created_at.split('T')[0] : '';
            if (d) daily[d] = (daily[d] || 0) + amt;
            const n = p.party?.name || 'Unknown';
            bySupplier[n] = (bySupplier[n] || 0) + amt;
            byStatus[statusOf(p)] += amt;
        });
        return {
            trend: Object.keys(daily).sort().map((x) => ({ x, y: daily[x] })),
            suppliers: Object.entries(bySupplier).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
            status: Object.entries(byStatus).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
        };
    }, [purchases]);

    const columns = [
        { key: 'date', label: 'Date', sortable: true, get: (r) => r.created_at || '', render: (r) => <span className="font-mono text-ink-muted">{formatDate(r.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</span> },
        { key: 'invoice', label: 'Invoice #', sortable: true, get: (r) => r.invoice_number || '', render: (r) => <span className="font-mono font-bold text-ink-secondary">{r.invoice_number}</span> },
        { key: 'supplier', label: tt('Supplier'), sortable: true, get: (r) => r.party?.name || 'Unknown' },
        { key: 'total', label: 'Total', align: 'right', sortable: true, get: (r) => parseFloat(r.total_amount || 0), render: (r) => <span className="font-bold text-ink">{formatCurrency(parseFloat(r.total_amount || 0))}</span> },
        { key: 'paid', label: 'Paid', align: 'right', sortable: true, get: (r) => parseFloat(r.paid_amount || 0), render: (r) => formatCurrency(parseFloat(r.paid_amount || 0)) },
        { key: 'status', label: 'Status', align: 'right', sortable: true, get: statusOf, render: (r) => { const s = statusOf(r); return <span className={`rounded-[12px] px-2 py-0.5 text-2xs font-bold uppercase ${badge[s]}`}>{s}</span>; } },
    ];

    const filterNode = (
        <>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                <input type="text" placeholder={tt('Search bills or suppliers...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${filterInputCls} w-64 pl-9`} />
            </div>
            <DateRangeFilter from={customStart} to={customEnd} onChange={applyRange} />
        </>
    );

    return (
        <ReportShell
            title="Purchases Report"
            subtitle={tt('Track spending, manage suppliers, and analyze costs')}
            filters={filterNode}
            exportConfig={{
                filename: 'purchases-report',
                columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })),
                rows: processedPurchases,
            }}
        >
            <ReportKpis items={[
                { label: 'Total Purchases', value: formatCurrency(stats.total_purchases || 0), icon: Wallet, tone: 'brand' },
                { label: 'Amount Paid', value: formatCurrency(stats.total_paid || 0), icon: CreditCard, tone: 'emerald' },
                { label: 'Payable Due', value: formatCurrency(stats.total_due || 0), icon: AlertCircle, tone: 'rose', valueTone: stats.total_due > 0 ? 'rose' : undefined, sub: stats.total_due > 0 ? 'Outstanding balance' : 'All clear' },
                { label: 'Total Bills', value: stats.count || 0, icon: Building2, tone: 'slate' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Spend trend" subtitle="Purchases per day" icon={TrendingUp}>
                        <TrendChart series={[{ name: 'Purchases', points: charts.trend }]} type="area" unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Payment status" subtitle="Bill value by status" icon={PieChart} tone="amber">
                        <DonutChart slices={charts.status} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title={tt('Top spending (Suppliers)')} icon={Users} tone="violet">
                        <RankBars items={charts.suppliers} unit="currency" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Insights" icon={BrainCircuit} tone="sky">
                        <div className="flex flex-col gap-2">
                            {insights.map((insight, idx) => (
                                <div key={idx} className="rounded-[12px] border border-line bg-app p-3 text-xs">
                                    <div className="mb-1 flex items-center gap-2">
                                        <Sparkles size={12} className={insight.type === 'warning' || insight.type === 'critical' ? 'text-rose-500' : 'text-emerald-500'} />
                                        <span className="font-bold text-ink">{insight.title}</span>
                                    </div>
                                    <p className="leading-relaxed text-ink-secondary">{insight.message}</p>
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Recent transactions" subtitle={`${processedPurchases.length} records`} flush>
                <ReportTable columns={columns} rows={processedPurchases} rowKey={(r) => r.id} empty="No transactions found" />
            </ReportSection>
        </ReportShell>
    );
}
