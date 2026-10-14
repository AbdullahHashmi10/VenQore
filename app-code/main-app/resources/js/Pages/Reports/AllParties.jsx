import React, { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { Users, UserCheck, Truck, Wallet, PieChart } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function AllParties({ parties = [] }) {
    const { store } = usePage().props;
    const money = (v) => formatCurrency(v || 0, store);

    const s = useMemo(() => {
        const customers = parties.filter((p) => p.type === 'customer');
        const suppliers = parties.filter((p) => p.type !== 'customer');
        const sum = (l) => l.reduce((a, p) => a + (Number(p.balance) || 0), 0);
        return { customers, suppliers, total: sum(parties), cb: sum(customers), sb: sum(suppliers) };
    }, [parties]);

    const top = useMemo(() => [...parties].filter((p) => Number(p.balance)).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).map((p) => ({ label: p.name, value: Math.abs(Number(p.balance)), sub: p.type })), [parties]);

    const columns = [
        { key: 'name', label: 'Name', sortable: true, render: (p) => <span className="font-bold text-ink">{p.name}</span> },
        { key: 'type', label: 'Type', sortable: true, render: (p) => (
            <span className={`rounded-full px-2 py-1 text-2xs font-bold uppercase ${p.type === 'customer' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>{p.type}</span>
        ) },
        { key: 'phone', label: 'Phone', get: (p) => p.phone || 'N/A' },
        { key: 'email', label: 'Email', get: (p) => p.email || 'N/A' },
        { key: 'balance', label: 'Balance', align: 'right', sortable: true, get: (p) => Number(p.balance) || 0, render: (p) => <span className="font-bold text-ink">{money(p.balance)}</span> },
    ];

    return (
        <ReportShell title="All Parties Report" subtitle="Complete list of customers and suppliers" activeKey="all-parties"
            exportConfig={{ filename: 'all-parties', columns: columns.map((c) => ({ label: c.label, get: (r) => (c.get ? c.get(r) : r[c.key]) })), rows: parties }}>
            <ReportKpis items={[
                { label: 'Total Parties', value: parties.length, icon: Users, tone: 'brand' },
                { label: 'Customers', value: s.customers.length, icon: UserCheck, tone: 'emerald' },
                { label: 'Suppliers', value: s.suppliers.length, icon: Truck, tone: 'amber' },
                { label: 'Net Balance', value: money(s.total), icon: Wallet, tone: 'sky', sub: `Customers ${money(s.cb)} / Suppliers ${money(s.sb)}` },
            ]} />
            <ReportGrid>
                <ReportCol span={5}>
                    <ReportSection title="Customers vs suppliers" icon={PieChart}>
                        <DonutChart unit="integer" height={240} slices={[{ name: 'Customers', value: s.customers.length }, { name: 'Suppliers', value: s.suppliers.length }].filter((x) => x.value > 0)} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={7}>
                    <ReportSection title="Largest balances" subtitle="Top 8 by absolute balance">
                        <RankBars items={top} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Parties" subtitle={`${parties.length} records`} flush>
                <ReportTable columns={columns} rows={parties} rowKey={(p, i) => p.id ?? i} totals={{ balance: money(s.total) }} />
            </ReportSection>
        </ReportShell>
    );
}
