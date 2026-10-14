import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { DollarSign, ShoppingBag, TrendingUp, Package } from 'lucide-react';
import SellModuleTabs, { useSellNavGroups } from '@/Components/SellModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, DateRangeFilter } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

function useIsDesktop() {
    const q = '(min-width: 768px)';
    const [on, setOn] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q).matches : true));
    useEffect(() => {
        const m = window.matchMedia(q);
        const h = () => setOn(m.matches);
        h();
        m.addEventListener('change', h);
        return () => m.removeEventListener('change', h);
    }, []);
    return on;
}


export default function SalesAnalytics({ revenue, counts, topProducts, chartData, period, periodTrend = [], byWeekday = [], byHour = [], byMethod = [], byCategory = [], topCustomers = [], periodTotals }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const sellNavGroups = useSellNavGroups();
    const isDesktop = useIsDesktop();

    if (isDesktop) {
        const money = (v) => formatCurrency(Number(v || 0), store);
        const rev = periodTrend.reduce((a, r) => a + Number(r.revenue || 0), 0);
        const prof = periodTrend.reduce((a, r) => a + Number(r.profit || 0), 0);
        const orders = periodTotals?.orders || 0;
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekday = days.map((d, i) => ({ x: d, y: Number(byWeekday.find((w) => Number(w.d) === i + 1)?.total || 0) }));
        const hours = Array.from({ length: 24 }, (_, h) => ({ x: `${String(h).padStart(2, '0')}:00`, y: Number(byHour.find((r) => Number(r.h) === h)?.total || 0) }));
        const methodLabel = (m) => String(m || 'Other').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
        const setRange = ({ from, to }) => router.get(window.location.pathname, { from, to }, { preserveState: true, preserveScroll: true, replace: true });
        return (
            <ReportShell title="Sales Analytics" navGroups={sellNavGroups} activeKey="analytics" activeMenu="Sell" showHub={false}
                filters={<DateRangeFilter from={period?.from} to={period?.to} onChange={setRange} />}>
                <ReportKpis items={[
                    { label: 'Revenue (period)', value: money(rev), icon: DollarSign, tone: 'emerald', valueTone: 'emerald', sub: `${orders} ${tt('Orders')}` },
                    { label: 'Profit (period)', value: money(prof), icon: TrendingUp, tone: 'amber', valueTone: prof < 0 ? 'rose' : undefined, sub: rev > 0 ? `${((prof / rev) * 100).toFixed(1)}% margin` : undefined },
                    { label: tt('Avg. Order Value'), value: money(orders ? (periodTotals?.total || 0) / orders : 0), icon: ShoppingBag, tone: 'blue', sub: 'Selected period' },
                    { label: "Today's revenue", value: money(revenue?.today), icon: DollarSign, tone: 'brand', sub: `${counts?.today || 0} sales today` },
                    { label: 'This week', value: money(revenue?.week), icon: TrendingUp, tone: 'sky', sub: `${counts?.week || 0} sales` },
                    { label: 'This month', value: money(revenue?.month), icon: ShoppingBag, tone: 'violet', sub: `${counts?.month || 0} sales` },
                    { label: 'Lifetime revenue', value: money(revenue?.total), icon: Package, tone: 'slate', sub: 'All time' },
                ]} />
                <ReportGrid>
                    <ReportCol span={8}>
                        <ReportSection title="Revenue & profit trend" subtitle="Daily, selected period" icon={TrendingUp} tone="emerald">
                            <TrendChart type="area" height={280} series={[
                                { name: 'Revenue', points: periodTrend.map((r) => ({ x: r.date, y: Number(r.revenue) })) },
                                { name: 'Profit', points: periodTrend.map((r) => ({ x: r.date, y: Number(r.profit) })) },
                            ]} />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={4}>
                        <ReportSection title="Sales by payment method" icon={DollarSign} tone="blue">
                            <DonutChart height={280} slices={byMethod.map((m) => ({ name: methodLabel(m.payment_method), value: Number(m.total || 0) }))} />
                        </ReportSection>
                    </ReportCol>
                </ReportGrid>
                <ReportGrid>
                    <ReportCol span={6}>
                        <ReportSection title="Sales by weekday" icon={TrendingUp} tone="sky">
                            <TrendChart type="bar" height={240} series={[{ name: 'Sales', points: weekday }]} />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={6}>
                        <ReportSection title="Sales by hour" subtitle="Server time, UTC" icon={TrendingUp} tone="violet">
                            <TrendChart type="bar" height={240} series={[{ name: 'Sales', points: hours }]} />
                        </ReportSection>
                    </ReportCol>
                </ReportGrid>
                <ReportGrid>
                    <ReportCol span={4}>
                        <ReportSection title="Sales by category" icon={Package} tone="amber">
                            <DonutChart height={260} slices={byCategory.map((c) => ({ name: c.name, value: Number(c.total || 0) }))} />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={4}>
                        <ReportSection title={tt('Top Selling Products')} subtitle="By units, lifetime" icon={Package} tone="amber">
                            <RankBars items={topProducts.map((i) => ({ label: i.product?.name || 'Item', value: Number(i.total_revenue || 0), sub: `${i.total_qty} units` }))} />
                        </ReportSection>
                    </ReportCol>
                    <ReportCol span={4}>
                        <ReportSection title="Top customers" subtitle="Selected period" icon={ShoppingBag} tone="violet">
                            <RankBars colorIndex={1} items={topCustomers.map((c) => ({ label: c.name, value: Number(c.total || 0), sub: `${c.orders} ${tt('Orders')}` }))} empty="No named customers in this period" />
                        </ReportSection>
                    </ReportCol>
                </ReportGrid>
                <ReportSection title="Daily detail" flush>
                    <ReportTable pageSize={31} rows={[...periodTrend].reverse()} rowKey={(r) => r.date} empty="No sales in this period"
                        columns={[
                            { key: 'date', label: 'Date', sortable: true },
                            { key: 'revenue', label: 'Revenue', align: 'right', sortable: true, render: (r) => money(r.revenue) },
                            { key: 'profit', label: 'Profit', align: 'right', sortable: true, render: (r) => money(r.profit) },
                        ]}
                        totals={{ revenue: money(rev), profit: money(prof) }} />
                </ReportSection>
            </ReportShell>
        );
    }

    return (
        <OneGlanceLayout title="Sales Analytics" activeMenu="Sell" noPadding>
            <Head title="Sales Analytics" />

            <ListPageFrame className="flex flex-col h-full p-1.5">
                <div className="md:hidden"><SellModuleTabs activeTab="analytics" /></div>
                <ListToolbar title="Sales Analytics" navGroups={sellNavGroups} activeId="analytics" />
                <ListStatCards cards={[
                    { label: "Today's Revenue", value: formatCurrency(revenue.today, store), icon: DollarSign, sub: `${counts.today} sales today` },
                    { label: 'This Week', value: formatCurrency(revenue.week, store), icon: TrendingUp, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', sub: `${counts.week} sales this week` },
                    { label: 'This Month', value: formatCurrency(revenue.month, store), icon: ShoppingBag, icon_tone: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', sub: `${counts.month} sales this month` },
                    { label: 'Total Revenue', value: formatCurrency(revenue.total, store), icon: Package, sub: 'Lifetime sales revenue' },
                ]} />

                <div className="pb-8 md:pb-1 md:flex-1 md:min-h-0 md:overflow-auto">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:hidden gap-6 mb-8">
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-ink-muted font-medium">Today's Revenue</p>
                                    <h3 className="text-2xl font-bold text-ink">{formatCurrency(revenue.today, store)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-ink-muted">
                                {counts.today} sales today
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-ink-muted font-medium">This Week</p>
                                    <h3 className="text-2xl font-bold text-ink">{formatCurrency(revenue.week, store)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-ink-muted">
                                {counts.week} sales this week
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-ink-muted font-medium">This Month</p>
                                    <h3 className="text-2xl font-bold text-ink">{formatCurrency(revenue.month, store)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-ink-muted">
                                {counts.month} sales this month
                            </div>
                        </div>

                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-ink-muted font-medium">Total Revenue</p>
                                    <h3 className="text-2xl font-bold text-ink">{formatCurrency(revenue.total, store)}</h3>
                                </div>
                            </div>
                            <div className="text-xs text-ink-muted">
                                Lifetime sales revenue
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart Section (Simplified Visualization) */}
                        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <h3 className="text-lg font-bold text-ink mb-6">Revenue Trend (Last 7 Days)</h3>
                            <div className="h-64 flex items-end justify-between gap-2">
                                {chartData.map((data, index) => {
                                    const maxRevenue = Math.max(...chartData.map(d => parseFloat(d.revenue)));
                                    const heightPercentage = maxRevenue > 0 ? (parseFloat(data.revenue) / maxRevenue) * 100 : 0;

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="relative w-full flex justify-center">
                                                <div
                                                    className="w-full max-w-[40px] bg-brand-500 rounded-t-lg transition-all duration-slower group-hover:bg-brand-600"
                                                    style={{ height: `${Math.max(heightPercentage, 2)}%` }} // Min height for visibility
                                                ></div>
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                                    {formatCurrency(data.revenue, store)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-ink-muted font-medium">{data.date}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-line">
                            <h3 className="text-lg font-bold text-ink mb-6">{tt('Top Selling Products')}</h3>
                            <div className="space-y-4">
                                {topProducts.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-sunken flex items-center justify-center text-lg font-bold text-ink-muted">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-ink truncate">{item.product.name}</p>
                                            <p className="text-xs text-ink-muted">{item.total_qty} units sold</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(item.total_revenue, store)}</p>
                                        </div>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <p className="text-center text-ink-muted py-4">No sales data yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
