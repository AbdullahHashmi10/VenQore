import React from 'react';
import { Tag, Boxes, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportTable } from '@/Components/Reports/ReportKit';
import { RankBars } from '@/Components/Reports/ReportCharts';

export default function ItemWiseDiscount({ items = [] }) {
    const tt = useTermText();
    const total = items.reduce((a, i) => a + (Number(i.total_discount) || 0), 0);
    const nameOf = (i) => i.product?.name || 'N/A';
    const top = [...items].sort((a, b) => b.total_discount - a.total_discount)[0];

    const columns = [
        { key: 'name', label: tt('Product Name'), sortable: true, get: nameOf, render: (i) => <span className="font-bold text-ink">{nameOf(i)}</span> },
        { key: 'sku', label: 'SKU', get: (i) => i.product?.sku || 'N/A' },
        { key: 'total_discount', label: 'Total Discount Given', align: 'right', sortable: true, get: (i) => Number(i.total_discount) || 0, render: (i) => <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(i.total_discount)}</span> },
    ];

    return (
        <ReportShell title="Item-wise Discount Report" subtitle={tt('Total discounts given on each product')}
            exportConfig={{ filename: 'item-wise-discount', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: items }}>
            <ReportKpis items={[
                { label: 'Total Discount Given', value: formatCurrency(total), icon: Tag, tone: 'rose' },
                { label: tt('Products Discounted'), value: items.length, icon: Boxes, tone: 'sky' },
                { label: 'Biggest Discount', value: top ? nameOf(top) : '-', icon: TrendingUp, tone: 'amber', sub: top ? formatCurrency(top.total_discount) : undefined },
            ]} />
            <ReportSection title={tt('Products with the most discount')} subtitle="Top 8">
                <RankBars items={items.map((i) => ({ label: nameOf(i), value: Number(i.total_discount) || 0, sub: i.product?.sku })).sort((a, b) => b.value - a.value)} />
            </ReportSection>
            <ReportSection title={tt('Products')} subtitle={`${items.length} records`} flush>
                <ReportTable columns={columns} rows={items} rowKey={(i, k) => k} totals={{ name: 'Total', total_discount: formatCurrency(total) }} />
            </ReportSection>
        </ReportShell>
    );
}
