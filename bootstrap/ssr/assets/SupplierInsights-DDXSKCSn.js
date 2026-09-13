import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, Calendar, Truck, DollarSign, Search, BarChart2, AlertTriangle, ShieldCheck, Activity, X, Clock, ShoppingBag } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { s as series, v as vq } from "./runtime-DwSFgQZq.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
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
function SupplierInsights({ data = [], stats = [], filters = {} }) {
  const { store } = usePage().props;
  const tt = useTermText();
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
    const COLORS = series.light.slice(0, 5);
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
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: tt("Supplier Insights"), children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Supplier Insights & Price History") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-5 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store.slug }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-ink tracking-tight", children: tt("Supplier Insights & Price History") }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: tt("Trace supplier sourcing performance, unit cost variance, and inflation drifts") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-app border border-line p-1.5 rounded-xl flex-wrap w-full lg:w-auto", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-ink-muted ml-1.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wide", children: "Period:" }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-0.5 rounded-lg", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-2.5 py-1 rounded text-2xs font-bold uppercase tracking-wider transition-all ${range === opt.id ? "bg-sunken shadow-sm text-rose-600 dark:text-rose-450" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: opt.label
            },
            opt.id
          )) }),
          range === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-slow bg-surface border border-line p-1 rounded-xl", children: [
            /* @__PURE__ */ jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-ink-secondary" }),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs font-bold", children: "TO" }),
            /* @__PURE__ */ jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "px-2 py-1 bg-app border-none rounded-lg text-xs focus:ring-1 focus:ring-rose-500 text-ink-secondary" }),
            /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm", children: "Apply" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0", children: stats.map((s, i) => {
        let colorClass = "text-rose-500 bg-rose-500/10";
        if (s.label.includes("Pairs")) {
          colorClass = "text-brand-500 bg-brand-500/10";
        }
        if (s.label.includes("Volume")) {
          colorClass = "text-emerald-500 bg-emerald-500/10";
        }
        return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: s.label }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink tracking-tight mt-1", children: s.value })
          ] }),
          /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${colorClass} shrink-0`, children: s.label.includes("Pairs") ? /* @__PURE__ */ jsx(Truck, { size: 18 }) : /* @__PURE__ */ jsx(DollarSign, { size: 18 }) })
        ] }, i);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center bg-sunken/50 dark:bg-surface gap-4 shrink-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-ink uppercase tracking-wider", children: "Sourcing Price Variance Matrix" }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 text-ink-muted", size: 14 }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: tt("Search supplier or product..."),
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  className: "pl-8 pr-3 py-1.5 w-full bg-surface border border-line rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-ink-muted uppercase bg-app sticky top-0 z-10 border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: tt("Supplier & Sourced Item") }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Purchases" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Cost Variance" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Cost Limits (L ➔ H)" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-ink-muted italic", children: tt("No supplier insights found.") }) }) : filtered.map((row, idx) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-rose-50/30 dark:hover:bg-interactive-hover transition-all cursor-pointer group",
                onClick: () => handleSelectPair(row),
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "px-6 py-3.5", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-ink-secondary dark:text-ink group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors", children: row.supplier_name }),
                    /* @__PURE__ */ jsx("div", { className: "text-2xs text-brand-500 font-bold mt-0.5", children: row.product_name })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right font-mono font-semibold text-ink-muted", children: [
                    row.purchase_count,
                    /* @__PURE__ */ jsxs("span", { className: "block text-2xs text-ink-muted font-sans font-medium", children: [
                      "Qty: ",
                      row.total_qty_purchased
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right", children: [
                    /* @__PURE__ */ jsxs("span", { className: `inline-block px-1.5 py-0.5 rounded text-2xs font-bold tracking-wide ${row.cost_variance_pct > 10 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/20" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20"}`, children: [
                      row.cost_variance_pct,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "block text-2xs text-ink-muted font-mono mt-0.5", children: [
                      "Avg: ",
                      formatCurrency(row.avg_unit_cost, store)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right font-mono font-medium text-ink-muted", children: [
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
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-5 rounded-2xl border border-line shadow-sm flex flex-col min-h-[300px]", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BarChart2, { size: 14 }),
              " Peak Pricing Variances"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], className: "dark:stroke-slate-800" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 9 }, tickLine: false }),
              /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 9 }, axisLine: false, tickFormatter: (v) => `${v}%` }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => `${val}% Cost Spread`, contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" } }),
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
                /* @__PURE__ */ jsx("p", { children: tt("High cost variance (over 10%) suggests volatile supplier pricing that directly eats into your profit margins. Re-negotiate contract rates or check secondary suppliers.") }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-amber-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Price Variance Auditor"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold uppercase tracking-tight mb-2 flex items-center gap-2 text-rose-450", children: [
              /* @__PURE__ */ jsx(Activity, { size: 18 }),
              " Sourcing Risk Audit"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-rose-350 mb-0.5 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                " High Price Fluctuation"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-1xs text-neutral-300", children: [
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
              /* @__PURE__ */ jsx("h4", { className: "text-2xs font-bold uppercase text-ink-muted tracking-wider", children: "Top Variance (Pricing Risks)" }),
              highRiskPairs.map((p, idx) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleSelectPair(p),
                  className: "flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-1xs transition-all cursor-pointer group",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "truncate w-32 group-hover:text-rose-400", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-medium block", children: p.supplier_name }),
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted", children: p.product_name })
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
          /* @__PURE__ */ jsx("div", { className: "bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-2xs text-ink-muted", children: "Shows real-time incoming PO ledger points. Click on any record to inspect cost movements and bills." })
        ] }) })
      ] }),
      selectedPair && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-5xl rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[85vh]", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-rose-700 p-5 text-white relative overflow-hidden shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-rose-500/50 text-white border border-rose-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider", children: tt("Supplier Sourcing Analysis") }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight mt-1", children: selectedPair.supplier_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-rose-100 text-xs font-semibold", children: [
                tt("Sourced Product:"),
                " ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedPair.product_name })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleSelectPair(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Qty Purchased" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink mt-1", children: selectedPair.total_qty_purchased })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Average Unit Cost" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-rose-600 mt-1", children: formatCurrency(selectedPair.avg_unit_cost, store) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Cost Variance" }),
              /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-amber-500 mt-1", children: [
                selectedPair.cost_variance_pct,
                "%"
              ] })
            ] })
          ] }),
          isLoadingDetails ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-rose-600 gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "animate-spin text-3xl", children: "⌛" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest", children: "Querying Ledger..." })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 13 }),
                " Sourcing Purchase History"
              ] }),
              modalDetails.purchases.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic", children: "No purchase invoice logs found in this period." }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Date" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "PO Bill No" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Cost" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: modalDetails.purchases.map((pur, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-ink-muted font-mono", children: pur.date }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 font-semibold text-ink-secondary dark:text-ink", children: pur.invoice_no }),
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-ink-secondary", children: [
                    formatCurrency(pur.unit_cost, store),
                    " ",
                    /* @__PURE__ */ jsxs("span", { className: "text-2xs text-ink-muted font-normal", children: [
                      "x",
                      pur.quantity
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink", children: formatCurrency(pur.total, store) })
                ] }, idx)) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ShoppingBag, { size: 13 }),
                " Other Sourced Catalog"
              ] }),
              modalDetails.other_products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic", children: tt("No other products sourced from this supplier.") }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: tt("Product") }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Qty Sourced" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Avg Cost" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: modalDetails.other_products.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary dark:text-ink block", children: item.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-mono", children: item.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-semibold text-ink-muted", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink", children: formatCurrency(item.avg_cost, store) })
                ] }, idx)) })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => handleSelectPair(null), className: "px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
      ] }) })
    ] })
  ] });
}
export {
  SupplierInsights as default
};
