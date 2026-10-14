import React from 'react';
import { Layers, Boxes, Wallet, PieChart } from 'lucide-react';
import OfflineWarningBanner from '@/Components/OfflineWarningBanner';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function StockSummaryByCategory({ categories = [] }) {
    const tt = useTermText();
    const totalValue = categories.reduce((sum, cat) => sum + (Number(cat.value) || 0), 0);
    const totalProducts = categories.reduce((sum, cat) => sum + (Number(cat.products) || 0), 0);
    const share = (cat) => (totalValue > 0 ? (cat.value / totalValue) * 100 : 0);

    const columns = [
        { key: 'name', label: 'Category Name', sortable: true, render: (c) => <span className="font-bold text-ink">{c.name}</span> },
        { key: 'products', label: tt('Product Count'), align: 'center', sortable: true },
        { key: 'value', label: 'Total Value (Retail)', align: 'right', sortable: true, render: (c) => <span className="font-bold text-ink">{formatCurrency(c.value)}</span> },
        { key: 'share', label: 'Value Share', align: 'right', sortable: true, get: share, render: (c) => <span className="text-xs font-bold text-ink-muted">{share(c).toFixed(1)}%</span> },
    ];

    return (
        <ReportShell title="Stock Summary by Category" subtitle={tt('Inventory valuation breakdown by product categories')} activeKey="stock-summary-by-category"
            exportConfig={{ filename: 'stock-summary-by-category', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: categories }}>
            <OfflineWarningBanner />
            <ReportKpis items={[
                { label: 'Total Categories', value: categories.length, icon: Layers, tone: 'brand' },
                { label: tt('Total Products'), value: totalProducts, icon: Boxes, tone: 'sky' },
                { label: 'Total Inventory Value', value: formatCurrency(totalValue), icon: Wallet, tone: 'emerald' },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Value share by category" icon={PieChart}>
                        <DonutChart height={240} slices={categories.map((c) => ({ name: c.name, value: Number(c.value) || 0 })).filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Top categories by value" subtitle="Top 8">
                        <RankBars items={categories.map((c) => ({ label: c.name, value: Number(c.value) || 0, sub: `${c.products} items` })).sort((a, b) => b.value - a.value)} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Categories" subtitle={`${categories.length} records`} flush>
                <ReportTable columns={columns} rows={categories} rowKey={(c, i) => i}
                    totals={{ name: 'Total', products: totalProducts, value: formatCurrency(totalValue), share: totalValue > 0 ? '100%' : '' }} />
            </ReportSection>
        </ReportShell>
    );
}
