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
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    const activeGroupObj = groups.find(g => g.id === activeGroup);
    const activeItemObj = activeGroupObj?.items.find(item => item.id === activeTab);

    return (
        <div className="flex flex-col gap-1 shrink-0">
            {/* Mobile Header Toggle Bar - Visible on mobile/tablet, hidden on lg */}
            <div className="lg:hidden flex items-center justify-between bg-surface border border-line p-2.5 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                    <Handshake size={16} className="text-brand-500" />
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-tight">
                        Directory: <span className="text-ink font-bold">
                            {activeGroupObj?.label || 'Partners'}
                            {activeItemObj ?` > ${activeItemObj.label}` : ''}
                        </span>
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-2 py-1 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-all flex items-center gap-1 border border-line"
                >
                    <span className="text-3xs font-bold uppercase tracking-wider">{isExpanded ? 'Collapse' : 'Expand'}</span>
                    <ChevronRight size={14} className={`transition-transform duration-normal ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
            </div>

            {/* Main Navigation Tabs */}
            <div className={`
                flex flex-col lg:flex-row lg:items-center gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm
                ${isExpanded ? 'flex' : 'hidden lg:flex'}
`}>
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
            </div>
        </div>
    );
}
