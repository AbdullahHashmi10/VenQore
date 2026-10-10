import React, { useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import FeatureLockBadge from '@/Components/FeatureLockBadge';
import VenaLogo from '@/Components/VenaLogo';
import { useNavLabel } from '@/lib/terms';
import { isReportLocked } from '@/lib/reportPlanMap';
import { subItemRoute } from '@/lib/navRoutes';

export default function SidebarItem({
    icon: Icon,
    label,
    name, // In OneGlanceLayout we use 'name' instead of 'label'
    isActive,
    isExpanded,
    isMenuExpanded,
    onClick,
    onToggle,
    subItems = [],
    routeName,
    route: targetRoute, // Renamed to avoid shadowing Ziggy's route()
    routeParams,
    onHoverExpand,
    menuKey,
    id,
    isPlatformHQ = false, // New prop for premium HQ styling
    compact = false,
    badgeCount = 0,
}) {
    // Priority: use 'name' if provided, then 'label'
    const displayName = name || label;
    const { store, planFeatures = {}, auth } = usePage().props;
    // Store terminology on screen ("Clients", "Jobs", "Parts") — keys unchanged.
    const navLabel = useNavLabel();
    const finalRoute = targetRoute || routeName;
    const hoverTimerRef = useRef(null);

    /*
     * The collapsed tooltip is rendered into <body>, so it needs coordinates
     * rather than a CSS anchor. `tipAt` holds them and doubles as the
     * visible/hidden flag — null means no tooltip in the DOM at all, which is
     * cheaper than mounting one per nav item and hiding it with opacity.
     *
     * Measured on enter rather than on mount: the rail slides between 264px and
     * 72px, and a position captured at mount would be wrong the moment it did.
     */
    const rowRef = useRef(null);
    const [tipAt, setTipAt] = useState(null);

    const handleMouseEnter = useCallback(() => {
        if (!isExpanded && rowRef.current) {
            const r = rowRef.current.getBoundingClientRect();
            setTipAt({ top: r.top + r.height / 2, left: r.right + 8 });
        }

        // Hovering a collapsed parent for a beat opens the sidebar.
        if (!isExpanded && subItems.length > 0 && onHoverExpand) {
            hoverTimerRef.current = setTimeout(() => {
                onHoverExpand(menuKey);
            }, 1000);
        }
    }, [isExpanded, subItems.length, onHoverExpand, menuKey]);

    const handleMouseLeave = useCallback(() => {
        setTipAt(null);
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    return (
        <div
            id={id}
            className={`flex flex-col w-full ${compact ? 'mb-1' : 'mb-2'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                ref={rowRef}
                className={`
          flex items-center justify-between p-0 rounded-md transition-colors duration-fast group relative
          ${isActive
                        ? 'bg-accent-quiet text-accent-text'
                        : 'text-ink-muted hover:bg-interactive-hover'
                    }
`}
            >
                {isActive && (
                    <span
                        aria-hidden="true"
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-accent pointer-events-none"
                    />
                )}

                {/* Main Click Zone - Navigation */}
                <Link
                    href={finalRoute && window.route().has(finalRoute) ? window.route(finalRoute, routeParams || {}) : '#'}
                    onClick={(e) => {
                        if (!finalRoute) {
                            e.preventDefault();
                            if (onClick) onClick();
                        }
                    }}
                    className={`flex-1 flex items-center relative z-10 outline-none ${
                        isExpanded
                            ? (compact ? 'gap-2 px-2.5 py-1.5 justify-start' : 'gap-3 p-3 justify-start')
                            : (compact ? 'p-2 justify-center' : 'p-3 justify-center')
                    }`}
                >
                    <div className="relative">
                        <Icon
                            size={compact ? 16 : (isPlatformHQ ? 22 : 20)}
                            className={`transition-colors duration-fast ${
                                isActive ? 'text-accent-text' : 'group-hover:text-accent-text'
                            }`}
                        />
                        {!isExpanded && badgeCount > 0 && (
                            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-amber-500 text-white dark:bg-amber-600 shadow-sm border border-surface">
                                {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                        )}
                    </div>
                    {isExpanded && (
                        <div className="flex-1 flex flex-wrap items-center justify-between gap-y-2 min-w-0 pr-1 animate-[vqLabelIn_0.32s_cubic-bezier(0.22,1,0.36,1)_both]">
                            <span className={`whitespace-nowrap overflow-hidden transition-colors duration-fast ${
                                compact ? 'text-xs' : 'text-sm'
                            } ${
                                isActive
                                    ? 'font-semibold text-accent-text'
                                    : 'font-medium text-ink-muted group-hover:text-ink-secondary'
                            }`}>
                                {displayName}
                            </span>
                            {badgeCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 dark:bg-amber-500/20 border border-amber-500/30 shrink-0">
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                            )}
                        </div>
                    )}
                </Link>

                {/* Arrow Click Zone - Toggle Submenu */}
                {isExpanded && subItems.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onToggle) onToggle();
                        }}
                        className={`${compact ? 'p-1.5' : 'p-3'} relative z-raised hover:bg-interactive-active transition-colors duration-fast rounded-r-md`}
                    >
                        <ChevronRight size={compact ? 14 : 16} className={`transition-transform duration-fast ${isMenuExpanded ? 'rotate-90' : ''} ${isActive ? 'text-accent-text' : 'text-ink-muted group-hover:text-ink-secondary'}`} />
                    </button>
                )}

                {/*
                  * Collapsed-state tooltip.
                  *
                  * Portalled to <body> and positioned from the row's bounding
                  * rect, so it cannot be clipped by this or any future
                  * ancestor. That is the rule: anything which must escape its
                  * container is PORTALLED, not raised. Raising it is what
                  * produced the four-and-five-digit z-index values this codebase
              * accumulated in fourteen other places.
                  */}
                {!isExpanded && tipAt && createPortal(
                    <div
                        role="tooltip"
                        className="fixed z-tooltip px-3 py-2 bg-overlay text-ink text-sm font-medium rounded-sm shadow-lg border border-line whitespace-nowrap pointer-events-none flex items-center gap-2"
                        style={{ top: tipAt.top, left: tipAt.left, transform: 'translateY(-50%)' }}
                    >
                        <span>{displayName}</span>
                        {badgeCount > 0 && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                                {badgeCount}
                            </span>
                        )}
                        {subItems.length > 0 && (
                            <span className="text-xs text-ink-muted ml-1">Hold to expand</span>
                        )}
                    </div>,
                    document.body,
                )}
            </div>

            <div className={`
        overflow-hidden transition-all duration-slow flex flex-col gap-1 ml-4 border-l-2 border-line
        ${isMenuExpanded && isExpanded && subItems.length > 0 ? 'max-h-[800px] mt-2 opacity-100' : 'max-h-0 opacity-0'}
`}>
                {subItems.map((item, idx) => {
                    const getRoute = (itemName) => subItemRoute(itemName, auth);

                    // Check if Item is a Group Object
                    if (typeof item === 'object' && item.group) {
                        return (
                            <div key={idx} className="mt-2 mb-1">
                                <p className="px-4 text-2xs uppercase font-medium text-ink-muted tracking-wider mb-1">
                                    {item.group}
                                </p>
                                {item.items.filter(Boolean).map((subItem, sIdx) => {
                                    const { label: itemName, locked } = (typeof subItem === 'object')
                                        ? { label: subItem.label, locked: subItem.locked }
                                        : { label: subItem, locked: false };

                                    const baseRoute = (typeof subItem === 'object' && subItem.route) ? subItem.route : getRoute(itemName);
                                    if (!baseRoute) {
                                        return (
                                            <span key={sIdx} className="block pl-4 py-1.5 text-xs text-ink-muted cursor-not-allowed">
                                                {navLabel(itemName)}
                                            </span>
                                        );
                                    }

                                    const activeRouteName = (routeParams?.store_slug && !baseRoute.startsWith('store.'))
                                        ? `store.${baseRoute}`
                                        : baseRoute;

                                    const isComingSoon = itemName.includes('Coming Soon');
                                    const isPlanLocked = isReportLocked(activeRouteName, planFeatures);
                                    const computedParams = itemName === 'Approval Policies'
                                        ? { ...(routeParams || {}), tab: 'approvals' }
                                        : (routeParams || {});

                                    return (
                                        <FeatureLockBadge key={sIdx} isLocked={isPlanLocked} feature={itemName.toLowerCase().replace(' ', '_').replace('/', '_')} showBadge={false}>
                                            {isComingSoon ? (
                                                <span className="block pl-4 py-1.5 text-xs font-medium text-ink-muted/70 dark:text-ink-secondary/70 cursor-not-allowed select-none">
                                                    {navLabel(itemName)}
                                                </span>
                                            ) : isPlanLocked ? (
                                                <Link
                                                    href={window.route && store?.slug ? window.route('store.billing', { store_slug: store.slug }) : '/billing'}
                                                    className="flex flex-wrap items-center justify-between gap-y-2 pl-4 pr-3 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock"
                                                    title="Upgrade to unlock this report"
                                                >
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        {navLabel(itemName)}
                                                    </span>
                                                    <Lock size={12} className="shrink-0 text-amber-500/80 group-hover/lock:text-amber-500" />
                                                </Link>
                                            ) : (
                                                window.route().has(activeRouteName) && (
                                                    <Link
                                                        id={itemName === 'Products' ? 'tour-sidebar-products' : (itemName === 'Purchases' ? 'tour-sidebar-purchases' : undefined)}
                                                        href={window.route(activeRouteName, computedParams)}
                                                        className="block pl-4 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {navLabel(itemName)}
                                                        </span>
                                                    </Link>
                                                )
                                            )}
                                        </FeatureLockBadge>
                                    );
                                })}
                            </div>
                        );
                    }

                    // Fallback for simple string items or locked object items
                    const { label: itemName } = (typeof item === 'object' && !item.group)
                        ? { label: item.label }
                        : { label: item };

                    const baseRoute = (typeof item === 'object' && item.route) ? item.route : getRoute(itemName);
                    if (!baseRoute) {
                        return (
                            <span
                                key={idx}
                                className="block pl-4 py-2 text-xs font-medium text-ink-muted dark:text-ink-secondary cursor-not-allowed relative"
                            >
                                {navLabel(itemName)}
                            </span>
                        );
                    }

                    const routeName = (routeParams?.store_slug && !baseRoute.startsWith('store.'))
                        ? `store.${baseRoute}`
                        : baseRoute;

                    const isPlanLocked = isReportLocked(routeName, planFeatures);

                    return (
                        <FeatureLockBadge key={idx} isLocked={isPlanLocked} feature={itemName.toLowerCase().replace(' ', '_').replace('/', '_')} showBadge={false}>
                            {isPlanLocked ? (
                                <Link
                                    href={window.route && store?.slug ? window.route('store.billing', { store_slug: store.slug }) : '/billing'}
                                    className="flex flex-wrap items-center justify-between gap-y-2 pl-4 pr-3 py-2 text-xs font-medium transition-colors relative text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock"
                                    title="Upgrade to unlock this report"
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        {navLabel(itemName)}
                                    </span>
                                    <Lock size={12} className="shrink-0 text-amber-500/80 group-hover/lock:text-amber-500" />
                                </Link>
                            ) : (
                                window.route().has(routeName) && (
                                    <Link
                                        href={window.route(routeName, routeParams || {})}
                                        className="block pl-4 py-2 text-xs font-medium transition-colors relative text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {navLabel(itemName)}
                                        </span>
                                    </Link>
                                )
                            )}
                        </FeatureLockBadge>
                    );
                })}
            </div>
        </div>
    );
}
