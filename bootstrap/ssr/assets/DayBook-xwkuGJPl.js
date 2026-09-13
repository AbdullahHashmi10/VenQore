import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Building2, Search, Download, TrendingUp, TrendingDown, Wallet, ArrowRightLeft, BrainCircuit, Sparkles } from "lucide-react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { v as vq, s as series } from "./runtime-DwSFgQZq.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, Tooltip, Bar, Cell } from "recharts";
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
import "./terms-DwYjlWsV.js";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
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
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Building2, { className: "text-brand-500" }),
            "Day Book Analysis"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Daily cash flow, sales, and expense tracking" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search transactions...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-4 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-brand-500 w-64"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-lg", children: ["today", "yesterday", "this_week", "custom"].map((r) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(r),
              className: `px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: r === "today" ? "Today" : r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
            },
            r
          )) }),
          showCustomDate && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-sunken p-1 rounded-lg animate-in slide-in-from-right-5 fade-in duration-slow", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customStart,
                onChange: (e) => setCustomStart(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-ink-secondary"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customEnd,
                onChange: (e) => setCustomEnd(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-ink-secondary"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyCustomRange,
                className: "bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded text-xs",
                children: "Go"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { className: "p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg border border-line", children: /* @__PURE__ */ jsx(Download, { size: 18 }) })
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
            color: stats.net_cash >= 0 ? "bg-brand-500" : "bg-amber-500",
            store,
            subtext: stats.net_cash >= 0 ? "Surplus" : "Deficit"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink-secondary dark:text-ink", children: "Transaction Log" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted bg-sunken px-2 py-1 rounded-full", children: [
              processedTransactions.length,
              " Entries"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Type" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Reference" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Description" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right", children: "Amount" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
              processedTransactions.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: `text-2xs font-bold uppercase px-2 py-1 rounded-full ${item.flow === "in" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`, children: item.type }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-mono text-ink-secondary", children: item.ref || "-" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-medium text-ink-secondary", children: item.desc }),
                /* @__PURE__ */ jsxs("td", { className: `p-3 text-sm font-bold text-right ${item.flow === "in" ? "text-emerald-600" : "text-rose-600"}`, children: [
                  item.flow === "in" ? "+" : "-",
                  " ",
                  formatCurrency(item.amount, store)
                ] })
              ] }, idx)),
              processedTransactions.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "h-64 text-center text-ink-muted", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center opacity-60", children: [
                /* @__PURE__ */ jsx(ArrowRightLeft, { size: 48, className: "mb-2 stroke-1" }),
                /* @__PURE__ */ jsx("p", { children: "No transactions found for this period" })
              ] }) }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-brand rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-slower", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(BrainCircuit, { className: "text-brand-200", size: 20 }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-brand-100", children: "Growth Engine AI" })
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
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Transaction Volume" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { left: 0, right: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, opacity: 0.1 }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 10, fill: vq.slate[400] }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
                  cursor: { fill: vq.slate[100], opacity: 0.4 },
                  formatter: (value) => formatCurrency(value, store)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: series.light[index % 8] }, `cell-${index}`)) })
            ] }) }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, isCurrency = false, prefix = "", subtext, store }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-ink-muted uppercase tracking-wider mb-1", children: title }),
      /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold text-ink", children: [
        prefix,
        isCurrency ? formatCurrency(value || 0, store) : value || 0
      ] }),
      subtext && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-1", children: subtext })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg transition-transform`, children: icon })
  ] });
}
export {
  DayBook as default
};
