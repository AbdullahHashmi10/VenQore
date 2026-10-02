import React from 'react';

/** Deterministic pastel from the design system's playmate ramps, so every shop/product gets a stable tile colour. */
const TONES = [
    ['var(--vq-lime-100)', 'var(--vq-lime-700)'],
    ['var(--vq-teal-50)', 'var(--vq-teal-700)'],
    ['var(--vq-sky-100)', 'var(--vq-sky-700)'],
    ['var(--vq-butter-100)', 'var(--vq-butter-700)'],
    ['var(--vq-coral-100)', 'var(--vq-coral-700)'],
    ['#F1E3F5', 'var(--vq-plum-700)'],
];
export function tone(seed = '') {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const [bg, fg] = TONES[h % TONES.length];
    return { bg, fg };
}
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';

export function Badge({ kind = '', children }) {
    return <span className={`vqs-badge ${kind ? `vqs-badge--${kind}` : ''}`}>{children}</span>;
}
export function Alert({ kind = 'info', children }) {
    if (!children) return null;
    const cls = { info: '', warn: 'vqs-alert--warn', error: 'vqs-alert--bad', success: 'vqs-alert--ok' }[kind];
    return <div role={kind === 'error' ? 'alert' : 'status'} className={`vqs-alert ${cls}`}>{children}</div>;
}
export function Btn({ variant = '', size = '', full = false, className = '', children, ...rest }) {
    const c = ['vqs-btn', variant === 'soft' && 'vqs-btn--soft', size === 'lg' && 'vqs-btn--lg', full && 'vqs-btn--full', className].filter(Boolean).join(' ');
    return <button type="button" {...rest} className={c}>{children}</button>;
}
export function Field({ label, error, hint, children }) {
    return (
        <label style={{ display: 'block' }}>
            <span className="vqs-label">{label}</span>
            {children}
            {hint && !error && <span className="vqs-hint" style={{ display: 'block' }}>{hint}</span>}
            {error && <span className="vqs-err" role="alert" style={{ display: 'block' }}>{error}</span>}
        </label>
    );
}
export function Pager({ current, last, onGo }) {
    if (!last || last <= 1) return null;
    return (
        <div className="vqs-row" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Btn variant="soft" disabled={current <= 1} onClick={() => onGo(current - 1)}>Previous</Btn>
            <span className="vqs-faint vqs-num" style={{ fontSize: 13 }}>Page {current} of {last}</span>
            <Btn variant="soft" disabled={current >= last} onClick={() => onGo(current + 1)}>Next</Btn>
        </div>
    );
}
export const Icon = {
    clock: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
    pin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>,
    phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>,
    truck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>,
    bag: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
    back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>,
};
