import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import FeatureLockBadge from '@/Components/FeatureLockBadge';
import {
    Plus,
    ClipboardList,
    PauseCircle,
    FileText,
    Settings,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

export default function SellModuleTabs({ activeTab }) {
    const { store } = usePage().props;
    // Helper to safely get route
    const getRoute = (name, params = {}) => {
        try {
            return route(name, { ...params, store_slug: store?.slug });
        } catch (e) {
            return '#';
        }
    };

    const groups = [
        {
            id: 'transactions',
            label: 'Transactions',
            icon: ClipboardList,
            items: [
                { id: 'orders', label: 'All Sales Orders', href: getRoute('store.sales.index'), icon: ClipboardList },
                { id: 'pre-sales', label: 'Quotations / Pre-Sales', href: getRoute('store.pre-sales.index'), icon: ClipboardList },
                { id: 'proposals', label: 'Proposals', href: getRoute('store.proposals.index'), icon: FileText }
            ]
        },
        {
            id: 'post-sale',
            label: 'Post-Sale',
            icon: FileText,
            items: [
                { id: 'returns', label: 'Returns History', href: getRoute('store.returns-history.index'), icon: FileText },
                { id: 'recurring', label: 'Recurring Invoices', href: getRoute('store.recurring-invoices.index'), icon: PauseCircle, locked: !store?.features?.recurring_invoices },
                { id: 'reminders', label: 'Invoice Reminders', href: getRoute('store.invoice-reminders.index'), icon: PauseCircle, locked: !store?.features?.invoice_reminders }
            ]
        },
        {
            id: 'config',
            label: 'Config',
            icon: Settings,
            items: [
                { id: 'e-invoicing', label: 'E-Invoicing (Coming Soon)', href: getRoute('store.e-invoicing.index'), icon: FileText, locked: true }
            ]
        }
    ];

    // Determine initial group based on activeTab
    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : 'transactions';
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    const activeGroupObj = groups.find(g => g.id === activeGroup);
    const activeItemObj = activeGroupObj?.items.find(item => item.id === activeTab);
    const ActiveIcon = activeItemObj?.icon || activeGroupObj?.icon;

    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm">
            {/* Mobile Header (Only visible below lg) */}
            <div className="flex lg:hidden items-center justify-between w-full">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-3 py-2 bg-sunken rounded-xl text-sm font-bold text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-all duration-normal"
                >
                    {ActiveIcon && <ActiveIcon size={16} className="text-brand-600 dark:text-brand-400" />}
                    <span>{activeGroupObj?.label}: {activeItemObj?.label || activeTab}</span>
                    <ChevronDown size={16} className={`transition-transform duration-normal ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {!isExpanded && (
                    <div className="shrink-0 flex items-center">
                        <Link
                            href={route('store.sales.invoice.create', { store_slug: store?.slug })}
                            className="relative px-4 py-2 text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-slow flex items-center gap-2 overflow-hidden group shadow-xl"
                        >
                            <div className="absolute inset-0 bg-neutral-900 z-0">
                                <div className="absolute top-0 right-0 w-10 h-10 bg-brand-600/50 rounded-full blur-lg -translate-y-1/2 translate-x-1/4"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 bg-brand-600/40 rounded-full blur-lg translate-y-1/3 -translate-x-1/3"></div>
                            </div>
                            <Plus size={18} strokeWidth={3} className="relative z-10" />
                        </Link>
                    </div>
                )}
            </div>

            {/* Collapsible content area */}
            <div className={`w-full lg:flex lg:flex-row lg:items-center lg:gap-4 ${isExpanded ? 'flex flex-col gap-4 mt-3 pt-3 border-t border-line' : 'hidden'}`}>
                {/* Level 1: Category Selector */}
                <div className="flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full">
                    {groups.map((group) => {
                        const Icon = group.icon;
                        const isActive = activeGroup === group.id;

                        return (
                            <button
                                key={group.id}
                                onClick={() => setActiveGroup(group.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-normal whitespace-nowrap
                                    ${isActive
                                        ? 'bg-sunken text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200 hover:bg-interactive-hover dark:hover:bg-interactive-hover'
                                    }
`}
                            >
                                <Icon size={14} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                {group.label}
                            </button>
                        );
                    })}
                </div>

                {/* Separator / Arrow */}
                <div className="hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary">
                    <ChevronRight size={16} />
                </div>

                {/* Level 2: Navigation Items */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade">
                    {groups.find(g => g.id === activeGroup)?.items.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const isComingSoon = tab.label.includes('Coming Soon');
                        const isLocked = tab.locked;

                        if (isComingSoon) {
                            return (
                                <FeatureLockBadge key={tab.id} isLocked={true} showBadge={false}>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-normal border whitespace-nowrap bg-transparent border-transparent text-ink-muted cursor-pointer"
                                    >
                                        <Icon size={14} />
                                        <span>{tab.label}</span>
                                    </button>
                                </FeatureLockBadge>
                            );
                        }

                        if (isLocked) {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.dispatchEvent(new CustomEvent('amd:plan-limit', {
                                            detail: {
                                                feature: tab.id === 'e-invoicing' ? 'e_invoicing' : (tab.id === 'recurring' ? 'recurring_invoicing' : tab.id.replace('-', '_')),
                                                message: `${tab.label} is not available on your current plan. Please upgrade your plan to unlock.`,
                                                current_plan: store?.plan === 'ltd' ? 'starter' : 'starter',
                                                upgrade_url: `/s/${store?.slug}/billing/upgrade`,
                                                billing_url: `/s/${store?.slug}/billing`,
                                                portal_url: `/s/${store?.slug}/billing/portal`
                                            }
                                        }));
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-normal border whitespace-nowrap bg-transparent border-transparent text-ink-muted hover:text-brand-600 dark:text-ink-secondary dark:hover:text-brand-400 cursor-pointer"
                                >
                                    <Icon size={14} />
                                    <span>{tab.label}</span>
                                    <span className="text-2xs">🔒</span>
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-normal border whitespace-nowrap
                                    ${isActive
                                        ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-400 font-semibold'
                                        : 'bg-transparent border-transparent text-ink-secondary hover:bg-interactive-hover hover:border-line dark:text-ink-muted dark:hover:bg-interactive-hover dark:hover:border-line-strong'
                                    }
`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>

                {/* New Invoice Action - Authentic Midnight Nebula */}
                <div className="shrink-0 self-stretch flex items-center">
                    <Link
                        href={route('store.sales.invoice.create', { store_slug: store?.slug })}
                        className="relative h-full w-full lg:w-auto px-5 py-2.5 text-white rounded-xl text-sm font-bold uppercase tracking-wide transition-all duration-slow flex items-center justify-center gap-2 overflow-hidden group shadow-xl"
                    >
                        {/* Midnight Nebula Background */}
                        <div className="absolute inset-0 bg-neutral-900 z-0">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-brand-500/60 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-brand-600/40 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-brand-500/50 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-60"></div>
                        </div>
                        {/* Content */}
                        <Plus size={18} strokeWidth={3} className="relative z-10" />
                        <span className="relative z-10">New Invoice</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
