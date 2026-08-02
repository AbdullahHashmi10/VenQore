import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { S as StockModuleTabs } from "./StockModuleTabs-CUSiTj2Q.js";
import { P as Pagination } from "./Pagination-s9WRz22Z.js";
import { useDebounce } from "use-debounce";
import { ArrowLeftRight, Clock, Truck, CheckCircle, Plus, Search, Download, Printer, Warehouse, ArrowRight, Package, Eye, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
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
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" });
  };
  const transferList = transfers.data || [];
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Stock Transfers", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Transfers" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "transfers" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase", children: "Total" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-900 dark:text-white", children: stats.total_transfers || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-slate-200 dark:bg-slate-700" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase", children: "Pending" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-amber-600", children: stats.pending_approval || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-slate-200 dark:bg-slate-700" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(Truck, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase", children: "In Transit" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-blue-600", children: stats.in_progress || 0 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-px h-8 bg-slate-200 dark:bg-slate-700" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-1", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase", children: "Completed" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-emerald-600", children: stats.completed || 0 })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: route("store.stock-transfers.create", { store_slug: store.slug }),
            className: "flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold text-xs shadow-lg shadow-indigo-500/20",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              "New Transfer"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Stock ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Transfers" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "pending" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("in_progress"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "in_progress" ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "In Transit"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("completed"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "completed" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Completed"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleStatusChange("cancelled"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${statusFilter === "cancelled" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Cancelled"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                placeholder: "Search...",
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
              onClick: () => handleSort("reference"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Transfer # ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "reference" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "From → To" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Items" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("date"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Date ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "date" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: transferList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No transfers found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-3", children: "Create a new transfer to move stock between warehouses" }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.stock-transfers.create", { store_slug: store.slug }),
              className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm",
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
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer
                                                ${transfer.status === "pending" ? "border-l-4 border-amber-500" : transfer.status === "in_progress" || transfer.status === "in_transit" ? "border-l-4 border-blue-500" : transfer.status === "completed" ? "border-l-4 border-emerald-500" : transfer.status === "cancelled" ? "border-l-4 border-red-500" : "border-l-4 border-transparent"}
                                            `,
              onClick: () => router.visit(route("store.stock-transfers.show", transfer.id)),
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400", children: transfer.reference_number || `TRF-${transfer.id}` }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(Warehouse, { size: 14, className: "text-slate-400" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-slate-700 dark:text-slate-300", children: transfer.from_warehouse?.name || "Unknown" })
                  ] }),
                  /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "text-indigo-500" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(Warehouse, { size: 14, className: "text-slate-400" }),
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-slate-700 dark:text-slate-300", children: transfer.to_warehouse?.name || "Unknown" })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold", children: [
                  /* @__PURE__ */ jsx(Package, { size: 12 }),
                  transfer.items?.length || transfer.items_count || 0
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-600 dark:text-slate-400", children: new Date(transfer.created_at).toLocaleDateString("en-PK", {
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
                    className: "p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all inline-flex",
                    children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                  }
                ) })
              ]
            },
            transfer.id
          );
        }) })
      ] }) }),
      transfers.links && transfers.links.length > 3 && /* @__PURE__ */ jsx("div", { className: "shrink-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm px-3 py-2", children: /* @__PURE__ */ jsx(Pagination, { links: transfers.links }) })
    ] })
  ] });
}
export {
  StockTransfers as default
};
