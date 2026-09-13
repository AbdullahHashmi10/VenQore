import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, ShoppingCart, Search, Package, Clock, CheckCircle, XCircle, Box } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { v as vq } from "./runtime-DwSFgQZq.js";
import "./OneGlanceLayout-D0x15wPs.js";
import "react-dom";
import "./plans-CxabWI_P.js";
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
function SaleOrders({ orders = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
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
      { name: "Completed", value: stats.completed, color: vq.emerald[500] },
      // Emerald
      { name: "Pending", value: stats.pending, color: vq.amber[500] },
      // Amber
      { name: "Cancelled", value: stats.cancelled, color: vq.red[500] }
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
    /* @__PURE__ */ jsx(Head, { title: tt("Order Management") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-ink tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(ShoppingCart, { className: "text-sky-500", size: 20 }),
              tt("Sales Orders")
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: tt("Tracking order pipeline & status") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-sky-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: tt("Search Orders..."),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-app border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 w-48 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-sunken p-1 rounded-xl items-center", children: [
            ["today", "this_month", "this_year"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRangeChange(r),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r ? "bg-sunken shadow-sm text-sky-600 dark:text-sky-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                children: r.replace("_", " ")
              },
              r
            )),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center ml-1 border-l border-line pl-1 gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRangeChange("custom"),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === "custom" ? "bg-sunken shadow-sm text-sky-600 dark:text-sky-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                  children: "Custom"
                }
              ),
              dateRange === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-slow", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customStart,
                    onChange: (e) => setCustomStart(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-sunken dark:text-white focus:ring-1 focus:ring-sky-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "-" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customEnd,
                    onChange: (e) => setCustomEnd(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-sunken dark:text-white focus:ring-1 focus:ring-sky-500"
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
            title: tt("Total Orders"),
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
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line bg-sunken/50 dark:bg-surface flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-secondary dark:text-ink uppercase tracking-wide", children: tt("Order List") }),
              /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-0.5 rounded-lg", children: ["all", "pending", "completed"].map((s) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setStatusFilter(s),
                  className: `px-2 py-0.5 rounded-md text-2xs uppercase font-bold transition-all ${statusFilter === s ? "bg-sunken shadow-sm text-sky-600" : "text-ink-muted"}`,
                  children: s
                },
                s
              )) })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-ink-muted bg-sunken px-2 py-1 rounded", children: [
              processedOrders.length,
              " Items"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: tt("Order #"), colKey: "order_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Date", colKey: "date", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: tt("Customer"), colKey: "customer", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Amount", colKey: "amount", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Status", colKey: "status", align: "center", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: processedOrders.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-sunken p-4 rounded-full", children: /* @__PURE__ */ jsx(Box, { size: 32, className: "text-neutral-300 opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: tt("No orders found") })
            ] }) }) }) : processedOrders.map(
              (order, idx) => /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono text-xs text-sky-600 dark:text-sky-400 font-bold", children: [
                  "#",
                  order.order_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-xs text-ink-muted", children: new Date(order.created_at).toLocaleDateString() }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-sm font-medium text-ink-secondary dark:text-ink", children: order.party?.name || tt("Walk-in Customer") }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm font-bold text-ink-secondary font-mono", children: formatCurrency(order.total_amount) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx(StatusBadge, { status: order.status }) })
              ] }, idx)
            ) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: tt("Order Status") }),
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
                  contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                  itemStyle: { color: "#fff" }
                }
              ),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
            ] }) }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Daily Volume (Last 7 Days)" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: timelineData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: timelineData, margin: { left: -20, right: 10 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.3 }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10, fill: vq.slate[400] }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10, fill: vq.slate[400] }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  cursor: { fill: vq.slate[100], opacity: 0.1 },
                  contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" }
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: vq.sky[500], radius: [4, 4, 0, 0], barSize: 20 })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No activity" }) })
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
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-line dark:hover:border-line-strong transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${textColors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted bg-sunken px-2 py-0.5 rounded-full", children: footer })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink tracking-tight mt-0.5", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none transition-transform duration-slower` })
  ] });
}
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
  const isActive = currentSort.key === colKey;
  return /* @__PURE__ */ jsx(
    "th",
    {
      onClick: () => onSort(colKey),
      className: `px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer group bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover transition-colors select-none`,
      style: { textAlign: align },
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-4xs leading-none ${isActive ? "text-sky-500" : "text-neutral-300 group-hover:text-ink-muted"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "?" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "?" })
        ] })
      ] })
    }
  );
}
function StatusBadge({ status }) {
  if (status === "completed") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-2xs font-bold rounded", children: "Completed" });
  if (status === "pending") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-2xs font-bold rounded animate-pulse", children: "Pending" });
  if (status === "cancelled") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-2xs font-bold rounded", children: "Cancelled" });
  return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-sunken text-ink-secondary dark:bg-surface dark:text-ink-muted text-2xs font-bold rounded", children: status });
}
export {
  SaleOrders as default
};
