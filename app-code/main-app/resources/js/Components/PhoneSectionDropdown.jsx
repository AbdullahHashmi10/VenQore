import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, Layers, Check } from 'lucide-react';

/**
 * Phone-only section switcher shared by the *ModuleTabs components.
 * Opens downward in place (no sheets, no sideways scrolling). Hidden on lg+.
 */
export default function PhoneSectionDropdown({ title, groups = [], activeTab }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const flat = groups.flatMap(g => g.items.map(i => ({ ...i, group: g.label })));
    const current = flat.find(i => i.id === activeTab);
    const CurrentIcon = current?.icon || Layers;
    const single = groups.length === 1;

    return (
        <div className="lg:hidden relative shrink-0 z-40">
            {open && <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} aria-hidden="true" />}
            <div className="bg-surface border border-line rounded-xl shadow-sm">
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    className="w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 text-left active:bg-app"
                >
                    <span className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <CurrentIcon size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[11px] font-medium text-ink-muted leading-tight">{title}{!single && current?.group ? ` · ${current.group}` : ''}</span>
                        <span className="block text-sm font-semibold text-ink leading-tight truncate">{current?.label || title}</span>
                    </span>
                    <ChevronDown size={16} className={`text-ink-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {open && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line rounded-xl shadow-xl max-h-[58vh] overflow-y-auto overscroll-contain animate-[vqDrop_0.16s_ease-out] origin-top">
                    {groups.map(group => (
                        <div key={group.id}>
                            {!single && <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{group.label}</div>}
                            {group.items.filter(i => i.href).map(item => {
                                const Icon = item.icon || Layers;
                                const on = item.id === activeTab;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2 text-sm ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-app'}`}
                                    >
                                        <Icon size={15} className={on ? '' : 'text-ink-muted'} />
                                        <span className="flex-1 truncate">{item.label}</span>
                                        {item.badge ? <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-bold">{item.badge}</span> : null}
                                        {on && <Check size={14} />}
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
