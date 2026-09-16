import React, { useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Lock } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import FeatureLockBadge from '@/Components/FeatureLockBadge';
import VenaLogo from '@/Components/VenaLogo';
import { useNavLabel } from '@/lib/terms';
import { isReportLocked } from '@/lib/reportPlanMap';

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
}) {
    // Priority: use 'name' if provided, then 'label'
    const displayName = name || label;
    const { store, planFeatures = {} } = usePage().props;
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
                    </div>
                    {isExpanded && (
                        <span className={`whitespace-nowrap overflow-hidden transition-colors duration-fast ${
                            compact ? 'text-xs' : 'text-sm'
                        } ${
                            isActive
                                ? 'font-semibold text-accent-text'
                                : 'font-medium text-ink-muted group-hover:text-ink-secondary'
                        }`}>
                            {displayName}
                        </span>
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
                        className="fixed z-tooltip px-3 py-2 bg-overlay text-ink text-sm font-medium rounded-sm shadow-lg border border-line whitespace-nowrap pointer-events-none"
                        style={{ top: tipAt.top, left: tipAt.left, transform: 'translateY(-50%)' }}
                    >
                        {displayName}
                        {subItems.length > 0 && (
                            <span className="text-xs text-ink-muted ml-2">Hold to expand</span>
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
                    const getRoute = (itemName) => {
                        const routeMap = {
                            'Products': 'store.inventory.index',
                            'Categories': 'store.categories.index',
                            'Stock Operations': 'store.stock-operations',
                            'Suppliers': 'store.suppliers.index',
                            'Purchase Orders': 'store.purchase-orders.index',
                            'Labels': 'store.labels.index',
                            'Reports': 'store.reports.index',
                            'Import/Export': 'store.admin.data',
                            'Attributes': 'store.attributes.index',
                            'Quick Access': 'store.home',
                            'Home': 'store.home',
                            'Dashboard': 'store.dashboard',
                            'Main Dashboard': 'store.dashboard',
                            'Executive Dashboard': 'store.admin.dashboard',
                            'User Management': 'store.admin.users',
                            'Staff Attendance': 'store.admin.attendance',
                            'Data Management': 'store.admin.data',
                            'System Settings': 'store.admin.settings',
                            'Store Settings': 'store.settings',
                            'Builder': 'store.builder',
                            'Modules & Features': 'store.builder',
                            'System Builder': 'store.builder',
                            'Customize Modules': 'store.builder',
                            'Subscription': 'store.billing',
                            'Agent Inbox': 'store.admin.chatbot.inbox',
                            'Chatbot Settings': 'store.admin.chatbot.settings',
                            'POS': 'store.pos',
                            'Tables': 'store.tables.index',
                            'Floor Plan': 'store.tables.plan',
                            'Analytics': 'store.sales.analytics',
                            'Orders': 'store.sales.index',
                            'Invoices': 'store.sales.invoice.create',
                            'Customers': 'store.customers.index',
                            'To Receive': 'store.finance.receivables',
                            'To Pay': 'store.finance.payables',
                            'Bank Accounts': 'store.bank-accounts.index',
                            'Chart of Accounts': 'store.accounting.index',
                            'P&L': 'store.accounting.pnl',
                            'Balance Sheet': 'store.accounting.balance-sheet',
                            // Phase 2 routes
                            'Parties': 'store.parties.index',
                            'Purchases': 'store.purchases.index',
                            'Payments': 'store.payments.index',
                            'Expenses': 'store.expenses.index',
                            'All Transactions': 'store.transactions.index',
                            // Phase 3 routes
                            'Stock Levels': 'store.inventory.stock',
                            'Sales Orders': 'store.sales.orders.index',
                            'Production': 'store.production.index',
                            'Parked Sales': 'store.parked-sales.index',
                            // Phase 4 Reports
                            'Sales Report': 'store.reports.sales',
                            'Purchase Report': 'store.reports.purchases',
                            'Day Book': 'store.reports.day-book',
                            'Profit & Loss': 'store.reports.profit-loss',
                            'Party Statement': 'store.reports.party-statement',
                            'Cookbook': 'store.cookbook.index', 
                            // ALL 40 Reports
                            'Stock Valuation': 'store.reports.stock-valuation',
                            'Low Stock': 'store.reports.low-stock',
                            'Movement History': 'store.reports.movement-history',
                            'Expiry Report': 'store.reports.expiry',
                            'Stock Summary by Category': 'store.reports.stock-summary-by-category',
                            'Item Detail': 'store.reports.item-detail',
                            'Item Report by Party': 'store.reports.item-report-by-party',
                            'Party Report by Item': 'store.reports.item-report-by-item',
                            'Sale/Purchase by Item Category': 'store.reports.sale-purchase-by-item-category',
                            'Bank Statement': 'store.reports.bank-statement',
                            'Expense Report': 'store.reports.expenses',
                            'Tax Report': 'store.reports.tax',
                            'Tax Rate Report': 'store.reports.tax-rate',
                            'Trial Balance': 'store.reports.trial-balance',
                            'Cash Flow': 'store.reports.cash-flow',
                            'Discount Report': 'store.reports.discount',
                            'Loan Statement': 'store.reports.loan-statement',
                            'Item Wise Profit': 'store.reports.item-wise-profit',
                            'Party Wise Profit Loss': 'store.reports.party-wise-profit-loss',
                            'Bill Wise Profit': 'store.reports.bill-wise-profit',
                            'Item Category Wise Profit Loss': 'store.reports.item-category-wise-profit-loss',
                            'Item Wise Discount': 'store.reports.item-wise-discount',
                            'Sale Purchase by Party': 'store.reports.sale-purchase-by-party',
                            'Sale Purchase by Party Group': 'store.reports.sale-purchase-by-party-group',
                            'Stock Aging': 'store.reports.stock-aging',
                            'Sale Orders Report': 'store.reports.sale-orders',
                            'Sale Order Items': 'store.reports.sale-order-items',
                            'Sale Aging': 'store.reports.sale-aging',
                            'All Parties': 'store.reports.all-parties',
                            'Expense by Category': 'store.reports.expense-by-category',
                            'Expense by Item': 'store.reports.expense-by-item',
                            'Staff Summaries': 'store.admin.staff',
                            // New Features
                            'Service Jobs': 'store.service-jobs.index',
                            'Dispatch Calendar': 'store.service-jobs.calendar',
                            'Tools & Equipment': 'store.tools.index',
                            'Services': 'store.service-jobs.index',
                            'Proposals': 'store.proposals.index',
                            'Returns History': 'store.returns-history.index',
                            'Recurring Invoices': 'store.recurring-invoices.index',
                            'Invoice Reminders': 'store.invoice-reminders.index',
                            'Stock Transfers': 'store.stock-transfers.index',
                            'Stock Audit': 'store.stock-takes.index',
                            'Batch Tracking': 'store.batches.index',
                            'Serial Tracking': 'store.serials.index',
                            'Debit Notes': 'store.debit-notes.index',
                            'Purchase Returns': 'store.debit-notes.index',
                            'Campaigns': 'store.marketing-campaigns.index',
                            'Online Store': 'store.online-store.index',
                            'VenSynQ': 'vensynq.index',
                            'VenSynQ Settings': 'vensynq.settings',
                            'WooCommerce Sync': 'store.woocommerce.index',
                            'E-Invoicing (Coming Soon)': 'store.e-invoicing.index',
                            'Bank Reconciliation': 'store.bank-reconciliation.index',
                            'Activity Log': 'store.activity-log.index',
                            'Recycle Bin': 'store.recycle-bin.index',
                            'Settings': 'store.settings',
                            'Quotations / Pre-Sales': 'store.pre-sales.index',
                            'Pre-Purchases': 'store.purchase-orders.index', 
                            'Fund Management': 'store.funds.index',
                        };
                        return routeMap[itemName];
                    };

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

                                    return (
                                        <FeatureLockBadge key={sIdx} isLocked={isPlanLocked} feature={itemName.toLowerCase().replace(' ', '_').replace('/', '_')} showBadge={false}>
                                            {isComingSoon ? (
                                                <span className="block pl-4 py-1.5 text-xs font-medium text-ink-muted dark:text-ink-secondary cursor-pointer">
                                                    {navLabel(itemName)}
                                                </span>
                                            ) : isPlanLocked ? (
                                                <Link
                                                    href={window.route && store?.slug ? window.route('store.billing', { store_slug: store.slug }) : '/billing'}
                                                    className="flex items-center justify-between pl-4 pr-3 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock"
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
                                                        href={window.route(activeRouteName, routeParams || {})}
                                                        className="block pl-4 py-1.5 text-xs font-medium transition-colors text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400"
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {(itemName === 'Agent Inbox' || itemName === 'Chatbot Settings') && (
                                                                <VenaLogo size={13} className="shrink-0" />
                                                            )}
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
                                    className="flex items-center justify-between pl-4 pr-3 py-2 text-xs font-medium transition-colors relative text-ink-muted dark:text-ink-muted hover:text-brand-600 dark:hover:text-brand-400 group/lock"
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
                                            {(itemName === 'Agent Inbox' || itemName === 'Chatbot Settings') && (
                                                <VenaLogo size={13} className="shrink-0" />
                                            )}
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
