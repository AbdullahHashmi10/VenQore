import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Head, router, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import StockModuleTabs from '@/Components/StockModuleTabs';
import ProductModal from '@/Components/ProductModal';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Package,
    AlertTriangle,
    DollarSign,
    Box,
    Upload,
    Download,
    CheckSquare,
    ChevronUp,
    ChevronDown,
    X,
    Layers,
    BarChart3
} from 'lucide-react';

import PasscodeModal from '@/Components/PasscodeModal';

export default function Inventory({ products: serverProducts, filters, stats, warehouses, categories, attributes }) {
    const { flash, store } = usePage().props;

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
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [sortConfig, setSortConfig] = useState({ 
        key: params.get('sort_by') || 'name', 
        direction: params.get('sort_dir') || 'asc' 
    });
    const [draggedColumn, setDraggedColumn] = useState(null);

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Columns Configuration
    const [tableColumns, setTableColumns] = useState([
        { key: 'name', label: 'Product Name', width: '25%' },
        { key: 'sku', label: 'SKU', width: '10%' },
        { key: 'category', label: 'Category', width: '15%' },
        { key: 'available_stock', label: 'Stock', width: '10%' },
        { key: 'cost_price', label: 'Cost', width: '10%' },
        { key: 'price', label: 'Price', width: '10%' },
        { key: 'status', label: 'Status', width: '10%' },
        { key: 'actions', label: 'Actions', width: '10%' }
    ]);

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

    // Debounced Search Logic
    const [debouncedSearch] = useMemo(() => {
        let timer;
        return [
            (val) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    router.get(route('store.inventory.index', { store_slug: store?.slug }), {
                        search: val,
                        sort_by: sortConfig.key,
                        sort_dir: sortConfig.direction
                    }, { preserveState: true, preserveScroll: true, replace: true });
                }, 400);
            }
        ];
    }, [sortConfig]);

    useEffect(() => {
        if (searchTerm !== (params.get('search') || '')) {
            debouncedSearch(searchTerm);
        }
    }, [searchTerm]);

    const applyFilters = (newParams) => {
        router.get(route('store.inventory.index', { store_slug: store?.slug }), {
            search: searchTerm,
            sort_by: sortConfig.key,
            sort_dir: sortConfig.direction,
            ...newParams
        }, { preserveState: true, preserveScroll: true });
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
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEditProduct = (product, e) => {
        if (e) e.stopPropagation();
        setSelectedProduct(product);
        setModalMode('edit');
        setIsModalOpen(true);
        setActiveActionMenu(null);
    };

    const handleViewProduct = (product) => {
        setSelectedProduct(product);
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
            router.delete(route('store.inventory.destroy', { store_slug: store?.slug, product: pendingDeleteId }), {
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
        <OneGlanceLayout title="Inventory Management" activeMenu="Stock">
            <Head title="Inventory" />

            <PasscodeModal
                isOpen={isPasscodeModalOpen}
                onClose={() => {
                    setIsPasscodeModalOpen(false);
                    setPendingDeleteAction(null);
                    setPendingDeleteId(null);
                }}
                onSuccess={() => {
                    setIsPasscodeModalOpen(false);
                    executeDelete();
                }}
                actionName={pendingDeleteAction === 'bulk' ? `delete ${selectedProducts.length} selected products` : "delete this product"}
            />

            {/* Product Modal */}
            {isModalOpen && (
                <ProductModal
                    isOpen={isModalOpen}
                    product={selectedProduct}
                    mode={modalMode}
                    warehouses={warehouses}
                    categories={categories}
                    attributes={attributes}
                    onClose={() => {
                        setSelectedProduct(null);
                        setModalMode('view');
                        setIsModalOpen(false);
                    }}
                />
            )}

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden relative">



                <StockModuleTabs activeTab="products" />

                {/* Compact Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Package size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Products</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{stats?.total_products?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                                <AlertTriangle size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Low Stock</p>
                        </div>
                        <p className="text-base font-black text-amber-600">{stats?.low_stock_count?.toLocaleString() || 0}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 md:col-span-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <DollarSign size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Inventory Value</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">Rs {Number(stats?.inventory_value || 0).toLocaleString('en-PK')}</p>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Product <span className="text-indigo-600">Inventory</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <span className="text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1">
                            List View
                        </span>
                    </div>

                    {/* Right: Search + Button */}
                    <div className="flex items-center gap-2">
                        <div className="w-64 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleServerSearch}
                                placeholder="Search products..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                        <div className="flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <Link href={route('store.import-export.index', { store_slug: store?.slug })} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <Upload size={16} />
                            </Link>
                            <button
                                onClick={handleAddProduct}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20"
                            >
                                <Plus size={14} /> Add Product
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedProducts.length > 0 && (
                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
                        <span className="font-bold text-sm">{selectedProducts.length} Selected</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleBulkDelete}
                                className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedProducts([])}
                                className="p-1 hover:bg-indigo-700 rounded transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Custom Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                        checked={selectedProducts.length === sortedProducts.length && sortedProducts.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {tableColumns.map((col, index) => (
                                    <th
                                        key={col.key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={(e) => handleDrop(e, index)}
                                        onClick={() => col.key !== 'actions' && handleSort(col.key)}
                                        className={`
                                            p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${draggedColumn === index ? 'opacity-50 border-2 border-dashed border-indigo-500' : ''}
                                        `}
                                        style={{ width: col.width }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {col.label}
                                            {col.key !== 'actions' && sortConfig.key === col.key && (
                                                sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-indigo-500" /> : <ChevronDown size={14} className="text-indigo-500" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={tableColumns.length + 1} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                                <Package size={32} className="text-slate-400" />
                                            </div>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">No products found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedProducts.map((row) => (
                                    <tr
                                        key={row.id}
                                        className={`
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${selectedProducts.includes(row.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                                        `}
                                        onClick={() => handleViewProduct(row)}
                                    >
                                        <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                                checked={selectedProducts.includes(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                            />
                                        </td>
                                        {tableColumns.map((col) => (
                                            <td key={`${row.id}-${col.key}`} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                                {(() => {
                                                    switch (col.key) {
                                                        case 'name':
                                                            return (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                                                        {row.image ? <img src={row.image} alt="" className="w-full h-full object-cover" /> : <Package size={14} className="text-indigo-600 dark:text-indigo-400" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-800 dark:text-white">{row.name}</p>
                                                                        <p className="text-xs text-slate-400">{row.unit || 'pcs'}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        case 'sku':
                                                            return row.sku || '-';
                                                        case 'category':
                                                            return (
                                                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-semibold">
                                                                    {row.category}
                                                                </span>
                                                            )
                                                        case 'available_stock':
                                                            return (
                                                                <div className="flex flex-col">
                                                                    <span className={`font-bold ${row.available_stock < (row.min_stock_alert || 5) ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                        {row.available_stock}
                                                                    </span>
                                                                    {row.reserved_stock > 0 && <span className="text-[10px] text-amber-500">{row.reserved_stock} Rsrvd</span>}
                                                                </div>
                                                            );
                                                        case 'cost_price':
                                                            return String(Number(row.cost_price || 0).toLocaleString());
                                                        case 'price':
                                                            return <span className="font-bold"> {Number(row.price).toLocaleString()}</span>;
                                                        case 'status':
                                                            return (
                                                                <span className={`
                                                                    px-2 py-1 rounded-full text-[10px] font-bold border
                                                                    ${row.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                                                                    ${row.status === 'Low Stock' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                                                                    ${row.status === 'Out of Stock' ? 'bg-red-50 text-red-600 border-red-200' : ''}
                                                                `}>
                                                                    {row.status}
                                                                </span>
                                                            );
                                                        case 'actions':
                                                            return (
                                                                <div className="relative action-menu-container">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                                                                        }}
                                                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>

                                                                    {activeActionMenu === row.id && (
                                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in-95 p-1">
                                                                            <Link
                                                                                href={route('store.products.variants.index', { store_slug: store?.slug, product: row.id })}
                                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                                            >
                                                                                <Layers size={14} /> Variants
                                                                            </Link>
                                                                            <button
                                                                                onClick={(e) => handleEditProduct(row, e)}
                                                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                                            >
                                                                                <Edit size={14} /> Edit Details
                                                                            </button>
                                                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setActiveActionMenu(null);
                                                                                    handleDeleteProduct(row);
                                                                                }}
                                                                                className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600"
                                                                            >
                                                                                <Trash2 size={14} /> Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        default:
                                                            return row[col.key];
                                                    }
                                                })()}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Infinite Scroll Sentinel */}
                    <div ref={observerTarget} className="p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0">
                        {nextPageUrl ? 'Loading...' : (sortedProducts.length > 0 ? 'End of list' : '')}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
