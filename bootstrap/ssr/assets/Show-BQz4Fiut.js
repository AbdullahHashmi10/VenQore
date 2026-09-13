import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PremiumButton } from "./PremiumButton-BUDyjGi2.js";
import { ArrowLeft, Printer, CheckCircle, Truck, MapPin, Calendar } from "lucide-react";
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
function PurchaseOrdersShow({ order }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [isIntaking, setIsIntaking] = useState(false);
  const [intakeQuantities, setIntakeQuantities] = useState(
    order.items.reduce((acc, item) => {
      acc[item.id] = Math.max(0, parseFloat(item.quantity) - parseFloat(item.received_quantity || 0)).toString();
      return acc;
    }, {})
  );
  const handleReceive = () => {
    if (confirm("Are you sure you want to mark all remaining quantities as RECEIVED? This will update your inventory stock levels.")) {
      router.post(route("store.purchase-orders.receive", order.id));
    }
  };
  const handleIntakeSubmit = () => {
    const payload = {
      items: Object.entries(intakeQuantities).map(([id, receive_qty]) => ({
        id,
        receive_qty: parseFloat(receive_qty) || 0
      }))
    };
    router.post(route("store.purchase-orders.receive", order.id), payload, {
      onSuccess: () => {
        setIsIntaking(false);
      }
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `PO: ${order.reference_number}`, children: [
    /* @__PURE__ */ jsx(Head, { title: `PO: ${order.reference_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 h-full overflow-y-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.purchase-orders.index", { store_slug: store.slug }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-ink-muted" }) }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-ink flex items-center gap-3", children: [
            order.reference_number,
            /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === "received" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : order.status === "ordered" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-sunken text-ink-secondary dark:bg-raised dark:text-ink-secondary"}`, children: order.status })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-surface border border-line rounded-lg font-bold text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx(Printer, { size: 18 }),
            " Print"
          ] }),
          order.status !== "received" && !isIntaking && /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.purchase-orders.edit", order.id),
              className: "flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors",
              children: tt("Edit Order")
            }
          ),
          order.status !== "received" && !isIntaking && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsIntaking(true),
              className: "flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors",
              children: "Record Intake"
            }
          ),
          order.status !== "received" && !isIntaking && /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleReceive, children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
            "Receive All Remaining"
          ] }),
          isIntaking && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsIntaking(false),
              className: "px-4 py-2 bg-sunken text-ink-secondary border border-line rounded-lg font-bold hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
              children: "Cancel"
            }
          ),
          isIntaking && /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleIntakeSubmit, children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
            "Save Stock Intake"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Truck, { size: 16 }),
            " ",
            tt("Supplier")
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: order.supplier?.name }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: order.supplier?.contact_person }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm", children: order.supplier?.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 16 }),
            " Destination"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: order.warehouse?.name }),
          /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm mt-1", children: order.warehouse?.location })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-xl border border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-ink-muted font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 16 }),
            " Dates"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-sm", children: "Ordered:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: new Date(order.order_date).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-sm", children: "Expected:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "N/A" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-surface rounded-xl border border-line overflow-hidden mb-8", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider", children: tt("Product") }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-center text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Ordered Qty" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-center text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Received Qty" }),
          isIntaking && /* @__PURE__ */ jsx("th", { className: "p-4 text-center text-xs font-bold text-brand-500 uppercase tracking-wider w-36", children: "This Intake" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Unit Cost" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Total" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: order.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-ink", children: item.product?.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted", children: [
              "SKU: ",
              item.product?.sku
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center font-bold text-ink-secondary", children: parseFloat(item.quantity) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `font-bold ${parseFloat(item.received_quantity) >= parseFloat(item.quantity) ? "text-green-600" : parseFloat(item.received_quantity) > 0 ? "text-amber-600" : "text-ink-muted"}`, children: parseFloat(item.received_quantity) }) }),
          isIntaking && /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "any",
              min: "0",
              max: parseFloat(item.quantity) - parseFloat(item.received_quantity || 0),
              value: intakeQuantities[item.id] ?? "",
              onChange: (e) => setIntakeQuantities({
                ...intakeQuantities,
                [item.id]: e.target.value
              }),
              className: "w-24 text-center rounded-lg border-line dark:bg-app text-ink font-bold"
            }
          ) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right text-ink-secondary", children: [
            "$",
            parseFloat(item.unit_cost).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right font-bold text-ink", children: [
            "$",
            parseFloat(item.total_cost).toFixed(2)
          ] })
        ] }, item.id)) }),
        /* @__PURE__ */ jsx("tfoot", { className: "bg-app border-t border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: isIntaking ? 5 : 4, className: "p-4 text-right font-bold text-ink-muted uppercase", children: "Total Amount" }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right font-bold text-xl text-ink", children: [
            "$",
            parseFloat(order.total_amount).toFixed(2)
          ] })
        ] }) })
      ] }) }),
      order.notes && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: "Notes:" }),
        " ",
        order.notes
      ] })
    ] })
  ] });
}
export {
  PurchaseOrdersShow as default
};
