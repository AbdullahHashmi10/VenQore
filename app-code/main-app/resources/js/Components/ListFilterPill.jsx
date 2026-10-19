import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * ListFilterPill — the h-10 dropdown pill used in ListToolbar's `left` slot.
 * options: [{ value, label }]. `allValue` is the "no filter" value (pill stays neutral).
 */
export default function ListFilterPill({ icon: Icon, label, value, options = [], onChange, allValue = 'all' }) {
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

    const current = options.find((o) => String(o.value) === String(value));
    const active = String(value) !== String(allValue);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`h-10 px-3 rounded-[12px] border text-sm font-semibold flex items-center gap-2 max-w-[220px] transition-colors ${active ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400' : 'border-line bg-app text-ink hover:bg-interactive-hover'}`}
            >
                {Icon && <Icon size={15} className="shrink-0" />}
                <span className="truncate">{active && current ? current.label : label}</span>
                <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div role="listbox" className="absolute left-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-surface border border-line rounded-[14px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top z-dropdown">
                    {options.map((o) => {
                        const on = String(o.value) === String(value);
                        return (
                            <button
                                key={o.value}
                                type="button"
                                role="option"
                                aria-selected={on}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className={`w-full h-9 px-3 rounded-[12px] text-sm text-left flex items-center justify-between gap-2 transition-colors ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink hover:bg-interactive-hover'}`}
                            >
                                <span className="truncate">{o.label}</span>
                                {on && <Check size={15} className="shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
