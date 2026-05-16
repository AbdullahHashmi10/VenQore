import React, { useRef, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    TrendingUp,
    ShoppingCart,
    Package,
    CreditCard,
    Landmark,
    FileSpreadsheet,
    ScrollText,
    Users,
    FileText,
    BookOpen
} from 'lucide-react';

export default function ReportsNavigation() {
    const { url, props } = usePage();
    const { store } = props;
    const scrollRef = useRef(null);

    const links = [
        { label: 'Overview', route: 'store.reports.index', icon: LayoutDashboard },
        { label: 'Profit & Loss', route: 'store.reports.profit-loss', icon: TrendingUp },
        { label: 'Sales Report', route: 'store.reports.sales', icon: ShoppingCart },
        { label: 'Purchases', route: 'store.reports.purchases', icon: Package },
        { label: 'Expenses', route: 'store.reports.expenses', icon: CreditCard },
        { label: 'General Ledger', route: 'store.reports.account-ledger', icon: BookOpen },
        { label: 'Day Book', route: 'store.reports.day-book', icon: FileText },
        { label: 'Trial Balance', route: 'store.reports.trial-balance', icon: Scale },
        { label: 'Stock Valuation', route: 'store.reports.inventory-valuation', icon: FileSpreadsheet },
        { label: 'Balance Sheet', route: 'store.reports.balance-sheet', icon: Landmark },
        { label: 'Transactions', route: 'store.reports.transactions', icon: ScrollText },
        { label: 'Party Statements', route: 'store.reports.party-statement', icon: Users },
    ];

    const isActive = (routeName) => {
        if (!store?.slug) return false;
        try {
            return route().current(routeName);
        } catch (e) {
            return false;
        }
    };

    // Scroll active item into view
    useEffect(() => {
        if (scrollRef.current) {
            const activeLink = scrollRef.current.querySelector('.active-report-link');
            if (activeLink) {
                activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [url]);

    return (
        <div className="w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
            <div className="w-full overflow-x-auto no-scrollbar" ref={scrollRef}>
                <div className="flex items-center px-4 md:px-6 gap-2 py-2 min-w-max">
                    {links.map((link) => (
                        <Link
                            key={link.route}
                            href={route(link.route, { store_slug: store?.slug })}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
                                ${isActive(link.route)
                                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 active-report-link ring-1 ring-indigo-200 dark:ring-indigo-500/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                }
                            `}
                        >
                            <link.icon size={16} className={isActive(link.route) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
