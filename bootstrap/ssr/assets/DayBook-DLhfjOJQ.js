import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Building2, Search, Download, TrendingUp, TrendingDown, Wallet, ArrowRightLeft, BrainCircuit, Sparkles } from "lucide-react";
import { R as ReportsLayout } from "./ReportsLayout-DYtHXvvS.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar, Cell } from "recharts";
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
function DayBook({ transactions = [], stats = {}, filters = {}, date }) {
  const {
    store
  } = usePage().props;
  const [dateRange, setDateRange] = useState(filters.range || "today");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(filters.range === "custom");
  const [customStart, setCustomStart] = useState(filters.start_date || "");
  const [customEnd, setCustomEnd] = useState(filters.end_date || "");
  const processedTransactions = useMemo(() => {
    let data = [...transactions];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (item) => (item.ref || "").toLowerCase().includes(lowerQ) || (item.desc || "").toLowerCase().includes(lowerQ) || (item.type || "").toLowerCase().includes(lowerQ)
      );
    }
    return data;
  }, [transactions, searchQuery]);
  const aiInsights = useMemo(() => {
    if (transactions.length === 0) {
      return [{
        type: "neutral",
        title: "Data Required",
        message: "Growth Engine needs transaction data to analyze your daily cash flow."
      }];
    }
    const totalIn = stats.total_in || 0;
    const totalOut = stats.total_out || 0;
    const netCash = totalIn - totalOut;
    const ratio = totalOut > 0 ? totalIn / totalOut : totalIn > 0 ? 100 : 0;
    const insights = [];
    if (netCash > 0) {
      insights.push({
        type: "success",
        title: "Positive Cash Flow",
        message: `You are generating surplus cash (+${formatCurrency(netCash, store)}). Good day for reserves.`
      });
    } else if (netCash < 0) {
      insights.push({
        type: "warning",
        title: "Cash Burn Alert",
        message: `Outflow exceeds inflow by ${formatCurrency(Math.abs(netCash), store)}. Monitor expenses closely.`
      });
    }
    if (transactions.length > 50) {
      insights.push({
        type: "neutral",
        title: "High Activity",
        message: `High transaction volume (${transactions.length}) detected today. Ensure staffing is adequate.`
      });
    }
    if (ratio > 1.5) {
      insights.push({
        type: "success",
        title: "High Efficiency",
        message: "Inflow is more than 1.5x of outflow. Strong operational efficiency."
      });
    }
    return insights;
  }, [transactions, stats]);
  const chartData = useMemo(() => {
    const typeMap = {};
    transactions.forEach((t) => {
      const type = t.type || "Other";
      if (!typeMap[type]) typeMap[type] = 0;
      typeMap[type] += parseFloat(t.amount || 0);
    });
    return Object.keys(typeMap).map((type) => ({
      name: type,
      value: typeMap[type]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      router.get(route("store.reports.day-book", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    if (customStart && customEnd) {
      router.get(route("store.reports.day-book", {
        store_slug: store.slug
      }), {
        range: "custom",
        start_date: customStart,
        end_date: customEnd
      }, { preserveState: true, preserveScroll: true });
    }
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Day Book Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Day Book" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-[1600px] mx-auto min-h-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Building2, { className: "text-indigo-500" }),
            "Day Book Analysis"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Daily cash flow, sales, and expense tracking" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search transactions...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 w-64"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg", children: ["today", "yesterday", "this_week", "custom"].map((r) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(r),
              className: `px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`,
              children: r === "today" ? "Today" : r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
            },
            r
          )) }),
          showCustomDate && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg animate-in slide-in-from-right-5 fade-in duration-300", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customStart,
                onChange: (e) => setCustomStart(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customEnd,
                onChange: (e) => setCustomEnd(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyCustomRange,
                className: "bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs",
                children: "Go"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { className: "p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsx(Download, { size: 18 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Inflow",
            value: stats.total_in,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(TrendingUp, { size: 20, className: "text-white" }),
            color: "bg-emerald-500",
            store
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Outflow",
            value: stats.total_out,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(TrendingDown, { size: 20, className: "text-white" }),
            color: "bg-rose-500",
            store
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Net Cash Flow",
            value: Math.abs(stats.net_cash),
            isCurrency: true,
            prefix: stats.net_cash >= 0 ? "+" : "-",
            icon: /* @__PURE__ */ jsx(Wallet, { size: 20, className: "text-white" }),
            color: stats.net_cash >= 0 ? "bg-indigo-500" : "bg-amber-500",
            store,
            subtext: stats.net_cash >= 0 ? "Surplus" : "Deficit"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-slate-700 dark:text-slate-200", children: "Transaction Log" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full", children: [
              processedTransactions.length,
              " Entries"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Reference" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Description" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right", children: "Amount" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
              processedTransactions.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold uppercase px-2 py-1 rounded-full ${item.flow === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`, children: item.type }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-mono text-slate-600 dark:text-slate-400", children: item.ref || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-medium text-slate-700 dark:text-slate-300", children: item.desc }),
                /* @__PURE__ */ jsxs("td", { className: `p-3 text-sm font-bold text-right ${item.flow === "in" ? "text-emerald-600" : "text-rose-600"}`, children: [
                  item.flow === "in" ? "+" : "-",
                  " ",
                  formatCurrency(item.amount, store)
                ] })
              ] }, idx)),
              processedTransactions.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "h-64 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center opacity-60", children: [
                /* @__PURE__ */ jsx(ArrowRightLeft, { size: 48, className: "mb-2 stroke-1" }),
                /* @__PURE__ */ jsx("p", { children: "No transactions found for this period" })
              ] }) }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-500", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(BrainCircuit, { className: "text-indigo-200", size: 20 }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-indigo-100", children: "Growth Engine AI" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              aiInsights.map((insight, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-3 text-xs border border-white/10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                  /* @__PURE__ */ jsx(Sparkles, { size: 12, className: insight.type === "warning" || insight.type === "critical" ? "text-rose-300" : "text-emerald-300" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: insight.title })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "opacity-90 leading-relaxed", children: insight.message })
              ] }, idx)),
              aiInsights.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-xs opacity-70 italic", children: "Analyzing transactions..." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Transaction Volume" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { left: 0, right: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, opacity: 0.1 }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 10, fill: "#94a3b8" }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
                  cursor: { fill: "#f1f5f9", opacity: 0.4 },
                  formatter: (value) => formatCurrency(value, store)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: ["#6366f1", "#ec4899", "#10b981", "#f59e0b"][index % 4] }, `cell-${index}`)) })
            ] }) }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, isCurrency = false, prefix = "", subtext, store }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1", children: title }),
      /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-black text-slate-800 dark:text-white", children: [
        prefix,
        isCurrency ? formatCurrency(value || 0, store) : value || 0
      ] }),
      subtext && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-1", children: subtext })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`, children: icon })
  ] });
}
export {
  DayBook as default
};
