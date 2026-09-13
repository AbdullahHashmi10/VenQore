import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { CheckCircle, Truck, Clock, ArrowLeft, Store, ArrowRight, Calendar, User, ClipboardList } from "lucide-react";
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
function Show({ transfer }) {
  const { store } = usePage().props;
  const tt = useTermText();
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
            className: "p-2 rounded-xl bg-surface border border-line hover:bg-interactive-hover transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-ink-muted" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
              "Stock Transfer #",
              transfer.reference_number
            ] }),
            /* @__PURE__ */ jsxs("span", { className: `px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[transfer.status] || "bg-sunken"}`, children: [
              /* @__PURE__ */ jsx(StatusIcon, { size: 14 }),
              transfer.status.replace("_", " ")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
            "Created on ",
            new Date(transfer.created_at).toLocaleDateString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-surface p-6 rounded-2xl border border-line shadow-sm relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 p-4 opacity-5", children: /* @__PURE__ */ jsx(Truck, { size: 120 }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "From Origin" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600", children: /* @__PURE__ */ jsx(Store, { size: 24 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-ink", children: transfer.from_warehouse?.name || "Unknown" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Source Warehouse" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-6 flex flex-col items-center justify-center text-neutral-300", children: [
              /* @__PURE__ */ jsx(ArrowRight, { size: 32 }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase mt-1", children: "Transfer" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 text-right", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "To Destination" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 justify-end", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-ink", children: transfer.to_warehouse?.name || "Unknown" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Target Warehouse" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600", children: /* @__PURE__ */ jsx(Store, { size: 24 }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-app rounded-lg text-ink-muted", children: /* @__PURE__ */ jsx(Calendar, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Transfer Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: transfer.transfer_date })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-app rounded-lg text-ink-muted", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Initiated By" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: transfer.creator?.name || "System" })
            ] })
          ] }),
          transfer.completed_at && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600", children: /* @__PURE__ */ jsx(CheckCircle, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Completed At" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: new Date(transfer.completed_at).toLocaleDateString() })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-brand-500" }),
          "Transferred Items"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted font-bold uppercase text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: tt("Product") }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "SKU / Code" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Quantity" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: transfer.items?.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: item.product?.name || tt("Unknown Product") }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-ink-muted font-mono text-xs", children: item.product?.code || "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/10", children: item.quantity })
          ] }, item.id)) }),
          /* @__PURE__ */ jsx("tfoot", { className: "bg-app border-t border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { colSpan: "2", className: "px-6 py-4 text-right font-bold text-ink-muted uppercase text-xs", children: "Total Quantity" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-ink", children: transfer.items?.reduce((sum, item) => sum + Number(item.quantity), 0) })
          ] }) })
        ] }) })
      ] }),
      transfer.notes && /* @__PURE__ */ jsxs("div", { className: "bg-app p-6 rounded-2xl border border-line", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-muted uppercase mb-2", children: "Notes" }),
        /* @__PURE__ */ jsx("p", { className: "text-ink-secondary italic", children: transfer.notes })
      ] })
    ] })
  ] });
}
export {
  Show as default
};
