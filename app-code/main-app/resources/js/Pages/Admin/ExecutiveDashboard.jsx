import React, { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import {
    TrendingUp, TrendingDown, Users, Package, AlertCircle, Clock, FileText, Activity,
    Receipt, ClipboardList, Wallet, Settings, Plus, Minus, Table2, PieChart as PieIcon, Trophy, Bell, CreditCard, Calendar,
} from 'lucide-react';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function AdminDashboard({
    stats = { net_profit: 0, total_revenue: 0, total_expenses: 0, active_staff: 0, total_staff: 0 },
    profitData = [],
    recentActivity = [],
    inventoryHealth = { healthy: 0, lowStock: 0, outOfStock: 0, lowStockCount: 0 },
    expenseData = [],
    paymentMethods = [],
    topProducts = [],
    staffPerformance = [],
}) {
    const { store } = usePage().props;
    const tt = useTermText();

    const trendSeries = useMemo(() => ([
        { name: 'Revenue', points: profitData.map((d) => ({ x: d.month, y: Number(d.revenue) || 0 })) },
        { name: 'Purchases', points: profitData.map((d) => ({ x: d.month, y: Number(d.purchases) || 0 })) },
        { name: 'Expenses', points: profitData.map((d) => ({ x: d.month, y: Number(d.expenses) || 0 })) },
    ]), [profitData]);

    const expenseSlices = useMemo(() => expenseData.filter((d) => Number(d.value) > 0).map((d) => ({ name: d.name, value: Number(d.value) })), [expenseData]);
    const paySlices = useMemo(() => paymentMethods.filter((d) => Number(d.value) > 0).map((d) => ({ name: d.name, value: Number(d.value) })), [paymentMethods]);
    const invSlices = useMemo(() => ([
        { name: 'Healthy', value: inventoryHealth.healthy ?? 0 },
        { name: 'Low', value: inventoryHealth.lowStock ?? 0 },
        { name: 'Out of stock', value: inventoryHealth.outOfStock ?? 0 },
    ].filter((s) => s.value > 0)), [inventoryHealth]);
    const productItems = useMemo(() => topProducts.map((p) => ({ label: p.name, value: Number(p.sales) || 0, sub: p.cat })), [topProducts]);
    const staffItems = useMemo(() => staffPerformance.map((s) => ({ label: s.name, value: Number(s.sales) || 0, sub: s.role })), [staffPerformance]);

    if (!store?.slug) return null;
    const r = (name, extra = {}) => route(name, { store_slug: store.slug, ...extra });

    const profitMarginPct = stats.total_revenue > 0 ? Math.round((stats.net_profit / stats.total_revenue) * 100) : 0;
    const lowCount = inventoryHealth.lowStockCount > 0 ? inventoryHealth.lowStockCount : 0;

    const activityCols = [
        { key: 'dir', label: '', width: 48, render: (a) => (
            <span className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${a.is_plus ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                {a.is_plus ? <Plus size={14} /> : <Minus size={14} />}
            </span>) },
        { key: 'title', label: 'Activity', render: (a) => <span className="font-semibold text-ink">{a.title}</span> },
        { key: 'time', label: 'When', render: (a) => <span className="inline-flex items-center gap-1 text-ink-muted"><Clock size={12} />{a.time}</span> },
        { key: 'amount', label: 'Amount', align: 'right', render: (a) => <span className={`font-mono font-bold ${a.is_plus ? 'text-emerald-600' : 'text-rose-600'}`}>{a.amount}</span> },
    ];

    const quick = [
        { label: 'Users', icon: Users, href: r('store.admin.users') },
        { label: 'Reports', icon: FileText, href: r('store.reports.index') },
        { label: 'Logs', icon: Activity, href: r('store.activity-log.index') },
        { label: 'Settings', icon: Settings, href: r('store.admin.settings') },
    ];

    return (
        <ReportShell
            title="Executive Dashboard"
            subtitle="Business overview"
            activeMenu="Administration"
            hideNav
            showHub={false}
            actions={(
                <Link href={r('store.admin.settings')} className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                    <Settings size={16} /><span className="hidden sm:inline">Settings</span>
                </Link>
            )}
        >
            <ReportKpis items={[
                { label: 'Net Balance', value: formatCurrency(stats.net_balance), icon: Wallet, tone: 'brand' },
                { label: "Today's In", value: formatCurrency(stats.today_in), icon: TrendingUp, tone: 'emerald', valueTone: 'emerald' },
                { label: "Today's Out", value: formatCurrency(stats.today_out), icon: TrendingDown, tone: 'rose' },
                { label: 'Net Profit', value: formatCurrency(stats.net_profit), sub: `${profitMarginPct}% margin`, icon: TrendingUp, tone: 'emerald' },
                { label: 'Pending Actions', value: lowCount, sub: lowCount > 0 ? 'Low stock - action needed' : 'All clear', icon: ClipboardList, tone: 'amber', href: r('store.reports.low-stock') },
                { label: 'Overdue', value: formatCurrency(stats.overdue_payments), sub: stats.overdue_payments > 0 ? 'Receivables outstanding' : 'On track', icon: Receipt, tone: 'violet', valueTone: stats.overdue_payments > 0 ? 'rose' : undefined },
                { label: tt('Active Staff'), value: `${stats.active_staff ?? 0} / ${stats.total_staff ?? 0}`, icon: Users, tone: 'sky' },
                { label: 'Last Backup', value: stats.last_backup || 'N/A', sub: 'System operational', icon: Calendar, tone: 'slate' },
            ]} />

            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Revenue, purchases and expenses" subtitle="Past 6 months" icon={TrendingUp} tone="brand">
                        <TrendChart series={trendSeries} type="area" height={300} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Inventory health" subtitle="Share of products" icon={Package} tone={inventoryHealth.outOfStock > 0 ? 'rose' : inventoryHealth.lowStock > 0 ? 'amber' : 'emerald'}>
                        <DonutChart slices={invSlices} unit="integer" height={300} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Payments" subtitle="Sales by payment method" icon={CreditCard} tone="sky">
                        <DonutChart slices={paySlices} unit="integer" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Expenses" subtitle="This month by account" icon={PieIcon} tone="rose">
                        <DonutChart slices={expenseSlices} height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Alerts" icon={Bell} tone="amber">
                        <div className="flex flex-col gap-2">
                            {inventoryHealth.lowStock > 0 && (
                                <div className="flex h-10 items-center gap-2 rounded-[12px] bg-amber-100 px-3 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Package size={16} />{inventoryHealth.lowStock}% inventory low</div>
                            )}
                            {inventoryHealth.outOfStock > 0 && (
                                <div className="flex h-10 items-center gap-2 rounded-[12px] bg-rose-100 px-3 text-sm font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><AlertCircle size={16} />{inventoryHealth.outOfStock}% out of stock</div>
                            )}
                            {inventoryHealth.lowStock === 0 && inventoryHealth.outOfStock === 0 && (
                                <div className="flex h-10 items-center gap-2 rounded-[12px] bg-emerald-100 px-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><TrendingUp size={16} />All systems good</div>
                            )}
                            <div className="flex h-10 items-center gap-2 rounded-[12px] bg-brand-50 px-3 text-sm font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">Profit: {formatCurrency(stats.net_profit)}</div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                {quick.map((q) => (
                                    <Link key={q.label} href={q.href} className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary transition-colors hover:bg-interactive-hover">
                                        <q.icon size={16} />{q.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </ReportSection>
                </ReportCol>
            </ReportGrid>

            {(productItems.length > 0 || staffItems.length > 0) && (
                <ReportGrid>
                    <ReportCol span={6}>
                        <ReportSection title="Top products" subtitle="By revenue" icon={Trophy} tone="amber">
                            <RankBars items={productItems} empty="No sales yet" />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={6}>
                        <ReportSection title="Top staff" subtitle="Sales this month" icon={Users} tone="violet">
                            <RankBars items={staffItems} colorIndex={3} empty="No staff sales yet" />
                        </ReportSection>
                    </ReportCol>
                </ReportGrid>
            )}

            <ReportSection title="Recent activity" subtitle="Cash movements" icon={Table2}
                right={<Link href={r('store.funds.index', { view: 'history' })} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">View all</Link>} flush>
                <ReportTable columns={activityCols} rows={recentActivity} rowKey={(a, i) => a.id ?? i} pageSize={10} empty="No recent activity" />
            </ReportSection>
        </ReportShell>
    );
}
