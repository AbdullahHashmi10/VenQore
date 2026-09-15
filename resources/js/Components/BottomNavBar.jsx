import React from 'react';
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
} from 'lucide-react';
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

    // Build items up to 5 slots max
    const items = [];

    if (Array.isArray(rawMobileNav) && rawMobileNav.length > 0) {
        // Dynamic server-resolved MobileNav
        for (const navItem of rawMobileNav) {
            const isItemHome = navItem.id === 'home';
            const isItemMore = navItem.id === 'more';
            const IconComponent = ICON_MAP[navItem.icon] || (isItemHome ? Home : (isItemMore ? Menu : Circle));

            let href = '#';
            let isActive = false;

            if (isItemHome) {
                href = storeSlug
                    ? resolveRoute(navItem.route || 'store.dashboard', { store_slug: storeSlug })
                    : resolveRoute(navItem.route || 'dashboard');
                isActive =
                    propActiveItem === 'home' ||
                    isRouteActive('store.dashboard') ||
                    isRouteActive('store.home') ||
                    isRouteActive('store.new-dashboard') ||
                    isRouteActive('dashboard') ||
                    path === '/' ||
                    path.endsWith('/dashboard');
            } else if (isItemMore) {
                href = null;
                isActive = propActiveItem === 'more';
            } else {
                href = storeSlug
                    ? resolveRoute(navItem.route, { store_slug: storeSlug })
                    : resolveRoute(navItem.route);
                isActive =
                    propActiveItem === navItem.id ||
                    (navItem.route && isRouteActive(navItem.route + '*')) ||
                    (navItem.module && path.includes('/' + navItem.module));
            }

            items.push({
                id: navItem.id,
                label: tt(navItem.label),
                href,
                icon: IconComponent,
                isActive,
                isAction: isItemMore,
                onClick: isItemMore ? onOpenMore : undefined,
                ariaLabel: isItemMore ? tt('Open navigation menu') : undefined,
            });
        }
    } else {
        // Client fallback when mobileNav prop is absent (e.g. isolated test environments)
        const hasModule = (name) => !Array.isArray(modules) || modules.includes(name);

        const isHomeActive =
            propActiveItem === 'home' ||
            isRouteActive('store.dashboard') ||
            isRouteActive('store.home') ||
            isRouteActive('store.new-dashboard') ||
            isRouteActive('dashboard') ||
            path === '/' ||
            path.endsWith('/dashboard');

        items.push({
            id: 'home',
            label: tt('Home'),
            href: storeSlug
                ? resolveRoute('store.dashboard', { store_slug: storeSlug })
                : resolveRoute('dashboard'),
            icon: Home,
            isActive: isHomeActive,
        });

        if (hasModule('pos')) {
            const isPosActive =
                propActiveItem === 'sell' ||
                isRouteActive('store.pos*') ||
                path.includes('/pos');
            items.push({
                id: 'sell',
                label: tt('Sell'),
                href: storeSlug ? resolveRoute('store.pos', { store_slug: storeSlug }) : '/pos',
                icon: ShoppingCart,
                isActive: isPosActive,
            });
        } else if (hasModule('invoicing')) {
            const isInvoiceActive =
                propActiveItem === 'sell' ||
                isRouteActive('store.sales.*') ||
                isRouteActive('store.orders.*') ||
                path.includes('/sales');
            items.push({
                id: 'sell',
                label: tt('Sell'),
                href: storeSlug
                    ? resolveRoute('store.sales.invoice.create', { store_slug: storeSlug })
                    : '#',
                icon: ShoppingCart,
                isActive: isInvoiceActive,
            });
        }

        if (hasModule('products') || hasModule('inventory')) {
            const isStockActive =
                propActiveItem === 'stock' ||
                isRouteActive('store.inventory.*') ||
                isRouteActive('store.products.*') ||
                path.includes('/inventory') ||
                path.includes('/products');
            items.push({
                id: 'stock',
                label: tt('Stock'),
                href: storeSlug
                    ? resolveRoute('store.inventory.index', { store_slug: storeSlug })
                    : resolveRoute('store.products.index', { store_slug: storeSlug }),
                icon: Box,
                isActive: isStockActive,
            });
        }

        if (hasModule('customers') || hasModule('suppliers')) {
            const isContactsActive =
                propActiveItem === 'contacts' ||
                isRouteActive('store.customers.*') ||
                isRouteActive('store.suppliers.*') ||
                path.includes('/customers') ||
                path.includes('/suppliers');
            const contactsHref = hasModule('customers')
                ? (storeSlug ? resolveRoute('store.customers.index', { store_slug: storeSlug }) : '#')
                : (storeSlug ? resolveRoute('store.suppliers.index', { store_slug: storeSlug }) : '#');
            items.push({
                id: 'contacts',
                label: tt('Contacts'),
                href: contactsHref,
                icon: Users,
                isActive: isContactsActive,
            });
        }

        items.push({
            id: 'more',
            label: tt('More'),
            isAction: true,
            onClick: onOpenMore,
            icon: Menu,
            isActive: propActiveItem === 'more',
            ariaLabel: tt('Open navigation menu'),
        });
    }

    // Part C: If fewer than 3 items resolve, render nothing
    if (items.length < 3) {
        return null;
    }

    return (
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
    );
}
