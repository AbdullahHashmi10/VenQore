import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    ShoppingCart,
    Box,
    Users,
    Menu,
    Package,
    Wrench,
    Truck,
    FileText,
    ClipboardList,
    RefreshCcw,
    Repeat,
    FileSignature,
    Utensils,
    CalendarClock,
    Building2,
    ArrowLeftRight,
    ClipboardCheck,
    Layers,
    ScanLine,
    Barcode,
    ShoppingBag,
    FileInput,
    FileMinus,
    BookOpen,
    Factory,
    BookUser,
    Wallet,
    Receipt,
    Coins,
    Landmark,
    GitCompare,
    BookText,
    BadgeCheck,
    BarChart3,
    Sparkles,
    Globe,
    Circle,
    Plus,
    Settings,
} from 'lucide-react';
import PhoneActionMenu from '@/Components/PhoneActionMenu';
import { cn } from '@/lib/utils';
import { useTermText } from '@/lib/terms';

const ICON_MAP = {
    Home,
    ShoppingCart,
    Box,
    Users,
    Menu,
    Package,
    Wrench,
    Truck,
    FileText,
    ClipboardList,
    RefreshCcw,
    Repeat,
    FileSignature,
    Utensils,
    CalendarClock,
    Building2,
    ArrowLeftRight,
    ClipboardCheck,
    Layers,
    ScanLine,
    Barcode,
    ShoppingBag,
    FileInput,
    FileMinus,
    BookOpen,
    Factory,
    BookUser,
    Wallet,
    Receipt,
    Coins,
    Landmark,
    GitCompare,
    BookText,
    BadgeCheck,
    BarChart3,
    Sparkles,
    Globe,
    Circle,
};

/**
 * Mobile Bottom Navigation Bar (SPEC_MOBILE_BOTTOM_NAV.md + SPEC_MOBILE_NAV_ADDENDUM.md)
 *
 * 5 slots max, derived from server-side MobileNav or enabled modules:
 * 1. Home (always present)
 * 2-4. Up to 3 lowest-order enabled modules declaring nav metadata (with nav_pin priority and deduplication)
 * 5. More (always present, opens drawer/menu)
 *
 * If fewer than 3 items resolve, renders nothing.
 * Hides on POS, checkout, create/edit document flows.
 * Touch target: min 44x44px.
 * Accessible names on all items; aria-current="page" on active item.
 */
export default function BottomNavBar({
    store: propStore,
    modules: propModules,
    mobileNav: propMobileNav,
    onOpenMore,
    className = '',
    currentUrl,
    activeItem: propActiveItem,
    hide = false,
}) {
    let pageProps = {};
    let pageUrl = '';
    try {
        const page = usePage();
        pageProps = page?.props || {};
        pageUrl = page?.url || '';
    } catch (e) {
        // Fallback for isolated SSR/test environments
    }

    const store = propStore || pageProps?.store;
    const modules = propModules !== undefined ? propModules : pageProps?.modules;
    const rawMobileNav = propMobileNav !== undefined ? propMobileNav : pageProps?.mobile_nav;
    const url = currentUrl !== undefined ? currentUrl : pageUrl;

    let tt = (s) => s;
    try {
        const termFn = useTermText();
        if (typeof termFn === 'function') {
            tt = termFn;
        }
    } catch (e) {
        // Fallback
    }

    const [actionsOpen, setActionsOpen] = useState(false);

    // Explicit hide
    if (hide) return null;

    // Part D: Hide on POS, checkout, fullscreen modal, or document editor routes
    const path = (url || '').toLowerCase();
    const isExcluded =
        path &&
        (path.includes('/pos') ||
            path.includes('/checkout') ||
            path.includes('/create') ||
            path.includes('/edit'));

    if (isExcluded) return null;

    const storeSlug = store?.slug;

    // Route helpers safe against missing global route function
    const isRouteActive = (pattern) => {
        try {
            if (typeof route === 'function' && route().current) {
                return route().current(pattern);
            }
        } catch (e) {}
        return false;
    };

    const resolveRoute = (name, params = {}) => {
        try {
            if (typeof route === 'function' && route().has && route().has(name)) {
                return route(name, params);
            }
        } catch (e) {}
        return '#';
    };

    // Fixed phone nav: Dashboard · Contacts · [+ actions] · Stock · Settings
    const has = (m) => !Array.isArray(modules) || modules.includes(m);
    const items = [];
    const isUrl = (frag) => path.includes(frag);

    items.push({
        id: 'home', label: tt('Dashboard'), icon: Home,
        href: storeSlug ? resolveRoute('store.dashboard', { store_slug: storeSlug }) : resolveRoute('dashboard'),
        isActive: propActiveItem === 'home' || isRouteActive('store.dashboard') || isRouteActive('store.new-dashboard') || path.endsWith('/dashboard'),
    });
    items.push({
        id: 'contacts', label: tt('Contacts'), icon: Users,
        href: storeSlug ? resolveRoute(has('customers') ? 'store.customers.index' : 'store.suppliers.index', { store_slug: storeSlug }) : '#',
        isActive: isUrl('/customers') || isUrl('/suppliers') || isUrl('/parties'),
    });
    items.push({ id: 'actions', label: tt('Actions'), icon: Plus, isAction: true, isPrimary: true, onClick: () => setActionsOpen(true), ariaLabel: tt('Open quick actions') });
    items.push({
        id: 'stock', label: tt('Stock'), icon: Package,
        href: storeSlug ? resolveRoute('store.inventory.index', { store_slug: storeSlug }) : '#',
        isActive: isUrl('/inventory') || isUrl('/stock') || isUrl('/categories') || isUrl('/attributes') || isUrl('/labels') || isUrl('/warehouses') || isUrl('/batches') || isUrl('/serials') || isUrl('/production') || isUrl('/cookbook'),
    });
    items.push({
        id: 'settings', label: tt('Settings'), icon: Settings, 
        href: storeSlug ? resolveRoute('store.settings', { store_slug: storeSlug }) : '#',
        isActive: isUrl('/settings'),
    });

    // Part C: If fewer than 3 items resolve, render nothing
    if (items.length < 3) {
        return null;
    }

    return (
        <>
        <PhoneActionMenu isOpen={actionsOpen} onClose={() => setActionsOpen(false)} />
        <nav
            aria-label={tt('Mobile navigation')}
            className={cn(
                "lg:hidden fixed bottom-3 inset-x-0 z-nav flex justify-center px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none",
                className
            )}
        >
            <div className="flex items-center justify-around gap-1 p-1.5 bg-surface/95 dark:bg-surface/95 backdrop-blur-md border border-line rounded-full shadow-lg pointer-events-auto max-w-md w-full">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !!item.isActive;
                    const isButton = !!item.isAction;

                    const content = (
                        <>
                            <Icon
                                size={18}
                                className={cn(
                                    "shrink-0 transition-transform duration-normal",
                                    isActive ? "scale-110" : ""
                                )}
                            />
                            <span
                                className={cn(
                                    "overflow-hidden whitespace-nowrap text-1xs font-medium transition-all duration-normal",
                                    isActive ? "max-w-24 opacity-100 ml-1.5" : "max-w-0 opacity-0 ml-0"
                                )}
                            >
                                {item.label}
                            </span>
                        </>
                    );

                    if (item.isPrimary) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={item.onClick}
                                aria-label={item.ariaLabel || item.label}
                                className="relative -mt-5 h-14 w-14 shrink-0 rounded-full bg-gradient-brand text-white shadow-lg ring-4 ring-[var(--vq-bg)] flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Plus size={28} strokeWidth={2.4} />
                            </button>
                        );
                    }

                    const commonClasses = cn(
                        "relative flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-full transition-all duration-normal text-xs font-medium select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50",
                        isActive
                            ? "bg-brand-500/15 dark:bg-brand-400/20 text-brand-600 dark:text-brand-400 font-semibold shadow-xs"
                            : "text-ink-muted hover:text-ink hover:bg-interactive-hover"
                    );

                    if (isButton) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={item.onClick}
                                className={commonClasses}
                                aria-label={item.ariaLabel || item.label}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={commonClasses}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={item.label}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
        </>
    );
}
