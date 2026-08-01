import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-DYtHXvvS.js";
import { ArrowLeft, Calendar, Truck, DollarSign, Search, BarChart2, AlertTriangle, ShieldCheck, Activity, X, Clock, ShoppingBag } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
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
function SupplierInsights({ data = [], stats = [], filters = {} }) {
  const { store } = usePage().props;
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [search, setSearch] = useState("");
  const [selectedPair, setSelectedPair] = useState(null);
  const [modalDetails, setModalDetails] = useState({ purchases: [], other_products: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      const params = new URLSearchParams(window.location.search);
      params.set("range", r);
      params.delete("start_date");
      params.delete("end_date");
      router.get(
        route("store.reports.supplier-insights", { store_slug: store.slug }),
        Object.fromEntries(params.entries()),
        { preserveState: true, preserveScroll: true }
      );
    }
  };
  const applyCustomRange = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("range", "custom");
    params.set("start_date", startDate);
    params.set("end_date", endDate);
    router.get(
      route("store.reports.supplier-insights", { store_slug: store.slug }),
      Object.fromEntries(params.entries()),
      { preserveState: true, preserveScroll: true }
    );
  };
  const filtered = useMemo(() => {
    return data.filter(
      (row) => !search || (row.supplier_name || "").toLowerCase().includes(search.toLowerCase()) || (row.product_name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);
  const chartData = useMemo(() => {
    const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];
    return [...data].sort((a, b) => (b.cost_variance_pct || 0) - (a.cost_variance_pct || 0)).slice(0, 5).map((r, idx) => ({
      name: `${(r.product_name || "").substring(0, 10)} (${(r.supplier_name || "").substring(0, 8)})`,
      value: r.cost_variance_pct || 0,
      color: COLORS[idx % COLORS.length]
    }));
  }, [data]);
  const highRiskPairs = useMemo(() => {
    return [...data].sort((a, b) => (b.cost_variance_pct || 0) - (a.cost_variance_pct || 0)).slice(0, 3);
  }, [data]);
  const handleSelectPair = (pair) => {
    setSelectedPair(pair);
    if (!pair) {
      setModalDetails({ purchases: [], other_products: [] });
      return;
    }
    setIsLoadingDetails(true);
    fetch(route("store.reports.supplier-insights.details", {
      store_slug: store.slug,
      supplier_id: pair.supplier_id,
      product_id: pair.product_id,
      start_date: filters.start_date || startDate,
      end_date: filters.end_date || endDate
    })).then((res) => res.json()).then((json) => {
      setModalDetails({
        purchases: json.purchases || [],
        other_products: json.other_products || []
      });
      setIsLoadingDetails(false);
    }).catch((err) => {
      console.error(err);
      setIsLoadingDetails(false);
    });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Supplier Insights", children: [
    /* @__PURE__ */ jsx(Head, { title: "Supplier Insights & Price History" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-5 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store.slug }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight", children: "Supplier Insights & Price History" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Trace supplier sourcing performance, unit cost variance, and inflation drifts" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-1.5 rounded-xl flex-wrap w-full lg:w-auto", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-slate-400 ml-1.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wide", children: "Period:" }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-lg", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${range === opt.id ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-450" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 rounded-xl", children: [
            /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-slate-600 dark:text-slate-300" }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: "TO" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-slate-600 dark:text-slate-300" }),
            /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0", children: stats.map((s, i) => {
        let colorClass = "text-rose-500 bg-rose-500/10";
        if (s.label.includes("Pairs")) {
          colorClass = "text-indigo-500 bg-indigo-500/10";
        }
        if (s.label.includes("Volume")) {
          colorClass = "text-emerald-500 bg-emerald-500/10";
        }
        return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: s.label }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight mt-1", children: s.value })
          ] }),
          /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${colorClass} shrink-0`, children: s.label.includes("Pairs") ? /* @__PURE__ */ jsx(Truck, { size: 18 }) : /* @__PURE__ */ jsx(DollarSign, { size: 18 }) })
        ] }, i);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/30 gap-4 shrink-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider", children: "Sourcing Price Variance Matrix" }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 text-slate-400", size: 14 }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Search supplier or product...",
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  className: "pl-8 pr-3 py-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: "Supplier & Sourced Item" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Purchases" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Cost Variance" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Cost Limits (L ➔ H)" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-slate-400 italic", children: "No supplier insights found." }) }) : filtered.map((row, idx) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-rose-50/30 dark:hover:bg-slate-850/40 transition-all cursor-pointer group",
                onClick: () => handleSelectPair(row),
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "px-6 py-3.5", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors", children: row.supplier_name }),
                    /* @__PURE__ */ jsx("div", { className: "text-[10px] text-indigo-500 font-bold mt-0.5", children: row.product_name })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right font-mono font-semibold text-slate-500", children: [
                    row.purchase_count,
                    /* @__PURE__ */ jsxs("span", { className: "block text-[10px] text-slate-400 font-sans font-medium", children: [
                      "Qty: ",
                      row.total_qty_purchased
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right", children: [
                    /* @__PURE__ */ jsxs("span", { className: `inline-block px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide ${row.cost_variance_pct > 10 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/20" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20"}`, children: [
                      row.cost_variance_pct,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "block text-[10px] text-slate-400 font-mono mt-0.5", children: [
                      "Avg: ",
                      formatCurrency(row.avg_unit_cost, store)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right font-mono font-medium text-slate-500", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-emerald-500 font-bold", children: formatCurrency(row.min_unit_cost, store) }),
                    /* @__PURE__ */ jsx("div", { className: "text-rose-500 font-bold mt-0.5", children: formatCurrency(row.max_unit_cost, store) })
                  ] })
                ]
              },
              idx
            )) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BarChart2, { size: 14 }),
              " Peak Pricing Variances"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#e2e8f0", className: "dark:stroke-slate-800" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 9 }, tickLine: false }),
              /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 9 }, axisLine: false, tickFormatter: (v) => `${v}%` }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => `${val}% Cost Spread`, contentStyle: { backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" } }),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`)) })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-rose-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 14 }),
                " Margin Risk Alert"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsx("p", { children: "High cost variance (over 10%) suggests volatile supplier pricing that directly eats into your profit margins. Re-negotiate contract rates or check secondary suppliers." }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-amber-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Price Variance Auditor"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-black uppercase tracking-tight mb-2 flex items-center gap-2 text-rose-450", children: [
              /* @__PURE__ */ jsx(Activity, { size: 18 }),
              " Sourcing Risk Audit"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-rose-350 mb-0.5 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                " High Price Fluctuation"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-300", children: [
                "Pricing for ",
                /* @__PURE__ */ jsx("strong", { className: "text-white", children: highRiskPairs[0]?.product_name || "N/A" }),
                " from ",
                /* @__PURE__ */ jsx("strong", { className: "text-white", children: highRiskPairs[0]?.supplier_name || "N/A" }),
                " shifted by ",
                /* @__PURE__ */ jsxs("strong", { className: "text-rose-400", children: [
                  highRiskPairs[0]?.cost_variance_pct || 0,
                  "%"
                ] }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t border-white/10", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-black uppercase text-slate-400 tracking-wider", children: "Top Variance (Pricing Risks)" }),
              highRiskPairs.map((p, idx) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleSelectPair(p),
                  className: "flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-[11px] transition-all cursor-pointer group",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "truncate w-32 group-hover:text-rose-400", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-300 font-medium block", children: p.supplier_name }),
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400", children: p.product_name })
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "font-mono text-rose-450 font-bold", children: [
                      p.cost_variance_pct,
                      "%"
                    ] })
                  ]
                },
                idx
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-[10px] text-slate-400", children: "Shows real-time incoming PO ledger points. Click on any record to inspect cost movements and bills." })
        ] }) })
      ] }),
      selectedPair && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-rose-700 p-5 text-white relative overflow-hidden shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-rose-500/50 text-white border border-rose-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", children: "Supplier Sourcing Analysis" }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight mt-1", children: selectedPair.supplier_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-rose-100 text-xs font-semibold", children: [
                "Sourced Product: ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedPair.product_name })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleSelectPair(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Total Qty Purchased" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white mt-1", children: selectedPair.total_qty_purchased })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Average Unit Cost" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-rose-600 mt-1", children: formatCurrency(selectedPair.avg_unit_cost, store) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase", children: "Cost Variance" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black text-amber-500 mt-1", children: [
                selectedPair.cost_variance_pct,
                "%"
              ] })
            ] })
          ] }),
          isLoadingDetails ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-rose-600 gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "animate-spin text-3xl", children: "⌛" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-400 uppercase tracking-widest", children: "Querying Ledger..." })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 13 }),
                " Sourcing Purchase History"
              ] }),
              modalDetails.purchases.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic", children: "No purchase invoice logs found in this period." }) : /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Date" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "PO Bill No" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Cost" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: modalDetails.purchases.map((pur, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/20", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-slate-500 font-mono", children: pur.date }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-250", children: pur.invoice_no }),
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-slate-600", children: [
                    formatCurrency(pur.unit_cost, store),
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-slate-400 font-normal", children: [
                      "x",
                      pur.quantity
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200", children: formatCurrency(pur.total, store) })
                ] }, idx)) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ShoppingBag, { size: 13 }),
                " Other Sourced Catalog"
              ] }),
              modalDetails.other_products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 italic", children: "No other products sourced from this supplier." }) : /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Product" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Qty Sourced" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Avg Cost" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: modalDetails.other_products.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/20", children: [
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-250 block", children: item.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-mono", children: item.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-semibold text-slate-500", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200", children: formatCurrency(item.avg_cost, store) })
                ] }, idx)) })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => handleSelectPair(null), className: "px-5 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
      ] }) })
    ] })
  ] });
}
export {
  SupplierInsights as default
};
