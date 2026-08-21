import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Box,
    ArrowRight,
    Calendar,
    FileText,
    Truck
} from 'lucide-react';
import Swal from 'sweetalert2';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function Create({ warehouses, products }) {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        from_warehouse_id: '',
        to_warehouse_id: '',
        transfer_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
        items: [
            { product_id: '', quantity: 1 }
        ]
    });

    const addItem = () => {
        setData('items', [...data.items, { product_id: '', quantity: 1 }]);
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
        post(route('store.stock-transfers.store', { store_slug: store.slug }), {
            onSuccess: () => {
                // Global Sync Trigger (Transfers affect availability in warehouses)
                window.dispatchEvent(new CustomEvent('amd:product-updated'));
                localStorage.setItem('amd_product_latest_change', Date.now().toString());

                Swal.fire({
                    title: 'Success!',
                    text: 'Stock transfer created successfully.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    return (
        <OneGlanceLayout title="New Stock Transfer" activeMenu="Stock">
            <Head title="New Stock Transfer" />

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('store.stock-transfers.index', { store_slug: store.slug })}
                            className="p-2 rounded-xl bg-surface border border-line hover:bg-interactive-hover transition-colors"
                        >
                            <ArrowLeft size={20} className="text-ink-muted" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-ink">New Stock Transfer</h1>
                            <p className="text-sm text-ink-muted">Move inventory between warehouses</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Info Card */}
                    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                        <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                            <Truck size={20} className="text-brand-500" /> Transfer Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Source Warehouse */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-ink-secondary">From Warehouse</label>
                                <select
                                    className="w-full text-sm rounded-xl border-line bg-app focus:ring-brand-500"
                                    value={data.from_warehouse_id}
                                    onChange={e => setData('from_warehouse_id', e.target.value)}
                                >
                                    <option value="">Select Source...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} disabled={w.id == data.to_warehouse_id}>{w.name}</option>
                                    ))}
                                </select>
                                {errors.from_warehouse_id && <p className="text-red-500 text-xs">{errors.from_warehouse_id}</p>}
                            </div>

                            {/* Destination Warehouse */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-ink-secondary">To Warehouse</label>
                                <select
                                    className="w-full text-sm rounded-xl border-line bg-app focus:ring-brand-500"
                                    value={data.to_warehouse_id}
                                    onChange={e => setData('to_warehouse_id', e.target.value)}
                                >
                                    <option value="">Select Destination...</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id} disabled={w.id == data.from_warehouse_id}>{w.name}</option>
                                    ))}
                                </select>
                                {errors.to_warehouse_id && <p className="text-red-500 text-xs">{errors.to_warehouse_id}</p>}
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-ink-secondary">Transfer Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-10 text-sm rounded-xl border-line bg-app focus:ring-brand-500"
                                        value={data.transfer_date}
                                        onChange={e => setData('transfer_date', e.target.value)}
                                    />
                                </div>
                                {errors.transfer_date && <p className="text-red-500 text-xs">{errors.transfer_date}</p>}
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-ink-secondary">Status</label>
                                <select
                                    className="w-full text-sm rounded-xl border-line bg-app focus:ring-brand-500"
                                    value={data.status}
                                    onChange={e => setData('status', e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed (Move Stock Now)</option>
                                </select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6 space-y-2">
                            <label className="text-sm font-semibold text-ink-secondary">Notes / Remarks</label>
                            <textarea
                                className="w-full text-sm rounded-xl border-line bg-app focus:ring-brand-500 min-h-[80px]"
                                placeholder="Any additional details..."
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-surface rounded-2xl p-6 shadow-sm border border-line">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                                <Box size={20} className="text-brand-500" /> Items to Transfer
                            </h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-sm font-bold hover:bg-brand-100 transition-colors"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-start p-3 bg-app rounded-xl border border-line group">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs font-bold text-ink-muted ml-1">Product</label>
                                        <AsyncProductCombobox
                                            value={item.product_id}
                                            onSelect={(p) => updateItem(index, 'product_id', p ? p.id : '')}
                                            defaultOptions={products}
                                            placeholder="Search product..."
                                        />
                                    </div>

                                    <div className="w-32 space-y-1">
                                        <label className="text-xs font-bold text-ink-muted ml-1">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full text-sm rounded-lg border-line focus:ring-brand-500"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            disabled={data.items.length === 1}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.items && <p className="text-red-500 text-xs mt-2">{errors.items}</p>}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4">
                        <Link
                            href={route('store.stock-transfers.index', { store_slug: store.slug })}
                            className="px-6 py-3 text-sm font-bold text-ink-muted hover:text-ink transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 active:scale-95 transition-all shadow-lg disabled:opacity-70 disabled:"
                        >
                            <Save size={18} />
                            {processing ? 'Processing...' : 'Create Transfer'}
                        </button>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
