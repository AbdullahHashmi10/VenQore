import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Landmark, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

const day = (d) => String(d || '').slice(0, 10);

export default function TaxReport({ tax_records = [], stats = {}, filters = {} }) {
    const { store } = usePage().props;

    const go = (patch) => {
        router.get(route('store.reports.tax', { store_slug: store.slug }), { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    const perDay = {};
    tax_records.forEach((r) => {
        const k = day(r.date);
        if (!k) return;
        perDay[k] = perDay[k] || { out: 0, in: 0 };
        if (r.type === 'sale') perDay[k].out += Number(r.tax_amount) || 0; else perDay[k].in += Number(r.tax_amount) || 0;
    });
    const days = Object.keys(perDay).sort();
    const series = [
        { name: 'Output tax', points: days.map((d) => ({ x: d, y: perDay[d].out })) },
        { name: 'Input tax', points: days.map((d) => ({ x: d, y: perDay[d].in })) },
    ];

    const columns = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'invoice_number', label: 'Invoice #', render: (row) => <span className="font-mono text-xs text-ink-muted">{row.invoice_number}</span> },
        { key: 'type', label: 'Type', sortable: true, render: (row) => (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.type === 'sale' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                {row.type === 'sale' ? 'Output Tax (Sales)' : 'Input Tax (Purchase)'}
            </span>
        ) },
        { key: 'taxable_amount', label: 'Taxable Amt', align: 'right', sortable: true, render: (row) => formatCurrency(row.taxable_amount) },
        { key: 'tax_amount', label: 'Tax Amount', align: 'right', sortable: true, render: (row) => (
            <span className={`font-bold tabular-nums ${row.type === 'sale' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{formatCurrency(row.tax_amount)}</span>
        ) },
    ];

    return (
        <ReportShell
            title="Tax Report"
            activeKey="tax"
            filters={<DateRangeFilter from={filters.start_date} to={filters.end_date} onChange={({ from, to }) => go({ start_date: from, end_date: to })} />}
            exportConfig={{
                filename: 'tax-report',
                columns: [
                    { label: 'Date', get: (r) => r.date },
                    { label: 'Invoice #', get: (r) => r.invoice_number },
                    { label: 'Type', get: (r) => (r.type === 'sale' ? 'Output' : 'Input') },
                    { label: 'Taxable', get: (r) => r.taxable_amount },
                    { label: 'Tax', get: (r) => r.tax_amount },
                ],
                rows: tax_records,
            }}
        >
            <ReportKpis items={[
                { label: 'Net Tax Payable', value: formatCurrency(stats.net_tax), icon: Landmark, tone: stats.net_tax >= 0 ? 'rose' : 'emerald', valueTone: stats.net_tax >= 0 ? 'rose' : 'emerald', sub: stats.net_tax >= 0 ? 'Payable' : 'Refundable' },
                { label: 'Output Tax', value: formatCurrency(stats.total_output_tax), icon: TrendingUp, tone: 'emerald' },
                { label: 'Input Tax', value: formatCurrency(stats.total_input_tax), icon: TrendingDown, tone: 'amber' },
                { label: 'Total Taxable', value: formatCurrency(stats.total_taxable), icon: Percent, tone: 'slate' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Output vs input tax" subtitle="Per day">
                        <TrendChart series={series} type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Tax split">
                        <DonutChart slices={[
                            { name: 'Output tax', value: Number(stats.total_output_tax) || 0 },
                            { name: 'Input tax', value: Number(stats.total_input_tax) || 0 },
                        ].filter((s) => s.value > 0)} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Tax records" subtitle={`${tax_records.length} records`} flush>
                <ReportTable columns={columns} rows={tax_records} rowKey={(r, i) => r.id ?? i} />
            </ReportSection>
        </ReportShell>
    );
}
