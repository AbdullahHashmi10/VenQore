import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, BarChart2, BookOpen, Layers, CheckCircle2, Landmark, Clock, PieChart } from 'lucide-react';

const n = (v) => parseFloat(v || 0) || 0;

export default function AccountantDashboard({
    cashPosition,
    receivables,
    payables,
    plSummary,
    recentJournalEntries,
    bankAccounts,
    cashAccounts,
    pendingJournalCount,
    plChartData,
}) {
    const { store } = usePage().props;
    const storeSlug = store?.slug;
    const fmt = (v) => formatCurrency(n(v), store);
    const go = (name) => () => router.visit(route(name, { store_slug: storeSlug }));

    const pl = plSummary || { income: 0, expense: 0, profit: 0 };
    const rx = receivables || { total: 0 };
    const py = payables || { total: 0 };
    const cp = cashPosition || { cash: 0, bank: 0, total: 0 };

    const months = plChartData ?? [];
    const series = [
        { name: 'Income', points: months.map((m) => ({ x: m.month, y: n(m.income) })) },
        { name: 'Expense', points: months.map((m) => ({ x: m.month, y: n(m.expense) })) },
    ];
    const slices = [
        { name: 'Cash', value: Math.max(0, n(cp.cash)) },
        { name: 'Bank', value: Math.max(0, n(cp.bank)) },
    ].filter((s) => s.value > 0);

    const agingOk = rx.available !== false && rx.overdue_30 != null;
    const aging = agingOk ? [
        { label: '0-30 days', value: n(rx.total) - n(rx.overdue_30) - n(rx.overdue_60) - n(rx.overdue_90) - n(rx.overdue_90plus) },
        { label: '31-60 days', value: n(rx.overdue_30) },
        { label: '61-90 days', value: n(rx.overdue_60) },
        { label: '90+ days', value: n(rx.overdue_90plus) },
    ] : [];
    const dueOk = py.available !== false && py.due_7 != null;
    const due = dueOk ? [
        { label: 'Due in 7 days', value: n(py.due_7) },
        { label: 'Due in 30 days', value: n(py.due_30) },
        { label: 'Overdue', value: n(py.overdue) },
    ] : [];

    const accounts = [...(bankAccounts ?? []), ...(cashAccounts ?? [])].map((a) => ({ label: a.name ?? a.bank_name ?? 'Account', value: n(a.current_balance) }));

    const columns = [
        { key: 'date', label: 'Date', width: 130 },
        { key: 'description', label: 'Description', render: (e) => <span className="font-semibold text-ink">{e.description ?? 'Journal Entry'}</span> },
        { key: 'amount', label: 'Amount', align: 'right', get: (e) => n(e.amount), render: (e) => <span className="font-bold tabular-nums text-ink">{fmt(e.amount)}</span> },
    ];

    const quick = [
        { label: 'P&L', icon: BarChart2, route: 'store.reports.profit-loss' },
        { label: 'Balance Sheet', icon: Layers, route: 'store.reports.balance-sheet' },
        { label: 'Journal', icon: BookOpen, route: 'store.finance.journal' },
        { label: 'Reconcile', icon: CheckCircle2, route: 'store.finance.accounts' },
    ];
    const actions = (
        <div className="hidden items-center gap-2 lg:flex">
            {quick.map((a) => (
                <button key={a.label} type="button" onClick={go(a.route)}
                    className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                    <a.icon size={16} className="text-brand-600" />{a.label}
                </button>
            ))}
        </div>
    );

    return (
        <ReportShell title="Finance Dashboard" subtitle={store?.name} hideNav activeMenu="Dashboard" showHub={false} actions={actions}>
            <ReportKpis items={[
                { label: 'Net cash position', value: fmt(cp.total), icon: DollarSign, tone: 'emerald', sub: `Cash ${fmt(cp.cash)} · Bank ${fmt(cp.bank)}`, href: route('store.finance.accounts', { store_slug: storeSlug }) },
                { label: 'Total receivables', value: fmt(rx.total), icon: ArrowDownLeft, tone: 'brand', sub: rx.overdue_30 > 0 ? `${fmt(rx.overdue_30)} overdue 30d+` : undefined, href: route('store.finance.receivables', { store_slug: storeSlug }) },
                { label: 'Total payables', value: fmt(py.total), icon: ArrowUpRight, tone: 'amber', sub: dueOk ? `Due in 7d: ${fmt(py.due_7)}` : undefined, href: route('store.finance.payables', { store_slug: storeSlug }) },
                { label: 'Net profit (month)', value: fmt(pl.profit), icon: TrendingUp, tone: n(pl.profit) >= 0 ? 'emerald' : 'rose', valueTone: n(pl.profit) >= 0 ? 'emerald' : 'rose', trend: n(pl.profit) >= 0 ? 'up' : 'down', sub: `Income ${fmt(pl.income)} · Exp ${fmt(pl.expense)}`, href: route('store.reports.profit-loss', { store_slug: storeSlug }) },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Income vs expense" subtitle="Last 6 months" icon={BarChart2} tone="emerald">
                        <TrendChart series={series} type="bar" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Cash vs bank" subtitle="Net cash position" icon={PieChart} tone="violet">
                        <DonutChart slices={slices} height={260} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Receivables aging" subtitle="Who owes and how overdue" icon={ArrowDownLeft} tone="brand">
                        <RankBars items={aging} limit={4} colorIndex={0} empty="Aging unavailable" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Payables due soon" icon={Clock} tone="amber">
                        <RankBars items={due} limit={3} colorIndex={1} empty="Aging unavailable" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Bank & cash accounts" icon={Landmark} tone="blue">
                        <RankBars items={accounts} limit={5} colorIndex={2} empty="No accounts configured" />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportSection title="Recent journal entries" icon={BookOpen} tone="brand" flush
                right={<>
                    {(pendingJournalCount ?? 0) > 0 ? <span className="rounded-[8px] bg-amber-100 px-2 py-1 text-xs font-bold text-amber-600">{pendingJournalCount} pending</span> : null}
                    <button type="button" onClick={go('store.finance.journal')} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">View all</button>
                </>}>
                <ReportTable columns={columns} rows={(recentJournalEntries ?? []).slice(0, 8)} pageSize={10} empty="No recent entries" />
            </ReportSection>
        </ReportShell>
    );
}
