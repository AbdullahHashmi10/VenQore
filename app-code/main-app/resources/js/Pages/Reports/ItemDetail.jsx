import React, { useMemo } from 'react';
import { Box, Layers, Boxes, Wallet, AlertTriangle, PieChart } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

const qtyOf = (p) => Number(p.fifo_qty ?? p.stock_quantity ?? 0) || 0;
const costOf = (p) => Number(p.avg_unit_cost ?? p.cost_price ?? 0) || 0;

export default function ItemDetail({ products = [] }) {
    const tt = useTermText();

    const s = useMemo(() => {
        const cost = products.reduce((a, p) => a + qtyOf(p) * costOf(p), 0);
        const retail = products.reduce((a, p) => a + qtyOf(p) * (Number(p.price) || 0), 0);
        const low = products.filter((p) => qtyOf(p) <= 10).length;
        const cats = {};
        products.forEach((p) => { const k = p.category?.name || 'Uncategorized'; cats[k] = (cats[k] || 0) + qtyOf(p) * costOf(p); });
        return { cost, retail, low, cats: Object.entries(cats).map(([name, value]) => ({ name, value })).filter((x) => x.value > 0) };
    }, [products]);

    const top = useMemo(() => products.map((p) => ({ label: p.name, value: qtyOf(p) * costOf(p), sub: `${formatNumber(qtyOf(p))} in stock` })).sort((a, b) => b.value - a.value), [products]);

    const columns = [
        { key: 'name', label: tt('Product'), sortable: true, render: (p) => <span className="font-bold text-ink">{p.name}</span> },
        { key: 'sku', label: 'SKU', get: (p) => p.sku || 'N/A' },
        { key: 'category', label: 'Category', sortable: true, get: (p) => p.category?.name || 'Uncategorized', render: (p) => (
            <span className="rounded-[12px] bg-sunken px-2 py-1 text-2xs font-bold uppercase text-ink-secondary">{p.category?.name || 'Uncategorized'}</span>
        ) },
        { key: 'cost', label: 'Avg FIFO Cost', align: 'right', sortable: true, get: costOf, render: (p) => formatCurrency(p.avg_unit_cost ?? p.cost_price) },
        { key: 'price', label: 'Sale Price', align: 'right', sortable: true, get: (p) => Number(p.price) || 0, render: (p) => <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(p.price)}</span> },
        { key: 'stock', label: 'Stock', align: 'center', sortable: true, get: qtyOf, render: (p) => (
            <span className={`rounded-[12px] px-2 py-1 text-xs font-bold ${qtyOf(p) > 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{formatNumber(qtyOf(p))}</span>
        ) },
    ];

    return (
        <ReportShell title="Item Detail Report" subtitle={tt('Comprehensive details of all products in inventory')} activeKey="item-detail"
            exportConfig={{ filename: 'item-detail', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: products }}>
            <ReportKpis items={[
                { label: tt('Total Products'), value: products.length, icon: Box, tone: 'brand' },
                { label: 'Units in Stock', value: formatNumber(products.reduce((a, p) => a + qtyOf(p), 0)), icon: Boxes, tone: 'sky' },
                { label: 'Stock at Cost', value: formatCurrency(s.cost), icon: Wallet, tone: 'emerald' },
                { label: 'Stock at Retail', value: formatCurrency(s.retail), icon: Layers, tone: 'violet' },
                { label: 'Low / Out of Stock', value: s.low, icon: AlertTriangle, tone: 'amber', sub: '10 units or fewer' },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Stock value by category" subtitle="At average cost" icon={PieChart}>
                        <DonutChart slices={s.cats} height={240} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title={tt('Top products by stock value')} subtitle="Top 8 at average cost">
                        <RankBars items={top} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title={tt('Products')} subtitle={`${products.length} records`} flush>
                <ReportTable columns={columns} rows={products} rowKey={(p, i) => p.id ?? i} />
            </ReportSection>
        </ReportShell>
    );
}
