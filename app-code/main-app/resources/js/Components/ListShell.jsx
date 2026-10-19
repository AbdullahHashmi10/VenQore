import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * ListShell — the two-row header every desktop list page shares.
 *
 *   Row 1  <ListToolbar>   [Page title ▾ nav]  [extra controls]  ····  [search] [actions]
 *   Row 2  <ListStatCards> up to four equal-height cards
 *
 * Desktop only (md+): each page keeps its own phone markup untouched, so a page
 * adopts this by putting its old header rows behind `md:hidden` and rendering
 * these next to them.
 *
 * Measurements are the design contract from the Inventory page:
 *   rows h-14, 8px between rows, 14px outer radius, 12px on inner buttons.
 */

/** Wrap the desktop page: 8px rhythm, 16px sides. */
export function ListPageFrame({ children, className = '' }) {
    return (
        <div className={`relative md:flex md:flex-col md:h-full md:gap-2 md:px-4 md:pt-2 md:pb-2 md:overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

/** The title that opens a menu of sibling pages (the module's old tab strip). */
export function NavTitle({ title, groups = [], activeId }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);

    const hasMenu = groups.some((g) => (g.items || []).length > 0);

    if (!hasMenu) {
        return <span className="h-10 pl-3 pr-3 flex items-center text-lg font-bold text-ink tracking-tight whitespace-nowrap">{title}</span>;
    }

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={`h-10 pl-3 pr-2.5 rounded-[12px] flex items-center gap-2 transition-colors ${open ? 'bg-interactive-hover' : 'hover:bg-interactive-hover'}`}
            >
                <span className="text-lg font-bold text-ink tracking-tight whitespace-nowrap">{title}</span>
                <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="menu" className="absolute left-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto overscroll-contain bg-surface border border-line rounded-[14px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top z-dropdown">
                    {groups.map((group, gi) => (
                        <div key={group.id} className={gi > 0 ? 'mt-1' : ''}>
                            <div className="px-2.5 pt-2 pb-1 text-2xs font-bold uppercase tracking-wider text-ink-muted">{group.label}</div>
                            {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const on = item.id === activeId;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        role="menuitem"
                                        className={`flex items-center gap-3 h-9 px-2.5 rounded-[12px] text-sm transition-colors ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink hover:bg-interactive-hover'}`}
                                    >
                                        {ItemIcon && <ItemIcon size={15} className={on ? '' : 'text-ink-muted'} />}
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {on && <Check size={15} />}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/** Row 1. `left` = extra dropdowns/filters beside the title, `actions` = the add button(s). */
export function ListToolbar({ title, navGroups, activeId, left, search, actions }) {
    return (
        <div className="hidden md:flex relative z-20 h-14 shrink-0 items-center justify-between gap-3 px-2 bg-surface border border-line rounded-[14px] shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
                <NavTitle title={title} groups={navGroups} activeId={activeId} />
                {left}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {search && (
                    <div className="relative w-64 lg:w-72">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                        <input
                            type="text"
                            value={search.value}
                            onChange={(e) => search.onChange(e.target.value)}
                            onKeyDown={search.onKeyDown}
                            placeholder={search.placeholder || 'Search…'}
                            className="w-full h-10 pl-9 pr-8 text-sm bg-app border border-line rounded-[12px] outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                        {search.value ? (
                            <button type="button" onClick={() => search.onChange('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink"><X size={14} /></button>
                        ) : null}
                    </div>
                )}
                {actions}
            </div>
        </div>
    );
}

/** The add / primary action button, 12px corners, matching the toolbar height. */
export function ListAddButton({ children, icon: Icon, className = '', ...rest }) {
    const Tag = rest.href ? Link : 'button';
    return (
        <Tag
            {...(rest.href ? {} : { type: 'button' })}
            {...rest}
            className={`h-10 px-4 rounded-[12px] bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </Tag>
    );
}

/** Row 2. cards: [{ label, value, icon, icon_tone, value_tone, sub?, trend?: 'up'|'down'|'flat', href? }] — all the same h-14.
 *  `sub` is a small secondary line (e.g. "vs last month"); `trend` adds an arrow; `href` makes the whole card a link. */
export function ListStatCards({ cards = [] }) {
    if (!cards.length) return null;
    return (
        <div className="hidden md:grid gap-2 shrink-0" style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))` }}>
            {cards.map((card) => {
                const CardIcon = card.icon;
                const Tag = card.href ? Link : 'div';
                const trendTone = card.trend === 'up' ? 'text-emerald-600' : card.trend === 'down' ? 'text-red-600' : 'text-ink-muted';
                return (
                    <Tag
                        key={card.label}
                        {...(card.href ? { href: card.href } : {})}
                        className={`h-14 flex items-center gap-3 px-3 bg-surface border border-line rounded-[14px] shadow-sm min-w-0 ${card.href ? 'hover:border-brand-300 transition-colors' : ''}`}
                    >
                        {CardIcon && (
                            <div className={`h-8 w-8 rounded-[12px] flex items-center justify-center shrink-0 ${card.icon_tone || 'bg-brand-50 text-brand-600'}`}>
                                <CardIcon size={16} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-bold uppercase tracking-wide text-ink-muted">{card.label}</p>
                            {card.sub ? <p className="truncate text-2xs text-ink-muted/80 leading-3">{card.sub}</p> : null}
                        </div>
                        <p className={`flex items-center gap-1 text-base font-bold tabular-nums whitespace-nowrap ${card.value_tone || 'text-ink'}`}>
                            {card.trend ? <span className={`text-xs ${trendTone}`} aria-hidden>{card.trend === 'up' ? '▲' : card.trend === 'down' ? '▼' : '–'}</span> : null}
                            {card.value}
                        </p>
                    </Tag>
                );
            })}
        </div>
    );
}
