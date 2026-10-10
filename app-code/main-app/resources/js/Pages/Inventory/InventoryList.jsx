import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Head, router, Link, usePage } from '@inertiajs/react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useTerms, useTermText } from '@/lib/terms';
import StockModuleTabs, { useStockNavGroups } from '@/Components/StockModuleTabs';
import ProductModal from '@/Components/ProductModal';
import ProductTourGuide from '@/Components/ProductTourGuide';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Package,
    AlertTriangle as AlertTriangleIcon,
    DollarSign,
    Box,
    Upload,
    Download,
    CheckSquare,
    ChevronUp,
    ChevronDown,
    X,
    Layers,
    BarChart3,
    Wrench,
    Clock,
    Sparkles,
    Check,
    ChevronsUpDown
} from 'lucide-react';

import PasscodeModal from '@/Components/PasscodeModal';
import MobileStats from '@/Components/MobileStats';

// ── Header filter popover ────────────────────────────────────────────────────
// Column → control. Server applies the same whitelist (InventoryController::applyColumnFilters).
const FILTER_KIND = {
    name: 'text', sku: 'text', category: 'text',
    available_stock: 'number', cost_price: 'number', price: 'number',
    status: 'select',
};
const NUMERIC_OPS = [['eq', 'Equals'], ['gte', 'At least'], ['lte', 'At most']];

function FilterPopover({ colKey, label, current, options = [], align = 'left', onApply, onClear }) {
    const kind = FILTER_KIND[colKey];
    const [op, setOp] = useState(current?.op || (kind === 'number' ? 'eq' : 'contains'));
    const [value, setValue] = useState(current?.value ?? '');
    const inputRef = useRef(null);
    useEffect(() => { inputRef.current?.focus(); }, []);

    const submit = () => {
        const v = String(value).trim();
        if (v === '') onClear(); else onApply({ op, value: v });
    };
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } };
    const field = 'w-full h-9 px-3 rounded-[12px] bg-app border border-line text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500';

    return (
        <div className={`absolute top-full mt-2 w-60 ${align === 'right' ? 'right-0' : 'left-0'} bg-surface border border-line rounded-[14px] shadow-xl p-3 normal-case tracking-normal font-normal text-left cursor-default animate-[vqDrop_0.16s_ease-out] origin-top`}>
            <p className="text-2xs font-bold uppercase tracking-wider text-ink-muted mb-2">Filter · {label}</p>
            {kind === 'select' ? (
                <div className="flex flex-col gap-1">
                    {options.map(o => (
                        <button
                            key={o}
                            type="button"
                            onClick={() => onApply({ op: 'is', value: o })}
                            className={`h-9 px-3 rounded-[12px] text-sm text-left flex items-center justify-between ${current?.value === o ? 'bg-brand-50 text-brand-700 font-semibold dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink hover:bg-interactive-hover'}`}
                        >
                            {o}{current?.value === o && <Check size={14} />}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {kind === 'number' && (
                        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-[12px] bg-app border border-line">
                            {NUMERIC_OPS.map(([k, l]) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => setOp(k)}
                                    className={`h-8 rounded-[10px] text-xs font-semibold transition-colors ${op === k ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                                >{l}</button>
                            ))}
                        </div>
                    )}
                    <input
                        ref={inputRef}
                        type={kind === 'number' ? 'number' : 'text'}
                        step="any"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={onKey}
                        placeholder={kind === 'number' ? 'e.g. 500' : 'Contains…'}
                        className={field}
                    />
                </div>
            )}
            <div className="flex items-center justify-between gap-2 mt-3">
                <button type="button" onClick={onClear} className="h-9 px-3 rounded-[12px] text-sm font-semibold text-ink-secondary hover:bg-interactive-hover transition-colors">Clear</button>
                {kind !== 'select' && (
                    <button type="button" onClick={submit} className="h-9 px-4 rounded-[12px] bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors">Apply</button>
                )}
            </div>
        </div>
    );
}

export default function Inventory({ products: serverProducts, filters, stats, warehouses, categories, attributes, tools }) {
    const { t, tp } = useTerms();
    const tt = useTermText();
    const { flash, store, modules } = usePage().props;
    const isStockTracked = stats?.stock_maintenance ?? (store?.settings?.stock_maintenance !== '0' && store?.settings?.stock_maintenance !== false);

    // Module truth — same source the sidebar uses. Off means off: no button, no rows, no filter.
    const hasProducts = !Array.isArray(modules) || modules.includes('products');
    const hasServices = !Array.isArray(modules) || modules.includes('services');
    const bothKinds = hasProducts && hasServices;
    const pageTitle = bothKinds ? tt('Inventory & Services') : hasProducts ? `${t('product', 'Product')} Inventory` : tt('Services');
    const nameLabel = bothKinds ? tt('Product / Service Name') : hasProducts ? tt('Product Name') : tt('Service Name');
    const stockLabel = !hasProducts ? 'Duration'
        : isStockTracked ? (hasServices ? 'Stock / Duration' : 'Stock')
        : (hasServices ? 'Sold / Duration' : 'Sold');
    const navGroups = useStockNavGroups();

    // Infinite Scroll State
    const [allProducts, setAllProducts] = useState(serverProducts.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(serverProducts.next_page_url);
    const isLoading = useRef(false);
    const observerTarget = useRef(null);

    // Sync State
    useEffect(() => {
        if (serverProducts.data && serverProducts.current_page === 1) {
            setAllProducts(serverProducts.data);
            setNextPageUrl(serverProducts.next_page_url);
        }
    }, [serverProducts]);

    // Fetch Next Page
    const fetchNextPage = useCallback(async () => {
        if (!nextPageUrl || isLoading.current) return;
        isLoading.current = true;
        try {
            const response = await axios.get(nextPageUrl, { headers: { 'Accept': 'application/json' } });
            const newItems = response.data.data;
            setAllProducts(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(response.data.next_page_url);
        } catch (error) { console.error(error); } finally { isLoading.current = false; }
    }, [nextPageUrl]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
        }, { threshold: 0.1, rootMargin: '800px' });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
    }, [nextPageUrl, fetchNextPage]);

    const [selectedProducts, setSelectedProducts] = useState([]);

    // Parse URL params for sync
    const params = new URLSearchParams(window.location.search);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState(params.get('search') || '');
    const [activeCategory, setActiveCategory] = useState(params.get('category_id') || 'all');
    const [activeType, setActiveType] = useState(params.get('type') || 'all');
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [sortConfig, setSortConfig] = useState({ 
        key: params.get('sort_by') || 'name', 
        direction: params.get('sort_dir') || 'asc' 
    });
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [openMenu, setOpenMenu] = useState(null); // 'nav' | 'category' | 'add' | 'f:<column>' | null
    const [categoryQuery, setCategoryQuery] = useState('');
    const [colFilters, setColFilters] = useState(() => {
        try {
            const raw = new URLSearchParams(window.location.search).get('col_filters');
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch { return {}; }
    });
    const colFiltersJson = Object.keys(colFilters).length ? JSON.stringify(colFilters) : '';
    const toggleMenu = (key) => setOpenMenu(prev => (prev === key ? null : key));
    const [isMd, setIsMd] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const h = () => setIsMd(mq.matches);
        mq.addEventListener('change', h);
        return () => mq.removeEventListener('change', h);
    }, []);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    const [modalInitialType, setModalInitialType] = useState('standard');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'name', label: nameLabel, width: '25%' },
        { key: 'sku', label: 'SKU', width: '10%' },
        { key: 'category', label: 'Category', width: '15%' },
        { key: 'available_stock', label: stockLabel, width: '10%' },
        { key: 'cost_price', label: 'Cost', width: '10%' },
        { key: 'price', label: 'Price', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '10%' }
    ]);

    useEffect(() => {
        setTableColumns(prev => prev.map(col => {
            if (col.key === 'available_stock') return { ...col, label: stockLabel };
            if (col.key === 'name') return { ...col, label: nameLabel };
            return col;
        }));
    }, [isStockTracked, hasProducts, hasServices]);

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeActionMenu && !e.target.closest('.action-menu-container')) {
                setActiveActionMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeActionMenu]);

    const applyFilters = (newParams) => {
        router.get(route('store.inventory.index', { store_slug: store?.slug }), {
            search: searchTerm,
            sort_by: sortConfig.key,
            sort_dir: sortConfig.direction,
            category_id: activeCategory,
            type: activeType,
            col_filters: colFiltersJson,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
    };

    const handleCategoryChange = (catId) => {
        setActiveCategory(catId);
        applyFilters({ category_id: catId });
    };

    const handleTypeChange = (typeVal) => {
        setActiveType(typeVal);
        applyFilters({ type: typeVal });
    };

    // Sorting
    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
        applyFilters({ sort_by: key, sort_dir: direction });
    };

    const handleServerSearch = (e) => {
        if (e.key === 'Enter') {
            applyFilters({ search: searchTerm });
        }
    };

    // Header filters ────────────────────────────────────────────────────────────
    const setColFilter = (key, f) => {
        const next = { ...colFilters };
        if (f) next[key] = f; else delete next[key];
        setColFilters(next);
        setOpenMenu(null);
        applyFilters({ col_filters: Object.keys(next).length ? JSON.stringify(next) : '' });
    };
    const clearAllFilters = () => {
        setColFilters({});
        applyFilters({ col_filters: '' });
    };
    const activeFilterCount = Object.keys(colFilters).length;
    const statusOptions = [
        ...(hasProducts && isStockTracked ? ['In Stock', 'Low Stock', 'Out of Stock'] : []),
        ...(hasServices ? ['Available'] : []),
    ];

    // Menus: close on outside press / Escape
    useEffect(() => {
        const onDown = (e) => { if (!e.target.closest('[data-menu]')) setOpenMenu(null); };
        const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
    }, []);

    // Live search (Enter still works)
    const searchMounted = useRef(false);
    useEffect(() => {
        if (!searchMounted.current) { searchMounted.current = true; return; }
        const h = setTimeout(() => {
            const current = new URLSearchParams(window.location.search).get('search') || '';
            if (current !== searchTerm.trim()) applyFilters({ search: searchTerm.trim() });
        }, 450);
        return () => clearTimeout(h);
    }, [searchTerm]);

    const activeCategoryName = categories.find(c => String(c.id) === String(activeCategory))?.name;
    const visibleCategories = categories.filter(c => c.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()));

    const fmt = (n) => Number(n || 0).toLocaleString();
    const cards = [
        { label: bothKinds ? tt('Total Items') : hasProducts ? tt('Total Products') : tt('Total Services'), value: fmt(stats?.total_products), icon: Package, icon_tone: 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400', value_tone: 'text-ink' },
        hasProducts && isStockTracked
            ? { label: 'Low Stock', value: fmt(stats?.low_stock_count), icon: AlertTriangleIcon, icon_tone: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', value_tone: (stats?.low_stock_count || 0) > 0 ? 'text-amber-600' : 'text-ink' }
            : { label: 'Units Sold', value: fmt(stats?.total_units_sold), icon: BarChart3, icon_tone: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400', value_tone: 'text-teal-600 dark:text-teal-400' },
        hasProducts && isStockTracked
            ? { label: 'Out of Stock', value: fmt(stats?.out_of_stock_count), icon: Box, icon_tone: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', value_tone: (stats?.out_of_stock_count || 0) > 0 ? 'text-red-600' : 'text-ink' }
            : { label: 'Categories', value: fmt(categories.length), icon: Layers, icon_tone: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', value_tone: 'text-ink' },
        hasProducts
            ? { label: 'Inventory Value', value: formatCurrency(stats?.inventory_value || 0, store), icon: DollarSign, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' }
            : { label: 'Avg. Service Rate', value: formatCurrency(stats?.avg_service_rate || 0, store), icon: DollarSign, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
    ];

    // Use raw data from server (already sorted globally)
    const sortedProducts = allProducts;

    // Selection
    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedProducts(sortedProducts.map(c => c.id));
        else setSelectedProducts([]);
    };

    const handleSelectRow = (id) => {
        if (selectedProducts.includes(id)) setSelectedProducts(selectedProducts.filter(i => i !== id));
        else setSelectedProducts([...selectedProducts, id]);
    };

    // Drag & Drop Columns
    const handleDragStart = (e, index) => setDraggedColumn(index);
    const handleDragOver = (e, index) => e.preventDefault();
    const handleDrop = (e, dropIndex) => {
        if (draggedColumn === null) return;
        const newCols = [...tableColumns];
        const draggedItem = newCols[draggedColumn];
        newCols.splice(draggedColumn, 1);
        newCols.splice(dropIndex, 0, draggedItem);
        setTableColumns(newCols);
        setDraggedColumn(null);
    };

    // Modal Handlers
    const handleAddProduct = () => {
        setSelectedProduct(null);
        setModalInitialType('standard');
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleAddService = () => {
        setSelectedProduct(null);
        setModalInitialType('service');
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEditProduct = (product, e) => {
        if (e) e.stopPropagation();
        setSelectedProduct(product);
        setModalInitialType(product.type || 'standard');
        setModalMode('edit');
        setIsModalOpen(true);
        setActiveActionMenu(null);
    };

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
        setModalInitialType(product.type || 'standard');
        setModalMode('view');
        setIsModalOpen(true);
        setActiveActionMenu(null);
    };

    // Security Modal State
    const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
    const [pendingDeleteAction, setPendingDeleteAction] = useState(null); // 'single' or 'bulk'
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const handleDeleteProduct = (product) => {
        setPendingDeleteAction('single');
        setPendingDeleteId(product.id);
        setIsPasscodeModalOpen(true);
        setActiveActionMenu(null);
    };

    const handleBulkDelete = () => {
        if (selectedProducts.length === 0) return;
        setPendingDeleteAction('bulk');
        setIsPasscodeModalOpen(true);
    };

    const executeDelete = () => {
        if (pendingDeleteAction === 'single' && pendingDeleteId) {
            router.delete(route('store.inventory.destroy', { store_slug: store?.slug, id: pendingDeleteId }), {
                onSuccess: () => {
                    // Global Sync Trigger
                    window.dispatchEvent(new CustomEvent('amd:product-updated'));
                    localStorage.setItem('amd_product_latest_change', Date.now().toString());

                    const remaining = allProducts.filter(p => p.id !== pendingDeleteId);
                    setAllProducts(remaining);
                    setPendingDeleteId(null);
                    setPendingDeleteAction(null);
                }
            });
        } else if (pendingDeleteAction === 'bulk' && selectedProducts.length > 0) {
            router.post(route('store.inventory.bulk-destroy', { store_slug: store?.slug }), { ids: selectedProducts }, {
                onSuccess: () => {
                    // Global Sync Trigger 
                    window.dispatchEvent(new CustomEvent('amd:product-updated'));
                    localStorage.setItem('amd_product_latest_change', Date.now().toString());

                    setSelectedProducts([]);
                    // Need to refilter local state as well
                    const remaining = allProducts.filter(p => !selectedProducts.includes(p.id));
                    setAllProducts(remaining);
                    setPendingDeleteAction(null);
                }
            });
        }
    };

    return (
        <OneGlanceLayout title="Inventory Management" activeMenu="Stock" noPadding>
            <Head title="Inventory & Services" />

            <PasscodeModal
                isOpen={isPasscodeModalOpen}
                onClose={() => {
                    setIsPasscodeModalOpen(false);
                    setPendingDeleteAction(null);
                    setPendingDeleteId(null);
                }}
                onSuccess={(code) => {
                    setIsPasscodeModalOpen(false);
                    executeDelete();
                }}
                actionName={pendingDeleteAction === 'bulk' ? `delete ${selectedProducts.length} selected items` : "delete this item"}
            />

            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    product={selectedProduct}
                    mode={modalMode}
                    initialType={modalInitialType}
                    warehouses={warehouses}
                    categories={categories}
                    attributes={attributes}
                    tools={tools || []}
                    onClose={() => {
                        setSelectedProduct(null);
                        setModalMode('view');
                        setIsModalOpen(false);
                    }}
                />
            )}

            <ProductTourGuide isModalOpen={isModalOpen} store={store} categories={categories} />

            <div className="flex flex-col h-full bg-app gap-2 px-1.5 pt-1.5 pb-1.5 md:px-6 md:pt-4 md:pb-6 overflow-y-auto md:overflow-hidden relative">

                {/* Phone / small tablet: section dropdown (desktop gets the title dropdown in the toolbar) */}
                <div className="md:hidden">
                    <StockModuleTabs activeTab="products" />
                </div>

                {/* Mobile Stats (phones only) */}
                <MobileStats bp="md" hero={2} open={isStatsExpanded} onToggle={() => setIsStatsExpanded(!isStatsExpanded)} items={[
                    { label: bothKinds ? tt('Total Items') : hasProducts ? tt('Total Products') : tt('Total Services'), value: stats?.total_products?.toLocaleString() || 0, tone: 'brand', icon: Package },
                    hasProducts && isStockTracked
                        ? { label: 'Low Stock', value: stats?.low_stock_count?.toLocaleString() || 0, tone: (stats?.low_stock_count || 0) > 0 ? 'amber' : 'ink', icon: AlertTriangleIcon }
                        : { label: 'Units Sold', value: Number(stats?.total_units_sold || 0).toLocaleString(), tone: 'teal', icon: BarChart3 },
                    hasProducts
                        ? { label: 'Inventory value', value: formatCurrency(stats?.inventory_value || 0, store), tone: 'emerald', icon: DollarSign }
                        : { label: 'Avg. service rate', value: formatCurrency(stats?.avg_service_rate || 0, store), tone: 'emerald', icon: DollarSign },
                ]} />

                {/* ── ROW 1 · toolbar (desktop): [page title ▾ nav]  ····  [search] [category ▾] [+ add] ── */}
                <div className="hidden md:flex relative z-20 h-14 shrink-0 items-center justify-between gap-3 px-2 bg-surface border border-line rounded-[14px] shadow-sm">

                    {/* Left: page name + dropdown with every Stock page */}
                    <div className="relative" data-menu>
                        <button
                            type="button"
                            onClick={() => toggleMenu('nav')}
                            aria-haspopup="menu"
                            aria-expanded={openMenu === 'nav'}
                            className={`h-10 pl-3 pr-2.5 rounded-[12px] flex items-center gap-2 transition-colors ${openMenu === 'nav' ? 'bg-interactive-hover' : 'hover:bg-interactive-hover'}`}
                        >
                            <span className="text-lg font-bold text-ink tracking-tight whitespace-nowrap">{pageTitle}</span>
                            <ChevronDown size={18} className={`text-ink-muted transition-transform duration-200 ${openMenu === 'nav' ? 'rotate-180' : ''}`} />
                        </button>
                        {openMenu === 'nav' && (
                            <div role="menu" className="absolute left-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto overscroll-contain bg-surface border border-line rounded-[14px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
                                {navGroups.map((group, gi) => (
                                    <div key={group.id} className={gi > 0 ? 'mt-1' : ''}>
                                        <div className="px-2.5 pt-2 pb-1 text-2xs font-bold uppercase tracking-wider text-ink-muted">{group.label}</div>
                                        {group.items.map(item => {
                                            const ItemIcon = item.icon;
                                            const on = item.id === 'products';
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    onClick={() => setOpenMenu(null)}
                                                    role="menuitem"
                                                    className={`flex items-center gap-3 h-9 px-2.5 rounded-[12px] text-sm transition-colors ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink hover:bg-interactive-hover'}`}
                                                >
                                                    <ItemIcon size={15} className={on ? '' : 'text-ink-muted'} />
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {on && <Check size={15} />}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ))}
                                <div className="h-px bg-line my-1.5" />
                                <Link
                                    href={route('store.admin.data', { store_slug: store?.slug })}
                                    onClick={() => setOpenMenu(null)}
                                    role="menuitem"
                                    className="flex items-center gap-3 h-9 px-2.5 rounded-[12px] text-sm text-ink hover:bg-interactive-hover transition-colors"
                                >
                                    <Upload size={15} className="text-ink-muted" />
                                    <span className="flex-1 truncate">Import / Export data</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right: filters badge · search · category · one add button */}
                    <div className="flex items-center gap-2 min-w-0">
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="h-10 px-3 rounded-[12px] bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 text-sm font-semibold flex items-center gap-1.5 hover:bg-brand-100 transition-colors whitespace-nowrap"
                                title="Clear all column filters"
                            >
                                <Filter size={14} /> {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} <X size={14} />
                            </button>
                        )}

                        <div className="relative w-64 shrink min-w-[160px]">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder={bothKinds ? 'Search products & services…' : hasProducts ? 'Search products…' : 'Search services…'}
                                className="w-full h-10 pl-10 pr-9 text-sm bg-app border border-line rounded-[12px] text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            {searchTerm && (
                                <button type="button" aria-label="Clear search" onClick={() => { setSearchTerm(''); applyFilters({ search: '' }); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-[12px] text-ink-muted hover:text-ink hover:bg-interactive-hover">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Category (and type, when both kinds exist) */}
                        <div className="relative" data-menu>
                            <button
                                type="button"
                                onClick={() => toggleMenu('category')}
                                aria-haspopup="listbox"
                                aria-expanded={openMenu === 'category'}
                                className={`h-10 px-3 rounded-[12px] border text-sm font-semibold flex items-center gap-2 max-w-[220px] transition-colors ${activeCategory !== 'all' || activeType !== 'all' ? 'border-brand-300 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/30 dark:text-brand-400' : 'border-line bg-app text-ink hover:bg-interactive-hover'}`}
                            >
                                <Layers size={15} className="shrink-0" />
                                <span className="truncate">{activeCategory === 'all' ? 'All categories' : (activeCategoryName || 'Category')}</span>
                                <ChevronDown size={15} className={`shrink-0 transition-transform duration-200 ${openMenu === 'category' ? 'rotate-180' : ''}`} />
                            </button>
                            {openMenu === 'category' && (
                                <div role="listbox" className="absolute right-0 top-full mt-2 w-72 bg-surface border border-line rounded-[14px] shadow-xl p-2 animate-[vqDrop_0.16s_ease-out] origin-top">
                                    {bothKinds && (
                                        <div className="grid grid-cols-3 gap-1 p-0.5 mb-2 rounded-[12px] bg-app border border-line">
                                            {[['all', 'All'], ['standard', tt('Products')], ['service', tt('Services')]].map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handleTypeChange(key)}
                                                    className={`h-8 rounded-[10px] text-xs font-semibold transition-colors ${activeType === key ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-muted hover:text-ink'}`}
                                                >{label}</button>
                                            ))}
                                        </div>
                                    )}
                                    {categories.length > 8 && (
                                        <input
                                            type="text"
                                            value={categoryQuery}
                                            onChange={(e) => setCategoryQuery(e.target.value)}
                                            placeholder="Find a category…"
                                            className="w-full h-9 px-3 mb-1.5 text-sm bg-app border border-line rounded-[12px] outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                        />
                                    )}
                                    <div className="max-h-64 overflow-y-auto overscroll-contain flex flex-col gap-0.5">
                                        {[{ id: 'all', name: 'All categories' }, ...visibleCategories].map(cat => {
                                            const on = String(activeCategory) === String(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={on}
                                                    onClick={() => { handleCategoryChange(cat.id); setOpenMenu(null); }}
                                                    className={`h-9 px-3 rounded-[12px] text-sm text-left flex items-center justify-between gap-2 transition-colors ${on ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 font-semibold' : 'text-ink hover:bg-interactive-hover'}`}
                                                >
                                                    <span className="truncate">{cat.name}</span>
                                                    {on && <Check size={15} className="shrink-0" />}
                                                </button>
                                            );
                                        })}
                                        {visibleCategories.length === 0 && <p className="px-3 py-2 text-sm text-ink-muted">No category matches.</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* The one add button — follows the Products / Services module switches */}
                        {bothKinds ? (
                            <div className="relative" data-menu>
                                <button
                                    id={isMd ? 'tour-add-product' : undefined}
                                    type="button"
                                    onClick={() => toggleMenu('add')}
                                    aria-haspopup="menu"
                                    aria-expanded={openMenu === 'add'}
                                    className="h-10 px-4 rounded-[12px] bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
                                >
                                    <Plus size={16} /> {tt('Add Product / Service')}
                                    <ChevronDown size={15} className={`transition-transform duration-200 ${openMenu === 'add' ? 'rotate-180' : ''}`} />
                                </button>
                                {openMenu === 'add' && (
                                    <div role="menu" className="absolute right-0 top-full mt-2 w-56 bg-surface border border-line rounded-[14px] shadow-xl p-1.5 animate-[vqDrop_0.16s_ease-out] origin-top">
                                        <button type="button" role="menuitem" onClick={() => { setOpenMenu(null); handleAddProduct(); }} className="w-full h-10 px-3 rounded-[12px] flex items-center gap-2.5 text-sm font-semibold text-ink hover:bg-interactive-hover transition-colors">
                                            <Package size={16} className="text-brand-600" /> {tt('Add Product')}
                                        </button>
                                        <button type="button" role="menuitem" onClick={() => { setOpenMenu(null); handleAddService(); }} className="w-full h-10 px-3 rounded-[12px] flex items-center gap-2.5 text-sm font-semibold text-ink hover:bg-interactive-hover transition-colors">
                                            <Wrench size={16} className="text-indigo-600" /> {tt('Add Service')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : hasProducts ? (
                            <button id={isMd ? 'tour-add-product' : undefined} type="button" onClick={handleAddProduct} className="h-10 px-4 rounded-[12px] bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
                                <Plus size={16} /> {tt('Add Product')}
                            </button>
                        ) : hasServices ? (
                            <button id={isMd ? 'tour-add-product' : undefined} type="button" onClick={handleAddService} className="h-10 px-4 rounded-[12px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap">
                                <Wrench size={15} /> {tt('Add Service')}
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* ── ROW 2 · four stat cards — exactly the toolbar's height (h-14) ── */}
                <div className="hidden md:grid grid-cols-4 gap-2 shrink-0">
                    {cards.map(card => {
                        const CardIcon = card.icon;
                        return (
                            <div key={card.label} className="h-14 flex items-center gap-3 px-3 bg-surface border border-line rounded-[14px] shadow-sm min-w-0">
                                <div className={`h-8 w-8 rounded-[12px] flex items-center justify-center shrink-0 ${card.icon_tone}`}>
                                    <CardIcon size={16} />
                                </div>
                                <p className="flex-1 min-w-0 truncate text-xs font-bold uppercase tracking-wide text-ink-muted">{card.label}</p>
                                <p className={`text-base font-bold tabular-nums whitespace-nowrap ${card.value_tone}`}>{card.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Unlimited Selling Mode Notice */}
                {hasProducts && !isStockTracked && (
                    <div className="bg-teal-50/90 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-[14px] px-3.5 py-2 flex flex-wrap items-center justify-between gap-y-2 gap-3 text-xs text-teal-900 dark:text-teal-200 shrink-0">
                        <div className="flex items-center gap-2">
                            <Sparkles size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>
                                <strong>Unlimited Selling Mode Active:</strong> Products sell freely without stock constraints or out-of-stock blockers. We track <strong>Total Units Sold</strong> instead of stock counts.
                            </span>
                        </div>
                        <Link
                            href={route('store.admin.settings', { store_slug: store?.slug })}
                            className="text-2xs font-bold text-teal-700 dark:text-teal-300 underline hover:text-teal-900 shrink-0"
                        >
                            Settings
                        </Link>
                    </div>
                )}

                {/* Phone: type segmented control (only when both kinds exist) + category chips */}
                <div className="md:hidden bg-surface rounded-[14px] border border-line shadow-sm shrink-0 p-1.5 flex flex-col gap-1.5 select-none">
                    {bothKinds && (
                        <div className="grid grid-cols-3 gap-0.5 rounded-[12px] bg-app p-0.5">
                            {[['all', 'All Items', null], ['standard', tt('Products'), null], ['service', tt('Services'), Wrench]].map(([key, label, Icon]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleTypeChange(key)}
                                    className={`flex items-center justify-center gap-1 rounded-[10px] py-1.5 text-xs font-semibold transition-colors ${activeType === key ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'}`}
                                >
                                    {Icon && <Icon size={12} />}
                                    <span className="truncate">{label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar vq-no-scrollbar px-0.5 pb-0.5">
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${activeCategory === 'all' ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-ink-secondary'}`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(cat.id)}
                                className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${String(activeCategory) === String(cat.id) ? 'bg-brand-600 border-brand-600 text-white' : 'bg-surface border-line text-ink-secondary'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                        <span className="shrink-0 w-4" aria-hidden="true" />
                    </div>
                </div>

                {/* Mobile Toolbar */}
                <div className="md:hidden flex flex-col gap-0 bg-surface rounded-[14px] border border-line shadow-sm shrink-0">
                    <div className="flex flex-wrap items-center justify-between gap-y-2 px-3 py-2">
                        <h1 className="text-sm font-bold text-ink uppercase tracking-tight">{pageTitle}</h1>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowMobileSearch(!showMobileSearch)}
                                className={`p-2 rounded-[12px] transition-colors ${showMobileSearch ? 'bg-brand-600 text-white shadow-sm' : 'bg-sunken text-ink-muted'}`}
                                title="Search"
                            >
                                <Search size={16} />
                            </button>
                            <Link
                                href={route('store.admin.data', { store_slug: store?.slug })}
                                className="p-2 bg-sunken text-ink-muted rounded-[12px] transition-colors"
                                title="Import/Export"
                            >
                                <Upload size={16} />
                            </Link>
                            {hasServices && (
                                <button
                                    onClick={handleAddService}
                                    className="px-2.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[12px] flex items-center gap-1 transition-all shadow-md active:scale-95 font-bold text-xs"
                                    title={tt('Add Service')}
                                >
                                    <Wrench size={13} /> {tt('Service')}
                                </button>
                            )}
                            {hasProducts && (
                                <button
                                    id={!isMd ? 'tour-add-product' : undefined}
                                    onClick={handleAddProduct}
                                    className="ml-1 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] flex items-center gap-1.5 transition-all shadow-md active:scale-95 font-bold text-xs"
                                >
                                    <Plus size={14} /> {tt('Product')}
                                </button>
                            )}
                        </div>
                    </div>
                    {showMobileSearch && (
                        <div className="px-3 pb-2 border-t border-line pt-2 animate-in slide-in-from-top duration-normal">
                            <div className="relative w-full flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleServerSearch}
                                        placeholder={tt('Search products & services...')}
                                        className="w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-[12px] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={14} />
                                </div>
                                <button
                                    onClick={() => { applyFilters({ search: searchTerm }); setShowMobileSearch(false); }}
                                    className="px-3 py-1.5 bg-brand-600 text-white rounded-[12px] text-xs font-bold"
                                >
                                    Go
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk Actions Bar */}
                {selectedProducts.length > 0 && (
                    <div className="bg-brand-600 text-white px-4 py-2 rounded-[14px] flex flex-wrap items-center justify-between gap-y-2 shadow-lg animate-in slide-in-from-top-2">
                        <span className="font-bold text-sm">{selectedProducts.length} Selected</span>
                        <div className="flex items-center gap-2">
                            <button onClick={handleBulkDelete} className="px-3 py-1 bg-white text-brand-600 rounded-[12px] text-xs font-bold hover:bg-interactive-hover transition-colors flex items-center gap-1">
                                <Trash2 size={14} /> Delete Selected
                            </button>
                            <button onClick={() => setSelectedProducts([])} className="p-1 hover:bg-brand-700 rounded transition-colors"><X size={16} /></button>
                        </div>
                    </div>
                )}

                {/* Desktop Table */}
                <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-auto rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className="sticky top-0 z-10 bg-app border-b border-line px-3 py-2.5 w-10">
                                    <input type="checkbox" className="rounded border-line text-brand-600 focus:ring-brand-600" checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0} onChange={handleSelectAll} />
                                </th>
                                {tableColumns.map((col, index) => {
                                    const sortable = col.key !== 'actions';
                                    const kind = FILTER_KIND[col.key];
                                    const filterable = !!kind && (col.key !== 'status' || statusOptions.length > 0) && (col.key !== 'available_stock' || hasProducts);
                                    const menuKey = `f:${col.key}`;
                                    const filtered = !!colFilters[col.key];
                                    const sortedHere = sortConfig.key === col.key;
                                    return (
                                        <th
                                            key={col.key}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            className={`sticky top-0 ${openMenu === menuKey ? 'z-20' : 'z-10'} bg-app border-b border-line px-3 py-2.5 text-xs font-bold text-ink-muted uppercase tracking-wider select-none ${draggedColumn === index ? 'opacity-50' : ''}`}
                                            style={{ width: col.width }}
                                            aria-sort={sortedHere ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                                        >
                                            <div className="flex items-center gap-1">
                                                <div
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onClick={() => sortable && handleSort(col.key)}
                                                    className={`flex items-center gap-1.5 min-w-0 h-7 px-1.5 -ml-1.5 rounded-[12px] transition-colors ${sortable ? 'cursor-pointer hover:bg-interactive-hover hover:text-ink' : ''} ${sortedHere ? 'text-ink' : ''}`}
                                                    title={sortable ? `Sort by ${col.label}` : undefined}
                                                >
                                                    <span className="truncate">{col.label}</span>
                                                    {sortable && (sortedHere
                                                        ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-brand-500 shrink-0" /> : <ChevronDown size={14} className="text-brand-500 shrink-0" />)
                                                        : <ChevronsUpDown size={12} className="opacity-40 shrink-0" />)}
                                                </div>
                                                {filterable && (
                                                    <div className="relative" data-menu>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleMenu(menuKey)}
                                                            aria-label={`Filter ${col.label}`}
                                                            aria-expanded={openMenu === menuKey}
                                                            className={`h-7 w-7 rounded-[12px] flex items-center justify-center transition-colors ${filtered ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-interactive-hover hover:text-ink'}`}
                                                        >
                                                            <Filter size={13} />
                                                        </button>
                                                        {openMenu === menuKey && (
                                                            <FilterPopover
                                                                key={menuKey}
                                                                colKey={col.key}
                                                                label={col.label}
                                                                current={colFilters[col.key]}
                                                                options={statusOptions}
                                                                align={index >= tableColumns.length - 3 ? 'right' : 'left'}
                                                                onApply={(f) => setColFilter(col.key, f)}
                                                                onClear={() => setColFilter(col.key, null)}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {sortedProducts.length === 0 ? (
                                <tr><td colSpan={tableColumns.length + 1} className="p-5 sm:p-12 text-center text-ink-muted">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-4"><Package size={32} className="text-ink-muted" /></div>
                                        <p className="text-lg font-bold text-ink-secondary">{tt('No products or services found')}</p>
                                    </div>
                                </td></tr>
                            ) : (
                                sortedProducts.map((row) => (
                                    <tr key={row.id} className={`hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer ${selectedProducts.includes(row.id) ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`} onClick={() => handleViewProduct(row)}>
                                        <td className="px-3 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="rounded border-line text-brand-600 focus:ring-brand-600" checked={selectedProducts.includes(row.id)} onChange={() => handleSelectRow(row.id)} />
                                        </td>
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="px-3 py-2.5 text-sm text-ink-secondary">
                                                {(() => {
                                                    const isService = row.type === 'service';
                                                    switch (col.key) {
                                                        case 'name': return (
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-line shrink-0 ${isService ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                                                                    {row.image ? <img src={row.image} alt="" className="w-full h-full object-cover" /> : isService ? <Wrench size={14} /> : <Package size={14} />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-semibold text-ink">{row.name}</p>
                                                                        {isService && (
                                                                            <span className="px-1.5 py-0.2 rounded text-3xs font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                                                {tt('Service')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-ink-muted">
                                                                        {isService ? (row.skill_tag ? `Skill: ${row.skill_tag}` : 'Labor / Task') : (row.unit || 'pcs')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                        case 'sku': return row.sku || '-';
                                                        case 'category': return <span className="px-2 py-1 bg-sunken rounded text-xs font-semibold">{row.category}</span>;
                                                        case 'available_stock': return isService ? (
                                                            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                                                <Clock size={12} />
                                                                <span>{row.default_duration || 60} min</span>
                                                            </div>
                                                        ) : !isStockTracked ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-ink text-sm tabular-nums">
                                                                    {Number(row.units_sold || 0).toLocaleString()} <span className="text-2xs font-semibold text-ink-muted">sold</span>
                                                                </span>
                                                                <span className="text-3xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">
                                                                    Untracked
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span className={`font-bold ${row.available_stock < (row.min_stock_alert || 5) ? 'text-red-500' : 'text-ink-secondary dark:text-ink'}`}>{row.available_stock}</span>
                                                                {row.reserved_stock > 0 && <span className="text-2xs text-amber-500">{row.reserved_stock} Rsrvd</span>}
                                                            </div>
                                                        );
                                                        case 'cost_price': return formatCurrency(row.cost_price || 0, store);
                                                        case 'price': return (
                                                            <div className="flex flex-col">
                                                                <span className="font-bold">{formatCurrency(row.price || 0, store)}</span>
                                                                {isService && row.service_pricing && row.service_pricing !== 'fixed' && (
                                                                    <span className="text-3xs text-ink-muted uppercase font-bold">
                                                                        {row.service_pricing === 'hourly' ? '/ hr' : row.service_pricing === 'per_unit' ? '/ unit' : 'estimate'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                        case 'status': return (
                                                            <span className={`px-2 py-1 rounded-full text-2xs font-bold border ${
                                                                isService
                                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                                                                    : !isStockTracked
                                                                        ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                                                                        : row.status === 'In Stock'
                                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                                            : row.status === 'Low Stock'
                                                                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                                : 'bg-red-50 text-red-600 border-red-200'
                                                            }`}>
                                                                {isService ? 'Available' : !isStockTracked ? 'Active' : row.status}
                                                            </span>
                                                        );
                                                        case 'actions': return (
                                                            <div className="relative action-menu-container">
                                                                <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === row.id ? null : row.id); }} className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors"><MoreVertical size={16} /></button>
                                                                {activeActionMenu === row.id && (
                                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-[14px] shadow-xl border border-line z-50 animate-in zoom-in-95 p-1">
                                                                        {!isService && (!Array.isArray(modules) || modules.includes('variants')) && (
                                                                            <Link href={route('store.products.variants.index', { store_slug: store?.slug, product: row.id })} className="w-full text-left px-3 py-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg flex items-center gap-2 text-sm text-ink-secondary"><Layers size={14} /> Variants</Link>
                                                                        )}
                                                                        <button onClick={(e) => handleEditProduct(row, e)} className="w-full text-left px-3 py-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg flex items-center gap-2 text-sm text-ink-secondary"><Edit size={14} /> Edit Details</button>
                                                                        <div className="h-px bg-sunken my-1"></div>
                                                                        <button onClick={() => { setActiveActionMenu(null); handleDeleteProduct(row); }} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600"><Trash2 size={14} /> Delete</button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                        default: return row[col.key];
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <div ref={observerTarget} className="p-4 text-center text-ink-muted text-sm border-t border-line opacity-0">
                        {nextPageUrl ? 'Loading...' : (sortedProducts.length > 0 ? 'End of list' : '')}
                    </div>
                </div>

                {/* Mobile Product Cards */}
                <div className="md:hidden flex flex-col gap-2 pb-20">
                    {sortedProducts.length === 0 ? (
                        <div className="bg-surface rounded-xl p-4 sm:p-8 text-center border border-line">
                            <Package size={32} className="mx-auto text-ink-muted mb-2" />
                            <p className="text-sm font-bold text-ink-secondary">{tt('No products or services found')}</p>
                            <p className="text-xs text-ink-muted mt-1">Try adjusting your search or add a new item.</p>
                        </div>
                    ) : (
                        sortedProducts.map((row) => {
                            const isService = row.type === 'service';
                            return (
                                <div
                                    key={row.id}
                                    className="p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 cursor-pointer hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                                    onClick={() => handleViewProduct(row)}
                                >
                                    {/* Row 1: Image + Name (Left) | Status (Right) */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-line shrink-0 ${isService ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}>
                                                {row.image ? <img src={row.image} alt="" className="w-full h-full object-cover" /> : isService ? <Wrench size={18} /> : <Package size={18} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="font-bold text-ink text-sm leading-tight">{row.name}</h3>
                                                    {isService && (
                                                        <span className="px-1.5 py-0.2 rounded text-3xs font-black uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                                            {tt('Service')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-2xs text-ink-muted font-semibold mt-0.5">
                                                    {isService ? (row.skill_tag ? `Skill: ${row.skill_tag}` : 'Labor / Task') : (row.unit || 'pcs')}
                                                    {row.sku ? ` • ${row.sku}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-3xs font-bold border shrink-0 ${
                                            isService
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                                                : !isStockTracked
                                                    ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                                                    : row.status === 'In Stock'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                        : row.status === 'Low Stock'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                            : 'bg-red-50 text-red-600 border-red-200'
                                        }`}>{isService ? 'Available' : !isStockTracked ? 'Active' : row.status}</span>
                                    </div>

                                    {/* Row 2: Category badge */}
                                    {row.category && (
                                        <div>
                                            <span className="text-3xs font-bold uppercase bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted px-2 py-0.5 rounded border border-line">
                                                {row.category}
                                            </span>
                                        </div>
                                    )}

                                    {/* Row 3: Stock + Price + Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-line pt-2 mt-1">
                                        <div className="flex items-center gap-5">
                                            {isService ? (
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Duration</span>
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums flex items-center gap-1">
                                                        <Clock size={11} /> {row.default_duration || 60}m
                                                    </span>
                                                </div>
                                            ) : !isStockTracked ? (
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Sold</span>
                                                    <span className="text-xs font-bold text-teal-700 dark:text-teal-300 tabular-nums">
                                                        {Number(row.units_sold || 0).toLocaleString()} <span className="text-4xs text-ink-muted">units</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Stock</span>
                                                    <span className={`text-xs font-bold tabular-nums ${row.available_stock < (row.min_stock_alert || 5) ? 'text-red-500' : 'text-ink'}`}>
                                                        {row.available_stock}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Price</span>
                                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 tabular-nums">
                                                    {formatCurrency(row.price || 0, store)}
                                                    {isService && row.service_pricing && row.service_pricing !== 'fixed' && (
                                                        <span className="text-3xs ml-0.5 text-ink-muted uppercase">/{row.service_pricing === 'hourly' ? 'hr' : 'unit'}</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-3xs text-ink-muted font-bold uppercase block tracking-wider">Cost</span>
                                                <span className="text-xs font-bold text-ink-secondary tabular-nums">{formatCurrency(row.cost_price || 0, store)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => handleEditProduct(row, e)} className="p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors" title="Edit"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteProduct(row)} className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-ink-muted hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={observerTarget} className="py-4 text-center text-ink-muted text-sm">
                        {nextPageUrl ? 'Loading more...' : ''}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
