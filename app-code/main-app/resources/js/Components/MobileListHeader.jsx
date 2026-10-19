import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, Check, Search, X, Plus, SlidersHorizontal } from 'lucide-react';
import MobileStats from '@/Components/MobileStats';

/*
 * Phone-only (<md) list header, same pattern as the Inventory page.
 *   Row 1: [page title ▾ nav] [filter ▾] [search] [+ add]
 *   Row 2: <MobileStats/>
 * All panels drop DOWN from the card. Desktop is untouched (md:hidden).
 *
 * props
 *   title, navGroups, activeId       page nav dropdown
 *   links      [{label, icon, href|onClick}]   extra items at the bottom of the nav panel
 *   filter     { active: bool, sections: [{label, value, options:[{value,label}], onSelect(v), keepOpen}], footer: node }
 *   search     { value, onChange(v), onKeyDown, placeholder }
 *   add        { href | onClick, label, icon }
 *   stats      { items, hero }
 */
export default function MobileListHeader({ title, navGroups = [], activeId, links = [], filter: filterProp, filters, actions = [], search: searchProp, add, stats }) {
    const norm = (o) => (typeof o === 'object' ? { value: o.value ?? o.id, label: o.label ?? o.name ?? String(o.value ?? o.id) } : { value: o, label: String(o) });
    const filter = filterProp || (filters && filters.length ? {
        active: filters.some((f) => f.value !== undefined && f.value !== null && !['all', '', 'All', 'all_time'].includes(f.value)),
        sections: filters.map((f) => ({ label: f.label, value: f.value, options: (f.options || []).map(norm), onSelect: f.onChange })),
    } : null);
    const search = searchProp && searchProp.event ? { ...searchProp, onChange: (v) => searchProp.onChange({ target: { value: v }, value: v }) } : searchProp;
    const [openMenu, setOpenMenu] = useState(null);
    const [showSearch, setShowSearch] = useState(!!search?.value);
    const toggle = (k) => setOpenMenu((p) => (p === k ? null : k));

    useEffect(() => {
        const onDown = (e) => { if (!e.target.closest('[data-menu]')) setOpenMenu(null); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('touchstart', onDown);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); };
    }, []);

    const hasNav = navGroups.some((g) => (g.items || []).length > 0) || links.length > 0;
    const AddIcon = add?.icon || Plus;
    const addCls = 'h-9 w-9 rounded-[10px] bg-brand-600 text-white flex items-center justify-center shadow-sm active:bg-brand-700';

    return (
        <>
            <div className="md:hidden relative z-40 shrink-0 bg-surface border border-line rounded-[14px] shadow-sm">
                <div className="h-12 flex items-center gap-1 px-1.5">
                    <div className="min-w-0 flex-1" data-menu>
                        {!hasNav ? (
                            <span className="h-9 pl-2 flex items-center text-[15px] font-bold text-ink tracking-tight truncate">{title}</span>
                        ) : (<>
                        <button
                            type="button"
                            onClick={() => toggle('nav')}
                            aria-haspopup="menu"
                            aria-expanded={openMenu === 'nav'}
                            className={`h-9 max-w-full pl-2 pr-1.5 rounded-[10px] flex items-center gap-1 transition-colors ${openMenu === 'nav' ? 'bg-interactive-hover' : 'active:bg-interactive-hover'}`}
                        >
                            <span className="text-[15px] font-bold text-ink tracking-tight truncate">{title}</span>
                            <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform duration-200 ${openMenu === 'nav' ? 'rotate-180' : ''}`} />
                        </button>
                        {openMenu === 'nav' && (
                            <div role="menu" className="absolute left-0 right-0 top-full mt-1 max-h-[62vh] overflow-y-auto overscroll-contain bg-surface border border-line rounded-[12px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
                                {navGroups.map((group, gi) => (
                                    <div key={group.id} className={gi > 0 ? 'mt-1' : ''}>
                                        <div className="px-2.5 pt-2 pb-1 text-2xs font-bold uppercase tracking-wider text-ink-muted">{group.label}</div>
                                        {(group.items || []).map((item) => {
                                            const ItemIcon = item.icon;
                                            const on = item.id === activeId;
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    onClick={() => setOpenMenu(null)}
                                                    role="menuitem"
                                                    className={`flex items-center gap-3 h-10 px-2.5 rounded-[8px] text-sm ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-interactive-hover'}`}
                                                >
                                                    {ItemIcon && <ItemIcon size={15} className={on ? '' : 'text-ink-muted'} />}
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {on && <Check size={15} />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ))}
                                {links.length > 0 && (
                                    <>
                                        {navGroups.length > 0 && <div className="h-px bg-line my-1.5" />}
                                        {links.map((l) => {
                                            const LIcon = l.icon;
                                            const cls = 'flex items-center gap-3 h-10 px-2.5 rounded-[8px] text-sm text-ink active:bg-interactive-hover w-full text-left';
                                            return l.href ? (
                                                <a key={l.label} href={l.href} role="menuitem" onClick={() => setOpenMenu(null)} className={cls}>
                                                    {LIcon && <LIcon size={15} className="text-ink-muted" />}<span className="flex-1 truncate">{l.label}</span>
                                                </a>
                                            ) : (
                                                <button key={l.label} type="button" role="menuitem" onClick={() => { setOpenMenu(null); l.onClick?.(); }} className={cls}>
                                                    {LIcon && <LIcon size={15} className="text-ink-muted" />}<span className="flex-1 truncate">{l.label}</span>
                                                </button>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        )}
                        </>)}
                    </div>

                    {filter && (
                        <div data-menu>
                            <button
                                type="button"
                                onClick={() => toggle('filter')}
                                aria-haspopup="listbox"
                                aria-expanded={openMenu === 'filter'}
                                aria-label="Filters"
                                className={`relative h-9 px-2 rounded-[10px] border flex items-center gap-1 transition-colors ${filter.active ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'border-line bg-app text-ink-secondary'}`}
                            >
                                <SlidersHorizontal size={16} />
                                <ChevronDown size={14} className={`transition-transform duration-200 ${openMenu === 'filter' ? 'rotate-180' : ''}`} />
                            </button>
                            {openMenu === 'filter' && (
                                <div role="listbox" className="absolute left-0 right-0 top-full mt-1 max-h-[62vh] overflow-y-auto overscroll-contain bg-surface border border-line rounded-[12px] shadow-xl p-2 animate-[vqDrop_0.16s_ease-out] origin-top">
                                    {(filter.sections || []).map((sec, si) => (
                                        <div key={sec.label || si} className={si > 0 ? 'mt-1' : ''}>
                                            {sec.label && <div className="px-2.5 pt-1.5 pb-1 text-2xs font-bold uppercase tracking-wider text-ink-muted">{sec.label}</div>}
                                            <div className="flex flex-col gap-0.5">
                                                {sec.options.map((o) => {
                                                    const on = String(sec.value) === String(o.value);
                                                    return (
                                                        <button
                                                            key={o.value}
                                                            type="button"
                                                            role="option"
                                                            aria-selected={on}
                                                            onClick={() => { sec.onSelect(o.value); if (!sec.keepOpen) setOpenMenu(null); }}
                                                            className={`h-10 px-3 rounded-[8px] text-sm text-left flex items-center justify-between gap-2 ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-interactive-hover'}`}
                                                        >
                                                            <span className="truncate">{o.label}</span>
                                                            {on && <Check size={15} className="shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {filter.footer}
                                </div>
                            )}
                        </div>
                    )}

                    {search && (
                        <button
                            type="button"
                            onClick={() => setShowSearch((v) => !v)}
                            aria-label="Search"
                            className={`h-9 w-9 rounded-[10px] flex items-center justify-center transition-colors ${showSearch || search.value ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'bg-app text-ink-secondary'}`}
                        >
                            <Search size={17} />
                        </button>
                    )}

                    {actions.map((a) => { const AIcon = a.icon; return (
                        <button key={a.label} type="button" aria-label={a.label} onClick={a.onClick} className="h-9 w-9 rounded-[10px] flex items-center justify-center text-ink-muted active:bg-interactive-hover"><AIcon size={17} /></button>
                    ); })}

                    {add && (add.href ? (
                        <Link id={add.id} href={add.href} aria-label={add.label || 'Add'} className={addCls}><AddIcon size={19} /></Link>
                    ) : (
                        <button id={add.id} type="button" onClick={add.onClick} aria-label={add.label || 'Add'} className={addCls}><AddIcon size={19} /></button>
                    ))}
                </div>

                {search && showSearch && (
                    <div className="px-1.5 pb-1.5 -mt-0.5">
                        <div className="relative">
                            <input
                                autoFocus
                                type="text"
                                value={search.value}
                                onChange={(e) => search.onChange(e.target.value)}
                                onKeyDown={search.onKeyDown}
                                placeholder={search.placeholder || 'Search…'}
                                className="w-full h-10 pl-9 pr-9 text-sm bg-app border border-line rounded-[10px] text-ink placeholder:text-ink-muted outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={15} />
                            {search.value && (
                                <button type="button" aria-label="Clear search" onClick={() => search.onChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-ink-muted">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {stats && <MobileStats bp="md" hero={stats.hero ?? 0} items={stats.items} />}
        </>
    );
}
