import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { tokens, BRAND, GRADIENTS, statusColor, fmtCompact } from './theme';
import {
    Search, X, ChevronLeft, ChevronRight, Inbox, AlertTriangle,
    ArrowUpRight, ArrowDownRight, Loader2, Construction, Check, ChevronDown,
} from 'lucide-react';

/* ───────────────────────── hooks ───────────────────────── */
export function useT() {
    const { isDarkMode } = useTheme();
    return useMemo(() => tokens(isDarkMode), [isDarkMode]);
}

/* ───────────────────── global motion CSS ─────────────────── */
let injected = false;
export function ensurePlatformStyles() {
    if (injected || typeof document === 'undefined') return;
    injected = true;
    const el = document.createElement('style');
    el.id = 'venqore-platform-styles';
    el.textContent = `
      @keyframes vq-fade { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
      @keyframes vq-fade-soft { from { opacity:0;} to { opacity:1;} }
      @keyframes vq-rise { from { opacity:0; transform: translateY(16px) scale(.985);} to { opacity:1; transform:none;} }
      @keyframes vq-spin { to { transform: rotate(360deg);} }
      @keyframes vq-shimmer { 0% { background-position: -468px 0;} 100% { background-position: 468px 0;} }
      @keyframes vq-pulse-ring { 0% { box-shadow:0 0 0 0 rgba(99,102,241,.35);} 70%{box-shadow:0 0 0 10px rgba(99,102,241,0);} 100%{box-shadow:0 0 0 0 rgba(99,102,241,0);} }
      @keyframes vq-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-5px);} }
      @keyframes vq-drift { 0%{transform:translate(0,0);} 50%{transform:translate(14px,-10px);} 100%{transform:translate(0,0);} }
      .vq-scroll::-webkit-scrollbar{width:8px;height:8px;}
      .vq-scroll::-webkit-scrollbar-track{background:transparent;}
      .vq-scroll::-webkit-scrollbar-thumb{background:rgba(120,130,160,.28);border-radius:10px;}
      .vq-scroll::-webkit-scrollbar-thumb:hover{background:rgba(120,130,160,.5);}
      .vq-card-hover{transition:transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s, border-color .25s;}
      .vq-card-hover:hover{transform:translateY(-3px);}
      .vq-row{transition:background .15s;}
      .vq-press{transition:transform .12s, filter .12s, background .15s, border-color .15s, color .15s;}
      .vq-press:active{transform:scale(.97);}
      @media (prefers-reduced-motion: reduce){
        *{animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important;}
      }
    `;
    document.head.appendChild(el);
}

/* ───────────────────────── Panel ───────────────────────── */
export function Panel({ children, style, className = '', hover = false, pad = 20, ...rest }) {
    const t = useT();
    return (
        <div
            className={`${hover ? 'vq-card-hover' : ''} ${className}`}
            style={{
                background: t.panel, border: `1px solid ${t.border}`, borderRadius: 18,
                padding: pad, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                boxShadow: t.isDark ? 'none' : '0 1px 2px rgba(15,23,42,0.04)',
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

/* ───────────────────────── Button ───────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', icon: Icon, style, disabled, ...rest }) {
    const t = useT();
    const sizes = {
        sm: { padding: '7px 12px', fontSize: 12.5, gap: 6, iconSize: 14 },
        md: { padding: '10px 16px', fontSize: 13.5, gap: 8, iconSize: 16 },
        lg: { padding: '13px 22px', fontSize: 15, gap: 9, iconSize: 18 },
    }[size];
    const variants = {
        primary: { background: GRADIENTS.brand, color: '#fff', border: '1px solid transparent', boxShadow: '0 8px 20px -6px rgba(99,102,241,.5)' },
        secondary: { background: t.inputBg, color: t.ink, border: `1px solid ${t.border2}` },
        ghost: { background: 'transparent', color: t.sub, border: '1px solid transparent' },
        danger: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.35)' },
        success: { background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)' },
    }[variant];
    return (
        <button
            className="vq-press"
            disabled={disabled}
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sizes.gap,
                padding: sizes.padding, fontSize: sizes.fontSize, fontWeight: 700, borderRadius: 12,
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
                whiteSpace: 'nowrap', letterSpacing: '-0.01em', fontFamily: 'inherit',
                ...variants, ...style,
            }}
            {...rest}
        >
            {Icon && <Icon size={sizes.iconSize} />}
            {children}
        </button>
    );
}

/* ───────────────────────── Badge ───────────────────────── */
export function Badge({ children, color, tone = 'soft', style }) {
    const t = useT();
    const c = color || BRAND.slate;
    const bg = tone === 'solid' ? c : `${c}22`;
    const fg = tone === 'solid' ? '#fff' : c;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
            fontSize: 11, fontWeight: 800, borderRadius: 999, background: bg, color: fg,
            border: `1px solid ${c}33`, textTransform: 'capitalize', letterSpacing: '0.01em',
            lineHeight: 1.5, ...style,
        }}>
            {children}
        </span>
    );
}

export function StatusBadge({ status }) {
    return <Badge color={statusColor(status)}>{status || '—'}</Badge>;
}

/* ───────────────────────── KPI card ───────────────────────── */
export function KpiCard({ label, value, sub, icon: Icon, accent = BRAND.indigo, trend, footnote, gradient, big = false }) {
    const t = useT();
    const up = typeof trend === 'number' ? trend >= 0 : null;
    return (
        <Panel hover pad={big ? 22 : 18} style={{ position: 'relative', overflow: 'hidden', animation: 'vq-rise .5s ease both' }}>
            {gradient && (
                <div style={{
                    position: 'absolute', inset: 0, background: gradient, opacity: t.isDark ? 0.14 : 0.08,
                    pointerEvents: 'none',
                }} />
            )}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: t.muted }}>{label}</div>
                    <div style={{ fontSize: big ? 34 : 27, fontWeight: 900, letterSpacing: '-0.03em', color: t.ink, marginTop: 6, lineHeight: 1.05 }}>{value}</div>
                    {sub && <div style={{ fontSize: 12.5, color: t.sub, marginTop: 4 }}>{sub}</div>}
                </div>
                {Icon && (
                    <div style={{
                        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                        background: `${accent}1f`, color: accent, display: 'grid', placeItems: 'center',
                        border: `1px solid ${accent}33`,
                    }}>
                        <Icon size={20} />
                    </div>
                )}
            </div>
            {(trend !== undefined && trend !== null) && (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 12, fontWeight: 700, color: up ? BRAND.emerald : BRAND.rose }}>
                    {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                    <span style={{ color: t.muted, fontWeight: 500 }}>vs last period</span>
                </div>
            )}
            {footnote && <div style={{ position: 'relative', fontSize: 11, color: t.faint, marginTop: 10 }}>{footnote}</div>}
        </Panel>
    );
}

/* ───────────────────────── Section header ───────────────────────── */
export function PageHeader({ title, subtitle, actions, icon: Icon, accent = BRAND.indigo }) {
    const t = useT();
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                {Icon && (
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: `${accent}1f`, color: accent, display: 'grid', placeItems: 'center', border: `1px solid ${accent}33`, flexShrink: 0 }}>
                        <Icon size={23} />
                    </div>
                )}
                <div style={{ minWidth: 0 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.025em', color: t.ink }}>{title}</h1>
                    {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13.5, color: t.muted }}>{subtitle}</p>}
                </div>
            </div>
            {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
    );
}

/* ───────────────────────── Skeleton ───────────────────────── */
export function Skeleton({ w = '100%', h = 14, r = 8, style }) {
    const t = useT();
    return (
        <div style={{
            width: w, height: h, borderRadius: r,
            background: t.isDark
                ? 'linear-gradient(90deg, rgba(148,163,184,.08) 25%, rgba(148,163,184,.16) 37%, rgba(148,163,184,.08) 63%)'
                : 'linear-gradient(90deg, rgba(15,23,42,.05) 25%, rgba(15,23,42,.10) 37%, rgba(15,23,42,.05) 63%)',
            backgroundSize: '936px 100%', animation: 'vq-shimmer 1.4s ease infinite',
            ...style,
        }} />
    );
}

/* ───────────────────────── Empty state ───────────────────────── */
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
    const t = useT();
    return (
        <div style={{ textAlign: 'center', padding: '56px 24px', animation: 'vq-fade .4s ease both' }}>
            <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                background: `${BRAND.indigo}14`, color: BRAND.indigo2, display: 'grid', placeItems: 'center',
                border: `1px solid ${BRAND.indigo}26`,
            }}>
                <Icon size={30} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.ink }}>{title}</div>
            {message && <div style={{ fontSize: 13.5, color: t.muted, marginTop: 6, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>{message}</div>}
            {action && <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>{action}</div>}
        </div>
    );
}

/* ───────────────────────── Drawer ───────────────────────── */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 480 }) {
    const t = useT();
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.55)', backdropFilter: 'blur(4px)', animation: 'vq-fade-soft .25s ease' }} />
            <div className="vq-scroll" style={{
                position: 'absolute', top: 0, right: 0, bottom: 0, width: `min(${width}px, 100%)`,
                background: t.panelSolid, borderLeft: `1px solid ${t.border2}`, boxShadow: t.shadow,
                display: 'flex', flexDirection: 'column', animation: 'vq-rise .3s cubic-bezier(.2,.8,.2,1) both',
                overflowY: 'auto',
            }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'sticky', top: 0, background: t.panelSolid, zIndex: 2 }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: t.ink, letterSpacing: '-0.02em' }}>{title}</h2>
                        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12.5, color: t.muted }}>{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="vq-press" style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 10, width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer', color: t.sub }}>
                        <X size={17} />
                    </button>
                </div>
                <div style={{ padding: 24, flex: 1 }}>{children}</div>
                {footer && <div style={{ padding: '16px 24px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: t.panelSolid }}>{footer}</div>}
            </div>
        </div>
    );
}

/* ───────────────────────── Confirm modal ───────────────────────── */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, typeToConfirm }) {
    const t = useT();
    const [typed, setTyped] = useState('');
    useEffect(() => { if (open) setTyped(''); }, [open]);
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    const ready = !typeToConfirm || typed === typeToConfirm;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'grid', placeItems: 'center', padding: 20 }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.6)', backdropFilter: 'blur(4px)', animation: 'vq-fade-soft .2s ease' }} />
            <div style={{ position: 'relative', width: 'min(440px,100%)', background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 20, padding: 26, boxShadow: t.shadow, animation: 'vq-rise .25s ease both' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: danger ? 'rgba(239,68,68,.14)' : `${BRAND.indigo}1f`, color: danger ? BRAND.rose : BRAND.indigo2, display: 'grid', placeItems: 'center', marginBottom: 14 }}>
                    <AlertTriangle size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: t.ink, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: t.sub, lineHeight: 1.6 }}>{message}</p>
                {typeToConfirm && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontSize: 12, color: t.muted, marginBottom: 6 }}>Type <b style={{ color: t.ink }}>{typeToConfirm}</b> to confirm</div>
                        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={typeToConfirm} autoFocus />
                    </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant={danger ? 'danger' : 'primary'} disabled={!ready} onClick={() => { onConfirm?.(); onClose?.(); }}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}

/* ───────────────────────── Inputs ───────────────────────── */
export function Input({ style, ...rest }) {
    const t = useT();
    const [focus, setFocus] = useState(false);
    return (
        <input
            onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
            onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
            style={{
                width: '100%', padding: '10px 13px', fontSize: 13.5, borderRadius: 11,
                background: t.inputBg, color: t.ink, fontFamily: 'inherit',
                border: `1px solid ${focus ? BRAND.indigo : t.inputBorder}`,
                outline: 'none', boxShadow: focus ? `0 0 0 3px ${t.ring}` : 'none',
                transition: 'border-color .15s, box-shadow .15s', ...style,
            }}
            {...rest}
        />
    );
}

export function Field({ label, hint, error, children }) {
    const t = useT();
    return (
        <div style={{ marginBottom: 16 }}>
            {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.sub, marginBottom: 6 }}>{label}</label>}
            {children}
            {hint && !error && <div style={{ fontSize: 11.5, color: t.faint, marginTop: 5 }}>{hint}</div>}
            {error && <div style={{ fontSize: 11.5, color: BRAND.rose, marginTop: 5, fontWeight: 600 }}>{error}</div>}
        </div>
    );
}

/* ───────────────────────── DataTable ───────────────────────── */
export function DataTable({
    columns, rows, loading, searchValue, onSearch, searchPlaceholder = 'Search…',
    emptyTitle = 'Nothing here yet', emptyMessage, emptyAction, filters, pagination, rowKey = 'id', toolbar,
}) {
    const t = useT();
    return (
        <Panel pad={0} style={{ overflow: 'hidden' }}>
            {(onSearch || filters || toolbar) && (
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    {onSearch && (
                        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: t.muted }} />
                            <Input value={searchValue} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} style={{ paddingLeft: 36 }} />
                        </div>
                    )}
                    {filters}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>{toolbar}</div>
                </div>
            )}
            <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                    <thead>
                        <tr>
                            {columns.map((c, i) => (
                                <th key={i} style={{
                                    textAlign: c.align || 'left', padding: '11px 16px', fontSize: 11,
                                    fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                    color: t.muted, background: t.panel2, borderBottom: `1px solid ${t.border}`,
                                    whiteSpace: 'nowrap', width: c.width,
                                }}>{c.header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && Array.from({ length: 5 }).map((_, r) => (
                            <tr key={`s${r}`}>
                                {columns.map((c, i) => (
                                    <td key={i} style={{ padding: '13px 16px', borderBottom: `1px solid ${t.rowBorder}` }}><Skeleton w={i === 0 ? '60%' : '40%'} /></td>
                                ))}
                            </tr>
                        ))}
                        {!loading && rows.map((row, ri) => (
                            <tr key={row[rowKey] ?? ri} className="vq-row"
                                style={{ cursor: row.__onClick ? 'pointer' : 'default' }}
                                onClick={row.__onClick}
                                onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                {columns.map((c, ci) => (
                                    <td key={ci} style={{ padding: '12px 16px', fontSize: 13.5, color: t.sub, borderBottom: `1px solid ${t.rowBorder}`, textAlign: c.align || 'left', whiteSpace: c.nowrap ? 'nowrap' : 'normal' }}>
                                        {c.cell ? c.cell(row) : row[c.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!loading && rows.length === 0 && (
                <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
            )}
            {pagination && pagination.last_page > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 12.5, color: t.muted }}>
                        Page {pagination.current_page} of {pagination.last_page} · {fmtCompact(pagination.total)} total
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={pagination.current_page <= 1} onClick={() => pagination.onPage(pagination.current_page - 1)}>Prev</Button>
                        <Button size="sm" variant="secondary" disabled={pagination.current_page >= pagination.last_page} onClick={() => pagination.onPage(pagination.current_page + 1)}>Next<ChevronRight size={14} /></Button>
                    </div>
                </div>
            )}
        </Panel>
    );
}

/* ───────────────────────── Coming Soon ───────────────────────── */
export function ComingSoon({ title, description, status = 'Coming Soon', children, icon: Icon = Construction, preview }) {
    const t = useT();
    const statusColors = {
        'Coming Soon': BRAND.indigo,
        'Under Development': BRAND.amber,
        'Backend Pending': BRAND.sky,
    };
    const c = statusColors[status] || BRAND.indigo;
    return (
        <div style={{ animation: 'vq-fade .4s ease both' }}>
            <Panel style={{ position: 'relative', overflow: 'hidden', marginBottom: preview ? 22 : 0 }}>
                <div style={{ position: 'absolute', inset: 0, background: GRADIENTS.brandSoft, pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: `${c}1f`, color: c, display: 'grid', placeItems: 'center', border: `1px solid ${c}33`, animation: 'vq-float 4s ease-in-out infinite' }}>
                        <Icon size={28} />
                    </div>
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: t.ink, letterSpacing: '-0.02em' }}>{title}</h2>
                            <Badge color={c} tone="solid">{status}</Badge>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: t.sub, lineHeight: 1.6, maxWidth: 640 }}>{description}</p>
                    </div>
                </div>
                {children && <div style={{ position: 'relative', marginTop: 18 }}>{children}</div>}
            </Panel>
            {preview && (
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 10, right: 0, zIndex: 2 }}>
                        <Badge color={c}>Interface preview</Badge>
                    </div>
                    <div style={{ opacity: 0.96, filter: 'saturate(.96)' }}>{preview}</div>
                </div>
            )}
        </div>
    );
}

/* ───────────────────────── Spinner ───────────────────────── */
export function Spinner({ size = 18, color }) {
    return <Loader2 size={size} style={{ animation: 'vq-spin .8s linear infinite', color }} />;
}

/* ───────────────────────── Select ───────────────────────── */
export function Select({ value, onChange, options, style }) {
    const t = useT();
    return (
        <div style={{ position: 'relative', ...style }}>
            <select value={value} onChange={onChange} style={{
                appearance: 'none', width: '100%', padding: '10px 34px 10px 13px', fontSize: 13.5,
                borderRadius: 11, background: t.inputBg, color: t.ink, fontFamily: 'inherit',
                border: `1px solid ${t.inputBorder}`, outline: 'none', cursor: 'pointer',
            }}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: t.muted, pointerEvents: 'none' }} />
        </div>
    );
}

export { BRAND, GRADIENTS, statusColor };
