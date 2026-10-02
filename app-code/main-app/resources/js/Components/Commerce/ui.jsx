import React from 'react';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/commerce';

export function Pill({ children, tone = 'bg-sunken text-ink-secondary' }) {
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>{children}</span>;
}

export function StatusPill({ status }) {
    return <Pill tone={STATUS_TONE[status] || ''}>{STATUS_LABEL[status] || status}</Pill>;
}

export function Card({ children, className = '' }) {
    return <div className={`bg-surface border border-line rounded-2xl p-5 ${className}`}>{children}</div>;
}

export function Field({ label, error, hint, children, className = '' }) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-sm font-medium text-ink-secondary mb-1">{label}</span>
            {children}
            {hint && !error && <span className="block text-xs text-ink-muted mt-1">{hint}</span>}
            {error && <span className="block text-xs text-red-600 mt-1" role="alert">{error}</span>}
        </label>
    );
}

export const inputCls = 'w-full rounded-xl border border-line bg-surface text-ink px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60';

export function Button({ children, variant = 'primary', className = '', ...rest }) {
    const tone = {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-sunken text-ink hover:bg-interactive-hover border border-line',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost: 'text-ink-secondary hover:bg-interactive-hover',
    }[variant];
    return (
        <button type="button" {...rest} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${tone} ${className}`}>
            {children}
        </button>
    );
}

export function Alert({ kind = 'info', children }) {
    if (!children) return null;
    const tone = {
        info: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:border-sky-800',
        error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
        success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-800',
        warn: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
    }[kind];
    return <div role={kind === 'error' ? 'alert' : 'status'} className={`border rounded-xl px-4 py-3 text-sm ${tone}`}>{children}</div>;
}

export function Pager({ current, last, onGo }) {
    if (!last || last <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="secondary" disabled={current <= 1} onClick={() => onGo(current - 1)}>Previous</Button>
            <span className="text-sm text-ink-muted">Page {current} of {last}</span>
            <Button variant="secondary" disabled={current >= last} onClick={() => onGo(current + 1)}>Next</Button>
        </div>
    );
}
