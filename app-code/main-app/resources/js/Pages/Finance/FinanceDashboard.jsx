import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { ArrowUpRight, ArrowDownLeft, Wallet, Building2, TrendingUp, PieChart, BarChart3, History } from 'lucide-react';
import { useTermText } from '@/lib/terms';

const num = (v) => parseFloat(v ?? 0) || 0;
const shortDay = (d) => {
    const dt = new Date(`${String(d).slice(0, 10)}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function FinanceIndex({ stats = {}, topReceivables = [], topPayables = [], recentEntries = [], cashFlowSeries = [] }) {
    const tt = useTermText();
    const { store } = usePage().props;
    const moneyNavGroups = useMoneyNavGroups();
    const fmt = (v) => formatCurrency(num(v), store);
    const link = (name) => { try { return route(name, { store_slug: store?.slug }); } catch (e) { return undefined; } };

    const liquidity = num(stats.cash) + num(stats.bank);
    const net = liquidity + num(stats.receivables) - num(stats.payables);

    const flow = useMemo(() => {
        const rows = cashFlowSeries || [];
        return {
            series: [
                { name: 'Money in', points: rows.map((r) => ({ x: shortDay(r.day), y: num(r.in) })) },
                { name: 'Money out', points: rows.map((r) => ({ x: shortDay(r.day), y: num(r.out) })) },
            ],
            totalIn: rows.reduce((s, r) => s + num(r.in), 0),
            totalOut: rows.reduce((s, r) => s + num(r.out), 0),
        };
    }, [cashFlowSeries]);

    const slices = [
        { name: 'Cash', value: Math.max(0, num(stats.cash)) },
        { name: 'Bank', value: Math.max(0, num(stats.bank)) },
        { name: 'Receivables', value: Math.max(0, num(stats.receivables)) },
    ].filter((s) => s.value > 0);

    const partyItems = (list, noun) => (list || []).map((p) => ({ label: p.name, value: num(p.balance ?? p.current_balance), sub: noun }));

    const entryTotal = (e) => (e.items || []).reduce((s, i) => s + num(i.debit), 0);
    const columns = [
        { key: 'date', label: 'Date', get: (e) => e.date, render: (e) => new Date(e.date).toLocaleDateString(), width: 120 },
        { key: 'description', label: 'Description', get: (e) => e.description || 'No description', render: (e) => <span className="font-semibold text-ink">{e.description || 'No description'}</span> },
        { key: 'accounts', label: 'Accounts', get: (e) => (e.items || []).map((i) => i.account?.name).filter(Boolean).join(', ') },
        { key: 'amount', label: 'Amount', align: 'right', get: entryTotal, render: (e) => <span className="font-bold tabular-nums text-ink">{fmt(entryTotal(e))}</span> },
    ];

    return (
        <ReportShell
            title="Finance Dashboard"
            navGroups={moneyNavGroups}
            activeKey="finance"
            activeMenu="Money"
            showHub={false}
            exportConfig={{
                filename: 'recent-transactions',
                columns: [{ label: 'Date', get: (e) => e.date }, { label: 'Description', get: (e) => e.description }, { label: 'Amount', get: entryTotal }],
                rows: recentEntries,
            }}
        >
            <ReportKpis items={[
                { label: 'Cash on hand', value: fmt(stats.cash), icon: Wallet, tone: 'emerald' },
                { label: 'Bank balance', value: fmt(stats.bank), icon: Building2, tone: 'blue' },
                { label: 'Receivables', value: fmt(stats.receivables), icon: ArrowDownLeft, tone: 'brand', href: link('store.finance.receivables') },
                { label: 'Payables', value: fmt(stats.payables), icon: ArrowUpRight, tone: 'rose', href: link('store.finance.payables') },
                { label: 'Total liquidity', value: fmt(liquidity), icon: PieChart, tone: 'violet' },
                { label: 'Net position', value: fmt(net), icon: TrendingUp, tone: net >= 0 ? 'emerald' : 'rose', valueTone: net >= 0 ? 'emerald' : 'rose', trend: net >= 0 ? 'up' : 'down', sub: 'Liquidity + receivables - payables' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Cash in vs out" subtitle={`Last 30 days · in ${fmt(flow.totalIn)} · out ${fmt(flow.totalOut)}`} icon={BarChart3} tone="emerald">
                        <TrendChart series={flow.series} type="area" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Where the money sits" subtitle="Cash, bank and receivables" icon={PieChart} tone="violet">
                        <DonutChart slices={slices} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={6}>
                    <ReportSection title="Top receivables" subtitle={`Who owes you · ${tt('Customer')}s`} icon={ArrowDownLeft} tone="brand"
                        right={<Link href={link('store.finance.receivables') || '#'} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">View all</Link>}>
                        <RankBars items={partyItems(topReceivables, tt('Customer'))} limit={5} colorIndex={0} empty="No pending receivables" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={6}>
                    <ReportSection title="Top payables" subtitle={`Who you owe · ${tt('Supplier')}s`} icon={ArrowUpRight} tone="rose"
                        right={<Link href={link('store.finance.payables') || '#'} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-rose-600 hover:bg-interactive-hover">View all</Link>}>
                        <RankBars items={partyItems(topPayables, tt('Supplier'))} limit={5} colorIndex={3} empty="No pending payables" />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Recent transactions" icon={History} tone="brand" flush
                right={<Link href={link('store.accounting.index') || '#'} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">View ledger</Link>}>
                <ReportTable columns={columns} rows={recentEntries} rowKey={(e) => e.id} pageSize={10} empty="No recent transactions found" />
            </ReportSection>
        </ReportShell>
    );
}
