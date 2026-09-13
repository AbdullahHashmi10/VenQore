import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Activity, PieChart, HelpCircle, ShieldCheck, AlertCircle, Zap, Target, Lightbulb, ArrowUpRight, Loader2, X, Info } from "lucide-react";
import { ResponsiveContainer, PieChart as PieChart$1, Pie, Cell, Tooltip, Legend } from "recharts";
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
function ProfitLoss({ stats = {}, filters = {} }) {
  const {
    store
  } = usePage().props;
  const tt = useTermText();
  const { props } = usePage();
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const revenue = parseFloat(stats.revenue || 0);
  const cogs = parseFloat(stats.cogs || 0);
  const expenses = parseFloat(stats.expenses || 0);
  const grossProfit = parseFloat(stats.gross_profit || 0);
  const netProfit = parseFloat(stats.net_profit || 0);
  const grossMargin = revenue ? (grossProfit / revenue * 100).toFixed(1) : 0;
  const netMargin = revenue ? (netProfit / revenue * 100).toFixed(1) : 0;
  const cogsRatio = revenue ? (cogs / revenue * 100).toFixed(1) : 0;
  const expenseRatio = revenue ? (expenses / revenue * 100).toFixed(1) : 0;
  const breakdownData = [
    { name: "COGS", value: cogs, color: vq.amber[500] },
    // Amber
    { name: "Expenses", value: expenses, color: vq.red[500] },
    // Red
    { name: "Net Profit", value: Math.max(0, netProfit), color: vq.emerald[500] }
    // Emerald
  ].filter((d) => d.value > 0);
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.profit-loss", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.profit-loss", {
      store_slug: store.slug
    }), {
      range: "custom",
      start_date: startDate,
      end_date: endDate
    }, { preserveState: true, preserveScroll: true });
  };
  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const insights = [];
      if (grossMargin < 20) {
        insights.push({ type: "danger", title: "Low Gross Margin", text: tt("Your production costs (COGS) are eating most of your revenue. Negotiate better rates with suppliers.") });
      } else {
        insights.push({ type: "success", title: "Healthy Gross Margin", text: "Your core product pricing is solid. You have good room for overheads." });
      }
      if (expenseRatio > 40) {
        insights.push({ type: "warning", title: "High Overheads", text: `Your operating expenses are ${expenseRatio}% of revenue. This is higher than the recommended 30% benchmark.` });
      }
      if (revenue === 0) {
        insights.push({ type: "neutral", title: "No Data", text: "Start making sales to unlock deeper insights." });
      } else if (netProfit > 0) {
        insights.push({ type: "opportunity", title: "Growth Opportunity", text: "You are profitable! Consider reinvesting 20% of net profit into marketing to accelerate growth." });
      }
      setAnalysisResult({
        score: Math.max(0, Math.min(100, parseFloat(netMargin) + 50)),
        // Rough score algo
        insights
      });
      setIsAnalyzing(false);
    }, 2e3);
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Profit & Loss Statement", children: [
    /* @__PURE__ */ jsx(Head, { title: "Profit & Loss" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-ink tracking-tight flex items-center gap-2", children: [
              "Profit & Loss ",
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted font-medium text-sm hidden sm:inline", children: "Statement" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: "Financial performance for the selected period" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl overflow-x-auto max-w-full shrink-0", children: [
            { id: "this_month", label: "This Month" },
            { id: "last_month", label: "Last Month" },
            { id: "this_year", label: "This Year" },
            { id: "custom", label: "Custom" }
          ].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${range === opt.id ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1.5 rounded-xl w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary w-full sm:w-auto"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs font-bold text-center shrink-0", children: "TO" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary w-full sm:w-auto"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyCustomRange,
                className: "px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm w-full sm:w-auto text-center",
                children: "Apply"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          RatioCard,
          {
            title: "Net Profit",
            value: formatCurrency(netProfit, store),
            subtitle: `${netMargin}% of Revenue`,
            color: netProfit >= 0 ? "emerald" : "rose",
            icon: /* @__PURE__ */ jsx(DollarSign, {})
          }
        ),
        /* @__PURE__ */ jsx(
          RatioCard,
          {
            title: "Gross Profit",
            value: formatCurrency(grossProfit, store),
            subtitle: `${grossMargin}% Margin`,
            color: "blue",
            icon: /* @__PURE__ */ jsx(TrendingUp, {})
          }
        ),
        /* @__PURE__ */ jsx(
          RatioCard,
          {
            title: "Total Expenses",
            value: formatCurrency(expenses, store),
            subtitle: `${expenseRatio}% of Revenue`,
            color: "rose",
            icon: /* @__PURE__ */ jsx(TrendingDown, {})
          }
        ),
        /* @__PURE__ */ jsx(
          RatioCard,
          {
            title: "Revenue Efficiency",
            value: `${(100 - expenseRatio - cogsRatio).toFixed(1)}%`,
            subtitle: "Retained from Sales",
            color: "indigo",
            icon: /* @__PURE__ */ jsx(Activity, {})
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-5 border-b border-line flex justify-between items-center bg-sunken/50 dark:bg-surface", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-base sm:text-lg font-bold text-ink", children: "Income Statement" }),
            /* @__PURE__ */ jsx("button", { className: "text-2xs sm:text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1.5 rounded-lg transition-colors", children: "Download PDF" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto p-1 sm:p-2", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs sm:text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-2xs text-ink-muted uppercase bg-app", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-3 sm:px-6 py-2 sm:py-3 rounded-l-lg", children: "Description" }),
              /* @__PURE__ */ jsx("th", { className: "px-3 sm:px-6 py-2 sm:py-3 text-right", children: "Amount" }),
              /* @__PURE__ */ jsx("th", { className: "px-3 sm:px-6 py-2 sm:py-3 text-right rounded-r-lg", children: "% Sales" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
              /* @__PURE__ */ jsx(
                StatementRow,
                {
                  label: "Sales Revenue",
                  amount: revenue,
                  percent: 100,
                  info: "Total income from goods sold before any deductions.",
                  isHeader: true,
                  store
                }
              ),
              /* @__PURE__ */ jsx(
                StatementRow,
                {
                  label: "Cost of Goods Sold (COGS)",
                  amount: -cogs,
                  percent: cogsRatio,
                  info: "Direct costs attributable to the production of the goods sold (e.g., material cost).",
                  isNegative: true,
                  store,
                  action: () => props.meta?.cogs_account_id && router.visit(route("store.reports.account-ledger", {
                    store_slug: store.slug,
                    account_id: props.meta.cogs_account_id,
                    start_date: filters.start_date,
                    end_date: filters.end_date
                  }))
                }
              ),
              /* @__PURE__ */ jsx(
                SummaryRow,
                {
                  label: "Gross Profit",
                  amount: grossProfit,
                  type: "subtotal",
                  info: "Revenue minus COGS. Indicates how efficiently you produce goods.",
                  store
                }
              ),
              /* @__PURE__ */ jsx(
                StatementRow,
                {
                  label: "Operating Expenses",
                  amount: -expenses,
                  percent: expenseRatio,
                  info: "Expenses incurred in normal business operations (Rent, Utilities, Salaries).",
                  isNegative: true,
                  store
                }
              ),
              /* @__PURE__ */ jsx(
                SummaryRow,
                {
                  label: "Net Profit / (Loss)",
                  amount: netProfit,
                  type: "total",
                  info: "The 'Bottom Line'. Total earnings after subtracting all expenses and costs.",
                  store
                }
              )
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-5 rounded-2xl border border-line shadow-sm flex-1 min-h-[300px] flex flex-col", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(PieChart, { size: 14 }),
              " Revenue Distribution"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: breakdownData,
                    cx: "50%",
                    cy: "50%",
                    innerRadius: 60,
                    outerRadius: 80,
                    paddingAngle: 5,
                    dataKey: "value",
                    children: breakdownData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    formatter: (val) => formatCurrency(val, store),
                    contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                    itemStyle: { color: "#fff" }
                  }
                ),
                /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px" } })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none pb-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-bold uppercase", children: "Net Margin" }),
                /* @__PURE__ */ jsxs("p", { className: `text-xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`, children: [
                  netMargin,
                  "%"
                ] })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-24 h-24 bg-brand-500/20 rounded-full blur-xl translate-y-1/3 -translate-x-1/3" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Health Check"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsxs("p", { children: [
                  "Your ",
                  /* @__PURE__ */ jsx("strong", { className: "text-white", children: "OpEx Ratio" }),
                  " is ",
                  expenseRatio,
                  "%. ",
                  expenseRatio > 40 ? "Consider reducing overheads." : "This is healthy."
                ] }),
                /* @__PURE__ */ jsx("div", { className: "mt-2 pt-2 border-t border-white/10", children: netMargin > 20 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-emerald-300 font-bold", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Excellent Health"
                ] }) : netMargin > 5 ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-blue-300 font-bold", children: [
                  /* @__PURE__ */ jsx(Activity, { size: 14 }),
                  " Stable"
                ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-rose-300 font-bold", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { size: 14 }),
                  " Needs Attention"
                ] }) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400", children: [
            /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
            " Growth Engine"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Target, { size: 12 }),
                " Profit Optimization"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-neutral-300 leading-relaxed", children: netMargin < 10 ? "Your margin is tight. Focus on high-margin items and reduce 'Loss Leaders' this week." : "Strong margins! Reinvest surplus into marketing best-sellers to scale volume." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-amber-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Lightbulb, { size: 12 }),
                " Smart Insight"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-1xs text-neutral-300 leading-relaxed", children: [
                "Increasing your average ticket size by just ",
                /* @__PURE__ */ jsx("strong", { children: "10%" }),
                " would add",
                /* @__PURE__ */ jsx("strong", { className: "text-white ml-1", children: formatCurrency(revenue * 0.1, store) }),
                " to your revenue without new customers."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 group cursor-pointer hover:bg-white/10 transition-colors", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-brand-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 }),
                " Action Plan"
              ] }),
              /* @__PURE__ */ jsxs("ul", { className: "text-2xs text-neutral-300 space-y-1.5 mt-2", children: [
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500" }),
                  tt("Review Supplier Costs")
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-brand-500" }),
                  "Audit Utility Expenses"
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-rose-500" }),
                  "Push Upsells at Checkout"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: runAnalysis,
              disabled: isAnalyzing,
              className: "w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait",
              children: [
                isAnalyzing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }),
                isAnalyzing ? "Scanning Data..." : "Run Full Analysis"
              ]
            }
          )
        ] }) })
      ] }),
      analysisResult && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-brand-600 p-6 text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-white/20 p-2 rounded-lg backdrop-blur-md", children: /* @__PURE__ */ jsx(Activity, { size: 24 }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => setAnalysisResult(null), className: "text-white/70 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight", children: "Analysis Report" }),
            /* @__PURE__ */ jsxs("p", { className: "text-brand-200 text-sm font-medium", children: [
              "Business Health Score: ",
              /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                analysisResult.score.toFixed(0),
                "/100"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 space-y-4 max-h-[60vh] overflow-y-auto", children: analysisResult.insights.map((insight, idx) => /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border-l-4 ${insight.type === "danger" ? "bg-rose-50 border-rose-500 dark:bg-rose-900/10" : insight.type === "warning" ? "bg-amber-50 border-amber-500 dark:bg-amber-900/10" : insight.type === "success" ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10" : "bg-sunken border-brand-500 dark:bg-surface"}`, children: [
          /* @__PURE__ */ jsx("h4", { className: `text-sm font-bold mb-1 ${insight.type === "danger" ? "text-rose-700 dark:text-rose-400" : insight.type === "warning" ? "text-amber-700 dark:text-amber-400" : insight.type === "success" ? "text-emerald-700 dark:text-emerald-400" : "text-ink"}`, children: insight.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-secondary leading-relaxed", children: insight.text })
        ] }, idx)) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setAnalysisResult(null),
            className: "px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-white text-xs font-bold rounded-lg transition-colors",
            children: "Dismiss Report"
          }
        ) })
      ] }) })
    ] })
  ] });
}
function RatioCard({ title, value, subtitle, color, icon }) {
  const colors = {
    indigo: "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-3 sm:p-4 rounded-2xl border border-line shadow-sm relative overflow-hidden group", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2", children: /* @__PURE__ */ jsx("div", { className: `p-1.5 sm:p-2 rounded-lg ${colors[color]} shrink-0`, children: React.cloneElement(icon, { size: 16 }) }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-ink-muted uppercase", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg sm:text-2xl font-bold text-ink tracking-tight my-0.5 sm:my-1", children: value }),
      /* @__PURE__ */ jsx("p", { className: `text-2xs sm:text-xs font-medium ${color === "rose" ? "text-rose-500" : "text-ink-muted"}`, children: subtitle })
    ] })
  ] });
}
function StatementRow({ label, amount, percent, info, isHeader, isNegative, action, store }) {
  return /* @__PURE__ */ jsxs("tr", { className: `group transition-colors ${action ? "hover:bg-interactive-hover dark:hover:bg-interactive-hover cursor-pointer" : ""}`, onClick: action, children: [
    /* @__PURE__ */ jsxs("td", { className: "px-3 sm:px-6 py-2.5 sm:py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: `font-medium text-xs sm:text-sm ${isHeader ? "text-ink font-bold" : "text-ink-secondary"}`, children: label }),
        /* @__PURE__ */ jsxs("div", { className: "group/tooltip relative", children: [
          /* @__PURE__ */ jsx(Info, { size: 13, className: "text-neutral-300 hover:text-brand-500 transition-colors cursor-help" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute left-full top-1/2 -translate-y-1/2 ml-2 w-42 sm:w-48 bg-neutral-800 text-white text-3xs sm:text-2xs p-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl", children: [
            info,
            /* @__PURE__ */ jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" })
          ] })
        ] })
      ] }),
      action && /* @__PURE__ */ jsx("p", { className: "text-3xs sm:text-2xs text-brand-500 font-bold mt-0.5 ml-1", children: "View Ledger →" })
    ] }),
    /* @__PURE__ */ jsx("td", { className: `px-3 sm:px-6 py-2.5 sm:py-4 text-right font-bold text-xs sm:text-sm ${isNegative ? "text-rose-500" : "text-ink-secondary dark:text-ink"}`, children: formatCurrency(amount, store) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 sm:px-6 py-2.5 sm:py-4 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5 sm:gap-2", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-2xs sm:text-xs text-ink-muted font-medium", children: [
        percent,
        "%"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-12 sm:w-16 h-1 sm:h-1.5 bg-sunken rounded-full overflow-hidden shrink-0", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-sunken rounded-full", style: { width: `${Math.min(percent, 100)}%` } }) })
    ] }) })
  ] });
}
function SummaryRow({ label, amount, type, info, store }) {
  const isTotal = type === "total";
  const isLoss = amount < 0;
  return /* @__PURE__ */ jsxs("tr", { className: `bg-sunken/80 dark:bg-surface ${isTotal ? "border-t-2 border-line" : ""}`, children: [
    /* @__PURE__ */ jsx("td", { className: "px-3 sm:px-6 py-2.5 sm:py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: `uppercase tracking-wider ${isTotal ? "text-sm sm:text-base font-bold text-ink" : "text-xs sm:text-sm font-bold text-ink-secondary dark:text-ink"}`, children: label }),
      /* @__PURE__ */ jsxs("div", { className: "group/tooltip relative", children: [
        /* @__PURE__ */ jsx(Info, { size: 13, className: "text-ink-muted hover:text-brand-500 transition-colors cursor-help" }),
        /* @__PURE__ */ jsxs("div", { className: "absolute left-full top-1/2 -translate-y-1/2 ml-2 w-42 sm:w-48 bg-neutral-800 text-white text-3xs sm:text-2xs p-2 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 pointer-events-none shadow-xl", children: [
          info,
          /* @__PURE__ */ jsx("div", { className: "absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("td", { className: `px-3 sm:px-6 py-2.5 sm:py-4 text-right ${isTotal ? "text-base sm:text-xl font-bold" : "text-sm sm:text-lg font-bold"} ${isLoss ? "text-rose-600" : "text-emerald-600"}`, children: formatCurrency(amount, store) }),
    /* @__PURE__ */ jsx("td", { className: "px-3 sm:px-6 py-2.5 sm:py-4 text-right" })
  ] });
}
export {
  ProfitLoss as default
};
