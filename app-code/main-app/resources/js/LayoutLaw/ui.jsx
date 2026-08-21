/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  NewPos — the shared pieces                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Small, dumb, and deliberately unaware of layout. Every one of these takes the
 * width it has been given and renders inside it; not one of them asks how wide
 * the screen is. That question is answered once, by the engine, in NewPos.jsx.
 *
 * `data-rank` on a control is not decoration. It is the capability inventory's
 * rank, carried into the DOM so the rank overlay in Settings can audit the
 * working surface at a glance: rank 1 is capped at seven up here, rank 3 at
 * zero.
 *
 * ── ns ──────────────────────────────────────────────────────────────────────
 * Two working surfaces use these — the register (`nqp`) and the document editor
 * (`nqd`) — and each owns its own stylesheet. So every component that emits a
 * class takes an `ns` prop and defaults to `nqp`. That is the whole coupling:
 * these components know the SHAPE of a sheet or a segmented control, and
 * nothing about what either surface looks like.
 */

import React, { useEffect, useRef, useState } from 'react';
import { formatToFit } from './engine';

export const HUE_VAR = {
    teal: 'var(--vq-teal-300)',
    sky: 'var(--vq-sky-400)',
    lime: 'var(--vq-lime-400)',
    coral: 'var(--vq-coral-400)',
    butter: 'var(--vq-butter-400)',
    plum: 'var(--vq-plum-400)',
};

export const n0 = (v) => Math.round(v).toLocaleString('en-US');
export const n2 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * A number never overflows and is never cut off with an ellipsis. It steps down
 * a ladder of leaner forms until one measures inside the space it has, and the
 * exact value stays on the title attribute.
 */
export function Money({ value, font = 15, avail = 160, ccy = '', className = '', style }) {
    const f = formatToFit(value || 0, avail, font, ccy);
    return (
        <span
            className={`num ${className}`}
            style={{ fontSize: font, cursor: f.truncated ? 'help' : undefined, ...style }}
            title={f.exact + (f.truncated ? '  (shortened to fit — exact value here)' : '')}
        >
            {f.text}
        </span>
    );
}

export function Icon({ children, label, onClick, on, rank, title, className = '', ns = 'nqp' }) {
    return (
        <button
            type="button"
            className={`${ns}-iconbtn ${className}`}
            aria-label={label}
            title={title || label}
            data-on={on ? 'true' : undefined}
            data-rank={rank}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function Pane({ title, extra, children, footer, width, rank = 1, bodyRef, minWidth }) {
    return (
        <section className="nqp-pane" style={{ width: width != null ? `${width}px` : undefined }} data-rank={rank}>
            <header className="nqp-ph">
                <span>{title}</span>
                <span style={{ flex: 1 }} />
                {extra}
            </header>
            <div className="nqp-pb" ref={bodyRef} style={minWidth ? { minWidth } : undefined}>
                {children}
            </div>
            {footer}
        </section>
    );
}

/**
 * A row that behaves like a button but is NOT one, because it contains buttons.
 * A <button> inside a <button> is invalid HTML: the browser closes the outer one
 * early, so the inner control ends up as a SIBLING of the row and the row loses
 * everything after it. React warns about it; browsers silently mangle it.
 */
export function RowButton({ className, children, onClick, ...rest }) {
    return (
        <div
            role="button"
            tabIndex={0}
            className={className}
            onClick={onClick}
            onKeyDown={(e) => {
                // ONLY when the row itself has the caret. A keydown on a button
                // nested inside bubbles up here, and preventDefault() on it
                // cancels that button's own activation — which made the quantity
                // stepper and the customer-row Edit button mouse-only.
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); }
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

export function Stepper({ qty, onMinus, onPlus, disabled, rank = 1 }) {
    return (
        <div className="nqp-step" data-rank={rank} onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="One fewer" onClick={onMinus} disabled={disabled}>−</button>
            <span className="num">{qty}</span>
            <button type="button" aria-label="One more" onClick={onPlus} disabled={disabled}>+</button>
        </div>
    );
}

export function Flag({ tone, children, title, ns = 'nqp' }) {
    return <span className={`${ns}-flag`} data-tone={tone} title={title}>{children}</span>;
}

export function Kbd({ children, ns = 'nqp' }) { return <kbd className={`${ns}-kbd`}>{children}</kbd>; }

/* ── Sheets ──────────────────────────────────────────────────────────────────
   Every non-resident capability lands in one of these, and a sheet always has
   the SAME controls as the resident version of the thing it replaces. Nothing a
   cashier learned in one composition is missing from another. */
export function Sheet({
    open, onClose, title, subtitle, size = 'side', side, children, footer, labelExtra, ns = 'nqp',
}) {
    const ref = useRef(null);
    const returnTo = useRef(null);
    /* Every sheet is permanently mounted so it can animate, which means React's
       mount-time `autoFocus` fired long ago against a `visibility: hidden`
       element and will never fire again. Focus has to be moved by hand when
       `open` flips — otherwise the sheet slides in and the caret stays on the
       chip behind it, where typing does nothing. */
    useEffect(() => {
        if (!open) {
            if (returnTo.current) { try { returnTo.current.focus(); } catch { /* gone */ } returnTo.current = null; }
            return undefined;
        }
        returnTo.current = document.activeElement;
        const id = setTimeout(() => {
            const node = ref.current;
            if (!node) return;
            const target = node.querySelector('[data-sheet-focus]')
                || node.querySelector('input:not([type="range"]), textarea, select')
                || node.querySelector('button');
            if (target) target.focus();
        }, 80);
        return () => clearTimeout(id);
    }, [open]);

    /* `aria-modal="true"` is a PROMISE that focus cannot leave. A closed sheet
       is already out of the tab order (visibility: hidden), but an OPEN one had
       nothing holding the caret in: Tab walked straight out of the back of it
       and onto the page behind, where a screen reader had just been told
       nothing exists. Tab wraps inside the sheet; Shift+Tab wraps the other way. */
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),'
        + 'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const trap = (e) => {
        if (e.key !== 'Tab' || !ref.current) return;
        const items = [...ref.current.querySelectorAll(FOCUSABLE)]
            .filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const here = document.activeElement;
        if (!ref.current.contains(here)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
        if (e.shiftKey && here === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && here === last) { e.preventDefault(); first.focus(); }
    };

    return (
        <aside
            ref={ref}
            className={`${ns}-sheet`}
            data-open={open ? 'true' : 'false'}
            data-size={size === 'side' ? undefined : size}
            data-side={side}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-hidden={!open}
            onKeyDown={open ? trap : undefined}
        >
            <header className={`${ns}-sh`}>
                <span>{title}</span>
                {subtitle ? <span className="mono">{subtitle}</span> : null}
                {labelExtra}
                <span style={{ flex: 1 }} />
                <Icon label="Close" onClick={onClose} ns={ns}>✕</Icon>
            </header>
            <div className={ns === 'nqp' ? 'nqp-pb' : `${ns}-sb`}>{children}</div>
            {footer ? <div className={`${ns}-sf`}>{footer}</div> : null}
        </aside>
    );
}

/* ── Settings controls ───────────────────────────────────────────────────── */
export function Seg({ label, value, options, labels, onPick, note, disabled, ns = 'nqp' }) {
    const box = ns === 'nqp' ? 'nqp-ctl' : `${ns}-ctlbox`;
    return (
        <div className={box}>
            {label ? <div className="lbl"><span>{label}</span></div> : null}
            <div className={`${ns}-seg`} role="group" aria-label={label}>
                {options.map((o, i) => (
                    <button
                        key={String(o)}
                        type="button"
                        aria-pressed={o === value}
                        disabled={disabled ? disabled(o) : false}
                        onClick={() => onPick(o)}
                    >
                        {(labels && labels[i]) || String(o)}
                    </button>
                ))}
            </div>
            {note ? <div className="note">{note}</div> : null}
        </div>
    );
}

export function Slider({ label, value, lo, hi, step, fmt, onSet, note, ns = 'nqp', disabled }) {
    const box = ns === 'nqp' ? 'nqp-ctl' : `${ns}-ctlbox`;
    return (
        <div className={box}>
            <div className="lbl"><span>{label}</span><b>{fmt ? fmt(value) : value}</b></div>
            <input
                type="range" min={lo} max={hi} step={step} value={value}
                aria-label={label} disabled={disabled}
                onChange={(e) => onSet(Number(e.target.value))}
            />
            {note ? <div className="note">{note}</div> : null}
        </div>
    );
}

export function Switch({ label, note, value, onChange, ns = 'nqp' }) {
    return (
        <button type="button" className={`${ns}-switch`} aria-pressed={!!value} onClick={() => onChange(!value)}>
            <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{label}</span>
                {note ? <span style={{ display: 'block', fontSize: 11, color: 'var(--vq-text-3)', lineHeight: 1.4 }}>{note}</span> : null}
            </span>
            <span className={`${ns}-switchbox`} />
        </button>
    );
}

/* ── Toasts ──────────────────────────────────────────────────────────────────
   Cancel is undoable for ten seconds. No confirmation dialog, and no loss —
   the shipped register wiped the cart with neither. */
export function Toasts({ items, onAction, onDismiss, ns = 'nqp' }) {
    return (
        <div className={`${ns}-toasts`} aria-live="polite">
            {items.map((t) => (
                <div className={`${ns}-toast`} key={t.id} data-tone={t.tone}>
                    <span style={{ minWidth: 0 }}>{t.text}</span>
                    {t.action ? (
                        <button type="button" onClick={() => onAction(t)}>{t.action}</button>
                    ) : (
                        <button type="button" aria-label="Dismiss" onClick={() => onDismiss(t)}>✕</button>
                    )}
                </div>
            ))}
        </div>
    );
}

/** Focus the element when `when` flips true — used for sheets that open onto a field. */
export function useAutoFocus(when) {
    const ref = useRef(null);
    useEffect(() => {
        if (when && ref.current) {
            const id = setTimeout(() => ref.current && ref.current.focus(), 60);
            return () => clearTimeout(id);
        }
        return undefined;
    }, [when]);
    return ref;
}

/** The live viewport. The engine is given real numbers, never simulated ones. */
export function useViewport() {
    const [vp, setVp] = useState(() => ({
        w: typeof window === 'undefined' ? 1440 : window.innerWidth,
        h: typeof window === 'undefined' ? 900 : window.innerHeight,
    }));
    useEffect(() => {
        let frame = 0;
        const on = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => setVp({ w: window.innerWidth, h: window.innerHeight }));
        };
        window.addEventListener('resize', on);
        window.addEventListener('orientationchange', on);
        on();
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', on);
            window.removeEventListener('orientationchange', on);
        };
    }, []);
    return vp;
}

/**
 * A draggable pane divider. Nobody in the POS category ships these — the one
 * product with free pane geometry is Dynamics 365 Commerce, where layouts are
 * authored per-resolution in an admin tool and exported as XML, not dragged at
 * the register.
 *
 * The drag writes FRACTIONS, not pixels, so a composition dragged on the
 * counter terminal still means something on a phone. The law then clamps it:
 * drag the catalog past its floor and it does not become an unreadable
 * catalog, it becomes a button.
 */
export function Splitter({ leftKey, rightKey, pool, get, set, onCommit, label }) {
    const ref = useRef(null);
    const nudge = (dir) => {
        const a0 = get(leftKey);
        const b0 = rightKey ? get(rightKey) : 0;
        const d = (dir * 16) / pool;
        set(leftKey, a0 + d, rightKey, rightKey ? b0 - d : undefined);
        if (onCommit) onCommit();
    };
    const onPointerDown = (e) => {
        e.preventDefault();
        const node = ref.current;
        node.setPointerCapture(e.pointerId);
        node.dataset.drag = 'true';
        const x0 = e.clientX;
        const a0 = get(leftKey);
        const b0 = rightKey ? get(rightKey) : 0;
        const move = (ev) => {
            const d = (ev.clientX - x0) / pool;
            set(leftKey, a0 + d, rightKey, rightKey ? b0 - d : undefined);
        };
        const up = () => {
            node.removeEventListener('pointermove', move);
            node.removeEventListener('pointerup', up);
            node.removeEventListener('pointercancel', up);
            delete node.dataset.drag;
            if (onCommit) onCommit();
        };
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerup', up);
        node.addEventListener('pointercancel', up);
    };
    return (
        <div
            ref={ref}
            className="nqp-split"
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-label={label || 'Resize the panes'}
            aria-valuenow={Math.round(get(leftKey) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            title="Drag to resize — or focus it and use the arrow keys. The law stops you at the floor."
            onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') { e.preventDefault(); nudge(-1); }
                if (e.key === 'ArrowRight') { e.preventDefault(); nudge(1); }
            }}
            onPointerDown={onPointerDown}
        />
    );
}
