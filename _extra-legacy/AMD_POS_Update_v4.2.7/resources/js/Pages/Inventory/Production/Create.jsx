import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react'; // usePage added
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import { Factory, Plus, Trash2, Search, Package } from 'lucide-react';
import axios from 'axios';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function CreateProductionRun({ products = [], recipes = [], warehouses = [] }) {
    const { store } = usePage().props;
    const [loading, setLoading] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        product_name: '',
        quantity: 1,
        warehouse_id: '',
        recipe_id: '',
        notes: ''
    });
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [errors, setErrors] = useState({});

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );

    const selectProduct = (product) => {
        setFormData({
            ...formData,
            product_id: product.id,
            product_name: product.name
        });
        setProductSearch(product.name);
        setShowProductDropdown(false);

        // Auto-select recipe if available
        const recipe = recipes.find(r => r.product_id === product.id);
        if (recipe) {
            setFormData(prev => ({ ...prev, recipe_id: recipe.id }));
            setSelectedRecipe(recipe);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            await axios.post(route('store.production.store', { store_slug: store?.slug }), formData);
            
            // Global Sync Trigger (Production affects finished goods and raw materials)
            window.dispatchEvent(new CustomEvent('amd:product-updated'));
            localStorage.setItem('amd_product_latest_change', Date.now().toString());

            router.visit(route('store.production.index', { store_slug: store?.slug }));
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <OneGlanceLayout title="New Production Run">
            <Head title="New Production Run" />

            <div className="h-full flex flex-col gap-6 overflow-auto">
                <PageHeader
                    title="New Production Run"
                    subtitle="Create a new manufacturing batch"
                    icon={Factory}
                    breadcrumbs={[
                        { label: 'Inventory' },
                        { label: 'Production', href: route('store.production.index', { store_slug: store?.slug }) },
                        { label: 'New Run' }
                    ]}
                />

                <div className="grid grid-cols-3 gap-6">
                    {/* Form Card */}
                    <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {/* Product Selection */}
                            <FormField label="Product to Manufacture" required error={errors.product_id?.[0]}>
                                <AsyncProductCombobox
                                    selectedItem={products.find(p => p.id === formData.product_id)}
                                    onSelect={(product) => {
                                        if (product) {
                                            selectProduct(product);
                                        } else {
                                            setFormData({ ...formData, product_id: '', product_name: '' });
                                            setProductSearch('');
                                        }
                                    }}
                                    placeholder="Search product..."
                                />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Quantity to Produce" required error={errors.quantity?.[0]}>
                                    <FormInput
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                    />
                                </FormField>

                                <FormField label="Output Warehouse" required error={errors.warehouse_id?.[0]}>
                                    <FormSelect
                                        value={formData.warehouse_id}
                                        onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                    >
                                        <option value="">Select warehouse</option>
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </FormSelect>
                                </FormField>
                            </div>

                            <FormField label="Recipe/BOM" error={errors.recipe_id?.[0]}>
                                <FormSelect
                                    value={formData.recipe_id}
                                    onChange={(e) => {
                                        const recipe = recipes.find(r => r.id == e.target.value);
                                        setFormData({ ...formData, recipe_id: e.target.value });
                                        setSelectedRecipe(recipe);
                                    }}
                                >
                                    <option value="">Select recipe (optional)</option>
                                    {recipes.filter(r => !formData.product_id || r.product_id === formData.product_id).map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </FormSelect>
                            </FormField>

                            <FormField label="Production Notes">
                                <FormTextarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any notes about this production run..."
                                    rows={3}
                                />
                            </FormField>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <SecondaryButton onClick={() => router.visit(route('store.production.index', { store_slug: store?.slug }))}>
                                    Cancel
                                </SecondaryButton>
                                <PrimaryButton type="submit" loading={loading}>
                                    Start Production
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>

                    {/* Recipe Preview */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Package size={18} />
                            Recipe Ingredients
                        </h3>

                        {selectedRecipe ? (
                            <div className="space-y-3">
                                {selectedRecipe.ingredients?.map((ing, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{ing.product?.name}</p>
                                            <p className="text-xs text-slate-400">{ing.product?.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-indigo-600">{ing.quantity * formData.quantity}</p>
                                            <p className="text-xs text-slate-400">needed</p>
                                        </div>
                                    </div>
                                ))}
                                {selectedRecipe.ingredients?.length === 0 && (
                                    <p className="text-sm text-slate-400">No ingredients defined</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p>Select a recipe to see ingredients</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
