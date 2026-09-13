import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { ArrowLeft, Store, Calendar, User, FileText, ClipboardList } from "lucide-react";
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
function Show({ audit }) {
  const { store } = usePage().props;
  const tt = useTermText();
  if (!audit) return null;
  const statusColors = {
    draft: "bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted",
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
            className: "p-2 rounded-xl bg-surface border border-line hover:bg-interactive-hover transition-colors",
            children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20, className: "text-ink-muted" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
              "Stock Audit #",
              audit.reference_number || audit.id
            ] }),
            /* @__PURE__ */ jsx("span", { className: `px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColors[audit.status] || "bg-sunken"}`, children: audit.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted", children: [
            "Created on ",
            new Date(audit.created_at).toLocaleDateString()
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600", children: /* @__PURE__ */ jsx(Store, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Warehouse" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: audit.warehouse?.name || "Unknown" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-app rounded-lg text-ink-muted", children: /* @__PURE__ */ jsx(Calendar, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Audit Date" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: audit.date })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Audited By" }),
              /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: audit.creator?.name || "System" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-app rounded-lg text-ink-muted", children: /* @__PURE__ */ jsx(FileText, { size: 20 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Notes" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink-secondary line-clamp-2", children: audit.notes || "No notes provided." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-surface p-6 rounded-2xl border border-line shadow-sm flex flex-col justify-center", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-app rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: audit.items?.length || 0 }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Items" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-app rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-rose-500", children: audit.items?.filter((i) => i.difference !== 0).length || 0 }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Discrepancies" })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-line", children: /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(ClipboardList, { size: 20, className: "text-brand-500" }),
          "Audit Results"
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted font-bold uppercase text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: tt("Product") }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Expected" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Counted" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Difference" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Cost Impact" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: audit.items?.map((item) => {
            const diff = parseFloat(item.difference);
            const diffColor = diff === 0 ? "text-ink-muted" : diff > 0 ? "text-emerald-500" : "text-rose-500";
            const impact = diff * (item.cost_price || 0);
            return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
              /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-medium text-ink", children: [
                item.product?.name || tt("Unknown Product"),
                /* @__PURE__ */ jsx("span", { className: "block text-xs text-ink-muted font-mono mt-0.5", children: item.product?.code })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right text-ink-muted", children: parseFloat(item.expected_quantity) }),
              /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-ink-secondary dark:text-ink", children: parseFloat(item.counted_quantity) }),
              /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right font-bold ${diffColor}`, children: diff > 0 ? `+${diff}` : diff }),
              /* @__PURE__ */ jsx("td", { className: `px-6 py-4 text-right font-mono ${diff === 0 ? "text-ink-muted" : "text-ink-secondary"}`, children: impact === 0 ? "-" : impact > 0 ? `+${impact.toFixed(2)}` : impact.toFixed(2) })
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
