import React, { useState, useEffect } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, useForm, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    ClipboardList,
    Calendar,
    AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function Create({ warehouses, products, stocks }) {
    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'draft',
        notes: '',
        items: [
            { product_id: '', counted_quantity: 0 }
        ]
    });

    // Helper to get expected stock from props
    const getExpectedStock = (warehouseId, productId) => {
        if (!warehouseId || !productId || !stocks[warehouseId]) return 0;
        const stockRecord = stocks[warehouseId].find(s => s.product_id == productId);
        return stockRecord ? Number(stockRecord.quantity) : 0;
    };

    const addItem = () => {
        setData('items', [...data.items, { product_id: '', counted_quantity: 0 }]);
    };

    const removeItem = (index) => {
        if (data.items.length === 1) return;
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        setData('items', newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.stock-takes.store', { store_slug: store.slug }), {
            onSuccess: () => {
                Swal.fire({
                    title: 'Success!',
                    text: 'Stock Audit saved successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    return (
        <OneGlanceLayout title="New Stock Audit" activeMenu="Stock">
            <Head title="New Stock Audit" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('store.stock-takes.index', { store_slug: store.slug })}
                            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-slate-500" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">New Stock Audit</h1>
                            <p className="text-sm text-slate-500">Verify and adjust inventory levels</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <ClipboardList size={20} className="text-indigo-500" /> Audit Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Warehouse */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Warehouse</label>
                                <select
                                    className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                                    value={data.warehouse_id}
                                    onChange={e => setData('warehouse_id', e.target.value)}
                                >
                                    <option value="">Select Warehouse...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                {errors.warehouse_id && <p className="text-red-500 text-xs">{errors.warehouse_id}</p>}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Audit Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                                        value={data.date}
                                        onChange={e => setData('date', e.target.value)}
                                    />
                                </div>
                                {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Status</label>
                                <select
                                    className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500"
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                >
                                    <option value="draft">Draft (Save & Continue later)</option>
                                    <option value="completed">Completed (Adjust Stock)</option>
                                </select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6 space-y-2">
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Notes / Remarks</label>
                            <textarea
                                className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500 min-h-[60px]"
                                placeholder="Any additional details..."
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ClipboardList size={20} className="text-indigo-500" /> Counted Items
                            </h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-xl">Product</th>
                                        <th className="px-4 py-3 text-right">Expected</th>
                                        <th className="px-4 py-3 text-right w-32">Counted</th>
                                        <th className="px-4 py-3 text-right">Difference</th>
                                        <th className="px-4 py-3 rounded-r-xl"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {data.items.map((item, index) => {
                                        const expected = getExpectedStock(data.warehouse_id, item.product_id);
                                        const diff = (item.counted_quantity || 0) - expected;
                                        const diffColor = diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-500' : 'text-red-500';

                                        return (
                                            <tr key={index}>
                                                <td className="px-4 py-3">
                                                    <AsyncProductCombobox
                                                        value={item.product_id}
                                                        onSelect={(p) => updateItem(index, 'product_id', p ? p.id : '')}
                                                        defaultOptions={products}
                                                        placeholder="Search product..."
                                                        className="min-w-[200px]"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-500">
                                                    {data.warehouse_id && item.product_id ? expected : '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full text-sm text-right rounded-lg border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                                                        value={item.counted_quantity}
                                                        onChange={e => updateItem(index, 'counted_quantity', e.target.value)}
                                                    />
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${diffColor}`}>
                                                    {data.warehouse_id && item.product_id ? (diff > 0 ? `+${diff}` : diff) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        disabled={data.items.length === 1}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {errors.items && <p className="text-red-500 text-xs mt-2">{errors.items}</p>}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Link
                            href={route('store.stock-takes.index', { store_slug: store.slug })}
                            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100"
                        >
                            <Save size={18} />
                            {processing ? 'Processing...' : 'Save Audit'}
                        </button>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
