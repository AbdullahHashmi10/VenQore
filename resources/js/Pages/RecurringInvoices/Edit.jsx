import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Calendar, Repeat, Users, Box, Plus, Trash2, ArrowLeft, Save, Info } from 'lucide-react';
import { getCurrencySymbol } from '@/Utils/format';

export default function EditRecurringInvoice({ invoice, customers = [], warehouses = [], products = [] }) {
    const { store } = usePage().props;
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState(1);
    const [price, setPrice] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        customer_id: invoice.customer_id || '',
        warehouse_id: invoice.warehouse_id || '',
        frequency: invoice.frequency || 'monthly',
        next_run_date: invoice.next_run_date ? new Date(invoice.next_run_date).toISOString().split('T')[0] : '',
        items: invoice.items || [],
        status: invoice.status || 'active',
    });

    const handleAddProduct = () => {
        if (!selectedProduct) return;
        const prod = products.find(p => p.id === selectedProduct);
        if (!prod) return;

        const currentItems = [...data.items];
        const existingIdx = currentItems.findIndex(item => item.product_id === prod.id);

        if (existingIdx >= 0) {
            currentItems[existingIdx].qty += parseFloat(qty);
            if (price !== '') {
                currentItems[existingIdx].unit_price = parseFloat(price);
            }
        } else {
            currentItems.push({
                product_id: prod.id,
                qty: parseFloat(qty),
                unit_price: price !== '' ? parseFloat(price) : parseFloat(prod.price || prod.cost_price || 0),
                name: prod.name,
                sku: prod.sku,
            });
        }

        setData('items', currentItems);
        setSelectedProduct('');
        setQty(1);
        setPrice('');
    };

    const handleRemoveProduct = (index) => {
        const currentItems = [...data.items];
        currentItems.splice(index, 1);
        setData('items', currentItems);
    };

    const totalAmount = useMemo(() => {
        return data.items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
    }, [data.items]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('store.recurring-invoices.update', { store_slug: store.slug, id: invoice.id }));
    };

    return (
        <OneGlanceLayout title="Edit Recurring Invoice" activeMenu="Sell">
            <Head title="Edit Recurring Invoice" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Back Link */}
                <div>
                    <Link
                        href={route('store.recurring-invoices.index', { store_slug: store.slug })}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold transition-colors text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to List
                    </Link>
                </div>

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                            <Repeat className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        Edit Recurring Invoice Template
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Modify automated billing parameters and items</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Parameters Card */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h2 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Info size={18} className="text-purple-500" />
                                Template Parameters
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Customer */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Customer</label>
                                    <div className="relative">
                                        <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={data.customer_id}
                                            onChange={e => setData('customer_id', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                        >
                                            <option value="">Walk-in Customer</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id}</p>}
                                </div>

                                {/* Warehouse */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Warehouse</label>
                                    <div className="relative">
                                        <Box size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={data.warehouse_id}
                                            onChange={e => setData('warehouse_id', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                        >
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.warehouse_id}</p>}
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Billing Frequency</label>
                                    <div className="relative">
                                        <Repeat size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={data.frequency}
                                            onChange={e => setData('frequency', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    {errors.frequency && <p className="text-red-500 text-xs mt-1">{errors.frequency}</p>}
                                </div>

                                {/* Next Run Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Next Invoice Date</label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="date"
                                            value={data.next_run_date}
                                            onChange={e => setData('next_run_date', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                        />
                                    </div>
                                    {errors.next_run_date && <p className="text-red-500 text-xs mt-1">{errors.next_run_date}</p>}
                                </div>

                                {/* Status Toggle */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status</label>
                                    <div className="relative">
                                        <Repeat size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-purple-500/20 outline-none text-slate-800 dark:text-white font-medium"
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                        </select>
                                    </div>
                                    {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h2 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Box size={18} className="text-purple-500" />
                                Invoice Items
                            </h2>

                            {/* Product Selector Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Select Product</label>
                                    <select
                                        value={selectedProduct}
                                        onChange={e => {
                                            setSelectedProduct(e.target.value);
                                            const p = products.find(prod => prod.id === e.target.value);
                                            if (p) {
                                                setPrice(p.price || p.cost_price || 0);
                                            }
                                        }}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-800 dark:text-white font-medium"
                                    >
                                        <option value="">Choose product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-800 dark:text-white font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Price</label>
                                    <input
                                        type="number"
                                        placeholder="Default"
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm text-slate-800 dark:text-white font-medium"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all text-xs"
                                >
                                    <Plus size={16} />
                                    Add
                                </button>
                            </div>

                            {/* Items List */}
                            {data.items.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/10 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                    <Box className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm font-medium">Add products to this invoice template</p>
                                </div>
                            ) : (
                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase">
                                            <tr>
                                                <th className="p-4">Item Details</th>
                                                <th className="p-4 text-center">Qty</th>
                                                <th className="p-4 text-right">Price</th>
                                                <th className="p-4 text-right">Total</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900/50">
                                            {data.items.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                                                        <div>{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{item.sku}</div>
                                                    </td>
                                                    <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-medium">{item.qty}</td>
                                                    <td className="p-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                                                        {getCurrencySymbol()} {item.unit_price.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-right font-bold text-slate-800 dark:text-white">
                                                        {getCurrencySymbol()} {(item.qty * item.unit_price).toFixed(2)}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProduct(idx)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}
                        </div>
                    </div>

                    {/* Summary Sidebar Card */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h2 className="text-md font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Frequency</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400 capitalize">{data.frequency}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 font-medium">Total Items</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{data.items.length}</span>
                                </div>
                                <hr className="border-slate-100 dark:border-slate-800" />
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500 font-medium text-sm">Total per invoice</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">
                                        {getCurrencySymbol()} {new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(totalAmount)}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || data.items.length === 0}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-900/50 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
                            >
                                <Save size={18} />
                                {processing ? 'Updating...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
