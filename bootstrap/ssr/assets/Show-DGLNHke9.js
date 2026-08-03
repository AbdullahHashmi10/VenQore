import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { P as PremiumButton } from "./PremiumButton-BcHxfadR.js";
import { ArrowLeft, Printer, CheckCircle, Truck, MapPin, Calendar } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function PurchaseOrdersShow({ order }) {
  const { store } = usePage().props;
  const handleReceive = () => {
    if (confirm("Are you sure you want to mark this order as RECEIVED? This will update your inventory stock levels.")) {
      router.post(route("store.purchase-orders.receive", order.id));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `PO: ${order.reference_number}`, children: [
    /* @__PURE__ */ jsx(Head, { title: `PO: ${order.reference_number}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 h-full overflow-y-auto", children: [
      /* @__PURE__ */ jsx("div", { className: "max-w-4xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.purchase-orders.index", { store_slug: store.slug }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" }) }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3", children: [
            order.reference_number,
            /* @__PURE__ */ jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === "received" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : order.status === "ordered" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`, children: order.status })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors", children: [
            /* @__PURE__ */ jsx(Printer, { size: 18 }),
            " Print"
          ] }),
          order.status !== "received" && /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.purchase-orders.edit", order.id),
              className: "flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-lg font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors",
              children: "Edit Order"
            }
          ),
          order.status !== "received" && /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleReceive, children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
            "Receive Stock"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Truck, { size: 16 }),
            " Supplier"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-900 dark:text-white", children: order.supplier?.name }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1", children: order.supplier?.contact_person }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm", children: order.supplier?.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(MapPin, { size: 16 }),
            " Destination"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-900 dark:text-white", children: order.warehouse?.name }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mt-1", children: order.warehouse?.location })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 16 }),
            " Dates"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400 text-sm", children: "Ordered:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-900 dark:text-white", children: new Date(order.order_date).toLocaleDateString() })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400 text-sm", children: "Expected:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-900 dark:text-white", children: order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "N/A" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-8", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "p-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Ordered Qty" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Received Qty" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Unit Cost" }),
          /* @__PURE__ */ jsx("th", { className: "p-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: order.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "p-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900 dark:text-white", children: item.product?.name }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
              "SKU: ",
              item.product?.sku
            ] })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center font-bold text-slate-700 dark:text-slate-300", children: parseFloat(item.quantity) }),
          /* @__PURE__ */ jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `font-bold ${parseFloat(item.received_quantity) >= parseFloat(item.quantity) ? "text-green-600" : parseFloat(item.received_quantity) > 0 ? "text-amber-600" : "text-slate-400"}`, children: parseFloat(item.received_quantity) }) }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right text-slate-600 dark:text-slate-400", children: [
            "$",
            parseFloat(item.unit_cost).toFixed(2)
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right font-bold text-slate-900 dark:text-white", children: [
            "$",
            parseFloat(item.total_cost).toFixed(2)
          ] })
        ] }, item.id)) }),
        /* @__PURE__ */ jsx("tfoot", { className: "bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { colSpan: "4", className: "p-4 text-right font-bold text-slate-500 uppercase", children: "Total Amount" }),
          /* @__PURE__ */ jsxs("td", { className: "p-4 text-right font-bold text-xl text-slate-900 dark:text-white", children: [
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
