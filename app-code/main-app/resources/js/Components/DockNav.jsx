import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lock, Monitor, UtensilsCrossed, ArrowUpRight } from 'lucide-react';
import { useNavLabel, useTermText } from '@/lib/terms';
import { isReportLocked } from '@/lib/reportPlanMap';
import { SubIcon } from '@/lib/navIcons';
import { subItemRoute } from '@/lib/navRoutes';

/**
 * DockNav — the sidebar's modules as a floating glass dock (opt-in: <OneGlanceLayout dock>).
 *
 * It owns NO menu data. OneGlanceLayout hands it the same, already permission-
 * and module-filtered `menuItems` the sidebar renders, and sub-page routes come
 * from lib/navRoutes (also used by SidebarItem). The sidebar is untouched.
 *
 *   hover        → the whole dock opens up and every tab shows its name
 *   click        → a panel rises above the dock with the module's pages
 *   double-click → go straight to the module's main page
 *   centre       → POS (or FOH for restaurant stores): icon only, never moves
 *
 * Symmetry: the bar is a 3-column grid (1fr auto 1fr). Tabs left of the centre
 * button grow leftwards, tabs right of it grow rightwards, so the centre button
 * stays exactly where it is.
 */

const TAB_W = 40;          // collapsed tab (icon cell)
const ICON = 18;
const PAD_L = 11;
const LABEL_GAP = 7;
const PAD_R = 14;
const COL_W = 200;         // one group column in the panel
const SPRING = { type: 'spring', duration: 0.5, bounce: 0.06 };
const GLASS = 'bg-surface border border-line shadow-xl';
const PANEL_SPRING = { type: 'spring', duration: 0.42, bounce: 0.08 };

function resolveLink(sub, routeParams, planFeatures, auth, store) {
    const label = typeof sub === 'object' ? sub.label : sub;
    const base = (typeof sub === 'object' && sub.route) ? sub.route : subItemRoute(label, auth);
    if (!base) return { label, disabled: true };
    if (label.includes('Coming Soon')) return { label, disabled: true };
    const rn = (routeParams?.store_slug && !base.startsWith('store.')) ? `store.${base}` : base;
    if (!window.route().has(rn)) return null;
    const locked = isReportLocked(rn, planFeatures);
    const params = label === 'Approval Policies' ? { ...(routeParams || {}), tab: 'approvals' } : (routeParams || {});
    const href = locked
        ? window.route('store.billing', { store_slug: store?.slug })
        : window.route(rn, params);
    return { label, href, locked };
}

export default function DockNav({ items, isItemActive, pos, vertical = false, footer = null, labelMode = 'beside' }) {
    const { store, planFeatures = {}, auth } = usePage().props;
    const tt = useTermText();
    const navLabel = useNavLabel();
    const reduce = useReducedMotion();

    const rootRef = useRef(null);
    const barRef = useRef(null);
    const labelRefs = useRef({});
    const leaveTimer = useRef(null);
    const clickTimer = useRef(null);
    const tabRefs = useRef({});
    const rafRef = useRef(null);
    
    const [labelW, setLabelW] = useState({});
    const [hoverKey, setHoverKey] = useState(null);
    const [openKey, setOpenKey] = useState(null);
    const [barHover, setBarHover] = useState(false);
    const beside = vertical && labelMode === 'beside';
    const RAIL_W = beside ? 60 : 84;
    const railOpen = beside && barHover && !openKey;
    const [panelPos, setPanelPos] = useState(null);

    const entries = items.map((item) => {
        const params = item.routeParams || { store_slug: store?.slug };
        const groups = (item.subs || [])
            .map((g) => ({
                group: g.group,
                links: (g.items || []).filter(Boolean).map((s) => resolveLink(s, params, planFeatures, auth, store)).filter(Boolean),
            }))
            .filter((g) => g.links.length > 0);
        const linkCount = groups.reduce((n, g) => n + g.links.filter((l) => !l.disabled).length, 0);
        return {
            key: item.name,
            label: tt(item.name),
            icon: item.icon,
            badge: item.badgeCount || 0,
            href: item.route && window.route().has(item.route) ? window.route(item.route, params) : null,
            groups,
            hasPanel: linkCount > 1,
            item,
        };
    });

    // Measure each label once (and again when fonts / terminology change).
    const sig = entries.map((e) => e.label).join('|');
    const measure = useCallback(() => {
        const next = {};
        Object.entries(labelRefs.current).forEach(([k, el]) => { if (el) next[k] = Math.ceil(el.offsetWidth); });
        setLabelW((prev) => {
            const a = Object.keys(prev), b = Object.keys(next);
            return a.length === b.length && b.every((k) => prev[k] === next[k]) ? prev : next;
        });
    }, []);
    useLayoutEffect(() => { measure(); }, [sig, measure]);
    useEffect(() => { document.fonts?.ready?.then(measure); }, [measure]);

    const expandedWidth = (key) => PAD_L + ICON + LABEL_GAP + (labelW[key] || 0) + PAD_R;

    const mid = Math.ceil(entries.length / 2);
    const leftEntries = pos ? entries.slice(0, mid) : entries;
    const rightEntries = pos ? entries.slice(mid) : [];
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const activeKey = hoverKey ?? openKey;
    const isExpanded = (key) => activeKey === key;
    const activeSide = leftEntries.some((e) => e.key === activeKey) ? -1 : rightEntries.some((e) => e.key === activeKey) ? 1 : 0;
    const growth = activeKey ? expandedWidth(activeKey) - TAB_W : 0;
    const shiftX = (activeSide * growth) / 2;

    const closePanel = useCallback(() => { setOpenKey(null); setPanelPos(null); cancelAnimationFrame(rafRef.current); }, []);

    useEffect(() => {
        if (!openKey) return;
        const onDown = (e) => { if (!rootRef.current?.contains(e.target)) closePanel(); };
        const onKey = (e) => { if (e.key === 'Escape') closePanel(); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
    }, [openKey, closePanel]);

    const enterBar = () => { clearTimeout(leaveTimer.current); setBarHover(true); };
    const leaveBar = () => { clearTimeout(leaveTimer.current); leaveTimer.current = setTimeout(() => { setHoverKey(null); setBarHover(false); }, 120); };

    // Keep the panel centred on its tab while the dock is still opening up.
    const trackPanel = (key) => {
        cancelAnimationFrame(rafRef.current);
        const t0 = performance.now();
        const step = () => {
            const el = tabRefs.current[key];
            const bar = barRef.current;
            if (el && bar) {
                const r = el.getBoundingClientRect();
                const b = bar.getBoundingClientRect();
                setPanelPos(vertical
                    ? { top: r.top, left: 8 + RAIL_W + 8 }
                    : { center: r.left + r.width / 2, bottom: window.innerHeight - b.top + 8 });
            }
            if (performance.now() - t0 < 700) rafRef.current = requestAnimationFrame(step);
        };
        step();
    };

    const goTo = (entry) => { closePanel(); if (entry.href) router.visit(entry.href); };

    const onTab = (entry) => {
        clearTimeout(clickTimer.current);
        if (!entry.hasPanel) { goTo(entry); return; }
        if (openKey === entry.key) { closePanel(); return; }
        // Wait a beat: a double-click should go straight to the page, not flash the panel first.
        clickTimer.current = setTimeout(() => { setOpenKey(entry.key); trackPanel(entry.key); }, 200);
    };
    const onTabDouble = (entry) => { clearTimeout(clickTimer.current); goTo(entry); };

    const openEntry = entries.find((e) => e.key === openKey);
    const cols = openEntry ? Math.min(Math.max(openEntry.groups.length, 1), vertical ? 4 : 3) : 1;
    const panelW = Math.min(cols * COL_W + (cols - 1) * 8 + 16, vw - 16);
    const panelLeft = panelPos ? (vertical ? panelPos.left : Math.min(Math.max(panelPos.center - panelW / 2, 8), vw - panelW - 8)) : 0;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const panelTop = panelPos && vertical ? Math.max(8, Math.min(panelPos.top, vh - 260)) : 0;

    const renderTab = (entry, dist) => {
        const Icon = entry.icon;
        const active = isItemActive(entry.item);
        const expanded = isExpanded(entry.key);
        return (
            <motion.button
                key={entry.key}
                ref={(el) => { tabRefs.current[entry.key] = el; }}
                id={entry.key === 'Stock' ? 'tour-sidebar-stock' : `tour-sidebar-${String(entry.key).toLowerCase()}`}
                type="button"
                aria-label={entry.label}
                aria-haspopup={entry.hasPanel ? 'menu' : undefined}
                aria-expanded={entry.hasPanel ? openKey === entry.key : undefined}
                initial={false}
                animate={{ width: expanded ? expandedWidth(entry.key) : TAB_W }}
                transition={reduce ? { duration: 0 } : { ...SPRING, delay: expanded ? dist * 0.015 : 0 }}
                onMouseEnter={() => setHoverKey(entry.key)}
                onFocus={() => { enterBar(); setHoverKey(entry.key); }}
                onClick={() => onTab(entry)}
                onDoubleClick={() => onTabDouble(entry)}
                style={{ paddingLeft: PAD_L }}
                className={`relative shrink-0 h-10 flex items-center justify-start overflow-hidden rounded-[12px] text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60
                    ${active ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
                        : openKey === entry.key || hoverKey === entry.key ? 'bg-interactive-hover text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
                <Icon size={ICON} className="shrink-0" />
                <motion.span
                    initial={false}
                    animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6, filter: expanded ? 'blur(0px)' : 'blur(3px)' }}
                    transition={{ duration: expanded ? 0.3 : 0.1, delay: expanded ? 0.08 + dist * 0.015 : 0 }}
                    style={{ marginLeft: LABEL_GAP }}
                    className="whitespace-nowrap"
                >
                    {entry.label}
                </motion.span>
                {entry.badge > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-4 text-center">
                        {entry.badge > 99 ? '99+' : entry.badge}
                    </span>
                )}
            </motion.button>
        );
    };

    const PosIcon = pos?.foh ? UtensilsCrossed : Monitor;

    const renderVTab = (entry) => {
        const Icon = entry.icon;
        const active = isItemActive(entry.item);
        const hot = hoverKey === entry.key || openKey === entry.key;
        const tone = active ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400'
            : hot ? 'bg-interactive-hover text-ink' : 'text-ink-muted hover:text-ink';
        const common = {
            key: entry.key,
            ref: (el) => { tabRefs.current[entry.key] = el; },
            id: entry.key === 'Stock' ? 'tour-sidebar-stock' : `tour-sidebar-${String(entry.key).toLowerCase()}`,
            type: 'button',
            'aria-label': entry.label,
            'aria-haspopup': entry.hasPanel ? 'menu' : undefined,
            'aria-expanded': entry.hasPanel ? openKey === entry.key : undefined,
            onMouseEnter: () => setHoverKey(entry.key),
            onFocus: () => { enterBar(); setHoverKey(entry.key); },
            onClick: () => onTab(entry),
            onDoubleClick: () => onTabDouble(entry),
        };
        const badge = entry.badge > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-4 text-center">
                {entry.badge > 99 ? '99+' : entry.badge}
            </span>
        );
        if (beside) {
            return (
                <button {...common} className={`relative shrink-0 w-full h-10 flex items-center justify-start pl-[13px] overflow-hidden rounded-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60 ${tone}`}>
                    <Icon size={ICON} className="shrink-0" />
                    <span style={{ opacity: railOpen ? 1 : 0, transform: railOpen ? 'none' : 'translateX(-6px)', transition: 'opacity 180ms ease, transform 180ms ease', transitionDelay: railOpen ? '90ms' : '0ms' }} className="ml-3 whitespace-nowrap text-sm font-semibold">
                        {entry.label}
                    </span>
                    {badge}
                </button>
            );
        }
        return (
            <motion.button
                {...common}
                initial={false}
                animate={{ height: hot ? 62 : 44 }}
                transition={reduce ? { duration: 0 } : SPRING}
                className={`relative shrink-0 w-[68px] flex flex-col items-center justify-start pt-[12px] overflow-hidden rounded-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500/60 ${tone}`}
            >
                <Icon size={ICON} className="shrink-0" />
                <motion.span
                    initial={false}
                    animate={{ opacity: hot ? 1 : 0, y: hot ? 0 : -4 }}
                    transition={{ duration: hot ? 0.22 : 0.08, delay: hot ? 0.06 : 0 }}
                    className="mt-1 max-w-[76px] truncate text-[11px] leading-3 font-semibold"
                >
                    {entry.key === 'Administration' ? 'Admin' : entry.label}
                </motion.span>
                {badge}
            </motion.button>
        );
    };

    return (
        <div ref={rootRef}>
            {/* Panel */}
            <AnimatePresence>
                {openEntry && panelPos && (
                    <div
                        key={openEntry.key}
                        className="fixed z-50"
                        style={vertical ? { left: panelLeft, top: panelTop, width: panelW } : { left: panelLeft, bottom: panelPos.bottom, width: panelW }}
                    >
                        <motion.div
                            initial={reduce ? { opacity: 0 } : { opacity: 0, x: vertical ? -12 : 0, y: vertical ? 0 : 12, scale: 0.97, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98, filter: 'blur(3px)', transition: { duration: 0.1 } }}
                            transition={PANEL_SPRING}
                            style={vertical ? { transformOrigin: '0% 20px', maxHeight: `calc(100vh - ${panelTop}px - 12px)` } : { transformOrigin: `${panelPos.center - panelLeft}px 100%`, maxHeight: 'calc(100vh - 140px)' }}
                            className={`overflow-y-auto overscroll-contain rounded-[14px] p-2 ${GLASS}`}
                            role="menu"
                        >
                            <div className="flex items-center justify-between gap-2 px-2.5 pt-1.5 pb-2">
                                <span className="text-sm font-bold text-ink">{openEntry.label}</span>
                                {openEntry.href && (
                                    <Link href={openEntry.href} onClick={closePanel} className="h-7 px-2.5 rounded-[12px] text-xs font-semibold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 flex items-center gap-1 transition-colors">
                                        Open <ArrowUpRight size={12} />
                                    </Link>
                                )}
                            </div>
                            <div className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                                {openEntry.groups.map((g) => (
                                    <div key={g.group} className="pb-1">
                                        <p className="px-2.5 pt-1.5 pb-1 text-2xs font-bold uppercase tracking-wider text-ink-muted">{g.group}</p>
                                        {g.links.map((l) => l.disabled ? (
                                            <span key={l.label} className="flex items-center gap-2 h-8 px-2.5 text-sm text-ink-muted/70 cursor-not-allowed"><SubIcon label={l.label} />{navLabel(l.label)}</span>
                                        ) : (
                                            <Link
                                                key={l.label}
                                                href={l.href}
                                                role="menuitem"
                                                onClick={closePanel}
                                                id={l.label === 'Products' ? 'tour-sidebar-products' : (l.label === 'Purchases' ? 'tour-sidebar-purchases' : undefined)}
                                                className="flex items-center justify-between gap-2 h-8 px-2.5 rounded-[12px] text-sm text-ink hover:bg-interactive-hover hover:text-brand-700 dark:hover:text-brand-400 transition-colors"
                                            >
                                                <span className="flex items-center gap-2 min-w-0"><SubIcon label={l.label} className="text-ink-muted" /><span className="truncate">{navLabel(l.label)}</span></span>
                                                {l.locked && <Lock size={12} className="shrink-0 text-amber-500" />}
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Vertical rail: compact, vertically centred, floats over the page */}
            {vertical && (
                <>
                    <div className="fixed left-2 inset-y-0 z-40 flex items-center pointer-events-none">
                        <motion.div
                            ref={barRef}
                            initial={reduce ? false : { x: -24, opacity: 0 }}
                            animate={{ x: 0, opacity: 1, width: railOpen ? 196 : RAIL_W }}
                            transition={{ x: PANEL_SPRING, opacity: { duration: 0.25 }, width: reduce ? { duration: 0 } : SPRING }}
                            onMouseEnter={enterBar}
                            onMouseLeave={leaveBar}
                            className={`pointer-events-auto flex flex-col items-center gap-1 p-2 rounded-[14px] max-h-[calc(100vh-140px)] ${GLASS}`}
                        >
                            <div className="min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center gap-1 [scrollbar-width:none]">
                                {entries.map((e) => renderVTab(e))}
                            </div>
                            {pos && (
                                <Link
                                    href={pos.href}
                                    id="tour-dock-pos"
                                    aria-label={pos.label}
                                    title={pos.label}
                                    className={`mt-1 shrink-0 rounded-[14px] bg-brand-600 hover:bg-brand-500 active:scale-95 text-white flex items-center overflow-hidden shadow-lg ring-1 ring-white/20 transition-all ${beside ? 'h-[44px] w-full justify-start pl-[12px]' : 'h-[52px] w-[52px] justify-center'}`}
                                >
                                    <PosIcon size={beside ? 20 : 24} className="shrink-0" />
                                    {beside && (
                                        <span style={{ opacity: railOpen ? 1 : 0, transition: 'opacity 180ms ease', transitionDelay: railOpen ? '90ms' : '0ms' }} className="ml-3 whitespace-nowrap text-sm font-bold">
                                            {String(pos.label).startsWith('Close') ? pos.label : `Open ${pos.label}`}
                                        </span>
                                    )}
                                </Link>
                            )}
                        </motion.div>
                    </div>
                    {footer && (
                        <motion.div className="fixed bottom-2 z-40" initial={false} animate={{ left: 8 + RAIL_W / 2 - 22 }} transition={reduce ? { duration: 0 } : SPRING}>
                            {footer}
                        </motion.div>
                    )}
                </>
            )}

            {/* Bar */}
            {!vertical && <div className="fixed inset-x-0 bottom-2 z-40 flex justify-center px-2 pointer-events-none">
                <motion.div
                    ref={barRef}
                    initial={reduce ? false : { y: 28, opacity: 0 }}
                    animate={{ y: 0, x: reduce ? 0 : shiftX, opacity: 1 }}
                    transition={{ y: PANEL_SPRING, x: SPRING, opacity: { duration: 0.25 } }}
                    onMouseEnter={enterBar}
                    onMouseLeave={leaveBar}
                    onBlur={(e) => { if (!barRef.current?.contains(e.relatedTarget)) leaveBar(); }}
                    className={`pointer-events-auto relative flex items-center gap-1 p-2 rounded-[14px] ${GLASS}`}
                >
                    <div className="flex items-center justify-end gap-1">
                        {leftEntries.map((e, i) => renderTab(e, leftEntries.length - 1 - i))}
                    </div>
                    {pos && (
                        <Link
                            href={pos.href}
                            id="tour-dock-pos"
                            aria-label={pos.label}
                            title={pos.label}
                            className="group relative mx-2 -my-2 h-[52px] w-[52px] shrink-0 rounded-[14px] bg-brand-600 hover:bg-brand-500 active:scale-95 text-white flex items-center justify-center shadow-lg ring-1 ring-white/20 transition-all"
                        >
                            <PosIcon size={24} />
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[12px] px-2.5 py-1 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-ink/90">
                                {pos.label}
                            </span>
                        </Link>
                    )}
                    {pos && (
                        <div className="flex items-center justify-start gap-1">
                            {rightEntries.map((e, i) => renderTab(e, i))}
                        </div>
                    )}
                </motion.div>
            </div>}

            {/* Off-screen label measurer */}
            <div aria-hidden className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0 flex">
                {entries.map((e) => (
                    <span key={e.key} ref={(el) => { labelRefs.current[e.key] = el; }} className="whitespace-nowrap text-sm font-semibold">{e.label}</span>
                ))}
            </div>
        </div>
    );
}
