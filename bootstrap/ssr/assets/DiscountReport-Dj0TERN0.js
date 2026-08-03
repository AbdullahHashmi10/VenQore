import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { R as ReportsLayout } from "./ReportsLayout-SZbN0U_-.js";
import { ArrowLeft, BadgePercent, Search, Tag, Percent, TrendingUp, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function DiscountReport({ invoices = [], filters = {} }) {
  const {
    store
  } = usePage().props;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ key: "discount", direction: "desc" });
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const processedData = useMemo(() => {
    let data = invoices.filter((inv) => Number(inv.discount) > 0);
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (inv) => inv.invoice_number.toString().toLowerCase().includes(lowerQ) || (inv.party?.name || "").toLowerCase().includes(lowerQ)
      );
    }
    data.sort((a, b) => {
      let valA = a[sortBy.key];
      let valB = b[sortBy.key];
      if (sortBy.key === "party_name") {
        valA = a.party?.name || "Walk-in";
        valB = b.party?.name || "Walk-in";
      } else if (sortBy.key === "percentage") {
        const subTotalA = Number(a.total_amount) + Number(a.discount);
        const subTotalB = Number(b.total_amount) + Number(b.discount);
        valA = subTotalA > 0 ? Number(a.discount) / subTotalA * 100 : 0;
        valB = subTotalB > 0 ? Number(b.discount) / subTotalB * 100 : 0;
      } else {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortBy.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.direction === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [invoices, searchQuery, sortBy]);
  const stats = useMemo(() => {
    const totalDiscount = processedData.reduce((acc, curr) => acc + Number(curr.discount), 0);
    const count = processedData.length;
    const avgDiscount = count > 0 ? totalDiscount / count : 0;
    let maxDiscount = 0;
    let heavyDiscountCount = 0;
    processedData.forEach((inv) => {
      const val = Number(inv.discount);
      if (val > maxDiscount) maxDiscount = val;
      const subTotal = Number(inv.total_amount) + val;
      const pct = subTotal > 0 ? val / subTotal * 100 : 0;
      if (pct > 15) heavyDiscountCount++;
    });
    return { totalDiscount, count, avgDiscount, maxDiscount, heavyDiscountCount };
  }, [processedData]);
  const severityData = useMemo(() => {
    let low = 0, medium = 0, high = 0;
    processedData.forEach((inv) => {
      const subTotal = Number(inv.total_amount) + Number(inv.discount);
      const pct = subTotal > 0 ? Number(inv.discount) / subTotal * 100 : 0;
      if (pct < 5) low++;
      else if (pct < 15) medium++;
      else high++;
    });
    return [
      { name: "Light (<5%)", value: low, color: vq.emerald[500] },
      // Emerald
      { name: "Standard (5-15%)", value: medium, color: vq.blue[500] },
      // Blue
      { name: "Heavy (>15%)", value: high, color: vq.rose[500] }
      // Rose
    ].filter((d) => d.value > 0);
  }, [processedData]);
  const topCustomers = useMemo(() => {
    const map = {};
    processedData.forEach((inv) => {
      const name = inv.party?.name || "Walk-in";
      if (!map[name]) map[name] = 0;
      map[name] += Number(inv.discount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [processedData]);
  const handleSort = (key) => {
    setSortBy((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc"
    }));
  };
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r !== "custom") {
      router.get(route("store.reports.discount-report", {
        store_slug: store.slug
      }), { range: r }, { preserveState: true, preserveScroll: true });
    }
  };
  const applyCustomRange = () => {
    router.get(route("store.reports.discount-report", {
      store_slug: store.slug
    }), {
      range: "custom",
      start_date: customStart,
      end_date: customEnd
    }, { preserveState: true, preserveScroll: true });
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Discount Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Discount Analysis" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full gap-4 w-full", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
          /* @__PURE__ */ jsx(Link, { href: route("store.reports.index", {
            store_slug: store.slug
          }), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 18 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(BadgePercent, { className: "text-rose-500", size: 20 }),
              "Discount Analytics"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Tracking giveaways & price reductions" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors", size: 14 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search Customer...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 w-48 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl items-center", children: [
            ["today", "this_month", "this_year"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleRangeChange(r),
                className: `px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${dateRange === r ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                children: r.replace("_", " ")
              },
              r
            )),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center ml-1 border-l border-slate-200 dark:border-slate-700 pl-1 gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleRangeChange("custom"),
                  className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === "custom" ? "bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                  children: "Custom"
                }
              ),
              dateRange === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 animate-in slide-in-from-right-2 fade-in duration-300", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customStart,
                    onChange: (e) => setCustomStart(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-rose-500"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: customEnd,
                    onChange: (e) => setCustomEnd(e.target.value),
                    className: "p-1 px-2 text-2xs rounded-lg border-none bg-slate-200 dark:bg-slate-700 dark:text-white focus:ring-1 focus:ring-rose-500"
                  }
                ),
                /* @__PURE__ */ jsx("button", { onClick: applyCustomRange, className: "p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700", children: /* @__PURE__ */ jsx(ArrowLeft, { size: 10, className: "rotate-180" }) })
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Discounts",
            value: formatCurrency(stats.totalDiscount),
            icon: /* @__PURE__ */ jsx(Tag, { size: 18 }),
            color: "rose"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Discounted Bills",
            value: stats.count,
            icon: /* @__PURE__ */ jsx(Percent, { size: 18 }),
            color: "indigo",
            footer: `${stats.count > 0 ? (stats.count / invoices.length * 100).toFixed(1) : 0}% of Total Bills`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Avg per Bill",
            value: formatCurrency(stats.avgDiscount),
            icon: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }),
            color: "blue"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Heavy Discounts",
            value: stats.heavyDiscountCount,
            icon: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }),
            color: "amber",
            footer: "Bills with > 15%"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide", children: "Discount Details" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded", children: [
              processedData.length,
              " Records"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx(SortableHeader, { label: "Invoice", colKey: "invoice_number", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Date", colKey: "created_at", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Customer", colKey: "party_name", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Bill Total", colKey: "total_amount", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "Amount Off", colKey: "discount", align: "right", currentSort: sortBy, onSort: handleSort }),
              /* @__PURE__ */ jsx(SortableHeader, { label: "%", colKey: "percentage", align: "right", currentSort: sortBy, onSort: handleSort })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: processedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "6", className: "h-64", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-400 gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-100 dark:bg-slate-800 p-4 rounded-full", children: /* @__PURE__ */ jsx(Tag, { size: 32, className: "text-slate-300 opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: "No discounts found" })
            ] }) }) }) : processedData.map((inv, idx) => {
              const subTotal = Number(inv.total_amount) + Number(inv.discount);
              const pct = subTotal > 0 ? Number(inv.discount) / subTotal * 100 : 0;
              return /* @__PURE__ */ jsxs("tr", { className: "group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 font-mono text-xs text-slate-500", children: [
                  "#",
                  inv.invoice_number
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-xs text-slate-500", children: new Date(inv.created_at).toLocaleDateString() }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200", children: inv.party?.name || "Walk-in" }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-xs text-slate-500 font-mono", children: formatCurrency(inv.total_amount) }),
                /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400 font-mono", children: [
                  "-",
                  formatCurrency(inv.discount)
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right", children: /* @__PURE__ */ jsx(DiscountBadge, { pct }) })
              ] }, idx);
            }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 h-full min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Discount Range" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0 relative", children: severityData.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(PieChart, { children: [
                /* @__PURE__ */ jsx(
                  Pie,
                  {
                    data: severityData,
                    dataKey: "value",
                    cx: "50%",
                    cy: "50%",
                    innerRadius: "50%",
                    outerRadius: "70%",
                    paddingAngle: 5,
                    children: severityData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, stroke: "none" }, `cell-${index}`))
                  }
                ),
                /* @__PURE__ */ jsx(
                  Tooltip,
                  {
                    contentStyle: { backgroundColor: vq.slate[800], border: "none", borderRadius: "8px", color: "#fff" },
                    itemStyle: { color: "#fff" }
                  }
                ),
                /* @__PURE__ */ jsx(Legend, { verticalAlign: "bottom", height: 36, iconType: "circle", wrapperStyle: { fontSize: "11px", paddingTop: "4px" } })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none pb-8", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-bold uppercase", children: "Avg" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-rose-600 dark:text-rose-400", children: [
                  stats.count > 0 ? (stats.totalDiscount / (stats.totalDiscount + processedData.reduce((a, c) => a + Number(c.total_amount), 0)) * 100).toFixed(1) : 0,
                  "%"
                ] })
              ] }) })
            ] }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No data" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Top Discounted Customers" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full min-h-0", children: topCustomers.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: topCustomers, layout: "vertical", margin: { left: 10, right: 30 }, children: [
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
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", fill: vq.rose[500], radius: [0, 4, 4, 0], barSize: 16, background: { fill: "transparent" } })
            ] }) }) : /* @__PURE__ */ jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400 italic", children: "No data" }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, footer }) {
  const bgColors = {
    rose: "bg-rose-500",
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500"
  };
  const textColors = {
    rose: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20",
    indigo: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${textColors[color]} shrink-0`, children: icon }),
      footer && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full", children: footer })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase tracking-wider", children: title }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight mt-0.5", children: value })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 ${bgColors[color]} pointer-events-none group-hover:scale-110 transition-transform duration-500` })
  ] });
}
function SortableHeader({ label, colKey, align = "left", currentSort, onSort }) {
  const isActive = currentSort.key === colKey;
  return /* @__PURE__ */ jsx(
    "th",
    {
      onClick: () => onSort(colKey),
      className: `px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer group bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors select-none`,
      style: { textAlign: align },
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1.5 ${align === "right" ? "justify-end" : "justify-start"}`, children: [
        label,
        /* @__PURE__ */ jsxs("div", { className: `flex flex-col text-4xs leading-none ${isActive ? "text-rose-500" : "text-slate-300 group-hover:text-slate-400"}`, children: [
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "asc" ? "opacity-100" : "opacity-40", children: "▲" }),
          /* @__PURE__ */ jsx("span", { className: isActive && currentSort.direction === "desc" ? "opacity-100" : "opacity-40", children: "▼" })
        ] })
      ] })
    }
  );
}
function DiscountBadge({ pct }) {
  if (pct < 5) return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-2xs font-bold rounded", children: [
    pct.toFixed(1),
    "%"
  ] });
  if (pct < 15) return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-2xs font-bold rounded", children: [
    pct.toFixed(1),
    "%"
  ] });
  return /* @__PURE__ */ jsxs("span", { className: "px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-2xs font-bold rounded animate-pulse", children: [
    pct.toFixed(1),
    "%"
  ] });
}
export {
  DiscountReport as default
};
