import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

/**
 * SmoothCaretInput — an input whose caret glides to the insertion point.
 *
 * The native caret is a 1px hairline that all but vanishes against the island's
 * dark mesh. This draws its own: a spring-driven bar that travels to wherever
 * the text cursor lands.
 *
 * ── Mechanics, and why these four matter ─────────────────────────────────────
 * 1. The caret moves on `x` (a transform), not `left`. Animating `left` puts a
 *    layout pass in every frame of a spring that runs at 60fps while someone is
 *    typing; a transform is composited and costs nothing.
 * 2. `selectionchange` on the document, not just keyup/click on the input.
 *    Arrow keys, drag-select, undo and IME composition all move the caret
 *    without firing the input's own events, and the caret used to lag behind.
 * 3. Long values scroll. Once text overruns the field the caret has to be
 *    pulled back into view with the text, or it parks at the edge and lies.
 * 4. It re-measures on `document.fonts.ready`. The hidden mirror measures with
 *    whatever font is resolved at that instant, so before Plus Jakarta Sans
 *    lands it measures fallback metrics and the caret sits wrong on first
 *    paint — visible on every cold load.
 *
 * The caret is hidden while a range is selected (the selection already shows
 * where you are) and whenever it scrolls out of the visible track.
 *
 * Spring: z = 30 / (2*sqrt(500 * 0.5)) = 0.95 — just shy of critical, so it
 * arrives fast and doesn't wobble under a fast typist.
 */
const CARET_SPRING = { stiffness: 500, damping: 30, mass: 0.5 };

export default function SmoothCaretInput({
    type = 'text',
    value = '',
    onChange,
    placeholder = '',
    className = '',
    inputClassName = '',
    icon: Icon = null,
    caretColor = 'bg-brand-500',
    disabled = false,
    id,
    name,
    required = false,
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);
    const mirrorRef = useRef(null);
    const containerRef = useRef(null);

    const reduced = useReducedMotion();
    const caretX = useMotionValue(0);
    const caretOpacity = useMotionValue(0);
    const [caretHeight, setCaretHeight] = useState(20);
    const springX = useSpring(caretX, reduced ? { stiffness: 10000, damping: 100, mass: 0.1 } : CARET_SPRING);

    const syncMirror = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        if (!input || !mirror) return null;
        const cs = window.getComputedStyle(input);
        mirror.style.font = cs.font;
        mirror.style.fontFamily = cs.fontFamily;
        mirror.style.fontSize = cs.fontSize;
        mirror.style.fontWeight = cs.fontWeight;
        mirror.style.letterSpacing = cs.letterSpacing;
        mirror.style.fontFeatureSettings = cs.fontFeatureSettings;
        return cs;
    }, []);

    const updateCaret = useCallback(() => {
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        if (!input || !mirror) return;

        const cs = syncMirror();
        if (!cs) return;

        const selStart = input.selectionStart ?? 0;
        const selEnd = input.selectionEnd ?? 0;
        const hasSelection = selStart !== selEnd;
        const caretIndex = hasSelection
            ? (input.selectionDirection === 'backward' ? selStart : selEnd)
            : selStart;

        const before = (input.value || '').slice(0, caretIndex);
        mirror.textContent = before;
        if (before.endsWith(' ')) mirror.innerHTML = before.replace(/ /g, '&nbsp;');

        const padL = parseFloat(cs.paddingLeft) || 0;
        const padR = parseFloat(cs.paddingRight) || 0;
        const absolute = before.length ? mirror.offsetWidth + padL : padL;

        // Keep the caret inside the visible track when the value overruns it.
        const maxScroll = Math.max(0, input.scrollWidth - input.clientWidth);
        const visibleRight = input.scrollLeft + input.clientWidth - padR;
        const visibleLeft = input.scrollLeft + padL;
        if (absolute > visibleRight) {
            input.scrollLeft = Math.min(absolute - input.clientWidth + padR, maxScroll);
        } else if (absolute < visibleLeft) {
            input.scrollLeft = Math.max(0, absolute - padL);
        }

        const x = absolute - input.scrollLeft;
        const minX = padL - 1;
        const maxX = input.clientWidth - padR;
        const visible = x >= minX && x <= maxX + 1;

        caretX.set(Math.min(Math.max(x, minX), maxX));
        setCaretHeight(Math.round(parseFloat(cs.fontSize) * 1.15) || 20);
        caretOpacity.set(isFocused && !disabled && visible && !hasSelection ? 1 : 0);
    }, [syncMirror, caretX, caretOpacity, isFocused, disabled]);

    const updateRef = useRef(updateCaret);
    useEffect(() => { updateRef.current = updateCaret; }, [updateCaret]);

    useEffect(() => { updateRef.current(); }, [value, isFocused]);

    useEffect(() => {
        const input = inputRef.current;
        const container = containerRef.current;
        if (!input || !container) return undefined;

        const refresh = () => { if (document.activeElement === input) updateRef.current(); };
        const onSelectionChange = () => {
            if (document.activeElement !== input) return;
            requestAnimationFrame(refresh);
        };

        document.addEventListener('selectionchange', onSelectionChange);
        input.addEventListener('scroll', refresh);
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
        ro?.observe(container);

        // Webfonts land after first paint; the mirror must re-measure when they do.
        if (document.fonts) {
            document.fonts.addEventListener?.('loadingdone', refresh);
            document.fonts.ready?.then(refresh).catch(() => {});
        }
        refresh();

        return () => {
            document.removeEventListener('selectionchange', onSelectionChange);
            input.removeEventListener('scroll', refresh);
            ro?.disconnect();
            document.fonts?.removeEventListener?.('loadingdone', refresh);
        };
    }, []);

    const handleChange = (e) => {
        onChange?.(e);
        requestAnimationFrame(() => updateRef.current());
    };

    return (
        <label
            ref={containerRef}
            htmlFor={id}
            className={`relative flex items-center w-full ${className}`}
        >
            {Icon && (
                <div className="absolute left-3.5 z-10 text-ink-muted pointer-events-none flex items-center justify-center">
                    <Icon size={18} />
                </div>
            )}

            {/* Hidden measuring mirror */}
            <span
                ref={mirrorRef}
                className="absolute opacity-0 pointer-events-none whitespace-pre select-none left-0 top-0 invisible"
                aria-hidden="true"
            />

            <input
                ref={inputRef}
                id={id}
                name={name}
                type={type}
                value={value}
                required={required}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); caretOpacity.set(0); }}
                placeholder={placeholder}
                disabled={disabled}
                style={{ caretColor: 'transparent' }}
                className={`w-full bg-surface border border-line rounded-xl py-2.5 ${
                    Icon ? 'pl-10 ' : 'pl-3.5 '
                }pr-3.5 text-sm font-medium text-ink placeholder-ink-muted outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 ${inputClassName}`}
                {...props}
            />

            <motion.div
                aria-hidden="true"
                className={`absolute left-0 w-[2px] rounded-full pointer-events-none ${caretColor}`}
                style={{
                    x: springX,
                    opacity: caretOpacity,
                    height: caretHeight,
                    boxShadow: '0 0 8px rgba(11,170,143,0.6)',
                }}
            />
        </label>
    );
}
