import React, { useState } from 'react';
import { usePage, Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import StockModuleTabs from '@/Components/StockModuleTabs';

import MidnightNebula from '@/Components/MidnightNebula';
import Modal from '@/Components/Modal';
import { BookOpen, Plus, ChefHat, Edit, Trash2, DollarSign, Clock, Package, Flame, Users, PlayCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function CookbookIndex({ recipes = [] }) {
    const [simulatorOpen, setSimulatorOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [simQty, setSimQty] = useState(1);
    const [simResult, setSimResult] = useState(null);
    const [simLoading, setSimLoading] = useState(false);
    const [trainingOpen, setTrainingOpen] = useState(false);

    const handleDelete = (id, name) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            router.delete(route('store.cookbook.destroy', id));
        }
    };

    const openSimulator = (recipe) => {
        setSelectedRecipe(recipe);
        setSimQty(parseFloat(recipe.yield_quantity) || 1);
        setSimResult(null);
        setSimulatorOpen(true);
    };

    const runSimulation = async () => {
        setSimLoading(true);
        try {
            const { data } = await axios.post(route('store.cookbook.simulate', { store_slug: store.slug }), {
                recipe_id: selectedRecipe.id,
                quantity: simQty
            });
            setSimResult(data);
        } catch (error) {
            console.error(error);
            alert('Simulation failed. Please try again.');
        }
        setSimLoading(false);
    };

    return (
        <OneGlanceLayout title="Cookbook" activeMenu="Stock">
            <Head title="Cookbook" />

            <div className="flex flex-col h-full">
                <StockModuleTabs activeTab="cookbook" />


                <div className="flex-1 flex flex-col gap-6 overflow-auto pb-6 p-6">
                    <PageHeader
                        title="Cookbook"
                        subtitle="Recipe management with full COGM (Cost of Goods Manufactured) tracking"
                        icon={BookOpen}
                        breadcrumbs={[{ label: 'Cookbook' }]}
                        actions={
                            <Link
                                href={route('store.cookbook.create', { store_slug: store.slug })}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md font-medium"
                            >
                                <Plus size={18} />
                                <span>New Recipe</span>
                            </Link>
                        }
                    />

                    {/* Recipe Cards Grid */}
                    {recipes.length === 0 ? (
                        <MidnightNebula className="rounded-2xl p-12 text-center" primaryColor="indigo" secondaryColor="purple">
                            <div className="flex flex-col items-center max-w-md mx-auto">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
                                    <ChefHat size={40} className="text-white/70" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Your Cookbook is Empty</h3>
                                <p className="text-indigo-200 mb-8">
                                    Start by creating your first recipe to track manufacturing costs, wastage, and profit margins.
                                </p>
                                <Link
                                    href={route('store.cookbook.create', { store_slug: store.slug })}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-bold shadow-lg"
                                >
                                    <Plus size={20} />
                                    Create First Recipe
                                </Link>
                            </div>
                        </MidnightNebula>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map((recipe) => (
                                <div
                                    key={recipe.id}
                                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden"
                                >
                                    {/* Header with gradient */}
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                    <ChefHat size={24} className="text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{recipe.name}</h3>
                                                    <p className="text-orange-100 text-sm">
                                                        {recipe.product?.name || 'No product linked'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 space-y-4">
                                        {/* Description */}
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {recipe.description || 'No description provided'}
                                        </p>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <Package size={16} className="mx-auto text-slate-400 mb-1" />
                                                <p className="text-xs text-slate-500">Ingredients</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{recipe.ingredients_count}</p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <DollarSign size={16} className="mx-auto text-emerald-500 mb-1" />
                                                <p className="text-xs text-slate-500">COGM</p>
                                                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    Rs {parseFloat(recipe.total_cost || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                <Flame size={16} className="mx-auto text-orange-500 mb-1" />
                                                <p className="text-xs text-slate-500">Yield</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{recipe.yield_quantity}</p>
                                            </div>
                                        </div>

                                        {/* Labor & Overhead if present */}
                                        {(recipe.labor_cost > 0 || recipe.overhead_cost > 0) && (
                                            <div className="flex gap-2 text-xs">
                                                {recipe.labor_cost > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                                        <Users size={12} />
                                                        Labor: Rs {parseFloat(recipe.labor_cost).toLocaleString()}
                                                    </span>
                                                )}
                                                {recipe.overhead_cost > 0 && (
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                                        <Flame size={12} />
                                                        Overhead: Rs {parseFloat(recipe.overhead_cost).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex justify-end gap-2">
                                        <button
                                            onClick={() => openSimulator(recipe)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                                            title="Simulate Production"
                                        >
                                            <PlayCircle size={14} />
                                            Simulate
                                        </button>
                                        {recipe.media && recipe.media.length > 0 && (
                                            <button
                                                onClick={() => { setSelectedRecipe(recipe); setTrainingOpen(true); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                                                title="View Training"
                                            >
                                                <BookOpen size={14} />
                                                Train Me
                                            </button>
                                        )}
                                        <Link
                                            href={route('store.cookbook.edit', recipe.id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            <Edit size={14} />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(recipe.id, recipe.name)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pre-Production Simulator Modal */}
                <Modal show={simulatorOpen} onClose={() => setSimulatorOpen(false)} maxWidth="2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <PlayCircle className="text-indigo-600" />
                                Pre-Production Simulator
                            </h2>
                            <button onClick={() => setSimulatorOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {selectedRecipe && (
                            <div className="space-y-6">
                                {/* Input Section */}
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg dark:text-white">{selectedRecipe.name}</h3>
                                            <p className="text-sm text-slate-500">How much do you want to produce?</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={simQty}
                                                onChange={e => setSimQty(parseFloat(e.target.value) || 0)}
                                                className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                                                min="1"
                                            />
                                            <span className="font-medium text-slate-600 dark:text-slate-400">Units</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={runSimulation}
                                        disabled={simLoading || simQty <= 0}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                    >
                                        {simLoading ? 'Checking Stock...' : 'Can I Make This?'}
                                    </button>
                                </div>

                                {/* Results Section */}
                                {simResult && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${simResult.can_make
                                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                            }`}>
                                            {simResult.can_make ? (
                                                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={24} />
                                            ) : (
                                                <XCircle className="text-red-600 shrink-0 mt-0.5" size={24} />
                                            )}
                                            <div>
                                                <h3 className={`font-bold text-lg ${simResult.can_make ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                                    {simResult.can_make ? 'Production Possible!' : 'Insufficient Stock'}
                                                </h3>
                                                <p className={simResult.can_make ? 'text-emerald-600' : 'text-red-600'}>
                                                    {simResult.can_make
                                                        ? 'You have enough ingredients to fulfill this order.'
                                                        : 'One or more ingredients are missing or low in stock.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                                    <tr>
                                                        <th className="px-4 py-3">Ingredient</th>
                                                        <th className="px-4 py-3 text-right">Required</th>
                                                        <th className="px-4 py-3 text-right">Available</th>
                                                        <th className="px-4 py-3 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {simResult.ingredients.map((ing, idx) => (
                                                        <tr key={idx} className="bg-white dark:bg-slate-900">
                                                            <td className="px-4 py-3 font-medium dark:text-white">{ing.name}</td>
                                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                                {parseFloat(ing.required).toFixed(2)} {ing.unit}
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                                {parseFloat(ing.available).toFixed(2)} {ing.unit}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {ing.status === 'ok' ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                                                        OK
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                                        SHORT: {parseFloat(ing.shortfall).toFixed(2)}
                                                                    </span>
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
                        )}
                    </div>
                </Modal>

                {/* Training Modal */}
                <Modal show={trainingOpen} onClose={() => setTrainingOpen(false)} maxWidth="4xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen className="text-blue-600" />
                                Training Resources: {selectedRecipe?.name}
                            </h2>
                            <button onClick={() => setTrainingOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {selectedRecipe && selectedRecipe.media && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedRecipe.media.map((media, idx) => (
                                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                        {media.type === 'youtube' && (
                                            <div className="aspect-video">
                                                <iframe
                                                    src={media.embed_url || media.url.replace('watch?v=', 'embed/')}
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                    title={media.title || 'Video'}
                                                />
                                            </div>
                                        )}
                                        {media.type === 'image' && (
                                            <div className="aspect-video bg-slate-200 dark:bg-slate-700">
                                                <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{media.title || `Resource #${idx + 1}`}</h4>
                                            <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                                Open Original Link
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {(!selectedRecipe?.media || selectedRecipe.media.length === 0) && (
                            <div className="text-center py-12 text-slate-500">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No training resources attached to this recipe.</p>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </OneGlanceLayout>
    );
}
