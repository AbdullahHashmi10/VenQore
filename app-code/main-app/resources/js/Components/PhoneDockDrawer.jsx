import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronDown, ChevronRight, Lock, Monitor, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { useNavLabel, useTermText } from '@/lib/terms';
import { SubIcon } from '@/lib/navIcons';
import { resolveLink } from '@/Components/DockNav';

/*
 * Phone version of the dock's sidebar. Same data as <DockNav> (the layout's
 * permission- and module-filtered menuItems, same resolved routes), shown as a
 * slide-in list with the names always visible - there's no hover on a phone.
 * Tap a module to see its pages; modules with a single page go straight there.
 */
export default function PhoneDockDrawer({ isOpen, onClose, items, isItemActive, pos, setupRemainingCount = 0, onOpenChecklist }) {
    const { store, planFeatures = {}, auth } = usePage().props;
    const tt = useTermText();
    const navLabel = useNavLabel();
    const [expanded, setExpanded] = useState(null);

    const entries = (items || []).map((item) => {
        const params = item.routeParams || { store_slug: store?.slug };
        const groups = (item.subs || [])
            .map((g) => ({
                group: g.group,
                links: (g.items || []).filter(Boolean).map((s) => resolveLink(s, params, planFeatures, auth, store)).filter(Boolean),
            }))
            .filter((g) => g.links.length > 0);
        const linkCount = groups.reduce((n, g) => n + g.links.filter((l) => !l.disabled).length, 0);
        return {
            key: item.name,
            label: tt(item.name),
            icon: item.icon,
            badge: item.badgeCount || 0,
            href: item.route && window.route().has(item.route) ? window.route(item.route, params) : null,
            groups,
            hasPanel: linkCount > 1,
            item,
        };
    });

    // Open with the current module already unfolded.
    useEffect(() => {
        if (!isOpen) return;
        const cur = entries.find((e) => e.hasPanel && isItemActive(e.item));
        setExpanded(cur ? cur.key : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    const PosIcon = pos?.foh ? UtensilsCrossed : Monitor;

    const user = auth?.user;
    const initials = (() => {
        const n = (user?.name || '').trim();
        if (n) { const p = n.split(/\s+/); return (p.length >= 2 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase(); }
        return (user?.email || '?').slice(0, 2).toUpperCase();
    })();

    return createPortal(
        <div className="lg:hidden fixed inset-0 z-[1700] flex" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 animate-[fadeIn_0.15s_ease-out]" style={{ background: 'rgba(13,20,18,0.45)' }} onClick={onClose} />
            <aside className="relative h-full w-[86vw] max-w-[330px] bg-[var(--vq-bg)] border-r border-line shadow-2xl flex flex-col animate-[vqDrawerIn_0.22s_cubic-bezier(.2,.8,.2,1)]">
                {/* header */}
                <div className="shrink-0 px-3 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
                    <span className="h-11 w-11 rounded-[12px] bg-surface border border-line shadow-sm flex items-center justify-center shrink-0">
                        <img
                            src={(store?.logo_url && !store.logo_url.includes('logo.png')) ? store.logo_url : '/images/icon.svg'}
                            alt=""
                            className="h-7 w-7 object-contain"
                        />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block truncate text-base font-bold text-ink leading-tight">{store?.name || 'VenQore'}</span>
                        <span className="block truncate text-xs text-ink-muted leading-tight mt-0.5">Menu</span>
                    </span>
                    <button type="button" onClick={onClose} aria-label="Close menu" className="h-10 w-10 rounded-[12px] bg-surface border border-line flex items-center justify-center text-ink-secondary active:bg-app">
                        <X size={18} />
                    </button>
                </div>

                {/* modules */}
                <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2.5 pb-3 flex flex-col gap-1.5">
                    {entries.map((e) => {
                        const Icon = e.icon;
                        const active = isItemActive(e.item);
                        const open = expanded === e.key;
                        const rowCls = `relative w-full h-[52px] pl-2 pr-3 rounded-[14px] flex items-center gap-3 border transition-colors ${active ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/30' : 'bg-surface border-line active:bg-app'}`;
                        const inner = (
                            <>
                                <span className={`h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 ${active ? 'bg-brand-600 text-white' : 'bg-app text-ink-secondary'}`}>
                                    <Icon size={18} />
                                </span>
                                <span className={`flex-1 min-w-0 truncate text-left text-[15px] font-semibold ${active ? 'text-brand-700 dark:text-brand-400' : 'text-ink'}`}>{e.label}</span>
                                {e.badge > 0 && (
                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold leading-5 text-center">{e.badge > 99 ? '99+' : e.badge}</span>
                                )}
                                {e.hasPanel
                                    ? <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                                    : <ChevronRight size={18} className="text-ink-muted" />}
                            </>
                        );
                        return (
                            <div key={e.key}>
                                {e.hasPanel ? (
                                    <button type="button" onClick={() => setExpanded(open ? null : e.key)} aria-expanded={open} className={rowCls}>{inner}</button>
                                ) : e.href ? (
                                    <Link href={e.href} onClick={onClose} className={rowCls}>{inner}</Link>
                                ) : (
                                    <div className={rowCls}>{inner}</div>
                                )}
                                {e.hasPanel && open && (
                                    <div className="mt-1.5 rounded-[14px] bg-surface border border-line p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
                                        {e.href && (
                                            <Link href={e.href} onClick={onClose} className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-brand-50 dark:bg-brand-500/10 text-sm font-semibold text-brand-700 dark:text-brand-400 active:opacity-80">
                                                <span className="flex-1">Open {e.label}</span>
                                                <ArrowUpRight size={15} />
                                            </Link>
                                        )}
                                        {e.groups.map((g) => (
                                            <div key={g.group} className="pt-1">
                                                <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{g.group}</p>
                                                {g.links.map((l) => l.disabled ? (
                                                    <span key={l.label} className="flex items-center gap-3 h-11 px-3 text-sm text-ink-muted/70"><SubIcon label={l.label} />{navLabel(l.label)}</span>
                                                ) : (
                                                    <Link key={l.label} href={l.href} onClick={onClose} className="flex items-center gap-3 h-11 px-3 rounded-[10px] text-[15px] text-ink active:bg-app">
                                                        <SubIcon label={l.label} className="text-ink-muted shrink-0" />
                                                        <span className="flex-1 truncate">{navLabel(l.label)}</span>
                                                        {l.locked && <Lock size={13} className="shrink-0 text-amber-500" />}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* footer: POS + Setup Checklist + who's signed in */}
                <div className="shrink-0 p-3 pt-2 border-t border-line bg-surface pb-[max(12px,env(safe-area-inset-bottom))] flex flex-col gap-2">
                    {pos && (
                        <Link href={pos.href} onClick={onClose} className="h-12 rounded-[12px] bg-brand-600 active:bg-brand-700 text-white flex items-center justify-center gap-2 text-[15px] font-bold shadow-md">
                            <PosIcon size={20} />
                            {String(pos.label).startsWith('Close') ? pos.label : `Open ${pos.label}`}
                        </Link>
                    )}
                    {store && !store?.is_demo && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (typeof onOpenChecklist === 'function') {
                                    onOpenChecklist();
                                }
                            }}
                            className="w-full flex items-center justify-between p-2.5 rounded-[12px] bg-brand-50/90 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-ink dark:text-white text-left active:bg-brand-100"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0">
                                    <Sparkles size={13} className={setupRemainingCount > 0 ? "animate-pulse" : ""} />
                                </span>
                                <span className="text-xs font-semibold">Setup Checklist</span>
                            </div>
                            <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-brand-500 text-white shadow-xs">
                                {setupRemainingCount > 0 ? `${setupRemainingCount} left` : 'Done'}
                            </span>
                        </button>
                    )}
                    {user && store && (
                        <Link href={window.route('store.profile.edit', { store_slug: store.slug })} onClick={onClose} className="flex items-center gap-3 h-12 px-1 rounded-[12px] active:bg-app">
                            <span className="relative h-9 w-9 rounded-full bg-gradient-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                                {initials}
                                {setupRemainingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold leading-[16px] text-center ring-1 ring-[var(--vq-bg)]">
                                        {setupRemainingCount}
                                    </span>
                                )}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block truncate text-sm font-semibold text-ink leading-tight">{user.name || user.email}</span>
                                <span className="block truncate text-[11px] uppercase tracking-wide text-ink-muted leading-tight">{user.role || 'User'}</span>
                            </span>
                            {setupRemainingCount > 0 ? (
                                <span className="text-3xs font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {setupRemainingCount} left
                                </span>
                            ) : (
                                <ChevronRight size={16} className="text-ink-muted" />
                            )}
                        </Link>
                    )}
                </div>
            </aside>
        </div>,
        document.body
    );
}
