import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { Wallet, Search, Download, CreditCard, AlertCircle, Building2, BrainCircuit, Sparkles } from "lucide-react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { v as vq, s as series } from "./runtime-DwSFgQZq.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
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
function PurchasesReport({ purchases = [], stats = {}, filters = {}, suppliers = [] }) {
  const tt = useTermText();
  const {
    store
  } = usePage().props;
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(filters.range === "custom");
  const [customStart, setCustomStart] = useState(filters.start_date || "");
  const [customEnd, setCustomEnd] = useState(filters.end_date || "");
  const formatDate = (dateString, options = {}) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", options);
    } catch (e) {
      return dateString;
    }
  };
  const processedPurchases = useMemo(() => {
    let data = [...purchases];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (item) => (item.invoice_number || "").toLowerCase().includes(lowerQ) || (item.party?.name || "").toLowerCase().includes(lowerQ)
      );
    }
    return data;
  }, [purchases, searchQuery]);
  const aiInsights = useMemo(() => {
    if (purchases.length === 0) {
      return [{
        type: "neutral",
        title: "Waiting for Data",
        message: "Growth Engine needs transaction data to generate insights. Add purchases to see analysis here."
      }];
    }
    const totalValue = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    const supplierSpend = {};
    purchases.forEach((p) => {
      const name = p.party?.name || "Unknown";
      supplierSpend[name] = (supplierSpend[name] || 0) + parseFloat(p.total_amount || 0);
    });
    const sortedSuppliers = Object.entries(supplierSpend).sort(([, a], [, b]) => b - a);
    const topSupplier = sortedSuppliers[0];
    const topSupplierShare = topSupplier[1] / totalValue * 100;
    const paidCount = purchases.filter((p) => p.status === "paid" || p.paid_amount >= p.total_amount).length;
    const unpaidCount = purchases.length - paidCount;
    const unpaidRatio = unpaidCount / purchases.length * 100;
    const insights = [];
    if (topSupplierShare > 40) {
      insights.push({
        type: "warning",
        title: "High Supplier Dependency",
        message: `${topSupplier[0]} accounts for ${topSupplierShare.toFixed(1)}% of your total spending. Consider diversifying suppliers to reduce risk.`
      });
    } else {
      insights.push({
        type: "success",
        title: "Balanced Supplier Mix",
        message: "Your spending is well-distributed. Top supplier share is " + topSupplierShare.toFixed(1) + "%."
      });
    }
    if (unpaidRatio > 50) {
      insights.push({
        type: "critical",
        title: "Payment Backlog",
        message: `${unpaidRatio.toFixed(1)}% of bills are unpaid. Prioritize critical vendors to maintain credit lines.`
      });
    }
    return insights;
  }, [purchases]);
  const chartData = useMemo(() => {
    const dailyMap = {};
    purchases.forEach((p) => {
      const date = p.created_at ? p.created_at.split("T")[0] : "";
      if (date) {
        dailyMap[date] = (dailyMap[date] || 0) + parseFloat(p.total_amount || 0);
      }
    });
    const daily = Object.keys(dailyMap).sort().map((date) => ({
      name: formatDate(date, { day: "2-digit", month: "short" }),
      value: dailyMap[date]
    }));
    const supplierMap = {};
    purchases.forEach((p) => {
      const name = p.party?.name || "Unknown";
      supplierMap[name] = (supplierMap[name] || 0) + parseFloat(p.total_amount || 0);
    });
    const suppliersList = Object.keys(supplierMap).map((name) => ({ name, value: supplierMap[name] })).sort((a, b) => b.value - a.value).slice(0, 5);
    return { daily, suppliers: suppliersList };
  }, [purchases]);
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      router.get(route("store.reports.purchases", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    if (customStart && customEnd) {
      router.get(route("store.reports.purchases", {
        store_slug: store.slug
      }), {
        range: "custom",
        start_date: customStart,
        end_date: customEnd
      }, { preserveState: true, preserveScroll: true });
    }
  };
  series.light.slice(0, 5);
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Purchases Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Purchases Report" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-[1600px] mx-auto min-h-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Wallet, { className: "text-brand-500" }),
            "Purchases & Expenses"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: tt("Track spending, manage suppliers, and analyze costs") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: tt("Search bills or suppliers..."),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-4 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-brand-500 w-64"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-lg", children: ["today", "this_month", "this_year", "custom"].map((r) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(r),
              className: `px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: r === "this_month" ? "This Month" : r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
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
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Purchases",
            value: stats.total_purchases,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(Wallet, { size: 20, className: "text-white" }),
            color: "bg-brand-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Amount Paid",
            value: stats.total_paid,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(CreditCard, { size: 20, className: "text-white" }),
            color: "bg-emerald-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Payable Due",
            value: stats.total_due,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(AlertCircle, { size: 20, className: "text-white" }),
            color: "bg-rose-500",
            subtext: stats.total_due > 0 ? "Outstanding Balance" : "All clear"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Bills",
            value: stats.count,
            icon: /* @__PURE__ */ jsx(Building2, { size: 20, className: "text-white" }),
            color: "bg-neutral-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-ink-secondary dark:text-ink", children: "Recent Transactions" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted bg-sunken px-2 py-1 rounded-full", children: [
              processedPurchases.length,
              " Records"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Date" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: "Invoice #" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider", children: tt("Supplier") }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right", children: "Total" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-ink-muted uppercase tracking-wider text-right", children: "Status" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: processedPurchases.length > 0 ? processedPurchases.map((item) => {
              const paid = parseFloat(item.paid_amount || 0);
              const total = parseFloat(item.total_amount || 0);
              const isPaid = paid >= total;
              const isPartial = paid > 0 && paid < total;
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors cursor-pointer group", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-muted font-mono", children: formatDate(item.created_at, { day: "2-digit", month: "short", year: "numeric" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-bold text-ink-secondary font-mono group-hover:text-brand-500", children: item.invoice_number }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-ink-secondary font-medium", children: item.party?.name || "Unknown" }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-bold text-ink text-right", children: formatCurrency(total) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: isPaid ? /* @__PURE__ */ jsx("span", { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-2xs font-bold px-2 py-0.5 rounded-full uppercase", children: "Paid" }) : isPartial ? /* @__PURE__ */ jsx("span", { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-2xs font-bold px-2 py-0.5 rounded-full uppercase", children: "Partial" }) : /* @__PURE__ */ jsx("span", { className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-2xs font-bold px-2 py-0.5 rounded-full uppercase", children: "Unpaid" }) })
              ] }, item.id);
            }) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-ink-muted opacity-60", children: [
              /* @__PURE__ */ jsx(Search, { size: 48, className: "mb-2 stroke-1" }),
              /* @__PURE__ */ jsx("p", { children: "No transactions found" })
            ] }) }) }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden min-h-0", children: [
          aiInsights && aiInsights.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-gradient-brand rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-slower", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(BrainCircuit, { className: "text-brand-200", size: 20 }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-brand-100", children: "Growth Engine AI" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: aiInsights.map((insight, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-3 text-xs border border-white/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 12, className: insight.type === "warning" || insight.type === "critical" ? "text-rose-300" : "text-emerald-300" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold", children: insight.title })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "opacity-90 leading-relaxed", children: insight.message })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: tt("Top Spending (Suppliers)") }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData.suppliers, layout: "vertical", margin: { left: 0, right: 30 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.1 }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", width: 80, tick: { fontSize: 10, fill: vq.slate[400] } }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
                  formatter: (val) => formatCurrency(val)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: vq.indigo[500], radius: [0, 4, 4, 0], barSize: 20 })
            ] }) }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, isCurrency = false, subtext }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between group hover:shadow-md transition-all", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-ink-muted uppercase tracking-wider mb-1", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-ink", children: isCurrency ? formatCurrency(value || 0) : value || 0 }),
      subtext && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-1", children: subtext })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg transition-transform`, children: icon })
  ] });
}
export {
  PurchasesReport as default
};
