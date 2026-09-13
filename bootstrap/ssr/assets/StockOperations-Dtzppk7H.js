import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, useForm } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PremiumButton } from "./PremiumButton-BUDyjGi2.js";
import { S as StockModuleTabs } from "./StockModuleTabs-0gR4Jbnu.js";
import { Plus, Box, CheckSquare, AlertTriangle, XCircle, Trash2, RefreshCcw, Check } from "lucide-react";
import { P as PremiumSelect } from "./PremiumSelect-BaeCSgsA.js";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
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
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./format-131Nyq79.js";
function StockOperations({ products, warehouses, reasons }) {
  const {
    store
  } = usePage().props;
  const hasMultipleWarehouses = warehouses?.length > 1;
  const defaultWarehouse = warehouses?.length === 1 ? warehouses[0] : null;
  const params = new URLSearchParams(window.location.search);
  const urlTab = params.get("tab");
  const activeTab = urlTab === "warehouses" ? "warehouses" : "adjustments";
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Stock Operations", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Operations" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden bg-app relative", children: [
        activeTab === "warehouses" && /* @__PURE__ */ jsx(WarehouseManagement, { warehouses }),
        activeTab === "adjustments" && /* @__PURE__ */ jsx(StockAdjustments, { products, warehouses, defaultWarehouse, hasMultipleWarehouses, reasons })
      ] })
    ] })
  ] });
}
function WarehouseManagement({ warehouses }) {
  const { store } = usePage().props;
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: "",
    location: "",
    contact_person: "",
    phone: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWarehouse) {
      put(route("store.stock-operations.warehouse.update", { store_slug: store.slug, id: editingWarehouse.id }), {
        onSuccess: () => {
          reset();
          setEditingWarehouse(null);
          setIsAddingWarehouse(false);
        }
      });
    } else {
      post(route("store.stock-operations.warehouse.store", { store_slug: store.slug }), {
        onSuccess: () => {
          reset();
          setIsAddingWarehouse(false);
        }
      });
    }
  };
  const startEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setData({
      name: warehouse.name,
      location: warehouse.location || "",
      contact_person: warehouse.contact_person || "",
      phone: warehouse.phone || ""
    });
    setIsAddingWarehouse(true);
  };
  const cancelEdit = () => {
    setEditingWarehouse(null);
    setIsAddingWarehouse(false);
    reset();
  };
  return /* @__PURE__ */ jsxs("div", { className: "h-full overflow-y-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink", children: "Warehouse Management" }),
      !isAddingWarehouse && /* @__PURE__ */ jsxs(PremiumButton, { onClick: () => setIsAddingWarehouse(true), children: [
        /* @__PURE__ */ jsx(Plus, { size: 18 }),
        "Add Warehouse"
      ] })
    ] }),
    isAddingWarehouse ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line p-6 max-w-2xl", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-md font-bold text-ink mb-4", children: editingWarehouse ? "Edit Warehouse Details" : "Add New Warehouse" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Warehouse Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.name,
              onChange: (e) => setData("name", e.target.value),
              className: "w-full px-4 py-3 rounded-xl bg-surface border border-line focus:ring-2 ring-brand-500/20 outline-none",
              placeholder: "e.g. Main Store, Downtown Branch",
              required: true
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Location / Address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.location,
              onChange: (e) => setData("location", e.target.value),
              className: "w-full px-4 py-3 rounded-xl bg-surface border border-line focus:ring-2 ring-brand-500/20 outline-none",
              placeholder: "e.g. 123 Main St, New York",
              required: true
            }
          ),
          errors.location && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.location })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Contact Person (Optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.contact_person,
                onChange: (e) => setData("contact_person", e.target.value),
                className: "w-full px-4 py-3 rounded-xl bg-surface border border-line focus:ring-2 ring-brand-500/20 outline-none",
                placeholder: "Manager Name"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-ink-secondary mb-2", children: "Phone (Optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.phone,
                onChange: (e) => setData("phone", e.target.value),
                className: "w-full px-4 py-3 rounded-xl bg-surface border border-line focus:ring-2 ring-brand-500/20 outline-none",
                placeholder: "+1 234 567 890"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 mt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: cancelEdit,
              className: "px-4 py-2 text-ink-secondary font-medium hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(PremiumButton, { type: "submit", disabled: processing, children: editingWarehouse ? "Update Details" : "Create Warehouse" })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: !warehouses || warehouses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-app rounded-xl border-2 border-dashed border-line", children: [
      /* @__PURE__ */ jsx(Box, { size: 48, className: "mx-auto text-neutral-300 dark:text-ink-secondary mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "text-ink-muted font-medium", children: "No warehouses yet" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-1", children: 'Click "Add Warehouse" to create your first warehouse' })
    ] }) : warehouses.map((warehouse) => {
      const isInfoMissing = !warehouse.location || warehouse.location === "Main Location" || warehouse.location === "Default Location";
      return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-xl border border-line flex justify-between items-center group hover:border-brand-500/30 transition-colors", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink", children: warehouse.name }),
            isInfoMissing ? /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded text-2xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase tracking-wider", children: "Info Required" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded text-2xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider", children: "Active" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm text-ink-muted", children: [
            /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "📍" }),
              warehouse.location || "No location specified"
            ] }),
            warehouse.contact_person && /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "👤" }),
              warehouse.contact_person
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => startEdit(warehouse),
            className: "px-4 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors",
            children: isInfoMissing ? "Update Info" : "Edit"
          }
        )
      ] }, warehouse.id);
    }) })
  ] });
}
function StockAdjustments({ products, warehouses, reasons, defaultWarehouse, hasMultipleWarehouses }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const defaultReasons = reasons || ["Damaged", "Stolen", "Found", "Expired", "Lost", "Return", "Other"];
  const { data, setData, post, processing, errors, reset } = useForm({
    product_id: "",
    warehouse_id: defaultWarehouse?.id || "",
    adjustment_type: "add",
    quantity: 0,
    reason: "",
    notes: ""
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    post(route("store.stock-operations.adjust", { store_slug: store.slug }), {
      onSuccess: () => reset()
    });
  };
  const selectedProduct = products?.find((p) => p.id == data.product_id);
  const currentWarehouseId = data.warehouse_id || (hasMultipleWarehouses ? "" : defaultWarehouse?.id);
  const stockEntry = selectedProduct?.stocks?.find((s) => s.warehouse_id == currentWarehouseId);
  const currentStock = stockEntry?.quantity ? parseFloat(stockEntry.quantity) : 0;
  const newStock = data.adjustment_type === "add" ? currentStock + parseInt(data.quantity || 0) : Math.max(0, currentStock - parseInt(data.quantity || 0));
  const totalProducts = products?.length || 0;
  const totalStock = products?.reduce((sum, p) => {
    const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
    return sum + stock;
  }, 0) || 0;
  const lowStock = products?.filter((p) => {
    const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
    return stock > 0 && stock <= (p.min_stock || 5);
  }).length || 0;
  const outOfStock = products?.filter((p) => {
    const stock = p.stocks?.reduce((s, st) => s + parseFloat(st.quantity || 0), 0) || 0;
    return stock === 0;
  }).length || 0;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full p-2 gap-1 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(Box, { size: 16 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: tt("Products") })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: totalProducts })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Stock" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: totalStock.toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Low Stock" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: lowStock })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(XCircle, { size: 16 }) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Out of Stock" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-rose-600", children: outOfStock })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
          "Stock ",
          /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Adjustment" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setData("adjustment_type", "add"),
            className: `px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 ${data.adjustment_type === "add" ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-glow" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              " Add Stock"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setData("adjustment_type", "remove"),
            className: `px-3 py-1.5 text-xs font-bold uppercase rounded-full transition-all flex items-center gap-1.5 ${data.adjustment_type === "remove" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 14 }),
              " Remove Stock"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex gap-2 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col", children: /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "flex-1 flex flex-col", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line shadow-sm flex-1 flex flex-col", children: [
        /* @__PURE__ */ jsx("div", { className: "px-4 py-2 border-b border-line bg-app rounded-t-xl", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Adjustment Form" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4 flex-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: hasMultipleWarehouses ? "col-span-8" : "col-span-12", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: [
                tt("Select Product"),
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                AsyncProductCombobox,
                {
                  onSelect: (p) => p && setData("product_id", p.id),
                  placeholder: tt("Search products...")
                }
              ),
              errors.product_id && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.product_id })
            ] }),
            hasMultipleWarehouses && /* @__PURE__ */ jsxs("div", { className: "col-span-4", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: [
                "Warehouse ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                PremiumSelect,
                {
                  options: warehouses?.map((w) => ({ id: w.id, name: w.name })) || [],
                  value: data.warehouse_id,
                  onChange: (val) => setData("warehouse_id", val),
                  placeholder: "Select...",
                  searchable: false
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: [
                "Quantity ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: data.quantity,
                  onChange: (e) => setData("quantity", e.target.value),
                  min: "1",
                  className: "w-full px-3 py-2 rounded-lg bg-surface border border-line focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none text-lg font-bold text-center transition-all",
                  placeholder: "0",
                  required: true
                }
              ),
              errors.quantity && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.quantity })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-3", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: [
                "Reason ",
                /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
              ] }),
              /* @__PURE__ */ jsx(
                PremiumSelect,
                {
                  options: defaultReasons.map((r) => ({ id: r, name: r })),
                  value: data.reason,
                  onChange: (val) => setData("reason", val),
                  placeholder: "Select...",
                  searchable: false
                }
              ),
              errors.reason && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.reason })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-5", children: [
              /* @__PURE__ */ jsxs("label", { className: "block text-2xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: [
                "Notes ",
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted font-normal", children: "(optional)" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: data.notes,
                  onChange: (e) => setData("notes", e.target.value),
                  className: "w-full px-3 py-2 rounded-lg bg-surface border border-line focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none transition-all",
                  placeholder: "Additional details..."
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2 flex items-end", children: /* @__PURE__ */ jsx(PremiumButton, { type: "submit", disabled: processing, className: "w-full py-2", children: processing ? /* @__PURE__ */ jsx(RefreshCcw, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { size: 16 }),
              "Apply"
            ] }) }) })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx("div", { className: "w-64 flex-shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl border border-line shadow-sm h-full flex flex-col", children: [
        /* @__PURE__ */ jsx("div", { className: "px-3 py-2 border-b border-line bg-app rounded-t-xl", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Live Preview" }) }),
        /* @__PURE__ */ jsx("div", { className: "p-3 flex-1 flex flex-col", children: selectedProduct ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "p-2 bg-app rounded-lg mb-2", children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm truncate", children: selectedProduct.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted font-mono", children: [
              "SKU: ",
              selectedProduct.sku
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center mb-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase tracking-wider", children: "Current" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: currentStock })
            ] }),
            /* @__PURE__ */ jsx("div", { className: `text-center py-1 text-xl font-bold ${data.adjustment_type === "add" ? "text-green-500" : "text-red-500"}`, children: /* @__PURE__ */ jsxs("span", { children: [
              data.adjustment_type === "add" ? "↓ +" : "↓ −",
              data.quantity || 0
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: `text-center p-2 rounded-xl w-full ${data.adjustment_type === "add" ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800" : "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800"}`, children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase tracking-wider", children: "After" }),
              /* @__PURE__ */ jsx("p", { className: `text-2xl font-bold ${data.adjustment_type === "add" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, children: newStock })
            ] })
          ] }),
          data.reason && /* @__PURE__ */ jsx("div", { className: "mt-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "inline-block px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded-full text-2xs font-bold", children: data.reason }) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-ink-muted", children: [
          /* @__PURE__ */ jsx(Box, { size: 36, className: "mb-2 opacity-30" }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-center", children: [
            tt("Select a product"),
            /* @__PURE__ */ jsx("br", {}),
            "to preview changes"
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
export {
  StockOperations as default
};
