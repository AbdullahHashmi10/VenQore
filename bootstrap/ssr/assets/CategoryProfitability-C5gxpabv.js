import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, DollarSign, TrendingUp, Target, Package, ChevronRight, PieChart, HelpCircle, ShieldCheck, Zap, Lightbulb, Loader2, Activity, X, Users } from "lucide-react";
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
function CategoryProfitability({ data = [], filters = {} }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [marginFilter, setMarginFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("customers");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const selectedCategoryId = urlParams.get("category_id");
  const [selectedCategory, setSelectedCategoryState] = useState(null);
  React.useEffect(() => {
    if (selectedCategoryId) {
      const found = data.find((c) => (c.category_id ?? "").toString() === selectedCategoryId);
      if (found) {
        setSelectedCategoryState(found);
      }
    } else {
      setSelectedCategoryState(null);
    }
  }, [selectedCategoryId, data]);
  const setSelectedCategory = (category) => {
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set("category_id", (category.category_id ?? "custom_index").toString());
      setSelectedCategoryState(category);
    } else {
      url.searchParams.delete("category_id");
      setSelectedCategoryState(null);
    }
    window.history.replaceState({}, "", url.toString());
  };
  const filteredCategories = useMemo(() => {
    let list = data;
    if (marginFilter !== "all") {
      list = list.filter((row) => {
        const margin = row.revenue > 0 ? row.profit / row.revenue * 100 : 0;
        if (marginFilter === "negative") return margin < 0;
        if (marginFilter === "0_10") return margin >= 0 && margin <= 10;
        if (marginFilter === "10_30") return margin > 10 && margin <= 30;
        if (marginFilter === "30_50") return margin > 30 && margin <= 50;
        if (marginFilter === "50_plus") return margin > 50;
        return true;
      });
    }
    if (localSearchQuery) {
      const q = localSearchQuery.toLowerCase();
      list = list.filter(
        (row) => row.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, localSearchQuery, marginFilter]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const totalRevenue = data.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
  const totalProfit = data.reduce((sum, r) => sum + (parseFloat(r.profit) || 0), 0);
  const avgMargin = totalRevenue ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;
  const topCategory = data.reduce((prev, cur) => (cur.profit || 0) > (prev.profit || 0) ? cur : prev, { name: "-", profit: 0 });
  const totalStockValue = data.reduce((s, r) => s + (r.stock_value || 0), 0);
  const pieData = [...data].sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 5).map((r, i) => ({
    name: r.name,
    value: r.profit || 0,
    color: [vq.emerald[500], vq.blue[500], vq.violet[500], vq.amber[500], vq.red[500]][i]
  }));
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      const params = new URLSearchParams(window.location.search);
      params.set("range", r);
      params.delete("start_date");
      params.delete("end_date");
      router.get(route("store.reports.item-category-wise-profit-loss", {
        store_slug: store.slug
      }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("range", "custom");
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    router.get(route("store.reports.item-category-wise-profit-loss", {
      store_slug: store.slug
    }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
  };
  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const insights = [];
      const sorted = [...data].sort((a, b) => (b.profit || 0) - (a.profit || 0));
      const top20Count = Math.ceil(data.length * 0.2);
      const top20Profit = sorted.slice(0, top20Count).reduce((sum, i) => sum + (i.profit || 0), 0);
      const paretoRatio = totalProfit ? top20Profit / totalProfit * 100 : 0;
      if (paretoRatio > 70) {
        insights.push({ type: "warning", title: "High Dependency", text: `${paretoRatio.toFixed(0)}% of your category profits come from just ${top20Count} categories. Balance your offerings.` });
      } else {
        insights.push({ type: "success", title: "Balanced Portfolio", text: "Profit is healthily distributed across your categories." });
      }
      const lossMakers = data.filter((i) => (i.profit || 0) < 0);
      if (lossMakers.length > 0) {
        insights.push({
          type: "danger",
          title: "Bleeding Categories",
          text: `${lossMakers.length} product categories are generating net losses. Review category pricing or COGS structure.`,
          categories: lossMakers.map((i) => ({ id: i.category_id, name: i.name, value: i.profit }))
        });
      }
      const lowMarginHighVol = data.filter((i) => (i.profit || 0) / (i.revenue || 1) < 0.05 && (i.revenue || 0) > totalRevenue / (data.length || 1));
      if (lowMarginHighVol.length > 0) {
        insights.push({
          type: "opportunity",
          title: "Category Pricing Opportunity",
          text: `${lowMarginHighVol.length} high-revenue categories have net margins below 5%. Consider markup review.`,
          categories: lowMarginHighVol.map((i) => ({ id: i.category_id, name: i.name, value: i.profit }))
        });
      }
      let score = 100;
      if (paretoRatio > 70) score -= 10;
      if (lossMakers.length > 0) {
        score -= 15;
        score -= lossMakers.length * 5;
      }
      if (lowMarginHighVol.length > 0) {
        score -= lowMarginHighVol.length * 3;
      }
      score = Math.max(0, Math.min(100, score));
      setAnalysisResult({
        score,
        insights
      });
      setIsAnalyzing(false);
    }, 1500);
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Category Profitability", children: [
    /* @__PURE__ */ jsx(Head, { title: "Category Profitability" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store.slug }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-ink tracking-tight flex items-center gap-2", children: [
              "Profit ",
              /* @__PURE__ */ jsx("span", { className: "text-ink-muted font-medium text-sm", children: "By Category" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: "Category-level profitability analysis" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1 rounded-xl", children: [
            /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs font-bold", children: "TO" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" }),
            /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Revenue", value: formatCurrency(totalRevenue, store), subtitle: `${data.length} Categories`, color: "blue", icon: /* @__PURE__ */ jsx(DollarSign, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Profit", value: formatCurrency(totalProfit, store), subtitle: `${avgMargin}% Avg Margin`, color: totalProfit >= 0 ? "emerald" : "rose", icon: /* @__PURE__ */ jsx(TrendingUp, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Top Category", value: (topCategory.name || "-").substring(0, 15), subtitle: formatCurrency(topCategory.profit || 0, store), color: "indigo", icon: /* @__PURE__ */ jsx(Target, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Stock Value", value: formatCurrency(totalStockValue, store), subtitle: "Across all categories", color: "amber", icon: /* @__PURE__ */ jsx(Package, {}) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center bg-sunken/50 dark:bg-surface gap-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-ink shrink-0", children: "Category Breakdown" }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search breakdown categories...",
                  value: localSearchQuery,
                  onChange: (e) => setLocalSearchQuery(e.target.value),
                  className: "w-full pl-8 pr-3 py-1.5 bg-surface border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute left-2.5 top-2.5 text-ink-muted", children: /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 bg-sunken/30 dark:bg-surface border-b border-line flex flex-wrap gap-1.5 items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider mr-1", children: "Margins:" }),
            [
              { id: "all", label: "All" },
              { id: "negative", label: "Loss (<0%)", hover: "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-455 hover:border-rose-300" },
              { id: "0_10", label: "0% - 10%", hover: "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-455 hover:border-amber-300" },
              { id: "10_30", label: "10% - 30%", hover: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-455 hover:border-blue-300" },
              { id: "30_50", label: "30% - 50%", hover: "hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/20 dark:hover:text-brand-455 hover:border-brand-300" },
              { id: "50_plus", label: "50%+", hover: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-455 hover:border-emerald-300" }
            ].map((opt) => {
              const isActive = marginFilter === opt.id;
              let activeStyles = "bg-surface border-line text-ink-secondary " + opt.hover;
              if (isActive) {
                if (opt.id === "negative") activeStyles = "bg-rose-600 border-rose-600 text-white shadow-sm";
                else if (opt.id === "0_10") activeStyles = "bg-amber-500 border-amber-500 text-white shadow-sm";
                else if (opt.id === "10_30") activeStyles = "bg-blue-600 border-blue-600 text-white shadow-sm";
                else if (opt.id === "30_50") activeStyles = "bg-brand-600 border-brand-600 text-white shadow-sm";
                else if (opt.id === "50_plus") activeStyles = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
                else activeStyles = "bg-neutral-800 border-neutral-800 dark:bg-neutral-200 dark:border-line text-white dark:text-ink shadow-sm";
              }
              return /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setMarginFilter(opt.id),
                  className: `px-2.5 py-1 rounded-lg text-2xs font-bold transition-all border ${activeStyles}`,
                  children: opt.label
                },
                opt.id
              );
            })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-ink-muted uppercase bg-app sticky top-0 backdrop-blur-sm z-10", children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: "Category Name" }) }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filteredCategories.map((row, idx) => /* @__PURE__ */ jsx(
              "tr",
              {
                onClick: () => setSelectedCategory(row),
                className: "hover:bg-brand-50/50 dark:hover:bg-interactive-hover transition-all cursor-pointer group",
                children: /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors flex justify-between items-center", children: [
                  /* @__PURE__ */ jsx("span", { children: row.name }),
                  /* @__PURE__ */ jsx(ChevronRight, { size: 16, className: "text-neutral-300 dark:text-ink-secondary group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" })
                ] })
              },
              row.category_id ?? idx
            )) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-5 rounded-2xl border border-line shadow-sm flex-1 min-h-[300px] flex flex-col", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(PieChart, { size: 14 }),
              " Profit Contribution"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "200", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
              /* @__PURE__ */ jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value", children: pieData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`)) }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => formatCurrency(val, store), contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" }, itemStyle: { color: "#fff" } }),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "10px" } })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Strategy Tip"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsxs("p", { children: [
                  "Your Top Category ",
                  /* @__PURE__ */ jsx("strong", { children: topCategory.name }),
                  " is generating significant cash flow."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Focus Core Growth"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400", children: [
              /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
              " Category Engine"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Target, { size: 12 }),
                  " Optimization"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-1xs text-neutral-300 leading-relaxed", children: "Run the AI analyzer to detect margin leaks and find hidden pricing opportunities in your category catalog." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-amber-300 mb-1 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Lightbulb, { size: 12 }),
                  " Insight"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-1xs text-neutral-300", children: "Identify low-profit or loss-making categories that are draining overall margins." })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: runAnalysis, disabled: isAnalyzing, className: "w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait shrink-0", children: [
            isAnalyzing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }),
            isAnalyzing ? "Auditing Categories..." : "Run Category Analysis"
          ] })
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
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight", children: "Category Intelligence" }),
            /* @__PURE__ */ jsxs("p", { className: "text-brand-200 text-sm font-medium", children: [
              "Efficiency Score: ",
              /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                analysisResult.score.toFixed(0),
                "/100"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 space-y-4 max-h-[60vh] overflow-y-auto", children: analysisResult.insights.map((insight, idx) => {
          let containerClass = "bg-app text-ink border-l-slate-400";
          let titleClass = "text-ink font-bold text-sm mb-1";
          let textClass = "text-xs opacity-90 text-ink-secondary mb-2";
          let listBgClass = "bg-surface border border-line";
          let nameClass = "text-ink-secondary hover:text-brand-600 dark:hover:text-brand-400";
          let valueClass = "text-ink-secondary";
          if (insight.type === "danger") {
            containerClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 border-l-rose-600 border border-y border-r border-rose-200/60 dark:border-rose-900/30";
            titleClass = "text-rose-900 dark:text-rose-200 font-bold text-sm mb-1";
            textClass = "text-rose-800/90 dark:text-rose-300/90 text-xs mb-2";
            listBgClass = "bg-white/80 dark:bg-app border border-rose-200/50 dark:border-rose-900/30";
            nameClass = "text-ink hover:text-brand-600 dark:hover:text-brand-400";
            valueClass = "text-rose-600 dark:text-rose-400 font-bold";
          } else if (insight.type === "warning") {
            containerClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-l-amber-600 border border-y border-r border-amber-200/60 dark:border-amber-900/30";
            titleClass = "text-amber-900 dark:text-amber-200 font-bold text-sm mb-1";
            textClass = "text-amber-800/90 dark:text-amber-300/90 text-xs mb-2";
          } else if (insight.type === "success") {
            containerClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-l-emerald-600 border border-y border-r border-emerald-200/60 dark:border-emerald-900/30";
            titleClass = "text-emerald-900 dark:text-emerald-200 font-bold text-sm mb-1";
            textClass = "text-emerald-800/90 dark:text-emerald-300/90 text-xs mb-2";
          } else if (insight.type === "opportunity") {
            containerClass = "bg-brand-50 dark:bg-brand-950/20 text-brand-900 dark:text-brand-100 border-l-indigo-600 border border-y border-r border-brand-200/60 dark:border-brand-900/30";
            titleClass = "text-brand-900 dark:text-brand-200 font-bold text-sm mb-1";
            textClass = "text-brand-800/90 dark:text-brand-300/90 text-xs mb-2";
            listBgClass = "bg-white/80 dark:bg-app border border-brand-200/50 dark:border-brand-900/30";
            nameClass = "text-ink hover:text-brand-600 dark:hover:text-brand-400";
            valueClass = "text-brand-600 dark:text-brand-400 font-bold";
          }
          return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border-l-4 ${containerClass}`, children: [
            /* @__PURE__ */ jsx("h4", { className: titleClass, children: insight.title }),
            /* @__PURE__ */ jsx("p", { className: textClass, children: insight.text }),
            insight.categories && insight.categories.length > 0 && /* @__PURE__ */ jsx("div", { className: `mt-2 space-y-1 p-2 rounded-lg max-h-40 overflow-y-auto ${listBgClass}`, children: insight.categories.map((c) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setAnalysisResult(null);
                  setSelectedCategory(data.find((d) => d.category_id === c.id));
                },
                className: "w-full flex justify-between items-center text-left py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs transition-all font-semibold",
                children: [
                  /* @__PURE__ */ jsx("span", { className: `truncate pr-4 underline ${nameClass}`, children: c.name }),
                  /* @__PURE__ */ jsx("span", { className: `shrink-0 font-bold font-mono ${valueClass}`, children: formatCurrency(c.value, store) })
                ]
              },
              c.id
            )) })
          ] }, idx);
        }) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: () => setAnalysisResult(null), className: "px-4 py-2 bg-neutral-800 hover:bg-interactive-hover text-white text-xs font-bold rounded-lg transition-colors", children: "Dismiss" }) })
      ] }) }),
      selectedCategory && (() => {
        const activeCategory = data.find((c) => (c.category_id ?? "").toString() === (selectedCategory.category_id ?? "").toString()) || selectedCategory;
        const margin = activeCategory.revenue > 0 ? activeCategory.profit / activeCategory.revenue * 100 : 0;
        const customers = activeCategory.customers || [];
        return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-6xl w-[92vw] rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[90vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-600 p-6 text-white relative overflow-hidden shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "bg-brand-500/50 text-white border border-brand-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider", children: [
                  "Period: ",
                  range ? range.replace("_", " ") : "this year",
                  " (",
                  filters.start_date || startDate || "N/A",
                  " to ",
                  filters.end_date || endDate || "N/A",
                  ")"
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight mt-1", children: activeCategory.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-brand-100 text-xs font-semibold", children: [
                  "Category ID: ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: activeCategory.category_id || "N/A" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedCategory(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4 bg-app p-4 rounded-xl border border-line shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase", children: "Change Period:" }),
                /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleRangeChange(opt.id),
                    className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
                    children: opt.label
                  },
                  opt.id
                )) })
              ] }),
              range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1 rounded-xl", children: [
                /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" }),
                /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs font-bold", children: "TO" }),
                /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-brand-500 text-ink-secondary" }),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Revenue in Period" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-ink mt-1", children: formatCurrency(activeCategory.revenue, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Profit in Period" }),
                /* @__PURE__ */ jsx("p", { className: `text-3xl font-bold mt-1 ${activeCategory.profit < 0 ? "text-rose-500" : "text-emerald-500"}`, children: formatCurrency(activeCategory.profit, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Profit Margin" }),
                /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-brand-500 dark:text-brand-400 mt-1", children: [
                  margin.toFixed(1),
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                  " Profit & Loss Statement"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "bg-app rounded-xl border border-line overflow-hidden", children: /* @__PURE__ */ jsx("table", { className: "w-full text-xs sm:text-sm", children: /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Revenue (net of returns)" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold", children: formatCurrency(activeCategory.revenue, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Less: Cost of Goods Sold" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-rose-500 font-medium", children: [
                      "(",
                      formatCurrency((activeCategory.revenue || 0) - (activeCategory.profit || 0), store),
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-sunken", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-ink-secondary dark:text-ink", children: "Gross Profit" }),
                    /* @__PURE__ */ jsx("td", { className: `py-3 px-4 text-right font-mono font-bold ${activeCategory.profit < 0 ? "text-rose-500" : "text-emerald-600"}`, children: formatCurrency(activeCategory.profit, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Gross Margin" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold", children: [
                      margin.toFixed(1),
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "border-t border-line bg-sunken/50 dark:bg-surface", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted italic", children: "Purchases in period" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-muted", children: formatCurrency(activeCategory.purchase_cost || 0, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-sunken/50 dark:bg-surface", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted italic", children: "Current stock value" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-muted", children: formatCurrency(activeCategory.stock_value || 0, store) })
                  ] })
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-7 flex flex-col", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex border-b border-line mb-4 shrink-0", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setActiveTab("customers"),
                      className: `pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === "customers" ? "border-brand-600 text-brand-600 dark:text-brand-400" : "border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200"}`,
                      children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx(Users, { size: 14 }),
                        " ",
                        tt("Customer Detail")
                      ] })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setActiveTab("products"),
                      className: `pb-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === "products" ? "border-brand-600 text-brand-600 dark:text-brand-400" : "border-transparent text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200"}`,
                      children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                        /* @__PURE__ */ jsx(Package, { size: 14 }),
                        " ",
                        tt("Products"),
                        " (",
                        activeCategory.products?.length || 0,
                        ")"
                      ] })
                    }
                  )
                ] }),
                activeTab === "customers" ? customers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 rounded-xl bg-app border border-dashed border-line flex flex-col items-center justify-center text-center flex-1", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted italic", children: tt("No customer-attributed purchases in this period.") }) }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs sm:text-sm text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "text-ink-muted uppercase bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-3 px-4 font-bold", children: tt("Customer Name") }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Times Purchased" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Qty Bought" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Total Spent" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: customers.map((c, ci) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-ink-secondary dark:text-ink", children: c.party_name }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-ink-muted font-semibold", children: c.purchase_count }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-ink-muted font-semibold", children: c.total_qty }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary font-bold", children: formatCurrency(c.total_spent, store) })
                  ] }, ci)) })
                ] }) }) : !(activeCategory.products && activeCategory.products.length > 0) ? /* @__PURE__ */ jsx("div", { className: "p-12 rounded-xl bg-app border border-dashed border-line flex flex-col items-center justify-center text-center flex-1", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted italic", children: tt("No products found with sales in this category during the period.") }) }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs sm:text-sm text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "text-ink-muted uppercase bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-3 px-4 font-bold", children: tt("Product Name") }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Qty Sold" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Revenue" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Profit" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Margin" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: activeCategory.products.map((p, pi) => {
                    const pMargin = p.net_revenue > 0 ? p.gross_profit / p.net_revenue * 100 : 0;
                    return /* @__PURE__ */ jsxs(
                      "tr",
                      {
                        onClick: () => setSelectedProduct(p),
                        className: "hover:bg-brand-50/50 dark:hover:bg-interactive-hover transition-colors cursor-pointer group",
                        children: [
                          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-ink-secondary dark:text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 underline", children: p.name }),
                          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-ink-muted font-semibold", children: p.quantity }),
                          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary font-semibold", children: formatCurrency(p.net_revenue, store) }),
                          /* @__PURE__ */ jsx("td", { className: `py-3 px-4 text-right font-mono font-bold ${p.gross_profit < 0 ? "text-rose-500" : "text-emerald-600"}`, children: formatCurrency(p.gross_profit, store) }),
                          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-semibold", children: /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded text-2xs font-bold ${pMargin > 20 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : pMargin < 0 ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`, children: [
                            pMargin.toFixed(1),
                            "%"
                          ] }) })
                        ]
                      },
                      pi
                    );
                  }) })
                ] }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => setSelectedCategory(null), className: "px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
        ] }) });
      })(),
      selectedProduct && (() => {
        const margin = selectedProduct.net_revenue > 0 ? selectedProduct.gross_profit / selectedProduct.net_revenue * 100 : 0;
        const customers = selectedProduct.customers || [];
        return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-sticky flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-6xl w-[92vw] rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[90vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-600 p-6 text-white relative overflow-hidden shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "bg-brand-500/50 text-white border border-brand-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider", children: [
                  "Period: ",
                  range ? range.replace("_", " ") : "this year",
                  " (",
                  filters.start_date || startDate || "N/A",
                  " to ",
                  filters.end_date || endDate || "N/A",
                  ")"
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight mt-1", children: selectedProduct.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-brand-100 text-xs font-semibold", children: [
                  "SKU: ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedProduct.sku || "N/A" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProduct(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Revenue in Period" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-ink mt-1", children: formatCurrency(selectedProduct.net_revenue, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Profit in Period" }),
                /* @__PURE__ */ jsx("p", { className: `text-3xl font-bold mt-1 ${selectedProduct.gross_profit < 0 ? "text-rose-500" : "text-emerald-500"}`, children: formatCurrency(selectedProduct.gross_profit, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Profit Margin" }),
                /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-brand-500 dark:text-brand-400 mt-1", children: [
                  margin.toFixed(1),
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                  " Profit & Loss Statement"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "bg-app rounded-xl border border-line overflow-hidden", children: /* @__PURE__ */ jsx("table", { className: "w-full text-xs sm:text-sm", children: /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Revenue (net of returns)" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold", children: formatCurrency(selectedProduct.net_revenue, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Less: Cost of Goods Sold" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-rose-500 font-medium", children: [
                      "(",
                      formatCurrency((selectedProduct.net_revenue || 0) - (selectedProduct.gross_profit || 0), store),
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-sunken", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-ink-secondary dark:text-ink", children: "Gross Profit" }),
                    /* @__PURE__ */ jsx("td", { className: `py-3 px-4 text-right font-mono font-bold ${selectedProduct.gross_profit < 0 ? "text-rose-500" : "text-emerald-600"}`, children: formatCurrency(selectedProduct.gross_profit, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted", children: "Gross Margin" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary dark:text-ink font-bold", children: [
                      margin.toFixed(1),
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "border-t border-line bg-sunken/50 dark:bg-surface", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted italic", children: "Purchases in period" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-muted", children: formatCurrency(selectedProduct.purchase_cost || 0, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-sunken/50 dark:bg-surface", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-ink-muted italic", children: "Current stock value" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-muted", children: formatCurrency(selectedProduct.stock_value || 0, store) })
                  ] })
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-7", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs font-bold text-ink-muted uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx(Users, { size: 14 }),
                  " ",
                  tt("Customer Purchase Detail")
                ] }),
                customers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 rounded-xl bg-app border border-dashed border-line flex flex-col items-center justify-center text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted italic", children: tt("No customer-attributed purchases in this period.") }) }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs sm:text-sm text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "text-ink-muted uppercase bg-app border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-3 px-4 font-bold", children: tt("Customer Name") }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Times Purchased" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Qty Bought" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Total Spent" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: customers.map((c, ci) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-ink-secondary dark:text-ink", children: c.party_name }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-ink-muted font-semibold", children: c.purchase_count }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-ink-muted font-semibold", children: c.total_qty }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-ink-secondary font-bold", children: formatCurrency(c.total_spent, store) })
                  ] }, ci)) })
                ] }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProduct(null), className: "px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
        ] }) });
      })()
    ] })
  ] });
}
function RatioCard({ title, value, subtitle, color, icon }) {
  const colors = { indigo: "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-2xl border border-line shadow-sm relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2", children: /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${colors[color]} shrink-0`, children: React.cloneElement(icon, { size: 18 }) }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink tracking-tight my-1", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-ink-muted", children: subtitle })
    ] })
  ] });
}
export {
  CategoryProfitability as default
};
