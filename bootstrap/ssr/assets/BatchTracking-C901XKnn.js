import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { S as StockModuleTabs } from "./StockModuleTabs-K8P-WXC-.js";
import { usePage, Head, router } from "@inertiajs/react";
import { Package, Clock, AlertTriangle, Search, Download, Printer, XCircle, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";
import { P as Pagination } from "./Pagination-s9WRz22Z.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function BatchTracking({ batches, stats, filters }) {
  const { store } = usePage().props;
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "batch", direction: "asc" });
  const handleSearch = (e) => {
    e.preventDefault();
    router.get(route("store.batches.index", { store_slug: store.slug }), { search: searchTerm }, { preserveState: true });
  };
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };
  const filteredBatches = useMemo(() => {
    if (!batches?.data) return [];
    let result = [...batches.data];
    if (statusFilter === "expired") {
      result = result.filter((b) => new Date(b.expiry_date) < /* @__PURE__ */ new Date());
    } else if (statusFilter === "expiring") {
      const thirtyDaysFromNow = /* @__PURE__ */ new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      result = result.filter((b) => {
        const expDate = new Date(b.expiry_date);
        return expDate >= /* @__PURE__ */ new Date() && expDate <= thirtyDaysFromNow;
      });
    } else if (statusFilter === "valid") {
      result = result.filter((b) => new Date(b.expiry_date) >= /* @__PURE__ */ new Date());
    }
    return result;
  }, [batches?.data, statusFilter]);
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
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Batch Tracking", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Batch Tracking" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "batch" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Batches" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-900 dark:text-white", children: stats?.total_batches || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Expiring Soon" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-amber-600", children: stats?.expiring_soon || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Expired" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-rose-600", children: stats?.expired || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Qty" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-emerald-600", children: Number(stats?.total_quantity || 0).toLocaleString() })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Batch ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Tracking" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("valid"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "valid" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Valid"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("expiring"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "expiring" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Expiring Soon"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusFilter("expired"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "expired" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Expired"
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
                placeholder: "Search batches...",
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
              onClick: () => handleSort("batch"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Batch # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "batch" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Product" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("quantity"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-right",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1", children: [
                "Quantity ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "quantity" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Mfg Date" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("expiry"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Exp Date ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "expiry" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredBatches.length > 0 ? filteredBatches.map((batch) => {
          const expDate = new Date(batch.expiry_date);
          const now = /* @__PURE__ */ new Date();
          const thirtyDays = /* @__PURE__ */ new Date();
          thirtyDays.setDate(thirtyDays.getDate() + 30);
          const isExpired = expDate < now;
          const isExpiring = !isExpired && expDate <= thirtyDays;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all
                                                ${isExpired ? "bg-red-50/30 dark:bg-red-900/5 border-l-4 border-red-500" : isExpiring ? "bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-amber-500" : "border-l-4 border-transparent"}
                                            `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400", children: batch.batch_number }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-sm text-slate-800 dark:text-white", children: batch.product?.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-mono", children: batch.product?.code || batch.product?.sku })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-800 dark:text-white", children: Number(batch.current_quantity).toLocaleString() }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-500", children: batch.manufacturing_date || "-" }),
                /* @__PURE__ */ jsx("td", { className: `p-3 text-sm font-medium ${isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : "text-slate-500"}`, children: batch.expiry_date || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: isExpired ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", children: [
                  /* @__PURE__ */ jsx(XCircle, { size: 10 }),
                  " Expired"
                ] }) : isExpiring ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", children: [
                  /* @__PURE__ */ jsx(Clock, { size: 10 }),
                  " Expiring"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", children: [
                  /* @__PURE__ */ jsx(CheckCircle, { size: 10 }),
                  " Valid"
                ] }) })
              ]
            },
            batch.id
          );
        }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Package, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No batches found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "No batch records match your search criteria" })
        ] }) }) }) })
      ] }) }),
      batches?.links && batches.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2", children: /* @__PURE__ */ jsx(Pagination, { links: batches.links }) })
    ] })
  ] });
}
export {
  BatchTracking as default
};
