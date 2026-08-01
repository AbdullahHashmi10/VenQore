import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { S as StockModuleTabs } from "./StockModuleTabs-CzdhnRlp.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Barcode, CheckCircle, ShoppingCart, CornerDownLeft, Search, Download, Printer, ChevronUp, ChevronDown, Clock } from "lucide-react";
import { P as Pagination } from "./Pagination-s9WRz22Z.js";
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
function SerialTracking({ serials, stats, filters }) {
  const { store } = usePage().props;
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
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" });
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
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", icon: Clock, label: status };
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Serial Tracking", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Serial Tracking" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "serial" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Barcode, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Serials" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-900 dark:text-white", children: stats?.total_serials || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "In Stock" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-emerald-600", children: stats?.in_stock || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Sold" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-blue-600", children: stats?.sold || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(CornerDownLeft, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Returned" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-amber-600", children: stats?.returned || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Serial ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Tracking" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("all"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("available"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === "available" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Available"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("sold"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === "sold" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Sold"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("returned"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${statusFilter === "returned" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Returned"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search serials...",
                className: "pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 outline-none w-44"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(Download, { size: 16 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("serial"),
              className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Serial # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "serial" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Product" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Location" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("date"),
              className: "p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Created ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "date" })
              ] })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: serials?.data?.length > 0 ? serials.data.map((serial) => {
          const statusStyle = getStatusStyle(serial.status);
          const StatusIcon = statusStyle.icon;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all
                                                ${serial.status === "available" ? "border-l-4 border-emerald-500" : serial.status === "sold" ? "border-l-4 border-blue-500" : serial.status === "returned" ? "border-l-4 border-amber-500" : "border-l-4 border-transparent"}
                                            `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400", children: serial.serial_number }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-slate-800 dark:text-white", children: serial.product?.name }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle.bg} ${statusStyle.text}`, children: [
                  /* @__PURE__ */ jsx(StatusIcon, { size: 10 }),
                  statusStyle.label
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-500", children: serial.warehouse?.name || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-500", children: new Date(serial.created_at).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }) })
              ]
            },
            serial.id
          );
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Barcode, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No serials found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No serial numbers match your search criteria" })
        ] }) }) }) })
      ] }) }),
      serials?.links && serials.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2", children: /* @__PURE__ */ jsx(Pagination, { links: serials.links }) })
    ] })
  ] });
}
export {
  SerialTracking as default
};
