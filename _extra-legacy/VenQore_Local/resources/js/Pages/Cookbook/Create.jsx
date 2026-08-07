import React, { useState, useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import { BookOpen, Plus, Trash2, Save, Package, Calculator, Percent, DollarSign, Scale, AlertTriangle, Flame, Clock, Zap, Settings, Eye, EyeOff } from 'lucide-react';
import SmartCombobox from '@/Components/SmartCombobox';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import ProductModal from '@/Components/ProductModal';
const UNIT_FAMILIES = {
    weight: ['g', 'kg', 'mg', 'gram', 'grams', 'kilogram', 'kilograms'],
    volume: ['ml', 'l', 'liter', 'liters', 'litre', 'litres', 'milliliter'],
    pieces: ['pcs', 'piece', 'pieces', 'unit', 'units', 'box', 'pack', 'packet']
};

// Get unit family
const getUnitFamily = (unit) => {
    const lowerUnit = (unit || 'pcs').toLowerCase();
    for (const [family, units] of Object.entries(UNIT_FAMILIES)) {
        if (units.includes(lowerUnit)) return family;
    }
    return 'other';
};

// Format quantity with smart unit conversion
const formatQuantity = (qty, unit) => {
    const lowerUnit = (unit || 'pcs').toLowerCase();
    const numQty = parseFloat(qty) || 0;

    // Weight conversions
    if (lowerUnit === 'kg' || lowerUnit === 'kilogram' || lowerUnit === 'kilograms') {
        if (numQty < 1) return `${(numQty * 1000).toFixed(0)}g`;
        return `${numQty}kg`;
    }
    if (lowerUnit === 'g' || lowerUnit === 'gram' || lowerUnit === 'grams') {
        if (numQty >= 1000) return `${(numQty / 1000).toFixed(2)}kg`;
        return `${numQty}g`;
    }

    // Volume conversions
    if (lowerUnit === 'l' || lowerUnit === 'liter' || lowerUnit === 'liters' || lowerUnit === 'litre' || lowerUnit === 'litres') {
        if (numQty < 1) return `${(numQty * 1000).toFixed(0)}ml`;
        return `${numQty}L`;
    }
    if (lowerUnit === 'ml' || lowerUnit === 'milliliter') {
        if (numQty >= 1000) return `${(numQty / 1000).toFixed(2)}L`;
        return `${numQty}ml`;
    }

    return `${numQty} ${unit}`;
};

export default function CookbookCreate({ products = [], recipe = null, warehouses = [], categories = [], attributes = [] }) {
    const {
        store
    } = usePage().props;

    // Local state for products to support async additions
    const [localProducts, setLocalProducts] = useState(products);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [pendingIngredientIndex, setPendingIngredientIndex] = useState(null); // Track which ingredient row requested the new product

    // Helper to merge new products from async search
    const mergeProduct = (newProduct) => {
        setLocalProducts(prev => {
            if (prev.find(p => p.id === newProduct.id)) return prev;
            return [...prev, newProduct];
        });
    };

    // Quick Settings State
    const [viewOptions, setViewOptions] = useState({
        showPrepTime: true,
        showInstructions: true,
        showLabor: true,
        showUtilities: true,
        showTraining: true
    });
    const [showSettings, setShowSettings] = useState(false);

    const toggleView = (key) => setViewOptions(prev => ({ ...prev, [key]: !prev[key] }));
    const { data, setData, post, put, processing, errors } = useForm({
        name: recipe?.name || '',
        description: recipe?.description || '',
        product_id: recipe?.product_id || '',
        yield_quantity: recipe?.yield_quantity || 1,
        labor_cost: recipe?.labor_cost || 0,
        overhead_cost: recipe?.overhead_cost || 0,
        prep_time_minutes: recipe?.prep_time_minutes || 0,

        ingredients: recipe?.ingredients || [
            { product_id: '', quantity: 1, unit: 'pcs', wastage_percent: 0 }
        ],
        media: recipe?.media || []
    });

    // Profit margin input
    const [desiredMargin, setDesiredMargin] = useState(20);

    // Get product by ID helper
    const getProduct = (id) => localProducts.find(p => p.id == id);

    // Calculate costs and summaries
    const calculations = useMemo(() => {
        let totalIngredientCost = 0;
        let totalGrossWeight = 0;
        let totalNetWeight = 0;
        const ingredientDetails = [];
        const unitFamilies = new Set();

        data.ingredients.forEach((ing, idx) => {
            if (ing.product_id) {
                const product = getProduct(ing.product_id);
                if (product) {
                    const grossQty = (parseFloat(ing.quantity) || 0);
                    const wastagePercent = parseFloat(ing.wastage_percent) || 0;
                    const netQty = grossQty * (1 - wastagePercent / 100);
                    const costPerUnit = parseFloat(product.cost_price) || 0;

                    // COST is based on GROSS (what you buy)
                    const ingredientCost = grossQty * costPerUnit;
                    totalIngredientCost += ingredientCost;

                    const family = getUnitFamily(product.base_unit);
                    unitFamilies.add(family);

                    // Track weights for yield summary
                    if (family === 'weight') {
                        // Normalize to grams for comparison
                        let gramsGross = grossQty;
                        let gramsNet = netQty;
                        if (product.base_unit.toLowerCase() === 'kg') {
                            gramsGross = grossQty * 1000;
                            gramsNet = netQty * 1000;
                        }
                        totalGrossWeight += gramsGross;
                        totalNetWeight += gramsNet;
                    }

                    ingredientDetails.push({
                        name: product.name,
                        grossQty,
                        netQty,
                        wastagePercent,
                        wastageLoss: grossQty - netQty,
                        unit: product.base_unit,
                        costPerUnit,
                        totalCost: ingredientCost,
                        formattedGross: formatQuantity(grossQty, product.base_unit),
                        formattedNet: formatQuantity(netQty, product.base_unit),
                        family
                    });
                }
            }
        });

        // Labor and Overhead
        const laborCost = (parseFloat(data.labor_cost) || 0);
        const overheadCost = (parseFloat(data.overhead_cost) || 0);

        // COGM = Cost of Goods Manufactured
        const totalCOGM = totalIngredientCost + laborCost + overheadCost;

        // Check if all same family
        const isSameFamily = unitFamilies.size <= 1;
        const primaryFamily = unitFamilies.size === 1 ? [...unitFamilies][0] : null;

        // Calculate yield summary
        let yieldSummaryGross = '';
        let yieldSummaryNet = '';

        if (primaryFamily === 'weight') {
            yieldSummaryGross = formatQuantity(totalGrossWeight, 'g');
            yieldSummaryNet = formatQuantity(totalNetWeight, 'g');
        } else if (isSameFamily && primaryFamily && primaryFamily !== 'other') {
            const totalQty = ingredientDetails.reduce((sum, i) => sum + i.grossQty, 0);
            const totalNetQty = ingredientDetails.reduce((sum, i) => sum + i.netQty, 0);
            const firstUnit = ingredientDetails[0]?.unit || 'pcs';
            yieldSummaryGross = formatQuantity(totalQty, firstUnit);
            yieldSummaryNet = formatQuantity(totalNetQty, firstUnit);
        } else {
            // Mixed families - list by family
            const byFamily = {};
            ingredientDetails.forEach(i => {
                if (!byFamily[i.family]) byFamily[i.family] = { gross: 0, net: 0, unit: i.unit };
                byFamily[i.family].gross += i.grossQty;
                byFamily[i.family].net += i.netQty;
            });

            const partsGross = [];
            const partsNet = [];
            Object.entries(byFamily).forEach(([family, data]) => {
                partsGross.push(formatQuantity(data.gross, data.unit));
                partsNet.push(formatQuantity(data.net, data.unit));
            });
            yieldSummaryGross = partsGross.join(' + ');
            yieldSummaryNet = partsNet.join(' + ');
        }

        // Total wastage loss
        const totalWastageLoss = ingredientDetails.reduce((sum, i) => sum + i.wastageLoss, 0);
        const wastagePercent = totalGrossWeight > 0
            ? ((totalGrossWeight - totalNetWeight) / totalGrossWeight * 100).toFixed(1)
            : 0;

        // Suggested selling price
        const suggestedPrice = totalCOGM * (1 + desiredMargin / 100);

        // Cost per unit (if yield quantity is set)
        const yieldQty = (parseFloat(data.yield_quantity) || 1);
        const costPerUnit = yieldQty > 0 ? totalCOGM / yieldQty : 0;

        return {
            totalIngredientCost,
            laborCost,
            overheadCost,
            totalCOGM,
            ingredientDetails,
            isSameFamily,
            yieldSummaryGross,
            yieldSummaryNet,
            totalWastageLoss,
            wastagePercent,
            suggestedPrice,
            costPerUnit,
            batchYield: yieldQty
        };
    }, [data.ingredients, data.labor_cost, data.overhead_cost, data.yield_quantity, localProducts, desiredMargin]);

    // Get selected parent product
    const selectedProduct = useMemo(() => {
        return getProduct(data.product_id);
    }, [data.product_id, localProducts]);

    const addIngredient = () => {
        setData('ingredients', [
            ...data.ingredients,
            { product_id: '', quantity: 1, unit: 'pcs', wastage_percent: 0 }
        ]);
    };

    const removeIngredient = (index) => {
        const newIngredients = [...data.ingredients];
        newIngredients.splice(index, 1);
        setData('ingredients', newIngredients);
    };

    const updateIngredient = (index, field, value) => {
        const newIngredients = [...data.ingredients];
        newIngredients[index][field] = value;

        // Auto-set unit from product
        if (field === 'product_id' && value) {
            const product = getProduct(value);
            if (product) {
                newIngredients[index].unit = product.base_unit || 'pcs';
            }
        }

        setData('ingredients', newIngredients);
    };

    const handleProductCreated = (newProduct) => {
        mergeProduct(newProduct);
        console.log("New Product Created:", newProduct);

        // If we were adding to the main recipe output
        if (pendingIngredientIndex === 'output') {
            setData('product_id', newProduct.id);
        }
        // If we were adding to a specific ingredient row
        else if (pendingIngredientIndex !== null) {
            updateIngredient(pendingIngredientIndex, 'product_id', newProduct.id);
        }

        setIsProductModalOpen(false);
        setPendingIngredientIndex(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (recipe) {
            put(route('store.cookbook.update', recipe.id));
        } else {
            post(route('store.cookbook.store', { store_slug: store.slug }));
        }
    };

    return (
        <OneGlanceLayout title={recipe ? "Edit Recipe" : "Create Recipe"}>
            <Head title={recipe ? "Edit Recipe" : "Create Recipe"} />
            <div className="h-full flex flex-col gap-4 w-full px-4 pb-4 overflow-hidden">
                <PageHeader
                    title={recipe ? "Edit Recipe" : "Create Recipe"}
                    subtitle={recipe ? `Editing ${recipe.name}` : "Define a recipe with wastage tracking & full cost analysis"}
                    icon={BookOpen}
                    breadcrumbs={[
                        { label: 'Cookbook', href: route('store.cookbook.index', { store_slug: store.slug }) },
                        { label: recipe ? 'Edit' : 'Create' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            {/* Quick Settings Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2.5 rounded-xl border transition-all ${showSettings ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:text-indigo-600'}`}
                                >
                                    <Settings size={18} />
                                </button>

                                {showSettings && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <div className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider mb-1">View Options</div>
                                        {[
                                            { key: 'showPrepTime', label: 'Prep Time' },
                                            { key: 'showInstructions', label: 'Instructions' },
                                            { key: 'showLabor', label: 'Labor Cost' },
                                            { key: 'showUtilities', label: 'Utilities Cost' },
                                            { key: 'showTraining', label: 'Training SOPs' },
                                        ].map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => toggleView(opt.key)}
                                                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                                            >
                                                <span>{opt.label}</span>
                                                {viewOptions[opt.key] ? <Eye size={14} className="text-indigo-500" /> : <EyeOff size={14} className="text-slate-400" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50"
                            >
                                <Save size={18} />
                                <span>Save Recipe</span>
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full overflow-hidden">
                    {/* LEFT COLUMN: Details & Labor (3/12) */}
                    <div className="xl:col-span-3 space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
                        {/* Basic Info Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Package size={18} className="text-indigo-500" />
                                Recipe Details
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recipe Name</label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                        placeholder="e.g., Garam Masala Mix"
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Output Product</label>
                                    <AsyncProductCombobox
                                        selectedItem={localProducts.find(p => p.id == data.product_id)}
                                        onSelect={(item) => {
                                            if (item) {
                                                mergeProduct(item);
                                                setData('product_id', item.id);
                                            } else {
                                                setData('product_id', ''); // Clear selection
                                            }
                                        }}
                                        onCreateNew={() => {
                                            setPendingIngredientIndex('output');
                                            setEditingProduct(null);
                                            setIsProductModalOpen(true);
                                        }}
                                        onEdit={(item) => {
                                            setEditingProduct(item);
                                            setIsProductModalOpen(true);
                                        }}
                                        placeholder="Search Output Product..."
                                        inputClassName="py-2.5 text-sm"
                                    />
                                    {errors.product_id && <p className="text-xs text-red-500">{errors.product_id}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Yield Qty</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={data.yield_quantity}
                                                onChange={e => setData('yield_quantity', e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-center"
                                                min="0.01"
                                                step="0.01"
                                            />
                                            {selectedProduct && (
                                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
                                                    {selectedProduct.base_unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {viewOptions.showPrepTime && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prep (Min)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={data.prep_time_minutes}
                                                    onChange={e => setData('prep_time_minutes', e.target.value)}
                                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-center pl-8"
                                                    min="0"
                                                    placeholder="0"
                                                />
                                                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {viewOptions.showInstructions && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Instructions</label>
                                        <textarea
                                            value={data.description}
                                            onChange={e => setData('description', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-sm"
                                            rows={4}
                                            placeholder="Brief steps..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Labor & Overhead Card */}
                        {(viewOptions.showLabor || viewOptions.showUtilities) && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-5 shadow-sm">
                                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                    <Zap size={18} className="text-purple-500" />
                                    Overhead Costs
                                </h3>
                                <div className="space-y-3">
                                    {viewOptions.showLabor && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5"><Clock size={14} /> Labor Cost</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs</span>
                                                <input
                                                    type="number"
                                                    value={data.labor_cost}
                                                    onChange={e => setData('labor_cost', e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none text-right"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {viewOptions.showUtilities && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                                <span className="flex items-center gap-1.5"><Flame size={14} /> Utilities</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Rs</span>
                                                <input
                                                    type="number"
                                                    value={data.overhead_cost}
                                                    onChange={e => setData('overhead_cost', e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none text-right"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CENTER COLUMN: Ingredients (6/12) */}
                    <div className="xl:col-span-6 h-full overflow-hidden flex flex-col">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Scale size={20} className="text-emerald-500" />
                                    Ingredients List
                                    Ingredients List
                                </h3>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus size={14} />
                                    Add Item
                                </button>
                            </div>

                            {/* Table Header */}
                            <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex-1 pl-1">Item</div>
                                <div className="w-16 text-center">Gross</div>
                                <div className="w-14 text-center">Waste %</div>
                                <div className="w-14 text-right pr-1">Net</div>
                                <div className="w-20 text-right pr-2">Cost</div>
                            </div>

                            {/* Scrollable List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                {data.ingredients.map((ingredient, index) => {
                                    const product = getProduct(ingredient.product_id);
                                    const detail = calculations.ingredientDetails.find(i => i.name === product?.name);

                                    return (
                                        <div key={index} className="flex flex-col lg:flex-row items-center gap-2 p-2 bg-white dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 hover:shadow-sm transition-all group">
                                            {/* Ingredient Select */}
                                            <div className="w-full lg:flex-1 relative">
                                                <AsyncProductCombobox
                                                    selectedItem={localProducts.find(p => p.id == ingredient.product_id)}
                                                    onSelect={(item) => {
                                                        if (item) {
                                                            mergeProduct(item);
                                                            updateIngredient(index, 'product_id', item.id);
                                                        } else {
                                                            updateIngredient(index, 'product_id', ''); // Clear selection
                                                        }
                                                    }}
                                                    onCreateNew={() => {
                                                        setPendingIngredientIndex(index);
                                                        setEditingProduct(null);
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    onEdit={(item) => {
                                                        setEditingProduct(item);
                                                        setIsProductModalOpen(true);
                                                    }}
                                                    placeholder="Search Ingredient..."
                                                    inputClassName="py-1.5 text-sm bg-white dark:bg-slate-800 pr-24"
                                                    className="w-full"
                                                />
                                                {product && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-slate-500 dark:text-slate-400 font-medium">{product.base_unit}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold">Rs {parseFloat(product.cost_price).toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mobile layout container for numbers */}
                                            <div className="w-full lg:w-auto grid grid-cols-4 lg:flex lg:items-center gap-2">
                                                {/* Gross Quantity */}
                                                <div className="col-span-2 lg:w-16">
                                                    <label className="lg:hidden text-[10px] text-slate-400 font-bold uppercase mb-1 block">Gross</label>
                                                    <input
                                                        type="number"
                                                        value={ingredient.quantity}
                                                        onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                                                        className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        min="0.01"
                                                        step="0.01"
                                                    />
                                                </div>

                                                {/* Wastage % */}
                                                <div className="col-span-2 lg:w-14 px-0.5">
                                                    <label className="lg:hidden text-[10px] text-slate-400 font-bold uppercase mb-1 block">Waste</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={ingredient.wastage_percent}
                                                            onChange={e => updateIngredient(index, 'wastage_percent', e.target.value)}
                                                            className="w-full px-1 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 text-sm text-center text-amber-700 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Net Quantity */}
                                                <div className="col-span-2 lg:w-14 text-right flex flex-col justify-center pr-1">
                                                    <label className="lg:hidden text-[10px] text-slate-400 font-bold uppercase mb-1 block">Net</label>
                                                    <div className="flex flex-col items-end justify-center w-full">
                                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1 py-1 rounded-md min-w-[50px] text-center">
                                                            {detail ? detail.formattedNet : '-'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Total Cost & Delete */}
                                                <div className="col-span-2 lg:w-20 flex items-center justify-end gap-1">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-right w-full">
                                                        {detail ? Math.round(detail.totalCost).toLocaleString() : '0'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeIngredient(index)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer/Warnings */}
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                                {parseFloat(calculations.wastagePercent) > 15 ? (
                                    <div className="flex items-center gap-2 text-amber-600 text-xs justify-center">
                                        <AlertTriangle size={14} />
                                        <span className="font-bold">High Wastage ({calculations.wastagePercent}%).</span>
                                        <span>Check ingredient quality.</span>
                                    </div>
                                ) : (
                                    <div className="flex justify-between text-[10px] text-slate-400 px-2">
                                        <span>Total Items: {data.ingredients.length}</span>
                                        <span>Gross Weight: {calculations.yieldSummaryGross}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Summary & SOPs (3/12) */}
                    <div className="xl:col-span-3 space-y-4 h-full overflow-y-auto pl-1 custom-scrollbar">
                        {/* Cost Summary Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl sticky top-0">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Calculator size={20} />
                                Cost of Goods Manufactured
                            </h3>



                            {/* Yield Summary */}
                            {calculations.ingredientDetails.length > 0 && (
                                <div className="mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-indigo-200">Gross Input:</span>
                                        <span className="text-sm font-medium">{calculations.yieldSummaryGross}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-emerald-300">Net Output:</span>
                                        <span className="text-sm font-bold text-emerald-300">{calculations.yieldSummaryNet}</span>
                                    </div>
                                    {parseFloat(calculations.wastagePercent) > 0 && (
                                        <div className="flex justify-between text-amber-300">
                                            <span className="text-xs">Wastage:</span>
                                            <span className="text-sm font-medium">{calculations.wastagePercent}%</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cost Breakdown */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-indigo-100">
                                    <span className="text-sm">Ingredients:</span>
                                    <span className="font-medium">Rs {calculations.totalIngredientCost.toLocaleString()}</span>
                                </div>
                                {calculations.laborCost > 0 && (
                                    <div className="flex justify-between text-indigo-100">
                                        <span className="text-sm">Labor:</span>
                                        <span className="font-medium">Rs {calculations.laborCost.toLocaleString()}</span>
                                    </div>
                                )}
                                {calculations.overheadCost > 0 && (
                                    <div className="flex justify-between text-indigo-100">
                                        <span className="text-sm">Overhead:</span>
                                        <span className="font-medium">Rs {calculations.overheadCost.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/20 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="font-bold">Total COGM:</span>
                                        <span className="text-xl font-bold">
                                            Rs {calculations.totalCOGM.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-200 mt-1">
                                        Cost per unit: Rs {calculations.costPerUnit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>

                            {/* Profit Margin Input */}
                            <div className="mb-4">
                                <label className="text-sm text-indigo-200 mb-2 block">Desired Profit Margin</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={desiredMargin}
                                        onChange={e => setDesiredMargin(parseFloat(e.target.value) || 0)}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-indigo-200 focus:ring-2 focus:ring-white/50 outline-none text-center font-bold"
                                        min="0"
                                        step="1"
                                    />
                                    <span className="text-lg font-bold">%</span>
                                </div>
                            </div>

                            {/* Suggested Selling Price */}
                            <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                                <p className="text-sm text-indigo-200 mb-1 flex items-center gap-1">
                                    <DollarSign size={14} />
                                    Suggested Selling Price
                                </p>
                                <p className="text-2xl font-bold">
                                    Rs {calculations.suggestedPrice.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-indigo-200 mt-1">
                                    Profit: Rs {(calculations.suggestedPrice - calculations.totalCOGM).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Current Product Price Comparison */}
                            {selectedProduct && (
                                <div className="mt-4 p-3 bg-white/10 rounded-xl">
                                    <p className="text-xs text-indigo-200">Current Product Price</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-lg font-bold">Rs {parseFloat(selectedProduct.price).toLocaleString()}</p>
                                        {parseFloat(selectedProduct.price) < calculations.suggestedPrice && (
                                            <span className="text-xs px-2 py-1 bg-red-500/30 text-red-200 rounded-full">
                                                Underpriced!
                                            </span>
                                        )}
                                        {parseFloat(selectedProduct.price) >= calculations.suggestedPrice && (
                                            <span className="text-xs px-2 py-1 bg-emerald-500/30 text-emerald-200 rounded-full">
                                                Good margin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SOP Media Mini-Card */}
                        {viewOptions.showTraining && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold flex items-center gap-2 dark:text-white">
                                        <BookOpen size={16} className="text-blue-500" />
                                        Training SOPs
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setData('media', [...(data.media || []), { type: 'youtube', url: '', title: '' }])}
                                        className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="space-y-2 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                                    {(data.media || []).length === 0 && (
                                        <div className="text-center py-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                            <p className="text-xs text-slate-400">No media attached</p>
                                        </div>
                                    )}
                                    {(data.media || []).map((item, index) => (
                                        <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 group relative">
                                            <input
                                                placeholder="Title e.g. How-to Video"
                                                value={item.title}
                                                onChange={e => {
                                                    const newMedia = [...data.media];
                                                    newMedia[index].title = e.target.value;
                                                    setData('media', newMedia);
                                                }}
                                                className="w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 placeholder-slate-400"
                                            />
                                            <input
                                                placeholder="URL..."
                                                value={item.url}
                                                onChange={e => {
                                                    const newMedia = [...data.media];
                                                    newMedia[index].url = e.target.value;
                                                    setData('media', newMedia);
                                                }}
                                                className="w-full bg-transparent border-none p-0 text-[10px] text-blue-500 focus:ring-0 placeholder-slate-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newMedia = [...data.media];
                                                    newMedia.splice(index, 1);
                                                    setData('media', newMedia);
                                                }}
                                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Product Creation Modal */}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                mode="create"
                warehouses={warehouses}
                categories={categories}
                attributes={attributes}
                onSubmit={(formData, onError) => {
                    axios.post(route("store.inventory.store", {
                        store_slug: store.slug
                    }), formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }).then(res => {
                        if (res.data && res.data.product) {
                            handleProductCreated(res.data.product);
                        } else {
                            setIsProductModalOpen(false);
                        }
                    }).catch(error => {
                        console.error(error);
                        if (onError) onError(error.response?.data?.errors);
                    });
                }}
            />
        </OneGlanceLayout>
    );
}
