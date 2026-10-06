import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BadgePercent, Bell, ChevronDown, ChevronRight, ExternalLink, Eye, LayoutDashboard, Package, QrCode, Settings2, ShoppingBag, Store } from 'lucide-react';
import { ORDER_ALERT_EVENT } from '@/Components/Commerce/OrderAlertWatcher';


/** Online Store sub-navigation + the alert state supplied by the global watcher. */
export default function StoreTabs({ active, urls, status, action }) {
    const [open, setOpen] = useState(false);
    const page = usePage();
    const { flash } = page.props;
    const storePrefix = page.url?.match(/^\/s\/[^/?#]+/)?.[0];
    const catalogueHref = urls?.catalogue || (storePrefix ? `${storePrefix}/online-store/catalogue` : null);
    const [alerts, setAlerts] = useState({ unread: 0, latest: [] });

    useEffect(() => {
        const update = (event) => setAlerts(event.detail || { unread: 0, latest: [] });
        window.addEventListener(ORDER_ALERT_EVENT, update);
        return () => window.removeEventListener(ORDER_ALERT_EVENT, update);
    }, []);

    const tabs = [
        ['home', 'Overview', urls?.home, LayoutDashboard],
        ['orders', 'Orders', urls?.orders, ShoppingBag],
        ['products', 'Products', urls?.products, Package],
        ['promotions', 'Offers', urls?.promotions, BadgePercent],
        ['catalogue', 'Onsite Catalogue', catalogueHref, QrCode],
        ['settings', 'Settings', urls?.settings, Settings2],
    ].filter(([, , href]) => !!href);
    const live = status === 'published';
    const latest = alerts.latest?.[0];
    const current = tabs.find(([k]) => k === active) || tabs[0];
    const CurIcon = current?.[3] || Store;
    // right-hand action: the page can pass one; otherwise open the public store
    const act = action || (urls?.public ? { label: live || !status ? 'View store' : 'Preview store', href: urls.public, external: true, icon: live || !status ? ExternalLink : Eye } : null);
    const ActIcon = act?.icon || ExternalLink;

    const Tag = act?.form ? 'button' : 'a';
    const tagProps = act?.form ? { type: 'submit', form: act.form, disabled: act.disabled } : { href: act?.href, target: act?.external ? '_blank' : undefined, rel: act?.external ? 'noopener noreferrer' : undefined };
    const actionBtn = act && (
        <Tag {...tagProps} onClick={act.onClick}
            className="relative h-full w-full lg:w-auto px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 overflow-hidden group shadow-xl disabled:opacity-60" style={{ color: '#fff' }}>
            <span className="absolute inset-0 bg-neutral-900 z-0" aria-hidden="true">
                <span className="absolute top-0 right-0 w-20 h-20 bg-brand-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-500/60 transition-colors" />
                <span className="absolute bottom-0 left-0 w-16 h-16 bg-brand-600/40 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" />
                <span className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60" />
            </span>
            <ActIcon size={16} strokeWidth={2.5} className="relative z-10" aria-hidden="true" />
            <span className="relative z-10">{act.label}</span>
        </Tag>
    );

    return (
        <div className="flex flex-col gap-1 shrink-0">
            <div className="flex flex-col lg:flex-row items-center gap-3 bg-surface border border-line p-2 rounded-2xl shadow-sm">
                {/* phone: current page + menu */}
                <div className="flex lg:hidden items-center justify-between w-full gap-2">
                    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
                        className="flex min-w-0 items-center gap-2 px-3 py-2 bg-sunken rounded-xl text-sm font-bold text-ink-secondary whitespace-nowrap">
                        <CurIcon size={16} className="text-brand-600" aria-hidden="true" />
                        <span className="truncate">{current?.[1]}</span>
                        {alerts.unread > 0 && <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-rose-600 text-white text-xs">{alerts.unread}</span>}
                        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {act && <div className="shrink-0 [&>*]:!px-3.5">{actionBtn}</div>}
                </div>

                <div className={`w-full lg:flex lg:flex-row lg:items-center lg:gap-3 ${open ? 'flex flex-col gap-2 mt-2 pt-2 border-t border-line' : 'hidden'}`}>
                    {/* level 1: module + live state */}
                    <div className="flex items-center gap-2 bg-sunken p-1.5 rounded-xl shrink-0">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-sunken text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                            <Store size={14} aria-hidden="true" />Online Store
                        </span>
                        {status && (
                            <span className={`inline-flex items-center gap-1.5 pr-2 text-xs font-bold ${live ? 'text-emerald-700 dark:text-emerald-300' : status === 'suspended' ? 'text-rose-700' : 'text-ink-muted'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} aria-hidden="true" />
                                {live ? 'Live' : status === 'suspended' ? 'Suspended' : 'Not live'}
                            </span>
                        )}
                    </div>
                    <div className="hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary" aria-hidden="true"><ChevronRight size={16} /></div>
                    {/* level 2: pages */}
                    <nav aria-label="Online Store" className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto flex-1">
                        {tabs.map(([key, label, href, Icon]) => (
                            <Link key={key} href={href} aria-current={active === key ? 'page' : undefined}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border whitespace-nowrap transition-all ${active === key
                                    ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 font-semibold'
                                    : 'bg-transparent border-transparent text-ink-secondary font-medium hover:bg-interactive-hover hover:border-line'}`}>
                                <Icon size={14} aria-hidden="true" />
                                {label}
                                {key === 'orders' && alerts.unread > 0 && <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-bold">{alerts.unread}</span>}
                            </Link>
                        ))}
                    </nav>
                    {act && <div className="hidden lg:flex shrink-0 self-stretch items-center">{actionBtn}</div>}
                </div>
            </div>
            {alerts.unread > 0 && latest && (
                <a href={latest.url} className="group flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 hover:border-amber-300 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                    <Bell size={15} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{latest.title}</span>
                    {alerts.unread > 1 && <span className="shrink-0 text-xs opacity-80">+{alerts.unread - 1} more</span>}
                    <ChevronRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
            )}
            {flash?.success && <output className="block rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-3 py-2 text-sm dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-200">{flash.success}</output>}
            {flash?.error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 px-3 py-2 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-200" role="alert">{flash.error}</div>}
            {flash?.info && <output className="block rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">{flash.info}</output>}
        </div>
    );
}
