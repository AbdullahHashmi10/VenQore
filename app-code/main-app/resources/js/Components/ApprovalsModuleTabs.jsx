import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useStoreRoute } from '@/Hooks/useStoreRoute';
import {
    ShieldCheck,
    Settings,
    ChevronRight
} from 'lucide-react';

export default function ApprovalsModuleTabs({ activeTab, pendingCount = 0 }) {
    const { auth, store } = usePage().props;
    const { storeRoute } = useStoreRoute();

    const user = auth?.user;
    const isReviewer = Boolean(user?.can_review_approvals && !user?.requires_approval);

    // If user requires approval or is not a reviewer, they must NOT see Reviewer Inbox or Approval Policies
    if (!isReviewer) {
        return null;
    }

    const tabs = [
        {
            id: 'inbox',
            label: 'Reviewer Inbox',
            href: storeRoute('store.approvals.inbox'),
            icon: ShieldCheck,
            badge: pendingCount > 0 ? pendingCount : null,
        },
        {
            id: 'settings',
            label: 'Approval Policies',
            href: route('store.settings', { store_slug: store?.slug, tab: 'approvals' }),
            icon: Settings,
        }
    ];

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0">
            {/* Level 1: Category / Module Selector Matching Sales Page */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-normal whitespace-nowrap ${
                                    isActive
                                        ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-ink-muted hover:text-ink-secondary hover:bg-interactive-hover'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                <span>{tab.label}</span>
                                {tab.badge && (
                                    <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-2xs font-mono font-bold ml-1">
                                        {tab.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Right Status Badge */}
            <div className="hidden sm:flex items-center gap-2 pr-2 text-xs font-semibold text-ink-muted">
                <span>Pending Review: <strong className="text-amber-600 font-bold">{pendingCount}</strong></span>
            </div>
        </div>
    );
}
