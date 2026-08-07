import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import FeatureLockBadge from '@/Components/FeatureLockBadge';
import {
    Package,
    Settings,
    BarChart2,
    RefreshCcw,
    Factory,
    FileText,
    Layers,
    Clipboard,
    Search,
    ChevronRight,
    Box
} from 'lucide-react';

export default function StockModuleTabs({ activeTab }) {
    const { store } = usePage().props;
    // Define the structure
    const groups = [
        {
            id: 'catalog',
            label: 'Catalog',
            icon: Layers,
            items: [
                { id: 'products', label: 'Products', href: route('store.inventory.index', { store_slug: store?.slug }), icon: Package },
                { id: 'categories', label: 'Categories', href: route('store.categories.index', { store_slug: store?.slug }), icon: Settings },
                { id: 'attributes', label: 'Attributes', href: route('store.attributes.index', { store_slug: store?.slug }), icon: Settings },
                { id: 'labels', label: 'Labels', href: route('store.labels.index', { store_slug: store?.slug }), icon: FileText },
            ]
        },
        {
            id: 'operations',
            label: 'Operations',
            icon: RefreshCcw,
            items: [
                { id: 'levels', label: 'Stock Levels', href: route('store.inventory.stock-levels', { store_slug: store?.slug }), icon: BarChart2 },
                { id: 'adjustments', label: 'Stock Adjustments', href: route('store.stock-operations', { store_slug: store?.slug, tab: 'adjustments' }), icon: Clipboard },
                { id: 'warehouses', label: 'Warehouses', href: route('store.stock-operations', { store_slug: store?.slug, tab: 'warehouses' }), icon: Box },
                { id: 'transfers', label: 'Stock Transfers', href: route('store.stock-transfers.index', { store_slug: store?.slug }), icon: RefreshCcw },
                { id: 'audit', label: 'Stock Audit', href: route('store.stock-takes.index', { store_slug: store?.slug }), icon: Search },
            ]
        },
        {
            id: 'tracking',
            label: 'Tracking',
            icon: Search,
            items: [
                { id: 'batch', label: 'Batch Tracking', href: route('store.batches.index', { store_slug: store?.slug }), icon: Package },
                { id: 'serial', label: 'Serial Tracking', href: route('store.serials.index', { store_slug: store?.slug }), icon: Package },
            ]
        },
        {
            id: 'manufacturing',
            label: 'Manufacturing',
            icon: Factory,
            items: [
                { id: 'production', label: 'Production', href: route('store.production.index', { store_slug: store?.slug }), icon: Factory },
                { id: 'cookbook', label: 'Cookbook', href: route('store.cookbook.index', { store_slug: store?.slug }), icon: FileText },
            ]
        }
    ];

    // Determine initial group based on activeTab
    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : 'catalog'; // Default to catalog
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);

    // Update active group if activeTab changes from outside (e.g. navigation)
    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        }
    }, [activeTab]);

    return (
        <div className="flex flex-col lg:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm shrink-0">
            {/* Level 1: Category Selector (Left Side) */}
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

            {/* Level 2: Navigation Items (Right Side) */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide w-full lg:w-auto flex-1 mask-linear-fade">
                {groups.find(g => g.id === activeGroup)?.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <FeatureLockBadge key={tab.id} isLocked={tab.locked} showBadge={false}>
                            {tab.locked ? (
                                <div
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border whitespace-nowrap cursor-not-allowed
                                        text-slate-400 dark:text-slate-600 border-transparent
                                    `}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                    <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 ml-1">LOCK</span>
                                </div>
                            ) : (
                                <Link
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
                            )}
                        </FeatureLockBadge>
                    );
                })}
            </div>
        </div>
    );
}
