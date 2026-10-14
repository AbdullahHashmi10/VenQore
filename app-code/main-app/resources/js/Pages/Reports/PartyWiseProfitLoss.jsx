import React from 'react';
import { Users, Wallet, TrendingUp, Percent } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function PartyWiseProfitLoss({ parties = [] }) {
    const sales = parties.reduce((a, p) => a + (Number(p.sales) || 0), 0);
    const profit = parties.reduce((a, p) => a + (Number(p.profit) || 0), 0);
    const margin = sales > 0 ? (profit / sales) * 100 : 0;
    const byProfit = [...parties].sort((a, b) => b.profit - a.profit);

    const columns = [
        { key: 'name', label: 'Party Name', sortable: true, render: (p) => <span className="font-bold text-ink">{p.name}</span> },
        { key: 'sales', label: 'Total Sales', align: 'right', sortable: true, render: (p) => formatCurrency(p.sales) },
        { key: 'profit', label: 'Estimated Profit', align: 'right', sortable: true, render: (p) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.profit)}</span> },
    ];

    return (
        <ReportShell title="Party-wise Profit & Loss" subtitle="Profitability analysis per customer/supplier" activeKey="party-wise-profit-loss"
            exportConfig={{ filename: 'party-wise-profit-loss', columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })), rows: parties }}>
            <ReportKpis items={[
                { label: 'Parties', value: parties.length, icon: Users, tone: 'sky' },
                { label: 'Total Sales', value: formatCurrency(sales), icon: Wallet, tone: 'brand' },
                { label: 'Estimated Profit', value: formatCurrency(profit), icon: TrendingUp, tone: 'emerald', valueTone: profit < 0 ? 'rose' : undefined },
                { label: 'Margin', value: `${margin.toFixed(1)}%`, icon: Percent, tone: 'amber' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Most profitable parties" subtitle="Top 8 by profit">
                        <RankBars items={byProfit.map((p) => ({ label: p.name, value: Number(p.profit) || 0, sub: formatCurrency(p.sales) }))} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Sales share by party" subtitle="Top 6 plus others">
                        <DonutChart height={240} slices={(() => {
                            const s = [...parties].sort((a, b) => b.sales - a.sales).filter((p) => p.sales > 0);
                            const head = s.slice(0, 6).map((p) => ({ name: p.name, value: Number(p.sales) }));
                            const rest = s.slice(6).reduce((a, p) => a + Number(p.sales), 0);
                            return rest > 0 ? [...head, { name: 'Others', value: rest }] : head;
                        })()} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Parties" subtitle={`${parties.length} records`} flush>
                <ReportTable columns={columns} rows={parties} rowKey={(p, i) => i} totals={{ name: 'Total', sales: formatCurrency(sales), profit: formatCurrency(profit) }} />
            </ReportSection>
        </ReportShell>
    );
}
