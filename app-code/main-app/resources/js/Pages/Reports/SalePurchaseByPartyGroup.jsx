import React from 'react';
import { Users2, TrendingUp, ShoppingCart, Scale } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart } from '@/Components/Reports/ReportCharts';

export default function SalePurchaseByPartyGroup({ groups = [] }) {
    const tt = useTermText();
    const sum = (k) => groups.reduce((a, g) => a + (Number(g[k]) || 0), 0);
    const sales = sum('sales'); const purchases = sum('purchases'); const net = sum('net'); const parties = sum('party_count');

    const columns = [
        { key: 'group', label: 'Party Group', sortable: true, render: (g) => <span className="text-sm font-bold uppercase tracking-widest text-ink">{g.group}</span> },
        { key: 'party_count', label: 'Party Count', align: 'center', sortable: true },
        { key: 'sales', label: 'Total Sales', align: 'right', sortable: true, render: (g) => <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(g.sales)}</span> },
        { key: 'purchases', label: 'Total Purchases', align: 'right', sortable: true, render: (g) => <span className="text-red-600 dark:text-red-400">{formatCurrency(g.purchases)}</span> },
        { key: 'net', label: 'Net Position', align: 'right', sortable: true, render: (g) => <span className={`font-bold ${g.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(g.net)}</span> },
    ];

    return (
        <ReportShell title="Sale & Purchase by Party Group" subtitle={tt('Transaction summary grouped by party types (Customer/Supplier)')}
            exportConfig={{ filename: 'sale-purchase-by-party-group', columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })), rows: groups }}>
            <ReportKpis items={[
                { label: 'Total Sales', value: formatCurrency(sales), icon: TrendingUp, tone: 'emerald' },
                { label: 'Total Purchases', value: formatCurrency(purchases), icon: ShoppingCart, tone: 'rose' },
                { label: 'Net Position', value: formatCurrency(net), icon: Scale, tone: 'brand', valueTone: net < 0 ? 'rose' : undefined },
                { label: 'Parties', value: parties, icon: Users2, tone: 'sky', sub: `${groups.length} groups` },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Sales vs purchases" subtitle="By party group">
                        <TrendChart type="bar" height={260} series={[
                            { name: 'Sales', points: groups.map((g) => ({ x: g.group, y: Number(g.sales) || 0 })) },
                            { name: 'Purchases', points: groups.map((g) => ({ x: g.group, y: Number(g.purchases) || 0 })) },
                        ]} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Sales share by group">
                        <DonutChart height={240} slices={groups.map((g) => ({ name: g.group, value: Number(g.sales) || 0 })).filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Party groups" subtitle={`${groups.length} records`} flush>
                <ReportTable columns={columns} rows={groups} rowKey={(g, i) => i} totals={{ group: 'Total', party_count: parties, sales: formatCurrency(sales), purchases: formatCurrency(purchases), net: formatCurrency(net) }} />
            </ReportSection>
        </ReportShell>
    );
}
