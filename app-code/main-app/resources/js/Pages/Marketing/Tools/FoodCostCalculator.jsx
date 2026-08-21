import React, { useState, useMemo } from 'react';
import { ChefHat, Plus, Trash2, Download, Copy, RefreshCw, AlertTriangle, ArrowRight, BookOpen, Layers } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

/**
 * Recipe Costing Calculator (Food Cost %) — free, client-side.
 *
 * Units & Conversions:
 * Base Dimensions:
 * - weight: g, kg, oz, lb
 * - volume: ml, L, fl oz, gal
 * - count: each
 *
 * Factors relative to base unit in same dimension:
 * Weight base: g
 *  g: 1
 *  kg: 1000
 *  oz: 28.349523125
 *  lb: 453.59237
 *
 * Volume base: ml
 *  ml: 1
 *  L: 1000
 *  fl oz: 29.5735295625
 *  gal: 3785.411784
 *
 * Count base: each
 *  each: 1
 */

const CURRENCIES = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$',
    PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

const UNIT_SPECS = {
    g:    { label: 'Grams (g)',           dim: 'weight', factor: 1 },
    kg:   { label: 'Kilograms (kg)',      dim: 'weight', factor: 1000 },
    oz:   { label: 'Ounces (oz)',         dim: 'weight', factor: 28.349523125 },
    lb:   { label: 'Pounds (lb)',         dim: 'weight', factor: 453.59237 },
    ml:   { label: 'Milliliters (ml)',   dim: 'volume', factor: 1 },
    L:    { label: 'Liters (L)',          dim: 'volume', factor: 1000 },
    'fl oz': { label: 'Fluid Ounces (fl oz)', dim: 'volume', factor: 29.5735295625 },
    gal:  { label: 'Gallons (gal)',       dim: 'volume', factor: 3785.411784 },
    each: { label: 'Each / Count',        dim: 'count',  factor: 1 },
};

const UNIT_OPTIONS = Object.entries(UNIT_SPECS).map(([val, spec]) => ({
    value: val,
    label: spec.label,
    group: spec.dim.toUpperCase(),
}));

function num(v, fallback = 0) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

function formatMoney(amount, currencySym) {
    if (!Number.isFinite(amount)) return `${currencySym}0.00`;
    return `${currencySym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calculates cost for a single ingredient line item.
 */
function computeIngredientCost(item) {
    const pCost = num(item.purchaseCost);
    const pQty = num(item.purchaseQty);
    const rQty = num(item.recipeQty);
    
    if (pQty <= 0 || pCost <= 0 || rQty <= 0) {
        return { cost: 0, mismatch: false };
    }

    const pSpec = UNIT_SPECS[item.purchaseUnit] || UNIT_SPECS.kg;
    const rSpec = UNIT_SPECS[item.recipeUnit] || UNIT_SPECS.g;

    if (pSpec.dim !== rSpec.dim) {
        return { cost: 0, mismatch: true };
    }

    // Cost per base unit (e.g. per gram, per ml, per each)
    const totalBaseUnitsPurchased = pQty * pSpec.factor;
    const costPerBaseUnit = pCost / totalBaseUnitsPurchased;

    // Total base units used in recipe
    const totalBaseUnitsUsed = rQty * rSpec.factor;

    const totalCost = costPerBaseUnit * totalBaseUnitsUsed;
    return { cost: totalCost, mismatch: false };
}

const DEFAULT_INGREDIENTS = [
    { id: '1', name: 'Pizza Flour (00)', purchaseCost: '25.00', purchaseQty: '25', purchaseUnit: 'kg', recipeQty: '500', recipeUnit: 'g' },
    { id: '2', name: 'Mozzarella Cheese', purchaseCost: '18.50', purchaseQty: '2', purchaseUnit: 'kg', recipeQty: '200', recipeUnit: 'g' },
    { id: '3', name: 'San Marzano Tomatoes', purchaseCost: '4.50', purchaseQty: '800', purchaseUnit: 'g', recipeQty: '150', recipeUnit: 'g' },
    { id: '4', name: 'Extra Virgin Olive Oil', purchaseCost: '12.00', purchaseQty: '1', purchaseUnit: 'L', recipeQty: '20', recipeUnit: 'ml' },
    { id: '5', name: 'Fresh Basil', purchaseCost: '3.00', purchaseQty: '100', purchaseUnit: 'g', recipeQty: '10', recipeUnit: 'g' },
];

const PRESETS = [
    {
        name: 'Neapolitan Margherita Pizza',
        yieldPortions: '2',
        wastePct: '5',
        targetFoodCostPct: '28',
        sellingPrice: '14.50',
        ingredients: [
            { id: '1', name: 'Pizza Flour (00)', purchaseCost: '25.00', purchaseQty: '25', purchaseUnit: 'kg', recipeQty: '500', recipeUnit: 'g' },
            { id: '2', name: 'Mozzarella Cheese', purchaseCost: '18.50', purchaseQty: '2', purchaseUnit: 'kg', recipeQty: '250', recipeUnit: 'g' },
            { id: '3', name: 'San Marzano Tomatoes', purchaseCost: '4.50', purchaseQty: '800', purchaseUnit: 'g', recipeQty: '200', recipeUnit: 'g' },
            { id: '4', name: 'Extra Virgin Olive Oil', purchaseCost: '12.00', purchaseQty: '1', purchaseUnit: 'L', recipeQty: '20', recipeUnit: 'ml' },
            { id: '5', name: 'Fresh Basil & Salt', purchaseCost: '3.00', purchaseQty: '100', purchaseUnit: 'g', recipeQty: '15', recipeUnit: 'g' },
        ],
    },
    {
        name: 'Gourmet Beef Burger & Fries',
        yieldPortions: '1',
        wastePct: '8',
        targetFoodCostPct: '30',
        sellingPrice: '16.00',
        ingredients: [
            { id: '1', name: 'Ground Beef Patty (80/20)', purchaseCost: '32.00', purchaseQty: '5', purchaseUnit: 'lb', recipeQty: '8', recipeUnit: 'oz' },
            { id: '2', name: 'Brioche Bun', purchaseCost: '6.00', purchaseQty: '12', purchaseUnit: 'each', recipeQty: '1', recipeUnit: 'each' },
            { id: '3', name: 'Cheddar Slice', purchaseCost: '8.00', purchaseQty: '24', purchaseUnit: 'each', recipeQty: '1', recipeUnit: 'each' },
            { id: '4', name: 'Russet Potatoes (Fries)', purchaseCost: '15.00', purchaseQty: '50', purchaseUnit: 'lb', recipeQty: '12', recipeUnit: 'oz' },
            { id: '5', name: 'Special Sauce & Fixings', purchaseCost: '10.00', purchaseQty: '1', purchaseUnit: 'L', recipeQty: '45', recipeUnit: 'ml' },
        ],
    },
    {
        name: 'Iced Vanilla Latte',
        yieldPortions: '1',
        wastePct: '3',
        targetFoodCostPct: '18',
        sellingPrice: '5.50',
        ingredients: [
            { id: '1', name: 'Espresso Beans', purchaseCost: '22.00', purchaseQty: '1', purchaseUnit: 'kg', recipeQty: '18', recipeUnit: 'g' },
            { id: '2', name: 'Whole Milk', purchaseCost: '3.80', purchaseQty: '1', purchaseUnit: 'gal', recipeQty: '10', recipeUnit: 'fl oz' },
            { id: '3', name: 'Vanilla Syrup', purchaseCost: '14.00', purchaseQty: '750', purchaseUnit: 'ml', recipeQty: '30', recipeUnit: 'ml' },
            { id: '4', name: 'Cup, Lid & Straw', purchaseCost: '35.00', purchaseQty: '100', purchaseUnit: 'each', recipeQty: '1', recipeUnit: 'each' },
        ],
    },
];

const FAQS = [
    {
        q: 'What is a good food cost percentage for a restaurant?',
        a: 'It varies by segment, but a commonly cited general benchmark is roughly 28–35% of the menu price. Quick-service and fast-casual concepts often target the lower end (around 25–30%), fine dining sometimes runs higher (30–38%), and bar/beverage programs typically run much lower (15–24%) since pour costs are cheap relative to drink prices. These are general guidance, not fixed rules — your target should reflect labor cost, rent and concept.',
    },
    {
        q: 'How do I price a menu item?',
        a: 'Cost out the recipe by summing every ingredient\'s cost contribution, optionally add a waste/spoilage allowance, divide by the number of portions the recipe yields to get cost per portion, then divide that by your target food-cost percentage. Formula: suggested price = cost per portion ÷ (target food-cost % ÷ 100). Example: a $3.00 cost-per-portion dish at a 30% target food cost prices at 3.00 ÷ 0.30 = $10.00.',
    },
    {
        q: 'What is a waste/spoilage allowance and why does it matter?',
        a: 'It\'s a percentage added on top of raw ingredient cost to account for real kitchen losses — trim waste, spillage, over-portioning and spoilage — that never make it into a plated portion. A typical allowance is 5–10%. Ignoring it understates true recipe cost and results in menu prices that undershoot your actual target food-cost percentage once real-world waste is accounted for.',
    },
    {
        q: 'How are food cost percentage and gross margin related?',
        a: 'They are complementary and always add to 100% of the menu price: food-cost % + gross margin % = 100%. A dish with a 30% food cost has a 70% gross margin. See the Profit Margin & Markup Calculator for the same relationship applied to general retail pricing.',
    },
    {
        q: 'Does this tool handle unit conversion between purchase size and recipe usage?',
        a: 'Yes — enter the recipe quantity in whatever unit fits your prep sheet (e.g. grams) and the purchase cost in whatever unit you buy it in (e.g. per kilogram); the tool converts automatically. It supports weight (g, kg, oz, lb) and volume (ml, L, fl oz, gal) conversions, including across metric and imperial, plus a plain "each" unit for counted items. Cross-dimension conversions, like grams to fluid ounces, are flagged rather than guessed.',
    },
    {
        q: 'Is this calculator free?',
        a: 'Yes. Every calculation — unit conversion, cost per portion, waste allowance, target food-cost % pricing, and the multi-recipe summary with CSV export — runs entirely in your browser. No signup, no email required.',
    },
];

export default function FoodCostCalculator({ toolGroups = [] }) {
    const [currency, setCurrency] = useState('USD');
    const sym = CURRENCIES[currency] || currency;

    const [recipeName, setRecipeName] = useState('Neapolitan Margherita Pizza');
    const [yieldPortions, setYieldPortions] = useState('2');
    const [wastePct, setWastePct] = useState('5');
    const [targetFoodCostPct, setTargetFoodCostPct] = useState('28');
    const [sellingPrice, setSellingPrice] = useState('14.50');

    const [ingredients, setIngredients] = useState(DEFAULT_INGREDIENTS);
    const [savedRecipes, setSavedRecipes] = useState([]);

    // Calculated ingredient breakdown
    const parsedIngredients = useMemo(() => {
        return ingredients.map((item) => {
            const { cost, mismatch } = computeIngredientCost(item);
            return {
                ...item,
                lineCost: cost,
                unitMismatch: mismatch,
            };
        });
    }, [ingredients]);

    // Aggregate totals
    const rawBatchCost = useMemo(() => {
        return parsedIngredients.reduce((sum, item) => sum + item.lineCost, 0);
    }, [parsedIngredients]);

    const wasteBufferVal = num(wastePct);
    const totalBatchCostWithWaste = rawBatchCost * (1 + wasteBufferVal / 100);

    const portionsCount = Math.max(1, num(yieldPortions, 1));
    const costPerPortion = totalBatchCostWithWaste / portionsCount;

    const targetPctVal = num(targetFoodCostPct);
    const suggestedPricePerPortion = targetPctVal > 0 ? costPerPortion / (targetPctVal / 100) : 0;

    const actualPriceVal = num(sellingPrice);
    const actualFoodCostPct = actualPriceVal > 0 ? (costPerPortion / actualPriceVal) * 100 : 0;
    const grossProfitPerPortion = Math.max(0, actualPriceVal - costPerPortion);
    const grossMarginPct = actualPriceVal > 0 ? (grossProfitPerPortion / actualPriceVal) * 100 : 0;

    const hasDimensionMismatch = parsedIngredients.some((item) => item.unitMismatch);

    // Form handlers
    const addIngredient = () => {
        setIngredients((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                name: '',
                purchaseCost: '0.00',
                purchaseQty: '1',
                purchaseUnit: 'kg',
                recipeQty: '100',
                recipeUnit: 'g',
            },
        ]);
    };

    const updateIngredient = (id, field, val) => {
        setIngredients((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
        );
    };

    const removeIngredient = (id) => {
        if (ingredients.length <= 1) return;
        setIngredients((prev) => prev.filter((item) => item.id !== id));
    };

    const loadPreset = (preset) => {
        setRecipeName(preset.name);
        setYieldPortions(preset.yieldPortions);
        setWastePct(preset.wastePct);
        setTargetFoodCostPct(preset.targetFoodCostPct);
        setSellingPrice(preset.sellingPrice);
        setIngredients(preset.ingredients.map((ing, idx) => ({ ...ing, id: (idx + 1).toString() })));
    };

    const saveCurrentRecipeToSummary = () => {
        if (!recipeName.trim()) return;
        const entry = {
            id: Date.now().toString(),
            name: recipeName,
            portions: portionsCount,
            batchCost: totalBatchCostWithWaste,
            costPerPortion: costPerPortion,
            suggestedPrice: suggestedPricePerPortion,
            sellingPrice: actualPriceVal,
            actualFoodCostPct: actualFoodCostPct,
            grossProfit: grossProfitPerPortion,
        };
        setSavedRecipes((prev) => [...prev.filter((r) => r.name !== recipeName), entry]);
    };

    const removeSavedRecipe = (id) => {
        setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
    };

    const exportCsv = () => {
        const listToExport = savedRecipes.length > 0 ? savedRecipes : [{
            name: recipeName,
            portions: portionsCount,
            batchCost: totalBatchCostWithWaste,
            costPerPortion: costPerPortion,
            suggestedPrice: suggestedPricePerPortion,
            sellingPrice: actualPriceVal,
            actualFoodCostPct: actualFoodCostPct,
            grossProfit: grossProfitPerPortion,
        }];

        let csv = 'Recipe Name,Portions Yield,Batch Cost,Cost Per Portion,Suggested Price (' + targetFoodCostPct + '% FC),Actual Selling Price,Actual Food Cost %,Gross Profit / Portion\n';
        listToExport.forEach((r) => {
            csv += `"${r.name.replace(/"/g, '""')}",${r.portions},${r.batchCost.toFixed(2)},${r.costPerPortion.toFixed(2)},${r.suggestedPrice.toFixed(2)},${r.sellingPrice.toFixed(2)},${r.actualFoodCostPct.toFixed(1)}%,${r.grossProfit.toFixed(2)}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `recipe_costing_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ToolShell
            title="Free Recipe Costing Calculator (Food Cost %) | VenQore"
            metaDescription="Cost a recipe ingredient by ingredient with automatic unit conversion, get cost per portion, a suggested menu price for your target food-cost %, and the food-cost % of any price. Free, no signup."
            eyebrow="Calculators"
            h1="Recipe Costing Calculator"
            answer="Add each ingredient with its recipe quantity and purchase cost, and the calculator converts units automatically (grams to kilograms, ounces to pounds, fluid ounces to liters) to compute exact cost contribution. Total your recipe, apply a waste buffer allowance, calculate cost per portion, and solve for a suggested menu price based on your target food cost percentage."
            faqs={FAQS}
            cta={{
                headline: 'Automate recipe costing and menu profit margins live at POS checkout.',
                subtext: 'VenQore auto-deducts ingredient stock (composite recipes) on every sale and generates real-time Food Cost & Margin reports across all your store locations.',
            }}
            related={[
                { name: 'Margin Calculator', href: '/tools/margin-calculator' },
                { name: 'Inventory Health Toolkit', href: '/tools/inventory-health' },
                { name: 'POS ROI Calculator', href: '/tools/pos-roi-calculator' },
                { name: 'Payment Fee Calculator', href: '/tools/payment-fee-calculator' },
            ]}
            toolGroups={toolGroups}
            currentSlug="food-cost-calculator"
        >
            <div className="space-y-8">
                {/* ── Preset selector & Top Controls ── */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line dark:border-white/10 pb-5">
                        <div>
                            <span className="text-2xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 block mb-1">
                                Quick Start Presets
                            </span>
                            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                                <ChefHat className="text-brand-500" size={20} />
                                Sample Menu Recipes
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {PRESETS.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => loadPreset(p)}
                                    className="px-3 py-1.5 rounded-xl bg-sunken dark:bg-white/[0.06] hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 text-xs font-bold text-ink-secondary transition-colors"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                                Recipe / Dish Name
                            </label>
                            <input
                                type="text"
                                value={recipeName}
                                onChange={(e) => setRecipeName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm font-semibold focus:outline-none focus:border-brand-500"
                                placeholder="e.g. Chicken Alfredo"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                                Display Currency
                            </label>
                            <Select
                                value={currency}
                                onChange={setCurrency}
                                options={Object.keys(CURRENCIES).map((c) => ({
                                    value: c,
                                    label: `${c} (${CURRENCIES[c]})`,
                                }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                                Recipe Yield (Portions)
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={yieldPortions}
                                onChange={(e) => setYieldPortions(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm font-semibold focus:outline-none focus:border-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                                Waste / Spoilage Buffer %
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    step="0.5"
                                    value={wastePct}
                                    onChange={(e) => setWastePct(e.target.value)}
                                    className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm font-semibold focus:outline-none focus:border-brand-500"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-ink-muted font-bold">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Ingredient List Builder ── */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-ink">
                                Recipe Ingredients & Unit Costs
                            </h3>
                            <p className="text-xs text-ink-muted">
                                Enter your bulk purchasing cost and the exact amount used in the recipe.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addIngredient}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-colors"
                        >
                            <Plus size={14} /> Add Ingredient
                        </button>
                    </div>

                    {hasDimensionMismatch && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <span>
                                <strong>Unit Dimension Mismatch detected:</strong> Cannot convert directly between Weight, Volume, or Count units without density info (e.g. grams vs fluid oz). Please choose matching dimensions for Purchase & Recipe units.
                            </span>
                        </div>
                    )}

                    <div className="space-y-3 overflow-x-auto">
                        {parsedIngredients.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`p-4 rounded-2xl border transition-all ${
                                    item.unitMismatch
                                        ? 'bg-amber-500/[0.04] border-amber-500/30'
                                        : 'bg-sunken dark:bg-white/[0.02] border-line dark:border-white/10'
                                } flex flex-col lg:flex-row lg:items-center gap-3 min-w-[700px]`}
                            >
                                <div className="flex-1 min-w-[160px]">
                                    <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                        Ingredient #{idx + 1} Name
                                    </label>
                                    <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => updateIngredient(item.id, 'name', e.target.value)}
                                        placeholder="e.g. Flour"
                                        className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-xs font-medium focus:outline-none focus:border-brand-500"
                                    />
                                </div>

                                {/* Purchase Specs */}
                                <div className="flex items-center gap-2 min-w-[210px]">
                                    <div className="w-24">
                                        <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                            Pur. Cost ({sym})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.purchaseCost}
                                            onChange={(e) => updateIngredient(item.id, 'purchaseCost', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-xs font-semibold focus:outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    <span className="text-xs text-ink-muted font-bold mt-4">/</span>
                                    <div className="w-16">
                                        <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                            Pur. Qty
                                        </label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={item.purchaseQty}
                                            onChange={(e) => updateIngredient(item.id, 'purchaseQty', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-xs font-semibold focus:outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                            Pur. Unit
                                        </label>
                                        <Select
                                            value={item.purchaseUnit}
                                            onChange={(val) => updateIngredient(item.id, 'purchaseUnit', val)}
                                            options={UNIT_OPTIONS}
                                        />
                                    </div>
                                </div>

                                <ArrowRight size={14} className="hidden lg:block text-ink-muted mt-4 shrink-0" />

                                {/* Recipe Specs */}
                                <div className="flex items-center gap-2 min-w-[190px]">
                                    <div className="w-20">
                                        <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                            Recipe Qty
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={item.recipeQty}
                                            onChange={(e) => updateIngredient(item.id, 'recipeQty', e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-xs font-semibold focus:outline-none focus:border-brand-500"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                            Recipe Unit
                                        </label>
                                        <Select
                                            value={item.recipeUnit}
                                            onChange={(val) => updateIngredient(item.id, 'recipeUnit', val)}
                                            options={UNIT_OPTIONS}
                                        />
                                    </div>
                                </div>

                                {/* Computed Line Cost */}
                                <div className="min-w-[100px] text-right lg:ml-auto">
                                    <label className="block text-2xs font-bold uppercase text-ink-muted mb-1">
                                        Cost Share
                                    </label>
                                    <span className={`text-sm font-bold ${item.unitMismatch ? 'text-amber-500' : 'text-ink'}`}>
                                        {item.unitMismatch ? 'Invalid Unit' : formatMoney(item.lineCost, sym)}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeIngredient(item.id)}
                                    disabled={ingredients.length <= 1}
                                    className="p-2 rounded-lg text-ink-muted hover:text-red-500 disabled:opacity-30 disabled:hover:text-ink-muted transition-colors mt-2 lg:mt-0 shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Key Output Metrics Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Batch & Portion Cost */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-ink shadow-xl flex flex-col justify-between">
                        <div>
                            <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                Recipe Cost Structure
                            </span>
                            <div className="mt-3">
                                <span className="text-3xl font-bold text-ink block">
                                    {formatMoney(costPerPortion, sym)}
                                </span>
                                <span className="text-xs text-ink-secondary font-semibold block mt-1">
                                    Cost Per Portion ({yieldPortions} portion{num(yieldPortions) === 1 ? '' : 's'})
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-line dark:border-white/10 space-y-2 text-xs">
                            <div className="flex justify-between text-ink-secondary">
                                <span>Raw Ingredients Total:</span>
                                <span className="font-bold text-ink">{formatMoney(rawBatchCost, sym)}</span>
                            </div>
                            <div className="flex justify-between text-ink-secondary">
                                <span>Waste Allowance ({wastePct}%):</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatMoney(totalBatchCostWithWaste - rawBatchCost, sym)}</span>
                            </div>
                            <div className="flex justify-between text-ink-secondary font-bold">
                                <span>Total Batch Cost:</span>
                                <span className="text-ink">{formatMoney(totalBatchCostWithWaste, sym)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Target Food Cost % Solver */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-2xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                Target Pricing Solver
                            </span>
                            <div className="mt-3">
                                <span className="text-3xl font-bold text-ink block">
                                    {formatMoney(suggestedPricePerPortion, sym)}
                                </span>
                                <span className="text-xs text-ink-muted font-medium block mt-1">
                                    Suggested Price / Portion
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-line dark:border-white/10">
                            <label className="block text-xs font-bold text-ink-secondary mb-1.5">
                                Target Food Cost %
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="5"
                                    max="90"
                                    step="1"
                                    value={targetFoodCostPct}
                                    onChange={(e) => setTargetFoodCostPct(e.target.value)}
                                    className="w-full px-3 py-2 pr-8 rounded-xl bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm font-bold focus:outline-none focus:border-brand-500"
                                />
                                <span className="absolute right-3 top-2 text-xs text-ink-muted font-bold">%</span>
                            </div>
                            <p className="text-1xs text-ink-muted mt-2">
                                Standard restaurant benchmark: 28% - 35%.
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Actual Menu Price & Margin Evaluation */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 shadow-sm flex flex-col justify-between">
                        <div>
                            <span className="text-2xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                Menu Margin Analysis
                            </span>
                            <div className="mt-3">
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 block">
                                    {formatMoney(grossProfitPerPortion, sym)}
                                </span>
                                <span className="text-xs text-ink-muted font-medium block mt-1">
                                    Gross Profit per Portion ({round2(grossMarginPct)}% Margin)
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-line dark:border-white/10 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-ink-secondary mb-1">
                                    Actual / Planned Selling Price ({sym})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.25"
                                    value={sellingPrice}
                                    onChange={(e) => setSellingPrice(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-sunken dark:bg-white/[0.04] border border-line dark:border-white/10 text-ink text-sm font-bold focus:outline-none focus:border-brand-500"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-ink-muted">Actual Food Cost:</span>
                                <span className={`font-bold ${actualFoodCostPct > 35 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {round2(actualFoodCostPct)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Multi-Recipe Summary & CSV Export ── */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-line dark:border-white/10 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-ink flex items-center gap-2">
                                <Layers size={18} className="text-brand-500" />
                                Multi-Recipe Menu Summary
                            </h3>
                            <p className="text-xs text-ink-muted">
                                Save current calculation to compile a full menu cost breakdown and export as CSV.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={saveCurrentRecipeToSummary}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-bold transition-all shadow-md"
                            >
                                <Plus size={14} /> Add "{recipeName}" to Summary
                            </button>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-ink hover:opacity-90 text-xs font-bold transition-all"
                            >
                                <Download size={14} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {savedRecipes.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-sunken dark:bg-white/[0.02] border border-dashed border-line dark:border-white/10">
                            <BookOpen className="mx-auto text-ink-muted mb-2" size={24} />
                            <p className="text-xs font-bold text-ink-secondary">
                                No saved recipes in summary yet.
                            </p>
                            <p className="text-1xs text-ink-muted mt-1">
                                Click "Add to Summary" above to save multiple menu items side-by-side.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-line dark:border-white/10 text-ink-muted font-bold uppercase text-2xs">
                                        <th className="py-2.5 px-3">Recipe</th>
                                        <th className="py-2.5 px-3">Yield</th>
                                        <th className="py-2.5 px-3">Batch Cost</th>
                                        <th className="py-2.5 px-3">Cost/Portion</th>
                                        <th className="py-2.5 px-3">Target Price</th>
                                        <th className="py-2.5 px-3">Actual Price</th>
                                        <th className="py-2.5 px-3">Food Cost %</th>
                                        <th className="py-2.5 px-3">Profit / Portion</th>
                                        <th className="py-2.5 px-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line dark:divide-white/5">
                                    {savedRecipes.map((r) => (
                                        <tr key={r.id} className="hover:bg-interactive-hover/[0.02] dark:hover:bg-white/[0.02]">
                                            <td className="py-3 px-3 font-bold text-ink">{r.name}</td>
                                            <td className="py-3 px-3 text-ink-secondary">{r.portions} ptn</td>
                                            <td className="py-3 px-3 text-ink-secondary">{formatMoney(r.batchCost, sym)}</td>
                                            <td className="py-3 px-3 font-bold text-ink">{formatMoney(r.costPerPortion, sym)}</td>
                                            <td className="py-3 px-3 text-brand-600 dark:text-brand-400 font-semibold">{formatMoney(r.suggestedPrice, sym)}</td>
                                            <td className="py-3 px-3 font-bold text-ink">{formatMoney(r.sellingPrice, sym)}</td>
                                            <td className="py-3 px-3">
                                                <span className={`font-bold ${r.actualFoodCostPct > 35 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {round2(r.actualFoodCostPct)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(r.grossProfit, sym)}</td>
                                            <td className="py-3 px-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSavedRecipe(r.id)}
                                                    className="p-1 text-ink-muted hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ToolShell>
    );
}
