import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useTerms } from '../../lib/terms';
import {
    Home,
    LayoutDashboard,
    ShoppingCart,
    ShoppingBag,
    Package,
    Users,
    Wallet,
    RefreshCcw,
    TrendingUp,
    Briefcase,
    Settings,
    ChevronDown,
    ChevronRight,
    Lock
} from 'lucide-react';

export default function Nav({ activeMenu, onMenuSelect }) {
    const { props } = usePage();
    const { t, tp } = useTerms();
    
    const store = props.store;
    const features = props.plan?.features ?? {};
    const userRole = props.auth?.user?.role;
    const userPerms = props.auth?.user?.permissions ?? [];

    const hasAnyPerm = (...keys) => keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));

    // Track which dropdowns are expanded
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (name) => {
        setExpandedGroups(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    // Helper to translate labels
    const getLabel = (name, key, plural = false) => {
        return plural ? tp(key, name) : t(key, name);
    };

    // Define navigation items dynamically
    const navItems = [
        // 1. Home
        {
            name: 'Home',
            icon: Home,
            route: 'store.home',
            visible: true
        },
        // 2. Dashboard
        {
            name: getLabel('Dashboard', 'dashboard'),
            icon: LayoutDashboard,
            route: 'store.dashboard',
            visible: true
        },
        // 3. Sell
        {
            name: 'Sell',
            icon: ShoppingCart,
            visible: hasAnyPerm('sales', 'pos'),
            subs: [
                {
                    label: 'POS Terminal',
                    route: 'store.pos',
                    visible: hasAnyPerm('pos')
                },
                {
                    label: getLabel('Orders', 'order', true),
                    route: 'store.sales.orders',
                    visible: hasAnyPerm('sales.view') && features.sales_orders
                },
                {
                    label: getLabel('Quotations', 'quotation', true),
                    route: 'store.quotations.index',
                    visible: hasAnyPerm('sales.view') && features.quotations
                }
            ]
        },
        // 4. Buy
        {
            name: 'Buy',
            icon: ShoppingBag,
            visible: features.purchase_orders && hasAnyPerm('purchases'),
            subs: [
                {
                    label: getLabel('Purchases', 'purchase', true),
                    route: 'store.purchases.index',
                    visible: true
                },
                {
                    label: 'Purchase Orders',
                    route: 'store.purchase-orders.index',
                    visible: !!features.purchase_orders
                }
            ]
        },
        // 5. Stock
        {
            name: getLabel('Stock', 'stock'),
            icon: Package,
            visible: features.stock_levels_view && hasAnyPerm('inventory'),
            subs: [
                {
                    label: getLabel('Products', 'product', true),
                    route: 'store.products.index',
                    visible: true
                },
                {
                    label: getLabel('Categories', 'category', true),
                    route: 'store.categories.index',
                    visible: true
                },
                {
                    label: getLabel('Stock Levels', 'stock'),
                    route: 'store.inventory.levels',
                    visible: !!features.stock_levels_view
                },
                {
                    label: 'Compositions',
                    route: 'store.compositions.index',
                    visible: !!features.bill_of_materials
                }
            ]
        },
        // 6. Work (Services & Field Work Engine — gated on work_orders capability)
        {
            name: 'Work',
            icon: Briefcase,
            visible: !!features.work_orders && hasAnyPerm('jobs', 'employees'),
            subs: [
                {
                    label: getLabel('Jobs', 'job', true),
                    route: 'store.jobs.index',
                    visible: true
                },
                {
                    label: getLabel('Technicians', 'technician', true),
                    route: 'store.technicians.index',
                    visible: true
                },
                {
                    label: getLabel('Contracts', 'contract', true),
                    route: 'store.contracts.index',
                    visible: !!features.recurring_invoices
                }
            ]
        },
        // 7. Money
        {
            name: 'Money',
            icon: Wallet,
            visible: hasAnyPerm('finance', 'expenses'),
            subs: [
                {
                    label: getLabel('Expenses', 'expense', true),
                    route: 'store.expenses.index',
                    visible: true
                },
                {
                    label: getLabel('Payments', 'payment', true),
                    route: 'store.payments.index',
                    visible: features.double_entry_ledger
                },
                {
                    label: 'Bank Accounts',
                    route: 'store.bank-accounts.index',
                    visible: features.bank_reconciliation
                }
            ]
        },
        // 8. Insights
        {
            name: 'Insights',
            icon: TrendingUp,
            visible: hasAnyPerm('reports'),
            subs: [
                {
                    label: getLabel('Reports', 'report', true),
                    route: 'store.reports.index',
                    visible: true
                }
            ]
        },
        // 9. Studio
        {
            name: 'Studio',
            icon: Settings,
            visible: userRole === 'owner' || userRole === 'admin',
            subs: [
                {
                    label: 'Terminology',
                    route: 'store.studio.terminology',
                    visible: true
                },
                {
                    label: 'Appearance',
                    route: 'store.studio.appearance',
                    visible: true
                },
                {
                    label: 'Capabilities',
                    route: 'store.studio.capabilities',
                    visible: true
                }
            ]
        }
    ];

    return (
        <nav className="flex-1 px-4 space-y-1 bg-surface py-6 select-none overflow-y-auto">
            {navItems.filter(item => item.visible).map((item) => {
                const hasSubs = item.subs && item.subs.filter(s => s.visible).length > 0;
                const isExpanded = !!expandedGroups[item.name];
                const isActive = activeMenu === item.name;

                return (
                    <div key={item.name} className="space-y-1">
                        {hasSubs ? (
                            <button
                                onClick={() => toggleGroup(item.name)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive 
                                        ? 'bg-brand/10 text-brand' 
                                        : 'text-ink-muted hover:bg-sunken hover:text-ink'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </div>
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        ) : (
                            <Link
                                href={item.route ? route(item.route, { store_slug: store?.slug }) : '#'}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive 
                                        ? 'bg-brand/10 text-brand' 
                                        : 'text-ink-muted hover:bg-sunken hover:text-ink'
                                }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                <span>{item.name}</span>
                            </Link>
                        )}

                        {hasSubs && isExpanded && (
                            <div className="pl-8 space-y-1">
                                {item.subs.filter(s => s.visible).map((sub) => (
                                    <Link
                                        key={sub.label}
                                        href={route(sub.route, { store_slug: store?.slug })}
                                        className="group flex items-center px-3 py-2 text-xs font-medium rounded-md text-ink-muted hover:bg-sunken hover:text-ink transition-colors"
                                    >
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
