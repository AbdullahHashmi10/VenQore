import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react'; // usePage added
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Plus, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';

export default function VariantsIndex({ product, variants, globalAttributes = [] }) {
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        sku: '',
        price: '',
        stock_quantity: '',
        attributes: [{ name: '', value: '' }], // UI helper
    });

    const openModal = (variant = null) => {
        if (variant) {
            setEditingVariant(variant);
            // Convert attributes object to array for form
            const attrs = Object.entries(variant.attributes).map(([name, value]) => ({ name, value }));
            setData({
                sku: variant.sku || '',
                price: variant.price || '',
                stock_quantity: variant.stock_quantity || '',
                attributes: attrs,
            });
        } else {
            setEditingVariant(null);
            reset();
            setData('attributes', [{ name: '', value: '' }]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleAttributeChange = (index, field, value) => {
        const newAttributes = [...data.attributes];
        newAttributes[index][field] = value;
        setData('attributes', newAttributes);
    };

    const addAttribute = () => {
        setData('attributes', [...data.attributes, { name: '', value: '' }]);
    };

    const removeAttribute = (index) => {
        const newAttributes = data.attributes.filter((_, i) => i !== index);
        setData('attributes', newAttributes);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Convert attributes array back to object
        const attributesObj = data.attributes.reduce((acc, curr) => {
            if (curr.name && curr.value) acc[curr.name] = curr.value;
            return acc;
        }, {});

        const payload = {
            ...data,
            attributes: attributesObj
        };

        if (editingVariant) {
            put(route('store.variants.update', { store_slug: store?.slug, variant: editingVariant.id }), {
                data: payload,
                onSuccess: closeModal,
            });
        } else {
            post(route('store.products.variants.store', { store_slug: store?.slug, product: product.id }), {
                data: payload,
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this variant?')) {
            destroy(route('store.variants.destroy', { store_slug: store?.slug, variant: id }));
        }
    };

    return (
        <OneGlanceLayout title={`Variants: ${product.name}`} activeMenu="Stock">
            <Head title={`Variants - ${product.name}`} />

            <div className="mb-6 flex items-center justify-between">
                <Link
                    href={route('store.inventory.index', { store_slug: store?.slug })}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Products
                </Link>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                    <Plus size={20} /> Add Variant
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Attributes</th>
                            <th className="p-4 font-semibold">SKU</th>
                            <th className="p-4 font-semibold">Price Override</th>
                            <th className="p-4 font-semibold">Stock</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {variants.length > 0 ? (
                            variants.map((variant) => (
                                <tr key={variant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(variant.attributes).map(([key, value]) => (
                                                <span key={key} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                                                    {key}: {value}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{variant.sku || '-'}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300">
                                        {variant.price ? `$${variant.price}` : <span className="text-slate-400 italic">Default</span>}
                                    </td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300">{variant.stock_quantity}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(variant)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(variant.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-slate-400">
                                    No variants found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingVariant ? 'Edit Variant' : 'Add Variant'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Attributes */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Attributes</label>
                                {data.attributes.map((attr, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            list={`attr-list-${index}`}
                                            placeholder="Name (e.g. Size)"
                                            value={attr.name}
                                            onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                            required
                                        />
                                        <datalist id={`attr-list-${index}`}>
                                            {globalAttributes.map(ga => (
                                                <option key={ga.id} value={ga.name} />
                                            ))}
                                        </datalist>
                                        <input
                                            type="text"
                                            placeholder="Value (e.g. XL)"
                                            value={attr.value}
                                            onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                            required
                                        />
                                        {data.attributes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeAttribute(index)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Attribute
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                                    <input
                                        type="number"
                                        value={data.stock_quantity}
                                        onChange={(e) => setData('stock_quantity', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price Override (Optional)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                                    placeholder={`Default: $${product.price}`}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                                >
                                    <Save size={16} />
                                    {processing ? 'Saving...' : 'Save Variant'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
