import React, { useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import FohTopBar from '@/Foh/FohTopBar';
import { OverviewTab, TablesTab, LaneTab, kitchenDone } from '@/Foh/Tabs';
import { alertAge } from '@/Pos/Table/useTableService';
import { isLate } from '@/Pos/Table/Delivery';
import useFoh from '@/Foh/useFoh';
import useCatalog from '@/Foh/useCatalog';
import useFohCheckout from '@/Foh/useFohCheckout';
import { toast } from '@/Foh/useFoh';
import { formatCurrency } from '@/Utils/format';
import '@/Pos/Table/table.css';
import '@/Foh/foh.css';

/**
 * Front of house: one full-screen workspace for every order a restaurant takes
 * (tables, takeaway, delivery). It rides on the same Sale Core and table service
 * as the till; only the screen is new.
 */
export default function FohIndex({ tab, tabs, orderId, floorState, fohSettings, caps, bankAccounts, warehouses, settings }) {
    const { auth, store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
    const money = (v) => formatCurrency(v, store || settings);

    const { tables, enabledTypes } = useFoh({ storeSlug, floorState, fohSettings, tab, orderId });
    const catalog = useCatalog({ storeSlug });
    const user = auth?.user;
    const isPosStaff = Boolean(user && !user.is_owner && user.role !== 'owner' && (user.is_pos_staff || user.membership_type === 'pos' || user.role === 'pos_staff'));
    const checkout = useFohCheckout({ storeSlug, settings, warehouses, isPosStaff, tables, onToast: toast });

    const go = (t, card) => {
        const q = card?.occupancy_id ? { order: card.occupancy_id } : {};
        router.visit(route('store.foh', { store_slug: storeSlug, tab: t, ...q }), { preserveState: false });
    };
    const goto = (card) => go(card.kind === 'ticket' ? (card.order_type === 'delivery' ? 'delivery' : 'takeaway') : 'tables', card);

    const order = useMemo(() => ({
        tables, catalog, settings, storeSlug, caps, money, checkout, enabledTypes, bankAccounts, fohSettings, onToast: toast,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [tables, catalog, settings, storeSlug, caps, checkout, enabledTypes, bankAccounts, fohSettings]);

    const seated = tables.positions.filter((p) => p.occupancy_id);
    const take = tables.tickets.filter((t) => t.order_type === 'takeaway' && !t.collected_at);
    const del = tables.tickets.filter((t) => t.order_type === 'delivery' && !t.collected_at);
    const counts = { tables: seated.length, takeaway: take.length, delivery: del.length };
    const now = Date.now();
    const hot = (x) => alertAge(x, now) > 0 || x.customer_pending > 0 || x.state === 'check_dropped' || (x.paid_at && kitchenDone(x)) || isLate(x.delivery);
    const alerts = { tables: seated.filter(hot).length, takeaway: take.filter(hot).length, delivery: del.filter(hot).length };
    alerts.overview = alerts.tables + alerts.takeaway + alerts.delivery;

    /* Find an order by its code, table label, customer name or phone. Returns true when one was found. */
    const search = (q) => {
        const n = q.toLowerCase();
        const hit = [...tables.positions.filter((p) => p.occupancy_id), ...tables.tickets].find((c) =>
            [c.code, c.label, c.customer_name, c.phone].some((v) => v && String(v).toLowerCase().includes(n)));
        if (!hit) { toast('No open order matches that', 'warning'); return false; }
        goto(hit);
        return true;
    };

    return (
        <OneGlanceLayout title="Front of House" activeMenu="Dashboard" defaultCollapsed hideHeader noPadding>
            <Head title="Front of House" />
            <div className="foh-root">
                <FohTopBar
                    tabs={tabs} tab={tab} storeSlug={storeSlug} counts={{ ...counts, tables: `${counts.tables}/${tables.positions.length}`.replace(/^0\/0$/, '') }} alerts={alerts}
                    canManage={caps?.canManage} onSearch={search}
                    onTab={(t) => (t === tab ? tables.select(null) : go(t))}
                    onNew={() => window.dispatchEvent(new CustomEvent('foh:new'))}
                    onEscape={() => tables.select(null)}
                />
                <main className="foh-main">
                    {tab === 'overview' && <OverviewTab tables={tables} money={money} goto={goto} fohSettings={fohSettings} />}
                    {tab === 'tables' && <TablesTab tables={tables} order={order} money={money} storeSlug={storeSlug} canManage={caps?.canManage} />}
                    {tab === 'takeaway' && <LaneTab kind="takeaway" tables={tables} order={order} money={money} storeSlug={storeSlug} caps={caps} />}
                    {tab === 'delivery' && <LaneTab kind="delivery" tables={tables} order={order} money={money} storeSlug={storeSlug} caps={caps} />}
                </main>
            </div>
        </OneGlanceLayout>
    );
}
