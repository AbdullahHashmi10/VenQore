import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { ArrowLeft, TrendingUp, CreditCard, AlertCircle, Activity, DollarSign, FileText, HelpCircle, Target, Zap, Lightbulb, Loader2, X, Printer, Edit, MessageCircle } from "lucide-react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, Tooltip, Area } from "recharts";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function SalesReport({ sales = [], stats = {}, chartData = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  if (!store?.slug) return null;
  const { props } = usePage();
  const [startDate, setStartDate] = useState(filters.start_date || "");
  const [endDate, setEndDate] = useState(filters.end_date || "");
  const [range, setRange] = useState(filters.range || "this_month");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [quickViewSale, setQuickViewSale] = useState(null);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  const handleRangeChange = (r) => {
    setRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.sales", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.sales", {
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
      if (stats.total_due > stats.total_sales * 0.2) {
        insights.push({ type: "danger", title: "Cash Flow Risk", text: `You have ${formatCurrency(stats.total_due, store)} in unpaid invoices. Follow up with debtors immediately.` });
      }
      if (chartData.length > 2) {
        const last = chartData[chartData.length - 1].value;
        const prev = chartData[chartData.length - 2].value;
        if (last > prev * 1.1) {
          insights.push({ type: "success", title: "Upward Trend", text: "Sales are picking up! Ensure inventory levels can match this demand." });
        } else if (last < prev * 0.8) {
          insights.push({ type: "warning", title: "Sales Dip", text: "Recent sales have dropped. Consider running a weekend promotion." });
        }
      }
      if (stats.avg_ticket < 1e3) {
        insights.push({ type: "opportunity", title: "Upsell Potential", text: `Avg ticket is ${formatCurrency(stats.avg_ticket, store)}. Bundling products could boost this by 15%.` });
      } else {
        insights.push({ type: "success", title: "Strong Basket Size", text: "Customers are buying multiple items. Maintain this momentum." });
      }
      setAnalysisResult({
        score: Math.min(100, Math.max(0, 80 - stats.total_due / stats.total_sales * 50 + (stats.count > 0 ? 10 : 0))),
        insights
      });
      setIsAnalyzing(false);
    }, 1500);
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Sales Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sales Intelligence" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full relative", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2", children: [
              "Sales ",
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium text-sm", children: "Overview" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Revenue performance & trends" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl", children: [{ id: "this_month", label: "This Month" }, { id: "last_month", label: "Last Month" }, { id: "this_year", label: "This Year" }, { id: "custom", label: "Custom" }].map((opt) => /* @__PURE__ */ jsx(
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
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0", children: [
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Sales", value: formatCurrency(stats.total_sales, store), color: "emerald", icon: /* @__PURE__ */ jsx(TrendingUp, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Cash Collected", value: formatCurrency(stats.total_paid, store), color: "blue", icon: /* @__PURE__ */ jsx(CreditCard, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Outstanding", value: formatCurrency(stats.total_due, store), color: stats.total_due > 0 ? "rose" : "emerald", icon: /* @__PURE__ */ jsx(AlertCircle, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Avg Ticket", value: formatCurrency(stats.avg_ticket, store), color: "indigo", icon: /* @__PURE__ */ jsx(Activity, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Discount", value: formatCurrency(stats.total_discount, store), color: "amber", icon: /* @__PURE__ */ jsx(DollarSign, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Highest Sale", value: formatCurrency(stats.max_sale, store), color: "emerald", icon: /* @__PURE__ */ jsx(TrendingUp, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Total Invoices", value: stats.count, color: "blue", icon: /* @__PURE__ */ jsx(FileText, {}) }),
        /* @__PURE__ */ jsx(RatioCard, { title: "Unpaid Count", value: stats.unpaid_count, color: stats.unpaid_count > 0 ? "rose" : "emerald", icon: /* @__PURE__ */ jsx(AlertCircle, {}) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30", children: /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Recent Transactions" }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
            /* @__PURE__ */ jsx("thead", { className: "text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 backdrop-blur-sm z-10", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: "Ref #" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 font-bold", children: "Customer" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right font-bold", children: "Total" }),
              /* @__PURE__ */ jsx("th", { className: "px-6 py-3 text-right font-bold", children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sales.length > 0 ? sales.map((sale, idx) => {
              const total = Number(sale.total_amount) || 0;
              const paid = Number(sale.paid_amount) || 0;
              const due = total - paid;
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer", onClick: () => setQuickViewSale(sale), children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400", children: [
                  "#",
                  sale.invoice_number || sale.reference_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 font-medium text-slate-700 dark:text-slate-200", children: sale.party?.name || "Walk-in Customer" }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right font-bold font-mono text-slate-800 dark:text-white", children: formatCurrency(total, store) }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: due > 5 ? /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400", children: "Unpaid" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", children: "Paid" }) })
              ] }, idx);
            }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-6 py-8 text-center text-slate-400 italic", children: "No sales found for this period." }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "xl:col-span-1 flex flex-col gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 min-h-[300px] flex flex-col", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { size: 14 }),
              " Revenue Trend"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 relative", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorValue", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.emerald[500], stopOpacity: 0.3 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.emerald[500], stopOpacity: 0 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: vq.slate[700], opacity: 0.1, vertical: false }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "name", axisLine: false, tickLine: false, tick: { fontSize: 10, fill: vq.slate[400] } }),
              /* @__PURE__ */ jsx(Tooltip, { formatter: (val) => formatCurrency(val, store), contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" }, itemStyle: { color: "#fff" } }),
              /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "value", stroke: vq.emerald[500], strokeWidth: 3, fillOpacity: 1, fill: "url(#colorValue)" })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold opacity-90 mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 14 }),
                " Sales Tip"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs opacity-80 leading-relaxed space-y-2", children: [
                /* @__PURE__ */ jsxs("p", { children: [
                  "Focus on converting ",
                  /* @__PURE__ */ jsx("strong", { children: "Walk-in" }),
                  " customers into registered profiles to track repeat business."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-white/10 flex items-center gap-1 font-bold text-emerald-300", children: [
                  /* @__PURE__ */ jsx(Target, { size: 14 }),
                  " Boost Retention"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "xl:col-span-1 flex flex-col gap-4 h-full", children: /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg text-white h-full relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("h3", { className: "text-base font-black uppercase tracking-tight mb-4 flex items-center gap-2 text-emerald-400", children: [
            /* @__PURE__ */ jsx(Zap, { size: 18, fill: "currentColor" }),
            " Sales Engine"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-emerald-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Activity, { size: 12 }),
                " Live Pulse"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-300 mobile-relaxed", children: "Monitor real-time sales velocity and detect dips before they become trends." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-amber-300 mb-1 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Lightbulb, { size: 12 }),
                " Smart Insight"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-300", children: "Reducing total outstanding by 10% improves cash flow significantly." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: runAnalysis, disabled: isAnalyzing, className: "w-full mt-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-wait", children: [
            isAnalyzing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Zap, { size: 16, fill: "currentColor" }),
            isAnalyzing ? "Scanning Sales..." : "Run Sales Diagnosis"
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
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black tracking-tight", children: "Sales Intelligence" }),
            /* @__PURE__ */ jsxs("p", { className: "text-indigo-200 text-sm font-medium", children: [
              "Performance Score: ",
              /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
                analysisResult.score.toFixed(0),
                "/100"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 space-y-4 max-h-[60vh] overflow-y-auto", children: analysisResult.insights.map((insight, idx) => /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border-l-4 ${insight.type === "danger" ? "bg-rose-50 border-rose-500 dark:bg-rose-900/10 text-rose-700" : insight.type === "warning" ? "bg-amber-50 border-amber-500 dark:bg-amber-900/10 text-amber-700" : insight.type === "success" ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/10 text-emerald-700" : "bg-slate-50 border-indigo-500 dark:bg-slate-800 text-slate-700"}`, children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold mb-1", children: insight.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs opacity-80", children: insight.text })
        ] }, idx)) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end", children: /* @__PURE__ */ jsx("button", { onClick: () => setAnalysisResult(null), className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors", children: "Dismiss" }) })
      ] }) }),
      quickViewSale && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", onClick: () => setQuickViewSale(null), children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs sm:text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Invoice Preview" }),
                  /* @__PURE__ */ jsx("h3", { className: "text-lg sm:text-xl font-black text-indigo-600 truncate", children: quickViewSale.reference_number || quickViewSale.invoice_number })
                ] }),
                quickViewSale.source === "pos" && /* @__PURE__ */ jsx("span", { className: "text-2xs font-black bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full uppercase shrink-0", children: "POS" }),
                /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${quickViewSale.payment_status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : quickViewSale.payment_status === "partial" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`, children: quickViewSale.payment_status || (quickViewSale.total_amount - quickViewSale.paid_amount > 0 ? "Unpaid" : "Paid") })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: route("store.sales.print", [store.slug, quickViewSale.id]),
                    target: "_blank",
                    className: "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx(Printer, { size: 14 }),
                      " Print"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: route("store.sales.edit", [store.slug, quickViewSale.id]),
                    className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx(Edit, { size: 14 }),
                      " Edit Invoice"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setQuickViewSale(null),
                    className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
                    children: /* @__PURE__ */ jsx(X, { size: 18 })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Customer" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewSale.party?.name || quickViewSale.customer?.name || "Walk-in" }),
                  quickViewSale.party?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: quickViewSale.party.phone })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Date & Time" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewSale.created_at) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: new Date(quickViewSale.created_at).toLocaleTimeString() })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Payment" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm uppercase", children: quickViewSale.payment_method || "Cash" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-indigo-600 uppercase mb-1", children: "Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-black text-indigo-600 text-lg", children: formatCurrency(quickViewSale.total_amount || quickViewSale.total, store) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
                /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-300 uppercase", children: [
                  "Items in this Invoice (",
                  quickViewSale.sale_items?.length || quickViewSale.items?.length || 0,
                  ")"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "hidden sm:block max-h-[300px] overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                  /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "#" }),
                    /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "Item Name" }),
                    /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-slate-400 uppercase", children: "Qty" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Rate" }),
                    /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Total" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: (quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50", children: [
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-400 font-mono text-xs", children: idx + 1 }),
                    /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: item.product?.name || item.name || "Unknown Item" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: formatNumber(item.quantity) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: formatCurrency(item.unit_price || item.price || 0, store) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency(item.total_price || item.quantity * (item.unit_price || item.price || 0), store) })
                  ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "block sm:hidden divide-y divide-slate-150 dark:divide-slate-800 max-h-[300px] overflow-auto", children: (quickViewSale.sale_items || quickViewSale.items || []).length > 0 ? (quickViewSale.sale_items || quickViewSale.items).map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-start", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-slate-400 font-mono text-xs", children: [
                        idx + 1,
                        "."
                      ] }),
                      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white text-xs", children: item.product?.name || item.name || "Unknown Item" }) })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-800 dark:text-white shrink-0", children: formatCurrency(item.total_price || item.quantity * (item.unit_price || item.price || 0), store) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-2xs bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400 block uppercase", children: "Qty" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatNumber(item.quantity) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400 block uppercase", children: "Rate" }),
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700 dark:text-slate-300", children: formatCurrency(item.unit_price || item.price || 0, store) })
                    ] })
                  ] })
                ] }, idx)) : /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-slate-400 text-xs", children: "No items data available" }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex gap-6 justify-between w-full sm:w-auto", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Paid Amount" }),
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600", children: formatCurrency(Number(quickViewSale.paid_amount) || 0, store) })
                  ] }),
                  (() => {
                    const paid = Number(quickViewSale.paid_amount) || 0;
                    const total = Number(quickViewSale.total_amount || quickViewSale.total) || 0;
                    const balance = total - paid;
                    if (balance > 1) {
                      return /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 uppercase", children: "Balance Due" }),
                        /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: formatCurrency(balance, store) })
                      ] });
                    }
                    return null;
                  })()
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-2 w-full sm:w-auto justify-end", children: /* @__PURE__ */ jsxs("button", { className: "px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(MessageCircle, { size: 14 }),
                  " Share"
                ] }) })
              ] })
            ] })
          ]
        }
      ) })
    ] })
  ] });
}
function RatioCard({ title, value, color, icon }) {
  const colors = { indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400", rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400", blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400", amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 hover:shadow-md transition-all group", children: [
    /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${colors[color]} shrink-0 group-hover:scale-105 transition-transform`, children: React.cloneElement(icon, { size: 16 }) }),
    /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-slate-500 uppercase tracking-wider", children: title }),
    /* @__PURE__ */ jsx("span", { className: "ml-auto text-base font-black text-slate-800 dark:text-white tracking-tight", children: value })
  ] });
}
export {
  SalesReport as default
};
