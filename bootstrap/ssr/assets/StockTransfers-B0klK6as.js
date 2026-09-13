import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { S as StockModuleTabs } from "./StockModuleTabs-0gR4Jbnu.js";
import { P as Pagination } from "./Pagination-DQc3dU-Z.js";
import { useDebounce } from "use-debounce";
import { ArrowLeftRight, Clock, Truck, CheckCircle, Plus, Search, Download, Printer, Warehouse, ArrowRight, Package, Eye, XCircle, ChevronUp, ChevronDown } from "lucide-react";
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
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
function StockTransfers({ transfers = { data: [], links: [] }, warehouses = [], stats = {}, filters = {} }) {
  const { props } = usePage();
  const store = props.store || {};
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      router.get(route("store.stock-transfers.index", { store_slug: store.slug }), {
        search: debouncedSearch,
        status: statusFilter === "all" ? null : statusFilter
      }, {
        preserveState: true,
        preserveScroll: true,
        replace: true
      });
    }
  }, [debouncedSearch]);
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    router.get(route("store.stock-transfers.index", { store_slug: store.slug }), {
      search: searchTerm,
      status: status === "all" ? null : status
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };
  const getStatusBadge = (status) => {
    const styles = {
      completed: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle },
      pending: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: Clock },
      in_transit: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: Truck },
      cancelled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle },
      in_progress: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: Truck }
    };
    return styles[status] || styles.pending;
  };
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-brand-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-brand-500" });
  };
  const transferList = transfers.data || [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Stock Transfers", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Transfers" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "transfers" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-sunken text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Total" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink", children: stats.total_transfers || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Pending" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-amber-600", children: stats.pending_approval || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(Truck, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "In Transit" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-blue-600", children: stats.in_progress || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-sunken" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase", children: "Completed" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-emerald-600", children: stats.completed || 0 })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.stock-transfers.create", { store_slug: store.slug }),
            className: "flex items-center gap-1.5 px-3 py-1.5 bg-gradient-brand text-white rounded-lg transition-all font-bold text-xs shadow-lg ",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              "New Transfer"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Stock ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Transfers" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "pending" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("in_progress"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "in_progress" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "In Transit"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("completed"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "completed" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Completed"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("cancelled"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "cancelled" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Cancelled"
            }
          )
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
                className: "pl-9 pr-3 py-1.5 text-sm bg-app border border-line rounded-lg focus:ring-2 ring-brand-500/20 focus:border-brand-500 outline-none w-44"
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
                "Transfer # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "reference" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "From → To" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Items" }),
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
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: transferList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 28, className: "text-ink-muted" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink-secondary mb-1", children: "No transfers found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-3", children: "Create a new transfer to move stock between warehouses" }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.stock-transfers.create", { store_slug: store.slug }),
              className: "inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-bold text-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 16 }),
                "Create First Transfer"
              ]
            }
          )
        ] }) }) }) : transferList.map((transfer) => {
          const statusStyle = getStatusBadge(transfer.status);
          const StatusIcon = statusStyle.icon;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all cursor-pointer
 ${transfer.status === "pending" ? "border-l-4 border-amber-500" : transfer.status === "in_progress" || transfer.status === "in_transit" ? "border-l-4 border-blue-500" : transfer.status === "completed" ? "border-l-4 border-emerald-500" : transfer.status === "cancelled" ? "border-l-4 border-red-500" : "border-l-4 border-transparent"}
`,
              onClick: () => router.visit(route("store.stock-transfers.show", transfer.id)),
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-brand-600 dark:text-brand-400", children: transfer.reference_number || `TRF-${transfer.id}` }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(Warehouse, { size: 14, className: "text-ink-muted" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-ink-secondary", children: transfer.from_warehouse?.name || "Unknown" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-brand-500" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(Warehouse, { size: 14, className: "text-ink-muted" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-ink-secondary", children: transfer.to_warehouse?.name || "Unknown" })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-sunken rounded text-xs font-bold", children: [
                  /* @__PURE__ */ jsx(Package, { size: 12 }),
                  transfer.items?.length || transfer.items_count || 0
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-secondary", children: new Date(transfer.created_at).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`, children: [
                  /* @__PURE__ */ jsx(StatusIcon, { size: 10 }),
                  transfer.status?.replace("_", " ") || "pending"
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: route("store.stock-transfers.show", transfer.id),
                    className: "p-1.5 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-all inline-flex",
                    children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                  }
                ) })
              ]
            },
            transfer.id
          );
        }) })
      ] }) }),
      transfers.links && transfers.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-surface rounded-xl border border-line shadow-sm px-3 py-2", children: /* @__PURE__ */ jsx(Pagination, { links: transfers.links }) })
    ] })
  ] });
}
export {
  StockTransfers as default
};
