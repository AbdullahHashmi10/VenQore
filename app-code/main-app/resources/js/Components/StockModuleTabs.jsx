import React, { useState, useEffect, useMemo } from 'react';
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
    Box,
    ChevronDown,
    Check,
    X
} from 'lucide-react';
import { useTermText } from '@/lib/terms';

const itemModuleMap = {
    products: 'products',
    categories: 'products',
    attributes: 'variants',
    labels: 'barcodes_labels',
    levels: 'inventory',
    adjustments: 'inventory',
    warehouses: 'multi_location',
    transfers: 'stock_transfers',
    audit: 'stock_takes',
    batch: 'batches_expiry',
    serial: 'serials',
    production: 'production_runs',
    cookbook: 'cookbook',
};

// Single source for the Stock section's navigation groups (module-filtered).
// The page header dropdown on /inventory/list reads this too — do not copy it.
export function useStockNavGroups() {
    const { store, modules } = usePage().props;
    const tt = useTermText();
    // Define the structure
    const rawGroups = useMemo(() => [
        {
            id: 'catalog',
            label: 'Catalog',
            icon: Layers,
            items: [
                { id: 'products', label: tt('Products'), href: route('store.inventory.index', { store_slug: store?.slug }), icon: Package },
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
    ], [store, tt]);

    const groups = useMemo(() => {
        if (!Array.isArray(modules)) {
            return rawGroups;
        }
        return rawGroups.map(group => ({
            ...group,
            items: group.items.filter(item => {
                const required = itemModuleMap[item.id];
                return !required || modules.includes(required);
            })
        })).filter(group => group.items.length > 0);
    }, [rawGroups, modules]);
    return groups;
}

export default function StockModuleTabs({ activeTab }) {
    const groups = useStockNavGroups();

    // Determine initial group based on activeTab
    const getInitialGroup = () => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        return foundGroup ? foundGroup.id : (groups[0]?.id || 'catalog');
    };

    const [activeGroup, setActiveGroup] = useState(getInitialGroup);
    const [isCollapsed, setIsCollapsed] = useState(true);

    // Update active group if activeTab changes from outside (e.g. navigation)
    useEffect(() => {
        const foundGroup = groups.find(g => g.items.some(item => item.id === activeTab));
        if (foundGroup) {
            setActiveGroup(foundGroup.id);
        } else if (groups[0]) {
            setActiveGroup(groups[0].id);
        }
    }, [activeTab, groups]);

    const currentItem = groups.flatMap(g => g.items.map(i => ({ ...i, group: g.label }))).find(i => i.id === activeTab);
    const CurrentIcon = currentItem?.icon || Layers;

    useEffect(() => {
        if (isCollapsed) return;
        const onKey = (e) => e.key === 'Escape' && setIsCollapsed(true);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isCollapsed]);

    return (
        <>
        {/* Phone/tablet: current section as a dropdown that opens downward in place */}
        <div className="lg:hidden relative shrink-0 z-40">
            {!isCollapsed && <div className="fixed inset-0 z-[-1]" onClick={() => setIsCollapsed(true)} aria-hidden="true" />}
            <div className="bg-surface border border-line rounded-xl shadow-sm">
                <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-haspopup="listbox"
                    aria-expanded={!isCollapsed}
                    className="w-full flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 text-left active:bg-app"
                >
                    <span className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <CurrentIcon size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-[11px] font-medium text-ink-muted leading-tight">Stock · {currentItem?.group || 'Catalog'}</span>
                        <span className="block text-sm font-semibold text-ink leading-tight truncate">{currentItem?.label || 'Inventory'}</span>
                    </span>
                    <ChevronDown size={16} className={`text-ink-muted shrink-0 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>

            </div>
                {!isCollapsed && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line rounded-xl shadow-xl max-h-[58vh] overflow-y-auto overscroll-contain animate-[vqDrop_0.16s_ease-out] origin-top">
                        {groups.map(group => (
                            <div key={group.id}>
                                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{group.label}</div>
                                {group.items.map(item => {
                                    const Icon = item.icon;
                                    const on = item.id === activeTab;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setIsCollapsed(true)}
                                            className={`flex items-center gap-3 px-3 py-2 text-sm ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink active:bg-app'}`}
                                        >
                                            <Icon size={15} className={on ? '' : 'text-ink-muted'} />
                                            <span className="flex-1 truncate">{item.label}</span>
                                            {on && <Check size={15} />}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                        <div className="h-1.5" />
                    </div>
                )}
        </div>

        <div className="hidden lg:flex lg:flex-row lg:items-center gap-2 lg:gap-4 bg-surface border border-line p-2 rounded-2xl shadow-sm shrink-0">
            {/* Collapsible Area */}
            <div className={`flex-col lg:flex-row items-center gap-3 lg:gap-4 w-full lg:w-auto lg:flex-1 hidden lg:flex`}>
                {/* Level 1: Category Selector (Left Side) */}
                <div className="flex items-center gap-1 bg-sunken p-1.5 rounded-xl shrink-0 overflow-x-auto max-w-full w-full lg:w-auto">
                    {groups.map((group) => {
                        const Icon = group.icon;
                        const isActive = activeGroup === group.id;
                        const targetHref = group.items[0]?.href || '#';

                        return (
                            <Link
                                key={group.id}
                                href={targetHref}
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
                            </Link>
                        );
                    })}
                </div>

                {/* Separator / Arrow */}
                <div className="hidden lg:flex items-center text-neutral-300 dark:text-ink-secondary">
                    <ChevronRight size={16} />
                </div>

                {/* Level 2: Navigation Items (Right Side) */}
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
        </>
    );
}
