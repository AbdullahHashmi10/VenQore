import React, { useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Package, DollarSign, TrendingUp, PieChart as PieIcon, Trophy, Table2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function StockValuation({ products = [], stats = {}, filters = {}, categories = [], warehouses = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();

    const apply = (key, value) => {
        const next = { ...filters, [key]: value };
        Object.keys(next).forEach((k) => { if (next[k] === '' || next[k] == null) delete next[k]; });
        router.get(route('store.reports.stock-valuation', { store_slug: store.slug }), next, { preserveState: true, replace: true });
    };

    const byCategory = useMemo(() => {
        const m = {};
        products.forEach((p) => {
            const n = p.category?.name || 'Uncategorized';
            m[n] = (m[n] || 0) + (Number(p.stock_value) || 0);
        });
        return Object.entries(m).map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
    }, [products]);

    const topValue = useMemo(() => [...products]
        .sort((a, b) => (Number(b.stock_value) || 0) - (Number(a.stock_value) || 0))
        .slice(0, 8)
        .map((p) => ({ label: p.name, value: Number(p.stock_value) || 0, sub: `${formatNumber(p.stock_quantity)} units` })), [products]);

    const totalCost = products.reduce((s, p) => s + (Number(p.stock_value) || 0), 0);
    const totalRetail = products.reduce((s, p) => s + (Number(p.retail_value) || 0), 0);
    const totalQty = products.reduce((s, p) => s + (Number(p.stock_quantity) || 0), 0);

    const columns = [
        { key: 'name', label: tt('Product'), sortable: true, get: (r) => r.name,
          render: (r) => (<div className="min-w-0"><div className="truncate text-sm font-semibold text-ink">{r.name}</div><div className="truncate text-xs text-ink-muted">{r.sku}</div></div>) },
        { key: 'category', label: 'Category', sortable: true, get: (r) => r.category?.name || '', render: (r) => r.category?.name || '-' },
        { key: 'stock_quantity', label: 'Qty (FIFO)', align: 'right', sortable: true, get: (r) => Number(r.stock_quantity) || 0, render: (r) => <span className="font-semibold">{formatNumber(r.stock_quantity)}</span> },
        { key: 'unit_cost', label: 'FIFO Unit Cost', align: 'right', get: (r) => Number(r.unit_cost) || 0, render: (r) => formatCurrency(r.unit_cost, store) },
        { key: 'sale_price', label: 'Sale Price', align: 'right', get: (r) => Number(r.sale_price) || 0, render: (r) => formatCurrency(r.sale_price, store) },
        { key: 'stock_value', label: 'Stock Value', align: 'right', sortable: true, get: (r) => Number(r.stock_value) || 0, render: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.stock_value, store)}</span> },
        { key: 'retail_value', label: 'Retail Value', align: 'right', sortable: true, get: (r) => Number(r.retail_value) || 0, render: (r) => <span className="font-medium text-ink-secondary">{formatCurrency(r.retail_value, store)}</span> },
    ];

    const exportColumns = [
        { label: 'Product', get: (r) => r.name }, { label: 'SKU', get: (r) => r.sku }, { label: 'Category', get: (r) => r.category?.name || '' },
        { label: 'Quantity', get: (r) => r.stock_quantity }, { label: 'FIFO Unit Cost', get: (r) => r.unit_cost }, { label: 'Sale Price', get: (r) => r.sale_price },
        { label: 'Stock Value (Cost)', get: (r) => r.stock_value }, { label: 'Retail Value', get: (r) => r.retail_value },
    ];

    return (
        <ReportShell
            title="Stock Valuation"
            subtitle="What your stock is worth at cost and at retail"
            activeKey="stock-valuation"
            exportConfig={{ filename: `stock_valuation_${new Date().toISOString().split('T')[0]}`, columns: exportColumns, rows: products }}
            filters={(
                <div className="flex flex-wrap items-center gap-2">
                    <FilterSelect label="Category" value={filters.category_id} onChange={(v) => apply('category_id', v)}
                        options={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
                    <FilterSelect label="Warehouse" value={filters.warehouse_id} onChange={(v) => apply('warehouse_id', v)}
                        options={[{ value: '', label: 'All' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]} />
                </div>
            )}
        >
            <ReportKpis items={[
                { label: 'Total Stock Value (Cost)', value: formatCurrency(stats.total_cost_value, store), icon: DollarSign, tone: 'emerald' },
                { label: 'Total Retail Value', value: formatCurrency(stats.total_retail_value, store), icon: TrendingUp, tone: 'brand' },
                { label: 'Potential Profit', value: formatCurrency(stats.potential_profit, store), icon: DollarSign, tone: 'amber' },
                { label: 'Total Items', value: formatNumber(stats.total_items), icon: Package, tone: 'slate' },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Value by category" subtitle="Share of stock value at cost" icon={PieIcon}>
                        <DonutChart slices={byCategory} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Top value items" subtitle="Largest capital tied up" icon={Trophy} tone="amber">
                        <RankBars items={topValue} unit="currency" />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Valuation detail" subtitle={`${products.length} products`} icon={Table2} flush>
                <ReportTable columns={columns} rows={products} rowKey={(r) => r.id ?? r.sku}
                    totals={{ name: 'Total', stock_quantity: formatNumber(totalQty), stock_value: formatCurrency(totalCost, store), retail_value: formatCurrency(totalRetail, store) }} />
            </ReportSection>
        </ReportShell>
    );
}
