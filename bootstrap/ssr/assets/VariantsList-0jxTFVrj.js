import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ArrowLeft, Plus, Edit, Trash2, X, Save } from "lucide-react";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
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
function VariantsIndex({ product, variants, globalAttributes = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
    sku: "",
    price: "",
    stock_quantity: "",
    attributes: [{ name: "", value: "" }]
    // UI helper
  });
  const openModal = (variant = null) => {
    if (variant) {
      setEditingVariant(variant);
      const attrs = Object.entries(variant.attributes).map(([name, value]) => ({ name, value }));
      setData({
        sku: variant.sku || "",
        price: variant.price || "",
        stock_quantity: variant.stock_quantity || "",
        attributes: attrs
      });
    } else {
      setEditingVariant(null);
      reset();
      setData("attributes", [{ name: "", value: "" }]);
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };
  const handleAttributeChange = (index, field, value) => {
    const newAttributes = [...data.attributes];
    newAttributes[index][field] = value;
    setData("attributes", newAttributes);
  };
  const addAttribute = () => {
    setData("attributes", [...data.attributes, { name: "", value: "" }]);
  };
  const removeAttribute = (index) => {
    const newAttributes = data.attributes.filter((_, i) => i !== index);
    setData("attributes", newAttributes);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const attributesObj = data.attributes.reduce((acc, curr) => {
      if (curr.name && curr.value) acc[curr.name] = curr.value;
      return acc;
    }, {});
    const payload = {
      ...data,
      attributes: attributesObj
    };
    if (editingVariant) {
      put(route("store.variants.update", { store_slug: store?.slug, variant: editingVariant.id }), {
        data: payload,
        onSuccess: closeModal
      });
    } else {
      post(route("store.products.variants.store", { store_slug: store?.slug, product: product.id }), {
        data: payload,
        onSuccess: closeModal
      });
    }
  };
  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      destroy(route("store.variants.destroy", { store_slug: store?.slug, variant: id }));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Variants: ${product.name}`, activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: `Variants - ${product.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: route("store.inventory.index", { store_slug: store?.slug }),
          className: "flex items-center gap-2 text-ink-muted hover:text-brand-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }),
            " ",
            tt("Back to Products")
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => openModal(),
          className: "flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 transition-all shadow-md hover:shadow-lg",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 20 }),
            " Add Variant"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-2xl shadow-sm border border-line overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app text-ink-muted text-xs uppercase tracking-wider", children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Attributes" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "SKU" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Price Override" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Stock" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: variants.length > 0 ? variants.map((variant) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(variant.attributes).map(([key, value]) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded text-xs font-medium border border-brand-100 dark:border-brand-800", children: [
          key,
          ": ",
          value
        ] }, key)) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-ink-secondary font-medium", children: variant.sku || "-" }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-ink-secondary", children: variant.price ? `$${variant.price}` : /* @__PURE__ */ jsx("span", { className: "text-ink-muted italic", children: "Default" }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-ink-secondary", children: variant.stock_quantity }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => openModal(variant),
              className: "p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors",
              children: /* @__PURE__ */ jsx(Edit, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDelete(variant.id),
              className: "p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
            }
          )
        ] }) })
      ] }, variant.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-8 text-center text-ink-muted", children: "No variants found. Create one to get started." }) }) })
    ] }) }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-normal", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-line flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink", children: editingVariant ? "Edit Variant" : "Add Variant" }),
        /* @__PURE__ */ jsx("button", { onClick: closeModal, className: "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary", children: "Attributes" }),
          data.attributes.map((attr, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                list: `attr-list-${index}`,
                placeholder: "Name (e.g. Size)",
                value: attr.name,
                onChange: (e) => handleAttributeChange(index, "name", e.target.value),
                className: "flex-1 px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
                required: true
              }
            ),
            /* @__PURE__ */ jsx("datalist", { id: `attr-list-${index}`, children: globalAttributes.map((ga) => /* @__PURE__ */ jsx("option", { value: ga.name }, ga.id)) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Value (e.g. XL)",
                value: attr.value,
                onChange: (e) => handleAttributeChange(index, "value", e.target.value),
                className: "flex-1 px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
                required: true
              }
            ),
            data.attributes.length > 1 && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeAttribute(index),
                className: "p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg",
                children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
              }
            )
          ] }, index)),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: addAttribute,
              className: "text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Add Attribute"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "SKU (Optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.sku,
                onChange: (e) => setData("sku", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            ),
            errors.sku && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.sku })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Stock Quantity" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: data.stock_quantity,
                onChange: (e) => setData("stock_quantity", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-ink-secondary mb-1", children: "Price Override (Optional)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: data.price,
              onChange: (e) => setData("price", e.target.value),
              className: "w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none",
              placeholder: `Default: $${product.price}`
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-4 flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: closeModal,
              className: "px-4 py-2 text-ink-secondary hover:bg-interactive-hover rounded-xl transition-colors text-sm font-medium",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg ",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 16 }),
                processing ? "Saving..." : "Save Variant"
              ]
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  VariantsIndex as default
};
