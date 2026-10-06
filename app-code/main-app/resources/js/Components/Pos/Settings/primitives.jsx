/* ==========================================================================
   Register settings — building blocks
   ==========================================================================
   One switch, one segmented control, one card, one row. Every section of the
   workspace is assembled from these, so a setting looks and reads the same
   wherever it lives — which is most of what makes a long settings screen feel
   simple rather than long.

   Wording rule for everything built on these: the TITLE says what the thing
   is in the words a shop owner would use, the DESCRIPTION says what changes
   at the till when it is on, and an EXAMPLE is added wherever a sentence alone
   would leave someone guessing.
   ========================================================================== */

import React from 'react';
import { Check, Info, Minus, Plus, AlertTriangle, CheckCircle2, Store, Monitor, Lock } from 'lucide-react';

export function Page({ icon: Icon, title, intro, children, aside }) {
    return (
        <div className="vqs-page">
            <header className="vqs-page-head">
                {Icon && <span className="vqs-page-icon" aria-hidden="true"><Icon size={24} /></span>}
                <div style={{ minWidth: 0, flex: 1 }}>
                    <h3>{title}</h3>
                    {intro && <p>{intro}</p>}
                </div>
                {aside}
            </header>
            {children}
        </div>
    );
}

/** Where a setting is saved. People need to know whether they are changing
    this one till or every till in the business before they touch it. */
export function Scope({ scope = 'device', locked = false }) {
    if (locked) {
        return (
            <span className="vqs-scope" data-scope="locked" title="Only an owner or manager can change this">
                <Lock size={12} /> Owner or manager only
            </span>
        );
    }
    return scope === 'store' ? (
        <span className="vqs-scope" data-scope="store" title="Saved for the whole business. Every till sees the change.">
            <Store size={12} /> Whole business
        </span>
    ) : (
        <span className="vqs-scope" data-scope="device" title="Saved on this device only. Other tills keep their own choice.">
            <Monitor size={12} /> This device
        </span>
    );
}

export function Section({ id, title, desc, scope, locked, children, action }) {
    return (
        <section className="vqs-section" id={id ? `vqs-sec-${id}` : undefined}>
            {(title || desc) && (
                <div className="vqs-section-head">
                    <div style={{ minWidth: 0, flex: 1 }}>
                        {title && <h4>{title}</h4>}
                        {desc && <p>{desc}</p>}
                    </div>
                    {action}
                    {scope && <Scope scope={scope} locked={locked} />}
                </div>
            )}
            <div className="vqs-section-body">{children}</div>
        </section>
    );
}

/**
 * One setting. `sid` is its search id: the search box jumps to it and flashes
 * it, so the person who typed "drawer" lands ON the switch, not near it.
 */
export function Row({ sid, title, desc, example, tags, stacked = false, disabled = false, children, flash }) {
    return (
        <div
            className="vqs-row"
            id={sid ? `vqs-set-${sid}` : undefined}
            data-stacked={stacked ? '1' : '0'}
            data-disabled={disabled ? '1' : '0'}
            data-flash={flash === sid && sid ? '1' : '0'}
        >
            <div className="vqs-row-text">
                <div className="vqs-row-title">
                    <span>{title}</span>
                    {tags}
                </div>
                {desc && <p className="vqs-row-desc">{desc}</p>}
                {example && <p className="vqs-row-example">{example}</p>}
            </div>
            {children !== undefined && children !== null && (
                <div className="vqs-row-control">{children}</div>
            )}
        </div>
    );
}

export function Tag({ tone, children }) {
    return <span className="vqs-tag" data-tone={tone}>{children}</span>;
}

export function Switch({ checked, onChange, label, disabled = false, tone }) {
    return (
        <button
            type="button"
            role="switch"
            className="vqs-switch"
            aria-checked={!!checked}
            aria-label={label}
            data-tone={tone}
            disabled={disabled}
            onClick={() => !disabled && onChange?.(!checked)}
        >
            <span />
        </button>
    );
}

/** Pill segmented control. Wraps rather than scrolls: a scrolled segment hides
    options people then never learn exist. */
export function Segmented({ value, options, onChange, label, disabled = false }) {
    return (
        <div className="vqs-seg" role="radiogroup" aria-label={label} data-disabled={disabled ? '1' : '0'}>
            {options.map(o => (
                <button
                    key={String(o.value)}
                    type="button"
                    role="radio"
                    aria-checked={value === o.value}
                    title={o.hint || undefined}
                    onClick={() => onChange?.(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** Big picture cards, for options different enough that one word cannot
    carry the difference. `pic` is a tiny drawing of the result. */
export function Choices({ value, options, onChange, label, cols, disabled = false }) {
    return (
        <div className="vqs-choices" role="radiogroup" aria-label={label} data-cols={cols}>
            {options.map(o => {
                const on = value === o.value;
                const off = disabled || o.disabled;
                return (
                    <button
                        key={String(o.value)}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-disabled={off || undefined}
                        className="vqs-choice"
                        onClick={() => !off && onChange?.(o.value)}
                    >
                        {o.pic && <span className="vqs-choice-pic" aria-hidden="true">{o.pic}</span>}
                        <span className="vqs-choice-name">
                            {o.icon && <o.icon size={16} aria-hidden="true" />}
                            {o.label}
                            {o.badge}
                        </span>
                        {o.desc && <span className="vqs-choice-desc">{o.desc}</span>}
                        {on && <span className="vqs-choice-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>}
                    </button>
                );
            })}
        </div>
    );
}

export function Stepper({ value, min, max, step = 1, onChange, format, label, disabled = false }) {
    const clamp = v => Math.max(min, Math.min(max, Math.round(v * 1000) / 1000));
    const v = Number(value) || 0;
    return (
        <div className="vqs-stepper" role="group" aria-label={label}>
            <button type="button" onClick={() => onChange?.(clamp(v - step))} disabled={disabled || v <= min} aria-label={`Less ${label}`}>
                <Minus size={16} strokeWidth={2.5} />
            </button>
            <output aria-live="polite">{format ? format(v) : v}</output>
            <button type="button" onClick={() => onChange?.(clamp(v + step))} disabled={disabled || v >= max} aria-label={`More ${label}`}>
                <Plus size={16} strokeWidth={2.5} />
            </button>
        </div>
    );
}

export function Field({ value, onChange, onCommit, onKeyDown, placeholder, prefix, suffix, type = 'text', width = 220, multiline = false, disabled = false, label, maxLength, inputMode }) {
    const commit = e => onCommit?.(e.target.value);
    return (
        <label className="vqs-input" data-multiline={multiline ? '1' : '0'} style={{ width, maxWidth: '100%' }}>
            {prefix && <span className="vqs-affix">{prefix}</span>}
            {multiline ? (
                <textarea
                    value={value ?? ''}
                    placeholder={placeholder}
                    aria-label={label}
                    disabled={disabled}
                    maxLength={maxLength}
                    onChange={e => onChange?.(e.target.value)}
                    onBlur={commit}
                    rows={3}
                />
            ) : (
                <input
                    type={type}
                    value={value ?? ''}
                    placeholder={placeholder}
                    aria-label={label}
                    disabled={disabled}
                    maxLength={maxLength}
                    inputMode={inputMode}
                    onChange={e => onChange?.(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => {
                        onKeyDown?.(e);
                        if (!e.defaultPrevented && e.key === 'Enter' && !multiline) e.currentTarget.blur();
                    }}
                />
            )}
            {suffix && <span className="vqs-affix">{suffix}</span>}
        </label>
    );
}

export function Select({ value, onChange, options, label, width = 260, disabled = false }) {
    return (
        <label className="vqs-input" style={{ width, maxWidth: '100%' }}>
            <select value={value ?? ''} onChange={e => onChange?.(e.target.value)} aria-label={label} disabled={disabled}>
                {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}

export function Button({ v = 's', size, block, icon: Icon, children, ...rest }) {
    return (
        <button type="button" className="vqs-btn" data-v={v} data-size={size} data-block={block ? '1' : undefined} {...rest}>
            {Icon && <Icon size={size === 'sm' ? 15 : 17} aria-hidden="true" />}
            {children}
        </button>
    );
}

export function Callout({ tone = 'info', icon, children }) {
    const Icon = icon || (tone === 'warn' || tone === 'danger' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info);
    return (
        <div className="vqs-callout" data-tone={tone}>
            <Icon size={18} aria-hidden="true" />
            <div style={{ minWidth: 0 }}>{children}</div>
        </div>
    );
}

export function Kbd({ children, hit }) {
    return <kbd className="vqs-kbd" data-hit={hit ? '1' : '0'}>{children}</kbd>;
}

/* Tiny drawings for choice cards. Built from boxes so they recolour with the
   theme and never need an image file. */
export const Pic = {
    Box: ({ flex = 1, tone = 'sunken', style }) => (
        <span style={{
            flex,
            minWidth: 0,
            borderRadius: 5,
            background: tone === 'accent' ? 'var(--vq-accent-quiet)'
                : tone === 'fill' ? 'var(--vq-accent-fill)'
                : tone === 'warm' ? 'var(--vq-warning-bg)'
                : tone === 'cool' ? 'var(--vq-info-bg, var(--vq-sunken))'
                : 'var(--vq-surface)',
            border: '1px solid var(--vq-line)',
            ...style,
        }} />
    ),
    Col: ({ children, flex = 1, gap = 3 }) => (
        <span style={{ flex, minWidth: 0, display: 'flex', flexDirection: 'column', gap }}>{children}</span>
    ),
    Row: ({ children, flex = 1, gap = 3 }) => (
        <span style={{ flex, minWidth: 0, display: 'flex', gap }}>{children}</span>
    ),
};
