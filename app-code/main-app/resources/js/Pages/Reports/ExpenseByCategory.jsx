import React from 'react';
import { usePage } from '@inertiajs/react';
import { PieChart, Wallet, Layers, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function ExpenseByCategory({ expenses = [] }) {
    const { store } = usePage().props;
    const money = (v) => formatCurrency(v || 0, store);
    const total = expenses.reduce((sum, exp) => sum + (Number(exp.total) || 0), 0);
    const pct = (exp) => (total > 0 ? (exp.total / total) * 100 : 0);
    const name = (exp) => exp.category || 'Uncategorized';
    const top = [...expenses].sort((a, b) => b.total - a.total)[0];

    const columns = [
        { key: 'category', label: 'Category', sortable: true, get: name, render: (e) => <span className="font-bold text-ink">{name(e)}</span> },
        { key: 'total', label: 'Total', align: 'right', sortable: true, render: (e) => <span className="font-bold text-ink">{money(e.total)}</span> },
        { key: 'share', label: 'Share', align: 'right', sortable: true, get: pct, render: (e) => <span className="text-xs font-bold text-ink-muted">{pct(e).toFixed(1)}%</span> },
    ];

    return (
        <ReportShell title="Expense by Category" subtitle="Breakdown of expenses across different categories" activeKey="expense-by-category"
            exportConfig={{ filename: 'expense-by-category', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: expenses }}>
            <ReportKpis items={[
                { label: 'Total Expenses', value: money(total), icon: Wallet, tone: 'rose' },
                { label: 'Categories', value: expenses.length, icon: Layers, tone: 'sky' },
                { label: 'Largest Category', value: top ? name(top) : '-', icon: TrendingUp, tone: 'amber', sub: top ? `${money(top.total)} (${pct(top).toFixed(1)}%)` : undefined },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Share by category" icon={PieChart}>
                        <DonutChart height={240} slices={expenses.map((e) => ({ name: name(e), value: Number(e.total) || 0 })).filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Category breakdown" subtitle="Top 8">
                        <RankBars items={expenses.map((e) => ({ label: name(e), value: Number(e.total) || 0, sub: `${pct(e).toFixed(1)}%` })).sort((a, b) => b.value - a.value)} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Categories" subtitle={`${expenses.length} records`} flush>
                <ReportTable columns={columns} rows={expenses} rowKey={(e, i) => i} totals={{ category: 'Total', total: money(total), share: total > 0 ? '100%' : '' }} />
            </ReportSection>
        </ReportShell>
    );
}
