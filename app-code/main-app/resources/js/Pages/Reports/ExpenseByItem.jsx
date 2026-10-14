import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { Wallet, List, Layers, PieChart } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function ExpenseByItem({ expenses = [] }) {
    const { store } = usePage().props;
    const money = (v) => formatCurrency(v || 0, store);
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const byCat = useMemo(() => {
        const m = {};
        expenses.forEach((e) => { const k = e.category || 'Uncategorized'; m[k] = (m[k] || 0) + (Number(e.amount) || 0); });
        return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [expenses]);

    const columns = [
        { key: 'date', label: 'Date', sortable: true, render: (e) => new Date(e.date).toLocaleDateString() },
        { key: 'reference', label: 'Reference', get: (e) => e.reference || 'N/A', render: (e) => <span className="font-bold text-ink">{e.reference || 'N/A'}</span> },
        { key: 'category', label: 'Category', sortable: true, render: (e) => <span className="rounded-[12px] bg-sunken px-2 py-1 text-2xs font-bold uppercase text-ink-secondary">{e.category}</span> },
        { key: 'description', label: 'Description', get: (e) => e.description || 'No description' },
        { key: 'amount', label: 'Amount', align: 'right', sortable: true, get: (e) => Number(e.amount) || 0, render: (e) => <span className="font-bold text-red-600 dark:text-red-400">{money(e.amount)}</span> },
    ];

    return (
        <ReportShell title="Expense by Item" subtitle="Detailed list of all individual expenses"
            exportConfig={{ filename: 'expense-by-item', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: expenses }}>
            <ReportKpis items={[
                { label: 'Total Expenses', value: money(total), icon: Wallet, tone: 'rose' },
                { label: 'Entries', value: expenses.length, icon: List, tone: 'sky' },
                { label: 'Categories', value: byCat.length, icon: Layers, tone: 'amber' },
                { label: 'Average Expense', value: money(expenses.length ? total / expenses.length : 0), icon: Wallet, tone: 'brand' },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Share by category" icon={PieChart}>
                        <DonutChart height={240} slices={byCat.filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Largest expenses" subtitle="Top 8 entries">
                        <RankBars items={[...expenses].sort((a, b) => b.amount - a.amount).map((e) => ({ label: e.description || e.reference || e.category || 'Expense', value: Number(e.amount) || 0, sub: e.category }))} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Expenses" subtitle={`${expenses.length} records`} flush>
                <ReportTable columns={columns} rows={expenses} rowKey={(e, i) => e.id ?? i} totals={{ date: 'Total', amount: money(total) }} />
            </ReportSection>
        </ReportShell>
    );
}
