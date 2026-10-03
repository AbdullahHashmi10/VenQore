import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Bike, ChevronRight, Clock, Inbox, Search, Store as StoreIcon, X } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { EmptyState, Pager, StatusPill } from '@/Components/Commerce/ui';
import { METHOD_LABEL, PAYMENT_LABEL, money } from '@/lib/commerce';
import { ORDER_ALERT_EVENT } from '@/Components/Commerce/OrderAlertWatcher';

const TABS = [
    ['all', 'All'],
    ['new', 'New'],
    ['active', 'In progress'],
    ['completed', 'Completed'],
    ['closed', 'Cancelled / declined'],
];

const EMPTY = {
    all: ['No orders found', 'Online orders placed by customers will appear here.'],
    new: ['No new orders', 'New online orders appear here, with a sound, as soon as customers place them.'],
    active: ['Nothing in progress', 'Accepted orders show here until you hand them over.'],
    completed: ['No completed orders yet', 'Completed orders are posted as normal sales.'],
    closed: ['Nothing cancelled', 'Declined, cancelled and expired orders show here.'],
};

/** Minutes left to accept, refreshed every 30 s. */
function useNow() {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
    return now;
}

function Deadline({ iso, now }) {
    if (!iso) return null;
    const mins = Math.round((new Date(iso).getTime() - now) / 60000);
    const tone = mins <= 10 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' : mins <= 30 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-sunken text-ink-secondary';
    const text = mins <= 0 ? 'Expiring now' : mins < 60 ? `${mins} min to accept` : `${Math.floor(mins / 60)} h ${mins % 60} min to accept`;
    return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}><Clock size={12} aria-hidden="true" />{text}</span>;
}

export default function Orders({ tab = 'all', counts = {}, orders = [], pagination, filters = {}, urls }) {
    const now = useNow();
    const [search, setSearch] = useState(filters.q || '');

    useEffect(() => {
        const refreshForNewOrder = (event) => {
            if (!event.detail?.changed) return;
            router.reload({
                only: ['counts', 'orders', 'pagination'],
                preserveState: true,
                preserveScroll: true,
            });
        };
        window.addEventListener(ORDER_ALERT_EVENT, refreshForNewOrder);
        return () => window.removeEventListener(ORDER_ALERT_EVENT, refreshForNewOrder);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(urls.orders, { tab, q: search.trim() || undefined }, { preserveState: true, preserveScroll: true });
    };

    const clearSearch = () => {
        setSearch('');
        router.get(urls.orders, { tab }, { preserveState: true, preserveScroll: true });
    };

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Online orders" />
            <div className="flex flex-col min-h-full min-w-0 bg-app p-1 md:p-2 gap-2">
            <StoreTabs active="orders" urls={urls} />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface p-1.5 rounded-2xl border border-line shadow-sm">
                <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Order status">
                    {TABS.map(([k, l]) => (
                        <Link key={k} href={`${urls.orders}?tab=${k}${search ? `&q=${encodeURIComponent(search)}` : ''}`} role="tab" aria-selected={tab === k}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${tab === k ? 'bg-brand-50 border-brand-200 text-brand-700 font-semibold dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400' : 'bg-transparent text-ink-secondary border-transparent hover:border-line'}`}>
                            {l}
                            <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 text-xs font-bold ${tab === k ? 'bg-brand-100 dark:bg-brand-500/20' : k === 'new' && counts[k] ? 'bg-rose-600 text-white' : 'bg-sunken'}`}>{counts[k] ?? 0}</span>
                        </Link>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="relative flex items-center min-w-[200px] sm:w-64">
                    <Search size={14} className="absolute left-3 text-ink-muted pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search orders, phone, ref…"
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface-2 border border-line rounded-xl text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-2 text-ink-muted hover:text-ink"
                            aria-label="Clear search"
                        >
                            <X size={12} />
                        </button>
                    )}
                </form>
            </div>
            {orders.length === 0 ? <EmptyState icon={Inbox} title={EMPTY[tab][0]} text={EMPTY[tab][1]} /> : (
                <ul className="flex flex-col gap-1">
                    {orders.map((o) => (
                        <li key={o.id}>
                            <Link href={o.show_url} className={`group flex items-center gap-3 rounded-xl border bg-surface px-3 py-2.5 shadow-sm transition-all hover:shadow-md hover:border-brand-300 ${o.status === 'pending' ? 'border-amber-300 dark:border-amber-700' : 'border-line'}`}>
                                <span className={`hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${o.fulfilment === 'delivery' ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'}`} title={o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}>
                                    {o.fulfilment === 'delivery' ? <Bike size={20} aria-hidden="true" /> : <StoreIcon size={20} aria-hidden="true" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-baseline justify-between gap-2 sm:hidden">
                                        <span className="font-semibold text-ink truncate">{o.customer_name}</span>
                                        <span className="font-bold text-ink tabular-nums whitespace-nowrap">{money(o.total, o.currency_symbol)}</span>
                                    </span>
                                    <span className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                                        <span className="hidden sm:inline font-semibold text-ink">{o.customer_name}</span>
                                        <span className="text-sm text-ink-muted">{o.public_number}</span>
                                        <StatusPill status={o.status} />
                                        {o.status === 'pending' && <Deadline iso={o.accept_by_iso} now={now} />}
                                    </span>
                                    <span className="mt-1 block text-sm text-ink-muted sm:truncate">
                                        {o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · {METHOD_LABEL[o.payment_method]} · <span className={o.payment_status === 'collected' ? 'text-emerald-700 dark:text-emerald-300 font-medium' : ''}>{PAYMENT_LABEL[o.payment_status]}</span> · {o.created_at}
                                    </span>
                                </span>
                                <span className="hidden sm:block text-right">
                                    <span className="block font-bold text-ink tabular-nums">{money(o.total, o.currency_symbol)}</span>
                                </span>
                                <ChevronRight size={18} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pager current={pagination.current} last={pagination.last} onGo={(p) => router.get(urls.orders, { tab, page: p })} />
            </div>
        </OneGlanceLayout>
    );
}
