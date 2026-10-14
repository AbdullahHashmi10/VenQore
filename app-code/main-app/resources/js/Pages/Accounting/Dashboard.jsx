import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, PieChart, Activity, BarChart3, ArrowDownLeft, ArrowUpRight, BookOpen } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

const n = (v) => Number(v) || 0;

export default function AccountingDashboard({ stats = {}, recentTransactions = [] }) {
    const { store } = usePage().props;
    const moneyNavGroups = useMoneyNavGroups();
    const fmt = (v) => formatCurrency(n(v), store);
    const link = (name) => { try { return route(name, { store_slug: store?.slug }); } catch (e) { return '#'; } };

    const profit = n(stats.net_profit);
    const entryTotal = (e) => (e.items || []).reduce((s, i) => s + n(i.debit), 0);

    const flowSeries = [
        { name: 'This month', points: [
            { x: 'Income', y: n(stats.total_income) },
            { x: 'Cost of sales', y: n(stats.cogs) },
            { x: 'Expenses', y: n(stats.total_expense) },
            { x: 'Net profit', y: Math.max(profit, 0) },
        ] },
    ];
    const sheet = [
        { name: 'Liabilities', value: Math.max(0, n(stats.total_liabilities)) },
        { name: 'Equity', value: Math.max(0, n(stats.total_equity)) },
    ].filter((s) => s.value > 0);
    const owed = [
        { label: 'Receivables', value: n(stats.total_receivables), sub: 'Owed to you' },
        { label: 'Payables', value: n(stats.total_payables), sub: 'You owe' },
    ];

    const columns = [
        { key: 'date', label: 'Date', get: (e) => e.date, render: (e) => new Date(e.date).toLocaleDateString(), width: 120 },
        { key: 'description', label: 'Description', render: (e) => <span className="font-semibold text-ink">{e.description}</span> },
        { key: 'reference', label: 'Reference', get: (e) => e.reference || '-' },
        { key: 'amount', label: 'Amount', align: 'right', get: entryTotal, render: (e) => <span className="font-bold tabular-nums text-ink">{fmt(entryTotal(e))}</span> },
    ];

    const actions = [
        { label: 'Chart of Accounts', href: link('store.accounting.index') },
        { label: 'Profit & Loss', href: link('store.accounting.pnl') },
        { label: 'Balance Sheet', href: link('store.accounting.balance-sheet') },
    ];

    return (
        <ReportShell
            title="Accounting Dashboard"
            navGroups={moneyNavGroups}
            activeKey="accounting"
            activeMenu="Money"
            showHub={false}
            exportConfig={{
                filename: 'recent-journal-entries',
                columns: [{ label: 'Date', get: (e) => e.date }, { label: 'Description', get: (e) => e.description }, { label: 'Reference', get: (e) => e.reference }, { label: 'Amount', get: entryTotal }],
                rows: recentTransactions,
            }}
        >
            <ReportKpis items={[
                { label: 'Total assets', value: fmt(stats.total_assets), icon: DollarSign, tone: 'emerald' },
                { label: 'Total liabilities', value: fmt(stats.total_liabilities), icon: TrendingDown, tone: 'rose' },
                { label: 'Total equity', value: fmt(stats.total_equity), icon: PieChart, tone: 'blue' },
                { label: 'Net profit', value: fmt(profit), icon: TrendingUp, tone: profit >= 0 ? 'emerald' : 'rose', valueTone: profit >= 0 ? 'emerald' : 'rose', trend: profit >= 0 ? 'up' : 'down', sub: `Income: ${fmt(stats.total_income)}` },
                { label: 'Receivables', value: fmt(stats.total_receivables), icon: ArrowDownLeft, tone: 'brand' },
                { label: 'Payables', value: fmt(stats.total_payables), icon: ArrowUpRight, tone: 'amber' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Profit breakdown" subtitle="This month" icon={BarChart3} tone="emerald">
                        <TrendChart series={flowSeries} type="bar" height={260} legend={false} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Funding of assets" subtitle="Liabilities vs equity" icon={PieChart} tone="violet">
                        <DonutChart slices={sheet} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Recent transactions" icon={Activity} tone="brand" flush
                        right={<Link href={link('store.accounting.index')} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">Chart of accounts</Link>}>
                        <ReportTable columns={columns} rows={recentTransactions} rowKey={(e) => e.id} pageSize={10} empty="No recent transactions found" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <div className="flex flex-1 flex-col gap-2">
                        <ReportSection title="Owed to you vs by you" icon={ArrowDownLeft} tone="amber">
                            <RankBars items={owed} limit={2} colorIndex={1} />
                        </ReportSection>
                        <ReportSection title="Quick actions" icon={BookOpen} tone="blue" className="flex-1" bodyClassName="flex flex-col gap-2">
                            {actions.map((a) => (
                                <Link key={a.label} href={a.href} className="flex h-12 items-center justify-between rounded-[12px] border border-line bg-app px-4 text-sm font-semibold text-ink transition-colors hover:border-brand-300">
                                    <span>{a.label}</span><ArrowRight size={16} className="text-ink-muted" />
                                </Link>
                            ))}
                        </ReportSection>
                    </div>
                </ReportCol>
            </ReportGrid>
        </ReportShell>
    );
}
