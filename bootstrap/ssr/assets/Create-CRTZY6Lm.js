import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { a as FormField, b as FormInput, c as FormSelect, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import { Factory, Package } from "lucide-react";
import axios from "axios";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-ulkv479L.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
import "use-debounce";
import "./SmartCombobox-D_cdCy9L.js";
import "./format-B_ph0Qec.js";
function CreateProductionRun({ products = [], recipes = [], warehouses = [] }) {
  const { store } = usePage().props;
  const [loading, setLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    product_name: "",
    quantity: 1,
    warehouse_id: "",
    recipe_id: "",
    notes: ""
  });
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [errors, setErrors] = useState({});
  products.filter(
    (p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );
  const selectProduct = (product) => {
    setFormData({
      ...formData,
      product_id: product.id,
      product_name: product.name
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
    const recipe = recipes.find((r) => r.product_id === product.id);
    if (recipe) {
      setFormData((prev) => ({ ...prev, recipe_id: recipe.id }));
      setSelectedRecipe(recipe);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.production.store", { store_slug: store?.slug }), formData);
      window.dispatchEvent(new CustomEvent("amd:product-updated"));
      localStorage.setItem("amd_product_latest_change", Date.now().toString());
      router.visit(route("store.production.index", { store_slug: store?.slug }));
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "New Production Run", children: [
    /* @__PURE__ */ jsx(Head, { title: "New Production Run" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 overflow-auto", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "New Production Run",
          subtitle: "Create a new manufacturing batch",
          icon: Factory,
          breadcrumbs: [
            { label: "Inventory" },
            { label: "Production", href: route("store.production.index", { store_slug: store?.slug }) },
            { label: "New Run" }
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 relative z-10", children: [
            /* @__PURE__ */ jsx(FormField, { label: "Product to Manufacture", required: true, error: errors.product_id?.[0], children: /* @__PURE__ */ jsx(
              AsyncProductCombobox,
              {
                selectedItem: products.find((p) => p.id === formData.product_id),
                onSelect: (product) => {
                  if (product) {
                    selectProduct(product);
                  } else {
                    setFormData({ ...formData, product_id: "", product_name: "" });
                    setProductSearch("");
                  }
                },
                placeholder: "Search product..."
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsx(FormField, { label: "Quantity to Produce", required: true, error: errors.quantity?.[0], children: /* @__PURE__ */ jsx(
                FormInput,
                {
                  type: "number",
                  min: "1",
                  value: formData.quantity,
                  onChange: (e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              ) }),
              /* @__PURE__ */ jsx(FormField, { label: "Output Warehouse", required: true, error: errors.warehouse_id?.[0], children: /* @__PURE__ */ jsxs(
                FormSelect,
                {
                  value: formData.warehouse_id,
                  onChange: (e) => setFormData({ ...formData, warehouse_id: e.target.value }),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select warehouse" }),
                    warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, children: w.name }, w.id))
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx(FormField, { label: "Recipe/BOM", error: errors.recipe_id?.[0], children: /* @__PURE__ */ jsxs(
              FormSelect,
              {
                value: formData.recipe_id,
                onChange: (e) => {
                  const recipe = recipes.find((r) => r.id == e.target.value);
                  setFormData({ ...formData, recipe_id: e.target.value });
                  setSelectedRecipe(recipe);
                },
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "Select recipe (optional)" }),
                  recipes.filter((r) => !formData.product_id || r.product_id === formData.product_id).map((r) => /* @__PURE__ */ jsx("option", { value: r.id, children: r.name }, r.id))
                ]
              }
            ) }),
            /* @__PURE__ */ jsx(FormField, { label: "Production Notes", children: /* @__PURE__ */ jsx(
              FormTextarea,
              {
                value: formData.notes,
                onChange: (e) => setFormData({ ...formData, notes: e.target.value }),
                placeholder: "Any notes about this production run...",
                rows: 3
              }
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800", children: [
              /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => router.visit(route("store.production.index", { store_slug: store?.slug })), children: "Cancel" }),
              /* @__PURE__ */ jsx(PrimaryButton, { type: "submit", loading, children: "Start Production" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Package, { size: 18 }),
            "Recipe Ingredients"
          ] }),
          selectedRecipe ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            selectedRecipe.ingredients?.map((ing, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-800 dark:text-white", children: ing.product?.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: ing.product?.sku })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-indigo-600", children: ing.quantity * formData.quantity }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "needed" })
              ] })
            ] }, idx)),
            selectedRecipe.ingredients?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "No ingredients defined" })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-slate-400", children: [
            /* @__PURE__ */ jsx(Package, { size: 32, className: "mx-auto mb-2 opacity-50" }),
            /* @__PURE__ */ jsx("p", { children: "Select a recipe to see ingredients" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  CreateProductionRun as default
};
