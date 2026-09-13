import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { S as StockModuleTabs } from "./StockModuleTabs-0gR4Jbnu.js";
import { ClipboardCheck, ArrowUpDown, CheckCircle, AlertTriangle, Plus, Search, Download, Printer, Warehouse, Package, Eye, Save, ChevronUp, ChevronDown } from "lucide-react";
import { u as useAlert } from "../ssr.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "axios";
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
function StockTakeIndex({ stockTakes = [], warehouses = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const { showConfirm } = useAlert();
  const { store } = usePage().props;
  const filteredStockTakes = useMemo(() => {
    let result = stockTakes.filter((item) => {
      const matchesSearch = !searchTerm || item.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) || item.warehouse?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesWarehouse = warehouseFilter === "all" || item.warehouse_id === parseInt(warehouseFilter);
      return matchesSearch && matchesStatus && matchesWarehouse;
    });
    result.sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case "reference":
          valA = a.reference_number || "";
          valB = b.reference_number || "";
          break;
        case "date":
          valA = new Date(a.created_at).getTime();
          valB = new Date(b.created_at).getTime();
          break;
        case "items":
          valA = a.items_counted || 0;
          valB = b.items_counted || 0;
          break;
        default:
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [stockTakes, searchTerm, statusFilter, warehouseFilter, sortConfig]);
  const stats = useMemo(() => {
    return {
      total: stockTakes.length,
      inProgress: stockTakes.filter((s) => s.status === "in_progress").length,
      completed: stockTakes.filter((s) => s.status === "completed").length,
      withVariance: stockTakes.filter((s) => s.has_variance || s.variance_items > 0).length
    };
  }, [stockTakes]);
  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: "bg-sunken", text: "text-ink-secondary" },
      in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
      completed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
      cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" }
    };
    return styles[status] || styles.draft;
  };
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-emerald-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-emerald-500" });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Stock Take / Audit", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Take" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "audit" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-sunken text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ClipboardCheck, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Total Audits" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: stats.total })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowUpDown, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "In Progress" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-blue-600", children: stats.inProgress })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Completed" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-emerald-600", children: stats.completed })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "With Variance" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-amber-600", children: stats.withVariance })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.stock-takes.create", { store_slug: store.slug }),
            className: "flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-bold text-xs shadow-lg ",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              "New Stock Take"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Stock ",
            /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "Audit" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-emerald-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("draft"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "draft" ? "bg-gradient-to-r from-neutral-500 to-neutral-600 text-white shadow-lg shadow-neutral-500/30" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Draft"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("in_progress"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "in_progress" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "In Progress"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("completed"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "completed" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Completed"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setStatusFilter("cancelled"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "cancelled" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Cancelled"
            }
          ),
          warehouses.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: warehouseFilter,
                onChange: (e) => setWarehouseFilter(e.target.value),
                className: "px-2 py-1 text-xs font-semibold bg-app border border-line rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Warehouses" }),
                  warehouses.map((wh) => /* @__PURE__ */ jsx("option", { value: wh.id, children: wh.name }, wh.id))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search...",
                className: "pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 outline-none w-44"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-app border-b border-line sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("reference"),
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Reference # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "reference" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Warehouse" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("date"),
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Date ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "date" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("items"),
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
                "Items ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "items" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Variance" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Counted By" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filteredStockTakes.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(ClipboardCheck, { size: 28, className: "text-ink-muted" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink-secondary mb-1", children: "No stock takes found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-3", children: "Start a new stock take to audit your inventory" }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.stock-takes.create", { store_slug: store.slug }),
              className: "inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold text-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 16 }),
                "Start Stock Take"
              ]
            }
          )
        ] }) }) }) : filteredStockTakes.map((stockTake) => {
          const statusStyle = getStatusBadge(stockTake.status);
          const hasVariance = stockTake.variance_items > 0 || stockTake.has_variance;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer
                                                ${stockTake.status === "in_progress" ? "border-l-4 border-blue-500" : stockTake.status === "completed" ? "border-l-4 border-emerald-500" : stockTake.status === "cancelled" ? "border-l-4 border-red-500" : hasVariance ? "border-l-4 border-amber-500" : "border-l-4 border-transparent"}
`,
              onClick: () => router.visit(route("store.stock-takes.show", stockTake.id)),
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400", children: stockTake.reference_number || `ST-${stockTake.id}` }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Warehouse, { size: 14, className: "text-ink-muted" }),
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-ink-secondary", children: stockTake.warehouse?.name || "All Warehouses" })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-secondary", children: new Date(stockTake.created_at).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-sunken rounded text-xs font-bold", children: [
                  /* @__PURE__ */ jsx(Package, { size: 12 }),
                  stockTake.items_counted || 0
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: hasVariance ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-2xs font-bold", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
                  stockTake.variance_items || "Yes"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-2xs font-bold", children: [
                  /* @__PURE__ */ jsx(CheckCircle, { size: 10 }),
                  "None"
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-secondary", children: stockTake.user?.name || "Unknown" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`, children: stockTake.status?.replace("_", " ") || "draft" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-1", children: [
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.stock-takes.show", stockTake.id),
                      className: "p-1.5 text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all",
                      children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                    }
                  ),
                  stockTake.status === "in_progress" && /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.stock-takes.show", stockTake.id),
                      className: "p-1.5 text-ink-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all",
                      children: /* @__PURE__ */ jsx(Save, { size: 16 })
                    }
                  )
                ] }) })
              ]
            },
            stockTake.id
          );
        }) })
      ] }) })
    ] })
  ] });
}
export {
  StockTakeIndex as default
};
