import React, { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/commerce';

export function Pill({ children, tone = 'bg-sunken text-ink-secondary' }) {
    return <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold ${tone}`}>{children}</span>;
}

export function StatusPill({ status }) {
    return <Pill tone={STATUS_TONE[status] || ''}>{STATUS_LABEL[status] || status}</Pill>;
}

export function Card({ children, className = '', id }) {
    return <section id={id} className={`bg-surface border border-line rounded-xl p-3 shadow-sm ${className}`}>{children}</section>;
}

/** Card heading with an icon chip, optional subtitle and a right-hand slot. */
export function CardTitle({ icon: Icon, title, sub, right, tone = 'brand' }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
                {Icon && <span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}><Icon size={16} aria-hidden="true" /></span>}
                <div className="min-w-0">
                    <h2 className="font-semibold text-ink leading-tight">{title}</h2>
                    {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
                </div>
            </div>
            {right}
        </div>
    );
}

export const TONES = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    slate: 'bg-sunken text-ink-secondary',
};

/** A metric tile, same shape as the stat cards on Purchases/Sales: icon + label on the left, value on the right. */
export function StatCard({ icon: Icon, label, value, hint, tone = 'brand', href, valueClass = 'text-ink' }) {
    const body = (
        <>
            <span className="flex items-center gap-2 min-w-0">
                {Icon && <span className={`p-1.5 rounded-lg shrink-0 ${TONES[tone]}`}><Icon size={16} aria-hidden="true" /></span>}
                <span className="min-w-0">
                    <span className="block text-xs font-bold text-ink-muted uppercase truncate">{label}</span>
                    {hint && <span className="block text-[11px] text-ink-muted truncate">{hint}</span>}
                </span>
            </span>
            <span className={`text-lg font-bold tabular-nums whitespace-nowrap ${valueClass}`}>{value}</span>
        </>
    );
    const cls = 'flex items-center justify-between gap-3 bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm';
    return href ? <a href={href} className={`${cls} hover:border-brand-300 transition-colors`}>{body}</a> : <div className={cls}>{body}</div>;
}

/** Accessible on/off switch with a label and optional description. */
export function Switch({ checked, onChange, label, desc, disabled = false }) {
    return (
        <label className={`flex items-start justify-between gap-4 py-2 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
            <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{label}</span>
                {desc && <span className="block text-xs text-ink-muted mt-0.5">{desc}</span>}
            </span>
            <span className="relative inline-flex shrink-0 mt-0.5">
                <input type="checkbox" className="peer sr-only" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
                <span className="h-6 w-11 rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
        </label>
    );
}

/** Image picker with a live preview of the current or newly chosen file. */
export function ImageInput({ label, current, onChange, hint, error, wide = false, accept = 'image/png,image/jpeg,image/webp' }) {
    const [preview, setPreview] = useState(null);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
    const src = preview || current;
    return (
        <div>
            <span className="block text-sm font-medium text-ink-secondary mb-1">{label}</span>
            <label className={`group relative flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-line bg-sunken hover:border-brand-400 cursor-pointer ${wide ? 'h-36 w-full' : 'h-24 w-24'}`}>
                {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="text-ink-muted" size={wide ? 28 : 22} aria-hidden="true" />}
                <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[11px] font-medium py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">{src ? 'Change' : 'Upload'}</span>
                <input type="file" accept={accept} className="sr-only" aria-label={label} onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) setPreview(URL.createObjectURL(f));
                    onChange(f);
                }} />
            </label>
            {hint && !error && <span className="block text-xs text-ink-muted mt-1">{hint}</span>}
            {error && <span className="block text-xs text-red-600 mt-1" role="alert">{error}</span>}
        </div>
    );
}

/** Friendly empty state. */
export function EmptyState({ icon: Icon, title, text, action }) {
    return (
        <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-8 text-center">
            {Icon && <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sunken text-ink-muted"><Icon size={22} aria-hidden="true" /></span>}
            <h3 className="font-semibold text-ink">{title}</h3>
            {text && <p className="text-sm text-ink-muted mt-1 max-w-md mx-auto">{text}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
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
        primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20',
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
