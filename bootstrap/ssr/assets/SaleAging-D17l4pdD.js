import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-C08V7Mxf.js";
import { ArrowLeft, Clock, Search, AlertOctagon, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { v as vq } from "./runtime-DwSFgQZq.js";
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
function SaleAging({ invoices = [], filters = {} }) {
  const tt = useTermText();
  const {
    store
  } = usePage().props;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "days", direction: "desc" });
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [bucketFilter, setBucketFilter] = useState("all");
  const processedInvoices = useMemo(() => {
    let data = [...invoices];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (inv) => inv.invoice_number.toString().toLowerCase().includes(lowerQ) || (inv.party || "").toLowerCase().includes(lowerQ)
      );
    }
    if (bucketFilter !== "all") {
      data = data.filter((inv) => inv.category === bucketFilter);
    }
    data.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];
      if (sortBy.key === "amount") {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sortBy.key === "days") {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortBy.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [invoices, searchQuery, sortBy, bucketFilter]);
  const stats = useMemo(() => {
    const totalOutstanding = processedInvoices.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const count = processedInvoices.length;
    const buckets = { "0-30": 0, "30-60": 0, "60-90": 0, "90+": 0 };
    let criticalAmount = 0;
    processedInvoices.forEach((inv) => {
      const amt = Number(inv.amount);
      if (buckets[inv.category] !== void 0) buckets[inv.category] += amt;
      else buckets["90+"] += amt;
      if (inv.category === "90+" || inv.category === "60-90") criticalAmount += amt;
    });
    const riskScore = totalOutstanding > 0 ? criticalAmount / totalOutstanding * 100 : 0;
    return { totalOutstanding, count, buckets, criticalAmount, riskScore };
  }, [processedInvoices]);
  const agingData = useMemo(() => {
    const data = [
      { name: "0-30 Days", value: stats.buckets["0-30"], color: vq.emerald[500], category: "0-30" },
      { name: "30-60 Days", value: stats.buckets["30-60"], color: vq.blue[500], category: "30-60" },
      { name: "60-90 Days", value: stats.buckets["60-90"], color: vq.amber[500], category: "60-90" },
      { name: "90+ Days", value: stats.buckets["90+"], color: vq.red[500], category: "90+" }
    ].filter((d) => d.value > 0);
    return data;
  }, [stats]);
  const topDebtors = useMemo(() => {
    const map = {};
    processedInvoices.forEach((inv) => {
      const name = inv.party || "Unknown";
      if (!map[name]) map[name] = 0;
      map[name] += Number(inv.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [processedInvoices]);
  const handleSort = (key) => {
    setSortBy((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Sale Aging Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Aging Analysis" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-surface p-3 rounded-2xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-xl text-ink-muted transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold text-ink tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "text-orange-500", size: 20 }),
              "Sale Aging"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted font-medium", children: "Tracking outstanding receivables" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted group-focus-within:text-orange-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search Debtor...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-app border-none rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 w-48 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl", children: ["all", "90+", "60-90"].map((b) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setBucketFilter(b),
              className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${bucketFilter === b ? "bg-sunken shadow-sm text-orange-600 dark:text-orange-400" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
              children: b === "all" ? "All Buckets" : b + " Days"
            },
            b
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Outstanding",
            value: formatCurrency(stats.totalOutstanding),
            icon: /* @__PURE__ */ jsx(AlertOctagon, { size: 18 }),
            color: "indigo",
            footer: `${stats.count} Open Invoices`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Critical Amount (>60d)",
            value: formatCurrency(stats.criticalAmount),
            icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }),
            color: "red",
            footer: "Immediate Action Reqd"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Risk Exposure",
            value: stats.riskScore.toFixed(1) + "%",
            icon: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }),
            color: "orange",
            footer: "% of Debt > 60 Days"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Fresh Debt (<30d)",
            value: formatCurrency(stats.buckets["0-30"]),
            icon: /* @__PURE__ */ jsx(Calendar, { size: 18 }),
            color: "emerald",
            footer: "Healthy Receivables"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-surface border border-line rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-line bg-sunken/50 dark:bg-surface flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-ink-secondary dark:text-ink uppercase tracking-wide", children: "Aging Details" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-ink-muted bg-sunken px-2 py-1 rounded", children: [
              processedInvoices.length,
              " Bills"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-app sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: "Invoice", colKey: "invoice_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: tt("Customer"), colKey: "party", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Owed Amount", colKey: "amount", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Days Old", colKey: "days", align: "center", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Status", colKey: "category", align: "center", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: processedInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-ink-muted gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-sunken p-4 rounded-full", children: /* @__PURE__ */ jsx(Clock, { size: 32, className: "text-neutral-300 opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: "No outstanding bills found" })
            ] }) }) }) : processedInvoices.map(
              (inv, idx) => /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono text-xs text-ink-muted", children: [
                  "#",
                  inv.invoice_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-sm font-medium text-ink-secondary dark:text-ink", children: inv.party }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-sm font-bold text-ink-secondary font-mono", children: formatCurrency(inv.amount) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 text-center text-xs text-ink-muted font-mono", children: [
                  inv.days,
                  "d"
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx(AgingBadge, { category: inv.category }) })
              ] }, idx)
            ) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Aging Breakdown" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0 relative", children: agingData.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: agingData,
                    dataKey: "value",
                    cx: "50%",
                    cy: "50%",
                    innerRadius: "50%",
                    outerRadius: "70%",
                    paddingAngle: 5,
                    children: agingData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                    itemStyle: { color: "#fff" },
                    formatter: (val) => formatCurrency(val)
                  }
                ),
                /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none pb-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-bold uppercase", children: "Total" }),
                /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-ink-secondary dark:text-white", children: [
                  (stats.totalOutstanding / 1e3).toFixed(1),
                  "k"
                ] })
              ] }) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-ink-muted uppercase mb-2", children: "Top Debtors" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: topDebtors.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: topDebtors, layout: "vertical", margin: { left: 10, right: 30 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.3 }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", width: 80, tick: { fontSize: 10, fill: vq.slate[400] }, axisLine: false, tickLine: false }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  cursor: { fill: vq.slate[100], opacity: 0.1 },
                  contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                  formatter: (value) => formatCurrency(value)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: vq.indigo[500], radius: [0, 4, 4, 0], barSize: 16, background: { fill: "transparent" } })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-ink-muted italic", children: "No data" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, footer }) {
  const bgColors = {
    red: "bg-red-500",
    indigo: "bg-brand-500",
    emerald: "bg-emerald-500",
    orange: "bg-orange-500"
  };
  const textColors = {
    red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    indigo: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
    orange: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-line dark:hover:border-line-strong transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${textColors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-ink-muted bg-sunken px-2 py-0.5 rounded-full", children: footer })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase tracking-wider", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink tracking-tight mt-0.5", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none transition-transform duration-slower` })
  ] });
}
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
  const isActive = currentSort.key === colKey;
  return /* @__PURE__ */ jsx(
    "th",
    {
      onClick: () => onSort(colKey),
      className: `px-6 py-4 text-xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer group bg-sunken hover:bg-sunken dark:hover:bg-interactive-hover transition-colors select-none`,
      style: { textAlign: align },
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-4xs leading-none ${isActive ? "text-orange-500" : "text-neutral-300 group-hover:text-ink-muted"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "▲" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "▼" })
        ] })
      ] })
    }
  );
}
function AgingBadge({ category }) {
  if (category === "90+") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-2xs font-bold rounded animate-pulse", children: "Critical 90+" });
  if (category === "60-90") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-2xs font-bold rounded", children: "High 60-90" });
  if (category === "30-60") return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-2xs font-bold rounded", children: "At Risk 30-60" });
  return /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-2xs font-bold rounded", children: "Fresh 0-30" });
}
export {
  SaleAging as default
};
