import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, usePage, Head, router } from '@inertiajs/react';
import { useTheme } from '@/Contexts/ThemeContext';
import { tokens, BRAND, GRADIENTS } from '@/Platform/theme';
import { ensurePlatformStyles, Badge } from '@/Platform/ui';
import { NAV_GROUPS, flatNav, resolveHref, isActive } from '@/Platform/nav';
import {
    Search, Command, Bell, Sun, Moon, Menu, X, ChevronsLeft, ChevronsRight,
    LogOut, ChevronLeft, AlertTriangle, Mail, ArrowRight, Sparkles,
} from 'lucide-react';
import AiIsland from '@/Components/AiIsland';

const SIDEBAR_W = 264;
const SIDEBAR_COLLAPSED = 76;

export default function PlatformLayout({ children, title = 'Command Center' }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const t = useMemo(() => tokens(isDarkMode), [isDarkMode]);
    const { props } = usePage();
    const { auth, flash } = props;
    const stats = props.stats || {};

    const [collapsed, setCollapsed] = useState(() => (typeof window !== 'undefined' && localStorage.getItem('vq_sidebar') === '1'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    useEffect(() => { ensurePlatformStyles(); }, []);
    useEffect(() => { localStorage.setItem('vq_sidebar', collapsed ? '1' : '0'); }, [collapsed]);

    // ⌘K / Ctrl-K opens the command palette anywhere.
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen((v) => !v);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Close mobile drawer on navigation.
    useEffect(() => {
        const off = router.on('navigate', () => { setMobileOpen(false); setNotifOpen(false); });
        return off;
    }, []);

    const openErrors = stats.open_errors || 0;
    const newContacts = stats.new_contacts || 0;
    const notifCount = openErrors + newContacts;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: t.appBg, color: t.ink, fontFamily: "'Figtree','Inter',system-ui,sans-serif" }}>
            <Head title={`${title} · VenQore HQ`} />

            {/* Ambient aurora background */}
            <div style={{ position: 'fixed', inset: 0, background: t.aurora, pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: 480, height: 480, borderRadius: '50%', background: GRADIENTS.brand, filter: 'blur(120px)', opacity: t.isDark ? 0.10 : 0.06, pointerEvents: 'none', zIndex: 0, animation: 'vq-drift 18s ease-in-out infinite' }} />

            {/* ───────── Sidebar ───────── */}
            <Sidebar
                t={t} collapsed={collapsed} setCollapsed={setCollapsed}
                mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
            />

            {/* ───────── Main column ───────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 40, height: 64,
                    display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px',
                    background: t.shellBg, borderBottom: `1px solid ${t.border}`,
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                }}>
                    <button className="vq-press" onClick={() => setMobileOpen(true)} style={{ ...iconBtn(t), display: 'none' }} data-mobile-menu aria-label="Menu">
                        <Menu size={19} />
                    </button>

                    {/* Dynamic Island Omni-Search */}
                    <div className="flex-1 flex items-center justify-center max-w-xl">
                        <AiIsland />
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Theme toggle */}
                        <button className="vq-press" onClick={toggleTheme} style={iconBtn(t)} aria-label="Toggle theme" title="Toggle theme">
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button className="vq-press" onClick={() => setNotifOpen((v) => !v)} style={{ ...iconBtn(t), ...(notifCount ? { animation: 'vq-pulse-ring 2.2s infinite' } : {}) }} aria-label="Notifications">
                                <Bell size={18} />
                                {notifCount > 0 && (
                                    <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: BRAND.rose, color: '#fff', fontSize: 9.5, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{notifCount}</span>
                                )}
                            </button>
                            {notifOpen && <NotificationsPanel t={t} openErrors={openErrors} newContacts={newContacts} onClose={() => setNotifOpen(false)} />}
                        </div>

                        {/* Profile */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, marginLeft: 2, borderLeft: `1px solid ${t.border}` }}>
                            <div style={{ textAlign: 'right', lineHeight: 1.2 }} className="vq-hide-sm">
                                <div style={{ fontSize: 13, fontWeight: 800, color: t.ink }}>{auth?.user?.name || 'Owner'}</div>
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: BRAND.indigo2 }}>Hashmi Dashboard</div>
                            </div>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: GRADIENTS.brand, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 15, boxShadow: '0 6px 16px -6px rgba(99,102,241,.6)' }}>
                                {(auth?.user?.name?.[0] || 'A').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Body */}
                <main className="vq-scroll" style={{ flex: 1, overflowY: 'auto', padding: '26px clamp(16px, 3vw, 34px) 60px' }}>
                    <div style={{ maxWidth: 1320, margin: '0 auto', animation: 'vq-fade .35s ease both' }}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Command palette */}
            {paletteOpen && <CommandPalette t={t} onClose={() => setPaletteOpen(false)} />}

            {/* Flash toasts */}
            <FlashToasts flash={flash} t={t} />

            {/* responsive css */}
            <style>{responsiveCss(collapsed)}</style>
        </div>
    );
}

/* ─────────────────────────── Sidebar ─────────────────────────── */
function Sidebar({ t, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W;
    return (
        <>
            {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,4,10,.55)', zIndex: 59, backdropFilter: 'blur(3px)' }} className="vq-mobile-only" />}
            <aside data-sidebar className={mobileOpen ? 'vq-open' : ''} style={{
                width, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', zIndex: 60,
                display: 'flex', flexDirection: 'column',
                background: t.isDark ? 'rgba(8,10,18,0.82)' : 'rgba(255,255,255,0.9)',
                borderRight: `1px solid ${t.border}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                transition: 'width .25s cubic-bezier(.2,.8,.2,1)',
            }}>
                {/* Brand */}
                <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '0' : '0 18px', justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 11, background: GRADIENTS.brand, display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px -6px rgba(99,102,241,.6)', flexShrink: 0 }}>
                        <Sparkles size={19} color="#fff" />
                    </div>
                    {!collapsed && (
                        <div style={{ lineHeight: 1.1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em', color: t.ink }}>VENQORE</div>
                            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND.indigo2 }}>Command Center</div>
                        </div>
                    )}
                    <button className="vq-press vq-mobile-only" onClick={() => setMobileOpen(false)} style={{ ...iconBtn(t), marginLeft: 'auto' }} aria-label="Close menu">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="vq-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px 8px' }}>
                    {NAV_GROUPS.map((group) => (
                        <div key={group.key} style={{ marginBottom: 14 }}>
                            {group.label && !collapsed && (
                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.faint, padding: '6px 12px 4px' }}>{group.label}</div>
                            )}
                            {group.label && collapsed && <div style={{ height: 1, background: t.border, margin: '8px 14px' }} />}
                            {group.items.map((item) => (
                                <NavLink key={item.key} item={item} t={t} collapsed={collapsed} />
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div style={{ padding: 10, borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
                    <Link href="/" style={navBase(t, false, collapsed)} className="vq-press">
                        <ChevronLeft size={19} style={{ flexShrink: 0 }} />
                        {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Back to App</span>}
                    </Link>
                    <Link href={route('logout')} method="post" as="button" style={{ ...navBase(t, false, collapsed), width: '100%', color: BRAND.rose }} className="vq-press">
                        <LogOut size={19} style={{ flexShrink: 0 }} />
                        {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Sign out</span>}
                    </Link>
                    <button onClick={() => setCollapsed((v) => !v)} className="vq-press vq-desktop-only" style={{ ...navBase(t, false, collapsed), width: '100%', color: t.muted, marginTop: 2 }}>
                        {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
                        {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Collapse</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

function NavLink({ item, t, collapsed }) {
    const active = item.match ? isActive(item.match) : false;
    const href = resolveHref(item);
    const Icon = item.icon;
    const [hover, setHover] = useState(false);
    return (
        <Link
            href={href}
            title={collapsed ? item.label : undefined}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                ...navBase(t, active, collapsed),
                background: active ? GRADIENTS.brand : (hover ? t.hover : 'transparent'),
                color: active ? '#fff' : (hover ? t.ink : t.sub),
                boxShadow: active ? '0 8px 20px -8px rgba(99,102,241,.6)' : 'none',
                position: 'relative',
            }}
        >
            <Icon size={19} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 600, flex: 1 }}>{item.label}</span>}
            {!collapsed && item.badge === 'new' && <Badge color={BRAND.fuchsia} style={{ fontSize: 9, padding: '1px 6px' }}>NEW</Badge>}
            {!collapsed && item.badge === 'soon' && <span style={{ fontSize: 9, fontWeight: 800, color: t.faint, letterSpacing: '0.04em' }}>SOON</span>}
        </Link>
    );
}

/* ─────────────────────── Command Palette ─────────────────────── */
function CommandPalette({ t, onClose }) {
    const [q, setQ] = useState('');
    const [idx, setIdx] = useState(0);
    const inputRef = useRef(null);
    const items = useMemo(() => flatNav(), []);
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((i) => (i.label + ' ' + (i.desc || '') + ' ' + (i.group || '')).toLowerCase().includes(s));
    }, [q, items]);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 40); }, []);
    useEffect(() => { setIdx(0); }, [q]);

    const go = (item) => { onClose(); router.visit(resolveHref(item)); };

    const onKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (filtered[idx]) go(filtered[idx]); }
        else if (e.key === 'Escape') { onClose(); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'center', paddingTop: '12vh' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.6)', backdropFilter: 'blur(6px)', animation: 'vq-fade-soft .2s ease' }} />
            <div style={{ position: 'relative', width: 'min(620px, 92vw)', height: 'fit-content', maxHeight: '70vh', background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 18, boxShadow: t.shadow, overflow: 'hidden', animation: 'vq-rise .22s ease both', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: `1px solid ${t.border}` }}>
                    <Command size={18} color={BRAND.indigo2} />
                    <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                        placeholder="Jump to anywhere in the Command Center…"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: t.ink, fontSize: 15.5, fontFamily: 'inherit' }} />
                    <kbd style={kbdStyle(t)}>ESC</kbd>
                </div>
                <div className="vq-scroll" style={{ overflowY: 'auto', padding: 8 }}>
                    {filtered.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: t.muted, fontSize: 13.5 }}>No matches for “{q}”.</div>}
                    {filtered.map((item, i) => {
                        const Icon = item.icon;
                        const sel = i === idx;
                        return (
                            <div key={item.key} onMouseEnter={() => setIdx(i)} onClick={() => go(item)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', background: sel ? t.hover : 'transparent' }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: sel ? `${BRAND.indigo}22` : t.inputBg, color: sel ? BRAND.indigo2 : t.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                    <Icon size={17} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: t.ink }}>{item.label}</div>
                                    <div style={{ fontSize: 11.5, color: t.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.desc}</div>
                                </div>
                                <span style={{ fontSize: 10.5, color: t.faint, fontWeight: 700 }}>{item.group}</span>
                                {sel && <ArrowRight size={15} color={BRAND.indigo2} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────── Notifications ─────────────────────── */
function NotificationsPanel({ t, openErrors, newContacts, onClose }) {
    const items = [];
    if (openErrors) items.push({ icon: AlertTriangle, color: BRAND.rose, title: `${openErrors} open error${openErrors > 1 ? 's' : ''}`, sub: 'System health needs attention', href: resolveHrefName('platform.health.errors') });
    if (newContacts) items.push({ icon: Mail, color: BRAND.sky, title: `${newContacts} new contact${newContacts > 1 ? 's' : ''}`, sub: 'Unread contact submissions', href: resolveHrefName('platform.health.contacts') });
    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 320, zIndex: 50, background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 16, boxShadow: t.shadow, overflow: 'hidden', animation: 'vq-rise .2s ease both' }}>
                <div style={{ padding: '13px 16px', borderBottom: `1px solid ${t.border}`, fontSize: 13, fontWeight: 800, color: t.ink }}>Notifications</div>
                {items.length === 0 ? (
                    <div style={{ padding: 26, textAlign: 'center', color: t.muted, fontSize: 13 }}>You're all caught up ✨</div>
                ) : items.map((n, i) => (
                    <a key={i} href={n.href} style={{ display: 'flex', gap: 12, padding: '13px 16px', textDecoration: 'none', borderBottom: i < items.length - 1 ? `1px solid ${t.rowBorder}` : 'none' }} className="vq-row">
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${n.color}1f`, color: n.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><n.icon size={16} /></div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>{n.title}</div>
                            <div style={{ fontSize: 11.5, color: t.muted }}>{n.sub}</div>
                        </div>
                    </a>
                ))}
            </div>
        </>
    );
}

function resolveHrefName(name) {
    try { return window.route(name); } catch { return '#'; }
}

/* ─────────────────────── Flash toasts ─────────────────────── */
function FlashToasts({ flash, t }) {
    const [show, setShow] = useState(false);
    const msg = flash?.success || flash?.error;
    const isError = !!flash?.error;
    useEffect(() => {
        if (msg) { setShow(true); const id = setTimeout(() => setShow(false), 4000); return () => clearTimeout(id); }
    }, [msg]);
    if (!msg || !show) return null;
    return (
        <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 1300, animation: 'vq-rise .3s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 14, background: t.panelSolid, border: `1px solid ${isError ? 'rgba(239,68,68,.4)' : 'rgba(16,185,129,.4)'}`, boxShadow: t.shadow, maxWidth: 380 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: isError ? 'rgba(239,68,68,.16)' : 'rgba(16,185,129,.16)', color: isError ? BRAND.rose : BRAND.emerald, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {isError ? <AlertTriangle size={15} /> : '✓'}
                </div>
                <span style={{ fontSize: 13.5, color: t.ink, fontWeight: 600 }}>{msg}</span>
            </div>
        </div>
    );
}

/* ─────────────────────── style helpers ─────────────────────── */
function navBase(t, active, collapsed) {
    return {
        display: 'flex', alignItems: 'center', gap: 11, padding: collapsed ? '11px 0' : '10px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 12, marginBottom: 2,
        textDecoration: 'none', cursor: 'pointer', border: 'none', background: 'transparent',
        fontFamily: 'inherit', color: t.sub, width: '100%', textAlign: 'left',
    };
}
function iconBtn(t) {
    return { position: 'relative', width: 38, height: 38, borderRadius: 11, background: t.inputBg, border: `1px solid ${t.border}`, color: t.sub, display: 'grid', placeItems: 'center', cursor: 'pointer' };
}
function kbdStyle(t) {
    return { fontSize: 10.5, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: t.inputBg, border: `1px solid ${t.border}`, color: t.muted, fontFamily: 'inherit' };
}
function responsiveCss(collapsed) {
    return `
      .vq-mobile-only{display:none;}
      @media (max-width: 920px){
        [data-sidebar]{position:fixed !important; left:0; top:0; transform:translateX(${'-110%'}); width:${SIDEBAR_W}px !important; box-shadow:0 0 60px rgba(0,0,0,.4);}
        [data-sidebar].vq-open{transform:translateX(0);}
        [data-mobile-menu]{display:grid !important;}
        .vq-desktop-only{display:none !important;}
        .vq-mobile-only{display:grid;}
      }
      @media (min-width: 921px){ .vq-mobile-only{display:none !important;} }
      @media (max-width: 560px){ .vq-hide-sm{display:none !important;} }
    `;
}
