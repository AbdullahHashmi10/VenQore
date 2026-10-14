import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, BadgePercent, Check, CheckCircle2, Clock, Copy, ExternalLink, Package, Rocket, ShoppingBag, Store, Timer, TrendingUp, Users, XCircle } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StoreTabs from '@/Components/Commerce/StoreTabs';
import { ListPageFrame, ListStatCards } from '@/Components/ListShell';
import { Alert, Button, Card, CardTitle, EmptyState, StatCard, StatusPill, Switch } from '@/Components/Commerce/ui';
import { money } from '@/lib/commerce';

import { getCurrencySymbol } from '@/Utils/format';

const post = (url, data = {}) => router.post(url, data, { preserveScroll: true });

export default function Home({ insights, recent = [], store, problems, can_publish, counts, published_products, sourcing = { products: [], orders: [] }, public_url, preview_url, qr_svg, urls }) {
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

    const amber = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    const sky = 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400';
    const emerald = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
    const violet = 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400';
    const cards = [
        { label: 'Waiting', value: counts.pending, icon: AlertTriangle, icon_tone: amber, value_tone: counts.pending ? 'text-amber-600' : 'text-ink', href: `${urls.orders}?tab=new` },
        { label: 'In progress', value: counts.active, icon: Timer, icon_tone: sky, href: `${urls.orders}?tab=active` },
        { label: 'Completed', value: counts.completed, icon: CheckCircle2, icon_tone: emerald, value_tone: 'text-emerald-600', href: `${urls.orders}?tab=completed` },
        insights
            ? { label: `Online sales, ${insights.days} days`, value: money(insights.sales, sym), icon: TrendingUp, icon_tone: emerald, value_tone: 'text-emerald-600', href: urls.orders }
            : { label: 'Live items', value: published_products, icon: Package, icon_tone: violet, href: urls.products },
    ];
    const kv = insights ? [
        ['Sales', money(insights.sales, sym)],
        ['Completed of placed', `${insights.completed} of ${insights.placed}`],
        ['Discounts given', money(insights.discounts, sym)],
        ['Avg. time to accept', insights.avg_accept_minutes == null ? '—' : `${insights.avg_accept_minutes} min`],
        ['Avg. time to complete', insights.avg_complete_minutes == null ? '—' : `${insights.avg_complete_minutes} min`],
        ['Repeat customers', insights.customers ? `${insights.repeat_customers} / ${insights.customers}` : '—'],
        ['Declined or expired', `${insights.rejected + insights.expired}`],
    ] : [];
    const linkRow = 'flex h-10 items-center justify-between rounded-[12px] px-3 text-sm hover:bg-interactive-hover';

    return (
        <OneGlanceLayout title="Online Store" activeMenu="Online Store" noPadding>
            <Head title="Online Store" />
            <ListPageFrame className="min-w-0 bg-app max-md:flex max-md:flex-col max-md:gap-2 max-md:p-2">
                {sourcing.products.length > 0 && (
                    <section className="shrink-0 rounded-[14px] border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2" role="alert">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-ink">Needs sourcing: {sourcing.products.length} item{sourcing.products.length === 1 ? '' : 's'} not in stock</h2>
                                    <p className="text-xs text-ink-muted">
                                        Customers ordered these but you do not have enough on the shelf. Get them (purchase or pick up), then complete the order{sourcing.orders.length ? `s (${sourcing.orders.length} affected)` : ''}.
                                    </p>
                                    <ul className="mt-1 text-sm text-ink flex flex-col">
                                        {sourcing.products.slice(0, 6).map((x) => (
                                            <li key={x.product_id}><strong>{x.title}</strong>: need {x.to_source} more (ordered {x.ordered}, have {x.on_hand})</li>
                                        ))}
                                        {sourcing.products.length > 6 && <li className="text-ink-muted">and {sourcing.products.length - 6} more</li>}
                                    </ul>
                                </div>
                            </div>
                            <Link href={urls.orders} className="inline-flex items-center gap-1 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:underline">View orders <ArrowRight size={14} /></Link>
                        </div>
                    </section>
                )}

                <StoreTabs active="home" urls={{ ...urls, public: live ? public_url : (preview_url || public_url) }} status={store.status} />

                {errors?.store && <Alert kind="error">{errors.store}</Alert>}

                <ListStatCards cards={cards} />
                <div className="grid grid-cols-2 gap-2 md:hidden">
                    <StatCard icon={AlertTriangle} tone="amber" label="Waiting" value={counts.pending} href={`${urls.orders}?tab=new`} valueClass={counts.pending ? 'text-amber-600' : 'text-ink'} />
                    <StatCard icon={Timer} tone="sky" label="In progress" value={counts.active} href={`${urls.orders}?tab=active`} />
                    <StatCard icon={CheckCircle2} tone="emerald" label="Completed" value={counts.completed} href={`${urls.orders}?tab=completed`} valueClass="text-emerald-600" />
                    <StatCard icon={Package} tone="violet" label="Live items" value={published_products} href={urls.products} />
                </div>

                <div className="flex flex-col gap-2 [&>*]:min-w-0 md:grid md:grid-cols-3 md:flex-1 md:min-h-0">
                    {/* LEFT: hero, latest orders */}
                    <section className="order-2 md:order-1 md:col-span-2 md:min-h-0 flex flex-col rounded-[14px] border border-line bg-surface shadow-sm overflow-hidden">
                        <div className="h-14 shrink-0 flex items-center gap-3 px-3 border-b border-line">
                            <span className="h-8 w-8 shrink-0 rounded-[12px] flex items-center justify-center bg-brand-50 text-brand-600 dark:bg-brand-900/30"><ShoppingBag size={16} /></span>
                            <div className="flex-1 min-w-0">
                                <h2 className="truncate text-sm font-bold text-ink">Latest orders</h2>
                                <p className="truncate text-xs text-ink-muted">The ten most recent online orders</p>
                            </div>
                            <Link href={urls.orders} className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-700 hover:underline">All online orders <ArrowRight size={14} /></Link>
                        </div>
                        {recent.length === 0 ? (
                            <div className="p-3 md:flex-1"><EmptyState icon={ShoppingBag} title="No orders yet" text={live ? 'Share your store link or QR code to get your first order.' : 'Publish your store to start taking orders.'} /></div>
                        ) : (
                            <>
                                <ul className="md:hidden divide-y divide-line px-3">
                                    {recent.map((o) => (
                                        <li key={o.id}>
                                            <Link href={o.url} className="flex items-center gap-3 py-3">
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
                                <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-app sticky top-0 z-10">
                                            <tr className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                                <th className="p-4 whitespace-nowrap">Order #</th>
                                                <th className="p-4 whitespace-nowrap">Customer</th>
                                                <th className="p-4 whitespace-nowrap">Type</th>
                                                <th className="p-4 whitespace-nowrap">Status</th>
                                                <th className="p-4 whitespace-nowrap">Time</th>
                                                <th className="p-4 whitespace-nowrap text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line">
                                            {recent.map((o) => (
                                                <tr key={o.id} onClick={() => router.visit(o.url)} className={`h-14 border-l-4 ${o.status === 'pending' ? 'border-amber-400' : 'border-transparent'} hover:border-brand-400 hover:bg-interactive-hover cursor-pointer transition-colors`}>
                                                    <td className="p-4 text-sm font-semibold text-ink whitespace-nowrap">{o.number}</td>
                                                    <td className="p-4 text-sm text-ink max-w-[14rem] truncate whitespace-nowrap">{o.name}</td>
                                                    <td className="p-4 text-sm text-ink-secondary whitespace-nowrap">{o.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</td>
                                                    <td className="p-4 whitespace-nowrap"><StatusPill status={o.status} /></td>
                                                    <td className="p-4 text-sm text-ink-muted whitespace-nowrap">{o.at}</td>
                                                    <td className="p-4 text-sm font-semibold tabular-nums text-ink text-right whitespace-nowrap">{money(o.total, o.symbol)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </section>

                    {/* RIGHT */}
                    <div className="order-1 md:order-2 md:col-span-1 md:min-h-0 md:overflow-auto flex flex-col gap-2 [&>*]:shrink-0">
                        <section className={`relative overflow-hidden rounded-[14px] border p-3 ${live ? 'border-brand-200 bg-gradient-to-br from-brand-600 to-brand-800 text-white' : 'border-line bg-surface shadow-sm'}`}>
                            {live && <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />}
                            <div className="relative flex items-center gap-3">
                                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] ${live ? 'bg-white/15' : 'bg-brand-50 text-brand-700'}`}>{live ? <Store size={16} /> : <Rocket size={16} />}</span>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-sm font-bold truncate">{store.intake_paused ? 'Orders are paused' : live ? 'Your store is live' : 'Get your store online'}</h2>
                                    <p className={`text-xs ${live ? 'text-white/80' : 'text-ink-muted'}`}>
                                        {live ? 'Customers can browse and order.' : 'Finish the checklist, then publish. Online ordering is free.'}
                                    </p>
                                </div>
                                {live
                                    ? <Button variant="secondary" className="h-10 !rounded-[12px] !bg-white/15 !text-white !border-white/25 hover:!bg-white/25" onClick={() => post(urls.unpublish)}>Unpublish</Button>
                                    : <Button className="h-10 !rounded-[12px]" disabled={!can_publish} onClick={() => post(urls.publish)}><Rocket size={16} />Publish</Button>}
                            </div>
                            {live && (
                                <div className="relative mt-2 rounded-[12px] bg-white/10 px-3 py-0.5">
                                    <Switch checked={store.intake_paused} onChange={(v) => post(urls.intake, { paused: v })}
                                        label={<span className="text-white">Pause new orders</span>}
                                        desc={<span className="text-white/75">Customers can still browse, but checkout is closed.</span>} />
                                </div>
                            )}
                            {store.status === 'suspended' && <div className="relative mt-2"><Alert kind="error">This store is suspended{store.suspended_reason ? `: ${store.suspended_reason}` : ''}. Contact VenQore support. Existing orders are preserved.</Alert></div>}
                            {!live && (
                                <ul className="relative mt-2 flex flex-col gap-2">
                                    {steps.map(([label, ok]) => (
                                        <li key={label} className={`flex h-10 items-center gap-2 rounded-[12px] border px-3 text-sm ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200' : 'border-line bg-sunken text-ink-secondary'}`}>
                                            {ok ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border-2 border-ink-muted/40" aria-hidden="true" />}
                                            <span className="truncate">{label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {!live && problems.length > 0 && (
                                <div className="relative mt-2 text-xs text-ink-muted">
                                    Still needed: {problems.join(' ')} <Link href={urls.settings} className="font-semibold text-brand-700 underline">Open settings</Link>
                                </div>
                            )}
                        </section>

                        <Card>
                            <CardTitle icon={ExternalLink} title="Share your store" sub={live ? 'Print the QR code or send the link' : 'Preview it privately before publishing'} />
                            <div className="mx-auto mt-2 w-32 rounded-[12px] border border-line bg-white p-2 shadow-sm">
                                <img className="w-full" alt="QR code for your store link" src={`data:image/svg+xml;utf8,${encodeURIComponent(qr_svg || '')}`} />
                            </div>
                            <p className="mt-2 text-center rounded-[12px] bg-sunken px-3 py-2 text-xs text-ink-secondary break-all font-mono">{public_url}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <Button variant="secondary" className="h-10 !rounded-[12px]" onClick={copy}>{copied ? <><Check size={16} />Copied</> : <><Copy size={16} />Copy link</>}</Button>
                                <a className="inline-flex h-10 items-center justify-center gap-2 px-4 rounded-[12px] text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700" href={live ? public_url : (preview_url || public_url)} target="_blank" rel="noopener noreferrer">
                                    {live ? 'Open store' : 'Preview'} <ExternalLink size={14} />
                                </a>
                            </div>
                            {!live && <p className="mt-2 text-xs text-ink-muted">The preview link works for 24 hours and only you can use it.</p>}
                        </Card>

                        {insights && (
                            <Card>
                                <CardTitle icon={TrendingUp} tone="emerald" title={`Last ${insights.days} days`} sub="Read-only. Never changes your books." />
                                <dl className="mt-2 divide-y divide-line">
                                    {kv.map(([k, v]) => (
                                        <div key={k} className="flex h-10 items-center justify-between gap-2 text-sm">
                                            <dt className="text-ink-muted truncate">{k}</dt>
                                            <dd className="font-semibold tabular-nums text-ink whitespace-nowrap">{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </Card>
                        )}

                        <Card>
                            <CardTitle icon={BadgePercent} tone="rose" title="Grow sales" />
                            <ul className="mt-2 flex flex-col gap-2 text-sm">
                                <li><Link href={urls.promotions} className={linkRow}><span>Run an offer or coupon</span><ArrowRight size={14} /></Link></li>
                                <li><Link href={urls.products} className={linkRow}><span>Feature your best products</span><ArrowRight size={14} /></Link></li>
                                <li><Link href={urls.settings} className={linkRow}><span>Add a banner and announcement</span><ArrowRight size={14} /></Link></li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
