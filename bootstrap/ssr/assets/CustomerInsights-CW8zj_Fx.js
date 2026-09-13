import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, Calendar, Users, DollarSign, Search, Award, BarChart2, HelpCircle, ShieldCheck, Zap, X, Clock, ShoppingBag } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { s as series, v as vq } from "./runtime-DwSFgQZq.js";
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
function CustomerInsights({ data = [], stats = [], filters = {} }) {
  const tt = useTermText();
  const { store } = usePage().props;
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalDetails, setModalDetails] = useState({ invoices: [], top_items: [] });
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      const params = new URLSearchParams(window.location.search);
      params.set("range", r);
      params.delete("start_date");
      params.delete("end_date");
      router.get(
        route("store.reports.customer-insights", { store_slug: store.slug }),
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
      route("store.reports.customer-insights", { store_slug: store.slug }),
      Object.fromEntries(params.entries()),
      { preserveState: true, preserveScroll: true }
    );
  };
  const filtered = useMemo(() => {
    return data.filter(
      (c) => !search || (c.party_name || "").toLowerCase().includes(search.toLowerCase()) || (c.favorite_category || "").toLowerCase().includes(search.toLowerCase()) || (c.most_bought_item || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);
  const chartData = useMemo(() => {
    const COLORS = series.light.slice(0, 5);
    return [...data].sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0)).slice(0, 5).map((c, idx) => ({
      name: (c.party_name || "").substring(0, 15),
      value: c.total_spend || 0,
      color: COLORS[idx % COLORS.length]
    }));
  }, [data]);
  const vipCustomers = useMemo(() => {
    return [...data].sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0)).slice(0, 3);
  }, [data]);
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    if (!customer) {
      setModalDetails({ invoices: [], top_items: [] });
      return;
    }
    setIsLoadingDetails(true);
    fetch(route("store.reports.customer-insights.details", {
      store_slug: store.slug,
      party_id: customer.party_id,
      start_date: filters.start_date || startDate,
      end_date: filters.end_date || endDate
    })).then((res) => res.json()).then((json) => {
      setModalDetails({
        invoices: json.invoices || [],
        top_items: json.top_items || []
      });
      setIsLoadingDetails(false);
    }).catch((err) => {
      console.error(err);
      setIsLoadingDetails(false);
    });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: tt("Customer Insights"), children: [
    /* @__PURE__ */ jsx(Head, { title: tt("Customer Insights") }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-5 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface p-4 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", { store_slug: store.slug }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-ink tracking-tight", children: tt("Customer Insights") }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: "Real-time cohort spend tracking and favorite category patterns" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-app border border-line p-1.5 rounded-xl flex-wrap w-full lg:w-auto", children: [
          /* @__PURE__ */ jsx(Calendar, { size: 15, className: "text-ink-muted ml-1.5" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wide", children: "Period:" }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-0.5 rounded-lg", children: [{ id: "today", label: "Today" }, { id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(opt.id),
              className: `px-2.5 py-1 rounded text-2xs font-bold uppercase tracking-wider transition-all ${range === opt.id ? "bg-sunken shadow-sm text-brand-600 dark:text-brand-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
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
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0", children: stats.map((s, i) => {
        let colorClass = "text-brand-500 bg-brand-500/10";
        let valPrefix = "";
        if (s.label.includes("Revenue")) {
          colorClass = "text-emerald-500 bg-emerald-500/10";
          valPrefix = "$ ";
        }
        if (s.label.includes("Spend / Customer")) {
          colorClass = "text-blue-500 bg-blue-500/10";
          valPrefix = "$ ";
        }
        return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: s.label }),
            /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-ink tracking-tight mt-1", children: [
              valPrefix,
              s.value
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${colorClass} shrink-0`, children: s.label.includes("Customers") ? /* @__PURE__ */ jsx(Users, { size: 18 }) : /* @__PURE__ */ jsx(DollarSign, { size: 18 }) })
        ] }, i);
      }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-surface rounded-2xl border border-line shadow-sm flex flex-col overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex flex-col sm:flex-row justify-between items-start sm:items-center bg-sunken/50 dark:bg-surface gap-4 shrink-0", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-ink uppercase tracking-wider", children: tt("Customer Loyalty Registry") }),
            /* @__PURE__ */ jsxs("div", { className: "relative w-full sm:w-64", children: [
              /* @__PURE__ */ jsx(Search, { className: "absolute left-2.5 top-2.5 text-ink-muted", size: 14 }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: tt("Search customer patterns..."),
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                  className: "pl-8 pr-3 py-1.5 w-full bg-surface border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-ink-muted uppercase bg-app sticky top-0 z-10 border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: tt("Customer") }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Invoices" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right font-bold", children: "Total Spent" }),
              /* @__PURE__ */ jsx("th", { className: "px-4 py-3 font-bold", children: "Preferences" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-6 py-12 text-center text-ink-muted italic", children: tt("No customer insights found.") }) }) : filtered.map((row, idx) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-brand-50/50 dark:hover:bg-interactive-hover transition-all cursor-pointer group",
                onClick: () => handleSelectCustomer(row),
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "px-6 py-3.5", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-ink-secondary dark:text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors", children: row.party_name }),
                    /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted font-mono mt-0.5", children: [
                      "Last Active: ",
                      row.last_purchase_at || "N/A"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5 text-right font-mono font-semibold text-ink-muted", children: row.invoice_count }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5 text-right font-mono font-bold text-ink", children: [
                    formatCurrency(row.total_spend, store),
                    /* @__PURE__ */ jsxs("span", { className: "block text-2xs text-ink-muted font-sans font-medium", children: [
                      "Avg: ",
                      formatCurrency(row.avg_invoice_value, store)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5", children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-2xs font-bold text-brand-500 flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(Award, { size: 10 }),
                      " ",
                      row.favorite_category || "N/A"
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-3xs text-ink-muted italic mt-0.5 truncate w-36", children: [
                      "Top: ",
                      row.most_bought_item || "N/A"
                    ] })
                  ] })
                ]
              },
              row.party_id || idx
            )) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface p-5 rounded-2xl border border-line shadow-sm flex flex-col min-h-[300px]", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BarChart2, { size: 14 }),
              " ",
              tt("Top Customer Contribution")
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, margin: { top: 10, right: 10, left: -20, bottom: 0 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], className: "dark:stroke-slate-800" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fontSize: 9 }, tickLine: false }),
              /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 9 }, axisLine: false, tickFormatter: (v) => `$${v}` }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => formatCurrency(val, store), contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" } }),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`)) })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-brand-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Strategy Tip"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsx("p", { children: tt("Identify your top spenders to create targeted customer rewards or discounts to drive catalog engagement.") }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300", children: [
                  /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                  " Retention Focused"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-neutral-900 to-neutral-800 p-5 rounded-2xl border border-neutral-700 shadow-lg text-white h-full relative overflow-hidden flex flex-col justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-base font-bold uppercase tracking-tight mb-2 flex items-center gap-2 text-emerald-400", children: [
              /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
              " Cohort intelligence"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10 space-y-2", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-brand-300 mb-0.5 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Award, { size: 12 }),
                " Top Spender"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-1xs text-neutral-300", children: [
                "Your top buyer in this period is ",
                /* @__PURE__ */ jsx("strong", { className: "text-white", children: vipCustomers[0]?.party_name || "N/A" }),
                " with a total spend of ",
                /* @__PURE__ */ jsx("strong", { className: "text-emerald-400", children: formatCurrency(vipCustomers[0]?.total_spend || 0, store) }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t border-white/10", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-2xs font-bold uppercase text-ink-muted tracking-wider", children: "Top Spenders (VIP Cluster)" }),
              vipCustomers.map((c, idx) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => handleSelectCustomer(c),
                  className: "flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-1xs transition-all cursor-pointer group",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-medium truncate w-32 group-hover:text-brand-400", children: c.party_name }),
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-emerald-400 font-bold", children: formatCurrency(c.total_spend, store) })
                  ]
                },
                idx
              ))
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-2xs text-ink-muted", children: "Displays live ledger summaries. Click on any row to open the complete invoice log and itemized purchase breakdown." })
        ] }) })
      ] }),
      selectedCustomer && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-normal", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface w-full max-w-5xl rounded-2xl shadow-2xl border border-line overflow-hidden animate-in zoom-in-95 duration-normal flex flex-col max-h-[85vh]", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-brand-600 p-5 text-white relative overflow-hidden shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex justify-between items-center", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-brand-500/50 text-white border border-brand-400/30 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider", children: "Spender Profile Analysis" }),
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold tracking-tight mt-1", children: selectedCustomer.party_name }),
              /* @__PURE__ */ jsxs("p", { className: "text-brand-100 text-xs font-semibold", children: [
                "Last Active Purchase: ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedCustomer.last_purchase_at || "N/A" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => handleSelectCustomer(null), className: "text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-6 overflow-y-auto flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Spent in Period" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink mt-1", children: formatCurrency(selectedCustomer.total_spend, store) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Invoices Registered" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-brand-500 mt-1", children: selectedCustomer.invoice_count })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl border border-line", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Average Ticket Value" }),
              /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-500 mt-1", children: formatCurrency(selectedCustomer.avg_invoice_value, store) })
            ] })
          ] }),
          isLoadingDetails ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-brand-500 gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "animate-spin text-3xl", children: "⌛" }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-widest", children: "Querying Ledger..." })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Clock, { size: 13 }),
                " Invoice Purchase History"
              ] }),
              modalDetails.invoices.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic", children: "No invoice transaction logs found in this period." }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Date" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Invoice No" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Amount" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: modalDetails.invoices.map((inv, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-ink-muted font-mono", children: inv.date }),
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3 font-semibold text-ink-secondary dark:text-ink", children: [
                    inv.invoice_no,
                    /* @__PURE__ */ jsx("span", { className: `inline-block ml-2 px-1 text-4xs rounded uppercase font-bold ${inv.status === "posted" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20" : "bg-amber-100 text-amber-600 dark:bg-amber-950/20"}`, children: inv.status })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink", children: formatCurrency(inv.amount, store) })
                ] }, idx)) })
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-6 flex flex-col", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ShoppingBag, { size: 13 }),
                " ",
                tt("Product Buying Preferences")
              ] }),
              modalDetails.top_items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 rounded-xl bg-app border border-dashed border-line text-center text-ink-muted italic", children: tt("No products purchases found.") }) : /* @__PURE__ */ jsx("div", { className: "border border-line rounded-xl overflow-hidden bg-surface shadow-sm flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: tt("Product") }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Qty Bought" }),
                  /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3 text-right", children: "Total Spent" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: modalDetails.top_items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
                  /* @__PURE__ */ jsxs("td", { className: "py-2.5 px-3", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary dark:text-ink block", children: item.name }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-mono", children: item.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-semibold text-ink-muted", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "py-2.5 px-3 text-right font-mono font-bold text-ink-secondary dark:text-ink", children: formatCurrency(item.total_spent, store) })
                ] }, idx)) })
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-line bg-app flex justify-end shrink-0", children: /* @__PURE__ */ jsx("button", { onClick: () => handleSelectCustomer(null), className: "px-5 py-2 bg-neutral-800 hover:bg-interactive-hover dark:hover:bg-interactive-hover text-white text-xs sm:text-sm font-bold rounded-lg transition-colors", children: "Close" }) })
      ] }) })
    ] })
  ] });
}
export {
  CustomerInsights as default
};
