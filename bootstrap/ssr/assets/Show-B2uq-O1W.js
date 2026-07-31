import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-BqRkhJQJ.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { CheckCircle, Truck, Clock, ArrowLeft, Store, ArrowRight, Calendar, User, ClipboardList } from "lucide-react";
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
function Show({ transfer }) {
  const { store } = usePage().props;
  if (!transfer) return null;
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  const statusIcons = {
    pending: Clock,
    in_progress: Truck,
    completed: CheckCircle
  };
  const StatusIcon = statusIcons[transfer.status] || Clock;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Stock Transfer #${transfer.reference_number || transfer.id}`, activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: `Transfer #${transfer.reference_number || transfer.id}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.stock-transfers.index", { store_slug: store.slug }),
            className: "p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: [
              "Stock Transfer #",
              transfer.reference_number
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[transfer.status] || "bg-slate-100"}`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { size: 14 }),
              transfer.status.replace("_", " ")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
            "Created on ",
            new Date(transfer.created_at).toLocaleDateString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5", children: /* @__PURE__ */ jsx(Truck, { size: 120 }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2", children: "From Origin" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600", children: /* @__PURE__ */ jsx(Store, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-slate-800 dark:text-white", children: transfer.from_warehouse?.name || "Unknown" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Source Warehouse" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-6 flex flex-col items-center justify-center text-slate-300", children: [
              /* @__PURE__ */ jsx(ArrowRight, { size: 32 }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase mt-1", children: "Transfer" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase mb-2", children: "To Destination" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 justify-end", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-slate-800 dark:text-white", children: transfer.to_warehouse?.name || "Unknown" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Target Warehouse" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600", children: /* @__PURE__ */ jsx(Store, { size: 24 }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500", children: /* @__PURE__ */ jsx(Calendar, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Transfer Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: transfer.transfer_date })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Initiated By" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: transfer.creator?.name || "System" })
            ] })
          ] }),
          transfer.completed_at && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600", children: /* @__PURE__ */ jsx(CheckCircle, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Completed At" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: new Date(transfer.completed_at).toLocaleDateString() })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-700", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-indigo-500" }),
          "Transferred Items"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "SKU / Code" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Quantity" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: transfer.items?.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-slate-800 dark:text-white", children: item.product?.name || "Unknown Product" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-slate-500 font-mono text-xs", children: item.product?.code || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10", children: item.quantity })
          ] }, item.id)) }),
          /* @__PURE__ */ jsx("tfoot", { className: "bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { colSpan: "2", className: "px-6 py-4 text-right font-bold text-slate-500 uppercase text-xs", children: "Total Quantity" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-black text-slate-800 dark:text-white", children: transfer.items?.reduce((sum, item) => sum + Number(item.quantity), 0) })
          ] }) })
        ] }) })
      ] }),
      transfer.notes && /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-500 uppercase mb-2", children: "Notes" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-700 dark:text-slate-300 italic", children: transfer.notes })
      ] })
    ] })
  ] });
}
export {
  Show as default
};
