import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, Package, ArrowDown, DollarSign, ShoppingCart, Trophy, PieChart as PieIcon, Table2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const minOf = (p) => p.effective_threshold || p.alert_quantity || 0;
const shortageOf = (p) => Math.max(0, minOf(p) - (p.stock_quantity || 0));

export default function LowStock({ products = [], stats = {}, filters = {}, categories = [], warehouses = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const apply = (key, value) => {
        const next = { ...filters, [key]: value };
        Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
        router.get(route('store.reports.low-stock', { store_slug: store.slug }), next, { preserveState: true, replace: true });
    };

    const totalShortage = products.reduce((a, p) => a + shortageOf(p), 0);
    const reorderCost = products.reduce((a, p) => a + shortageOf(p) * (p.avg_unit_cost ?? p.cost_price ?? 0), 0);

    const severity = useMemo(() => {
        let out = 0, critical = 0, low = 0;
        products.forEach((p) => {
            const s = p.stock_quantity || 0; const m = minOf(p);
            if (s <= 0) out += 1; else if (m > 0 && s <= m / 2) critical += 1; else low += 1;
        });
        return [{ name: 'Out of stock', value: out }, { name: 'Critical (under half of min)', value: critical }, { name: 'Low', value: low }].filter((s) => s.value > 0);
    }, [products]);

    const depleted = useMemo(() => [...products].sort((a, b) => shortageOf(b) - shortageOf(a)).slice(0, 8)
        .map((p) => ({ label: p.name, value: shortageOf(p), sub: `${formatNumber(p.stock_quantity || 0)} of ${formatNumber(minOf(p))}` })), [products]);

    const reorderCostOf = (r) => {
        const shortage = Math.max(0, (r.min_stock_alert || 0) - (r.stock_quantity || 0));
        return (r.avg_unit_cost ?? r.cost_price ?? 0) * shortage;
    };

    const columns = [
        { key: 'name', label: tt('Product Details'), sortable: true, get: (r) => r.name,
          render: (r) => (
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-line bg-sunken">
                    {r.image ? <img src={`/storage/${r.image}`} className="h-full w-full object-cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} /> : <Package size={16} className="text-ink-muted" />}
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink" title={r.name}>{r.name}</span>
                    <span className="block truncate font-mono text-xs text-ink-muted">{r.sku}{r.category ? ` · ${r.category.name}` : ''}</span>
                </span>
            </div>) },
        { key: 'stock_quantity', label: 'Stock Health', sortable: true, get: (r) => r.stock_quantity || 0,
          render: (r) => {
              const stock = r.stock_quantity || 0; const min = minOf(r);
              const pct = Math.min(100, Math.max(0, (stock / (min * 2 || 10)) * 100));
              const bar = stock === 0 ? 'bg-rose-500' : stock < min ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div className="w-full max-w-[160px]">
                    <div className="mb-1 flex justify-between text-xs font-bold"><span className={stock === 0 ? 'text-rose-600' : 'text-amber-600'}>{formatNumber(stock)} units</span><span className="text-ink-muted">Min: {formatNumber(min)}</span></div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunken"><div className={`h-full ${bar}`} style={{ width: `${pct}%` }} /></div>
                </div>);
          } },
        { key: 'shortage', label: tt('To Order'), align: 'right', sortable: true, get: (r) => shortageOf(r),
          render: (r) => <span className="rounded-[12px] bg-rose-50 px-3 py-1 font-mono text-sm font-bold text-rose-600">+{formatNumber(shortageOf(r))}</span> },
        { key: 'cost', label: 'Est. Reorder Cost', align: 'right', get: reorderCostOf, sortable: true, render: (r) => <span className="font-mono text-sm text-ink-secondary">{formatCurrency(reorderCostOf(r))}</span> },
        { key: 'supplier', label: tt('Supplier'), get: (r) => r.supplier?.name || 'Any', render: (r) => <span className="rounded-[12px] bg-sunken px-2 py-1 text-xs font-bold text-ink-secondary">{r.supplier?.name || 'Any'}</span> },
        { key: 'action', label: 'Action', align: 'right',
          render: () => (
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] text-brand-600 transition-colors hover:bg-interactive-hover" title={tt('Create Purchase Order')}>
                <ShoppingCart size={16} />
            </button>) },
    ];

    return (
        <ReportShell
            title="Low Stock Report"
            subtitle="Critical inventory levels and replenishment needs"
            activeKey="low-stock"
            exportConfig={{ filename: 'low_stock', rows: products, columns: [
                { label: 'Product', get: (r) => r.name }, { label: 'SKU', get: (r) => r.sku }, { label: 'Category', get: (r) => r.category?.name || '' },
                { label: 'Stock', get: (r) => r.stock_quantity || 0 }, { label: 'Min Level', get: (r) => minOf(r) }, { label: 'To Order', get: (r) => shortageOf(r) },
                { label: 'Est. Reorder Cost', get: reorderCostOf }, { label: 'Supplier', get: (r) => r.supplier?.name || '' },
            ] }}
            filters={(
                <div className="flex flex-wrap items-center gap-2">
                    <FilterSelect label="Category" value={filters.category_id} onChange={(v) => apply('category_id', v)} options={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
                    <FilterSelect label="Warehouse" value={filters.warehouse_id} onChange={(v) => apply('warehouse_id', v)} options={[{ value: '', label: 'All' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} />
                </div>
            )}
        >
            <ReportKpis items={[
                { label: 'Critical Shortages', value: stats.out_of_stock_count || products.filter((p) => p.stock_quantity <= 0).length, sub: 'Out of stock', icon: AlertTriangle, tone: 'rose', valueTone: 'rose' },
                { label: 'Low Stock Alerts', value: stats.low_stock_count || products.length, sub: 'Below min. level', icon: Package, tone: 'amber' },
                { label: 'Total Units Needed', value: formatNumber(totalShortage), sub: 'To restore min. levels', icon: ArrowDown, tone: 'brand' },
                { label: 'Est. Reorder Cost', value: formatCurrency(reorderCost), sub: 'Based on cost price', icon: DollarSign, tone: 'emerald' },
            ]} />
            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Severity" subtitle="Products by how low they are" icon={PieIcon} tone="rose">
                        <DonutChart slices={severity} unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={8}>
                    <ReportSection title="Most depleted" subtitle="Biggest gap to minimum level" icon={Trophy} tone="amber">
                        <RankBars items={depleted} unit="integer" colorIndex={2} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Products to reorder" subtitle={`${products.length} products`} icon={Table2} flush>
                <ReportTable columns={columns} rows={products} rowKey={(r) => r.id ?? r.sku} />
            </ReportSection>
        </ReportShell>
    );
}
