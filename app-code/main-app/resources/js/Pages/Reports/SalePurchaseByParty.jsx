import React from 'react';
import { Users, TrendingUp, ShoppingCart, Scale } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function SalePurchaseByParty({ parties = [] }) {
    const sum = (k) => parties.reduce((a, p) => a + (Number(p[k]) || 0), 0);
    const sales = sum('sales'); const purchases = sum('purchases'); const net = sum('net');
    const volume = (p) => (Number(p.sales) || 0) + (Number(p.purchases) || 0);
    const top = [...parties].sort((a, b) => volume(b) - volume(a)).slice(0, 8);

    const columns = [
        { key: 'name', label: 'Party Name', sortable: true, render: (p) => <span className="font-bold text-ink">{p.name}</span> },
        { key: 'sales', label: 'Total Sales', align: 'right', sortable: true, render: (p) => <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(p.sales)}</span> },
        { key: 'purchases', label: 'Total Purchases', align: 'right', sortable: true, render: (p) => <span className="text-red-600 dark:text-red-400">{formatCurrency(p.purchases)}</span> },
        { key: 'net', label: 'Net Position', align: 'right', sortable: true, render: (p) => <span className={`font-bold ${p.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(p.net)}</span> },
    ];

    return (
        <ReportShell title="Sale & Purchase by Party" subtitle="Net transaction summary for each customer and supplier" activeKey="sale-purchase-by-party"
            exportConfig={{ filename: 'sale-purchase-by-party', columns: columns.map((c) => ({ label: c.label, get: (r) => r[c.key] })), rows: parties }}>
            <ReportKpis items={[
                { label: 'Total Sales', value: formatCurrency(sales), icon: TrendingUp, tone: 'emerald' },
                { label: 'Total Purchases', value: formatCurrency(purchases), icon: ShoppingCart, tone: 'rose' },
                { label: 'Net Position', value: formatCurrency(net), icon: Scale, tone: 'brand', valueTone: net < 0 ? 'rose' : undefined },
                { label: 'Parties', value: parties.length, icon: Users, tone: 'sky' },
            ]} />
            <ReportGrid>
                <ReportCol span={7}>
                    <ReportSection title="Sales vs purchases" subtitle="Top 8 parties by volume">
                        <TrendChart type="bar" height={260} series={[
                            { name: 'Sales', points: top.map((p) => ({ x: p.name, y: Number(p.sales) || 0 })) },
                            { name: 'Purchases', points: top.map((p) => ({ x: p.name, y: Number(p.purchases) || 0 })) },
                        ]} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={5}>
                    <ReportSection title="Top parties by sales" subtitle="Top 8">
                        <RankBars items={[...parties].sort((a, b) => b.sales - a.sales).map((p) => ({ label: p.name, value: Number(p.sales) || 0 }))} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Parties" subtitle={`${parties.length} records`} flush>
                <ReportTable columns={columns} rows={parties} rowKey={(p, i) => i} totals={{ name: 'Total', sales: formatCurrency(sales), purchases: formatCurrency(purchases), net: formatCurrency(net) }} />
            </ReportSection>
        </ReportShell>
    );
}
