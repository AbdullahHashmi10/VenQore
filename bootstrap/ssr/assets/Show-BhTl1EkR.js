import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, Head, Link } from "@inertiajs/react";
import { f as formatCurrency, a as formatDate } from "./format-131Nyq79.js";
import { ArrowLeft, Wallet, Beaker, Package, Layers } from "lucide-react";
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
const statusColors = {
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  reversed: "bg-neutral-200 text-ink-secondary dark:bg-raised dark:text-ink-secondary"
};
function ProductionRunShow({ run, materials = [], outputBatch = null }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const totalMaterialCost = materials.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: `Production Run #${run?.run_number || run?.id || ""}`, activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: `Production Run #${run?.run_number || run?.id || ""}` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { href: "#", onClick: (e) => {
          e.preventDefault();
          window.history.back();
        }, className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 }) }),
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink", children: [
          "Production Run #",
          run?.run_number || run?.id
        ] }),
        /* @__PURE__ */ jsx("span", { className: `text-xs font-bold uppercase px-2.5 py-1 rounded-full ${statusColors[run?.status] || "bg-sunken text-ink-secondary"}`, children: run?.status?.replace("_", " ") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: tt("Product") }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: run?.product?.name || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Total Cost" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: formatCurrency(run?.total_cost, store) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-4 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatDate(run?.date, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Planned Qty" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: run?.planned_qty ?? run?.quantity ?? "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Actual Qty" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: run?.actual_qty ?? "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Material / Labor" }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-ink", children: [
              formatCurrency(run?.material_cost, store),
              " / ",
              formatCurrency(run?.labor_cost, store)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Wallet, { size: 16 }),
          " Work-In-Progress Balance"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: run?.status === "completed" ? "This run has been completed — WIP was closed out to the finished-goods batch below." : "This run is still in progress — material and labor costs are held in WIP until completion." }),
          /* @__PURE__ */ jsx("p", { className: `text-xl font-bold ${parseFloat(run?.wip_balance || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`, children: formatCurrency(run?.wip_balance, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Beaker, { size: 16 }),
          " Raw Materials Consumed"
        ] }),
        materials.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No BOM consumption records found for this run." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
              /* @__PURE__ */ jsx("th", { className: "py-2", children: "Raw Material" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Qty Deducted" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Unit Cost" }),
              /* @__PURE__ */ jsx("th", { className: "py-2 text-right", children: "Total Cost" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: materials.map((m) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "py-3 font-medium text-ink", children: m.product_name }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-ink-secondary", children: m.qty_deducted }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-ink-secondary", children: formatCurrency(m.unit_cost, store) }),
              /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-medium text-ink", children: formatCurrency(m.total_cost, store) })
            ] }, m.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end mt-4 pt-4 border-t border-line text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted mr-2", children: "Total Material Cost:" }),
            /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: formatCurrency(totalMaterialCost, store) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 shadow-sm border border-line", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-ink-muted uppercase tracking-wider mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Package, { size: 16 }),
          " Finished Goods Output"
        ] }),
        outputBatch ? /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Qty Produced" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: outputBatch.remaining_qty ?? outputBatch.original_qty })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Layers, { size: 12 }),
              " Computed Unit Cost"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatCurrency(outputBatch.unit_cost, store) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-1", children: "Batch Created" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-ink", children: formatDate(outputBatch.created_at, store) })
          ] })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No finished-goods batch has been created yet — this run has not been completed." })
      ] })
    ] })
  ] });
}
export {
  ProductionRunShow as default
};
