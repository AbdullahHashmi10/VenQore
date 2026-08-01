import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-DYtHXvvS.js";
import { ArrowLeft, FileSpreadsheet, Search, DollarSign, TrendingUp, Percent } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "./OneGlanceLayout-KMWHwZqK.js";
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
function BillWiseProfit({ invoices = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "profit", direction: "desc" });
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const normalizedInvoices = useMemo(() => {
    return invoices.map((inv) => ({
      ...inv,
      invoice_number: inv.reference_number || inv.id || "",
      revenue: Number(inv.net_revenue || 0),
      cost: Number(inv.cogs || 0),
      profit: Number(inv.gross_profit || 0),
      margin: Number(inv.margin_pct || 0)
    }));
  }, [invoices]);
  const processedInvoices = useMemo(() => {
    let data = [...normalizedInvoices];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (inv) => inv.invoice_number.toString().toLowerCase().includes(lowerQ)
      );
    }
    data.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];
      if (sortBy.key === "margin") {
        valA = a.revenue > 0 ? a.profit / a.revenue * 100 : 0;
        valB = b.revenue > 0 ? b.profit / b.revenue * 100 : 0;
      }
      if (valA < valB) return sortBy.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [invoices, searchQuery, sortBy]);
  const stats = useMemo(() => {
    const totalRev = processedInvoices.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = processedInvoices.reduce((acc, curr) => acc + curr.profit, 0);
    const count = processedInvoices.length;
    const avgMargin = totalRev > 0 ? totalProfit / totalRev * 100 : 0;
    return {
      revenue: totalRev,
      profit: totalProfit,
      count,
      margin: avgMargin
    };
  }, [processedInvoices]);
  const marginDistribution = useMemo(() => {
    let high = 0, medium = 0, low = 0, loss = 0;
    processedInvoices.forEach((inv) => {
      const m = inv.revenue > 0 ? inv.profit / inv.revenue * 100 : 0;
      if (m < 0) loss++;
      else if (m < 10) low++;
      else if (m < 25) medium++;
      else high++;
    });
    return [
      { name: "High Margin (>25%)", value: high, color: "#10b981" },
      // Emerald
      { name: "Healthy (10-25%)", value: medium, color: "#3b82f6" },
      // Blue
      { name: "Low Margin (<10%)", value: low, color: "#f59e0b" },
      // Amber
      { name: "Loss Making", value: loss, color: "#ef4444" }
      // Red
    ].filter((d) => d.value > 0);
  }, [processedInvoices]);
  const topBills = processedInvoices.slice(0, 10).map((inv) => ({
    name: "#" + inv.invoice_number,
    profit: inv.profit,
    revenue: inv.revenue
  }));
  const handleSort = (key) => {
    setSortBy((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.bill-wise-profit", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.bill-wise-profit", {
      store_slug: store.slug
    }), {
      range: "custom",
      start_date: customStart,
      end_date: customEnd
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Bill-wise Profit Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Bill-wise Profit Report" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileSpreadsheet, { className: "text-indigo-500", size: 20 }),
              "Bill-wise Profit"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Profitability analysis per invoice" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search Invoice #...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-48 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center", children: [
            ["today", "this_month", "this_year"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRangeChange(r),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                children: r.replace("_", " ")
              },
              r
            )),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRangeChange("custom"),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === "custom" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
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
                    className: "p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customEnd,
                    onChange: (e) => setCustomEnd(e.target.value),
                    className: "p-1 px-2 text-[10px] rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 10, className: "rotate-180" }) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Profit",
            value: formatCurrency(stats.profit, store),
            icon: /* @__PURE__ */ jsx(DollarSign, { size: 18 }),
            color: "emerald",
            footer: `${stats.margin.toFixed(1)}% Avg Margin`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Revenue",
            value: formatCurrency(stats.revenue, store),
            icon: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }),
            color: "indigo"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Avg Ticket Profit",
            value: stats.count > 0 ? formatCurrency(stats.profit / stats.count, store) : formatCurrency(0, store),
            icon: /* @__PURE__ */ jsx(Percent, { size: 18 }),
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Invoices Analyzed",
            value: stats.count,
            icon: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }),
            color: "amber"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide", children: "Invoice Details" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded", children: [
              processedInvoices.length,
              " Bills"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: "Invoice #", colKey: "invoice_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Revenue", colKey: "revenue", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Cost", colKey: "cost", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Profit", colKey: "profit", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Margin %", colKey: "margin", align: "right", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: processedInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400 gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-100 dark:bg-slate-800 p-4 rounded-full", children: /* @__PURE__ */ jsx(Search, { size: 32, className: "text-slate-300 opacity-50" }) }),
              /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: "No invoices found" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Try adjusting your filters" })
              ] })
            ] }) }) }) : processedInvoices.map((inv, idx) => {
              const margin = inv.revenue > 0 ? inv.profit / inv.revenue * 100 : 0;
              return /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-sm font-mono border-l-4 border-transparent group-hover:border-indigo-500", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 mr-1", children: "#" }),
                  inv.invoice_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm text-slate-600 dark:text-slate-400", children: formatCurrency(inv.revenue, store) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm text-slate-500 dark:text-slate-500", children: formatCurrency(inv.cost, store) }),
                /* @__PURE__ */ jsx("td", { className: `px-6 py-3 text-right text-sm font-bold ${inv.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`, children: formatCurrency(inv.profit, store) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: /* @__PURE__ */ jsx(MarginBadge, { margin }) })
              ] }, idx);
            }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col relative", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Margin Health" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative w-full h-full min-h-0", children: marginDistribution.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: marginDistribution,
                    dataKey: "value",
                    cx: "50%",
                    cy: "50%",
                    innerRadius: "50%",
                    outerRadius: "70%",
                    paddingAngle: 5,
                    cornerRadius: 4,
                    stroke: "none",
                    children: marginDistribution.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    formatter: (val) => [val + " Invoices", "Count"],
                    contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" },
                    itemStyle: { color: "#fff" }
                  }
                ),
                /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none pb-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase", children: "Avg" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-700 dark:text-white", children: [
                  stats.margin.toFixed(1),
                  "%"
                ] })
              ] }) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No margin data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Top Profitable Bills" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: topBills.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: topBills, layout: "vertical", margin: { left: 0, right: 10, top: 0, bottom: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.3 }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", width: 60, tick: { fontSize: 10, fill: "#94a3b8" }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  cursor: { fill: "#f1f5f9", opacity: 0.1 },
                  contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" },
                  formatter: (value) => formatCurrency(value, store)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "profit", fill: "#10b981", radius: [0, 4, 4, 0], barSize: 20, background: { fill: "transparent" } })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No data" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, footer }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
  };
  const bgColors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${colors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full", children: footer })
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
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-[8px] leading-none ${isActive ? "text-indigo-500" : "text-slate-300 group-hover:text-slate-400"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "▲" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "▼" })
        ] })
      ] })
    }
  );
}
function MarginBadge({ margin }) {
  if (margin < 0) {
    return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold", children: "Loss" });
  }
  if (margin < 10) {
    return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold", children: [
      margin.toFixed(1),
      "%"
    ] });
  }
  if (margin > 25) {
    return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold", children: [
      "High ",
      margin.toFixed(1),
      "%"
    ] });
  }
  return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold", children: [
    margin.toFixed(1),
    "%"
  ] });
}
export {
  BillWiseProfit as default
};
