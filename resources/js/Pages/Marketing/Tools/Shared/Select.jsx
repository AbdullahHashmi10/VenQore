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
        <div ref={ref} className={`vq-tsel ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="vq-tsel__trigger"
            >
                <span className="vq-tsel__value">
                    <span>{selected?.label ?? 'Select…'}</span>
                    {selected?.badge && <span className="vq-badge">{selected.badge}</span>}
                </span>
                <ChevronDown size={18} className="vq-tsel__chev" aria-hidden="true" />
            </button>

            {open && (
                <div role="listbox" className="vq-tsel__menu">
                    {grouped.map((group, gi) => (
                        <div key={gi}>
                            {group.key && <p className="vq-tsel__group">{group.key}</p>}
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
                                        data-active={isActive ? 'true' : 'false'}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        onClick={() => commit(opt.value)}
                                        className="vq-tsel__opt"
                                    >
                                        <span style={{ minWidth: 0 }}>
                                            <span className="vq-tsel__opt-label">{opt.label}</span>
                                            {opt.hint && <span className="vq-tsel__hint">{opt.hint}</span>}
                                        </span>
                                        <span className="vq-tsel__side">
                                            {opt.badge && <span className="vq-badge">{opt.badge}</span>}
                                            {isSelected && <Check size={16} aria-hidden="true" />}
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
