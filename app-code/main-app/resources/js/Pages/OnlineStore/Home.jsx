import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, BadgePercent, Check, CheckCircle2, Clock, Copy, ExternalLink, Package, Rocket, ShoppingBag, Store, Timer, TrendingUp, Users, XCircle } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { Alert, Button, Card, CardTitle, EmptyState, StatCard, StatusPill, Switch } from '@/Components/Commerce/ui';
import { money } from '@/lib/commerce';

import { getCurrencySymbol } from '@/Utils/format';

const post = (url, data = {}) => router.post(url, data, { preserveScroll: true });

export default function Home({ insights, recent = [], store, problems, can_publish, counts, published_products, public_url, preview_url, qr_svg, urls }) {
    const { errors, settings } = usePage().props;
    const live = store.status === 'published';
    const sym = getCurrencySymbol(settings) || store.currency_symbol || 'Rs';
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard?.writeText(public_url); setCopied(true); setTimeout(() => setCopied(false), 1600); };
    const steps = [
        ['Business name, city, address and phone', !problems.some((p) => /name|country|address|phone/i.test(p))],
        ['Pickup or delivery, with a payment option', !problems.some((p) => /pickup|payment|bank/i.test(p))],
        ['Fulfilment warehouse chosen', !problems.some((p) => /warehouse/i.test(p))],
        ['At least one product published', !problems.some((p) => /product/i.test(p))],
    ];

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store">
            <Head title="Online Store" />
            <div className="flex flex-col min-h-full min-w-0 gap-6">
            <StoreTabs active="home" urls={{ ...urls, public: live ? public_url : (preview_url || public_url) }} status={store.status} />
            {errors?.store && <Alert kind="error">{errors.store}</Alert>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={AlertTriangle} tone="amber" label="Waiting" value={counts.pending} href={`${urls.orders}?tab=new`} valueClass={counts.pending ? 'text-amber-600' : 'text-ink'} />
                <StatCard icon={Timer} tone="sky" label="In progress" value={counts.active} href={`${urls.orders}?tab=active`} />
                <StatCard icon={CheckCircle2} tone="emerald" label="Completed" value={counts.completed} href={`${urls.orders}?tab=completed`} valueClass="text-emerald-600" />
                <StatCard icon={Package} tone="violet" label="Live items" value={published_products} href={urls.products} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    {/* status hero */}
                    <section className={`relative overflow-hidden rounded-xl border p-4 ${live ? 'border-brand-200 bg-gradient-to-br from-brand-600 to-brand-800 text-white' : 'border-line bg-surface'}`}>
                        {live && <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />}
                        <div className="relative flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${live ? 'bg-white/15' : 'bg-brand-50 text-brand-700'}`}>{live ? <Store size={22} /> : <Rocket size={22} />}</span>
                                <div>
                                    <h2 className="text-lg font-bold">{store.intake_paused ? 'Orders are paused' : live ? 'Your store is live' : 'Get your store online'}</h2>
                                    <p className={`text-sm mt-1 max-w-md ${live ? 'text-white/80' : 'text-ink-muted'}`}>
                                        {live ? 'Customers can browse and order. Orders arrive here and post to your normal sales and stock.' : 'Finish the checklist and publish. Online ordering is free and uses the stock and prices you already have.'}
                                    </p>
                                </div>
                            </div>
                            {live
                                ? <Button variant="secondary" className="!bg-white/15 !text-white !border-white/25 hover:!bg-white/25" onClick={() => post(urls.unpublish)}>Unpublish</Button>
                                : <Button disabled={!can_publish} onClick={() => post(urls.publish)}><Rocket size={16} />Publish store</Button>}
                        </div>
                        {live && (
                            <div className="relative mt-3 rounded-lg bg-white/10 px-3 py-0.5">
                                <Switch checked={store.intake_paused} onChange={(v) => post(urls.intake, { paused: v })}
                                    label={<span className="text-white">Pause new orders</span>}
                                    desc={<span className="text-white/75">Customers can still browse, but checkout is closed until you switch this off.</span>} />
                            </div>
                        )}
                        {store.status === 'suspended' && <div className="relative mt-4"><Alert kind="error">This store is suspended{store.suspended_reason ? `: ${store.suspended_reason}` : ''}. Contact VenQore support. Existing orders are preserved.</Alert></div>}
                        {!live && (
                            <ul className="relative mt-3 grid sm:grid-cols-2 gap-1">
                                {steps.map(([label, ok]) => (
                                    <li key={label} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' : 'border-line bg-sunken text-ink-secondary'}`}>
                                        {ok ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-ink-muted/40" aria-hidden="true" />}
                                        {label}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!live && problems.length > 0 && (
                            <div className="relative mt-3 text-xs text-ink-muted">
                                Still needed: {problems.join(' ')} <Link href={urls.settings} className="font-semibold text-brand-700 underline">Open settings</Link>
                            </div>
                        )}
                    </section>



                    <Card>
                        <CardTitle icon={ShoppingBag} title="Latest orders" sub="The five most recent online orders"
                            right={<Link href={urls.orders} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">All orders <ArrowRight size={14} /></Link>} />
                        {recent.length === 0 ? (
                            <div className="mt-4"><EmptyState icon={ShoppingBag} title="No orders yet" text={live ? 'Share your store link or QR code to get your first order.' : 'Publish your store to start taking orders.'} /></div>
                        ) : (
                            <ul className="mt-3 divide-y divide-line">
                                {recent.map((o) => (
                                    <li key={o.id}>
                                        <Link href={o.url} className="flex items-center gap-3 py-3 -mx-2 px-2 rounded-xl hover:bg-interactive-hover">
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-sm font-bold dark:bg-brand-900/30 dark:text-brand-300">{(o.name || '?').trim().charAt(0).toUpperCase()}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-ink truncate">{o.name} <span className="font-normal text-ink-muted">· {o.number}</span></span>
                                                <span className="block text-xs text-ink-muted">{o.at} · {o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</span>
                                            </span>
                                            <span className="hidden sm:inline-flex"><StatusPill status={o.status} /></span>
                                            <span className="hidden sm:block w-28 text-right text-sm font-semibold tabular-nums text-ink">{money(o.total, o.symbol)}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <div className="flex flex-col gap-1">
                    <Card>
                        <CardTitle icon={ExternalLink} title="Share your store" sub={live ? 'Print the QR code or send the link' : 'Preview it privately before publishing'} />
                        <div className="mx-auto mt-3 w-40 rounded-xl border border-line bg-white p-3 shadow-sm">
                            <img className="w-full" alt="QR code for your store link" src={`data:image/svg+xml;utf8,${encodeURIComponent(qr_svg || '')}`} />
                        </div>
                        <p className="mt-3 text-center rounded-xl bg-sunken px-3 py-2 text-xs text-ink-secondary break-all font-mono">{public_url}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button variant="secondary" onClick={copy}>{copied ? <><Check size={16} />Copied</> : <><Copy size={16} />Copy link</>}</Button>
                            <a className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700" href={live ? public_url : (preview_url || public_url)} target="_blank" rel="noopener noreferrer">
                                {live ? 'Open store' : 'Preview'} <ExternalLink size={14} />
                            </a>
                        </div>
                        {!live && <p className="mt-2 text-xs text-ink-muted">The preview link works for 24 hours and only you can use it.</p>}
                    </Card>
                    <Card>
                        <CardTitle icon={BadgePercent} tone="rose" title="Grow sales" />
                        <ul className="mt-3 space-y-2 text-sm">
                            <li><Link href={urls.promotions} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-interactive-hover"><span>Run an offer or coupon</span><ArrowRight size={14} /></Link></li>
                            <li><Link href={urls.products} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-interactive-hover"><span>Feature your best products</span><ArrowRight size={14} /></Link></li>
                            <li><Link href={urls.settings} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-interactive-hover"><span>Add a banner and announcement</span><ArrowRight size={14} /></Link></li>
                        </ul>
                    </Card>
                </div>
            </div>

            {insights && (
                <section className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm">
                        <h2 className="text-xs font-bold uppercase text-ink">Last {insights.days} days <span className="text-brand-600">performance</span></h2><p className="text-xs text-ink-muted">Read-only. Never changes your books.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                        <StatCard icon={TrendingUp} tone="emerald" label="Online sales" value={money(insights.sales, sym)} hint={`${insights.completed} of ${insights.placed} completed`} valueClass="text-emerald-600" />
                        <StatCard icon={BadgePercent} tone="rose" label="Discounts given" value={money(insights.discounts, sym)} />
                        <StatCard icon={Clock} tone="sky" label="Avg. time to accept" value={insights.avg_accept_minutes == null ? '—' : `${insights.avg_accept_minutes} min`} hint={insights.avg_complete_minutes == null ? null : `${insights.avg_complete_minutes} min to complete`} />
                        <StatCard icon={Users} tone="violet" label="Repeat customers" value={insights.customers ? `${insights.repeat_customers} / ${insights.customers}` : '—'} hint={<span className="inline-flex items-center gap-1"><XCircle size={12} />{insights.rejected + insights.expired} declined or expired</span>} />
                    </div>
                </section>
            )}
            </div>
        </OneGlanceLayout>
    );
}
