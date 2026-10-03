import React, { useId } from 'react';

/**
 * VenQore V6 Design System Checkbox with Spring Tick Animation.
 * Conforms directly to the V6 standalone design system specification.
 */
export default function Checkbox({
    label,
    checked = false,
    indeterminate = false,
    onChange,
    disabled = false,
    id,
    className = '',
    style = {},
    ...props
}) {
    const fid = id || useId();
    const isFilled = checked || indeterminate;

    return (
        <label
            htmlFor={fid}
            className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
                disabled ? 'opacity-50 !cursor-not-allowed' : ''
            } ${className}`}
            style={{
                font: '500 14px/1.4 var(--vq-font-sans, inherit)',
                color: 'var(--vq-text, inherit)',
                ...style,
            }}
        >
            <input
                id={fid}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange && onChange(e.target.checked, e)}
                className="sr-only"
                {...props}
            />
            <span
                style={{
                    width: 20,
                    height: 20,
                    flex: '0 0 auto',
                    borderRadius: 'var(--vq-r-xs, 6px)',
                    background: isFilled ? 'var(--vq-accent-fill, #0BAA8F)' : 'var(--vq-surface, #ffffff)',
                    border: `1px solid ${isFilled ? 'transparent' : 'var(--vq-line-strong, #cbd5e1)'}`,
                    boxShadow: isFilled
                        ? 'var(--vq-glow-accent, 0 6px 20px -6px rgb(11 170 143 / .55))'
                        : 'var(--vq-elev-1, 0 1px 2px rgb(13 20 18 / .05))',
                    display: 'grid',
                    placeItems: 'center',
                    transition:
                        'background-color var(--vq-dur-2, 160ms) var(--vq-ease-out, ease-out), box-shadow var(--vq-dur-2, 160ms) var(--vq-ease-out, ease-out), border-color var(--vq-dur-2, 160ms) var(--vq-ease-out, ease-out)',
                }}
            >
                {indeterminate ? (
                    <span
                        style={{
                            width: 10,
                            height: 2.5,
                            background: 'var(--vq-on-accent, #ffffff)',
                            borderRadius: 1,
                        }}
                    />
                ) : (
                    <span
                        style={{
                            width: 10,
                            height: 6,
                            borderLeft: '2.5px solid var(--vq-on-accent, #ffffff)',
                            borderBottom: '2.5px solid var(--vq-on-accent, #ffffff)',
                            transform: checked ? 'rotate(-45deg) scale(1)' : 'rotate(-45deg) scale(.35)',
                            opacity: checked ? 1 : 0,
                            marginTop: -2,
                            transition:
                                'transform var(--vq-dur-2, 160ms) cubic-bezier(.34,1.56,.64,1), opacity var(--vq-dur-2, 160ms) var(--vq-ease-out, ease-out)',
                        }}
                    />
                )}
            </span>
            {label && <span>{label}</span>}
        </label>
    );
}
