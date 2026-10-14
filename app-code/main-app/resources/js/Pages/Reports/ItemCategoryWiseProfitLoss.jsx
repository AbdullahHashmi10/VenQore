import React from 'react';
import { Wallet, TrendingUp, Percent, Layers } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function ItemCategoryWiseProfitLoss({ categories = [] }) {
    const sum = (k) => categories.reduce((a, c) => a + (Number(c[k]) || 0), 0);
    const revenue = sum('revenue'); const cost = sum('cost'); const profit = sum('profit');
    const marginOf = (c) => (c.revenue > 0 ? (c.profit / c.revenue) * 100 : 0);
    const overall = revenue > 0 ? (profit / revenue) * 100 : 0;

    const columns = [
        { key: 'name', label: 'Category', sortable: true, render: (c) => <span className="font-bold text-ink">{c.name}</span> },
        { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (c) => formatCurrency(c.revenue) },
        { key: 'cost', label: 'Cost', align: 'right', sortable: true, render: (c) => formatCurrency(c.cost) },
        { key: 'profit', label: 'Profit', align: 'right', sortable: true, render: (c) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.profit)}</span> },
        { key: 'margin', label: 'Margin', align: 'right', sortable: true, get: marginOf, render: (c) => (
            <span className={`rounded-[12px] px-2 py-1 text-xs font-bold ${marginOf(c) > 20 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{marginOf(c).toFixed(1)}%</span>
        ) },
    ];

    return (
        <ReportShell title="Category-wise Profit & Loss" subtitle="Profitability analysis grouped by product categories" activeKey="item-category-wise-profit-loss"
            exportConfig={{ filename: 'category-wise-profit-loss', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: categories }}>
            <ReportKpis items={[
                { label: 'Revenue', value: formatCurrency(revenue), icon: Wallet, tone: 'brand' },
                { label: 'Cost', value: formatCurrency(cost), icon: Layers, tone: 'amber' },
                { label: 'Profit', value: formatCurrency(profit), icon: TrendingUp, tone: 'emerald', valueTone: profit < 0 ? 'rose' : undefined },
                { label: 'Margin', value: `${overall.toFixed(1)}%`, icon: Percent, tone: 'sky' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Revenue, cost and profit" subtitle="By category">
                        <TrendChart type="bar" height={260} series={[
                            { name: 'Revenue', points: categories.map((c) => ({ x: c.name, y: Number(c.revenue) || 0 })) },
                            { name: 'Cost', points: categories.map((c) => ({ x: c.name, y: Number(c.cost) || 0 })) },
                            { name: 'Profit', points: categories.map((c) => ({ x: c.name, y: Number(c.profit) || 0 })) },
                        ]} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Most profitable categories" subtitle="Top 8 by profit">
                        <RankBars items={categories.map((c) => ({ label: c.name, value: Number(c.profit) || 0, sub: `${marginOf(c).toFixed(1)}%` })).sort((a, b) => b.value - a.value)} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Categories" subtitle={`${categories.length} records`} flush>
                <ReportTable columns={columns} rows={categories} rowKey={(c, i) => i}
                    totals={{ name: 'Total', revenue: formatCurrency(revenue), cost: formatCurrency(cost), profit: formatCurrency(profit), margin: `${overall.toFixed(1)}%` }} />
            </ReportSection>
        </ReportShell>
    );
}
