import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Plus,
    ClipboardList,
    PauseCircle,
    FileText,

    Settings,
    ChevronRight
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
                { id: 'recurring', label: 'Recurring Invoices', href: getRoute('store.recurring-invoices.index'), icon: PauseCircle },
                { id: 'reminders', label: 'Invoice Reminders', href: getRoute('store.invoice-reminders.index'), icon: PauseCircle }
            ]
        },
        {
            id: 'config',
            label: 'Config',
            icon: Settings,
            items: [
                { id: 'e-invoicing', label: 'E-Invoicing', href: getRoute('store.e-invoicing.index'), icon: FileText }
            ]
        }
    ];

    // Determine initial group based on activeTab
    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : 'transactions';
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);

    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
            {/* Level 1: Category Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full">
                {groups.map((group) => {
                    const Icon = group.icon;
                    const isActive = activeGroup === group.id;

                    return (
                        <button
                            key={group.id}
                            onClick={() => setActiveGroup(group.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap
                                ${isActive
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
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
            <div className="hidden lg:flex items-center text-slate-300 dark:text-slate-600">
                <ChevronRight size={16} />
            </div>

            {/* Level 2: Navigation Items */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade">
                {groups.find(g => g.id === activeGroup)?.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap
                                ${isActive
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 font-semibold'
                                    : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:border-slate-700'
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
                    className="relative h-full px-5 py-2.5 text-white rounded-xl text-sm font-black uppercase tracking-wide transition-all duration-300 flex items-center gap-2 overflow-hidden group shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40"
                >
                    {/* Midnight Nebula Background */}
                    <div className="absolute inset-0 bg-slate-900 z-0">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-600/50 rounded-full blur-xl -translate-y-1/2 translate-x-1/4 group-hover:bg-indigo-500/60 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-600/40 rounded-full blur-xl translate-y-1/3 -translate-x-1/3 group-hover:bg-purple-500/50 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60"></div>
                    </div>
                    {/* Content */}
                    <Plus size={18} strokeWidth={3} className="relative z-10" />
                    <span className="hidden sm:inline relative z-10">New Invoice</span>
                </Link>
            </div>
        </div>
    );
}
