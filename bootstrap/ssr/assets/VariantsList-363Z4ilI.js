import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { ArrowLeft, Plus, Edit, Trash2, X, Save } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function VariantsIndex({ product, variants, globalAttributes = [] }) {
  const { store } = usePage().props;
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
          className: "flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }),
            " Back to Products"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => openModal(),
          className: "flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg",
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 20 }),
            " Add Variant"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider", children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Attributes" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "SKU" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Price Override" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold", children: "Stock" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 font-semibold text-right", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: variants.length > 0 ? variants.map((variant) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "p-4", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: Object.entries(variant.attributes).map(([key, value]) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium border border-indigo-100 dark:border-indigo-800", children: [
          key,
          ": ",
          value
        ] }, key)) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-700 dark:text-slate-300 font-medium", children: variant.sku || "-" }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-700 dark:text-slate-300", children: variant.price ? `$${variant.price}` : /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic", children: "Default" }) }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-slate-700 dark:text-slate-300", children: variant.stock_quantity }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => openModal(variant),
              className: "p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors",
              children: /* @__PURE__ */ jsx(Edit, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDelete(variant.id),
              className: "p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
            }
          )
        ] }) })
      ] }, variant.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "p-8 text-center text-slate-400", children: "No variants found. Create one to get started." }) }) })
    ] }) }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: editingVariant ? "Edit Variant" : "Add Variant" }),
        /* @__PURE__ */ jsx("button", { onClick: closeModal, className: "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300", children: "Attributes" }),
          data.attributes.map((attr, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                list: `attr-list-${index}`,
                placeholder: "Name (e.g. Size)",
                value: attr.name,
                onChange: (e) => handleAttributeChange(index, "name", e.target.value),
                className: "flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
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
                className: "flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
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
              className: "text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Add Attribute"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "SKU (Optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.sku,
                onChange: (e) => setData("sku", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
              }
            ),
            errors.sku && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.sku })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Stock Quantity" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: data.stock_quantity,
                onChange: (e) => setData("stock_quantity", e.target.value),
                className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1", children: "Price Override (Optional)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: data.price,
              onChange: (e) => setData("price", e.target.value),
              className: "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
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
              className: "px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm font-medium",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30",
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
