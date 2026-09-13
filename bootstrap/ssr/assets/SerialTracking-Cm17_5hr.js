import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { S as StockModuleTabs } from "./StockModuleTabs-0gR4Jbnu.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Barcode, CheckCircle, ShoppingCart, CornerDownLeft, Search, Download, Printer, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { P as Pagination } from "./Pagination-DQc3dU-Z.js";
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
function SerialTracking({ serials, stats, filters }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState(filters?.status || "all");
  const [sortConfig, setSortConfig] = useState({ key: "serial", direction: "asc" });
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("store.serials.index", { store_slug: store.slug }), {
      search: searchTerm,
      status: statusFilter === "all" ? "" : statusFilter
    }, { preserveState: true });
  };
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    router.get(route("store.serials.index", { store_slug: store.slug }), {
      search: searchTerm,
      status: status === "all" ? "" : status
    }, { preserveState: true, preserveScroll: true });
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
  const getStatusStyle = (status) => {
    switch (status) {
      case "available":
        return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle, label: "Available" };
      case "sold":
        return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: ShoppingCart, label: "Sold" };
      case "returned":
        return { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: CornerDownLeft, label: "Returned" };
      default:
        return { bg: "bg-sunken", text: "text-ink-secondary", icon: Clock, label: status };
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Serial Tracking", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Serial Tracking" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "serial" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(Barcode, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Serials" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink", children: stats?.total_serials || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "In Stock" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-emerald-600", children: stats?.in_stock || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Sold" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-blue-600", children: stats?.sold || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(CornerDownLeft, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Returned" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-amber-600", children: stats?.returned || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Serial ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Tracking" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("available"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "available" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Available"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("sold"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "sold" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Sold"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("returned"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "returned" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg " : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Returned"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search serials...",
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
              onClick: () => handleSort("serial"),
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Serial # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "serial" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: tt("Product") }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider", children: "Location" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("date"),
              className: "p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Created ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "date" })
              ] })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: serials?.data?.length > 0 ? serials.data.map((serial) => {
          const statusStyle = getStatusStyle(serial.status);
          const StatusIcon = statusStyle.icon;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all
                                                ${serial.status === "available" ? "border-l-4 border-emerald-500" : serial.status === "sold" ? "border-l-4 border-blue-500" : serial.status === "returned" ? "border-l-4 border-amber-500" : "border-l-4 border-transparent"}
`,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-brand-600 dark:text-brand-400", children: serial.serial_number }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-ink", children: serial.product?.name }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`, children: [
                  /* @__PURE__ */ jsx(StatusIcon, { size: 10 }),
                  statusStyle.label
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-muted", children: serial.warehouse?.name || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-muted", children: new Date(serial.created_at).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) })
              ]
            },
            serial.id
          );
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Barcode, { size: 28, className: "text-ink-muted" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink-secondary mb-1", children: "No serials found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No serial numbers match your search criteria" })
        ] }) }) }) })
      ] }) }),
      serials?.links && serials.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-surface rounded-xl border border-line shadow-sm px-3 py-2", children: /* @__PURE__ */ jsx(Pagination, { links: serials.links }) })
    ] })
  ] });
}
export {
  SerialTracking as default
};
