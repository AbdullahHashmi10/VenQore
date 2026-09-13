/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  PromptTextarea — the one free-text box the builder uses.                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Same surface as the landing-hero prompt (20px radius, surface ground,
 * hairline border, ring on focus) so the sentence someone typed on the landing
 * page and the answers they type here feel like one field.
 *
 * Behaviour:
 *   · Auto-grows from `minRows` (1) to `maxRows` (5). No inner scrollbar until
 *     the content is genuinely taller than the max — only then does overflow
 *     flip to auto.
 *   · Enter submits, Shift+Enter inserts a newline. Enter during an IME
 *     composition (Urdu, Arabic, CJK keyboards) never submits — it confirms
 *     the composed word, which is what those keyboards use Enter for.
 *   · Hard `maxLength` (600 — the server's cap, see converseStart/analyze);
 *     a quiet counter appears only in the last 20% so it is not noise.
 *
 * Styles: resources/css/venqore-v6/builder.css (.vq-prompt-box).
 */

import React, { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : () => {};

const PromptTextarea = forwardRef(function PromptTextarea(
    {
        value,
        onChange,
        onSubmit,
        placeholder = '',
        disabled = false,
        busy = false,
        maxLength = 600,
        minRows = 1,
        maxRows = 5,
        size = 'md',
        submitLabel = 'Send',
        submitText = null,
        submitIcon: SubmitIcon = ArrowUp,
        hint = null,
        id,
        ariaLabel,
        ariaDescribedBy,
        autoFocus = false,
        className = '',
    },
    forwardedRef,
) {
    const innerRef = useRef(null);

    const setRefs = useCallback(
        (node) => {
            innerRef.current = node;
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
        },
        [forwardedRef],
    );

    /* Measure after every value change, before paint, so the box never
       flashes at the wrong height. */
    useIsoLayoutEffect(() => {
        const el = innerRef.current;
        if (!el) return;
        const cs = window.getComputedStyle(el);
        const line = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 24;
        const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        const min = line * minRows + pad;
        const max = Math.ceil(line * maxRows + pad);
        el.style.height = 'auto';
        const needed = el.scrollHeight;
        el.style.height = `${Math.min(Math.max(needed, min), max)}px`;
        el.style.overflowY = needed > max + 2 ? 'auto' : 'hidden';
    }, [value, minRows, maxRows, size]);

    const text = value || '';
    const trimmed = text.trim();
    const canSend = !disabled && !busy && trimmed.length > 0;
    const showCount = maxLength && text.length >= Math.floor(maxLength * 0.8);

    const submit = () => {
        if (!canSend) return;
        onSubmit?.(trimmed);
    };

    const onKeyDown = (e) => {
        if (e.key !== 'Enter' || e.shiftKey) return;
        if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
        e.preventDefault();
        submit();
    };

    return (
        <div className={className}>
            <form
                className={`vq-prompt-box${size === 'lg' ? ' vq-prompt-box--lg' : ''}`}
                data-disabled={disabled ? 'true' : undefined}
                onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                }}
            >
                <textarea
                    ref={setRefs}
                    id={id}
                    rows={minRows}
                    value={text}
                    onChange={(e) => onChange?.(e.target.value.slice(0, maxLength))}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    aria-label={ariaLabel}
                    aria-describedby={ariaDescribedBy}
                    enterKeyHint="send"
                    className="vq-prompt-box__input"
                />
                <div className="vq-prompt-box__actions">
                    {showCount ? (
                        <span
                            className="vq-prompt-box__count"
                            data-full={text.length >= maxLength ? 'true' : undefined}
                            aria-live="polite"
                        >
                            <span className="sr-only">Characters used: </span>
                            {text.length}/{maxLength}
                        </span>
                    ) : null}
                    <button
                        type="submit"
                        className="vq-btn vq-btn--primary vq-prompt-box__send"
                        data-label={submitText ? 'true' : undefined}
                        aria-label={submitText ? undefined : submitLabel}
                        title={submitText ? undefined : submitLabel}
                        aria-disabled={!canSend ? 'true' : undefined}
                        disabled={disabled || busy}
                    >
                        {submitText ? <span>{submitText}</span> : null}
                        <SubmitIcon size={18} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                </div>
            </form>
            {hint ? <p className="vq-prompt-box__hint">{hint}</p> : null}
        </div>
    );
});

export default PromptTextarea;
