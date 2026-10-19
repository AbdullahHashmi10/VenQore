import React from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    ShoppingBag, Calendar, TrendingUp, TrendingDown, Clock, Users, UserPlus, ArrowDownToLine, ArrowUpFromLine,
    Wallet, Receipt, Truck, Package, ArrowRight, LayoutDashboard,
} from 'lucide-react';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { usePurchaseNavGroups } from '@/Components/PurchaseModuleTabs';
import { useContactsNavGroups } from '@/Components/ContactsModuleTabs';
import { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { formatCurrency } from '@/Utils/format';

/**
 * One overview page for Purchase, Contacts and Money.
 * The server sends a plain description (`dash`): headline numbers, one trend,
 * one breakdown, two rankings and recent activity. This file only draws it.
 */
const ICONS = { ShoppingBag, Calendar, TrendingUp, TrendingDown, Clock, Users, UserPlus, ArrowDownToLine, ArrowUpFromLine, Wallet, Receipt, Truck, Package, LayoutDashboard };

const STATUS = {
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'out for delivery': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};
const STATUS_BAD = 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';

function useNav(module) {
    const p = usePurchaseNavGroups();
    const c = useContactsNavGroups();
    const m = useMoneyNavGroups();
    const { store } = usePage().props;
    if (module === 'restaurant') {
        const r = (n) => { try { return route(n, { store_slug: store?.slug }); } catch (e) { return '#'; } };
        return [{ id: 'restaurant', label: 'Restaurant', icon: ShoppingBag, items: [
            { id: 'overview', label: 'Dashboard', href: r('store.restaurant.overview'), icon: LayoutDashboard },
            { id: 'foh', label: 'FOH', href: r('store.foh'), icon: Users },
            { id: 'kitchen', label: 'Kitchen', href: r('store.restaurant.kitchen'), icon: Package },
            { id: 'plan', label: 'Floor plan', href: r('store.tables.plan'), icon: Wallet },
        ] }];
    }
    if (module === 'online') {
        const r = (n) => { try { return route(`store.commerce.${n}`, { store_slug: store?.slug }); } catch (e) { return '#'; } };
        return [{ id: 'online', label: 'Online Store', icon: ShoppingBag, items: [
            { id: 'overview', label: 'Dashboard', href: r('dashboard'), icon: LayoutDashboard },
            { id: 'home', label: 'Store overview', href: r('home'), icon: Package },
            { id: 'orders', label: 'Orders', href: r('orders'), icon: Receipt },
            { id: 'products', label: 'Products', href: r('products'), icon: Package },
            { id: 'promotions', label: 'Offers & coupons', href: r('promotions'), icon: Wallet },
            { id: 'settings', label: 'Settings', href: r('settings'), icon: Clock },
        ] }];
    }
    return module === 'purchase' ? p : module === 'contacts' ? c : m;
}

export default function ModuleDashboard({ dash }) {
    const { store } = usePage().props;
    const nav = useNav(dash.module);
    const money = (v) => formatCurrency(Number(v || 0), store);
    const unitOf = (flag) => (flag ? 'integer' : 'currency');

    const kpis = (dash.kpis || []).map((k) => ({
        label: k.label,
        value: k.kind === 'count' ? Number(k.value || 0).toLocaleString() : money(k.value),
        icon: ICONS[k.icon],
        tone: k.tone,
        valueTone: k.valueTone || undefined,
        sub: k.growth ? `${k.sub ? k.sub + ' · ' : ''}${Math.abs(k.growth)}% ${k.growthLabel || ''}`.trim() : k.sub,
        trend: k.growth > 0 ? 'up' : k.growth < 0 ? 'down' : undefined,
    }));

    const cell = (col, row) => {
        const v = row.cells[col.key];
        if (col.kind === 'money') return <span className="font-bold text-ink">{money(v)}</span>;
        if (col.kind === 'link') return <span className="font-bold text-brand-600 dark:text-brand-400">{v}</span>;
        if (col.kind === 'status') {
            return <span className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-bold uppercase ${STATUS[String(v).toLowerCase()] || STATUS_BAD}`}>{v || 'unpaid'}</span>;
        }
        if (col.kind === 'direction') {
            return <span className={`inline-flex rounded-full px-2 py-0.5 text-2xs font-bold uppercase ${v === 'In' ? STATUS.paid : STATUS.partial}`}>{v}</span>;
        }
        return v;
    };

    const rank = (r, idx) => (
        <ReportSection title={r.title} subtitle={r.subtitle} icon={ICONS[r.icon] || Users} tone={idx ? 'violet' : 'amber'}>
            <RankBars colorIndex={idx} items={r.items || []} unit={unitOf(!r.money)} empty={r.empty} />
        </ReportSection>
    );

    const rec = dash.recent || {};
    return (
        <ReportShell title={dash.title} navGroups={nav} activeKey="overview" activeMenu={dash.activeMenu} showHub={false}>
            <ReportKpis items={kpis} />
            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title={dash.trend.title} subtitle={dash.trend.subtitle} icon={TrendingUp} tone="emerald">
                        <TrendChart type="area" height={280} unit={unitOf(dash.trend.count)} series={dash.trend.series} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title={dash.donut.title} subtitle={dash.donut.subtitle} icon={Wallet} tone="blue">
                        <DonutChart height={280} unit={unitOf(dash.donut.count)} slices={dash.donut.slices || []} />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportGrid>
                <ReportCol span={6}>{rank(dash.rankA, 0)}</ReportCol>
                <ReportCol span={6}>{rank(dash.rankB, 1)}</ReportCol>
            </ReportGrid>
            <ReportSection title={rec.title} icon={Clock} tone="brand" flush
                right={rec.viewAll ? <Link href={rec.viewAll} className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary hover:bg-interactive-hover">View all <ArrowRight size={14} /></Link> : null}>
                <ReportTable
                    rows={rec.rows || []}
                    rowKey={(r) => r.id}
                    onRowClick={(r) => { if (r.href) router.visit(r.href); }}
                    empty={rec.empty}
                    columns={(rec.columns || []).map((c) => ({ key: c.key, label: c.label, align: c.align, render: (r) => cell(c, r) }))}
                />
            </ReportSection>
        </ReportShell>
    );
}
