import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, PackageMinus, Calendar, Search, ArrowUpRight } from "lucide-react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import "./OneGlanceLayout-D0x15wPs.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
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
function PurchaseReturnsReport({ returns = [], filters = {}, suppliers = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [supplierId, setSupplierId] = useState(filters.supplier_id || "");
  const handleFilterChange = (range, supplier) => {
    setDateRange(range);
    setSupplierId(supplier);
    router.get(route("store.reports.purchase-returns", {
      store_slug: store.slug,
      range,
      supplier_id: supplier
    }), {}, { preserveState: true });
  };
  const processedData = useMemo(() => {
    let data = [...returns];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (ret) => (ret.reference_number || "").toLowerCase().includes(lowerQ) || (ret.supplier?.name || "").toLowerCase().includes(lowerQ) || (ret.reason || "").toLowerCase().includes(lowerQ)
      );
    }
    return data;
  }, [returns, searchQuery]);
  const totalReturnAmount = useMemo(() => {
    return processedData.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
  }, [processedData]);
  const chartData = useMemo(() => {
    const groups = {};
    processedData.forEach((r) => {
      const dateStr = new Date(r.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
      groups[dateStr] = (groups[dateStr] || 0) + parseFloat(r.amount || 0);
    });
    return Object.entries(groups).map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2))
    })).reverse();
  }, [processedData]);
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Purchase Returns Report", activeTab: "purchases", children: [
    /* @__PURE__ */ jsx(Head, { title: "Purchase Returns Report" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(
            Link,
            {
              href: route("store.reports.index", { store_slug: store?.slug }),
              className: "p-2 text-ink-muted hover:text-ink-secondary rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors",
              children: /* @__PURE__ */ jsx(ArrowLeft, { size: 20 })
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl md:text-2xl font-bold text-ink uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(PackageMinus, { className: "text-red-500 w-6 h-6" }),
              "Purchase Returns"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: tt("Track and analyze stock returns and debit notes sent to suppliers.") })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-line", children: [
            /* @__PURE__ */ jsx(Calendar, { size: 16, className: "text-ink-muted" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: dateRange,
                onChange: (e) => handleFilterChange(e.target.value, supplierId),
                className: "border-0 bg-transparent text-xs font-bold text-ink-secondary p-0 focus:ring-0 focus:outline-none cursor-pointer",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "today", children: "Today" }),
                  /* @__PURE__ */ jsx("option", { value: "yesterday", children: "Yesterday" }),
                  /* @__PURE__ */ jsx("option", { value: "this_week", children: "This Week" }),
                  /* @__PURE__ */ jsx("option", { value: "this_month", children: "This Month" }),
                  /* @__PURE__ */ jsx("option", { value: "last_month", children: "Last Month" }),
                  /* @__PURE__ */ jsx("option", { value: "this_year", children: "This Year" }),
                  /* @__PURE__ */ jsx("option", { value: "all", children: "All Time" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-line", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: supplierId,
              onChange: (e) => handleFilterChange(dateRange, e.target.value),
              className: "border-0 bg-transparent text-xs font-bold text-ink-secondary p-0 focus:ring-0 focus:outline-none cursor-pointer",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: tt("All Suppliers") }),
                suppliers.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
              ]
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 border border-line shadow-sm flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Total Returned Amount" }),
          /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold text-red-600 dark:text-red-400 mt-1", children: formatCurrency(totalReturnAmount, store) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl", children: /* @__PURE__ */ jsx(PackageMinus, { className: "text-red-500 w-8 h-8" }) })
      ] }),
      chartData.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl p-6 border border-line shadow-sm", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider mb-4", children: "Returns Trend" }),
        /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: "#E2E8F0" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", stroke: "#94A3B8", fontSize: 11, tickLine: false }),
          /* @__PURE__ */ jsx(YAxis, { stroke: "#94A3B8", fontSize: 11, tickLine: false }),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              formatter: (value) => [formatCurrency(value, store), "Returned"],
              contentStyle: { backgroundColor: "rgb(var(--vq-slate-800))", borderRadius: "12px", border: "none", color: "#fff" }
            }
          ),
          /* @__PURE__ */ jsx(Bar, { dataKey: "amount", fill: "#F43F5E", radius: [8, 8, 0, 0] })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-sm overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 md:p-6 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4", children: /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: tt("Search by Supplier name or ID..."),
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-app border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs md:text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-app text-ink-muted uppercase font-bold tracking-wider text-2xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Ref Number" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Date" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: tt("Supplier") }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4", children: "Reason" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Amount" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Status" }),
            /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Actions" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line font-medium", children: processedData.length > 0 ? processedData.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: item.reference_number || `#${item.id}` }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-ink-secondary", children: new Date(item.date).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 font-bold text-ink", children: item.supplier?.name || "Walk-in" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-ink-muted italic", children: item.reason || "—" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-right font-bold text-red-600 dark:text-red-400", children: formatCurrency(item.amount, store) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold uppercase ${item.status === "refunded" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : item.status === "approved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"}`, children: item.status }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 text-center", children: /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.debit-notes.show", { store_slug: store?.slug, id: item.id }),
                className: "inline-flex items-center gap-1 text-2xs font-bold text-brand-600 dark:text-brand-400 hover:underline uppercase",
                children: [
                  "View Details ",
                  /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 })
                ]
              }
            ) })
          ] }, item.id)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "7", className: "px-6 py-8 text-center text-ink-muted font-semibold", children: "No purchase returns found for the selected criteria." }) }) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  PurchaseReturnsReport as default
};
