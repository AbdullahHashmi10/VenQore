import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { Beaker, Plus, Package, CheckCircle, XCircle, Trash2, ArrowRight, Save } from "lucide-react";
import axios from "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
const ManufacturingRules = () => {
  const { store } = usePage().props;
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
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
  useEffect(() => {
    loadRules();
    loadProducts();
  }, []);
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
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Beaker, { className: "text-purple-500", size: 32 }),
            "Auto-Manufacturing Rules"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Define composite products & ingredient auto-deduction" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              " Create Rule"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: rules.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx(Beaker, { size: 64, className: "mx-auto text-slate-300 mb-4" }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-600 dark:text-slate-300 mb-2", children: "No Manufacturing Rules Yet" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 mb-4", children: "Create your first rule to enable auto-deduction of ingredients" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowCreateModal(true),
            className: "px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold",
            children: "Create First Rule"
          }
        )
      ] }) : rules.map((rule) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
              /* @__PURE__ */ jsx(Package, { className: "text-indigo-500", size: 24 }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-800 dark:text-white", children: rule.name }),
              rule.is_active ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded", children: "ACTIVE" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded", children: "INACTIVE" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 ml-9", children: rule.description || "No description" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => toggleRule(rule.id, rule.is_active),
                className: `p-2 rounded-lg ${rule.is_active ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`,
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
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Ingredients:" }),
          rule.ingredients && rule.ingredients.map((ing, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "w-16 text-right font-bold text-purple-600", children: [
              ing.quantity_per_unit,
              ing.unit
            ] }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-slate-400" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-700 dark:text-slate-300", children: ing.ingredient_name || `Product #${ing.ingredient_product_id}` })
          ] }, i))
        ] })
      ] }, rule.id)) }),
      showCreateModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-200 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: "Create Manufacturing Rule" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Define a composite product and its ingredients" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2", children: "Finished Product *" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: newRule.product_id,
                onChange: (e) => setNewRule({ ...newRule, product_id: e.target.value }),
                className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select product..." }),
                  products.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2", children: "Rule Name *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newRule.name,
                onChange: (e) => setNewRule({ ...newRule, name: e.target.value }),
                placeholder: "e.g., Garam Masala Production",
                className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2", children: "Description" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: newRule.description,
                onChange: (e) => setNewRule({ ...newRule, description: e.target.value }),
                placeholder: "Optional description...",
                rows: "2",
                className: "w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-600 dark:text-slate-300", children: "Ingredients *" }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: addIngredient,
                  className: "px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 14 }),
                    " Add"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: newRule.ingredients.map((ing, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-6", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  value: ing.ingredient_product_id,
                  onChange: (e) => updateIngredient(i, "ingredient_product_id", e.target.value),
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800",
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
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                }
              ) }),
              /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsxs(
                "select",
                {
                  value: ing.unit,
                  onChange: (e) => updateIngredient(i, "unit", e.target.value),
                  className: "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800",
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
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowCreateModal(false);
                setNewRule({ product_id: "", name: "", description: "", ingredients: [] });
              },
              className: "px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-bold",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: saveRule,
              disabled: !newRule.product_id || !newRule.name || newRule.ingredients.length === 0,
              className: "px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 18 }),
                " Save Rule"
              ]
            }
          )
        ] })
      ] }) })
    ] })
  ] });
};
export {
  ManufacturingRules as default
};
