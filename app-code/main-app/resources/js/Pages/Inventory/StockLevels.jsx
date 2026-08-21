import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { Package, Warehouse, AlertTriangle as AlertTriangleIcon, TrendingUp, TrendingDown, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function StockLevels({ products = [], warehouses = [], stats = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Format currency
    const { props } = usePage();
    const store = props.store || {};


    // Filter and search products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Apply status filter
        if (activeFilter === 'low') {
            result = result.filter(p => {
                const stock = p.total_stock || 0;
                return stock > 0 && stock <= (p.min_stock_alert || 5);
            });
        } else if (activeFilter === 'out') {
            result = result.filter(p => (p.total_stock || 0) === 0);
        } else if (activeFilter === 'normal') {
            result = result.filter(p => (p.total_stock || 0) > (p.min_stock_alert || 5));
        }

        // Apply warehouse filter
        if (selectedWarehouse) {
            result = result.filter(p =>
                p.stocks?.some(s => s.warehouse_id == selectedWarehouse)
            );
        }

        // Apply search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.category?.name?.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case 'name':
                    valA = a.name?.toLowerCase() || '';
                    valB = b.name?.toLowerCase() || '';
                    break;
                case 'stock':
                    valA = a.total_stock || 0;
                    valB = b.total_stock || 0;
                    break;
                case 'value':
                    valA = (a.total_stock || 0) * (a.cost_price || 0);
                    valB = (b.total_stock || 0) * (b.cost_price || 0);
                    break;
                default:
                    valA = a[sortConfig.key];
                    valB = b[sortConfig.key];
            }
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [products, activeFilter, selectedWarehouse, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={14} className="text-brand-500" />
            : <ChevronDown size={14} className="text-brand-500" />;
    };

    return (
        <OneGlanceLayout title="Stock Levels" activeMenu="Stock">
            <Head title="Stock Levels" />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <StockModuleTabs activeTab="levels" />

                {/* Stats Cards - 4 Separate Cards in Row */}
                <div className="grid grid-cols-4 gap-1 shrink-0">
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Total Products</p>
                        </div>
                        <p className="text-lg font-bold text-ink">{stats.total_products || products.length}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <TrendingUp size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Stock Value</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.total_value, store)}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AlertTriangleIcon size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Low Stock</p>
                        </div>
                        <p className="text-lg font-bold text-amber-600">{stats.low_stock_count || 0}</p>
                    </div>
                    <div className="bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-ink-muted uppercase">Out of Stock</p>
                        </div>
                        <p className="text-lg font-bold text-rose-600">{stats.out_of_stock_count || 0}</p>
                    </div>
                </div>

                {/* Header Bar - Title + Filter Pills + Search (like Proposals) */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0">
                    {/* Left: Title + Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-bold text-ink uppercase tracking-tight shrink-0">
                            Stock <span className="text-brand-600">Overview</span>
                        </h1>
                        <div className="h-4 w-px bg-sunken mx-1"></div>
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'all'
                                ? 'bg-brand-600 text-white'
                                : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >All</button>
                        <button
                            onClick={() => setActiveFilter('low')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'low'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg '
                                : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Low Stock</button>
                        <button
                            onClick={() => setActiveFilter('out')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'out'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg '
                                : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >Out of Stock</button>
                        <button
                            onClick={() => setActiveFilter('normal')}
                            className={`px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === 'normal'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg '
                                : 'bg-sunken text-ink-muted hover:bg-interactive-hover'
                                }`}
                        >In Stock</button>

                        {/* Warehouse Filter */}
                        {warehouses.length > 1 && (
                            <>
                                <div className="h-4 w-px bg-sunken mx-1"></div>
                                <select
                                    value={selectedWarehouse}
                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                    className="px-2 py-1 text-xs font-semibold bg-app border border-line rounded-lg focus:ring-1 focus:ring-brand-500 outline-none"
                                >
                                    <option value="">All Warehouses</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </>
                        )}
                    </div>

                    {/* Right: Search */}
                    <div className="flex items-center gap-2">
                        <div className="w-64">
                            <AsyncProductCombobox
                                onSelect={(product) => {
                                    if (!product) { setSearchTerm(''); return; }
                                    setSearchTerm(product.name);
                                }}
                                placeholder="Search products..."
                            />
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th
                                    onClick={() => handleSort('name')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Product <SortIcon columnKey="name" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Category
                                </th>
                                <th
                                    onClick={() => handleSort('stock')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Total Stock <SortIcon columnKey="stock" />
                                    </div>
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Min Stock
                                </th>
                                <th className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    By Warehouse
                                </th>
                                <th
                                    onClick={() => handleSort('value')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        Stock Value <SortIcon columnKey="value" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                <Package size={28} className="text-ink-muted" />
                                            </div>
                                            <p className="text-base font-bold text-ink-secondary mb-1">No products found</p>
                                            <p className="text-sm text-ink-muted">Try adjusting your filters or search term</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((row) => {
                                    const isLow = (row.total_stock || 0) <= (row.min_stock_alert || 0) && (row.total_stock || 0) > 0;
                                    const isOut = (row.total_stock || 0) === 0;

                                    return (
                                        <tr
                                            key={row.id}
                                            className={`
                                                hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all
                                                ${isOut ? 'bg-red-50/30 dark:bg-red-900/5 border-l-4 border-red-500' :
                                                    isLow ? 'bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-amber-500' :
                                                        'border-l-4 border-transparent'}
`}
                                        >
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-sunken flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {row.image_path ? (
                                                            <img src={`/storage/${row.image_path}`} alt={row.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package size={16} className="text-ink-muted" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-ink">{row.name}</p>
                                                        <p className="text-2xs text-ink-muted font-mono">{row.sku || 'No SKU'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm text-ink-secondary">
                                                    {row.category?.name || 'Uncategorized'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm ${isOut ? 'text-red-600' :
                                                        isLow ? 'text-amber-600' :
                                                            'text-ink'
                                                        }`}>
                                                        {row.total_stock || 0}
                                                    </span>
                                                    {isLow && <AlertTriangleIcon size={14} className="text-amber-500" />}
                                                    {isOut && <AlertTriangleIcon size={14} className="text-red-500" />}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="text-sm text-ink-muted">{row.min_stock_alert || 0}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {row.stocks?.map((stock, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-1.5 py-0.5 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 rounded text-2xs font-medium"
                                                            title={stock.warehouse?.name}
                                                        >
                                                            {stock.warehouse?.name?.substring(0, 3)}: {stock.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-semibold text-sm text-emerald-600">
                                                    {formatCurrency((row.total_stock || 0) * (row.cost_price || 0), store)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
