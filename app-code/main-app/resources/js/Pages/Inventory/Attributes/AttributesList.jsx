import React, { useState } from 'react';
import { Head, useForm, Link, usePage } from '@inertiajs/react'; // usePage added
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader'; // Added
import StockModuleTabs from '@/Components/StockModuleTabs';

import { Plus, Edit, Trash2, Save, X, Tag, Settings, List } from 'lucide-react'; // Icons added

export default function AttributesIndex({ attributes }) {
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        type: 'select', // select, text, number
        options: [], // for select type
    });

    const [optionInput, setOptionInput] = useState('');

    const openModal = (attribute = null) => {
        if (attribute) {
            setEditingAttribute(attribute);
            setData({
                name: attribute.name,
                type: attribute.type,
                options: attribute.options || [],
            });
        } else {
            setEditingAttribute(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setOptionInput('');
    };

    const addOption = () => {
        if (optionInput.trim()) {
            setData('options', [...data.options, optionInput.trim()]);
            setOptionInput('');
        }
    };

    const removeOption = (index) => {
        const newOptions = data.options.filter((_, i) => i !== index);
        setData('options', newOptions);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingAttribute) {
            put(route('store.attributes.update', { store_slug: store?.slug, attribute: editingAttribute.id }), {
                onSuccess: closeModal,
            });
        } else {
            post(route('store.attributes.store', { store_slug: store?.slug }), {
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this attribute?')) {
            destroy(route('store.attributes.destroy', { store_slug: store?.slug, attribute: id }));
        }
    };

    return (
        <OneGlanceLayout title="Product Attributes" activeMenu="Stock">
            <Head title="Attributes" />

            <div className="flex flex-col h-full">
                <StockModuleTabs activeTab="attributes" />




                <div className="flex-1 flex flex-col gap-6 overflow-auto pb-6">
                    <PageHeader
                        title="Product Attributes"
                        subtitle="Manage custom product attributes (Size, Color, etc.)"
                        icon={List}
                        breadcrumbs={[
                            { label: 'Inventory' },
                            { label: 'Config' },
                            { label: 'Attributes' }
                        ]}
                        actions={
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Plus size={20} /> Add Attribute
                            </button>
                        }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {attributes.map((attr) => (
                            <div key={attr.id} className="bg-surface rounded-2xl p-6 shadow-sm border border-line hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-ink">{attr.name}</h3>
                                            <p className="text-xs text-ink-muted uppercase tracking-wider">{attr.type}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(attr)}
                                            className="p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(attr.id)}
                                            className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {attr.type === 'select' && attr.options && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {attr.options.map((opt, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-sunken text-ink-secondary rounded text-xs font-medium">
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal">
                            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-normal">
                                <div className="p-6 border-b border-line flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-ink">
                                        {editingAttribute ? 'Edit Attribute' : 'Add Attribute'}
                                    </h3>
                                    <button onClick={closeModal} className="text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                            placeholder="e.g. Size, Color"
                                            required
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-ink-secondary mb-1">Type</label>
                                        <select
                                            value={data.type}
                                            onChange={(e) => setData('type', e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                        >
                                            <option value="select">Select (Dropdown)</option>
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                        </select>
                                    </div>

                                    {data.type === 'select' && (
                                        <div>
                                            <label className="block text-sm font-medium text-ink-secondary mb-1">Options</label>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={optionInput}
                                                    onChange={(e) => setOptionInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                                                    className="flex-1 px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                                    placeholder="Type option and press Enter"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addOption}
                                                    className="px-3 py-2 bg-sunken text-ink-secondary rounded-xl hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {data.options.map((opt, idx) => (
                                                    <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded text-xs font-medium border border-brand-100 dark:border-brand-800">
                                                        {opt}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(idx)}
                                                            className="hover:text-red-500"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-ink-secondary hover:bg-interactive-hover rounded-xl transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg "
                                        >
                                            <Save size={16} />
                                            {processing ? 'Saving...' : 'Save Attribute'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
