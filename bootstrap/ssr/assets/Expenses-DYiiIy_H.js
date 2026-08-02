import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { CreditCard, Search, Download, DollarSign, PieChart, Tag, Receipt, BrainCircuit, Sparkles } from "lucide-react";
import { R as ReportsLayout } from "./ReportsLayout-Dg4OWYWu.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-DYgr6x02.js";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from "recharts";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function ExpenseReport({ expenses = [], stats = {}, filters = {}, categories = [] }) {
  const {
    store
  } = usePage().props;
  const [dateRange, setDateRange] = useState(filters.range || "this_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(filters.category_id || "");
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
  const processedExpenses = useMemo(() => {
    let data = [...expenses];
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      data = data.filter(
        (item) => (item.description || "").toLowerCase().includes(lowerQ) || (item.reference || "").toLowerCase().includes(lowerQ) || (typeof item.category === "string" ? item.category : item.category?.name || "").toLowerCase().includes(lowerQ)
      );
    }
    if (selectedCategory) {
      data = data.filter(
        (item) => item.category_id && String(item.category_id) === String(selectedCategory) || item.category?.id && String(item.category.id) === String(selectedCategory)
      );
    }
    return data;
  }, [expenses, searchQuery, selectedCategory]);
  const aiInsights = useMemo(() => {
    if (expenses.length === 0) {
      return [{
        type: "neutral",
        title: "Data Required",
        message: "Add expenses to unlock Growth Engine cost analysis."
      }];
    }
    const insights = [];
    const totalExp = stats.total_expenses || 0;
    if (stats.top_category && totalExp > 0) {
      const topCatShare = stats.top_category.total / totalExp * 100;
      if (topCatShare > 40) {
        insights.push({
          type: "warning",
          title: "Concentrated Spending",
          message: `${stats.top_category.name} consumes ${topCatShare.toFixed(1)}% of your budget. Inspect this category for savings.`
        });
      } else {
        insights.push({
          type: "success",
          title: "Balanced Budget",
          message: `Expense categories are well distributed. Top category is only ${topCatShare.toFixed(1)}%.`
        });
      }
    }
    if (stats.avg_daily > 1e4) {
      insights.push({
        type: "neutral",
        title: "High Burn Rate",
        message: `Average daily expense is ${formatCurrency(stats.avg_daily)}. Ensure high revenue days match this outflow.`
      });
    }
    return insights;
  }, [expenses, stats]);
  const chartData = useMemo(() => {
    const catMap = {};
    expenses.forEach((e) => {
      const catName = typeof e.category === "string" ? e.category : e.category?.name || "Uncategorized";
      catMap[catName] = (catMap[catName] || 0) + parseFloat(e.amount || 0);
    });
    return Object.keys(catMap).map((name) => ({
      name,
      value: catMap[name]
    })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [expenses]);
  const handleRangeChange = (r) => {
    setDateRange(r);
    if (r === "custom") {
      setShowCustomDate(true);
    } else {
      setShowCustomDate(false);
      applyFilters(r, selectedCategory);
    }
  };
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    applyFilters(dateRange, cat);
  };
  const applyFilters = (range, cat) => {
    const params = { range };
    if (cat) params.category_id = cat;
    if (range === "custom") {
      if (customStart) params.start_date = customStart;
      if (customEnd) params.end_date = customEnd;
    }
    router.get(route("store.reports.expenses", {
      store_slug: store.slug
    }), params, { preserveState: true, preserveScroll: true });
  };
  const applyCustomRange = () => {
    applyFilters("custom", selectedCategory);
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Expense Report", children: [
    /* @__PURE__ */ jsx(Head, { title: "Expense Report" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-[1600px] mx-auto min-h-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CreditCard, { className: "text-rose-500" }),
            "Expense Analytics"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Track company spending and overheads" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search expenses...",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 w-48"
              }
            )
          ] }),
          categories.length > 0 && /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedCategory,
              onChange: handleCategoryChange,
              className: "py-2 pl-3 pr-8 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "All Categories" }),
                categories.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg", children: ["this_month", "last_month", "this_year", "custom"].map((r) => /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleRangeChange(r),
              className: `px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === r ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}`,
              children: r.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
            },
            r
          )) }),
          showCustomDate && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg animate-in slide-in-from-right-5 fade-in duration-300", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customStart,
                onChange: (e) => setCustomStart(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "-" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: customEnd,
                onChange: (e) => setCustomEnd(e.target.value),
                className: "text-xs border-none bg-transparent focus:ring-0 p-1 text-slate-700 dark:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: applyCustomRange,
                className: "bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-xs",
                children: "Go"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("button", { className: "p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsx(Download, { size: 18 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Expenses",
            value: stats.total_expenses,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(DollarSign, { size: 20, className: "text-white" }),
            color: "bg-rose-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Avg Daily Spend",
            value: stats.avg_daily,
            isCurrency: true,
            icon: /* @__PURE__ */ jsx(PieChart, { size: 20, className: "text-white" }),
            color: "bg-indigo-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Top Category",
            value: stats.top_category?.name || "N/A",
            subtext: stats.top_category ? formatCurrency(stats.top_category.total) : "",
            icon: /* @__PURE__ */ jsx(Tag, { size: 20, className: "text-white" }),
            color: "bg-violet-500"
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            title: "Total Records",
            value: stats.count,
            icon: /* @__PURE__ */ jsx(Receipt, { size: 20, className: "text-white" }),
            color: "bg-slate-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center", children: [
            /* @__PURE__ */ jsx("h2", { className: "font-bold text-slate-700 dark:text-slate-200", children: "Expense History" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full", children: [
              processedExpenses.length,
              " Records"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Date" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Reference" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Category" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider", children: "Description" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right", children: "Amount" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
              processedExpenses.map((expense, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group", children: [
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-500 font-mono", children: formatDate(expense.date) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-bold text-slate-700 dark:text-slate-300 font-mono group-hover:text-indigo-500", children: expense.reference }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-full text-2xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400", children: (typeof expense.category === "string" ? expense.category : expense.category?.name) || "Uncategorized" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm text-slate-600 dark:text-slate-400", children: expense.description }),
                /* @__PURE__ */ jsx("td", { className: "p-3 text-sm font-bold text-rose-600 dark:text-rose-400 text-right", children: formatCurrency(expense.amount) })
              ] }, idx)),
              processedExpenses.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "5", className: "h-64 text-center text-slate-400", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center opacity-60", children: [
                /* @__PURE__ */ jsx(CreditCard, { size: 48, className: "mb-2 stroke-1" }),
                /* @__PURE__ */ jsx("p", { children: "No expenses found" })
              ] }) }) })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-4 overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-lg text-white flex-shrink-0 animate-in slide-in-from-right duration-500", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
              /* @__PURE__ */ jsx(BrainCircuit, { className: "text-indigo-200", size: 20 }),
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold uppercase tracking-wider text-indigo-100", children: "Growth Engine AI" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: aiInsights.map((insight, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white/10 backdrop-blur-sm rounded-lg p-3 text-xs border border-white/10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                /* @__PURE__ */ jsx(Sparkles, { size: 12, className: insight.type === "warning" || insight.type === "critical" ? "text-rose-300" : "text-emerald-300" }),
                /* @__PURE__ */ jsx("span", { className: "font-bold", children: insight.title })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "opacity-90 leading-relaxed", children: insight.message })
            ] }, idx)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex-1 min-h-0 flex flex-col", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold text-slate-500 uppercase mb-2", children: "Category Breakdown" }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 w-full min-h-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: /* @__PURE__ */ jsxs(BarChart, { data: chartData, layout: "vertical", margin: { left: 0, right: 30 }, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", horizontal: true, vertical: false, opacity: 0.1 }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", width: 90, tick: { fontSize: 10, fill: vq.slate[400] } }),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: { borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
                  formatter: (val) => formatCurrency(val)
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0], barSize: 20, children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: [vq.rose[500], vq.pink[500], vq.fuchsia[500], vq.purple[500], vq.violet[500]][index % 5] }, `cell-${index}`)) })
            ] }) }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StatCard({ title, value, icon, color, isCurrency = false, prefix = "", subtext }) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1", children: title }),
      /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-black text-slate-800 dark:text-white", children: [
        prefix,
        isCurrency ? formatCurrency(value || 0) : value || 0
      ] }),
      subtext && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-1", children: subtext })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`, children: icon })
  ] });
}
export {
  ExpenseReport as default
};
