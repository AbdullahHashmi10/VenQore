import React, { useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import FeatureLockBadge from '@/Components/FeatureLockBadge';

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
    isPlatformHQ = false // New prop for premium HQ styling
}) {
    // Priority: use 'name' if provided, then 'label'
    const displayName = name || label;
    const finalRoute = targetRoute || routeName;
    const hoverTimerRef = useRef(null);

    // Handle hover start - start timer for 2 seconds
    const handleMouseEnter = useCallback(() => {
        // Only trigger if sidebar is collapsed and this item has subitems
        if (!isExpanded && subItems.length > 0 && onHoverExpand) {
            hoverTimerRef.current = setTimeout(() => {
                onHoverExpand(menuKey);
            }, 1000); // 1 second hover time (was 2s)
        }
    }, [isExpanded, subItems.length, onHoverExpand, menuKey]);

    // Handle hover end - clear timer
    const handleMouseLeave = useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    }, []);

    return (
        <div
            id={id}
            className="flex flex-col w-full mb-2"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div
                className={`
          flex items-center justify-between p-0 rounded-2xl transition-all duration-300 group relative overflow-hidden
          ${isActive
                        ? 'text-white shadow-xl shadow-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
        `}
            >
                {isActive && (
                    <div className={`absolute inset-0 z-0 pointer-events-none ${isPlatformHQ ? 'bg-indigo-600/10' : 'bg-slate-900'}`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${isPlatformHQ ? 'bg-indigo-500/30' : 'bg-indigo-600/40'}`}></div>
                        <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 ${isPlatformHQ ? 'bg-violet-500/20' : 'bg-purple-600/30'}`}></div>
                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
                        <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50`}></div>
                    </div>
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
                    className="flex-1 flex items-center gap-3 p-3 relative z-10 outline-none"
                >
                    <div className="relative group-hover:scale-125 transition-transform duration-300 origin-center">
                        <Icon size={isPlatformHQ ? 22 : 20} className={`transition-all duration-300 ${isActive ? (isPlatformHQ ? 'text-white' : 'text-white') : (isPlatformHQ ? 'text-slate-500 group-hover:text-white' : 'group-hover:text-indigo-600')}`} />
                        {/* Hover indicator ring for collapsed state */}
                        {!isExpanded && subItems.length > 0 && (
                            <div className="absolute -inset-1 rounded-full border-2 border-transparent group-hover:border-indigo-400/50 transition-all duration-300 group-hover:animate-pulse"></div>
                        )}
                    </div>
                    <span className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'} ${isActive ? 'text-white' : (isPlatformHQ ? 'text-slate-400 group-hover:text-white' : 'text-slate-500')}`}>
                        {displayName}
                    </span>
                </Link>

                {/* Arrow Click Zone - Toggle Submenu */}
                {isExpanded && subItems.length > 0 && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onToggle) onToggle();
                        }}
                        className="p-3 relative z-10 hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-r-2xl"
                    >
                        <ChevronRight size={16} className={`transition-transform duration-300 ${isMenuExpanded ? 'rotate-90' : ''} ${isActive ? 'text-white' : 'group-hover:text-indigo-600'}`} />
                    </button>
                )}

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                        {label}
                        {subItems.length > 0 && (
                            <span className="text-xs text-slate-400 ml-2">(Hold 2s to expand)</span>
                        )}
                        <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>
                )}
            </div>

            <div className={`
        overflow-hidden transition-all duration-300 flex flex-col gap-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800
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
                            'Dashboard': 'store.dashboard',
                            'POS': 'store.pos',
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
                            // ALL 38 Reports
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
                            'Staff Attendance': 'store.staff-attendance.index',
                            'Campaigns': 'store.marketing-campaigns.index',
                            'Online Store': 'store.online-store.index',
                            'VenSynQ': 'vensynq.index',
                            'VenSynQ Settings': 'vensynq.settings',
                            'WooCommerce Sync': 'store.woocommerce.index',
                            'E-Invoicing': 'store.e-invoicing.index',
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
                                <p className="px-4 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                                    {item.group}
                                </p>
                                {item.items.map((subItem, sIdx) => {
                                    const { label: itemName, locked } = (typeof subItem === 'object')
                                        ? { label: subItem.label, locked: subItem.locked }
                                        : { label: subItem, locked: false };

                                    const baseRoute = getRoute(itemName);
                                    if (!baseRoute) {
                                        return (
                                            <span key={sIdx} className="block pl-4 py-1.5 text-xs text-slate-400 cursor-not-allowed">
                                                {itemName}
                                            </span>
                                        );
                                    }

                                    const activeRouteName = (routeParams?.store_slug && !baseRoute.startsWith('store.'))
                                        ? `store.${baseRoute}`
                                        : baseRoute;

                                    return (
                                        <FeatureLockBadge key={sIdx} isLocked={locked} showBadge={false}>
                                            {locked ? (
                                                <div className="block pl-4 py-1.5 text-xs font-medium transition-colors text-slate-400 dark:text-slate-600 cursor-not-allowed flex justify-between">
                                                    {itemName}
                                                    <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 self-center">SOON</span>
                                                </div>
                                            ) : (
                                                window.route().has(activeRouteName) && (
                                                    <Link
                                                        href={window.route(activeRouteName, routeParams || {})}
                                                        className="block pl-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                    >
                                                        {itemName}
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
                    const { label: itemName, locked } = (typeof item === 'object' && !item.group)
                        ? { label: item.label, locked: item.locked }
                        : { label: item, locked: false };

                    const baseRoute = getRoute(itemName);
                    if (!baseRoute) {
                        return (
                            <span
                                key={idx}
                                className="block pl-4 py-2 text-xs font-medium text-slate-400 dark:text-slate-600 cursor-not-allowed relative"
                            >
                                {itemName}
                            </span>
                        );
                    }

                    const routeName = (routeParams?.store_slug && !baseRoute.startsWith('store.'))
                        ? `store.${baseRoute}`
                        : baseRoute;

                    return (
                        <FeatureLockBadge key={idx} isLocked={locked} showBadge={false}>
                            {locked ? (
                                <div className="block pl-4 py-2 text-xs font-medium transition-colors relative text-slate-400 dark:text-slate-600 cursor-not-allowed flex justify-between pr-2">
                                    {itemName}
                                    <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 self-center">SOON</span>
                                </div>
                            ) : (
                                window.route().has(routeName) && (
                                    <Link
                                        href={window.route(routeName, routeParams || {})}
                                        className="block pl-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
                                    >
                                        {itemName}
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

