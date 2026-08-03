import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import { Search, Filter, Download, Printer, ChevronDown, ChevronRight, ArrowUpRight, ChevronUp, ChevronLeft } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Legend, AreaChart, Area } from "recharts";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
const MasterReport = ({
  title,
  stats = [],
  // [{ label, value, subValue, type: 'up'|'down'|'neutral', icon: Node }]
  chartData = [],
  chartConfig = { type: "area", dataKey: "value", xAxisKey: "name", color: vq.indigo[500] },
  columns = [],
  // [{ key, label, sortable: bool, align: 'left'|'right'|'center', render: fn, width }]
  data = [],
  // Table Rows
  filters = [],
  // Definition of filters
  filterValues = {},
  onFilterChange,
  onSearch,
  // (query) => void
  onFilterClick,
  // () => void
  onExport,
  // (type) => void
  isLoading = false,
  // Pagination Props
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  // Infinite Scroll Props
  enableInfiniteScroll = false,
  onLoadMore = null,
  hasMore = false,
  loadingMore = false
}) => {
  const { store, settings } = usePage().props;
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  const observerTarget = React.useRef(null);
  React.useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [enableInfiniteScroll, onLoadMore, hasMore, loadingMore]);
  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const getValue = (obj, path) => path.split(".").reduce((o, i) => o ? o[i] : null, obj);
      const aVal = getValue(a, sortConfig.key);
      const bVal = getValue(b, sortConfig.key);
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full space-y-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-black text-slate-800 dark:text-white tracking-tight", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 font-medium", children: "Real-time analytics and data reporting" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Search report...",
              onChange: (e) => onSearch && onSearch(e.target.value),
              className: "pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none w-full md:w-64 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            }
          )
        ] }),
        onFilterClick && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onFilterClick,
            className: "p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95",
            children: /* @__PURE__ */ jsx(Filter, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onExport && onExport("csv"),
            className: "p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all active:scale-95 border border-indigo-100 dark:border-indigo-800",
            title: "Export CSV",
            children: /* @__PURE__ */ jsx(Download, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onExport && onExport("print"),
            className: "p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-200 dark:border-slate-700",
            title: "Print Report",
            children: /* @__PURE__ */ jsx(Printer, { size: 20 })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md shadow-slate-200/5 dark:shadow-none shrink-0", children: [
      /* @__PURE__ */ jsx("div", { className: "w-full md:w-auto md:flex-1 md:max-w-md relative z-20", children: filters.find((f) => f.type === "universal_search") && (() => {
        const f = filters.find((f2) => f2.type === "universal_search");
        const [isOpen, setIsOpen] = useState(false);
        const [query, setQuery] = useState("");
        const options = f.options || [];
        const filteredOptions = query === "" ? options.slice(0, 50) : options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase())).slice(0, 50);
        return /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400", size: 16 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: f.label || "Search customer...",
              className: "w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20",
              value: filterValues[f.key] ? options.find((o) => o.value == filterValues[f.key])?.label : query,
              onChange: (e) => {
                setQuery(e.target.value);
                onFilterChange({ ...filterValues, [f.key]: null });
                setIsOpen(true);
              },
              onFocus: () => {
                setIsOpen(true);
                if (filterValues[f.key]) setQuery("");
              },
              onBlur: () => setTimeout(() => setIsOpen(false), 200)
            }
          ),
          isOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar p-1", children: filteredOptions.length > 0 ? filteredOptions.map((opt) => /* @__PURE__ */ jsx(
            "button",
            {
              className: "w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300",
              onClick: () => {
                onFilterChange({ ...filterValues, [f.key]: opt.value });
                setQuery(opt.label);
                setIsOpen(false);
              },
              children: opt.label
            },
            opt.value
          )) : /* @__PURE__ */ jsx("div", { className: "p-3 text-xs text-slate-400 text-center", children: "No results found" }) }),
          filterValues[f.key] && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                onFilterChange({ ...filterValues, [f.key]: null });
                setQuery("");
              },
              className: "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500",
              children: /* @__PURE__ */ jsx("div", { className: "bg-slate-200 dark:bg-slate-700 rounded-full p-0.5", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
                /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
              ] }) })
            }
          )
        ] });
      })() }),
      /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl shrink-0 items-center transition-all duration-300", children: [
        [
          { label: "Today", type: "today" },
          { label: "This Month", type: "month" },
          { label: "This Year", type: "year" }
        ].map((preset, idx) => {
          const isActive = (() => {
            if (!filterValues.start_date || !filterValues.end_date) return false;
            const getRange = (type) => {
              const today = /* @__PURE__ */ new Date();
              const toLocalISO = (d) => {
                const offset = d.getTimezoneOffset() * 6e4;
                return new Date(d.getTime() - offset).toISOString().split("T")[0];
              };
              let start, end;
              if (type === "month") {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              } else if (type === "year") {
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
              } else {
                start = /* @__PURE__ */ new Date();
                end = /* @__PURE__ */ new Date();
              }
              return { start: toLocalISO(start), end: toLocalISO(end) };
            };
            const range = getRange(preset.type);
            return filterValues.start_date === range.start && filterValues.end_date === range.end;
          })();
          return /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setIsCustomOpen(false);
                const today = /* @__PURE__ */ new Date();
                const toLocalISO = (d) => {
                  const offset = d.getTimezoneOffset() * 6e4;
                  return new Date(d.getTime() - offset).toISOString().split("T")[0];
                };
                let start = /* @__PURE__ */ new Date();
                let end = /* @__PURE__ */ new Date();
                if (preset.type === "month") {
                  start = new Date(today.getFullYear(), today.getMonth(), 1);
                  end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                } else if (preset.type === "year") {
                  start = new Date(today.getFullYear(), 0, 1);
                  end = new Date(today.getFullYear(), 11, 31);
                }
                onFilterChange({
                  ...filterValues,
                  start_date: toLocalISO(start),
                  end_date: toLocalISO(end)
                });
              },
              className: `px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-500 hover:text-indigo-600"}`,
              children: preset.label
            },
            idx
          );
        }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setIsCustomOpen(!isCustomOpen),
              className: `px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${isCustomOpen ? "text-indigo-600" : "text-slate-500 hover:text-indigo-600"}`,
              children: [
                "Custom ",
                isCustomOpen ? /* @__PURE__ */ jsx(ChevronDown, { size: 10 }) : /* @__PURE__ */ jsx(ChevronRight, { size: 10 })
              ]
            }
          ),
          isCustomOpen && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pl-2 overflow-hidden transition-all duration-300 animate-in slide-in-from-left-2 fade-in", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: filterValues.start_date || "",
                onChange: (e) => onFilterChange({ ...filterValues, start_date: e.target.value }),
                className: "w-28 px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-slate-600 dark:text-slate-200"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-2xs font-bold", children: "TO" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: filterValues.end_date || "",
                onChange: (e) => onFilterChange({ ...filterValues, end_date: e.target.value }),
                className: "w-28 px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-slate-600 dark:text-slate-200"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    stats.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0", children: stats.map((stat, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-800/50 opacity-50 group-hover:w-24 transition-all duration-500" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.type === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : stat.type === "down" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"}`, children: React.isValidElement(stat.icon) ? React.cloneElement(stat.icon, { size: 16 }) : (
          // Fallback icon if none provided or invalid
          /* @__PURE__ */ jsx(ArrowUpRight, { size: 16 })
        ) }),
        /* @__PURE__ */ jsx("p", { className: "text-1xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide", children: stat.label })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 justify-end", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-black text-slate-800 dark:text-white tracking-tight", children: stat.value }),
        stat.subValue && /* @__PURE__ */ jsx("span", { className: `text-2xs font-bold ${stat.type === "up" ? "text-emerald-500" : "text-amber-500"}`, children: stat.subValue })
      ] }) })
    ] }, idx)) }),
    chartData.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xl shadow-slate-200/20 dark:shadow-black/20 shrink-0 h-80 min-h-[320px] relative", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-500 uppercase mb-4", children: "Analytics Overview" }),
      /* @__PURE__ */ jsx("div", { className: "w-full h-full pb-6", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", minWidth: 1, minHeight: 1, children: chartConfig.type === "bar" ? /* @__PURE__ */ jsxs(BarChart, { data: chartData, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], opacity: 0.5 }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: chartConfig.xAxisKey, axisLine: false, tickLine: false, tick: { fill: vq.slate[400], fontSize: 12 }, dy: 10 }),
        /* @__PURE__ */ jsx(YAxis, { axisLine: false, tickLine: false, tick: { fill: vq.slate[400], fontSize: 12 } }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            contentStyle: { borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
            cursor: { fill: vq.slate[100] }
          }
        ),
        Array.isArray(chartConfig.dataKey) ? chartConfig.dataKey.map((key, i) => /* @__PURE__ */ jsx(Bar, { dataKey: key, fill: [vq.indigo[500], vq.purple[500], vq.pink[500]][i % 3], radius: [4, 4, 0, 0], maxBarSize: 40 }, key)) : /* @__PURE__ */ jsx(Bar, { dataKey: chartConfig.dataKey, fill: chartConfig.color, radius: [4, 4, 0, 0], maxBarSize: 40 }),
        /* @__PURE__ */ jsx(Legend, {})
      ] }) : /* @__PURE__ */ jsxs(AreaChart, { data: chartData, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorValue", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: chartConfig.color, stopOpacity: 0.3 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: chartConfig.color, stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", vertical: false, stroke: vq.slate[200], opacity: 0.5 }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: chartConfig.xAxisKey, axisLine: false, tickLine: false, tick: { fill: vq.slate[400], fontSize: 12 }, dy: 10 }),
        /* @__PURE__ */ jsx(YAxis, { axisLine: false, tickLine: false, tick: { fill: vq.slate[400], fontSize: 12 } }),
        /* @__PURE__ */ jsx(
          Tooltip,
          {
            contentStyle: { borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }
          }
        ),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: chartConfig.dataKey, stroke: chartConfig.color, strokeWidth: 3, fillOpacity: 1, fill: "url(#colorValue)" })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/20 flex flex-col min-h-0 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto custom-scrollbar", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm", children: /* @__PURE__ */ jsx("tr", { children: columns.map((col, idx) => /* @__PURE__ */ jsx(
          "th",
          {
            onClick: () => col.sortable && handleSort(col.key),
            className: `px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${col.sortable ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 select-none" : ""}`,
            style: { width: col.width, textAlign: col.align || "left" },
            children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`, children: [
              col.label,
              col.sortable && /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                /* @__PURE__ */ jsx(ChevronUp, { size: 10, className: sortConfig.key === col.key && sortConfig.direction === "asc" ? "text-indigo-600" : "text-slate-300" }),
                /* @__PURE__ */ jsx(ChevronDown, { size: 10, className: sortConfig.key === col.key && sortConfig.direction === "desc" ? "text-indigo-600" : "text-slate-300" })
              ] })
            ] })
          },
          idx
        )) }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
          isLoading ? (
            // Loading Skeleton
            [...Array(5)].map((_, i) => /* @__PURE__ */ jsx("tr", { className: "animate-pulse", children: columns.map((_2, c) => /* @__PURE__ */ jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" }) }, c)) }, i))
          ) : sortedData.length === 0 ? (
            // Empty State
            /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: columns.length, className: "px-6 py-12 text-center text-slate-400", children: [
              /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4", children: /* @__PURE__ */ jsx(Search, { size: 24, className: "opacity-50" }) }),
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: "No results found matching your criteria" })
            ] }) })
          ) : (
            // Data Rows
            sortedData.map((row, rIdx) => /* @__PURE__ */ jsx("tr", { className: "hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors group", children: columns.map((col, cIdx) => /* @__PURE__ */ jsx(
              "td",
              {
                className: `px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap`,
                style: { textAlign: col.align || "left" },
                children: col.render ? col.render(row) : (
                  // Default Render Logic
                  col.type === "currency" ? formatCurrency(row[col.key], store || settings) : col.type === "number" ? formatNumber(row[col.key], null, store || settings) : col.type === "date" ? new Date(row[col.key]).toLocaleDateString() : row[col.key] || /* @__PURE__ */ jsx("span", { className: "text-slate-300 italic", children: "-" })
                )
              },
              cIdx
            )) }, rIdx))
          ),
          enableInfiniteScroll && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("tr", { ref: observerTarget, children: /* @__PURE__ */ jsx("td", { colSpan: columns.length, className: "h-4 p-0" }) }),
            loadingMore && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: columns.length, className: "p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-slate-400", children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Loading more..." })
            ] }) }) })
          ] })
        ] })
      ] }) }),
      !enableInfiniteScroll && totalPages > 1 && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between shrink-0", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-slate-400", children: [
          "Page ",
          currentPage,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: currentPage <= 1,
              onClick: () => onPageChange && onPageChange(currentPage - 1),
              className: "p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all",
              children: /* @__PURE__ */ jsx(ChevronLeft, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              disabled: currentPage >= totalPages,
              onClick: () => onPageChange && onPageChange(currentPage + 1),
              className: "p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all",
              children: /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
            }
          )
        ] })
      ] })
    ] })
  ] });
};
export {
  MasterReport as M
};
