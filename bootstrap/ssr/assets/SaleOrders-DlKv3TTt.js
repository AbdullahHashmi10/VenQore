import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-CCBXGMSb.js";
import { ArrowLeft, ShoppingCart, Search, Package, Clock, CheckCircle, XCircle, Box } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./OneGlanceLayout-BqRkhJQJ.js";
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
function SaleOrders({ orders = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "date", direction: "desc" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const processedOrders = useMemo(() => {
    let data = [...orders];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (order) => order.order_number.toString().toLowerCase().includes(lowerQ) || (order.party?.name || "").toLowerCase().includes(lowerQ)
      );
    }
    if (statusFilter !== "all") {
      data = data.filter((order) => order.status === statusFilter);
    }
    data.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];
      if (sortBy.key === "amount") {
        valA = Number(a.total_amount);
        valB = Number(b.total_amount);
      } else if (sortBy.key === "date") {
        valA = new Date(a.created_at);
        valB = new Date(b.created_at);
      } else if (sortBy.key === "customer") {
        valA = a.party?.name || "";
        valB = b.party?.name || "";
      }
      if (valA < valB) return sortBy.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [orders, searchQuery, sortBy, statusFilter]);
  const stats = useMemo(() => {
    const total = processedOrders.length;
    const totalValue = processedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    let pending = 0, completed = 0, cancelled = 0;
    processedOrders.forEach((o) => {
      if (o.status === "pending") pending++;
      else if (o.status === "completed") completed++;
      else cancelled++;
    });
    return { total, totalValue, pending, completed, cancelled };
  }, [processedOrders]);
  const statusData = useMemo(() => {
    return [
      { name: "Completed", value: stats.completed, color: "#10b981" },
      // Emerald
      { name: "Pending", value: stats.pending, color: "#f59e0b" },
      // Amber
      { name: "Cancelled", value: stats.cancelled, color: "#ef4444" }
      // Red
    ].filter((d) => d.value > 0);
  }, [stats]);
  const timelineData = useMemo(() => {
    const map = {};
    processedOrders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!map[date]) map[date] = 0;
      map[date] += 1;
    });
    let arr = Object.keys(map).map((date) => ({ date, count: map[date] }));
    if (arr.length > 7) arr = arr.slice(arr.length - 7);
    return arr;
  }, [processedOrders]);
  const handleSort = (key) => {
    setSortBy((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.sale-orders", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.sale-orders", {
      store_slug: store.slug
    }), {
      range: "custom",
      start_date: customStart,
      end_date: customEnd
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Sales Orders Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Order Management" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "text-sky-500", size: 20 }),
              "Sales Orders"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Tracking order pipeline & status" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search Orders...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 w-48 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center", children: [
            ["today", "this_month", "this_year"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRangeChange(r),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r ? "bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                children: r.replace("_", " ")
              },
              r
            )),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRangeChange("custom"),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === "custom" ? "bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                  children: "Custom"
                }
              ),
              dateRange === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-300", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customStart,
                    onChange: (e) => setCustomStart(e.target.value),
                    className: "p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-sky-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customEnd,
                    onChange: (e) => setCustomEnd(e.target.value),
                    className: "p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-sky-500"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 10, className: "rotate-180" }) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Orders",
            value: stats.total,
            icon: /* @__PURE__ */ jsx(Package, { size: 18 }),
            color: "sky",
            footer: formatCurrency(stats.totalValue)
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Pending Processing",
            value: stats.pending,
            icon: /* @__PURE__ */ jsx(Clock, { size: 18 }),
            color: "amber",
            footer: "Needs Action"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Completed",
            value: stats.completed,
            icon: /* @__PURE__ */ jsx(CheckCircle, { size: 18 }),
            color: "emerald",
            footer: `${stats.total > 0 ? (stats.completed / stats.total * 100).toFixed(0) : 0}% Completion`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Cancelled",
            value: stats.cancelled,
            icon: /* @__PURE__ */ jsx(XCircle, { size: 18 }),
            color: "rose"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide", children: "Order List" }),
              /* @__PURE__ */ jsx("div", { className: "flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg", children: ["all", "pending", "completed"].map((s) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setStatusFilter(s),
                  className: `px-2 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all ${statusFilter === s ? "bg-white dark:bg-slate-500 shadow-sm text-sky-600" : "text-slate-500 dark:text-slate-400"}`,
                  children: s
                },
                s
              )) })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded", children: [
              processedOrders.length,
              " Items"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: "Order #", colKey: "order_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Date", colKey: "date", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Customer", colKey: "customer", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Amount", colKey: "amount", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Status", colKey: "status", align: "center", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: processedOrders.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400 gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-100 dark:bg-slate-800 p-4 rounded-full", children: /* @__PURE__ */ jsx(Box, { size: 32, className: "text-slate-300 opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: "No orders found" })
            ] }) }) }) : processedOrders.map(
              (order, idx) => /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono text-xs text-sky-600 dark:text-sky-400 font-bold", children: [
                  "#",
                  order.order_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-xs text-slate-500", children: new Date(order.created_at).toLocaleDateString() }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200", children: order.party?.name || "Walk-in Customer" }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm font-bold text-slate-700 dark:text-slate-300 font-mono", children: formatCurrency(order.total_amount) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx(StatusBadge, { status: order.status }) })
              ] }, idx)
            ) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Order Status" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0 relative", children: statusData.length > 0 ? /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
              /* @__PURE__ */ jsx(
                Pie,
                {
                  data: statusData,
                  dataKey: "value",
                  cx: "50%",
                  cy: "50%",
                  innerRadius: "50%",
                  outerRadius: "70%",
                  paddingAngle: 5,
                  children: statusData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`))
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" },
                  itemStyle: { color: "#fff" }
                }
              ),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
            ] }) }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Daily Volume (Last 7 Days)" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: timelineData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: timelineData, margin: { left: -20, right: 10 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.3 }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10, fill: "#94a3b8" }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10, fill: "#94a3b8" }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  cursor: { fill: "#f1f5f9", opacity: 0.1 },
                  contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "#0ea5e9", radius: [4, 4, 0, 0], barSize: 20 })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No activity" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, footer }) {
  const bgColors = {
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500"
  };
  const textColors = {
    sky: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${textColors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full", children: footer })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none group-hover:scale-110 transition-transform duration-500` })
  ] });
}
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
  const isActive = currentSort.key === colKey;
  return /* @__PURE__ */ jsx(
    "th",
    {
      onClick: () => onSort(colKey),
      className: `px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none`,
      style: { textAlign: align },
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-[8px] leading-none ${isActive ? "text-sky-500" : "text-slate-300 group-hover:text-slate-400"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "?" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "?" })
        ] })
      ] })
    }
  );
}
function StatusBadge({ status }) {
  if (status === "completed") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded", children: "Completed" });
  if (status === "pending") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded animate-pulse", children: "Pending" });
  if (status === "cancelled") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] font-bold rounded", children: "Cancelled" });
  return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold rounded", children: status });
}
export {
  SaleOrders as default
};
