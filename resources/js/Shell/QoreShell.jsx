import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight, BadgeCheck, BarChart3, Barcode, BookOpen, BookText, BookUser,
    Building2, CalendarClock, ChevronDown, Circle, ClipboardCheck, ClipboardList,
    Coins, Factory, FileInput, FileMinus, FileSignature, FileText, GitCompare,
    Globe, Landmark, Layers, LayoutDashboard, LogOut, Menu, Moon, Package,
    Receipt, RefreshCcw, Repeat, ScanLine, Settings, ShoppingBag, ShoppingCart,
    Sparkles, Store, Sun, Truck, User, Users, Utensils, Wallet,
} from 'lucide-react';

import { SHELL, navBehaviour, shellState } from './shellLaw';
import { usePermission } from '@/Hooks/usePermission';
import { applyAppearance } from '@/theme/appearance';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  QoreShell — the V6 app shell (header + sidebar + content)                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Layout Law v2.0, executable:
 *
 *   · Three regions and only three — nav, header, main. Nothing else may
 *     position against the viewport.
 *   · Header is 64px (`header_h == row` — one number, two jobs) and sits
 *     BESIDE the nav, not above it: the sidebar owns the full viewport height.
 *   · ≥1216px the nav PUSHES (grid recomputes, no scrim). Below, it OVERLAYS
 *     (zero width taken, scrim + Esc close). The hamburger is always present.
 *   · On a push screen the hamburger sets a sticky *preference* — demote to a
 *     rail past 1216 and your expanded choice returns when the window grows.
 *
 * Content: the sidebar is DERIVED — `nav` arrives as a shared Inertia prop
 * built by ModuleNavBuilder from the tenant's enabled modules, filtered by
 * status and permission, worded by Terms. Nothing here hardcodes a menu, so
 * the nav can never disagree with the module switches.
 *
 * Visuals: DESIGN-RULES v3.1 §13 (sidebar/button contracts), V6 tokens only.
 * Hover is background + colour — never a transform (§9).
 */

const ICONS = {
    ArrowLeftRight, BadgeCheck, BarChart3, Barcode, BookOpen, BookText, BookUser,
    Building2, CalendarClock, ClipboardCheck, ClipboardList, Coins, Factory,
    FileInput, FileMinus, FileSignature, FileText, GitCompare, Globe, Landmark,
    Layers, Package, Receipt, RefreshCcw, Repeat, ScanLine, ShoppingBag,
    ShoppingCart, Sparkles, Truck, Users, Utensils, Wallet,
};

const NavIcon = ({ name, size = 18 }) => {
    const Cmp = ICONS[name] || Circle;
    return <Cmp size={size} strokeWidth={1.9} aria-hidden="true" />;
};

/** Group letters (config/modules.php) → the section word the sidebar shows. */
const GROUP_LABELS = {
    A: 'Catalog',
    B: 'Sell',
    C: 'Stock',
    D: 'Buy',
    E: 'Make',
    F: 'Money',
    G: 'Grow',
};
const GROUP_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const INTENT_KEY = 'vq-shell-nav-intent';

export default function QoreShell({ children, title = '', actions = null, archetype = 'dashboard' }) {
    const { auth, store, nav = [], appearance } = usePage().props;
    const { hasPerm, isAdmin } = usePermission();

    const user = auth?.user || {};
    const slug = store?.slug;

    /* ── Shell state machine ────────────────────────────────────────────── */

    const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
    const [intent, setIntent] = useState(() => {
        try { return window.localStorage.getItem(INTENT_KEY) || null; } catch { return null; }
    });
    const [open, setOpen] = useState(false); // overlay drawer only
    const [userMenu, setUserMenu] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        let raf = 0;
        const onResize = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const w = window.innerWidth;
                setVw(w);
                // Crossing into push territory discards the drawer flag, so a
                // later shrink cannot resurrect a drawer nobody asked for.
                if (navBehaviour(w) === 'push') setOpen(false);
            });
        };
        window.addEventListener('resize', onResize);
        return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
    }, []);

    // The stale-open guard lives in shellState(): a drawer `open` flag is
    // ignored the moment the screen becomes push-capable, so no effect needs
    // to chase the resize — the derived state simply stops reading it.
    const state = shellState(vw, archetype, { intent, open });

    // Esc closes the top layer: the drawer first, then the user menu.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (open) setOpen(false);
            else if (userMenu) setUserMenu(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, userMenu]);

    // Click-away for the user menu.
    useEffect(() => {
        if (!userMenu) return undefined;
        const onDown = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false);
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [userMenu]);

    const onHamburger = useCallback(() => {
        if (state.behaviour === 'push') {
            // Sticky intent, not a temporary state.
            const next = state.nav === 'expanded' ? 'rail' : 'expanded';
            setIntent(next);
            try { window.localStorage.setItem(INTENT_KEY, next); } catch { /* private mode */ }
        } else {
            setOpen((o) => !o);
        }
    }, [state.behaviour, state.nav]);

    /* ── Theme toggle ───────────────────────────────────────────────────── */

    // Seeded from what is actually painted (the class the appearance runtime
    // sets), then owned locally: the icon must flip on the click, not when the
    // server round-trip happens to come back — and on a store-less page, or
    // before ziggy boots, there is no round-trip at all.
    const [isDark, setIsDark] = useState(() => (typeof document !== 'undefined'
        ? document.documentElement.classList.contains('dark')
        : appearance?.mode === 'dark'));

    const toggleTheme = useCallback(() => {
        const nextMode = isDark ? 'light' : 'dark';
        setIsDark(!isDark);

        // Kill every transition for one frame so the swap is instant —
        // otherwise colours bound to theme properties stay painted at the old
        // theme's resolved values mid-transition (DESIGN-RULES §9).
        const root = document.documentElement;
        root.classList.add('vq-theming');
        applyAppearance({ ...appearance, mode: nextMode });
        requestAnimationFrame(() => root.classList.remove('vq-theming'));

        // Persist server-side; the shared `appearance` prop carries it forward.
        if (slug && typeof route === 'function' && route().has('store.appearance.update')) {
            router.post(route('store.appearance.update', { store_slug: slug }), { mode: nextMode }, {
                preserveScroll: true,
                preserveState: true,
                only: ['appearance'],
            });
        }
    }, [isDark, appearance, slug]);

    /* ── Nav content ────────────────────────────────────────────────────── */

    const sections = useMemo(() => {
        const byGroup = new Map();
        for (const item of nav) {
            const g = GROUP_ORDER.includes(item.group) ? item.group : 'G';
            if (!byGroup.has(g)) byGroup.set(g, []);
            byGroup.get(g).push(item);
        }
        return GROUP_ORDER
            .filter((g) => byGroup.has(g))
            .map((g) => ({ key: g, label: GROUP_LABELS[g], items: byGroup.get(g) }));
    }, [nav]);

    const href = useCallback((name) => {
        try {
            if (typeof route === 'function' && route().has(name)) {
                return route(name, slug ? { store_slug: slug } : {});
            }
        } catch { /* ziggy not booted (tests) */ }
        return '#';
    }, [slug]);

    // A nav item is current for its own route and its CHILDREN — never for its
    // siblings. Stripping the last segment turns `store.pos` into `store.*`,
    // which is true on every page in the store, and the sidebar then lights up
    // two items at once.
    const isCurrent = useCallback((name) => {
        try {
            if (typeof route !== 'function') return false;
            return route().current(name) || route().current(`${name}.*`);
        } catch { return false; }
    }, []);

    const dashboardActive = isCurrent('store.dashboard') || isCurrent('store.home');
    const collapsed = state.behaviour === 'push' && state.nav === 'rail';
    const navVisible = state.behaviour === 'push' ? state.nav !== 'hidden' : state.overlayOpen;
    const canAdmin = isAdmin || hasPerm('admin.settings_manage');

    const navWidthPx = state.behaviour === 'overlay'
        ? state.overlayWidth
        : (state.nav === 'expanded' ? SHELL.navExpanded : state.nav === 'rail' ? Math.round(state.navPx) : 0);

    /* ── Render ─────────────────────────────────────────────────────────── */

    const navItem = (item, active) => (
        <Link
            key={`${item.key}:${item.route}`}
            href={href(item.route)}
            className={`vqs-item${active ? ' is-active' : ''}${collapsed ? ' is-collapsed' : ''}`}
            title={collapsed ? item.label : undefined}
            aria-current={active ? 'page' : undefined}
            onClick={() => { if (state.behaviour === 'overlay') setOpen(false); }}
        >
            <span className="vqs-item-ic"><NavIcon name={item.icon} /></span>
            {!collapsed && <span className="vqs-item-lbl">{item.label}</span>}
            <span className="vqs-item-rule" aria-hidden="true" />
        </Link>
    );

    return (
        <div
            className="vqs-shell"
            data-nav={state.behaviour === 'push' ? state.nav : 'hidden'}
            data-behaviour={state.behaviour}
            data-open={state.overlayOpen ? 'true' : 'false'}
            style={{
                '--vqs-nav-w': `${state.behaviour === 'push' ? Math.round(state.navPx) : 0}px`,
                '--vqs-drawer-w': `${state.overlayWidth || SHELL.navExpanded}px`,
                '--vqs-margin': `${Math.round(state.margin)}px`,
                '--vqs-header-h': `${SHELL.headerHeight}px`,
            }}
        >
            <style>{SHELL_CSS}</style>

            {/* ── Sidebar ── */}
            <aside
                className={`vqs-nav${state.behaviour === 'overlay' ? ' vqs-nav--overlay' : ''}`}
                aria-label="Main navigation"
                aria-hidden={!navVisible}
                style={{ width: state.behaviour === 'overlay' ? `${navWidthPx}px` : undefined }}
            >
                {/* Brand head — mirrors the header height exactly. */}
                <div className="vqs-navhead">
                    <span className="vqs-logo" aria-hidden="true">V</span>
                    {(!collapsed || state.behaviour === 'overlay') && (
                        <span className="vqs-brand">
                            <span className="vqs-brand-name">VenQore</span>
                            {store?.name && <span className="vqs-brand-store">{store.name}</span>}
                        </span>
                    )}
                </div>

                <nav className="vqs-navlist">
                    {navItem(
                        { key: 'dashboard', route: 'store.dashboard', label: 'Dashboard', icon: '__dashboard' },
                        dashboardActive,
                    )}

                    {sections.map((section) => (
                        <div key={section.key} className="vqs-section">
                            {!collapsed && <div className="vqs-section-lbl">{section.label}</div>}
                            {collapsed && <div className="vqs-section-rule" aria-hidden="true" />}
                            {section.items.map((item) => navItem(item, isCurrent(item.route)))}
                        </div>
                    ))}
                </nav>

                {canAdmin && (
                    <div className="vqs-navfoot">
                        {navItem(
                            { key: 'admin', route: 'store.admin.home', label: 'Admin Panel', icon: '__settings' },
                            isCurrent('store.admin.home'),
                        )}
                    </div>
                )}
            </aside>

            {/* ── Scrim (overlay mode only) ── */}
            <div
                className="vqs-scrim"
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* ── Header ── */}
            <header className="vqs-header">
                <button
                    type="button"
                    className="vqs-iconbtn"
                    onClick={onHamburger}
                    aria-label={state.behaviour === 'overlay'
                        ? (state.overlayOpen ? 'Close navigation' : 'Open navigation')
                        : (state.nav === 'expanded' ? 'Collapse navigation' : 'Expand navigation')}
                    aria-expanded={state.behaviour === 'overlay' ? state.overlayOpen : state.nav === 'expanded'}
                >
                    <Menu size={18} strokeWidth={2} />
                </button>

                <h1 className="vqs-title">{title}</h1>

                <div className="vqs-spacer" />

                {actions && <div className="vqs-actions">{actions}</div>}

                <button
                    type="button"
                    className="vqs-iconbtn"
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
                </button>

                <div className="vqs-usermenu" ref={userMenuRef}>
                    <button
                        type="button"
                        className="vqs-userbtn"
                        onClick={() => setUserMenu((v) => !v)}
                        aria-haspopup="menu"
                        aria-expanded={userMenu}
                    >
                        <span className="vqs-avatar" aria-hidden="true">
                            {user.avatar_initial || (user.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                    </button>

                    {userMenu && (
                        <div className="vqs-menu" role="menu">
                            <div className="vqs-menu-id">
                                <span className="vqs-menu-name">{user.name}</span>
                                <span className="vqs-menu-mail">{user.email}</span>
                            </div>
                            <Link className="vqs-menu-item" role="menuitem" href={href('profile.edit')} >
                                <User size={14} /> <span>Profile</span>
                            </Link>
                            <Link className="vqs-menu-item" role="menuitem" href={href('hub')}>
                                <Store size={14} /> <span>My stores</span>
                            </Link>
                            {canAdmin && (
                                <Link className="vqs-menu-item" role="menuitem" href={href('store.admin.home')}>
                                    <Settings size={14} /> <span>Admin Panel</span>
                                </Link>
                            )}
                            <hr className="vqs-menu-sep" />
                            <Link
                                className="vqs-menu-item vqs-menu-item--danger"
                                role="menuitem"
                                href={typeof route === 'function' ? route('logout') : '#'}
                                method="post"
                                as="button"
                            >
                                <LogOut size={14} /> <span>Log out</span>
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* ── Content ── */}
            <main className="vqs-main">{children}</main>
        </div>
    );
}

/* Two pseudo-icons the nav prop never sends. */
ICONS.__dashboard = LayoutDashboard;
ICONS.__settings = Settings;

/**
 * The shell's own CSS. Geometry numbers arrive as inline custom properties
 * (`--vqs-*`, written by the engine); every colour, radius, duration and
 * easing is a V6 token. Hover: background + colour only, never a transform.
 */
const SHELL_CSS = `
.vqs-shell {
    display: grid;
    grid-template-columns: var(--vqs-nav-w) 1fr;
    grid-template-rows: var(--vqs-header-h) 1fr;
    grid-template-areas: "nav header" "nav main";
    min-height: 100dvh;
    background: var(--vq-bg);
    color: var(--vq-text);
    font-family: var(--vq-font-sans);
}
.vqs-shell[data-behaviour="overlay"] {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "main";
}

/* ── Nav ── */
.vqs-nav {
    grid-area: nav;
    position: sticky;
    top: 0;
    height: 100dvh;
    z-index: var(--vq-z-rail);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--vq-surface);
    border-right: 1px solid var(--vq-line);
    transition: width var(--vq-dur-3) var(--vq-ease-out);
}
.vqs-nav--overlay {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(-101%);
    box-shadow: none;
    transition: transform var(--vq-dur-3) var(--vq-ease-out);
}
.vqs-shell[data-open="true"] .vqs-nav--overlay {
    transform: none;
    box-shadow: var(--vq-elev-3);
}
@media (prefers-reduced-motion: reduce) {
    .vqs-nav, .vqs-nav--overlay, .vqs-scrim { transition: none; }
}

.vqs-navhead {
    flex: 0 0 var(--vqs-header-h);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    border-bottom: 1px solid var(--vq-line);
    min-width: 0;
}
.vqs-logo {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--vq-r-sm);
    background: var(--vq-accent-fill);
    color: var(--vq-on-accent, #fff);
    font-family: var(--vq-font-display);
    font-weight: var(--vq-fw-bold);
    font-size: 17px;
}
.vqs-brand { display: flex; flex-direction: column; min-width: 0; }
.vqs-brand-name {
    font-family: var(--vq-font-display);
    font-weight: var(--vq-fw-bold);
    font-size: 15px;
    line-height: 1.15;
    color: var(--vq-text);
    white-space: nowrap;
}
.vqs-brand-store {
    font-size: var(--vq-fs-caption);
    color: var(--vq-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.vqs-navlist {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.vqs-navfoot {
    flex: 0 0 auto;
    padding: 8px;
    border-top: 1px solid var(--vq-line);
}
.vqs-section { margin-top: 12px; display: flex; flex-direction: column; gap: 2px; }
.vqs-section-lbl {
    font-family: var(--vq-font-mono);
    font-size: var(--vq-fs-eyebrow);
    letter-spacing: var(--vq-ls-eyebrow);
    text-transform: uppercase;
    font-weight: var(--vq-fw-medium);
    color: var(--vq-text-3);
    padding: 6px 10px 4px;
    white-space: nowrap;
}
.vqs-section-rule { height: 1px; margin: 6px 10px; background: var(--vq-line); }

/* Sidebar item — DESIGN-RULES §13: 40px, r-md, active = accent-quiet bg +
   3px accent left rule + accent-text at 600. Hover: bg + colour only. */
.vqs-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 10px;
    border-radius: var(--vq-r-md);
    color: var(--vq-text-2);
    font-size: var(--vq-fs-small);
    font-weight: var(--vq-fw-medium);
    text-decoration: none;
    white-space: nowrap;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out);
}
.vqs-item:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqs-item.is-active {
    background: var(--vq-accent-quiet);
    color: var(--vq-accent-text);
    font-weight: var(--vq-fw-semi);
}
.vqs-item-rule {
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: var(--vq-r-full);
    background: transparent;
}
.vqs-item.is-active .vqs-item-rule { background: var(--vq-accent); }
.vqs-item-ic { flex: 0 0 22px; display: inline-flex; justify-content: center; }
.vqs-item-lbl { overflow: hidden; text-overflow: ellipsis; }
.vqs-item.is-collapsed { justify-content: center; padding: 0; }
.vqs-item.is-collapsed .vqs-item-ic { flex: 0 0 auto; }
.vqs-item:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }

/* ── Scrim ── */
.vqs-scrim {
    position: fixed;
    inset: 0;
    z-index: calc(var(--vq-z-rail) - 1);
    background: var(--vq-scrim, rgb(9 11 20 / .56));
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--vq-dur-3) var(--vq-ease-out);
}
.vqs-shell[data-open="true"] .vqs-scrim { opacity: 1; pointer-events: auto; }

/* ── Header ── */
.vqs-header {
    grid-area: header;
    position: sticky;
    top: 0;
    height: var(--vqs-header-h);
    z-index: var(--vq-z-nav);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    background: var(--vq-surface);
    border-bottom: 1px solid var(--vq-line);
}
.vqs-title {
    margin: 0;
    font-family: var(--vq-font-display);
    font-weight: var(--vq-fw-bold);
    font-size: 17px;
    letter-spacing: -0.01em;
    color: var(--vq-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}
.vqs-spacer { flex: 1 1 auto; }
.vqs-actions { display: flex; align-items: center; gap: 8px; }

.vqs-iconbtn {
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--vq-r-sm);
    background: transparent;
    color: var(--vq-text-2);
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out);
}
.vqs-iconbtn:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqs-iconbtn:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }

/* ── User menu ── */
.vqs-usermenu { position: relative; }
.vqs-userbtn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 36px;
    padding: 0 6px 0 3px;
    border: none;
    border-radius: var(--vq-r-full);
    background: transparent;
    color: var(--vq-text-3);
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out);
}
.vqs-userbtn:hover { background: var(--vq-sunken); }
.vqs-userbtn:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }
.vqs-avatar {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--vq-r-full);
    background: var(--vq-accent-quiet);
    color: var(--vq-accent-text);
    font-size: var(--vq-fs-caption);
    font-weight: var(--vq-fw-semi);
}
.vqs-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    min-width: 220px;
    z-index: var(--vq-z-dropdown);
    background: var(--vq-raised, var(--vq-surface));
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-lg);
    box-shadow: var(--vq-elev-3);
    padding: 6px;
}
.vqs-menu-id {
    display: flex;
    flex-direction: column;
    padding: 8px 10px 10px;
    border-bottom: 1px solid var(--vq-line);
    margin-bottom: 4px;
}
.vqs-menu-name { font-size: var(--vq-fs-small); font-weight: var(--vq-fw-semi); color: var(--vq-text); }
.vqs-menu-mail { font-size: var(--vq-fs-caption); color: var(--vq-text-3); overflow: hidden; text-overflow: ellipsis; }
.vqs-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border: none;
    border-radius: var(--vq-r-md);
    background: none;
    color: var(--vq-text-2);
    font-size: var(--vq-fs-small);
    font-weight: var(--vq-fw-medium);
    font-family: var(--vq-font-sans);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out);
}
.vqs-menu-item:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqs-menu-item--danger { color: var(--vq-danger); }
.vqs-menu-item--danger:hover { background: var(--vq-danger-bg); color: var(--vq-danger); }
.vqs-menu-sep { height: 1px; border: none; margin: 4px 6px; background: var(--vq-line); }

/* ── Main ── */
.vqs-main {
    grid-area: main;
    min-width: 0;
    padding: var(--vqs-margin);
}
`;
