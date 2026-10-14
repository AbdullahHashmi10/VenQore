import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Hourglass, Package, DollarSign, Archive, RefreshCw, BarChart3, PieChart as PieIcon, Table2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const statusOf = (days) => {
    if (days > 180) return { label: 'Dead Stock', cls: 'bg-rose-50 text-rose-600' };
    if (days > 90) return { label: 'Slow Moving', cls: 'bg-amber-50 text-amber-600' };
    if (days > 30) return { label: 'Stable', cls: 'bg-blue-50 text-blue-600' };
    return { label: 'Fresh', cls: 'bg-emerald-50 text-emerald-600' };
};

export default function StockAging({ batches = [], filters = {} }) {
    const { store } = usePage().props;

    const apply = (key, value) => {
        const next = { ...filters, [key]: value };
        Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
        router.get(route('store.reports.stock-aging', { store_slug: store.slug }), next, { preserveState: true, replace: true });
    };

    const s = useMemo(() => {
        let total = 0, dead = 0, slow = 0, fresh = 0;
        batches.forEach((b) => {
            const v = parseFloat(b.cost_value) || 0; const d = parseInt(b.days) || 0;
            total += v;
            if (d > 180) dead += v; else if (d > 90) slow += v; else fresh += v;
        });
        return { total, dead, slow, fresh, deadPct: total > 0 ? (dead / total) * 100 : 0 };
    }, [batches]);

    const groups = [{ name: 'Fresh (0-90 days)', value: s.fresh }, { name: 'Slow (90-180 days)', value: s.slow }, { name: 'Dead (180+ days)', value: s.dead }];

    const columns = [
        { key: 'product', label: 'Inventory Item', sortable: true, get: (r) => r.product,
          render: (r) => (
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-line bg-app"><Package size={16} className="text-ink-muted" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{r.product}</span><span className="block truncate font-mono text-xs text-ink-muted">Batch: {r.batch || 'N/A'}</span></span>
            </div>) },
        { key: 'days', label: 'Age', sortable: true, get: (r) => parseInt(r.days) || 0,
          render: (r) => {
              const d = parseInt(r.days) || 0; const pct = Math.min(100, (d / 365) * 100);
              const c = d > 180 ? 'bg-rose-500' : d > 90 ? 'bg-amber-500' : 'bg-emerald-500';
              return (<div className="w-full max-w-[140px]"><div className="mb-1 flex justify-between text-xs font-bold"><span className="text-ink-secondary">{d} days</span><span className="text-ink-muted">Target: 90</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"><div className={`h-full ${c}`} style={{ width: `${pct}%` }} /></div></div>);
          } },
        { key: 'category', label: 'Status', sortable: true, get: (r) => statusOf(parseInt(r.days) || 0).label,
          render: (r) => { const st = statusOf(parseInt(r.days) || 0); return <span className={`rounded-[12px] px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${st.cls}`}>{st.label}</span>; } },
        { key: 'quantity', label: 'Qty On Hand', align: 'right', sortable: true, get: (r) => Number(r.quantity) || 0, render: (r) => <span className="font-mono text-sm font-bold text-ink-secondary">{formatNumber(r.quantity)}</span> },
        { key: 'cost_value', label: 'Asset Value (FIFO)', align: 'right', sortable: true, get: (r) => parseFloat(r.cost_value) || 0, render: (r) => <span className="font-mono text-sm font-bold text-ink">{formatCurrency(parseFloat(r.cost_value) || 0)}</span> },
    ];

    return (
        <ReportShell
            title="Stock Aging"
            subtitle="Identify liquidity risks and dead stock capital"
            activeKey="stock-aging"
            exportConfig={{ filename: 'stock_aging', rows: batches, columns: [
                { label: 'Product', get: (r) => r.product }, { label: 'Batch', get: (r) => r.batch || '' }, { label: 'Age (days)', get: (r) => parseInt(r.days) || 0 },
                { label: 'Status', get: (r) => statusOf(parseInt(r.days) || 0).label }, { label: 'Quantity', get: (r) => r.quantity }, { label: 'Asset Value (FIFO)', get: (r) => parseFloat(r.cost_value) || 0 },
            ] }}
            filters={(
                <FilterSelect label="Age group" value={filters.category} onChange={(v) => apply('category', v)}
                    options={[{ value: '', label: 'All' }, { value: '0-30', label: '0-30 Days (Fresh)' }, { value: '30-90', label: '30-90 Days (Stable)' }, { value: '90-180', label: '90-180 Days (Slow)' }, { value: '180+', label: '180+ Days (Dead)' }]} />
            )}
        >
            <ReportKpis items={[
                { label: 'Total Inventory Value', value: formatCurrency(s.total), sub: 'Across all batches', icon: DollarSign, tone: 'slate' },
                { label: 'Capital in Dead Stock', value: formatCurrency(s.dead), sub: '180+ days old', icon: Archive, tone: 'rose', valueTone: 'rose' },
                { label: 'Slow Moving Capital', value: formatCurrency(s.slow), sub: '90-180 days old', icon: Hourglass, tone: 'amber' },
                { label: 'Inventory Health', value: `${(100 - s.deadPct).toFixed(1)}%`, sub: 'Fresh stock ratio', icon: RefreshCw, tone: 'emerald' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Value by age" subtitle="Stock value in each age bucket" icon={BarChart3}>
                        <TrendChart type="bar" unit="currency" label="Stock value" points={groups.map((g) => ({ x: g.name, y: g.value }))} height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Age mix" subtitle="Share of value" icon={PieIcon} tone="amber">
                        <DonutChart slices={groups.filter((g) => g.value > 0)} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Batches" subtitle={`${batches.length} batches`} icon={Table2} flush>
                <ReportTable columns={columns} rows={batches} rowKey={(r) => r.id ?? `${r.product}-${r.batch}`} totals={{ product: 'Total', cost_value: formatCurrency(s.total) }} />
            </ReportSection>
        </ReportShell>
    );
}
