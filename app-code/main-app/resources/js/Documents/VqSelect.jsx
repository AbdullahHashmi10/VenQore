import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * VqSelect — the document screen's dropdown with built-in search & keyboard navigation.
 *
 * A native <select> hands its list to the operating system. VqSelect delivers
 * a fully styled, accessible, portalled listbox with instant search filtering
 * for large option lists (like serial numbers, accounts, and contacts).
 */
export default function VqSelect({
    value,
    onChange,
    options,               /* [{ value, label, hint?, disabled? }]        */
    placeholder = 'Choose',
    disabled = false,
    id,
    className = '',
    ariaLabel,
    maxHeight = 320,
    searchable = undefined, /* Auto-enabled if options > 7, or explicitly boolean */
    searchPlaceholder = 'Search serial or options…',
}) {
    const reactId = useId();
    const listId = id ? `${id}-list` : `vqsel-${reactId}`;
    const btnRef = useRef(null);
    const popRef = useRef(null);
    const searchInputRef = useRef(null);
    const typed = useRef({ str: '', at: 0 });

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [active, setActive] = useState(-1);
    const [rect, setRect] = useState(null);
    const [scale, setScale] = useState('1');

    const rawItems = options || [];
    const isSearchable = searchable !== undefined ? searchable : rawItems.length > 6;

    const filteredItems = React.useMemo(() => {
        if (!searchQuery.trim()) return rawItems;
        const q = searchQuery.trim().toLowerCase();
        return rawItems.filter(o =>
            String(o.label || '').toLowerCase().includes(q) ||
            String(o.hint || '').toLowerCase().includes(q) ||
            String(o.value || '').toLowerCase().includes(q)
        );
    }, [rawItems, searchQuery]);

    const index = rawItems.findIndex(o => String(o.value) === String(value));
    const current = index >= 0 ? rawItems[index] : null;

    const measure = useCallback(() => {
        const el = btnRef.current;
        if (!el) return;
        setRect(el.getBoundingClientRect());
        const s = getComputedStyle(el).getPropertyValue('--d-scale').trim();
        if (s) setScale(s);
    }, []);

    useLayoutEffect(() => {
        if (!open) return undefined;
        measure();
        window.addEventListener('scroll', measure, true);
        window.addEventListener('resize', measure);
        return () => {
            window.removeEventListener('scroll', measure, true);
            window.removeEventListener('resize', measure);
        };
    }, [open, measure]);

    useEffect(() => {
        if (!open) {
            setSearchQuery('');
            return undefined;
        }
        const onDown = (e) => {
            if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const filteredIdx = filteredItems.findIndex(o => String(o.value) === String(value));
        setActive(filteredIdx >= 0 ? filteredIdx : 0);
        if (isSearchable) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 20);
        }
    }, [open, value, filteredItems, isSearchable]);

    useEffect(() => {
        if (!open || active < 0) return;
        const el = popRef.current?.querySelector(`[data-i="${active}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);

    const choose = (i) => {
        const opt = filteredItems[i];
        if (!opt || opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
        btnRef.current?.focus();
    };

    const step = (delta) => {
        if (!filteredItems.length) return;
        let i = active;
        for (let n = 0; n < filteredItems.length; n += 1) {
            i = (i + delta + filteredItems.length) % filteredItems.length;
            if (!filteredItems[i].disabled) break;
        }
        setActive(i);
    };

    const onKeyDown = (e) => {
        if (disabled) return;
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(true);
            return;
        }
        if (!open) return;

        if (e.key === 'Escape') { e.preventDefault(); setOpen(false); btnRef.current?.focus(); return; }
        if (e.key === 'Tab') { setOpen(false); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); step(1); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); return; }
        if (e.key === 'Home') { e.preventDefault(); setActive(filteredItems.findIndex(o => !o.disabled)); return; }
        if (e.key === 'End') { e.preventDefault(); for (let i = filteredItems.length - 1; i >= 0; i -= 1) { if (!filteredItems[i].disabled) { setActive(i); break; } } return; }
        if (e.key === 'Enter') { e.preventDefault(); choose(active); return; }

        if (!isSearchable && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const now = Date.now();
            typed.current.str = now - typed.current.at > 700 ? e.key : typed.current.str + e.key;
            typed.current.at = now;
            const q = typed.current.str.toLowerCase();
            const hit = filteredItems.findIndex(o => !o.disabled && String(o.label).toLowerCase().startsWith(q));
            if (hit >= 0) setActive(hit);
        }
    };

    const list = open && rect ? createPortal(
        <div
            ref={popRef}
            id={listId}
            role="listbox"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="vqdoc-menu flex flex-col"
            style={{
                '--d-scale': scale,
                left: rect.left,
                width: Math.max(rect.width, 220 * Number(scale || 1)),
                maxHeight: (maxHeight + 50) * Number(scale || 1),
                ...(window.innerHeight - rect.bottom < Math.min(maxHeight, 240) && rect.top > window.innerHeight - rect.bottom
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
            }}
        >
            {isSearchable && (
                <div className="p-1.5 border-b border-line/60 bg-surface/80 sticky top-0 z-10">
                    <div className="relative flex items-center">
                        <Search size={13} className="absolute left-2.5 text-ink-muted pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder={searchPlaceholder}
                            className="w-full pl-7 pr-2.5 py-1 text-xs bg-app/80 border border-line rounded-md text-ink outline-none focus:border-brand-500 transition-colors"
                        />
                    </div>
                </div>
            )}

            <div className="overflow-y-auto flex-1 max-h-[260px]">
                {filteredItems.map((o, i) => (
                    <div
                        key={`${o.value}-${i}`}
                        id={`${listId}-${i}`}
                        data-i={i}
                        role="option"
                        aria-selected={String(o.value) === String(value)}
                        aria-disabled={o.disabled || undefined}
                        className="vqdoc-menu-item"
                        data-active={i === active ? 'true' : undefined}
                        data-chosen={String(o.value) === String(value) ? 'true' : undefined}
                        onMouseEnter={() => !o.disabled && setActive(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(i)}
                    >
                        <span className="lbl">
                            {o.label}
                            {o.hint && <span className="hint">{o.hint}</span>}
                        </span>
                        {String(o.value) === String(value) && <Check size={15} className="tick" />}
                    </div>
                ))}
                {!filteredItems.length && (
                    <div className="vqdoc-menu-empty py-3 text-xs text-center text-ink-muted">
                        {searchQuery ? `No matching results for "${searchQuery}"` : 'Nothing to choose from'}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    ) : null;

    return (
        <>
            <button
                type="button"
                id={id}
                ref={btnRef}
                className={`vqdoc-select ${className}`}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={open ? listId : undefined}
                aria-label={ariaLabel}
                onClick={() => !disabled && setOpen(o => !o)}
                onKeyDown={onKeyDown}
            >
                <span className="val">{current ? current.label : <span className="ph">{placeholder}</span>}</span>
                <ChevronDown size={16} className="chev" aria-hidden="true" />
            </button>
            {list}
        </>
    );
}
