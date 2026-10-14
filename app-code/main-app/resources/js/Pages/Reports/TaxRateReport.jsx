import React from 'react';
import { Hash, Receipt, Percent, PieChart } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function TaxRateReport({ taxRates = [] }) {
    const totalTax = taxRates.reduce((sum, tr) => sum + (Number(tr.total_tax) || 0), 0);
    const totalCount = taxRates.reduce((sum, tr) => sum + (Number(tr.count) || 0), 0);
    const share = (tr) => (totalTax > 0 ? (tr.total_tax / totalTax) * 100 : 0);
    const topRate = [...taxRates].sort((a, b) => b.total_tax - a.total_tax)[0];

    const columns = [
        { key: 'tax_rate', label: 'Tax Rate (%)', sortable: true, render: (tr) => <span className="font-bold text-ink">{tr.tax_rate}%</span> },
        { key: 'count', label: 'Invoice Count', align: 'center', sortable: true },
        { key: 'total_tax', label: 'Total Tax Collected', align: 'right', sortable: true, render: (tr) => <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(tr.total_tax)}</span> },
        { key: 'share', label: 'Share', align: 'right', sortable: true, get: share, render: (tr) => <span className="text-xs font-bold text-ink-muted">{share(tr).toFixed(1)}%</span> },
    ];

    return (
        <ReportShell title="Tax Rate Report" subtitle="Breakdown of tax collected by different tax rates" activeKey="tax-rate"
            exportConfig={{ filename: 'tax-rate-report', columns: [
                { label: 'Tax Rate (%)', get: (r) => r.tax_rate }, { label: 'Invoice Count', get: (r) => r.count },
                { label: 'Total Tax Collected', get: (r) => r.total_tax }, { label: 'Share %', get: (r) => share(r).toFixed(1) },
            ], rows: taxRates }}>
            <ReportKpis items={[
                { label: 'Total Tax', value: formatCurrency(totalTax), icon: Receipt, tone: 'brand' },
                { label: 'Tax Rates', value: taxRates.length, icon: Hash, tone: 'sky' },
                { label: 'Invoices', value: totalCount, icon: Receipt, tone: 'emerald' },
                { label: 'Top Rate', value: topRate ? `${topRate.tax_rate}%` : '-', icon: Percent, tone: 'amber', sub: topRate ? formatCurrency(topRate.total_tax) : undefined },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Share of tax by rate" icon={PieChart}>
                        <DonutChart height={240} slices={taxRates.map((tr) => ({ name: `${tr.tax_rate}%`, value: Number(tr.total_tax) || 0 })).filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Tax collected by rate" subtitle="Top 8">
                        <RankBars items={taxRates.map((tr) => ({ label: `${tr.tax_rate}%`, value: Number(tr.total_tax) || 0, sub: `${tr.count} invoices` })).sort((a, b) => b.value - a.value)} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Tax rates" subtitle={`${taxRates.length} records`} flush>
                <ReportTable columns={columns} rows={taxRates} rowKey={(tr, i) => i}
                    totals={{ tax_rate: 'Total Tax', count: totalCount, total_tax: formatCurrency(totalTax), share: totalTax > 0 ? '100%' : '' }} />
            </ReportSection>
        </ReportShell>
    );
}
