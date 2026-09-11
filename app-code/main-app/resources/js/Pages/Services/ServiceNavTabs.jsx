import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardList, Calendar, Wrench, Sparkles, Plus } from 'lucide-react';
import { useTermText } from '@/lib/terms';

export default function ServiceNavTabs({ active = 'jobs' }) {
    const tt = useTermText();
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');

    const tabs = [
        {
            key: 'jobs',
            label: tt('Work Orders'),
            icon: ClipboardList,
            href: route('store.service-jobs.index', { store_slug: storeSlug }),
            description: 'Field jobs, work orders & statuses'
        },
        {
            key: 'calendar',
            label: 'Dispatch Calendar',
            icon: Calendar,
            href: route('store.service-jobs.calendar', { store_slug: storeSlug }),
            description: 'Technician lanes & schedule slots'
        },
        {
            key: 'tools',
            label: 'Tools & Equipment',
            icon: Wrench,
            href: route('store.tools.index', { store_slug: storeSlug }),
            description: 'Tool checkout, custody & maintenance'
        },
        {
            key: 'catalog',
            label: tt('Services Catalog'),
            icon: Sparkles,
            href: route('store.inventory.index', { store_slug: storeSlug }) + '?type=service',
            description: 'Standard services, pricing & add-ons'
        }
    ];

    return (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = active === tab.key;
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-fast ${
                                isActive
                                    ? 'bg-accent-fill text-accent-on shadow-sm'
                                    : 'bg-surface text-ink-secondary hover:bg-sunken hover:text-ink border border-line'
                            }`}
                        >
                            <Icon size={15} className={isActive ? 'text-accent-on' : 'text-ink-muted'} />
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="flex items-center gap-2">
                <Link
                    href={route('store.service-jobs.create', { store_slug: storeSlug })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface border border-line px-3 text-xs font-semibold text-ink hover:bg-sunken transition-colors"
                >
                    <Plus size={14} className="text-accent-text" />
                    <span>{tt('New Work Order')}</span>
                </Link>
            </div>
        </div>
    );
}
