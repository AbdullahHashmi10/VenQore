import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Card, Pager, StatusPill } from '@/Components/Commerce/ui';
import { METHOD_LABEL, PAYMENT_LABEL, money } from '@/lib/commerce';

const TABS = [['new', 'New'], ['active', 'Active'], ['completed', 'Completed'], ['closed', 'Cancelled / Rejected']];

export default function Orders({ tab, counts, orders, pagination, urls }) {
    return (
        <OneGlanceLayout title="Online Store" activeMenu="Marketing">
            <Head title="Online orders" />
            <h1 className="text-2xl font-bold text-ink mb-4">Online Store</h1>
            <StoreTabs active="orders" urls={urls} />
            <div className="flex flex-wrap gap-2 mb-4" role="tablist">
                {TABS.map(([k, l]) => (
                    <Link key={k} href={`${urls.orders}?tab=${k}`} role="tab" aria-selected={tab === k}
                        className={`px-3 py-2 rounded-xl text-sm font-medium ${tab === k ? 'bg-ink text-surface' : 'bg-sunken text-ink-secondary'}`}>
                        {l} <span className="opacity-70">({counts[k]})</span>
                    </Link>
                ))}
            </div>
            {orders.length === 0 ? <Card><p className="text-sm text-ink-muted">No orders here.</p></Card> : (
                <ul className="space-y-3">
                    {orders.map((o) => (
                        <li key={o.id}>
                            <Link href={o.show_url} className="block bg-surface border border-line rounded-2xl p-4 hover:bg-interactive-hover">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold">{o.public_number} · {o.customer_name}</span>
                                    <StatusPill status={o.status} />
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted mt-1">
                                    <span>{o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · {METHOD_LABEL[o.payment_method]} · {PAYMENT_LABEL[o.payment_status]}</span>
                                    <span className="font-semibold text-ink tabular-nums">{money(o.total, o.currency_symbol)}</span>
                                </div>
                                <div className="text-xs text-ink-muted mt-1">{o.created_at}{o.status === 'pending' && o.accept_by ? ` · accept by ${o.accept_by}` : ''}</div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
            <Pager current={pagination.current} last={pagination.last} onGo={(p) => router.get(urls.orders, { tab, page: p })} />
        </OneGlanceLayout>
    );
}
