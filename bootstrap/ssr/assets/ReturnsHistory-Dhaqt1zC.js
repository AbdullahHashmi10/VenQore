import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { ChevronDown, RefreshCcw, History, Package, CheckSquare, Search, Plus, Printer, ChevronUp, MoreVertical, Eye, X } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-_fjGjxMs.js";
import axios from "axios";
import { P as PrintService } from "./PrintService-CHQ9qBZV.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "react-dom";
import "react-dom/client";
import "./PrintPreview-u3rEkqC1.js";
function ReturnsHistory({ returns = {}, filters = {}, stats = {} }) {
  const {
    store
  } = usePage().props;
  const [allReturns, setAllReturns] = useState(returns.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(returns.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (returns.data && returns.current_page === 1) {
      setAllReturns(returns.data);
      setNextPageUrl(returns.next_page_url);
    }
  }, [returns]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllReturns((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
    }, { threshold: 0.1, rootMargin: "800px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  const [searchTerm, setSearchTerm] = useState(() => filters && filters.search ? filters.search : "");
  const [activeFilter, setActiveFilter] = useState(() => filters && filters.filter ? filters.filter : "all");
  const [dateRange, setDateRange] = useState(() => ({
    from: filters && filters.start_date ? filters.start_date : "",
    to: filters && filters.end_date ? filters.end_date : ""
  }));
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "12%" },
    { key: "reference", label: "Return #", width: "15%" },
    { key: "customer", label: "Customer", width: "20%" },
    { key: "items", label: "Items", width: "10%" },
    { key: "amount", label: "Refund Amount", width: "15%" },
    { key: "method", label: "Method", width: "10%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "8%", frozen: true }
  ]);
  const resolveValue = (item, key) => {
    switch (key) {
      case "date":
        return item.created_at;
      case "reference":
        return item.reference_number;
      case "customer":
        return item.customer?.name || "Walk-in";
      case "items":
        return item.items?.length || 0;
      case "amount":
        return parseFloat(item.total);
      case "status":
        return item.status;
      default:
        return item[key];
    }
  };
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const sortedReturns = useMemo(() => {
    const data = Array.isArray(allReturns) ? allReturns : [];
    return [...data].sort((a, b) => {
      let valA = resolveValue(a, sortConfig.key);
      let valB = resolveValue(b, sortConfig.key);
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [allReturns, sortConfig]);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [quickViewReturn, setQuickViewReturn] = useState(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".quick-view-modal")) return;
      setActiveActionMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const applyFilters = (newParams) => {
    router.get(route("store.returns-history.index", { store_slug: store.slug }), {
      search: searchTerm,
      // Use current state or passed param
      filter: activeFilter,
      start_date: dateRange.from,
      end_date: dateRange.to,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
    if (newRange.from && newRange.to) {
      applyFilters({ start_date: newRange.from, end_date: newRange.to });
    }
  };
  const applyFilterType = (type) => {
    setActiveFilter(type);
    applyFilters({ filter: type });
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };
  const handleDragStart = (e, index) => setDraggedColumn(index);
  const handleDragOver = (e, index) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    if (draggedColumn === null) return;
    const newCols = [...tableColumns];
    const draggedItem = newCols[draggedColumn];
    newCols.splice(draggedColumn, 1);
    newCols.splice(dropIndex, 0, draggedItem);
    setTableColumns(newCols);
    setDraggedColumn(null);
  };
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Returns History", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Returns History" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "returns" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-white dark:bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-200 ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600 dark:text-indigo-400", children: [
            "Total: ",
            stats?.total_returns || 0
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
            "Refunded: ",
            formatCurrency(stats?.total_refunded || 0)
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(RefreshCcw, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Returns" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.total_returns || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "This Month" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats?.this_month || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Items Returned" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.items_returned || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Refunded" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: formatCurrency(stats?.total_refunded || 0) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Returns ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "History" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "all", start_date: "", end_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("today");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "today", start_date: "", end_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Custom"
            }
          ),
          activeFilter === "custom" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 ml-1", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "from",
                value: dateRange.from,
                onChange: handleDateChange,
                className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs", children: "→" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "to",
                value: dateRange.to,
                onChange: handleDateChange,
                className: "px-2 py-0.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search returns...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.returns.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Return" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Returns History" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Search",
                children: /* @__PURE__ */ jsx(Search, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileFilters(!showMobileFilters);
                  if (showMobileSearch) setShowMobileSearch(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.returns.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Return",
                children: /* @__PURE__ */ jsx(Plus, { size: 16 })
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsxs("div", { className: "w-full relative mt-1 border-t border-slate-100 dark:border-slate-800 pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              onKeyDown: handleServerSearch,
              placeholder: "Search returns...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("today"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Today"
            }
          )
        ] }) })
      ] }),
      "                ",
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: tableColumns.map((col, index) => /* @__PURE__ */ jsx(
            "th",
            {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index),
              onDragOver: (e) => handleDragOver(e),
              onDrop: (e) => handleDrop(e, index),
              onClick: () => col.key !== "actions" && handleSort(col.key),
              className: `
                                            p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-indigo-500" : ""}
                                        `,
              style: { width: col.width },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                col.label,
                col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" }))
              ] })
            },
            col.key
          )) }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedReturns.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(RefreshCcw, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No returns found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Returns will appear here exactly when they happen" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.returns.create", { store_slug: store.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Create First Return"
                ]
              }
            )
          ] }) }) }) : sortedReturns.map((row) => /* @__PURE__ */ jsx(
            "tr",
            {
              onClick: () => setQuickViewReturn(row),
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-indigo-400
                                        `,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
                switch (col.key) {
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                  case "reference":
                    return /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.reference_number || `RET-${row.id}` });
                  case "customer":
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.customer?.name || "Walk-in" }),
                      row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.customer.phone })
                    ] });
                  case "items":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold", children: row.items?.length || 0 });
                  case "amount":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600", children: formatCurrency(row.total) });
                  case "method":
                    return /* @__PURE__ */ jsx("span", { className: "uppercase text-xs font-semibold", children: row.payment_method || "-" });
                  case "status":
                    return /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", children: row.status });
                  case "actions":
                    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2 relative", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx("button", { onClick: (e) => {
                        e.stopPropagation();
                        setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                      }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                      activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                        /* @__PURE__ */ jsxs(Link, { href: route("store.sales.show", [store.slug, row.id]), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Eye, { size: 14 }),
                          " View Details"
                        ] }),
                        /* @__PURE__ */ jsxs("button", { onClick: (e) => {
                          e.stopPropagation();
                          PrintService.quickPrint(row);
                          setActiveActionMenu(null);
                        }, className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Printer, { size: 14 }),
                          " Print"
                        ] })
                      ] }) })
                    ] }) });
                  default:
                    return /* @__PURE__ */ jsx("span", { children: "-" });
                }
              })() }, `${row.id}-${col.key}`))
            },
            row.id
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedReturns.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(RefreshCcw, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No returns found" })
        ] }) : sortedReturns.map((row) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => setQuickViewReturn(row),
            className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold", children: row.reference_number || `RET-${row.id}` }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-0.5", children: formatDate(row.created_at) })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md text-2xs font-black uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", children: row.status })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Customer" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white mt-0.5", children: row.customer?.name || "Walk-in" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Refund Amount" }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-emerald-600 mt-0.5", children: formatCurrency(row.total) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  "Items: ",
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: row.items?.length || 0 }),
                  " • Method: ",
                  /* @__PURE__ */ jsx("span", { className: "uppercase font-bold", children: row.payment_method || "-" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => PrintService.quickPrint(row),
                      className: "p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700",
                      children: /* @__PURE__ */ jsx(Printer, { size: 14 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.sales.show", [store.slug, row.id]),
                      className: "px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors",
                      children: "View"
                    }
                  )
                ] })
              ] })
            ]
          },
          row.id
        )) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0", children: nextPageUrl ? "Loading..." : sortedReturns.length > 0 ? "End of list" : "" })
      ] })
    ] }),
    quickViewReturn && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", onClick: () => setQuickViewReturn(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Return Details" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-indigo-600", children: quickViewReturn.reference_number || `RET-${quickViewReturn.id}` })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setQuickViewReturn(null),
                className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-auto", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase mb-1", children: "Customer" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-900 dark:text-white", children: quickViewReturn.customer?.name || "Walk-in" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: quickViewReturn.customer?.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase mb-1", children: "Refund Amount" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-emerald-600 text-lg", children: formatCurrency(quickViewReturn.total) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 uppercase", children: quickViewReturn.payment_method || "Cash" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-900 dark:text-white mb-3", children: "Returned Items" }),
            /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase", children: "Item" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase", children: "Price" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: quickViewReturn.items?.map((item, idx) => /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-slate-700 dark:text-slate-300", children: item.product?.name || item.name }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center text-slate-600", children: item.quantity }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right text-slate-600", children: formatCurrency(item.price || item.unit_price || 0) }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency((item.price || 0) * item.quantity) })
              ] }, idx)) })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => PrintService.quickPrint(quickViewReturn),
                  className: "px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(Printer, { size: 16 }),
                    " Print Receipt"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.sales.show", [store.slug, quickViewReturn.id]),
                  className: "px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(Eye, { size: 16 }),
                    " View Full Details"
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    ) })
  ] });
}
export {
  ReturnsHistory as default
};
