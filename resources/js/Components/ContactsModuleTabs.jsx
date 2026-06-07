import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Users,
    UserCheck,
    Building2,
    FileText,
    Briefcase,
    Clock,
    Handshake,
    ChevronRight,
    Send
} from 'lucide-react';

export default function ContactsModuleTabs({ activeTab }) {
    const { store } = usePage().props;
    // Helper to safely get route
    const getRoute = (name, params = {}) => {
        try {
            return route(`store.${name}`, { ...params, store_slug: store?.slug });
        } catch (e) {
            console.warn(`Route ${name} not found`);
            return '#';
        }
    };

    const groups = [
        {
            id: 'partners',
            label: 'Partners',
            icon: Handshake,
            items: [
                { id: 'customers', label: 'Customers', href: getRoute('parties.index', { type: 'customer' }), icon: Users },
                { id: 'suppliers', label: 'Suppliers', href: getRoute('parties.index', { type: 'supplier' }), icon: Briefcase },
                { id: 'all', label: 'All Parties', href: getRoute('parties.index'), icon: Users },
                { id: 'ledgers', label: 'Ledgers', href: getRoute('parties.ledgers'), icon: FileText }
            ]
        },
        {
            id: 'team',
            label: 'Team',
            icon: Users,
            items: [
                { id: 'attendance', label: 'Staff Attendance', href: getRoute('admin.attendance', { tab: 'attendance' }), icon: Clock },
                { id: 'summaries', label: 'Staff Summaries', href: getRoute('admin.attendance', { tab: 'summaries' }), icon: FileText },
                { id: 'members', label: 'Members', href: getRoute('admin.attendance', { tab: 'members' }), icon: Users },
                { id: 'invitations', label: 'Invitations', href: getRoute('admin.attendance', { tab: 'invitations' }), icon: Send }
            ]
        }
    ];

    // Determine initial group based on activeTab
    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : 'partners';
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);

    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm shrink-0">
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
        </div>
    );
}
