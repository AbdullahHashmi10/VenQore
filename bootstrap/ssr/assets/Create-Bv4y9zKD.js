import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { ArrowLeft, ClipboardList, Calendar, Plus, Trash2, Save } from "lucide-react";
import Swal from "sweetalert2";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-C-Y4x1DU.js";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "use-debounce";
import "./SmartCombobox-D6m7UWTk.js";
import "./format-B_ph0Qec.js";
function Create({ warehouses, products, stocks }) {
  const { store } = usePage().props;
  const { data, setData, post, processing, errors } = useForm({
    warehouse_id: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    status: "draft",
    notes: "",
    items: [
      { product_id: "", counted_quantity: 0 }
    ]
  });
  const getExpectedStock = (warehouseId, productId) => {
    if (!warehouseId || !productId || !stocks[warehouseId]) return 0;
    const stockRecord = stocks[warehouseId].find((s) => s.product_id == productId);
    return stockRecord ? Number(stockRecord.quantity) : 0;
  };
  const addItem = () => {
    setData("items", [...data.items, { product_id: "", counted_quantity: 0 }]);
  };
  const removeItem = (index) => {
    if (data.items.length === 1) return;
    const newItems = [...data.items];
    newItems.splice(index, 1);
    setData("items", newItems);
  };
  const updateItem = (index, field, value) => {
    const newItems = [...data.items];
    newItems[index][field] = value;
    setData("items", newItems);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.stock-takes.store", { store_slug: store.slug }), {
      onSuccess: () => {
        Swal.fire({
          title: "Success!",
          text: "Stock Audit saved successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "New Stock Audit", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "New Stock Audit" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.stock-takes.index", { store_slug: store.slug }),
            className: "p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: "New Stock Audit" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Verify and adjust inventory levels" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-indigo-500" }),
            " Audit Details"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Warehouse" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500",
                  value: data.warehouse_id,
                  onChange: (e) => setData("warehouse_id", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", className: "text-slate-800 dark:text-slate-100", children: "Select Warehouse..." }),
                    warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, className: "text-slate-800 dark:text-slate-100", children: w.name }, w.id))
                  ]
                }
              ),
              errors.warehouse_id && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.warehouse_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Audit Date" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    className: "w-full pl-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500",
                    value: data.date,
                    onChange: (e) => setData("date", e.target.value)
                  }
                )
              ] }),
              errors.date && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.date })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Status" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500",
                  value: data.status,
                  onChange: (e) => setData("status", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "draft", className: "text-slate-800 dark:text-slate-100", children: "Draft (Save & Continue later)" }),
                    /* @__PURE__ */ jsx("option", { value: "completed", className: "text-slate-800 dark:text-slate-100", children: "Completed (Adjust Stock)" })
                  ]
                }
              ),
              errors.status && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.status })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Notes / Remarks" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500 min-h-[60px]",
                placeholder: "Any additional details...",
                value: data.notes,
                onChange: (e) => setData("notes", e.target.value)
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-indigo-500" }),
              " Counted Items"
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: addItem,
                className: "flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Add Item"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 rounded-l-xl", children: "Product" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Expected" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right w-32", children: "Counted" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Difference" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 rounded-r-xl" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-50 dark:divide-slate-700", children: data.items.map((item, index) => {
              const expected = getExpectedStock(data.warehouse_id, item.product_id);
              const diff = (item.counted_quantity || 0) - expected;
              const diffColor = diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-500" : "text-red-500";
              return /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                  AsyncProductCombobox,
                  {
                    value: item.product_id,
                    onSelect: (p) => updateItem(index, "product_id", p ? p.id : ""),
                    defaultOptions: products,
                    placeholder: "Search product...",
                    className: "min-w-[200px]"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-medium text-slate-500", children: data.warehouse_id && item.product_id ? expected : "-" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "0.01",
                    className: "w-full text-sm text-right rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-indigo-500",
                    value: item.counted_quantity,
                    onChange: (e) => updateItem(index, "counted_quantity", e.target.value)
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: `px-4 py-3 text-right font-bold ${diffColor}`, children: data.warehouse_id && item.product_id ? diff > 0 ? `+${diff}` : diff : "-" }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => removeItem(index),
                    className: "p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                    disabled: data.items.length === 1,
                    children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                  }
                ) })
              ] }, index);
            }) })
          ] }) }),
          errors.items && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-2", children: errors.items })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-4 pt-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.stock-takes.index", { store_slug: store.slug }),
              className: "px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:hover:scale-100",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 18 }),
                processing ? "Processing..." : "Save Audit"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
export {
  Create as default
};
