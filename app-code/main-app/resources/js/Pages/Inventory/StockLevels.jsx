import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs, { useStockNavGroups, ListFilterSelect } from '@/Components/StockModuleTabs';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import { Package, Warehouse, AlertTriangle as AlertTriangleIcon, TrendingUp, TrendingDown, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import { useTermText } from '@/lib/terms';

export default function StockLevels({ products = [], warehouses = [], stats = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // Format currency
    const { props } = usePage();
    const store = props.store || {};
    const tt = useTermText();
    const navGroups = useStockNavGroups();


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
        <OneGlanceLayout title="Stock Levels" activeMenu="Stock" noPadding>
            <Head title="Stock Levels" />

            <ListPageFrame className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <ListToolbar
                    title="Stock Levels"
                    navGroups={navGroups}
                    activeId="levels"
                    left={
                        <>
                            <ListFilterSelect
                                value={activeFilter}
                                onChange={setActiveFilter}
                                ariaLabel="Stock status"
                                options={[{ value: 'all', label: 'All stock' }, { value: 'low', label: 'Low Stock' }, { value: 'out', label: 'Out of Stock' }, { value: 'normal', label: 'In Stock' }]}
                            />
                            {warehouses.length > 1 && (
                                <ListFilterSelect
                                    value={selectedWarehouse}
                                    onChange={setSelectedWarehouse}
                                    allValue=""
                                    ariaLabel="Warehouse"
                                    options={[{ value: '', label: 'All Warehouses' }, ...warehouses.map((w) => ({ value: String(w.id), label: w.name }))]}
                                />
                            )}
                        </>
                    }
                    actions={
                        <div className="w-64">
                            <AsyncProductCombobox
                                onSelect={(product) => {
                                    if (!product) { setSearchTerm(''); return; }
                                    setSearchTerm(product.name);
                                }}
                                placeholder={tt('Search products...')}
                            />
                        </div>
                    }
                />
                <ListStatCards cards={[
                    { label: tt('Total Products'), value: stats.total_products || products.length, icon: Package, icon_tone: 'bg-brand-50 text-brand-600' },
                    { label: 'Stock Value', value: formatCurrency(stats.total_value, store), icon: TrendingUp, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Low Stock', value: stats.low_stock_count || 0, icon: AlertTriangleIcon, icon_tone: 'bg-amber-50 text-amber-600', value_tone: 'text-amber-600' },
                    { label: 'Out of Stock', value: stats.out_of_stock_count || 0, icon: TrendingDown, icon_tone: 'bg-rose-50 text-rose-600', value_tone: 'text-rose-600' },
                ]} />
                <div className="md:hidden"><StockModuleTabs activeTab="levels" /></div>

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Stock Levels"
                    filters={[
                        { key: 'status', icon: Filter, label: 'Stock status', value: activeFilter, onChange: setActiveFilter, options: [{ id: 'all', label: 'All stock' }, { id: 'low', label: 'Low Stock' }, { id: 'out', label: 'Out of Stock' }, { id: 'normal', label: 'In Stock' }] },
                        ...(warehouses.length > 1 ? [{ key: 'wh', icon: Warehouse, label: 'Warehouse', value: selectedWarehouse, onChange: setSelectedWarehouse, options: [{ id: '', label: 'All Warehouses' }, ...warehouses.map((w) => ({ id: String(w.id), label: w.name }))] }] : []),
                    ]}
                    search={{ event: true,  value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: tt('Search products...') }}
                />
                <MobileStats bp="md" hero={1} items={[
                    { label: tt('Total Products'), value: stats.total_products || products.length, tone: 'brand', icon: Package },
                    { label: 'Stock Value', value: formatCurrency(stats.total_value, store), tone: 'emerald', icon: TrendingUp },
                    { label: 'Low Stock', value: stats.low_stock_count || 0, tone: 'amber', icon: AlertTriangleIcon },
                    { label: 'Out of Stock', value: stats.out_of_stock_count || 0, tone: 'rose', icon: TrendingDown }
                ]} />

                {/* Main Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th
                                    onClick={() => handleSort('name')}
                                    className="p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                >
                                    <div className="flex items-center gap-1">
                                        {tt('Product')} <SortIcon columnKey="name" />
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
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
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
                                    Min Stock
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">
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
                                    <td colSpan={6} className="p-5 sm:p-12">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3">
                                                <Package size={28} className="text-ink-muted" />
                                            </div>
                                            <p className="text-base font-bold text-ink-secondary mb-1">{tt('No products found')}</p>
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
