import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { ArrowLeft, Store, Calendar, User, FileText, ClipboardList } from "lucide-react";
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
function Show({ audit }) {
  const { store } = usePage().props;
  if (!audit) return null;
  const statusColors = {
    draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    completed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Stock Audit #${audit.reference_number || audit.id}`, activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: `Audit #${audit.reference_number || audit.id}` }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            href: route("store.stock-takes.index", { store_slug: store.slug }),
            className: "p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-slate-500" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: [
              "Stock Audit #",
              audit.reference_number || audit.id
            ] }),
            /* @__PURE__ */ jsx("span", { className: `px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColors[audit.status] || "bg-slate-100"}`, children: audit.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500", children: [
            "Created on ",
            new Date(audit.created_at).toLocaleDateString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600", children: /* @__PURE__ */ jsx(Store, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Warehouse" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: audit.warehouse?.name || "Unknown" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500", children: /* @__PURE__ */ jsx(Calendar, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Audit Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: audit.date })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Audited By" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: audit.creator?.name || "System" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-2", children: audit.notes || "No notes provided." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: audit.items?.length || 0 }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Total Items" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-rose-500", children: audit.items?.filter((i) => i.difference !== 0).length || 0 }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Discrepancies" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-slate-100 dark:border-slate-700", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-indigo-500" }),
          "Audit Results"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Expected" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Counted" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Difference" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Cost Impact" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700", children: audit.items?.map((item) => {
            const diff = parseFloat(item.difference);
            const diffColor = diff === 0 ? "text-slate-400" : diff > 0 ? "text-emerald-500" : "text-rose-500";
            const impact = diff * (item.cost_price || 0);
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-medium text-slate-800 dark:text-white", children: [
                item.product?.name || "Unknown Product",
                /* @__PURE__ */ jsx("span", { className: "block text-xs text-slate-400 font-mono mt-0.5", children: item.product?.code })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-slate-500", children: parseFloat(item.expected_quantity) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-200", children: parseFloat(item.counted_quantity) }),
              /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right font-bold ${diffColor}`, children: diff > 0 ? `+${diff}` : diff }),
              /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right font-mono ${diff === 0 ? "text-slate-400" : "text-slate-600 dark:text-slate-300"}`, children: impact === 0 ? "-" : impact > 0 ? `+${impact.toFixed(2)}` : impact.toFixed(2) })
            ] }, item.id);
          }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Show as default
};
