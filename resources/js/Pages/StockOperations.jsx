import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import StockModuleTabs from '@/Components/StockModuleTabs';

import { ArrowRightLeft, Settings, ClipboardCheck, Plus, Search, Download, Box, Maximize2, Minimize2, Save, Trash2, RefreshCcw, XCircle, CheckSquare, Square, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import PremiumSelect from '@/Components/PremiumSelect';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function StockOperations({ products, warehouses, reasons }) {
    const {
        store
    } = usePage().props;

    // Smart default: Skip transfers if only 1 warehouse
    const hasMultipleWarehouses = warehouses?.length > 1;
    const defaultWarehouse = warehouses?.length === 1 ? warehouses[0] : null;

    // Get active tab from URL params (controlled by StockModuleTabs)
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    const activeTab = urlTab === 'warehouses' ? 'warehouses' : 'adjustments';

    return (
        <OneGlanceLayout title="Stock Operations" activeMenu="Stock">
            <Head title="Stock Operations" />

            <div className="h-full flex flex-col">
                <StockModuleTabs activeTab={activeTab} />

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900 relative">
                    {activeTab === 'warehouses' && <WarehouseManagement warehouses={warehouses} />}
                    {activeTab === 'adjustments' && <StockAdjustments products={products} warehouses={warehouses} defaultWarehouse={defaultWarehouse} hasMultipleWarehouses={hasMultipleWarehouses} reasons={reasons} />}
                </div>
            </div>
        </OneGlanceLayout>
    );
}

function WarehouseManagement({ warehouses }) {
    const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        location: '',
        contact_person: '',
        phone: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingWarehouse) {
            put(route('store.stock-operations.warehouse.update', editingWarehouse.id), {
                onSuccess: () => {
                    reset();
                    setEditingWarehouse(null);
                    setIsAddingWarehouse(false);
                },
            });
        } else {
            post(route('store.stock-operations.warehouse.store', { store_slug: store.slug }), {
                onSuccess: () => {
                    reset();
                    setIsAddingWarehouse(false);
                },
            });
        }
    };

    const startEdit = (warehouse) => {
        setEditingWarehouse(warehouse);
        setData({
            name: warehouse.name,
            location: warehouse.location || '',
            contact_person: warehouse.contact_person || '',
            phone: warehouse.phone || '',
        });
        setIsAddingWarehouse(true);
    };

    const cancelEdit = () => {
        setEditingWarehouse(null);
        setIsAddingWarehouse(false);
        reset();
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Warehouse Management</h2>
                {!isAddingWarehouse && (
                    <PremiumButton onClick={() => setIsAddingWarehouse(true)}>
                        <Plus size={18} />
                        Add Warehouse
                    </PremiumButton>
                )}
            </div>

            {isAddingWarehouse ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 max-w-2xl">
                    <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">
                        {editingWarehouse ? 'Edit Warehouse Details' : 'Add New Warehouse'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Warehouse Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                placeholder="e.g. Main Store, Downtown Branch"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Location / Address</label>
                            <input
                                type="text"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                placeholder="e.g. 123 Main St, New York"
                                required
                            />
                            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contact Person (Optional)</label>
                                <input
                                    type="text"
                                    value={data.contact_person}
                                    onChange={(e) => setData('contact_person', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    placeholder="Manager Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone (Optional)</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <PremiumButton type="submit" disabled={processing}>
                                {editingWarehouse ? 'Update Details' : 'Create Warehouse'}
                            </PremiumButton>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-4">
                    {(!warehouses || warehouses.length === 0) ? (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Box size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No warehouses yet</p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click "Add Warehouse" to create your first warehouse</p>
                        </div>
                    ) : (
                        warehouses.map(warehouse => {
                            const isInfoMissing = !warehouse.location || warehouse.location === 'Main Location' || warehouse.location === 'Default Location';

                            return (
                                <div key={warehouse.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group hover:border-indigo-500/30 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{warehouse.name}</h3>
                                            {isInfoMissing ? (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wider">
                                                    Info Required
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <p className="flex items-center gap-1">
                                                <span className="text-slate-400">📍</span>
                                                {warehouse.location || 'No location specified'}
                                            </p>
                                            {warehouse.contact_person && (
                                                <p className="flex items-center gap-1">
                                                    <span className="text-slate-400">👤</span>
                                                    {warehouse.contact_person}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => startEdit(warehouse)}
                                        className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                    >
                                        {isInfoMissing ? 'Update Info' : 'Edit'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

function StockTransfers({ products, warehouses }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        from_warehouse_id: '',
        to_warehouse_id: '',
        quantity: 0,
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.stock-operations.transfer', { store_slug: store.slug }), {
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Transfer Stock Between Warehouses</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Product</label>
                        <AsyncProductCombobox
                            onSelect={(p) => p && setData('product_id', p.id)}
                            placeholder="Search product..."
                        />
                        {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">From Warehouse</label>
                        <PremiumSelect
                            options={warehouses?.map(w => ({ id: w.id, name: w.name })) || []}
                            value={data.from_warehouse_id}
                            onChange={(val) => setData('from_warehouse_id', val)}
                            placeholder="Select Source Warehouse"
                        />
                        {errors.from_warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.from_warehouse_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">To Warehouse</label>
                        <PremiumSelect
                            options={warehouses?.filter(w => w.id != data.from_warehouse_id).map(w => ({ id: w.id, name: w.name })) || []}
                            value={data.to_warehouse_id}
                            onChange={(val) => setData('to_warehouse_id', val)}
                            placeholder="Select Destination Warehouse"
                        />
                        {errors.to_warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.to_warehouse_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Quantity to Transfer</label>
                        <input
                            type="number"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', e.target.value)}
                            min="1"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                            required
                        />
                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none resize-none"
                            placeholder="Add any notes about this transfer..."
                        />
                    </div>

                    <PremiumButton type="submit" disabled={processing} className="w-full py-3">
                        <ArrowRightLeft size={18} />
                        {processing ? 'Processing...' : 'Transfer Stock'}
                    </PremiumButton>
                </form>
            </div>
        </div>
    );
}

function StockAdjustments({ products, warehouses, reasons, defaultWarehouse, hasMultipleWarehouses }) {
    const defaultReasons = reasons || ['Damaged', 'Stolen', 'Found', 'Expired', 'Lost', 'Return', 'Other'];

    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        warehouse_id: defaultWarehouse?.id || '',
        adjustment_type: 'add',
        quantity: 0,
        reason: '',
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.stock-operations.adjust', { store_slug: store.slug }), {
            onSuccess: () => reset(),
        });
    };

    // Get selected product info
    const selectedProduct = products?.find(p => p.id == data.product_id);
    const currentWarehouseId = data.warehouse_id || (hasMultipleWarehouses ? '' : defaultWarehouse?.id);
    const stockEntry = selectedProduct?.stocks?.find(s => s.warehouse_id == currentWarehouseId);
    const currentStock = stockEntry?.quantity ? parseFloat(stockEntry.quantity) : 0;
    const newStock = data.adjustment_type === 'add'
        ? currentStock + parseInt(data.quantity || 0)
        : Math.max(0, currentStock - parseInt(data.quantity || 0));

    // Calculate stats from products
    const totalProducts = products?.length || 0;
    const totalStock = products?.reduce((sum, p) => {
        const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
        return sum + stock;
    }, 0) || 0;
    const lowStock = products?.filter(p => {
        const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
        return stock > 0 && stock <= (p.min_stock || 5);
    }).length || 0;
    const outOfStock = products?.filter(p => {
        const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
        return stock === 0;
    }).length || 0;

    return (
        <div className="flex flex-col h-full p-2 gap-1 overflow-hidden">
            {/* Stats Cards - Compact Single Line (like Sales page) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Box size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Products</p>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white">{totalProducts}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <CheckSquare size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Stock</p>
                    </div>
                    <p className="text-base font-black text-emerald-600">{totalStock.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            <AlertTriangle size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Low Stock</p>
                    </div>
                    <p className="text-base font-black text-amber-600">{lowStock}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                            <XCircle size={16} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Out of Stock</p>
                    </div>
                    <p className="text-base font-black text-rose-600">{outOfStock}</p>
                </div>
            </div>

            {/* Header Area - Compact Single Row (like Sales page) */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                {/* Left: Title + Type Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                        Stock <span className="text-indigo-600">Adjustment</span>
                    </h1>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        type="button"
                        onClick={() => setData('adjustment_type', 'add')}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 ${data.adjustment_type === 'add'
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        <Plus size={14} /> Add Stock
                    </button>
                    <button
                        type="button"
                        onClick={() => setData('adjustment_type', 'remove')}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 ${data.adjustment_type === 'remove'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        <Trash2 size={14} /> Remove Stock
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="flex-1 flex gap-2 overflow-hidden">
                {/* Left Side - Form */}
                <div className="flex-1 flex flex-col">
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col">
                            {/* Form Header */}
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                                <p className="text-xs font-bold text-slate-500 uppercase">Adjustment Form</p>
                            </div>

                            {/* Form Content - Optimized Grid */}
                            <div className="p-4 flex-1 flex flex-col gap-4">
                                {/* Row 1: Product + Warehouse */}
                                <div className="grid grid-cols-12 gap-3">
                                    <div className={hasMultipleWarehouses ? "col-span-8" : "col-span-12"}>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Select Product <span className="text-red-500">*</span>
                                        </label>
                                        <AsyncProductCombobox
                                            onSelect={(p) => p && setData('product_id', p.id)}
                                            placeholder="Search products..."
                                        />
                                        {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}
                                    </div>

                                    {hasMultipleWarehouses && (
                                        <div className="col-span-4">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                Warehouse <span className="text-red-500">*</span>
                                            </label>
                                            <PremiumSelect
                                                options={warehouses?.map(w => ({ id: w.id, name: w.name })) || []}
                                                value={data.warehouse_id}
                                                onChange={(val) => setData('warehouse_id', val)}
                                                placeholder="Select..."
                                                searchable={false}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Row 2: Quantity + Reason + Notes */}
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Quantity <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={data.quantity}
                                            onChange={(e) => setData('quantity', e.target.value)}
                                            min="1"
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none text-lg font-bold text-center transition-all"
                                            placeholder="0"
                                            required
                                        />
                                        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                                    </div>

                                    <div className="col-span-3">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <PremiumSelect
                                            options={defaultReasons.map(r => ({ id: r, name: r }))}
                                            value={data.reason}
                                            onChange={(val) => setData('reason', val)}
                                            placeholder="Select..."
                                            searchable={false}
                                        />
                                        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                                    </div>

                                    <div className="col-span-5">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                            Notes <span className="text-slate-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="Additional details..."
                                        />
                                    </div>

                                    <div className="col-span-2 flex items-end">
                                        <PremiumButton type="submit" disabled={processing} className="w-full py-2">
                                            {processing ? (
                                                <RefreshCcw size={16} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Check size={16} />
                                                    Apply
                                                </>
                                            )}
                                        </PremiumButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Right Side - Preview Panel */}
                <div className="w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                            <p className="text-xs font-bold text-slate-500 uppercase">Live Preview</p>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                            {selectedProduct ? (
                                <>
                                    {/* Product Info */}
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg mb-2">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedProduct.name}</p>
                                        <p className="text-[10px] text-slate-500 font-mono">SKU: {selectedProduct.sku}</p>
                                    </div>

                                    {/* Stock Change Visualization */}
                                    <div className="flex-1 flex flex-col justify-center items-center">
                                        {/* Current Stock */}
                                        <div className="text-center mb-1">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Current</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">{currentStock}</p>
                                        </div>

                                        {/* Arrow with Change */}
                                        <div className={`text-center py-1 text-xl font-bold ${data.adjustment_type === 'add' ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            <span>{data.adjustment_type === 'add' ? '↓ +' : '↓ −'}{data.quantity || 0}</span>
                                        </div>

                                        {/* New Stock */}
                                        <div className={`text-center p-2 rounded-xl w-full ${data.adjustment_type === 'add'
                                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
                                                : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800'
                                            }`}>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">After</p>
                                            <p className={`text-2xl font-black ${data.adjustment_type === 'add'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                }`}>{newStock}</p>
                                        </div>
                                    </div>

                                    {/* Reason Badge */}
                                    {data.reason && (
                                        <div className="mt-2 text-center">
                                            <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold">
                                                {data.reason}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <Box size={36} className="mb-2 opacity-30" />
                                    <p className="text-xs text-center">Select a product<br />to preview changes</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StockTake({ products, warehouses, defaultWarehouse, hasMultipleWarehouses, reasons }) {
    const [selectedWarehouse, setSelectedWarehouse] = useState(defaultWarehouse?.id || '');
    const [searchTerm, setSearchTerm] = useState('');
    const [auditItems, setAuditItems] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Modal State
    const [showDependencyWarning, setShowDependencyWarning] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [dependencyData, setDependencyData] = useState([]);
    const [pendingDeleteIds, setPendingDeleteIds] = useState([]);

    const defaultReasons = reasons || ['Damaged', 'Stolen', 'Found', 'Expired', 'Lost', 'Return', 'Correction', 'Other'];

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateAuditItem = (productId, field, value) => {
        setAuditItems(prev => {
            const existing = prev.find(item => item.product_id === productId);
            if (existing) {
                return prev.map(item =>
                    item.product_id === productId ? { ...item, [field]: value } : item
                );
            } else {
                return [...prev, { product_id: productId, [field]: value }];
            }
        });
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleDeleteRequest = async (ids) => {
        // 1. Check Dependencies
        try {
            const response = await axios.post(route("store.inventory.check-dependencies", {
                store_slug: store.slug
            }), { ids });
            if (response.data.length > 0) {
                setDependencyData(response.data);
                setPendingDeleteIds(ids);
                setShowDependencyWarning(true);
            } else {
                setPendingDeleteIds(ids);
                setShowDeleteConfirmation(true);
            }
        } catch (error) {
            console.error("Error checking dependencies", error);
            alert("Failed to check dependencies. Please try again.");
        }
    };

    const confirmDelete = () => {
        router.post(route("store.inventory.bulk-destroy", {
            store_slug: store.slug
        }), {
            ids: pendingDeleteIds
        }, {
            onSuccess: () => {
                setShowDeleteConfirmation(false);
                setShowDependencyWarning(false);
                setSelectedIds(new Set());
                setPendingDeleteIds([]);
            },
        });
    };

    const handleBulkDelete = () => {
        handleDeleteRequest(Array.from(selectedIds));
    };

    const handleBulkZero = () => {
        if (!confirm(`Set physical count to 0 for ${selectedIds.size} products?`)) return;

        setAuditItems(prev => {
            const newItems = [...prev];
            selectedIds.forEach(id => {
                const existingIndex = newItems.findIndex(item => item.product_id === id);
                if (existingIndex >= 0) {
                    newItems[existingIndex] = { ...newItems[existingIndex], physical_count: 0 };
                } else {
                    newItems.push({ product_id: id, physical_count: 0 });
                }
            });
            return newItems;
        });
        setSelectedIds(new Set());
    };

    const handleSubmitAudit = () => {
        router.post(route('store.stock-operations.audit', { store_slug: store.slug }), {
            warehouse_id: selectedWarehouse,
            audit_items: auditItems,
        });
    };

    // Shared Table Component to avoid duplication
    const ProductTable = () => (
        <table className="w-full relative">
            <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4 text-center w-12">
                        <button onClick={toggleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-indigo-600">
                            {selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                    </th>
                    <th className="p-4 text-center w-12">#</th>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-left">SKU</th>
                    <th className="p-4 text-center">System Count</th>
                    <th className="p-4 text-center">Physical Count</th>
                    <th className="p-4 text-center">Difference</th>
                    <th className="p-4 text-left">Reason (if diff)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {filteredProducts?.map((product, index) => {
                    const auditItem = auditItems.find(item => item.product_id === product.id);
                    const isSelected = selectedIds.has(product.id);

                    // Find stock for the selected warehouse
                    const warehouseStock = product.stocks?.find(s => s.warehouse_id == selectedWarehouse);
                    // Fallback to product.stock if warehouse stock is missing/zero (legacy support)
                    const systemCount = warehouseStock?.quantity ? parseFloat(warehouseStock.quantity) : (parseFloat(product.stock) || 0);

                    const physicalCount = auditItem?.physical_count !== undefined ? auditItem.physical_count : systemCount;
                    const difference = physicalCount - systemCount;
                    const reason = auditItem?.reason || '';

                    return (
                        <tr key={product.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                            <td className="p-4 text-center">
                                <button onClick={() => toggleSelect(product.id)} className={`flex items-center justify-center ${isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}>
                                    {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                            </td>
                            <td className="p-4 text-center text-slate-500 font-medium">{index + 1}</td>
                            <td className="p-4 font-medium text-slate-900 dark:text-white">{product.name}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400">{product.sku}</td>
                            <td className="p-4 text-center font-bold">{systemCount}</td>
                            <td className="p-4 text-center">
                                <input
                                    type="number"
                                    value={physicalCount}
                                    onChange={(e) => updateAuditItem(product.id, 'physical_count', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    className="w-24 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-center font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                                />
                            </td>
                            <td className={`p-4 text-center font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-slate-500'
                                }`}>
                                {difference > 0 && '+'}{difference}
                            </td>
                            <td className="p-4">
                                {difference !== 0 && (
                                    <PremiumSelect
                                        options={defaultReasons.map(r => ({ id: r, name: r }))}
                                        value={reason}
                                        onChange={(val) => updateAuditItem(product.id, 'reason', val)}
                                        placeholder="Select Reason"
                                        className="w-full"
                                    />
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <>
            {/* Dependency Warning Modal */}
            {showDependencyWarning && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-amber-200 dark:border-amber-900">
                        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-4">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">Warning: Dependencies Found</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">These items have existing stock or history.</p>
                            </div>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                You are about to delete items that have <strong>existing stock</strong> or <strong>past sales history</strong>.
                                Deleting them might affect your reports.
                            </p>
                            <ul className="space-y-2 mb-6">
                                {dependencyData.map(item => (
                                    <li key={item.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                                        <div className="flex gap-2 text-xs font-bold">
                                            {item.stock > 0 && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Stock: {item.stock}</span>}
                                            {item.has_sales && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Has Sales</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDependencyWarning(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowDependencyWarning(false); setShowDeleteConfirmation(true); }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg shadow-amber-500/30 transition-all"
                            >
                                I Understand, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Move to Recycle Bin?</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Are you sure you want to delete {pendingDeleteIds.length} items?
                                <br />
                                They will be moved to the Recycle Bin and can be restored later.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirmation(false)}
                                className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`h-full overflow-y-auto p-6 space-y-6 transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 p-8' : ''}`}>
                <div className={isFullScreen ? 'max-w-7xl mx-auto h-full flex flex-col' : ''}>
                    {/* Header Logic */}
                    {isFullScreen ? (
                        <div className="flex justify-between items-center mb-6">
                            {/* Focus Mode Header */}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Physical Inventory Count (Bulk Update)</h2>
                            <div className="flex gap-3">
                                {selectedIds.size > 0 && (
                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-bold text-slate-500">{selectedIds.size} selected</span>
                                        <button onClick={handleBulkZero} className="p-1 text-amber-600 hover:bg-amber-100 rounded" title="Set to 0">
                                            <XCircle size={16} />
                                        </button>
                                        <button onClick={handleBulkDelete} className="p-1 text-red-600 hover:bg-red-100 rounded" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsFullScreen(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <Maximize2 size={18} />
                                    Focus Mode
                                </button>
                            </div>
                        </div>
                    )}

                    {isFullScreen && (
                        <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-900 flex animate-in fade-in duration-300">
                            {/* Left Sidebar: Header & Search */}
                            <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-xl z-20">
                                <div className="p-8">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                                        Physical Inventory
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                                        Focus Mode Active
                                    </p>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Products</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input
                                                    type="text"
                                                    placeholder="Search by name or SKU..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none font-medium"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {hasMultipleWarehouses && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Warehouse</label>
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                                                    {warehouses.find(w => w.id == selectedWarehouse)?.name || 'Unknown Warehouse'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Center: Table */}
                            <div className="flex-1 overflow-hidden relative bg-slate-100 dark:bg-slate-900">
                                <div className="absolute inset-0 overflow-y-auto p-8">
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-full">
                                        {selectedWarehouse ? (
                                            <ProductTable />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400">
                                                Select a warehouse to begin
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar: Actions */}
                            <div className="w-24 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col items-center py-8 gap-6 shadow-xl z-20">
                                <button
                                    onClick={() => setIsFullScreen(false)}
                                    className="p-4 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors group"
                                    title="Exit Focus Mode"
                                >
                                    <Minimize2 size={24} className="group-hover:scale-110 transition-transform" />
                                </button>

                                <div className="flex-1 w-full flex flex-col items-center gap-4 pt-4">
                                    {selectedIds.size > 0 && (
                                        <>
                                            <div className="w-full px-2">
                                                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                                {selectedIds.size} Selected
                                            </span>

                                            <button
                                                onClick={handleBulkZero}
                                                className="p-3 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                                title="Set Selected to 0"
                                            >
                                                <XCircle size={20} />
                                            </button>

                                            <button
                                                onClick={handleBulkDelete}
                                                className="p-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Delete Selected"
                                            >
                                                <Trash2 size={20} />
                                            </button>

                                            <div className="w-full px-2">
                                                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button
                                    onClick={handleSubmitAudit}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                                    title="Save Changes"
                                >
                                    <Save size={24} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Warehouse Selection */}
                    {!isFullScreen && hasMultipleWarehouses && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Warehouse</label>
                            <select
                                value={selectedWarehouse}
                                onChange={(e) => setSelectedWarehouse(e.target.value)}
                                className="max-w-md px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                            >
                                <option value="">Choose warehouse to audit</option>
                                {warehouses?.map(warehouse => (
                                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!isFullScreen && selectedWarehouse && (
                        <>
                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Products Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <ProductTable />
                            </div>

                            {/* Submit Audit */}
                            <div className="mt-6 flex justify-end">
                                <PremiumButton onClick={handleSubmitAudit} className="px-6 py-3">
                                    <ClipboardCheck size={18} />
                                    Complete Audit & Adjust Stock
                                </PremiumButton>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
