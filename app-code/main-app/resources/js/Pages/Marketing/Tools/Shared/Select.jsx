import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Select — styled listbox replacing the native <select>, which renders as
 * unstyleable OS chrome (white background, system font) and looked broken
 * against the site theme, especially in dark mode.
 *
 * Supports optional per-option `badge` and `hint` text, and optional
 * grouping via option.group. Keyboard accessible: Enter/Space to open,
 * Escape to close, arrows to move, Enter to select.
 */
export default function Select({ value, onChange, options = [], className = '' }) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const ref = useRef(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const commit = (val) => {
        onChange(val);
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setOpen(true);
            setActiveIndex(options.findIndex((o) => o.value === value));
            return;
        }
        if (!open) return;

        if (e.key === 'Escape') { setOpen(false); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(options.length - 1, i + 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
        if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); commit(options[activeIndex].value); }
    };

    // Group options while preserving order
    const grouped = [];
    options.forEach((opt) => {
        const key = opt.group || '';
        const last = grouped[grouped.length - 1];
        if (last && last.key === key) last.items.push(opt);
        else grouped.push({ key, items: [opt] });
    });

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm hover:border-line-strong dark:hover:border-white/20 focus:outline-none focus:border-brand-400/60 transition-colors text-left"
            >
                <span className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium">{selected?.label ?? 'Select…'}</span>
                    {selected?.badge && (
                        <span className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sunken dark:bg-white/[0.08] text-ink-muted shrink-0">
                            {selected.badge}
                        </span>
                    )}
                </span>
                <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute z-50 mt-2 w-full max-h-72 overflow-y-auto rounded-[14px] bg-white dark:bg-[#0d0b1c] border border-line dark:border-white/10 shadow-xl shadow-neutral-900/10 dark:shadow-black/40 py-1.5"
                >
                    {grouped.map((group, gi) => (
                        <div key={gi}>
                            {group.key && (
                                <p className="px-3 pt-2 pb-1 text-2xs font-bold uppercase tracking-[0.15em] text-ink-muted">
                                    {group.key}
                                </p>
                            )}
                            {group.items.map((opt) => {
                                const idx = options.indexOf(opt);
                                const isSelected = opt.value === value;
                                const isActive = idx === activeIndex;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => commit(opt.value)}
                                        className={`w-full flex items-start justify-between gap-3 px-3 py-2 text-left transition-colors ${
                                            isActive ? 'bg-brand-500/10' : ''
                                        }`}
                                    >
                                        <span className="min-w-0">
                                            <span className={`block text-sm truncate ${isSelected ? 'font-bold text-brand-600 dark:text-brand-300' : 'text-ink-secondary'}`}>
                                                {opt.label}
                                            </span>
                                            {opt.hint && (
                                                <span className="block text-1xs text-ink-muted truncate">{opt.hint}</span>
                                            )}
                                        </span>
                                        <span className="flex items-center gap-2 shrink-0">
                                            {opt.badge && (
                                                <span className="text-3xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sunken dark:bg-white/[0.08] text-ink-muted">
                                                    {opt.badge}
                                                </span>
                                            )}
                                            {isSelected && <Check size={14} className="text-brand-500" />}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
