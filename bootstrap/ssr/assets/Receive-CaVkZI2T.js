import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { a as FormField, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import { Package, CheckCircle } from "lucide-react";
import axios from "axios";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function ReceivePurchase({ purchase = {}, products = [] }) {
  const {
    store
  } = usePage().props;
  const [loading, setLoading] = useState(false);
  const [receivedItems, setReceivedItems] = useState(
    purchase.items?.map((item) => ({
      item_id: item.id,
      product_id: item.product_id,
      product_name: item.product?.name,
      ordered_qty: item.quantity,
      received_qty: item.received_qty || 0,
      receiving_qty: 0,
      batch_number: "",
      expiry_date: ""
    })) || []
  );
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const formatCurrency2 = (val) => (val < 0 ? "-" : "") + (window.amdSettings?.currency_symbol || "Rs") + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val) || 0);
  const updateItem = (index, field, value) => {
    const newItems = [...receivedItems];
    newItems[index][field] = value;
    setReceivedItems(newItems);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.purchases.receive.store", [store.slug, purchase.id]), {
        items: receivedItems.filter((item) => item.receiving_qty > 0),
        notes
      });
      router.visit(route("store.purchases.show", [store.slug, purchase.id]));
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
  const receiveAll = () => {
    setReceivedItems((items) => items.map((item) => ({
      ...item,
      receiving_qty: item.ordered_qty - item.received_qty
    })));
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Receive Goods", children: [
    /* @__PURE__ */ jsx(Head, { title: "Receive Goods" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 overflow-auto", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "Receive Goods",
          subtitle: `Purchase #${purchase.invoice_number} from ${purchase.party?.name || "Supplier"}`,
          icon: Package,
          breadcrumbs: [
            { label: "Transactions" },
            { label: "Purchases", href: route("store.purchases.index", {
              store_slug: store.slug
            }) },
            { label: purchase.invoice_number },
            { label: "Receive" }
          ],
          actions: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: receiveAll,
              className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors",
              children: [
                /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
                "Receive All"
              ]
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Invoice Number" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: purchase.invoice_number })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Supplier" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: purchase.party?.name || "Unknown" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Date" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: new Date(purchase.created_at).toLocaleDateString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-slate-500", children: "Total" }),
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-emerald-600", children: formatCurrency2(purchase.total_amount) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex-1", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg text-slate-800 dark:text-white", children: "Items to Receive" }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase", children: "Ordered" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase", children: "Received" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase", children: "Pending" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase", children: "Receiving Now" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase", children: "Batch #" }),
            /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase", children: "Expiry" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: receivedItems.map((item, index) => {
            const pending = item.ordered_qty - item.received_qty;
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/30", children: [
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-800 dark:text-white", children: item.product_name }) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center font-medium", children: item.ordered_qty }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center text-emerald-600 font-medium", children: item.received_qty }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center text-amber-600 font-medium", children: pending }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  min: "0",
                  max: pending,
                  value: item.receiving_qty,
                  onChange: (e) => updateItem(index, "receiving_qty", parseFloat(e.target.value) || 0),
                  className: "w-20 mx-auto block px-2 py-1 text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: item.batch_number,
                  onChange: (e) => updateItem(index, "batch_number", e.target.value),
                  placeholder: "Batch",
                  className: "w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                }
              ) }),
              /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: item.expiry_date,
                  onChange: (e) => updateItem(index, "expiry_date", e.target.value),
                  className: "w-32 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                }
              ) })
            ] }, item.item_id);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6", children: [
        /* @__PURE__ */ jsx(FormField, { label: "Receiving Notes", children: /* @__PURE__ */ jsx(
          FormTextarea,
          {
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            placeholder: "Any notes about this goods receipt...",
            rows: 2
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => router.visit(route("store.purchases.index", {
            store_slug: store.slug
          })), children: "Cancel" }),
          /* @__PURE__ */ jsx(PrimaryButton, { onClick: handleSubmit, loading, children: "Confirm Receipt" })
        ] })
      ] })
    ] })
  ] });
}
export {
  ReceivePurchase as default
};
