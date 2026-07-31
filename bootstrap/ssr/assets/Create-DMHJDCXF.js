import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { ArrowLeft, Truck, Calendar, Box, Plus, Trash2, Save } from "lucide-react";
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
function Create({ warehouses, products }) {
  const { store } = usePage().props;
  const { data, setData, post, processing, errors } = useForm({
    from_warehouse_id: "",
    to_warehouse_id: "",
    transfer_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    status: "pending",
    notes: "",
    items: [
      { product_id: "", quantity: 1 }
    ]
  });
  const addItem = () => {
    setData("items", [...data.items, { product_id: "", quantity: 1 }]);
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
    post(route("store.stock-transfers.store", { store_slug: store.slug }), {
      onSuccess: () => {
        window.dispatchEvent(new CustomEvent("amd:product-updated"));
        localStorage.setItem("amd_product_latest_change", Date.now().toString());
        Swal.fire({
          title: "Success!",
          text: "Stock transfer created successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "New Stock Transfer", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "New Stock Transfer" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.stock-transfers.index", { store_slug: store.slug }),
            className: "p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: "New Stock Transfer" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Move inventory between warehouses" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Truck, { size: 20, className: "text-indigo-500" }),
            " Transfer Details"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "From Warehouse" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500",
                  value: data.from_warehouse_id,
                  onChange: (e) => setData("from_warehouse_id", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select Source..." }),
                    warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, disabled: w.id == data.to_warehouse_id, children: w.name }, w.id))
                  ]
                }
              ),
              errors.from_warehouse_id && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.from_warehouse_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "To Warehouse" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500",
                  value: data.to_warehouse_id,
                  onChange: (e) => setData("to_warehouse_id", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Select Destination..." }),
                    warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, disabled: w.id == data.from_warehouse_id, children: w.name }, w.id))
                  ]
                }
              ),
              errors.to_warehouse_id && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.to_warehouse_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Transfer Date" }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    className: "w-full pl-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500",
                    value: data.transfer_date,
                    onChange: (e) => setData("transfer_date", e.target.value)
                  }
                )
              ] }),
              errors.transfer_date && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs", children: errors.transfer_date })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-semibold text-slate-600 dark:text-slate-300", children: "Status" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500",
                  value: data.status,
                  onChange: (e) => setData("status", e.target.value),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
                    /* @__PURE__ */ jsx("option", { value: "in_progress", children: "In Progress" }),
                    /* @__PURE__ */ jsx("option", { value: "completed", children: "Completed (Move Stock Now)" })
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
                className: "w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-indigo-500 min-h-[80px]",
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
              /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }),
              " Items to Transfer"
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
          /* @__PURE__ */ jsx("div", { className: "space-y-3", children: data.items.map((item, index) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-start p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 group", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 ml-1", children: "Product" }),
              /* @__PURE__ */ jsx(
                AsyncProductCombobox,
                {
                  value: item.product_id,
                  onSelect: (p) => updateItem(index, "product_id", p ? p.id : ""),
                  defaultOptions: products,
                  placeholder: "Search product..."
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "w-32 space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 ml-1", children: "Quantity" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "1",
                  className: "w-full text-sm rounded-lg border-slate-200 dark:border-slate-700 focus:ring-indigo-500",
                  value: item.quantity,
                  onChange: (e) => updateItem(index, "quantity", e.target.value)
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-6", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => removeItem(index),
                className: "p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors",
                disabled: data.items.length === 1,
                children: /* @__PURE__ */ jsx(Trash2, { size: 18 })
              }
            ) })
          ] }, index)) }),
          errors.items && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-2", children: errors.items })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-4 pt-4", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.stock-transfers.index", { store_slug: store.slug }),
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
                processing ? "Processing..." : "Create Transfer"
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
