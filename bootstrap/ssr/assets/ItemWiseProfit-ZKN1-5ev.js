import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-Dg4OWYWu.js";
import { ArrowLeft, DollarSign, TrendingUp, Target, Package, PieChart, HelpCircle, ShieldCheck, Zap, Lightbulb, Loader2, Activity, X, Users, ShoppingBag, ChevronDown } from "lucide-react";
import { ResponsiveContainer, PieChart as PieChart$1, Pie, Cell, Tooltip, Legend } from "recharts";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-DYgr6x02.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ItemWiseProfit({ items = [], filters = {}, allProducts = [] }) {
  const {
    store
  } = usePage().props;
  const { props } = usePage();
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [productFilter, setProductFilter] = useState(filters.product_ids || []);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [marginFilter, setMarginFilter] = useState("all");
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const selectedProductId = urlParams.get("product_id");
  const [selectedProduct, setSelectedProductState] = useState(null);
  React.useEffect(() => {
    if (selectedProductId) {
      const found = items.find((i) => i.product_id === selectedProductId);
      if (found) {
        setSelectedProductState(found);
      }
    } else {
      setSelectedProductState(null);
    }
  }, [selectedProductId, items]);
  const setSelectedProduct = (item) => {
    const url = new URL(window.location.href);
    if (item) {
      url.searchParams.set("product_id", item.product_id.toString());
      setSelectedProductState(item);
    } else {
      url.searchParams.delete("product_id");
      setSelectedProductState(null);
    }
    window.history.replaceState({}, "", url.toString());
  };
  const filteredItems = useMemo(() => {
    let list = items;
    if (marginFilter !== "all") {
      list = list.filter((item) => {
        const margin = item.revenue > 0 ? item.profit / item.revenue * 100 : 0;
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
        (item) => item.name.toLowerCase().includes(q) || (item.sku || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, localSearchQuery, marginFilter]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const totalRevenue = items.reduce((sum, item) => sum + (parseFloat(item.revenue) || 0), 0);
  const totalProfit = items.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);
  const avgMargin = totalRevenue ? (totalProfit / totalRevenue * 100).toFixed(1) : 0;
  const topEarner = items.reduce((prev, current) => prev.profit > current.profit ? prev : current, { name: "-", profit: 0 });
  const pieData = items.sort((a, b) => b.profit - a.profit).slice(0, 5).map((item, index) => ({
    name: item.name,
    value: item.profit,
    color: [vq.emerald[500], vq.blue[500], vq.violet[500], vq.amber[500], vq.red[500]][index]
  }));
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      const params = new URLSearchParams(window.location.search);
      params.set("range", r);
      params.delete("start_date");
      params.delete("end_date");
      router.get(route("store.reports.item-wise-profit", {
        store_slug: store.slug
      }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("range", "custom");
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    router.get(route("store.reports.item-wise-profit", {
      store_slug: store.slug
    }), Object.fromEntries(params.entries()), { preserveState: true, preserveScroll: true });
  };
  const toggleProductFilter = (productId) => {
    const next = productFilter.includes(productId) ? productFilter.filter((id) => id !== productId) : [...productFilter, productId];
    setProductFilter(next);
    router.get(route("store.reports.item-wise-profit", {
      store_slug: store.slug
    }), { range, start_date: startDate, end_date: endDate, product_ids: next }, { preserveState: true, preserveScroll: true });
  };
  const clearProductFilter = () => {
    setProductFilter([]);
    router.get(route("store.reports.item-wise-profit", {
      store_slug: store.slug
    }), { range, start_date: startDate, end_date: endDate, product_ids: [] }, { preserveState: true, preserveScroll: true });
  };
  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const insights = [];
      const sorted = [...items].sort((a, b) => b.profit - a.profit);
      const top20Count = Math.ceil(items.length * 0.2);
      const top20Profit = sorted.slice(0, top20Count).reduce((sum, i) => sum + i.profit, 0);
      const paretoRatio = totalProfit ? top20Profit / totalProfit * 100 : 0;
      if (paretoRatio > 70) {
        insights.push({ type: "warning", title: "High Dependency", text: `${paretoRatio.toFixed(0)}% of your profit comes from just ${top20Count} items. Diversify your best-sellers.` });
      } else {
        insights.push({ type: "success", title: "Balanced Portfolio", text: "Your profit is well-distributed across your catalog." });
      }
      const lossMakers = items.filter((i) => i.profit < 0);
      if (lossMakers.length > 0) {
        insights.push({
          type: "danger",
          title: "Bleeding Assets",
          text: `${lossMakers.length} items are selling at a loss. Review pricing immediately.`,
          products: lossMakers.map((i) => ({ id: i.product_id, name: i.name, value: i.profit }))
        });
      }
      const lowMarginHighVol = items.filter((i) => i.profit / i.revenue < 0.05 && i.revenue > totalRevenue / items.length);
      if (lowMarginHighVol.length > 0) {
        insights.push({
          type: "opportunity",
          title: "Price Optimization",
          text: `${lowMarginHighVol.length} high-volume items have margins below 5%. A small price increase here creates massive pure profit.`,
          products: lowMarginHighVol.map((i) => ({ id: i.product_id, name: i.name, value: i.profit }))
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
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Item-wise Profit Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Item Profitability" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2", children: [
              "Profit ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium text-sm", children: "By Item" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Product-level profitability analysis" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            ProductMultiSelect,
            {
              allProducts,
              selected: productFilter,
              onToggle: toggleProductFilter
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl", children: [
            /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: "TO" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" }),
            /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Revenue", value: formatCurrency(totalRevenue, store), subtitle: `${items.length} Items Sold`, color: "blue", icon: /* @__PURE__ */ jsx(DollarSign, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Profit", value: formatCurrency(totalProfit, store), subtitle: `${avgMargin}% Avg Margin`, color: totalProfit >= 0 ? "emerald" : "rose", icon: /* @__PURE__ */ jsx(TrendingUp, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Top Earner", value: topEarner.name.substring(0, 15), subtitle: formatCurrency(topEarner.profit, store), color: "indigo", icon: /* @__PURE__ */ jsx(Target, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Active Catalog", value: items.length, subtitle: "Items with sales", color: "amber", icon: /* @__PURE__ */ jsx(Package, {}) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 dark:text-white shrink-0", children: "Item Breakdown" }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search breakdown items...",
                  value: localSearchQuery,
                  onChange: (e) => setLocalSearchQuery(e.target.value),
                  className: "w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute left-2.5 top-2.5 text-slate-400", children: /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.5", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 bg-slate-50/30 dark:bg-slate-800/10 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-1.5 items-center", children: [
            /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1", children: "Margins:" }),
            [
              { id: "all", label: "All" },
              { id: "negative", label: "Loss (<0%)", hover: "hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 dark:hover:text-rose-450 hover:border-rose-300" },
              { id: "0_10", label: "0% - 10%", hover: "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/20 dark:hover:text-amber-455 hover:border-amber-300" },
              { id: "10_30", label: "10% - 30%", hover: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20 dark:hover:text-blue-450 hover:border-blue-300" },
              { id: "30_50", label: "30% - 50%", hover: "hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-450 hover:border-indigo-300" },
              { id: "50_plus", label: "50%+", hover: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-450 hover:border-emerald-300" }
            ].map((opt) => {
              const isActive = marginFilter === opt.id;
              let activeStyles = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 " + opt.hover;
              if (isActive) {
                if (opt.id === "negative") activeStyles = "bg-rose-600 border-rose-600 text-white shadow-sm";
                else if (opt.id === "0_10") activeStyles = "bg-amber-500 border-amber-500 text-white shadow-sm";
                else if (opt.id === "10_30") activeStyles = "bg-blue-600 border-blue-600 text-white shadow-sm";
                else if (opt.id === "30_50") activeStyles = "bg-indigo-600 border-indigo-600 text-white shadow-sm";
                else if (opt.id === "50_plus") activeStyles = "bg-emerald-600 border-emerald-600 text-white shadow-sm";
                else activeStyles = "bg-slate-800 border-slate-800 dark:bg-slate-200 dark:border-slate-200 text-white dark:text-slate-900 shadow-sm";
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
          productFilter.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-5 py-2 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-indigo-600 dark:text-indigo-400 font-bold", children: [
              productFilter.length,
              " product(s) selected"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: clearProductFilter, className: "text-indigo-500 hover:text-indigo-700 font-bold underline", children: "Clear filter" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10", children: /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: "Product Name" }) }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
              filteredItems.map((item, idx) => {
                return /* @__PURE__ */ jsx(
                  "tr",
                  {
                    className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer",
                    onClick: () => setSelectedProduct(item),
                    children: /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 font-medium text-slate-700 dark:text-slate-200 flex justify-between items-center", children: [
                      /* @__PURE__ */ jsx("span", { children: item.name }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-indigo-500 font-bold transition-colors", children: "View Details →" })
                    ] })
                  },
                  item.product_id || idx
                );
              }),
              filteredItems.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { className: "px-6 py-8 text-center text-slate-400 italic", children: "No products found matching the search." }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-h-[300px] flex flex-col", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(PieChart, { size: 14 }),
              " Profit Contribution"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "200", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
              /* @__PURE__ */ jsx(Pie, { data: pieData, cx: "50%", cy: "50%", innerRadius: 60, outerRadius: 80, paddingAngle: 5, dataKey: "value", children: pieData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`)) }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => formatCurrency(val, store), contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" }, itemStyle: { color: "#fff" } }),
              /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "10px" } })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Strategy Tip"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsxs("p", { children: [
                  "Your Top Earner ",
                  /* @__PURE__ */ jsx("strong", { children: topEarner.name }),
                  " is generating significant cash flow."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Keep in Stock"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-base font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400", children: [
            /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
            " Growth Engine"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Target, { size: 12 }),
                " Optimization"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-300 mobile-relaxed", children: "Run the AI analyzer to detect margin leaks and find hidden pricing opportunities in your catalog." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-amber-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Lightbulb, { size: 12 }),
                " Insight"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-300", children: 'Identify "Loss Leaders" that are draining your overall profitability.' })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: runAnalysis, disabled: isAnalyzing, className: "w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait", children: [
            isAnalyzing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }),
            isAnalyzing ? "Analyzing Item Data..." : "Run Item Analysis"
          ] })
        ] }) })
      ] }),
      analysisResult && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 p-6 text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-white/20 p-2 rounded-lg backdrop-blur-md", children: /* @__PURE__ */ jsx(Activity, { size: 24 }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => setAnalysisResult(null), className: "text-white/70 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight", children: "Catalog Intelligence" }),
            /* @__PURE__ */ jsxs("p", { className: "text-indigo-200 text-sm font-medium", children: [
              "Efficiency Score: ",
              /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                analysisResult.score.toFixed(0),
                "/100"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 space-y-4 max-h-[60vh] overflow-y-auto", children: analysisResult.insights.map((insight, idx) => {
          let containerClass = "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-l-slate-400";
          let titleClass = "text-slate-900 dark:text-white font-bold text-sm mb-1";
          let textClass = "text-xs opacity-90 text-slate-700 dark:text-slate-300 mb-2";
          let listBgClass = "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800";
          let nameClass = "text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400";
          let valueClass = "text-slate-600 dark:text-slate-400";
          if (insight.type === "danger") {
            containerClass = "bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 border-l-rose-600 border border-y border-r border-rose-200/60 dark:border-rose-900/30";
            titleClass = "text-rose-900 dark:text-rose-200 font-extrabold text-sm mb-1";
            textClass = "text-rose-800/90 dark:text-rose-300/90 text-xs mb-2";
            listBgClass = "bg-white/80 dark:bg-slate-950/80 border border-rose-200/50 dark:border-rose-900/30";
            nameClass = "text-slate-850 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400";
            valueClass = "text-rose-600 dark:text-rose-400 font-bold";
          } else if (insight.type === "warning") {
            containerClass = "bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100 border-l-amber-600 border border-y border-r border-amber-200/60 dark:border-amber-900/30";
            titleClass = "text-amber-900 dark:text-amber-200 font-extrabold text-sm mb-1";
            textClass = "text-amber-800/90 dark:text-amber-300/90 text-xs mb-2";
          } else if (insight.type === "success") {
            containerClass = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-l-emerald-600 border border-y border-r border-emerald-200/60 dark:border-emerald-900/30";
            titleClass = "text-emerald-900 dark:text-emerald-200 font-extrabold text-sm mb-1";
            textClass = "text-emerald-800/90 dark:text-emerald-300/90 text-xs mb-2";
          } else if (insight.type === "opportunity") {
            containerClass = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-100 border-l-indigo-600 border border-y border-r border-indigo-200/60 dark:border-indigo-900/30";
            titleClass = "text-indigo-900 dark:text-indigo-200 font-extrabold text-sm mb-1";
            textClass = "text-indigo-800/90 dark:text-indigo-300/90 text-xs mb-2";
            listBgClass = "bg-white/80 dark:bg-slate-950/80 border border-indigo-200/50 dark:border-indigo-900/30";
            nameClass = "text-slate-850 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400";
            valueClass = "text-indigo-600 dark:text-indigo-400 font-bold";
          }
          return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border-l-4 ${containerClass}`, children: [
            /* @__PURE__ */ jsx("h4", { className: titleClass, children: insight.title }),
            /* @__PURE__ */ jsx("p", { className: textClass, children: insight.text }),
            insight.products && insight.products.length > 0 && /* @__PURE__ */ jsx("div", { className: `mt-2 space-y-1 p-2 rounded-lg max-h-40 overflow-y-auto ${listBgClass}`, children: insight.products.map((p) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setAnalysisResult(null);
                  setSelectedProduct(items.find((i) => i.product_id === p.id));
                },
                className: "w-full flex justify-between items-center text-left py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded text-xs transition-all font-semibold",
                children: [
                  /* @__PURE__ */ jsx("span", { className: `truncate pr-4 underline ${nameClass}`, children: p.name }),
                  /* @__PURE__ */ jsx("span", { className: `shrink-0 font-bold font-mono ${valueClass}`, children: formatCurrency(p.value, store) })
                ]
              },
              p.id
            )) })
          ] }, idx);
        }) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: () => setAnalysisResult(null), className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors", children: "Dismiss" }) })
      ] }) }),
      selectedProduct && (() => {
        const activeProduct = items.find((i) => i.product_id === selectedProduct.product_id) || selectedProduct;
        const margin = activeProduct.revenue > 0 ? activeProduct.profit / activeProduct.revenue * 100 : 0;
        const customers = activeProduct.customers || [];
        return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-6xl w-[92vw] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 p-6 text-white relative overflow-hidden shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "bg-indigo-500/50 text-white border border-indigo-400/30 px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider", children: [
                  "Period: ",
                  range ? range.replace("_", " ") : "this year",
                  " (",
                  filters.start_date || startDate || "N/A",
                  " to ",
                  filters.end_date || endDate || "N/A",
                  ")"
                ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight mt-1", children: activeProduct.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-indigo-100 text-xs font-semibold", children: [
                  "SKU: ",
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: activeProduct.sku || "N/A" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProduct(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase", children: "Change Period:" }),
                /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleRangeChange(opt.id),
                    className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === opt.id ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                    children: opt.label
                  },
                  opt.id
                )) })
              ] }),
              range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl", children: [
                /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: "TO" }),
                /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300" }),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Revenue in Period" }),
                /* @__PURE__ */ jsx("p", { className: "text-3xl font-black text-slate-800 dark:text-white mt-1", children: formatCurrency(activeProduct.revenue, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Profit in Period" }),
                /* @__PURE__ */ jsx("p", { className: `text-3xl font-black mt-1 ${activeProduct.profit < 0 ? "text-rose-500" : "text-emerald-500"}`, children: formatCurrency(activeProduct.profit, store) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Profit Margin" }),
                /* @__PURE__ */ jsxs("p", { className: "text-3xl font-black text-indigo-500 dark:text-indigo-400 mt-1", children: [
                  margin.toFixed(1),
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-8", children: [
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx(DollarSign, { size: 14 }),
                  " Profit & Loss Statement"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden", children: /* @__PURE__ */ jsx("table", { className: "w-full text-xs sm:text-sm", children: /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-200 dark:divide-slate-700", children: [
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-slate-500", children: "Revenue (net of returns)" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-200 font-bold", children: formatCurrency(activeProduct.revenue, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-slate-500", children: "Less: Cost of Goods Sold" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-rose-500 font-medium", children: [
                      "(",
                      formatCurrency((activeProduct.revenue || 0) - (activeProduct.profit || 0), store),
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-slate-100 dark:bg-slate-800/80", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-slate-700 dark:text-slate-200", children: "Gross Profit" }),
                    /* @__PURE__ */ jsx("td", { className: `py-3 px-4 text-right font-mono font-bold ${activeProduct.profit < 0 ? "text-rose-500" : "text-emerald-600"}`, children: formatCurrency(activeProduct.profit, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-slate-500", children: "Gross Margin" }),
                    /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-200 font-bold", children: [
                      margin.toFixed(1),
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-slate-400 italic", children: "Purchases in period" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-slate-500", children: formatCurrency(activeProduct.purchase_cost || 0, store) })
                  ] }),
                  /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50/50 dark:bg-slate-800/20", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-slate-400 italic", children: "Current stock value" }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-slate-500", children: formatCurrency(activeProduct.stock_value || 0, store) })
                  ] })
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "xl:col-span-7", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider", children: [
                  /* @__PURE__ */ jsx(Users, { size: 14 }),
                  " Customer Purchase Detail"
                ] }),
                customers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 italic", children: "No customer-attributed purchases in this period." }) }) : /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs sm:text-sm text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "py-3 px-4 font-bold", children: "Customer Name" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Times Purchased" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Qty Bought" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right py-3 px-4 font-bold", children: "Total Spent" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: customers.map((c, ci) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors", children: [
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-bold text-slate-700 dark:text-slate-200", children: c.party_name }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-slate-500 font-semibold", children: c.purchase_count }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right text-slate-500 font-semibold", children: c.total_qty }),
                    /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300 font-black", children: formatCurrency(c.total_spent, store) })
                  ] }, ci)) })
                ] }) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => setSelectedProduct(null), className: "px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
        ] }) });
      })()
    ] })
  ] });
}
function ProductMultiSelect({ allProducts, selected, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = query === "" ? allProducts.slice(0, 50) : allProducts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || (p.sku || "").toLowerCase().includes(query.toLowerCase())).slice(0, 50);
  return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
        children: [
          /* @__PURE__ */ jsx(ShoppingBag, { size: 14 }),
          selected.length > 0 ? `${selected.length} Product(s)` : "All Products",
          /* @__PURE__ */ jsx(ChevronDown, { size: 12 })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxs("div", { className: "absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-30 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          autoFocus: true,
          placeholder: "Search products...",
          value: query,
          onChange: (e) => setQuery(e.target.value),
          className: "w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-y-auto p-1", children: filtered.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 text-center py-4", children: "No products found" }) : filtered.map((p) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: selected.includes(p.id),
            onChange: () => onToggle(p.id),
            className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-slate-700 dark:text-slate-300 truncate", children: p.name })
      ] }, p.id)) }),
      /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-slate-100 dark:border-slate-800 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: () => setIsOpen(false), className: "px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold", children: "Done" }) })
    ] })
  ] });
}
function RatioCard({ title, value, subtitle, color, icon }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "flex justify-between items-start mb-2", children: /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${colors[color]} shrink-0`, children: React.cloneElement(icon, { size: 18 }) }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-black text-slate-800 dark:text-white tracking-tight my-1", children: value }),
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-400", children: subtitle })
    ] })
  ] });
}
export {
  ItemWiseProfit as default
};
