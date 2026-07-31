import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { ChefHat, Plus, AlertTriangle, ArrowRight, Trash2, Layers, Download, BookOpen } from "lucide-react";
import ToolShell from "./ToolShell-BDFk9CqZ.js";
import Select from "./Select-BFX9Hz_h.js";
import "@inertiajs/react";
import "./MarketingLayout-CMiC1Bik.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./ToolsSidebar-BvvbAU_Q.js";
import "./HousePromo-CAVKWeBy.js";
const CURRENCIES = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "AU$",
  PKR: "Rs",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
  JPY: "¥"
};
const UNIT_SPECS = {
  g: { label: "Grams (g)", dim: "weight", factor: 1 },
  kg: { label: "Kilograms (kg)", dim: "weight", factor: 1e3 },
  oz: { label: "Ounces (oz)", dim: "weight", factor: 28.349523125 },
  lb: { label: "Pounds (lb)", dim: "weight", factor: 453.59237 },
  ml: { label: "Milliliters (ml)", dim: "volume", factor: 1 },
  L: { label: "Liters (L)", dim: "volume", factor: 1e3 },
  "fl oz": { label: "Fluid Ounces (fl oz)", dim: "volume", factor: 29.5735295625 },
  gal: { label: "Gallons (gal)", dim: "volume", factor: 3785.411784 },
  each: { label: "Each / Count", dim: "count", factor: 1 }
};
const UNIT_OPTIONS = Object.entries(UNIT_SPECS).map(([val, spec]) => ({
  value: val,
  label: spec.label,
  group: spec.dim.toUpperCase()
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
  return `${currencySym}${amount.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
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
  const totalBaseUnitsPurchased = pQty * pSpec.factor;
  const costPerBaseUnit = pCost / totalBaseUnitsPurchased;
  const totalBaseUnitsUsed = rQty * rSpec.factor;
  const totalCost = costPerBaseUnit * totalBaseUnitsUsed;
  return { cost: totalCost, mismatch: false };
}
const DEFAULT_INGREDIENTS = [
  { id: "1", name: "Pizza Flour (00)", purchaseCost: "25.00", purchaseQty: "25", purchaseUnit: "kg", recipeQty: "500", recipeUnit: "g" },
  { id: "2", name: "Mozzarella Cheese", purchaseCost: "18.50", purchaseQty: "2", purchaseUnit: "kg", recipeQty: "200", recipeUnit: "g" },
  { id: "3", name: "San Marzano Tomatoes", purchaseCost: "4.50", purchaseQty: "800", purchaseUnit: "g", recipeQty: "150", recipeUnit: "g" },
  { id: "4", name: "Extra Virgin Olive Oil", purchaseCost: "12.00", purchaseQty: "1", purchaseUnit: "L", recipeQty: "20", recipeUnit: "ml" },
  { id: "5", name: "Fresh Basil", purchaseCost: "3.00", purchaseQty: "100", purchaseUnit: "g", recipeQty: "10", recipeUnit: "g" }
];
const PRESETS = [
  {
    name: "Neapolitan Margherita Pizza",
    yieldPortions: "2",
    wastePct: "5",
    targetFoodCostPct: "28",
    sellingPrice: "14.50",
    ingredients: [
      { id: "1", name: "Pizza Flour (00)", purchaseCost: "25.00", purchaseQty: "25", purchaseUnit: "kg", recipeQty: "500", recipeUnit: "g" },
      { id: "2", name: "Mozzarella Cheese", purchaseCost: "18.50", purchaseQty: "2", purchaseUnit: "kg", recipeQty: "250", recipeUnit: "g" },
      { id: "3", name: "San Marzano Tomatoes", purchaseCost: "4.50", purchaseQty: "800", purchaseUnit: "g", recipeQty: "200", recipeUnit: "g" },
      { id: "4", name: "Extra Virgin Olive Oil", purchaseCost: "12.00", purchaseQty: "1", purchaseUnit: "L", recipeQty: "20", recipeUnit: "ml" },
      { id: "5", name: "Fresh Basil & Salt", purchaseCost: "3.00", purchaseQty: "100", purchaseUnit: "g", recipeQty: "15", recipeUnit: "g" }
    ]
  },
  {
    name: "Gourmet Beef Burger & Fries",
    yieldPortions: "1",
    wastePct: "8",
    targetFoodCostPct: "30",
    sellingPrice: "16.00",
    ingredients: [
      { id: "1", name: "Ground Beef Patty (80/20)", purchaseCost: "32.00", purchaseQty: "5", purchaseUnit: "lb", recipeQty: "8", recipeUnit: "oz" },
      { id: "2", name: "Brioche Bun", purchaseCost: "6.00", purchaseQty: "12", purchaseUnit: "each", recipeQty: "1", recipeUnit: "each" },
      { id: "3", name: "Cheddar Slice", purchaseCost: "8.00", purchaseQty: "24", purchaseUnit: "each", recipeQty: "1", recipeUnit: "each" },
      { id: "4", name: "Russet Potatoes (Fries)", purchaseCost: "15.00", purchaseQty: "50", purchaseUnit: "lb", recipeQty: "12", recipeUnit: "oz" },
      { id: "5", name: "Special Sauce & Fixings", purchaseCost: "10.00", purchaseQty: "1", purchaseUnit: "L", recipeQty: "45", recipeUnit: "ml" }
    ]
  },
  {
    name: "Iced Vanilla Latte",
    yieldPortions: "1",
    wastePct: "3",
    targetFoodCostPct: "18",
    sellingPrice: "5.50",
    ingredients: [
      { id: "1", name: "Espresso Beans", purchaseCost: "22.00", purchaseQty: "1", purchaseUnit: "kg", recipeQty: "18", recipeUnit: "g" },
      { id: "2", name: "Whole Milk", purchaseCost: "3.80", purchaseQty: "1", purchaseUnit: "gal", recipeQty: "10", recipeUnit: "fl oz" },
      { id: "3", name: "Vanilla Syrup", purchaseCost: "14.00", purchaseQty: "750", purchaseUnit: "ml", recipeQty: "30", recipeUnit: "ml" },
      { id: "4", name: "Cup, Lid & Straw", purchaseCost: "35.00", purchaseQty: "100", purchaseUnit: "each", recipeQty: "1", recipeUnit: "each" }
    ]
  }
];
const FAQS = [
  {
    q: "What is a good food cost percentage for a restaurant?",
    a: "It varies by segment, but a commonly cited general benchmark is roughly 28–35% of the menu price. Quick-service and fast-casual concepts often target the lower end (around 25–30%), fine dining sometimes runs higher (30–38%), and bar/beverage programs typically run much lower (15–24%) since pour costs are cheap relative to drink prices. These are general guidance, not fixed rules — your target should reflect labor cost, rent and concept."
  },
  {
    q: "How do I price a menu item?",
    a: "Cost out the recipe by summing every ingredient's cost contribution, optionally add a waste/spoilage allowance, divide by the number of portions the recipe yields to get cost per portion, then divide that by your target food-cost percentage. Formula: suggested price = cost per portion ÷ (target food-cost % ÷ 100). Example: a $3.00 cost-per-portion dish at a 30% target food cost prices at 3.00 ÷ 0.30 = $10.00."
  },
  {
    q: "What is a waste/spoilage allowance and why does it matter?",
    a: "It's a percentage added on top of raw ingredient cost to account for real kitchen losses — trim waste, spillage, over-portioning and spoilage — that never make it into a plated portion. A typical allowance is 5–10%. Ignoring it understates true recipe cost and results in menu prices that undershoot your actual target food-cost percentage once real-world waste is accounted for."
  },
  {
    q: "How are food cost percentage and gross margin related?",
    a: "They are complementary and always add to 100% of the menu price: food-cost % + gross margin % = 100%. A dish with a 30% food cost has a 70% gross margin. See the Profit Margin & Markup Calculator for the same relationship applied to general retail pricing."
  },
  {
    q: "Does this tool handle unit conversion between purchase size and recipe usage?",
    a: 'Yes — enter the recipe quantity in whatever unit fits your prep sheet (e.g. grams) and the purchase cost in whatever unit you buy it in (e.g. per kilogram); the tool converts automatically. It supports weight (g, kg, oz, lb) and volume (ml, L, fl oz, gal) conversions, including across metric and imperial, plus a plain "each" unit for counted items. Cross-dimension conversions, like grams to fluid ounces, are flagged rather than guessed.'
  },
  {
    q: "Is this calculator free?",
    a: "Yes. Every calculation — unit conversion, cost per portion, waste allowance, target food-cost % pricing, and the multi-recipe summary with CSV export — runs entirely in your browser. No signup, no email required."
  }
];
function FoodCostCalculator({ toolGroups = [] }) {
  const [currency, setCurrency] = useState("USD");
  const sym = CURRENCIES[currency] || currency;
  const [recipeName, setRecipeName] = useState("Neapolitan Margherita Pizza");
  const [yieldPortions, setYieldPortions] = useState("2");
  const [wastePct, setWastePct] = useState("5");
  const [targetFoodCostPct, setTargetFoodCostPct] = useState("28");
  const [sellingPrice, setSellingPrice] = useState("14.50");
  const [ingredients, setIngredients] = useState(DEFAULT_INGREDIENTS);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const parsedIngredients = useMemo(() => {
    return ingredients.map((item) => {
      const { cost, mismatch } = computeIngredientCost(item);
      return {
        ...item,
        lineCost: cost,
        unitMismatch: mismatch
      };
    });
  }, [ingredients]);
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
  const actualFoodCostPct = actualPriceVal > 0 ? costPerPortion / actualPriceVal * 100 : 0;
  const grossProfitPerPortion = Math.max(0, actualPriceVal - costPerPortion);
  const grossMarginPct = actualPriceVal > 0 ? grossProfitPerPortion / actualPriceVal * 100 : 0;
  const hasDimensionMismatch = parsedIngredients.some((item) => item.unitMismatch);
  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        purchaseCost: "0.00",
        purchaseQty: "1",
        purchaseUnit: "kg",
        recipeQty: "100",
        recipeUnit: "g"
      }
    ]);
  };
  const updateIngredient = (id, field, val) => {
    setIngredients(
      (prev) => prev.map((item) => item.id === id ? { ...item, [field]: val } : item)
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
      costPerPortion,
      suggestedPrice: suggestedPricePerPortion,
      sellingPrice: actualPriceVal,
      actualFoodCostPct,
      grossProfit: grossProfitPerPortion
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
      costPerPortion,
      suggestedPrice: suggestedPricePerPortion,
      sellingPrice: actualPriceVal,
      actualFoodCostPct,
      grossProfit: grossProfitPerPortion
    }];
    let csv = "Recipe Name,Portions Yield,Batch Cost,Cost Per Portion,Suggested Price (" + targetFoodCostPct + "% FC),Actual Selling Price,Actual Food Cost %,Gross Profit / Portion\n";
    listToExport.forEach((r) => {
      csv += `"${r.name.replace(/"/g, '""')}",${r.portions},${r.batchCost.toFixed(2)},${r.costPerPortion.toFixed(2)},${r.suggestedPrice.toFixed(2)},${r.sellingPrice.toFixed(2)},${r.actualFoodCostPct.toFixed(1)}%,${r.grossProfit.toFixed(2)}
`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `recipe_costing_summary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return /* @__PURE__ */ jsx(
    ToolShell,
    {
      title: "Free Recipe Costing Calculator (Food Cost %) | VenQore",
      metaDescription: "Cost a recipe ingredient by ingredient with automatic unit conversion, get cost per portion, a suggested menu price for your target food-cost %, and the food-cost % of any price. Free, no signup.",
      eyebrow: "Calculators",
      h1: "Recipe Costing Calculator",
      answer: "Add each ingredient with its recipe quantity and purchase cost, and the calculator converts units automatically (grams to kilograms, ounces to pounds, fluid ounces to liters) to compute exact cost contribution. Total your recipe, apply a waste buffer allowance, calculate cost per portion, and solve for a suggested menu price based on your target food cost percentage.",
      faqs: FAQS,
      cta: {
        headline: "Automate recipe costing and menu profit margins live at POS checkout.",
        subtext: "VenQore auto-deducts ingredient stock (composite recipes) on every sale and generates real-time Food Cost & Margin reports across all your store locations."
      },
      related: [
        { name: "Margin Calculator", href: "/tools/margin-calculator" },
        { name: "Inventory Health Toolkit", href: "/tools/inventory-health" },
        { name: "POS ROI Calculator", href: "/tools/pos-roi-calculator" },
        { name: "Payment Fee Calculator", href: "/tools/payment-fee-calculator" }
      ],
      toolGroups,
      currentSlug: "food-cost-calculator",
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 shadow-sm space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900/10 dark:border-white/10 pb-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1", children: "Quick Start Presets" }),
              /* @__PURE__ */ jsxs("h2", { className: "text-lg font-black text-slate-900 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ChefHat, { className: "text-indigo-500", size: 20 }),
                "Sample Menu Recipes"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: PRESETS.map((p) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => loadPreset(p),
                className: "px-3 py-1.5 rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.06] hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors",
                children: p.name
              },
              p.name
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5", children: "Recipe / Dish Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: recipeName,
                  onChange: (e) => setRecipeName(e.target.value),
                  className: "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500",
                  placeholder: "e.g. Chicken Alfredo"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5", children: "Display Currency" }),
              /* @__PURE__ */ jsx(
                Select,
                {
                  value: currency,
                  onChange: setCurrency,
                  options: Object.keys(CURRENCIES).map((c) => ({
                    value: c,
                    label: `${c} (${CURRENCIES[c]})`
                  }))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5", children: "Recipe Yield (Portions)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "1",
                  step: "1",
                  value: yieldPortions,
                  onChange: (e) => setYieldPortions(e.target.value),
                  className: "w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5", children: "Waste / Spoilage Buffer %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "0",
                    max: "50",
                    step: "0.5",
                    value: wastePct,
                    onChange: (e) => setWastePct(e.target.value),
                    className: "w-full px-3.5 py-2.5 pr-8 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-2.5 text-xs text-slate-400 font-bold", children: "%" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 shadow-sm space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-900 dark:text-white", children: "Recipe Ingredients & Unit Costs" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Enter your bulk purchasing cost and the exact amount used in the recipe." })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addIngredient,
                className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  " Add Ingredient"
                ]
              }
            )
          ] }),
          hasDimensionMismatch && /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("strong", { children: "Unit Dimension Mismatch detected:" }),
              " Cannot convert directly between Weight, Volume, or Count units without density info (e.g. grams vs fluid oz). Please choose matching dimensions for Purchase & Recipe units."
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-3 overflow-x-auto", children: parsedIngredients.map((item, idx) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `p-4 rounded-2xl border transition-all ${item.unitMismatch ? "bg-amber-500/[0.04] border-amber-500/30" : "bg-slate-900/[0.02] dark:bg-white/[0.02] border-slate-900/10 dark:border-white/10"} flex flex-col lg:flex-row lg:items-center gap-3 min-w-[700px]`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-[160px]", children: [
                  /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: [
                    "Ingredient #",
                    idx + 1,
                    " Name"
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: item.name,
                      onChange: (e) => updateIngredient(item.id, "name", e.target.value),
                      placeholder: "e.g. Flour",
                      className: "w-full px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[210px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "w-24", children: [
                    /* @__PURE__ */ jsxs("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: [
                      "Pur. Cost (",
                      sym,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0",
                        step: "0.01",
                        value: item.purchaseCost,
                        onChange: (e) => updateIngredient(item.id, "purchaseCost", e.target.value),
                        className: "w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold mt-4", children: "/" }),
                  /* @__PURE__ */ jsxs("div", { className: "w-16", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: "Pur. Qty" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0.01",
                        step: "any",
                        value: item.purchaseQty,
                        onChange: (e) => updateIngredient(item.id, "purchaseQty", e.target.value),
                        className: "w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "w-28", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: "Pur. Unit" }),
                    /* @__PURE__ */ jsx(
                      Select,
                      {
                        value: item.purchaseUnit,
                        onChange: (val) => updateIngredient(item.id, "purchaseUnit", val),
                        options: UNIT_OPTIONS
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "hidden lg:block text-slate-400 mt-4 shrink-0" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-[190px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "w-20", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: "Recipe Qty" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        min: "0",
                        step: "any",
                        value: item.recipeQty,
                        onChange: (e) => updateIngredient(item.id, "recipeQty", e.target.value),
                        className: "w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "w-28", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: "Recipe Unit" }),
                    /* @__PURE__ */ jsx(
                      Select,
                      {
                        value: item.recipeUnit,
                        onChange: (val) => updateIngredient(item.id, "recipeUnit", val),
                        options: UNIT_OPTIONS
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "min-w-[100px] text-right lg:ml-auto", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase text-slate-400 mb-1", children: "Cost Share" }),
                  /* @__PURE__ */ jsx("span", { className: `text-sm font-black ${item.unitMismatch ? "text-amber-500" : "text-slate-900 dark:text-white"}`, children: item.unitMismatch ? "Invalid Unit" : formatMoney(item.lineCost, sym) })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeIngredient(item.id),
                    disabled: ingredients.length <= 1,
                    className: "p-2 rounded-lg text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors mt-2 lg:mt-0 shrink-0",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                  }
                )
              ]
            },
            item.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-slate-400", children: "Recipe Cost Structure" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-white block", children: formatMoney(costPerPortion, sym) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-300 font-semibold block mt-1", children: [
                  "Cost Per Portion (",
                  yieldPortions,
                  " portion",
                  num(yieldPortions) === 1 ? "" : "s",
                  ")"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-white/10 space-y-2 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-300", children: [
                /* @__PURE__ */ jsx("span", { children: "Raw Ingredients Total:" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-white", children: formatMoney(rawBatchCost, sym) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-300", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Waste Allowance (",
                  wastePct,
                  "%):"
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-emerald-400", children: [
                  "+",
                  formatMoney(totalBatchCostWithWaste - rawBatchCost, sym)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-300 font-bold", children: [
                /* @__PURE__ */ jsx("span", { children: "Total Batch Cost:" }),
                /* @__PURE__ */ jsx("span", { className: "text-white", children: formatMoney(totalBatchCostWithWaste, sym) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 shadow-sm flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400", children: "Target Pricing Solver" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-slate-900 dark:text-white block", children: formatMoney(suggestedPricePerPortion, sym) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1", children: "Suggested Price / Portion" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-slate-900/10 dark:border-white/10", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5", children: "Target Food Cost %" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "5",
                    max: "90",
                    step: "1",
                    value: targetFoodCostPct,
                    onChange: (e) => setTargetFoodCostPct(e.target.value),
                    className: "w-full px-3 py-2 pr-8 rounded-xl bg-slate-900/[0.02] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "absolute right-3 top-2 text-xs text-slate-400 font-bold", children: "%" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 mt-2", children: "Standard restaurant benchmark: 28% - 35%." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 shadow-sm flex flex-col justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400", children: "Menu Margin Analysis" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-emerald-600 dark:text-emerald-400 block", children: formatMoney(grossProfitPerPortion, sym) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400 font-medium block mt-1", children: [
                  "Gross Profit per Portion (",
                  round2(grossMarginPct),
                  "% Margin)"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-slate-900/10 dark:border-white/10 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1", children: [
                  "Actual / Planned Selling Price (",
                  sym,
                  ")"
                ] }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    min: "0",
                    step: "0.25",
                    value: sellingPrice,
                    onChange: (e) => setSellingPrice(e.target.value),
                    className: "w-full px-3 py-2 rounded-xl bg-slate-900/[0.02] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/10 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs pt-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "Actual Food Cost:" }),
                /* @__PURE__ */ jsxs("span", { className: `font-black ${actualFoodCostPct > 35 ? "text-amber-500" : "text-emerald-500"}`, children: [
                  round2(actualFoodCostPct),
                  "%"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-3xl bg-white dark:bg-white/[0.03] border border-slate-900/10 dark:border-white/10 shadow-sm space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-base font-black text-slate-900 dark:text-white flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Layers, { size: 18, className: "text-indigo-500" }),
                "Multi-Recipe Menu Summary"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: "Save current calculation to compile a full menu cost breakdown and export as CSV." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: saveCurrentRecipeToSummary,
                  className: "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all shadow-md",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    ' Add "',
                    recipeName,
                    '" to Summary'
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: exportCsv,
                  className: "flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-bold transition-all",
                  children: [
                    /* @__PURE__ */ jsx(Download, { size: 14 }),
                    " Export CSV"
                  ]
                }
              )
            ] })
          ] }),
          savedRecipes.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-8 text-center rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-dashed border-slate-900/10 dark:border-white/10", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "mx-auto text-slate-400 mb-2", size: 24 }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-400", children: "No saved recipes in summary yet." }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 mt-1", children: 'Click "Add to Summary" above to save multiple menu items side-by-side.' })
          ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-900/10 dark:border-white/10 text-slate-400 font-black uppercase text-[10px]", children: [
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Recipe" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Yield" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Batch Cost" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Cost/Portion" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Target Price" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Actual Price" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Food Cost %" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Profit / Portion" }),
              /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Action" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-900/5 dark:divide-white/5", children: savedRecipes.map((r) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02]", children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-bold text-slate-900 dark:text-white", children: r.name }),
              /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 text-slate-600 dark:text-slate-300", children: [
                r.portions,
                " ptn"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-slate-600 dark:text-slate-300", children: formatMoney(r.batchCost, sym) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-bold text-slate-900 dark:text-white", children: formatMoney(r.costPerPortion, sym) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-indigo-600 dark:text-indigo-400 font-semibold", children: formatMoney(r.suggestedPrice, sym) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-bold text-slate-900 dark:text-white", children: formatMoney(r.sellingPrice, sym) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsxs("span", { className: `font-bold ${r.actualFoodCostPct > 35 ? "text-amber-500" : "text-emerald-500"}`, children: [
                round2(r.actualFoodCostPct),
                "%"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400", children: formatMoney(r.grossProfit, sym) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 px-3 text-right", children: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => removeSavedRecipe(r.id),
                  className: "p-1 text-slate-400 hover:text-red-500 transition-colors",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                }
              ) })
            ] }, r.id)) })
          ] }) })
        ] })
      ] })
    }
  );
}
export {
  FoodCostCalculator as default
};
