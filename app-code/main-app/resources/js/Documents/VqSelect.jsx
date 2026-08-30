import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

/**
 * VqSelect — the document screen's dropdown.
 *
 * A native <select> hands its list to the operating system: Windows draws a
 * grey box with a blue highlight and nothing about it can be styled, which is
 * why the tax and account menus looked like they came from a different decade
 * than the screen around them.
 *
 * So the list is ours. The trigger is a real button, the list is a portalled
 * listbox positioned against the trigger, and the whole thing keeps the
 * keyboard contract people expect from a select:
 *
 *   ↑ ↓        move through the options
 *   Home/End   first / last
 *   a–z        jump to the next option starting with that letter
 *   Enter/Space  choose
 *   Esc        close and keep what was there
 *   Tab        close
 *
 * It is portalled for the same reason the product search is: this screen puts
 * its rows in a scrolling container, and a list positioned inside its own
 * field would be clipped the moment it opened.
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
}) {
    const reactId = useId();
    const listId = id ? `${id}-list` : `vqsel-${reactId}`;
    const btnRef = useRef(null);
    const popRef = useRef(null);
    const typed = useRef({ str: '', at: 0 });

    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const [rect, setRect] = useState(null);
    /* The list is portalled to <body>, outside the screen's own scale
       variable, so the trigger's resolved scale travels with it. Without this
       the menu stays at Normal size while the page is at Senior. */
    const [scale, setScale] = useState('1');

    const items = options || [];
    const index = items.findIndex(o => String(o.value) === String(value));
    const current = index >= 0 ? items[index] : null;

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
        if (!open) return undefined;
        const onDown = (e) => {
            if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setActive(index >= 0 ? index : 0);
    }, [open, index]);

    /* Keep the highlighted row in view — a list you can arrow past the bottom
       of is a list you cannot use with the keyboard. */
    useEffect(() => {
        if (!open || active < 0) return;
        const el = popRef.current?.querySelector(`[data-i="${active}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [open, active]);

    const choose = (i) => {
        const opt = items[i];
        if (!opt || opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
        btnRef.current?.focus();
    };

    const step = (delta) => {
        if (!items.length) return;
        let i = active;
        for (let n = 0; n < items.length; n += 1) {
            i = (i + delta + items.length) % items.length;
            if (!items[i].disabled) break;
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
        if (e.key === 'Home') { e.preventDefault(); setActive(items.findIndex(o => !o.disabled)); return; }
        if (e.key === 'End') { e.preventDefault(); for (let i = items.length - 1; i >= 0; i -= 1) { if (!items[i].disabled) { setActive(i); break; } } return; }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); return; }

        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const now = Date.now();
            typed.current.str = now - typed.current.at > 700 ? e.key : typed.current.str + e.key;
            typed.current.at = now;
            const q = typed.current.str.toLowerCase();
            const hit = items.findIndex(o => !o.disabled && String(o.label).toLowerCase().startsWith(q));
            if (hit >= 0) setActive(hit);
        }
    };

    const list = open && rect ? createPortal(
        <div
            ref={popRef}
            id={listId}
            role="listbox"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="vqdoc-menu"
            style={{
                '--d-scale': scale,
                left: rect.left,
                width: Math.max(rect.width, 200 * Number(scale || 1)),
                maxHeight: maxHeight * Number(scale || 1),
                ...(window.innerHeight - rect.bottom < Math.min(maxHeight, 240) && rect.top > window.innerHeight - rect.bottom
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
            }}
        >
            {items.map((o, i) => (
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
            {!items.length && <div className="vqdoc-menu-empty">Nothing to choose from</div>}
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
