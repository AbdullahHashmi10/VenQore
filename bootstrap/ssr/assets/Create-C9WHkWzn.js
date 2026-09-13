import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { g as getCurrencySymbol } from "./format-131Nyq79.js";
import { usePage, useForm, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { BookOpen, Settings, Eye, EyeOff, Save, Package, Clock, Zap, Flame, Scale, Plus, Trash2, AlertTriangle, Calculator, DollarSign } from "lucide-react";
import "react-dom";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
import { P as ProductModal } from "./ProductModal-DTGv60aX.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "@headlessui/react";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./PremiumButton-BUDyjGi2.js";
import "./PremiumSelect-BaeCSgsA.js";
const UNIT_FAMILIES = {
  weight: ["g", "kg", "mg", "gram", "grams", "kilogram", "kilograms"],
  volume: ["ml", "l", "liter", "liters", "litre", "litres", "milliliter"],
  pieces: ["pcs", "piece", "pieces", "unit", "units", "box", "pack", "packet"]
};
const getUnitFamily = (unit) => {
  const lowerUnit = (unit || "pcs").toLowerCase();
  for (const [family, units] of Object.entries(UNIT_FAMILIES)) {
    if (units.includes(lowerUnit)) return family;
  }
  return "other";
};
const formatQuantity = (qty, unit) => {
  const lowerUnit = (unit || "pcs").toLowerCase();
  const numQty = parseFloat(qty) || 0;
  if (lowerUnit === "kg" || lowerUnit === "kilogram" || lowerUnit === "kilograms") {
    if (numQty < 1) return `${(numQty * 1e3).toFixed(0)}g`;
    return `${numQty}kg`;
  }
  if (lowerUnit === "g" || lowerUnit === "gram" || lowerUnit === "grams") {
    if (numQty >= 1e3) return `${(numQty / 1e3).toFixed(2)}kg`;
    return `${numQty}g`;
  }
  if (lowerUnit === "l" || lowerUnit === "liter" || lowerUnit === "liters" || lowerUnit === "litre" || lowerUnit === "litres") {
    if (numQty < 1) return `${(numQty * 1e3).toFixed(0)}ml`;
    return `${numQty}L`;
  }
  if (lowerUnit === "ml" || lowerUnit === "milliliter") {
    if (numQty >= 1e3) return `${(numQty / 1e3).toFixed(2)}L`;
    return `${numQty}ml`;
  }
  return `${numQty} ${unit}`;
};
function CookbookCreate({ products = [], recipe = null, warehouses = [], categories = [], attributes = [] }) {
  const tt = useTermText();
  const {
    store
  } = usePage().props;
  const [localProducts, setLocalProducts] = useState(products);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pendingIngredientIndex, setPendingIngredientIndex] = useState(null);
  const mergeProduct = (newProduct) => {
    setLocalProducts((prev) => {
      if (prev.find((p) => p.id === newProduct.id)) return prev;
      return [...prev, newProduct];
    });
  };
  const [viewOptions, setViewOptions] = useState({
    showPrepTime: true,
    showInstructions: true,
    showLabor: true,
    showUtilities: true,
    showTraining: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const toggleView = (key) => setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  const { data, setData, post, put, processing, errors } = useForm({
    name: recipe?.name || "",
    description: recipe?.description || "",
    product_id: recipe?.product_id || "",
    yield_quantity: recipe?.yield_quantity || 1,
    labor_cost: recipe?.labor_cost || 0,
    overhead_cost: recipe?.overhead_cost || 0,
    prep_time_minutes: recipe?.prep_time_minutes || 0,
    ingredients: recipe?.ingredients || [
      { product_id: "", quantity: 1, unit: "pcs", wastage_percent: 0 }
    ],
    media: recipe?.media || []
  });
  const [desiredMargin, setDesiredMargin] = useState(20);
  const getProduct = (id) => localProducts.find((p) => p.id == id);
  const calculations = useMemo(() => {
    let totalIngredientCost = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    const ingredientDetails = [];
    const unitFamilies = /* @__PURE__ */ new Set();
    data.ingredients.forEach((ing, idx) => {
      if (ing.product_id) {
        const product = getProduct(ing.product_id);
        if (product) {
          const grossQty = parseFloat(ing.quantity) || 0;
          const wastagePercent2 = parseFloat(ing.wastage_percent) || 0;
          const netQty = grossQty * (1 - wastagePercent2 / 100);
          const costPerUnit2 = parseFloat(product.cost_price) || 0;
          const ingredientCost = grossQty * costPerUnit2;
          totalIngredientCost += ingredientCost;
          const family = getUnitFamily(product.base_unit);
          unitFamilies.add(family);
          if (family === "weight") {
            let gramsGross = grossQty;
            let gramsNet = netQty;
            if (product.base_unit.toLowerCase() === "kg") {
              gramsGross = grossQty * 1e3;
              gramsNet = netQty * 1e3;
            }
            totalGrossWeight += gramsGross;
            totalNetWeight += gramsNet;
          }
          ingredientDetails.push({
            name: product.name,
            grossQty,
            netQty,
            wastagePercent: wastagePercent2,
            wastageLoss: grossQty - netQty,
            unit: product.base_unit,
            costPerUnit: costPerUnit2,
            totalCost: ingredientCost,
            formattedGross: formatQuantity(grossQty, product.base_unit),
            formattedNet: formatQuantity(netQty, product.base_unit),
            family
          });
        }
      }
    });
    const laborCost = parseFloat(data.labor_cost) || 0;
    const overheadCost = parseFloat(data.overhead_cost) || 0;
    const totalCOGM = totalIngredientCost + laborCost + overheadCost;
    const isSameFamily = unitFamilies.size <= 1;
    const primaryFamily = unitFamilies.size === 1 ? [...unitFamilies][0] : null;
    let yieldSummaryGross = "";
    let yieldSummaryNet = "";
    if (primaryFamily === "weight") {
      yieldSummaryGross = formatQuantity(totalGrossWeight, "g");
      yieldSummaryNet = formatQuantity(totalNetWeight, "g");
    } else if (isSameFamily && primaryFamily && primaryFamily !== "other") {
      const totalQty = ingredientDetails.reduce((sum, i) => sum + i.grossQty, 0);
      const totalNetQty = ingredientDetails.reduce((sum, i) => sum + i.netQty, 0);
      const firstUnit = ingredientDetails[0]?.unit || "pcs";
      yieldSummaryGross = formatQuantity(totalQty, firstUnit);
      yieldSummaryNet = formatQuantity(totalNetQty, firstUnit);
    } else {
      const byFamily = {};
      ingredientDetails.forEach((i) => {
        if (!byFamily[i.family]) byFamily[i.family] = { gross: 0, net: 0, unit: i.unit };
        byFamily[i.family].gross += i.grossQty;
        byFamily[i.family].net += i.netQty;
      });
      const partsGross = [];
      const partsNet = [];
      Object.entries(byFamily).forEach(([family, data2]) => {
        partsGross.push(formatQuantity(data2.gross, data2.unit));
        partsNet.push(formatQuantity(data2.net, data2.unit));
      });
      yieldSummaryGross = partsGross.join(" + ");
      yieldSummaryNet = partsNet.join(" + ");
    }
    const totalWastageLoss = ingredientDetails.reduce((sum, i) => sum + i.wastageLoss, 0);
    const wastagePercent = totalGrossWeight > 0 ? ((totalGrossWeight - totalNetWeight) / totalGrossWeight * 100).toFixed(1) : 0;
    const suggestedPrice = totalCOGM * (1 + desiredMargin / 100);
    const yieldQty = parseFloat(data.yield_quantity) || 1;
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
  const selectedProduct = useMemo(() => {
    return getProduct(data.product_id);
  }, [data.product_id, localProducts]);
  const addIngredient = () => {
    setData("ingredients", [
      ...data.ingredients,
      { product_id: "", quantity: 1, unit: "pcs", wastage_percent: 0 }
    ]);
  };
  const removeIngredient = (index) => {
    const newIngredients = [...data.ingredients];
    newIngredients.splice(index, 1);
    setData("ingredients", newIngredients);
  };
  const updateIngredient = (index, field, value) => {
    const newIngredients = [...data.ingredients];
    newIngredients[index][field] = value;
    if (field === "product_id" && value) {
      const product = getProduct(value);
      if (product) {
        newIngredients[index].unit = product.base_unit || "pcs";
      }
    }
    setData("ingredients", newIngredients);
  };
  const handleProductCreated = (newProduct) => {
    mergeProduct(newProduct);
    console.log("New Product Created:", newProduct);
    if (pendingIngredientIndex === "output") {
      setData("product_id", newProduct.id);
    } else if (pendingIngredientIndex !== null) {
      updateIngredient(pendingIngredientIndex, "product_id", newProduct.id);
    }
    setIsProductModalOpen(false);
    setPendingIngredientIndex(null);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (recipe) {
      put(route("store.cookbook.update", recipe.id));
    } else {
      post(route("store.cookbook.store", { store_slug: store.slug }));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: recipe ? "Edit Recipe" : "Create Recipe", children: [
    /* @__PURE__ */ jsx(Head, { title: recipe ? "Edit Recipe" : "Create Recipe" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 w-full px-4 pb-4 overflow-hidden", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: recipe ? "Edit Recipe" : "Create Recipe",
          subtitle: recipe ? `Editing ${recipe.name}` : "Define a recipe with wastage tracking & full cost analysis",
          icon: BookOpen,
          breadcrumbs: [
            { label: "Cookbook", href: route("store.cookbook.index", { store_slug: store.slug }) },
            { label: recipe ? "Edit" : "Create" }
          ],
          actions: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSettings(!showSettings),
                  className: `p-2.5 rounded-[14px] border transition-all ${showSettings ? "bg-brand-50 border-brand-200 text-brand-600" : "bg-white border-line text-ink-muted hover:text-brand-600"}`,
                  children: /* @__PURE__ */ jsx(Settings, { size: 18 })
                }
              ),
              showSettings && /* @__PURE__ */ jsxs("div", { className: "absolute top-full right-0 mt-2 w-56 bg-surface rounded-[14px] shadow-xl border border-line z-50 p-2 animate-in fade-in zoom-in-95 duration-fast origin-top-right", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink-muted px-2 py-1 uppercase tracking-wider mb-1", children: "View Options" }),
                [
                  { key: "showPrepTime", label: "Prep Time" },
                  { key: "showInstructions", label: "Instructions" },
                  { key: "showLabor", label: "Labor Cost" },
                  { key: "showUtilities", label: "Utilities Cost" },
                  { key: "showTraining", label: "Training SOPs" }
                ].map((opt) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => toggleView(opt.key),
                    className: "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary transition-colors",
                    children: [
                      /* @__PURE__ */ jsx("span", { children: opt.label }),
                      viewOptions[opt.key] ? /* @__PURE__ */ jsx(Eye, { size: 14, className: "text-brand-500" }) : /* @__PURE__ */ jsx(EyeOff, { size: 14, className: "text-ink-muted" })
                    ]
                  },
                  opt.key
                ))
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleSubmit,
                disabled: processing,
                className: "flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx(Save, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: "Save Recipe" })
                ]
              }
            )
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-6 h-full overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-3 space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold text-ink mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Package, { size: 18, className: "text-brand-500" }),
              "Recipe Details"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wide", children: "Recipe Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: data.name,
                    onChange: (e) => setData("name", e.target.value),
                    className: "w-full px-3 py-2.5 rounded-xl border border-line bg-app focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-medium",
                    placeholder: "e.g., Garam Masala Mix"
                  }
                ),
                errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: errors.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wide", children: tt("Output Product") }),
                /* @__PURE__ */ jsx(
                  AsyncProductCombobox,
                  {
                    selectedItem: localProducts.find((p) => p.id == data.product_id),
                    onSelect: (item) => {
                      if (item) {
                        mergeProduct(item);
                        setData("product_id", item.id);
                      } else {
                        setData("product_id", "");
                      }
                    },
                    onCreateNew: () => {
                      setPendingIngredientIndex("output");
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    },
                    onEdit: (item) => {
                      setEditingProduct(item);
                      setIsProductModalOpen(true);
                    },
                    placeholder: tt("Search Output Product..."),
                    inputClassName: "py-2.5 text-sm"
                  }
                ),
                errors.product_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: errors.product_id })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wide", children: "Yield Qty" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: data.yield_quantity,
                        onChange: (e) => setData("yield_quantity", e.target.value),
                        className: "w-full px-3 py-2.5 rounded-xl border border-line bg-app focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-bold text-center",
                        min: "0.01",
                        step: "0.01"
                      }
                    ),
                    selectedProduct && /* @__PURE__ */ jsx("span", { className: "absolute right-8 top-1/2 -translate-y-1/2 text-2xs text-ink-muted font-medium pointer-events-none", children: selectedProduct.base_unit })
                  ] })
                ] }),
                viewOptions.showPrepTime && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wide", children: "Prep (Min)" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: data.prep_time_minutes,
                        onChange: (e) => setData("prep_time_minutes", e.target.value),
                        className: "w-full px-3 py-2.5 rounded-xl border border-line bg-app focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-bold text-center pl-8",
                        min: "0",
                        placeholder: "0"
                      }
                    ),
                    /* @__PURE__ */ jsx(Clock, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" })
                  ] })
                ] })
              ] }),
              viewOptions.showInstructions && /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-ink-muted uppercase tracking-wide", children: "Instructions" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: data.description,
                    onChange: (e) => setData("description", e.target.value),
                    className: "w-full px-3 py-2.5 rounded-xl border border-line bg-app focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none text-sm",
                    rows: 4,
                    placeholder: "Brief steps..."
                  }
                )
              ] })
            ] })
          ] }),
          (viewOptions.showLabor || viewOptions.showUtilities) && /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-200 dark:border-brand-800 p-5 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold text-ink mb-3 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Zap, { size: 18, className: "text-brand-500" }),
              "Overhead Costs"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              viewOptions.showLabor && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-ink-secondary flex items-center justify-between", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 14 }),
                  " Labor Cost"
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs font-bold", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: data.labor_cost,
                      onChange: (e) => setData("labor_cost", e.target.value),
                      className: "w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-brand-200 dark:border-brand-700 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none text-right",
                      min: "0"
                    }
                  )
                ] })
              ] }),
              viewOptions.showUtilities && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-medium text-ink-secondary flex items-center justify-between", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Flame, { size: 14 }),
                  " Utilities"
                ] }) }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs font-bold", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: data.overhead_cost,
                      onChange: (e) => setData("overhead_cost", e.target.value),
                      className: "w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-brand-200 dark:border-brand-700 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none text-right",
                      min: "0"
                    }
                  )
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-6 h-full overflow-hidden flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm flex flex-col h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex items-center justify-between shrink-0", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Scale, { size: 20, className: "text-emerald-500" }),
              "Ingredients List Ingredients List"
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addIngredient,
                className: "flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  "Add Item"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-2 px-4 py-3 bg-app text-2xs font-bold text-ink-muted uppercase tracking-wider border-b border-line shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1 pl-1", children: "Item" }),
            /* @__PURE__ */ jsx("div", { className: "w-16 text-center", children: "Gross" }),
            /* @__PURE__ */ jsx("div", { className: "w-14 text-center", children: "Waste %" }),
            /* @__PURE__ */ jsx("div", { className: "w-14 text-right pr-1", children: "Net" }),
            /* @__PURE__ */ jsx("div", { className: "w-20 text-right pr-2", children: "Cost" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar", children: data.ingredients.map((ingredient, index) => {
            const product = getProduct(ingredient.product_id);
            const detail = calculations.ingredientDetails.find((i) => i.name === product?.name);
            return /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-2 p-2 bg-surface rounded-xl border border-line hover:border-brand-300 hover:shadow-sm transition-all group", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-full lg:flex-1 relative", children: [
                /* @__PURE__ */ jsx(
                  AsyncProductCombobox,
                  {
                    selectedItem: localProducts.find((p) => p.id == ingredient.product_id),
                    onSelect: (item) => {
                      if (item) {
                        mergeProduct(item);
                        updateIngredient(index, "product_id", item.id);
                      } else {
                        updateIngredient(index, "product_id", "");
                      }
                    },
                    onCreateNew: () => {
                      setPendingIngredientIndex(index);
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    },
                    onEdit: (item) => {
                      setEditingProduct(item);
                      setIsProductModalOpen(true);
                    },
                    placeholder: "Search Ingredient...",
                    inputClassName: "py-1.5 text-sm bg-surface pr-24",
                    className: "w-full"
                  }
                ),
                product && /* @__PURE__ */ jsxs("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs bg-sunken px-1.5 rounded text-ink-muted font-medium", children: product.base_unit }),
                  /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted font-bold", children: [
                    getCurrencySymbol(),
                    " ",
                    parseFloat(product.cost_price).toLocaleString()
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-auto grid grid-cols-4 lg:flex lg:items-center gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 lg:w-16", children: [
                  /* @__PURE__ */ jsx("label", { className: "lg:hidden text-2xs text-ink-muted font-bold uppercase mb-1 block", children: "Gross" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: ingredient.quantity,
                      onChange: (e) => updateIngredient(index, "quantity", e.target.value),
                      className: "w-full px-2 py-2 rounded-lg border border-line bg-app text-sm text-center font-bold focus:ring-2 focus:ring-brand-500 outline-none",
                      min: "0.01",
                      step: "0.01"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 lg:w-14 px-0.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "lg:hidden text-2xs text-ink-muted font-bold uppercase mb-1 block", children: "Waste" }),
                  /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: ingredient.wastage_percent,
                      onChange: (e) => updateIngredient(index, "wastage_percent", e.target.value),
                      className: "w-full px-1 py-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 text-sm text-center text-amber-700 font-bold focus:ring-2 focus:ring-amber-500 outline-none",
                      min: "0",
                      max: "100"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 lg:w-14 text-right flex flex-col justify-center pr-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "lg:hidden text-2xs text-ink-muted font-bold uppercase mb-1 block", children: "Net" }),
                  /* @__PURE__ */ jsx("div", { className: "flex flex-col items-end justify-center w-full", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1 py-1 rounded-md min-w-[50px] text-center", children: detail ? detail.formattedNet : "-" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 lg:w-20 flex items-center justify-end gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink-secondary dark:text-ink text-right w-full", children: detail ? Math.round(detail.totalCost).toLocaleString() : "0" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeIngredient(index),
                      className: "p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                    }
                  )
                ] })
              ] })
            ] }, index);
          }) }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-line bg-app shrink-0", children: parseFloat(calculations.wastagePercent) > 15 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-600 text-xs justify-center", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
            /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
              "High Wastage (",
              calculations.wastagePercent,
              "%)."
            ] }),
            /* @__PURE__ */ jsx("span", { children: "Check ingredient quality." })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-2xs text-ink-muted px-2", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "Total Items: ",
              data.ingredients.length
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Gross Weight: ",
              calculations.yieldSummaryGross
            ] })
          ] }) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-3 space-y-4 h-full overflow-y-auto pl-1 custom-scrollbar", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-brand rounded-2xl p-6 text-white shadow-xl sticky top-0", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calculator, { size: 20 }),
              "Cost of Goods Manufactured"
            ] }),
            calculations.ingredientDetails.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-brand-200", children: "Gross Input:" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: calculations.yieldSummaryGross })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-300", children: "Net Output:" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-emerald-300", children: calculations.yieldSummaryNet })
              ] }),
              parseFloat(calculations.wastagePercent) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-amber-300", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Wastage:" }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm font-medium", children: [
                  calculations.wastagePercent,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-brand-100", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Ingredients:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  getCurrencySymbol(),
                  " ",
                  calculations.totalIngredientCost.toLocaleString()
                ] })
              ] }),
              calculations.laborCost > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-brand-100", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Labor:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  getCurrencySymbol(),
                  " ",
                  calculations.laborCost.toLocaleString()
                ] })
              ] }),
              calculations.overheadCost > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-brand-100", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: "Overhead:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                  getCurrencySymbol(),
                  " ",
                  calculations.overheadCost.toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-t border-white/20 pt-2 mt-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Total COGM:" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xl font-bold", children: [
                    getCurrencySymbol(),
                    " ",
                    calculations.totalCOGM.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-brand-200 mt-1", children: [
                  "Cost per unit: ",
                  getCurrencySymbol(),
                  " ",
                  calculations.costPerUnit.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm text-brand-200 mb-2 block", children: "Desired Profit Margin" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: desiredMargin,
                    onChange: (e) => setDesiredMargin(parseFloat(e.target.value) || 0),
                    className: "flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-brand-200 focus:ring-2 focus:ring-white/50 outline-none text-center font-bold",
                    min: "0",
                    step: "1"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: "%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-brand-200 mb-1 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                "Suggested Selling Price"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold", children: [
                getCurrencySymbol(),
                " ",
                calculations.suggestedPrice.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-brand-200 mt-1", children: [
                "Profit: ",
                getCurrencySymbol(),
                " ",
                (calculations.suggestedPrice - calculations.totalCOGM).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
              ] })
            ] }),
            selectedProduct && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-white/10 rounded-xl", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-brand-200", children: tt("Current Product Price") }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold", children: [
                  getCurrencySymbol(),
                  " ",
                  parseFloat(selectedProduct.price).toLocaleString()
                ] }),
                parseFloat(selectedProduct.price) < calculations.suggestedPrice && /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 bg-red-500/30 text-red-200 rounded-full", children: "Underpriced!" }),
                parseFloat(selectedProduct.price) >= calculations.suggestedPrice && /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 bg-emerald-500/30 text-emerald-200 rounded-full", children: "Good margin" })
              ] })
            ] })
          ] }),
          viewOptions.showTraining && /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-4 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold flex items-center gap-2 dark:text-white", children: [
                /* @__PURE__ */ jsx(BookOpen, { size: 16, className: "text-blue-500" }),
                "Training SOPs"
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setData("media", [...data.media || [], { type: "youtube", url: "", title: "" }]),
                  className: "p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100",
                  children: /* @__PURE__ */ jsx(Plus, { size: 14 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 overflow-y-auto max-h-48 pr-1 custom-scrollbar", children: [
              (data.media || []).length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-4 border-2 border-dashed border-line rounded-xl", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "No media attached" }) }),
              (data.media || []).map((item, index) => /* @__PURE__ */ jsxs("div", { className: "p-2 bg-app rounded-lg text-xs space-y-1 group relative", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    placeholder: "Title e.g. How-to Video",
                    value: item.title,
                    onChange: (e) => {
                      const newMedia = [...data.media];
                      newMedia[index].title = e.target.value;
                      setData("media", newMedia);
                    },
                    className: "w-full bg-transparent border-none p-0 text-xs font-bold focus:ring-0 placeholder-slate-400"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    placeholder: "URL...",
                    value: item.url,
                    onChange: (e) => {
                      const newMedia = [...data.media];
                      newMedia[index].url = e.target.value;
                      setData("media", newMedia);
                    },
                    className: "w-full bg-transparent border-none p-0 text-2xs text-blue-500 focus:ring-0 placeholder-slate-300"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      const newMedia = [...data.media];
                      newMedia.splice(index, 1);
                      setData("media", newMedia);
                    },
                    className: "absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                  }
                )
              ] }, index))
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      ProductModal,
      {
        isOpen: isProductModalOpen,
        onClose: () => setIsProductModalOpen(false),
        mode: "create",
        warehouses,
        categories,
        attributes,
        onSubmit: (formData, onError) => {
          axios.post(route("store.inventory.store", {
            store_slug: store.slug
          }), formData, {
            headers: { "Content-Type": "multipart/form-data" }
          }).then((res) => {
            if (res.data && res.data.product) {
              handleProductCreated(res.data.product);
            } else {
              setIsProductModalOpen(false);
            }
          }).catch((error) => {
            console.error(error);
            if (onError) onError(error.response?.data?.errors);
          });
        }
      }
    )
  ] });
}
export {
  CookbookCreate as default
};
