import { jsxs, jsx } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback } from "react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import axios from "axios";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ChevronDown, FileMinus, DollarSign, ArrowUpRight, Plus, FileSpreadsheet, Printer, Search, Filter, ChevronUp, MoreVertical, Eye, X } from "lucide-react";
import { P as PurchaseModuleTabs } from "./PurchaseModuleTabs-Cu1z0Kdx.js";
import { S as SmartCombobox } from "./SmartCombobox-DfdFIseQ.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
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
import "use-debounce";
function DebitNotesIndex({ debitNotes = [], filters = {}, stats = {} }) {
  const tt = useTermText();
  const [allNotes, setAllNotes] = useState(() => {
    if (Array.isArray(debitNotes)) return debitNotes;
    return debitNotes?.data || [];
  });
  const [nextPageUrl, setNextPageUrl] = useState(() => debitNotes?.next_page_url || null);
  const [loading, setLoading] = useState(false);
  const observerTarget = React.useRef(null);
  const isLoading = React.useRef(false);
  useEffect(() => {
    const newData = Array.isArray(debitNotes) ? debitNotes : debitNotes?.data || [];
    setAllNotes(newData);
    setNextPageUrl(debitNotes?.next_page_url || null);
  }, [debitNotes]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    setLoading(true);
    try {
      const response = await axios.get(nextPageUrl, {
        headers: { "Accept": "application/json" }
      });
      const newNotes = response.data.data || [];
      setAllNotes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const uniqueNew = newNotes.filter((n) => !existingIds.has(n.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error("Failed to fetch more debit notes:", error);
    } finally {
      isLoading.current = false;
      setLoading(false);
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: "400px" }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [nextPageUrl, fetchNextPage]);
  const [searchTerm, setSearchTerm] = useState(() => filters && filters.search ? filters.search : "");
  const [activeFilter, setActiveFilter] = useState(() => filters && filters.filter ? filters.filter : "all");
  const [dateRange, setDateRange] = useState(() => ({
    from: filters && filters.from_date ? filters.from_date : "",
    to: filters && filters.to_date ? filters.to_date : ""
  }));
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const computedStats = {
    total: stats?.total || allNotes.length,
    totalAmount: stats?.totalAmount || allNotes.reduce((sum, n) => sum + parseFloat(n.amount || 0), 0),
    open: stats?.open || allNotes.filter((n) => n.status === "open" || n.status === "pending").length
  };
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "15%" },
    { key: "reference", label: "Debit Note #", width: "15%" },
    { key: "supplier", label: tt("Supplier"), width: "20%" },
    { key: "amount", label: "Amount", width: "15%" },
    { key: "reason", label: "Reason", width: "20%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "5%", frozen: true }
  ]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  useEffect(() => {
    setAllNotes(debitNotes?.data || []);
    setNextPageUrl(debitNotes?.next_page_url || null);
  }, [debitNotes]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".quick-view-modal")) return;
      setActiveActionMenu(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  const applyFilters = (newParams) => {
    router.get(route("store.debit-notes.index", { store_slug: store.slug }), {
      search: searchTerm,
      filter: activeFilter,
      from_date: dateRange.from,
      to_date: dateRange.to,
      ...newParams
    }, { preserveState: true, preserveScroll: true });
  };
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
    if (newRange.from && newRange.to) {
      applyFilters({ from_date: newRange.from, to_date: newRange.to });
    }
  };
  function resolveValue(item, key) {
    switch (key) {
      case "date":
        return item.date;
      case "reference":
        return item.reference_number;
      case "supplier":
        return item.supplier?.name || "";
      case "amount":
        return parseFloat(item.amount || 0);
      case "status":
        return item.status;
      default:
        return item[key];
    }
  }
  const sortedData = React.useMemo(() => {
    try {
      if (!Array.isArray(allNotes)) return [];
      return [...allNotes].sort((a, b) => {
        const valA = resolveValue(a, sortConfig.key);
        const valB = resolveValue(b, sortConfig.key);
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    } catch (error) {
      console.error("Sorting error:", error);
      return [];
    }
  }, [allNotes, sortConfig]);
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
  const { store } = usePage().props;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Debit Notes", activeMenu: "Purchase", children: [
    /* @__PURE__ */ jsx(Head, { title: "Debit Notes" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-app p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(PurchaseModuleTabs, { activeTab: "debit-notes" }),
      /* @__PURE__ */ jsxs("div", { className: "flex md:hidden items-center justify-between bg-surface px-3 py-2.5 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsStatsExpanded(!isStatsExpanded),
            className: "flex items-center gap-1.5 text-xs font-bold text-ink-muted uppercase text-left shrink-0 mr-2",
            children: [
              /* @__PURE__ */ jsx("span", { children: "Stats Summary" }),
              /* @__PURE__ */ jsx(ChevronDown, { size: 16, className: `transition-transform duration-normal ${isStatsExpanded ? "rotate-180" : ""}` })
            ]
          }
        ),
        !isStatsExpanded && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-brand-600 dark:text-brand-400", children: [
            "Total: ",
            formatCurrency(computedStats.totalAmount, store)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: [
            "Txns: ",
            computedStats.total
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-sunken text-ink-secondary rounded-lg", children: /* @__PURE__ */ jsx(FileMinus, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Notes" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: computedStats.total })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(DollarSign, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: formatCurrency(computedStats.totalAmount, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(ArrowUpRight, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Open Credits" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-blue-600", children: computedStats.open })
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: route("store.debit-notes.create", { store_slug: store.slug }), className: "bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all", children: [
          /* @__PURE__ */ jsx(Plus, { size: 18 }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-sm", children: "New Debit Note" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0 flex items-center gap-2", children: [
            "Debit ",
            /* @__PURE__ */ jsx("span", { className: "text-red-600", children: "Notes" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "all", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("open");
                applyFilters({ filter: "open" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "open" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Open"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("used");
                applyFilters({ filter: "used" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "used" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Used"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-to-r from-red-600 to-rose-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
                className: "px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-red-500"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs", children: "→" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                name: "to",
                value: dateRange.to,
                onChange: handleDateChange,
                className: "px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-red-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-52", children: /* @__PURE__ */ jsx(
            SmartCombobox,
            {
              items: allNotes,
              value: searchTerm,
              onQueryChange: (val) => {
                setSearchTerm(val);
              },
              onSelect: (item) => {
                setSearchTerm(item.reference_number);
                applyFilters({ search: item.reference_number });
              },
              placeholder: "Search note...",
              displayKey: "reference_number",
              filterKey: "reference_number"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-bold text-ink uppercase tracking-tight", children: "Debit Notes" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-red-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-red-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(Filter, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.debit-notes.create", { store_slug: store.slug }),
                className: "p-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors",
                title: "New Debit Note",
                children: /* @__PURE__ */ jsx(Plus, { size: 16 })
              }
            )
          ] })
        ] }),
        showMobileSearch && /* @__PURE__ */ jsxs("div", { className: "w-full relative mt-1 border-t border-line pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              placeholder: "Search note reference...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow outline-none text-ink"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-line pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                setDateRange({ from: "", to: "" });
                applyFilters({ filter: "all", from_date: "", to_date: "" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("open");
                applyFilters({ filter: "open" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "open" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Open"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("used");
                applyFilters({ filter: "used" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "used" ? "bg-red-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Used"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-line md:dark:border-line md:shadow-sm bg-transparent md:bg-white md:dark:bg-app", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-app border-b border-line sticky top-0 z-10", children: tableColumns.map((col, index) => /* @__PURE__ */ jsx(
            "th",
            {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index),
              onDragOver: (e) => handleDragOver(e),
              onDrop: (e) => handleDrop(e, index),
              onClick: () => col.key !== "actions" && handleSort(col.key),
              className: `
                                            p-4 text-xs font-bold text-ink-muted uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors
                                            ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-red-500" : ""}
`,
              style: { width: col.width },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                col.label,
                col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-red-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-red-500" }))
              ] })
            },
            col.key
          )) }) }),
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-line", children: [
            sortedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileMinus, { size: 32, className: "text-ink-muted" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink-secondary mb-1", children: "No debit notes found" }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.debit-notes.create", { store_slug: store.slug }),
                  className: "px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-2 mt-2",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 16 }),
                    " Create Debit Note"
                  ]
                }
              )
            ] }) }) }) : sortedData.map((row) => /* @__PURE__ */ jsx(
              "tr",
              {
                onClick: () => setQuickViewItem(row),
                className: `
                                            hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group cursor-pointer border-l-4 border-transparent hover:border-red-400
`,
                children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-ink-secondary", children: (() => {
                  switch (col.key) {
                    case "date":
                      return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.date) });
                    case "reference":
                      return /* @__PURE__ */ jsx("span", { className: "font-mono text-red-600 dark:text-red-400 font-semibold", children: row.reference_number || `DN-${row.id}` });
                    case "supplier":
                      return /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.supplier?.name || "Unknown" }),
                        row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: row.supplier.phone })
                      ] });
                    case "amount":
                      return /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600", children: formatCurrency(row.amount, store) });
                    case "reason":
                      return /* @__PURE__ */ jsx("span", { className: "text-ink-muted text-xs italic", children: row.reason || "-" });
                    case "status":
                      const styles = {
                        used: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                        open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      };
                      return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${styles[row.status] || styles.open}`, children: row.status });
                    case "actions":
                      return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2 relative", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-red-600 bg-sunken" : "text-ink-muted hover:bg-interactive-hover"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                        activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-48 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                          /* @__PURE__ */ jsxs(Link, { href: route("store.debit-notes.show", row.id), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary", children: [
                            /* @__PURE__ */ jsx(Eye, { size: 14 }),
                            " View Details"
                          ] }),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary", children: [
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
            )),
            /* @__PURE__ */ jsx("tr", { ref: observerTarget, children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "h-4 p-0" }) }),
            loading && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-4 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-ink-muted", children: [
              /* @__PURE__ */ jsx("div", { className: "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Loading more..." })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedData.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line", children: [
          /* @__PURE__ */ jsx(FileMinus, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No debit notes found" })
        ] }) : sortedData.map((row) => {
          const statusStyles = {
            used: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
            open: "bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20",
            pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
            cancelled: "bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20"
          };
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => setQuickViewItem(row),
              className: `
                                            p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-red-400 transition-colors
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-red-500 ring-inset bg-red-50/20 dark:bg-red-900/10" : ""}
`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm", children: row.supplier?.name || tt("Unknown Supplier") }),
                    row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-semibold", children: row.supplier.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-red-600 dark:text-red-400 block", children: row.reference_number || `DN-${row.id}` }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-semibold block mt-0.5", children: formatDate(row.date || row.created_at) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded border border-red-200/30", children: "Debit Note" }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[row.status] || "bg-sunken text-ink-secondary"}`, children: row.status })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-line pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Amount" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-600", children: formatCurrency(row.amount, store) })
                    ] }),
                    row.reason && /* @__PURE__ */ jsxs("div", { className: "max-w-[150px] truncate", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Reason" }),
                      /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted italic", children: row.reason })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.debit-notes.show", row.id),
                      className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-red-600 transition-colors",
                      title: "View",
                      children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                    }
                  ) })
                ] })
              ]
            },
            row.id
          );
        }) })
      ] })
    ] }),
    quickViewItem && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal", onClick: () => setQuickViewItem(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-2xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Note Details" }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-red-600", children: quickViewItem.reference_number || `DN-${quickViewItem.id}` })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setQuickViewItem(null),
                className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
                children: /* @__PURE__ */ jsx(X, { size: 18 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-auto", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase mb-1", children: tt("Supplier") }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: quickViewItem.supplier?.name || "Unknown" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: quickViewItem.supplier?.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-app rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase mb-1", children: "Amount" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600 text-lg", children: formatCurrency(quickViewItem.amount, store) }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted uppercase", children: quickViewItem.status })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 mb-6", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-orange-600 dark:text-orange-400 uppercase mb-1", children: "Reason" }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-secondary italic", children: quickViewItem.reason || "No specific reason provided." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
              /* @__PURE__ */ jsxs("button", { className: "px-4 py-2 bg-sunken text-ink-secondary font-bold rounded-xl hover:bg-interactive-hover transition-colors flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Printer, { size: 16 }),
                " Print Receipt"
              ] }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.debit-notes.show", quickViewItem.id),
                  className: "px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2",
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
  DebitNotesIndex as default
};
