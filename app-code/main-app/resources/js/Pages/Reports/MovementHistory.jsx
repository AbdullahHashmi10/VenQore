import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, ArrowDownLeft, FileText, Package, Activity, BarChart3, PieChart as PieIcon, Table2 } from 'lucide-react';
import { formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter, FilterSelect } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const IN_TYPES = ['purchase', 'received', 'return', 'adjustment_in', 'production', 'transfer_in', 'in'];
const isIn = (t) => IN_TYPES.includes(t);
const TYPE_STYLE = {
    sale: ['bg-brand-50 text-brand-700', 'Sale'], purchase: ['bg-emerald-50 text-emerald-600', 'Purchase'], return: ['bg-amber-50 text-amber-600', 'Return'],
    adjustment_in: ['bg-blue-50 text-blue-600', 'Adjustment (+)'], adjustment_out: ['bg-rose-50 text-rose-600', 'Adjustment (-)'], damage: ['bg-rose-50 text-rose-700', 'Damage'],
};
const typeStyle = (t) => TYPE_STYLE[t] || ['bg-sunken text-ink-secondary', (t || 'Unknown').replace('_', ' ')];
const dayOf = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function MovementHistory({ movements = [], filters = {}, products = [], warehouses = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const apply = (patch) => {
        const next = { ...filters, ...patch };
        Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
        router.get(route('store.reports.movement-history', { store_slug: store.slug }), next, { preserveState: true, replace: true });
    };

    const stats = useMemo(() => {
        let totalIn = 0, totalOut = 0; const freq = {};
        movements.forEach((m) => {
            const q = Math.abs(parseFloat(m.quantity) || 0);
            if (isIn(m.type)) totalIn += q; else totalOut += q;
            const id = m.product_id || m.product?.id; if (id) freq[id] = (freq[id] || 0) + 1;
        });
        const topId = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
        const top = products.find((p) => p.id == topId);
        return { totalIn, totalOut, net: totalIn - totalOut, mostActive: top ? top.name : 'N/A' };
    }, [movements, products]);

    const daily = useMemo(() => {
        const g = {};
        movements.forEach((m) => {
            const k = dayOf(m.created_at); if (!k) return;
            g[k] = g[k] || { in: 0, out: 0 };
            const q = Math.abs(parseFloat(m.quantity) || 0);
            if (isIn(m.type)) g[k].in += q; else g[k].out += q;
        });
        const keys = Object.keys(g).sort();
        return [
            { name: 'Inbound', points: keys.map((k) => ({ x: k, y: g[k].in })) },
            { name: 'Outbound', points: keys.map((k) => ({ x: k, y: g[k].out })) },
        ];
    }, [movements]);

    const byType = useMemo(() => {
        const m = {};
        movements.forEach((r) => { const n = typeStyle(r.type)[1]; m[n] = (m[n] || 0) + Math.abs(parseFloat(r.quantity) || 0); });
        return Object.entries(m).map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    }, [movements]);

    const columns = [
        { key: 'created_at', label: 'Timeline', sortable: true, get: (r) => new Date(r.created_at).getTime(),
          render: (r) => (<div className="leading-tight"><div className="text-sm font-semibold text-ink-secondary">{new Date(r.created_at).toLocaleDateString()}</div><div className="font-mono text-xs text-ink-muted">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>) },
        { key: 'product', label: tt('Product Info'), sortable: true, get: (r) => r.product?.name || '',
          render: (r) => (
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-line bg-app">
                    {r.product?.image ? <img src={`/storage/${r.product.image}`} className="h-full w-full object-cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} /> : <Package size={16} className="text-ink-muted" />}
                </span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink" title={r.product?.name}>{r.product?.name || 'Unknown Item'}</span><span className="block truncate font-mono text-xs text-ink-muted">{r.product?.sku || 'NO-SKU'}</span></span>
            </div>) },
        { key: 'type', label: 'Movement Type', sortable: true, get: (r) => typeStyle(r.type)[1],
          render: (r) => { const [cls, label] = typeStyle(r.type); return <span className={`inline-flex rounded-[12px] px-2.5 py-1 text-xs font-bold capitalize ${cls}`}>{label}</span>; } },
        { key: 'quantity', label: 'Volume', align: 'right', sortable: true, get: (r) => (isIn(r.type) ? 1 : -1) * Math.abs(parseFloat(r.quantity) || 0),
          render: (r) => (<span className={`font-mono text-sm font-bold ${isIn(r.type) ? 'text-emerald-600' : 'text-rose-600'}`}>{isIn(r.type) ? '+' : '-'}{formatNumber(Math.abs(parseFloat(r.quantity) || 0))}</span>) },
        { key: 'reference', label: 'Reference', get: (r) => `${r.reference_type ? r.reference_type.substring(0, 3).toUpperCase() : 'SYS'} #${r.reference_id ?? ''}`,
          render: (r) => (<span className="inline-flex items-center gap-2 text-ink-muted"><FileText size={14} /><span className="font-mono text-xs">{r.reference_type ? r.reference_type.substring(0, 3).toUpperCase() : 'SYS'} #{r.reference_id}</span></span>) },
        { key: 'warehouse', label: 'Location', get: (r) => r.warehouse?.name || 'Main', render: (r) => <span className="rounded-[12px] bg-sunken px-2 py-1 text-xs font-medium text-ink-secondary">{r.warehouse?.name || 'Main'}</span> },
        { key: 'user', label: 'Authorized By', align: 'right', get: (r) => r.user?.name || 'System', render: (r) => <span className="text-xs font-medium text-ink-secondary">{r.user?.name || 'System'}</span> },
    ];

    return (
        <ReportShell
            title="Stock Movement"
            subtitle="Audit trail of all inventory transactions"
            activeKey="movement-history"
            exportConfig={{ filename: 'stock_movement', rows: movements, columns: [
                { label: 'Date', get: (r) => r.created_at }, { label: 'Product', get: (r) => r.product?.name || '' }, { label: 'SKU', get: (r) => r.product?.sku || '' },
                { label: 'Type', get: (r) => typeStyle(r.type)[1] }, { label: 'Quantity', get: (r) => (isIn(r.type) ? '' : '-') + Math.abs(parseFloat(r.quantity) || 0) },
                { label: 'Reference', get: (r) => `${r.reference_type || 'SYS'} #${r.reference_id ?? ''}` }, { label: 'Location', get: (r) => r.warehouse?.name || 'Main' }, { label: 'User', get: (r) => r.user?.name || 'System' },
            ] }}
            filters={(
                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => apply({ start_date: from, end_date: to })} />
                    <FilterSelect label={tt('Product')} value={filters.product_id} onChange={(v) => apply({ product_id: v })} options={[{ value: '', label: 'All' }, ...products.map((p) => ({ value: p.id, label: p.name }))]} />
                    <FilterSelect label="Warehouse" value={filters.warehouse_id} onChange={(v) => apply({ warehouse_id: v })} options={[{ value: '', label: 'All' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} />
                    <FilterSelect label="Type" value={filters.type} onChange={(v) => apply({ type: v })}
                        options={[{ value: '', label: 'All' }, { value: 'sale', label: 'Sale' }, { value: 'purchase', label: 'Purchase' }, { value: 'return', label: 'Return' }, { value: 'adjustment_in', label: 'Adjustment (+)' }, { value: 'adjustment_out', label: 'Adjustment (-)' }]} />
                </div>
            )}
        >
            <ReportKpis items={[
                { label: 'Total Inbound', value: formatNumber(stats.totalIn), sub: 'Units received', icon: ArrowDownLeft, tone: 'emerald', valueTone: 'emerald' },
                { label: 'Total Outbound', value: formatNumber(stats.totalOut), sub: 'Units dispatched', icon: ArrowUpRight, tone: 'rose', valueTone: 'rose' },
                { label: 'Net Flow', value: stats.net > 0 ? `+${formatNumber(stats.net)}` : formatNumber(stats.net), sub: 'Inventory impact', icon: Activity, tone: 'brand' },
                { label: 'Most Active Item', value: stats.mostActive, sub: 'Highest frequency', icon: Package, tone: 'amber' },
            ]} />
            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Inbound vs outbound" subtitle="Units moved per day" icon={BarChart3}>
                        <TrendChart series={daily} type="bar" unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="By movement type" subtitle="Units per type" icon={PieIcon} tone="amber">
                        <DonutChart slices={byType} unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Movements" subtitle={`${movements.length} records`} icon={Table2} flush>
                <ReportTable columns={columns} rows={movements} rowKey={(r) => r.id ?? `${r.created_at}-${r.product_id}-${r.type}`} />
            </ReportSection>
        </ReportShell>
    );
}
