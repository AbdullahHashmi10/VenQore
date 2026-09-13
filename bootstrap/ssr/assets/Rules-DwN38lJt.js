import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { Beaker, Plus, Package, CheckCircle, XCircle, Trash2, ArrowRight, Save } from "lucide-react";
import axios from "axios";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
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
const ManufacturingRules = () => {
  const { store } = usePage().props;
  const tt = useTermText();
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulatingRule, setSimulatingRule] = useState(null);
  const [simulationParams, setSimulationParams] = useState({
    warehouse_id: "",
    planned_qty: 1
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [newRule, setNewRule] = useState({
    product_id: "",
    name: "",
    description: "",
    ingredients: []
  });
  const loadRules = async () => {
    try {
      const response = await axios.get("/api/manufacturing-rules");
      setRules(response.data || []);
    } catch (error) {
      console.error("Error loading rules:", error);
    }
  };
  const loadProducts = async () => {
    try {
      const response = await axios.get(route("store.inventory.search", {
        store_slug: store.slug
      }), { params: { query: "" } });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };
  const loadWarehouses = async () => {
    try {
      const response = await axios.get("/api/warehouses");
      setWarehouses(response.data || []);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };
  useEffect(() => {
    loadRules();
    loadProducts();
    loadWarehouses();
  }, []);
  const runSimulation = async () => {
    setLoadingSimulation(true);
    try {
      const response = await axios.post(`/api/manufacturing-rules/${simulatingRule.id}/simulate`, simulationParams);
      setSimulationResult(response.data);
    } catch (error) {
      alert("❌ Simulation failed: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingSimulation(false);
    }
  };
  const addIngredient = () => {
    setNewRule((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredient_product_id: "", quantity_per_unit: 0, unit: "g" }]
    }));
  };
  const removeIngredient = (index) => {
    setNewRule((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };
  const updateIngredient = (index, field, value) => {
    setNewRule((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map(
        (ing, i) => i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };
  const saveRule = async () => {
    try {
      const payload = {
        ...newRule,
        is_active: true
      };
      await axios.post("/api/manufacturing-rules", payload);
      alert("✅ Manufacturing rule created!");
      setShowCreateModal(false);
      setNewRule({ product_id: "", name: "", description: "", ingredients: [] });
      loadRules();
    } catch (error) {
      alert("❌ Failed: " + (error.response?.data?.message || error.message));
    }
  };
  const toggleRule = async (ruleId, currentStatus) => {
    try {
      await axios.patch(`/api/manufacturing-rules/${ruleId}`, { is_active: !currentStatus });
      loadRules();
    } catch (error) {
      alert("Failed to toggle rule");
    }
  };
  const deleteRule = async (ruleId) => {
    if (!confirm("Delete this manufacturing rule?")) return;
    try {
      await axios.delete(`/api/manufacturing-rules/${ruleId}`);
      loadRules();
      alert("✅ Rule deleted");
    } catch (error) {
      alert("Failed to delete rule");
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Manufacturing Rules", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Auto-Manufacturing" }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-ink flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Beaker, { className: "text-brand-500", size: 32 }),
            "Auto-Manufacturing Rules"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-1", children: tt("Define composite products & ingredient auto-deduction") })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              " Create Rule"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: rules.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-12 text-center border border-line", children: [
        /* @__PURE__ */ jsx(Beaker, { size: 64, className: "mx-auto text-neutral-300 mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink-secondary mb-2", children: "No Manufacturing Rules Yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-muted mb-4", children: "Create your first rule to enable auto-deduction of ingredients" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold",
            children: "Create First Rule"
          }
        )
      ] }) : rules.map((rule) => /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsx(Package, { className: "text-brand-500", size: 24 }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink", children: rule.name }),
              rule.is_active ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded", children: "ACTIVE" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-sunken text-ink-secondary text-xs font-bold rounded", children: "INACTIVE" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted ml-9", children: rule.description || "No description" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setSimulatingRule(rule);
                  setSimulationParams({ warehouse_id: warehouses[0]?.id || "", planned_qty: 1 });
                  setSimulationResult(null);
                  setShowSimulateModal(true);
                },
                className: "px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 dark:hover:bg-brand-950/40 text-xs font-bold rounded-lg text-brand-700 dark:text-brand-400 flex items-center gap-1.5 transition-colors border border-brand-100/50 dark:border-brand-900/50",
                children: [
                  /* @__PURE__ */ jsx(Beaker, { size: 14, className: "animate-pulse text-brand-500" }),
                  " Simulate Feasibility"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => toggleRule(rule.id, rule.is_active),
                className: `p-2 rounded-lg ${rule.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-ink-muted hover:bg-interactive-hover"}`,
                children: rule.is_active ? /* @__PURE__ */ jsx(CheckCircle, { size: 20 }) : /* @__PURE__ */ jsx(XCircle, { size: 20 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteRule(rule.id),
                className: "p-2 text-red-500 hover:bg-red-50 rounded-lg",
                children: /* @__PURE__ */ jsx(Trash2, { size: 20 })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "ml-9 mt-4 space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Ingredients:" }),
          rule.ingredients && rule.ingredients.map((ing, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "w-16 text-right font-bold text-brand-600", children: [
              ing.quantity_per_unit,
              ing.unit
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-ink-muted" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-secondary", children: ing.ingredient_name || `${tt("Product")} #${ing.ingredient_product_id}` })
          ] }, i))
        ] })
      ] }, rule.id)) }),
      showCreateModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-ink", children: "Create Manufacturing Rule" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-1", children: tt("Define a composite product and its ingredients") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: [
              tt("Finished Product"),
              " *"
            ] }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: newRule.product_id,
                onChange: (e) => setNewRule({ ...newRule, product_id: e.target.value }),
                className: "w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: tt("Select product...") }),
                  products.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Rule Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newRule.name,
                onChange: (e) => setNewRule({ ...newRule, name: e.target.value }),
                placeholder: "e.g., Garam Masala Production",
                className: "w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: newRule.description,
                onChange: (e) => setNewRule({ ...newRule, description: e.target.value }),
                placeholder: "Optional description...",
                rows: "2",
                className: "w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary", children: "Ingredients *" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: addIngredient,
                  className: "px-3 py-1 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-lg text-sm font-bold flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    " Add"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: newRule.ingredients.map((ing, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-center p-3 bg-app rounded-lg", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-6", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  value: ing.ingredient_product_id,
                  onChange: (e) => updateIngredient(i, "ingredient_product_id", e.target.value),
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select ingredient..." }),
                    products.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "col-span-3", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  step: "0.01",
                  value: ing.quantity_per_unit,
                  onChange: (e) => updateIngredient(i, "quantity_per_unit", parseFloat(e.target.value) || 0),
                  placeholder: "Qty",
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface"
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  value: ing.unit,
                  onChange: (e) => updateIngredient(i, "unit", e.target.value),
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-line dark:border-line bg-surface",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "g", children: "g" }),
                    /* @__PURE__ */ jsx("option", { value: "kg", children: "kg" }),
                    /* @__PURE__ */ jsx("option", { value: "ml", children: "ml" }),
                    /* @__PURE__ */ jsx("option", { value: "l", children: "l" }),
                    /* @__PURE__ */ jsx("option", { value: "pcs", children: "pcs" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "col-span-1", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => removeIngredient(i),
                  className: "p-2 text-red-500 hover:bg-red-50 rounded-lg",
                  children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                }
              ) })
            ] }, i)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-line flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowCreateModal(false);
                setNewRule({ product_id: "", name: "", description: "", ingredients: [] });
              },
              className: "px-4 py-2 bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover text-ink rounded-lg font-bold",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: saveRule,
              disabled: !newRule.product_id || !newRule.name || newRule.ingredients.length === 0,
              className: "px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-sunken disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 18 }),
                " Save Rule"
              ]
            }
          )
        ] })
      ] }) }),
      showSimulateModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-drawer p-4 animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-ink", children: "Production Feasibility Simulator" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted mt-1", children: [
              "Simulate manufacturing of ",
              /* @__PURE__ */ jsx("strong", { children: simulatingRule?.name })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowSimulateModal(false), className: "text-ink-muted hover:text-ink text-xl font-bold", children: "×" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Simulated Production Qty" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0.0001",
                  step: "any",
                  value: simulationParams.planned_qty,
                  onChange: (e) => setSimulationParams({ ...simulationParams, planned_qty: parseFloat(e.target.value) || 1 }),
                  className: "w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500 text-ink"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Target Warehouse" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: simulationParams.warehouse_id,
                  onChange: (e) => setSimulationParams({ ...simulationParams, warehouse_id: e.target.value }),
                  className: "w-full px-4 py-2 rounded-lg border border-line dark:border-line bg-surface outline-none focus:ring-2 ring-brand-500 text-ink",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select target warehouse..." }),
                    warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, children: w.name }, w.id))
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: runSimulation,
              disabled: loadingSimulation || !simulationParams.warehouse_id,
              className: "w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 text-sm",
              children: loadingSimulation ? "Running Simulation..." : "Simulate Run"
            }
          ),
          simulationResult && /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4 border-t border-line", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-xl border font-bold text-sm bg-app border-line", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-ink", children: [
                "Status: ",
                simulationResult.feasible ? /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400 font-bold ml-1", children: "✅ FEASIBLE — Enough stock available" }) : /* @__PURE__ */ jsx("span", { className: "text-rose-600 dark:text-rose-400 font-bold ml-1", children: "❌ INFEASIBLE — Insufficient ingredient stock" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right text-ink dark:text-ink", children: [
                "Est. Cost: ",
                /* @__PURE__ */ jsx("span", { className: "text-brand-600 dark:text-brand-400 font-bold", children: formatCurrency(simulationResult.total_estimated_cost, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-hidden border border-line rounded-xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase tracking-wider font-bold", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "p-3", children: "Ingredient" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Required" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Available" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Shortage" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 text-right", children: "Est. Cost" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 text-center", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line font-medium", children: simulationResult.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover text-ink-secondary", children: [
                /* @__PURE__ */ jsxs("td", { className: "p-3 font-bold text-ink", children: [
                  item.ingredient_name,
                  /* @__PURE__ */ jsxs("div", { className: "text-ink-muted text-2xs font-semibold", children: [
                    "SKU: ",
                    item.sku
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "p-3 text-right font-bold", children: [
                  item.required_qty,
                  " ",
                  item.unit
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "p-3 text-right", children: [
                  item.available_qty,
                  " ",
                  item.unit
                ] }),
                /* @__PURE__ */ jsx("td", { className: `p-3 text-right font-bold ${item.missing_qty > 0 ? "text-rose-600" : "text-ink-muted"}`, children: item.missing_qty > 0 ? `${item.missing_qty} ${item.unit}` : "0" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-ink font-bold", children: formatCurrency(item.estimated_cost, store) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold", children: item.missing_qty > 0 ? /* @__PURE__ */ jsx("span", { className: "text-rose-600 dark:text-rose-400 text-2xs uppercase bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded", children: "Short" }) : /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400 text-2xs uppercase bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded", children: "OK" }) })
              ] }, idx)) })
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-line flex justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowSimulateModal(false),
            className: "px-6 py-2 bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover text-ink-secondary dark:text-white rounded-lg font-bold",
            children: "Close"
          }
        ) })
      ] }) })
    ] })
  ] });
};
export {
  ManufacturingRules as default
};
