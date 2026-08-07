import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Plus,
    Trash2,
    Save,
    Package,
    Beaker,
    ArrowRight,
    CheckCircle,
    XCircle
} from 'lucide-react';
import axios from 'axios';

const ManufacturingRules = () => {
    const { store } = usePage().props;
    const [rules, setRules] = useState([]);
    const [products, setProducts] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // New rule form state
    const [newRule, setNewRule] = useState({
        product_id: '',
        name: '',
        description: '',
        ingredients: []
    });

    // Load rules and products
    const loadRules = async () => {
        try {
            const response = await axios.get('/api/manufacturing-rules');
            setRules(response.data || []);
        } catch (error) {
            console.error('Error loading rules:', error);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await axios.get(route("store.inventory.search", {
                store_slug: store.slug
            }), { params: { query: '' } });
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    useEffect(() => {
        loadRules();
        loadProducts();
    }, []);

    // Add ingredient to new rule
    const addIngredient = () => {
        setNewRule(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { ingredient_product_id: '', quantity_per_unit: 0, unit: 'g' }]
        }));
    };

    // Remove ingredient
    const removeIngredient = (index) => {
        setNewRule(prev => ({
            ...prev,
            ingredients: prev.ingredients.filter((_, i) => i !== index)
        }));
    };

    // Update ingredient
    const updateIngredient = (index, field, value) => {
        setNewRule(prev => ({
            ...prev,
            ingredients: prev.ingredients.map((ing, i) =>
                i === index ? { ...ing, [field]: value } : ing
            )
        }));
    };

    // Save rule
    const saveRule = async () => {
        try {
            const payload = {
                ...newRule,
                is_active: true
            };

            await axios.post('/api/manufacturing-rules', payload);

            alert('✅ Manufacturing rule created!');
            setShowCreateModal(false);
            setNewRule({ product_id: '', name: '', description: '', ingredients: [] });
            loadRules();
        } catch (error) {
            alert('❌ Failed: ' + (error.response?.data?.message || error.message));
        }
    };

    // Toggle rule active status
    const toggleRule = async (ruleId, currentStatus) => {
        try {
            await axios.patch(`/api/manufacturing-rules/${ruleId}`, { is_active: !currentStatus });
            loadRules();
        } catch (error) {
            alert('Failed to toggle rule');
        }
    };

    // Delete rule
    const deleteRule = async (ruleId) => {
        if (!confirm('Delete this manufacturing rule?')) return;

        try {
            await axios.delete(`/api/manufacturing-rules/${ruleId}`);
            loadRules();
            alert('✅ Rule deleted');
        } catch (error) {
            alert('Failed to delete rule');
        }
    };

    return (
        <OneGlanceLayout title="Manufacturing Rules" activeMenu="Stock">
            <Head title="Auto-Manufacturing" />

            <div className="p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            <Beaker className="text-purple-500" size={32} />
                            Auto-Manufacturing Rules
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Define composite products & ingredient auto-deduction</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2"
                    >
                        <Plus size={18} /> Create Rule
                    </button>
                </div>

                {/* Rules List */}
                <div className="grid gap-4">
                    {rules.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
                            <Beaker size={64} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No Manufacturing Rules Yet</h3>
                            <p className="text-slate-500 mb-4">Create your first rule to enable auto-deduction of ingredients</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold"
                            >
                                Create First Rule
                            </button>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Package className="text-indigo-500" size={24} />
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{rule.name}</h3>
                                            {rule.is_active ? (
                                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded">ACTIVE</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded">INACTIVE</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 ml-9">{rule.description || 'No description'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleRule(rule.id, rule.is_active)}
                                            className={`p-2 rounded-lg ${rule.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {rule.is_active ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </button>
                                        <button
                                            onClick={() => deleteRule(rule.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                {/* Ingredients List */}
                                <div className="ml-9 mt-4 space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ingredients:</p>
                                    {rule.ingredients && rule.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-16 text-right font-bold text-purple-600">{ing.quantity_per_unit}{ing.unit}</span>
                                            <ArrowRight size={14} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300">{ing.ingredient_name || `Product #${ing.ingredient_product_id}`}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Create Rule Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Manufacturing Rule</h2>
                                <p className="text-sm text-slate-500 mt-1">Define a composite product and its ingredients</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Product Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Finished Product *</label>
                                    <select
                                        value={newRule.product_id}
                                        onChange={(e) => setNewRule({ ...newRule, product_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500"
                                    >
                                        <option value="">Select product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rule Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Rule Name *</label>
                                    <input
                                        type="text"
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                        placeholder="e.g., Garam Masala Production"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={newRule.description}
                                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                        placeholder="Optional description..."
                                        rows="2"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500"
                                    />
                                </div>

                                {/* Ingredients */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-bold text-slate-600 dark:text-slate-300">Ingredients *</label>
                                        <button
                                            onClick={addIngredient}
                                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {newRule.ingredients.map((ing, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                                <div className="col-span-6">
                                                    <select
                                                        value={ing.ingredient_product_id}
                                                        onChange={(e) => updateIngredient(i, 'ingredient_product_id', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                                    >
                                                        <option value="">Select ingredient...</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={ing.quantity_per_unit}
                                                        onChange={(e) => updateIngredient(i, 'quantity_per_unit', parseFloat(e.target.value) || 0)}
                                                        placeholder="Qty"
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <select
                                                        value={ing.unit}
                                                        onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                                    >
                                                        <option value="g">g</option>
                                                        <option value="kg">kg</option>
                                                        <option value="ml">ml</option>
                                                        <option value="l">l</option>
                                                        <option value="pcs">pcs</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-1">
                                                    <button
                                                        onClick={() => removeIngredient(i)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewRule({ product_id: '', name: '', description: '', ingredients: [] });
                                    }}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveRule}
                                    disabled={!newRule.product_id || !newRule.name || newRule.ingredients.length === 0}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Rule
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
};

export default ManufacturingRules;
