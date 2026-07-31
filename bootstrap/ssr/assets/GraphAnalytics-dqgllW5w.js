import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { R as ReportsLayout } from "./ReportsLayout-CCBXGMSb.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingCart, CreditCard, ArrowLeft, ChevronDown, DollarSign, Calendar, TrendingDown, AlertCircle } from "lucide-react";
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
function GraphAnalytics({ trendData, paymentStatus, stats, filters, module = "sales" }) {
  const {
    store
  } = usePage().props;
  const [range, setRange] = useState(filters.range || "30_days");
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const modules = [
    { id: "sales", label: "Sales", icon: TrendingUp, color: "text-indigo-600" },
    { id: "purchases", label: "Purchases", icon: ShoppingCart, color: "text-amber-600" },
    { id: "expenses", label: "Expenses", icon: CreditCard, color: "text-rose-600" }
  ];
  const currentModule = modules.find((m) => m.id === module) || modules[0];
  const handleModuleChange = (moduleId) => {
    router.get(route("store.reports.analytics", {
      store_slug: store.slug
    }), { module: moduleId }, { preserveState: false });
    setIsModuleMenuOpen(false);
  };
  React.useEffect(() => {
    setRange(filters.range || "30_days");
    setStartDate(filters.start_date || "");
    setEndDate(filters.end_date || "");
  }, [filters]);
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.analytics", {
        store_slug: store.slug
      }), { module, range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.analytics", {
      store_slug: store.slug
    }), {
      module,
      range: "custom",
      start_date: startDate,
      end_date: endDate
    }, { preserveState: true, preserveScroll: true });
  };
  const insights = useMemo(() => {
    if (!trendData || trendData.length < 2) return { growth: 0, trend: "neutral" };
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2)).reduce((acc, curr) => acc + (curr.sales || 0), 0);
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2)).reduce((acc, curr) => acc + (curr.sales || 0), 0);
    const growth = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf * 100 : 0;
    return {
      growth: growth.toFixed(1),
      trend: growth > 0 ? "up" : growth < 0 ? "down" : "neutral"
    };
  }, [trendData]);
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: `${currentModule.label} Analytics`, children: [
    /* @__PURE__ */ jsx(Head, { title: `${currentModule.label} Analytics` }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-2 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setIsModuleMenuOpen(!isModuleMenuOpen),
                className: "flex items-center gap-2 cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxs("h1", { className: "text-base font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(currentModule.icon, { className: currentModule.color, size: 18 }),
                    " ",
                    currentModule.label,
                    " Analytics"
                  ] }),
                  /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: `text-slate-400 transition-transform ${isModuleMenuOpen ? "rotate-180" : ""}` })
                ]
              }
            ),
            isModuleMenuOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200", children: modules.map((m) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleModuleChange(m.id),
                className: `w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${module === m.id ? "bg-slate-50 dark:bg-slate-700/50 font-bold" : ""}`,
                children: [
                  /* @__PURE__ */ jsx(m.icon, { size: 16, className: m.color }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-700 dark:text-slate-200", children: m.label })
                ]
              },
              m.id
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl", children: [
            { id: "today", label: "Today" },
            { id: "7_days", label: "7 Days" },
            { id: "30_days", label: "30 Days" },
            { id: "year", label: "Year" },
            { id: "custom", label: "Custom" }
          ].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${range === opt.id ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-[10px] font-bold", children: "TO" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyCustomRange,
                className: "px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase transition-colors shadow-sm",
                children: "Apply"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Revenue",
            value: formatCurrency(stats.total_revenue),
            icon: /* @__PURE__ */ jsx(DollarSign, {}),
            color: "indigo"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Transactions",
            value: stats.total_transactions,
            icon: /* @__PURE__ */ jsx(CreditCard, {}),
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Avg Ticket Size",
            value: formatCurrency(stats.avg_ticket),
            icon: /* @__PURE__ */ jsx(TrendingUp, {}),
            color: "emerald"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Highest Sale",
            value: formatCurrency(stats.max_sale),
            icon: /* @__PURE__ */ jsx(Calendar, {}),
            color: "amber"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden flex-[1.2]", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2 shrink-0", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight", children: "Sales Trend Analysis" }) }),
            /* @__PURE__ */ jsxs("div", { className: `px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${insights.trend === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" : insights.trend === "down" ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30" : "bg-slate-50 text-slate-600 dark:bg-slate-800"}`, children: [
              insights.trend === "up" ? /* @__PURE__ */ jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 12 }),
              Math.abs(insights.growth),
              "% Growth"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(AreaChart, { data: trendData, margin: { top: 5, right: 0, left: 0, bottom: 0 }, children: [
            /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorSales", x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#6366f1", stopOpacity: 0.6 }),
              /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#6366f1", stopOpacity: 0 })
            ] }) }),
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#e2e8f0", opacity: 0.3 }),
            /* @__PURE__ */ jsx(
              XAxis,
              {
                dataKey: "name",
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 10, fill: "#94a3b8" },
                dy: 5
              }
            ),
            /* @__PURE__ */ jsx(
              YAxis,
              {
                axisLine: false,
                tickLine: false,
                tick: { fontSize: 10, fill: "#94a3b8" },
                tickFormatter: (val) => `${val / 1e3}k`
              }
            ),
            /* @__PURE__ */ jsx(
              Tooltip,
              {
                formatter: (val) => formatCurrency(val),
                contentStyle: { backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #334155", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", color: "#f8fafc" },
                itemStyle: { color: "#f8fafc" },
                labelStyle: { color: "#94a3b8", fontSize: "10px", marginBottom: "4px" }
              }
            ),
            /* @__PURE__ */ jsx(
              Area,
              {
                type: "monotone",
                dataKey: "sales",
                stroke: "#6366f1",
                strokeWidth: 2,
                fillOpacity: 1,
                fill: "url(#colorSales)",
                activeDot: { r: 4, strokeWidth: 0, fill: "#fff" }
              }
            )
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex-1 flex flex-col", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-2 shrink-0", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-800 dark:text-white uppercase tracking-tight", children: "Payment Recovery" }) }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center justify-between min-h-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative h-full flex-1", children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: paymentStatus,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: "65%",
                    outerRadius: "85%",
                    paddingAngle: 4,
                    dataKey: "value",
                    stroke: "none",
                    cornerRadius: 4,
                    children: paymentStatus.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.fill }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    formatter: (val) => formatCurrency(val),
                    contentStyle: { backgroundColor: "#1e293b", borderRadius: "8px", border: "1px solid #334155", color: "#f8fafc" },
                    itemStyle: { color: "#f8fafc" }
                  }
                )
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none pb-2", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5", children: "Recovery" }),
                /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: [
                  stats.total_revenue > 0 ? Math.round(paymentStatus[0].value / stats.total_revenue * 100) : 0,
                  "%"
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center gap-3 pr-6 flex-[1.2]", children: [
              paymentStatus.map((status, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: status.fill } }),
                  /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: status.name }) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white", children: formatCurrency(status.value) }) })
              ] }, idx)),
              /* @__PURE__ */ jsxs("div", { className: "mt-1 p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(AlertCircle, { size: 14, className: "text-indigo-600 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-indigo-700 dark:text-indigo-300 leading-snug", children: [
                  /* @__PURE__ */ jsx("strong", { children: "Tip:" }),
                  " Outstanding payments typically clear within 7 days."
                ] })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-800/50 opacity-50 group-hover:w-24 transition-all duration-500" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`, children: React.cloneElement(icon, { size: 16 }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide", children: title })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 text-right", children: /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-800 dark:text-white tracking-tight", children: value }) })
  ] });
}
export {
  GraphAnalytics as default
};
