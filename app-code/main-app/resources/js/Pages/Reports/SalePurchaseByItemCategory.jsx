import React, { useMemo } from 'react';
import { Tags, TrendingUp, ShoppingCart, Scale } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function SalePurchaseByItemCategory({ categories = [] }) {
    const rows = useMemo(() => categories.map((cat) => {
        const sales = (cat.products || []).reduce((s, p) => s + (Number(p.sale_items_sum_subtotal) || 0), 0);
        const purchases = (cat.products || []).reduce((s, p) => s + (Number(p.purchase_items_sum_subtotal) || 0), 0);
        return { name: cat.name, sales, purchases, net: sales - purchases };
    }), [categories]);
    const sales = rows.reduce((a, r) => a + r.sales, 0);
    const purchases = rows.reduce((a, r) => a + r.purchases, 0);

    const columns = [
        { key: 'name', label: 'Category', sortable: true, render: (r) => <span className="font-bold text-ink">{r.name}</span> },
        { key: 'sales', label: 'Sales', align: 'right', sortable: true, render: (r) => <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(r.sales)}</span> },
        { key: 'purchases', label: 'Purchases', align: 'right', sortable: true, render: (r) => <span className="text-red-600 dark:text-red-400">{formatCurrency(r.purchases)}</span> },
        { key: 'net', label: 'Net', align: 'right', sortable: true, render: (r) => <span className={`font-bold ${r.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(r.net)}</span> },
    ];

    return (
        <ReportShell title="Sale & Purchase by Category" subtitle="Transaction summary grouped by product categories"
            exportConfig={{ filename: 'sale-purchase-by-category', columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })), rows }}>
            <ReportKpis items={[
                { label: 'Sales', value: formatCurrency(sales), icon: TrendingUp, tone: 'emerald' },
                { label: 'Purchases', value: formatCurrency(purchases), icon: ShoppingCart, tone: 'rose' },
                { label: 'Net', value: formatCurrency(sales - purchases), icon: Scale, tone: 'brand', valueTone: sales - purchases < 0 ? 'rose' : undefined },
                { label: 'Categories', value: rows.length, icon: Tags, tone: 'sky' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Sales vs purchases" subtitle="By category">
                        <TrendChart type="bar" height={260} series={[
                            { name: 'Sales', points: rows.map((r) => ({ x: r.name, y: r.sales })) },
                            { name: 'Purchases', points: rows.map((r) => ({ x: r.name, y: r.purchases })) },
                        ]} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Top categories by sales" subtitle="Top 8">
                        <RankBars items={[...rows].sort((a, b) => b.sales - a.sales).map((r) => ({ label: r.name, value: r.sales }))} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Categories" subtitle={`${rows.length} records`} flush>
                <ReportTable columns={columns} rows={rows} rowKey={(r, i) => i} totals={{ name: 'Total', sales: formatCurrency(sales), purchases: formatCurrency(purchases), net: formatCurrency(sales - purchases) }} />
            </ReportSection>
        </ReportShell>
    );
}
