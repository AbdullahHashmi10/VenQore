import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
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
    const [warehouses, setWarehouses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    // Simulator states
    const [showSimulateModal, setShowSimulateModal] = useState(false);
    const [simulatingRule, setSimulatingRule] = useState(null);
    const [simulationParams, setSimulationParams] = useState({
        warehouse_id: '',
        planned_qty: 1
    });
    const [simulationResult, setSimulationResult] = useState(null);
    const [loadingSimulation, setLoadingSimulation] = useState(false);

    // New rule form state
    const [newRule, setNewRule] = useState({
        product_id: '',
        name: '',
        description: '',
        ingredients: []
    });

    // Load rules, products, and warehouses
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

    const loadWarehouses = async () => {
        try {
            const response = await axios.get('/api/warehouses');
            setWarehouses(response.data || []);
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    };

    useEffect(() => {
        loadRules();
        loadProducts();
        loadWarehouses();
    }, []);

    // Run simulation
    const runSimulation = async () => {
        setLoadingSimulation(true);
        try {
            const response = await axios.post(`/api/manufacturing-rules/${simulatingRule.id}/simulate`, simulationParams);
            setSimulationResult(response.data);
        } catch (error) {
            alert('❌ Simulation failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoadingSimulation(false);
        }
    };

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
                        <h1 className="text-3xl font-bold text-ink flex items-center gap-3">
                            <Beaker className="text-purple-500" size={32} />
                            Auto-Manufacturing Rules
                        </h1>
                        <p className="text-sm text-ink-muted mt-1">Define composite products & ingredient auto-deduction</p>
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
                        <div className="bg-surface rounded-2xl p-12 text-center border border-line">
                            <Beaker size={64} className="mx-auto text-neutral-300 mb-4" />
                            <h3 className="text-xl font-bold text-ink-secondary mb-2">No Manufacturing Rules Yet</h3>
                            <p className="text-ink-muted mb-4">Create your first rule to enable auto-deduction of ingredients</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold"
                            >
                                Create First Rule
                            </button>
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="bg-surface rounded-2xl p-6 border border-line">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Package className="text-brand-500" size={24} />
                                            <h3 className="text-xl font-bold text-ink">{rule.name}</h3>
                                            {rule.is_active ? (
                                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded">ACTIVE</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-sunken text-ink-secondary text-xs font-bold rounded">INACTIVE</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-ink-muted ml-9">{rule.description || 'No description'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setSimulatingRule(rule);
                                                setSimulationParams({ warehouse_id: warehouses[0]?.id || '', planned_qty: 1 });
                                                setSimulationResult(null);
                                                setShowSimulateModal(true);
                                            }}
                                            className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 text-xs font-bold rounded-lg text-brand-700 dark:text-brand-400 flex items-center gap-1.5 transition-colors border border-brand-100/50 dark:border-brand-900/50"
                                        >
                                            <Beaker size={14} className="animate-pulse text-brand-500" /> Simulate Feasibility
                                        </button>
                                        <button
                                            onClick={() => toggleRule(rule.id, rule.is_active)}
                                            className={`p-2 rounded-lg ${rule.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-ink-muted hover:bg-interactive-hover'}`}
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
                                    <p className="text-xs font-bold text-ink-muted uppercase mb-2">Ingredients:</p>
                                    {rule.ingredients && rule.ingredients.map((ing, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                            <span className="w-16 text-right font-bold text-purple-600">{ing.quantity_per_unit}{ing.unit}</span>
                                            <ArrowRight size={14} className="text-ink-muted" />
                                            <span className="text-ink-secondary">{ing.ingredient_name || `Product #${ing.ingredient_product_id}`}</span>
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
                        <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-line">
                                <h2 className="text-2xl font-bold text-ink">Create Manufacturing Rule</h2>
                                <p className="text-sm text-ink-muted mt-1">Define a composite product and its ingredients</p>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Product Selection */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-secondary mb-2">Finished Product *</label>
                                    <select
                                        value={newRule.product_id}
                                        onChange={(e) => setNewRule({ ...newRule, product_id: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-purple-500"
                                    >
                                        <option value="">Select product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Rule Name */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-secondary mb-2">Rule Name *</label>
                                    <input
                                        type="text"
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                        placeholder="e.g., Garam Masala Production"
                                        className="w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-purple-500"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-secondary mb-2">Description</label>
                                    <textarea
                                        value={newRule.description}
                                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                        placeholder="Optional description..."
                                        rows="2"
                                        className="w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-purple-500"
                                    />
                                </div>

                                {/* Ingredients */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-bold text-ink-secondary">Ingredients *</label>
                                        <button
                                            onClick={addIngredient}
                                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-1"
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {newRule.ingredients.map((ing, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 bg-app rounded-lg">
                                                <div className="col-span-6">
                                                    <select
                                                        value={ing.ingredient_product_id}
                                                        onChange={(e) => updateIngredient(i, 'ingredient_product_id', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface"
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
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <select
                                                        value={ing.unit}
                                                        onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface"
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

                            <div className="p-6 border-t border-line flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewRule({ product_id: '', name: '', description: '', ingredients: [] });
                                    }}
                                    className="px-4 py-2 bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover text-ink rounded-lg font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveRule}
                                    disabled={!newRule.product_id || !newRule.name || newRule.ingredients.length === 0}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-sunken disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Rule
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Simulate Feasibility Modal */}
                {showSimulateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-drawer p-4 animate-in fade-in duration-normal">
                        <div className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-line flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-ink">Production Feasibility Simulator</h2>
                                    <p className="text-sm text-ink-muted mt-1">Simulate manufacturing of <strong>{simulatingRule?.name}</strong></p>
                                </div>
                                <button onClick={() => setShowSimulateModal(false)} className="text-ink-muted hover:text-ink text-xl font-bold">×</button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-ink-secondary mb-2">Simulated Production Qty</label>
                                        <input
                                            type="number"
                                            min="0.0001"
                                            step="any"
                                            value={simulationParams.planned_qty}
                                            onChange={(e) => setSimulationParams({ ...simulationParams, planned_qty: parseFloat(e.target.value) || 1 })}
                                            className="w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500 text-ink"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-ink-secondary mb-2">Target Warehouse</label>
                                        <select
                                            value={simulationParams.warehouse_id}
                                            onChange={(e) => setSimulationParams({ ...simulationParams, warehouse_id: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500 text-ink"
                                        >
                                            <option value="">Select target warehouse...</option>
                                            {warehouses.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={runSimulation}
                                    disabled={loadingSimulation || !simulationParams.warehouse_id}
                                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 text-sm"
                                >
                                    {loadingSimulation ? 'Running Simulation...' : 'Simulate Run'}
                                </button>

                                {simulationResult && (
                                    <div className="space-y-4 pt-4 border-t border-line">
                                        <div className="flex items-center justify-between p-4 rounded-xl border font-bold text-sm bg-app border-line">
                                            <div className="text-ink">
                                                Status: {simulationResult.feasible ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">✅ FEASIBLE — Enough stock available</span>
                                                ) : (
                                                    <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">❌ INFEASIBLE — Insufficient ingredient stock</span>
                                                )}
                                            </div>
                                            <div className="text-right text-ink dark:text-ink">
                                                Est. Cost: <span className="text-brand-600 dark:text-brand-400 font-bold">{formatCurrency(simulationResult.total_estimated_cost, store)}</span>
                                            </div>
                                        </div>

                                        <div className="overflow-hidden border border-line rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-app text-ink-muted uppercase tracking-wider font-bold">
                                                    <tr>
                                                        <th className="p-3">Ingredient</th>
                                                        <th className="p-3 text-right">Required</th>
                                                        <th className="p-3 text-right">Available</th>
                                                        <th className="p-3 text-right">Shortage</th>
                                                        <th className="p-3 text-right">Est. Cost</th>
                                                        <th className="p-3 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-line font-medium">
                                                    {simulationResult.items.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary">
                                                            <td className="p-3 font-bold text-ink">
                                                                {item.ingredient_name}
                                                                <div className="text-ink-muted text-2xs font-semibold">SKU: {item.sku}</div>
                                                            </td>
                                                            <td className="p-3 text-right font-bold">{item.required_qty} {item.unit}</td>
                                                            <td className="p-3 text-right">{item.available_qty} {item.unit}</td>
                                                            <td className={`p-3 text-right font-bold ${item.missing_qty > 0 ? 'text-rose-600' : 'text-ink-muted'}`}>
                                                                {item.missing_qty > 0 ? `${item.missing_qty} ${item.unit}` : '0'}
                                                            </td>
                                                            <td className="p-3 text-right text-ink font-bold">{formatCurrency(item.estimated_cost, store)}</td>
                                                            <td className="p-3 text-center font-bold">
                                                                {item.missing_qty > 0 ? (
                                                                    <span className="text-rose-600 dark:text-rose-400 text-2xs uppercase bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">Short</span>
                                                                ) : (
                                                                    <span className="text-emerald-600 dark:text-emerald-400 text-2xs uppercase bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">OK</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-line flex justify-end">
                                <button
                                    onClick={() => setShowSimulateModal(false)}
                                    className="px-6 py-2 bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover text-ink-secondary dark:text-white rounded-lg font-bold"
                                >
                                    Close
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
