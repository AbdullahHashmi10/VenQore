import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { ChevronDown, ShoppingBag, CheckSquare, Clock, History, Search, FileSpreadsheet, Printer, Filter, Plus, ChevronUp, MoreVertical, Edit, Trash2, Eye, X } from "lucide-react";
import axios from "axios";
import { P as PurchaseModuleTabs } from "./PurchaseModuleTabs-CoD4w7PX.js";
import { C as ConfirmModal } from "./ConfirmModal-DmA0ajk4.js";
import { P as PrintService } from "./PrintService-B05R75aO.js";
import { P as PrintButton } from "./PrintButton-D3YxgcnK.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "react-dom/client";
import "./format-B_ph0Qec.js";
import "./PrintPreview--U6vwnpl.js";
function PurchasesIndex({ purchases = {}, filters = {}, stats = {} }) {
  const { store, vensynq_enabled } = usePage().props;
  const [allPurchases, setAllPurchases] = useState(purchases.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(purchases.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (purchases.data && purchases.current_page === 1) {
      setAllPurchases(purchases.data);
      setNextPageUrl(purchases.next_page_url);
    }
  }, [purchases]);
  const params = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(params.get("search") || "");
  const [activeFilter, setActiveFilter] = useState(params.get("filter") || "all");
  const [dateRange, setDateRange] = useState({
    from: params.get("from_date") || "",
    to: params.get("to_date") || ""
  });
  const [sortConfig, setSortConfig] = useState({
    key: params.get("sort_by") || "date",
    direction: params.get("sort_dir") || "desc"
  });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [activeSharePopup, setActiveSharePopup] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "12%" },
    { key: "invoice_number", label: "Invoice No", width: "15%" },
    { key: "supplier_name", label: "Supplier Name", width: "20%" },
    { key: "transaction", label: "Type", width: "10%" },
    { key: "payment_method", label: "Payment Type", width: "10%" },
    { key: "total", label: "Amount", width: "10%" },
    { key: "balance", label: "Balance", width: "10%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "10%", frozen: true }
  ]);
  const sortedPurchases = allPurchases;
  const renderCurrency = (val) => (val < 0 ? "-" : "") + (window.amdSettings?.currency_symbol || "Rs") + " " + new Intl.NumberFormat("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(val) || 0);
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const applyFilters = useCallback((newParams) => {
    router.get(route("store.purchases.index", { store_slug: store?.slug }), {
      search: searchTerm,
      filter: activeFilter,
      from_date: dateRange.from,
      to_date: dateRange.to,
      sort_by: sortConfig.key,
      sort_dir: sortConfig.direction,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  }, [store?.slug, searchTerm, activeFilter, dateRange, sortConfig]);
  const [debouncedSearch] = useMemo(() => {
    let timer;
    return [
      (val) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          applyFilters({ search: val });
        }, 400);
      }
    ];
  }, [applyFilters]);
  useEffect(() => {
    if (searchTerm !== (params.get("search") || "")) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, params]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllPurchases((prev) => {
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
    const target = observerTarget.current;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
    }, { threshold: 0.1, rootMargin: "800px" });
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [nextPageUrl, fetchNextPage]);
  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    applyFilters({ sort_by: key, sort_dir: direction });
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [clickTimeout, setClickTimeout] = useState(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".quick-view-modal")) return;
      setActiveActionMenu(null);
      setActiveSharePopup(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && quickViewItem) {
        setQuickViewItem(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [quickViewItem]);
  const handleRowClick = useCallback((row) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      router.visit(route("store.purchases.edit", { store_slug: store?.slug, purchase: row.id }));
    } else {
      const timeout = setTimeout(() => {
        setQuickViewItem(row);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  }, [clickTimeout, store?.slug]);
  const applyFilterType = (type) => {
    setActiveFilter(type);
    applyFilters({ filter: type });
  };
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newRange = { ...dateRange, [name]: value };
    setDateRange(newRange);
    if (newRange.from && newRange.to) {
      applyFilters({ from_date: newRange.from, to_date: newRange.to });
    }
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
  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route("store.purchases.destroy", { store_slug: store?.slug, purchase: itemToDelete }), {
        preserveScroll: true,
        onSuccess: () => {
          setActiveActionMenu(null);
          setShowDeleteModal(false);
          setItemToDelete(null);
        }
      });
    }
  };
  const handleDeleteClick = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
    setActiveActionMenu(null);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Purchases History", activeMenu: "Purchase", children: [
    /* @__PURE__ */ jsx(Head, { title: "Purchases History" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(PurchaseModuleTabs, { activeTab: "purchases" }),
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
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-end text-xs font-extrabold text-slate-700 dark:text-slate-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-indigo-600 dark:text-indigo-400", children: [
              "Purchase: ",
              renderCurrency(stats?.total_purchase || 0)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: [
              "Txns: ",
              purchases?.total || 0
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
              "Paid: ",
              renderCurrency(stats?.total_paid || 0)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-rose-600", children: [
              "Due: ",
              renderCurrency(stats?.total_due || 0)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Purchases" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: renderCurrency(stats?.total_purchase || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Paid Amount" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: renderCurrency(stats?.total_paid || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Unpaid (Due)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-rose-600", children: renderCurrency(stats?.total_due || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: purchases?.total || sortedPurchases.length || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Purchase ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("all"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("today"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("month"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "This Month"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
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
                onChange: handleSearch,
                onKeyDown: handleServerSearch,
                placeholder: "Search purchase #, supplier...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Purchase Transactions" }),
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
                children: /* @__PURE__ */ jsx(Filter, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.purchases.create", { store_slug: store?.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Purchase",
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
              onChange: handleSearch,
              onKeyDown: handleServerSearch,
              placeholder: "Search purchase #, supplier...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none text-slate-800 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("all"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("today"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("month"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Month"
            }
          )
        ] }) })
      ] }),
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
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedPurchases.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No purchases found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Record your first purchase to get started" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchases.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Create First Purchase"
                ]
              }
            )
          ] }) }) }) : sortedPurchases.map((row) => /* @__PURE__ */ jsx(
            "tr",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-indigo-400
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                        `,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
                switch (col.key) {
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.date || row.created_at) });
                  case "invoice_number":
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.invoice_number || row.reference_number || "-" }),
                      vensynq_enabled && row.is_jit && row.approval_status === "draft" && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide", children: "JIT Draft" })
                    ] });
                  case "supplier_name":
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.supplier?.name || "Unknown Supplier" }),
                      row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.supplier.phone })
                    ] });
                  case "transaction":
                    return /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md", children: "Purchase" });
                  case "payment_method":
                    return /* @__PURE__ */ jsx("span", { className: "uppercase text-xs font-semibold", children: row.payment_method || "-" });
                  case "total":
                    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold", children: renderCurrency(row.subtotal || row.total) }),
                      row.extras > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs text-amber-600 dark:text-amber-400", children: [
                        "+",
                        renderCurrency(row.extras),
                        " extras"
                      ] })
                    ] });
                  case "balance": {
                    const paid = parseFloat(row.paid || 0);
                    const total = parseFloat(row.total || 0);
                    const balance = row.balance ?? total - paid;
                    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
                        "Paid: ",
                        /* @__PURE__ */ jsx("span", { className: "text-emerald-600 font-semibold", children: renderCurrency(paid) })
                      ] }),
                      balance > 1 ? /* @__PURE__ */ jsxs("span", { className: "text-red-500 font-bold", children: [
                        "Due: ",
                        renderCurrency(balance)
                      ] }) : /* @__PURE__ */ jsx("span", { className: "text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit", children: "Settled" })
                    ] });
                  }
                  case "status": {
                    let paymentStatus = row.payment_status || "unpaid";
                    const isJitDraft2 = row.is_jit === 1 && row.approval_status === "draft" && vensynq_enabled;
                    const statusStyles = {
                      paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                      partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                      unpaid: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                    };
                    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-[10px] font-bold uppercase w-fit ${statusStyles[paymentStatus] || "bg-slate-100 text-slate-700"}`, children: paymentStatus }),
                      isJitDraft2 && /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-md text-[10px] font-bold uppercase w-fit bg-amber-500/20 text-amber-500 border border-amber-500/30", children: "JIT Draft (Unapproved)" })
                    ] });
                  }
                  case "actions":
                    const isJitDraft = row.is_jit === 1 && row.approval_status === "draft" && vensynq_enabled;
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 relative", onClick: (e) => e.stopPropagation(), children: [
                      isJitDraft && /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            if (confirm("Approve this JIT draft and finalize the purchase?")) {
                              router.patch(route("store.vensynq.jit.approve", { store_slug: store?.slug, purchase: row.id }), {}, { preserveScroll: true });
                            }
                          },
                          className: "px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded flex items-center gap-1 shadow-sm",
                          title: "Approve JIT Auto-Draft",
                          children: [
                            /* @__PURE__ */ jsx(CheckSquare, { size: 12 }),
                            " Approve"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx("button", { onClick: (e) => {
                        e.stopPropagation();
                        PrintService.quickPrint(row);
                      }, className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                        activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                          /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.edit", [store.slug, row.id]), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                            /* @__PURE__ */ jsx(Edit, { size: 14 }),
                            " View Details"
                          ] }),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                            /* @__PURE__ */ jsx(History, { size: 14 }),
                            " Payment History"
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: (e) => {
                                e.stopPropagation();
                                handleDeleteClick(row.id);
                              },
                              className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600",
                              children: [
                                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                                " Delete"
                              ]
                            }
                          )
                        ] }) })
                      ] })
                    ] });
                  default:
                    return /* @__PURE__ */ jsx("span", { children: "-" });
                }
              })() }, `${row.id}-${col.key}`))
            },
            row.id
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedPurchases.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No purchases found" })
        ] }) : sortedPurchases.map((row) => {
          const paid = parseFloat(row.paid || 0);
          const total = parseFloat(row.total || 0);
          const balance = row.balance ?? total - paid;
          let paymentStatus = row.payment_status || "unpaid";
          const isJitDraft = row.is_jit === 1 && row.approval_status === "draft" && vensynq_enabled;
          const statusStyles = {
            paid: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
            partial: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
            unpaid: "bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20"
          };
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-indigo-400 transition-colors
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/20 dark:bg-indigo-900/10" : ""}
                                        `,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-extrabold text-slate-800 dark:text-white text-sm", children: row.supplier?.name || "Unknown Supplier" }),
                    row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-semibold", children: row.supplier.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block", children: row.invoice_number || row.reference_number || "-" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-semibold block mt-0.5", children: formatDate(row.date || row.created_at) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200/30", children: "Purchase" }),
                  isJitDraft && /* @__PURE__ */ jsx("span", { className: "text-[9px] font-black bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded uppercase tracking-wide", children: "JIT Draft" }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-[9px] font-bold uppercase ${statusStyles[paymentStatus] || "bg-slate-100 text-slate-700"}`, children: paymentStatus })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase block tracking-wider", children: "Total" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-900 dark:text-white", children: renderCurrency(total) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold uppercase block tracking-wider", children: "Balance" }),
                      balance > 1 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-red-500", children: renderCurrency(balance) }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10", children: "Settled" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                    isJitDraft && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          if (confirm("Approve this JIT draft and finalize the purchase?")) {
                            router.patch(route("store.vensynq.jit.approve", { store_slug: store?.slug, purchase: row.id }), {}, { preserveScroll: true });
                          }
                        },
                        className: "px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-sm",
                        title: "Approve JIT Auto-Draft",
                        children: "Approve"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => PrintService.quickPrint(row),
                        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors",
                        title: "Print",
                        children: /* @__PURE__ */ jsx(Printer, { size: 16 })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                          },
                          className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100 dark:bg-slate-800" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`,
                          children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                        }
                      ),
                      activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                        /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.edit", [store.slug, row.id]), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(Eye, { size: 14 }),
                          " View Details"
                        ] }),
                        /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                          /* @__PURE__ */ jsx(History, { size: 14 }),
                          " Payment History"
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              handleDeleteClick(row.id);
                            },
                            className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600",
                            children: [
                              /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                              " Delete"
                            ]
                          }
                        )
                      ] }) })
                    ] })
                  ] })
                ] })
              ]
            },
            row.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "mt-4 p-4 text-center text-slate-400 text-sm opacity-0 h-4", children: nextPageUrl ? "Loading..." : "" })
      ] }),
      /* @__PURE__ */ jsx(
        ConfirmModal,
        {
          show: showDeleteModal,
          onClose: () => setShowDeleteModal(false),
          onConfirm: confirmDelete,
          title: "Delete Purchase",
          message: "Are you sure you want to delete this purchase? This action cannot be undone and will restore stock items.",
          confirmLabel: "Delete Purchase",
          isDangerous: true
        }
      )
    ] }),
    quickViewItem && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", onClick: () => setQuickViewItem(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Purchase Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-indigo-600", children: quickViewItem.invoice_number || quickViewItem.reference_number })
              ] }),
              (() => {
                const statusStyles = {
                  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  unpaid: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                };
                const ps = quickViewItem.payment_status || "unpaid";
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[ps] || "bg-slate-100 text-slate-700"}`, children: ps });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                PrintButton,
                {
                  sale: quickViewItem,
                  label: "Print",
                  variant: "secondary",
                  size: "sm",
                  className: "font-bold text-xs"
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.purchases.edit", { store_slug: store?.slug, purchase: quickViewItem.id }),
                  className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { size: 14 }),
                    " View Details"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuickViewItem(null),
                  className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-3 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Supplier" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewItem.supplier?.name || "Unknown" }),
                quickViewItem.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: quickViewItem.supplier.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewItem.date || quickViewItem.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Payment" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm uppercase", children: quickViewItem.payment_method || "Cash" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-indigo-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-indigo-600 text-lg", children: renderCurrency(quickViewItem.total) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-300 uppercase", children: [
                "Items in this Purchase (",
                quickViewItem.items?.length || 0,
                ")"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-[10px] font-bold text-slate-400 uppercase", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-[10px] font-bold text-slate-400 uppercase", children: "Item Name" }),
                  /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-[10px] font-bold text-slate-400 uppercase", children: "Qty" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-[10px] font-bold text-slate-400 uppercase", children: "Rate" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-[10px] font-bold text-slate-400 uppercase", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: quickViewItem.items && quickViewItem.items.length > 0 ? quickViewItem.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-400 font-mono text-xs", children: idx + 1 }),
                  /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: item.product?.name || item.name || "Unknown Item" }),
                    item.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-mono", children: item.product.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: renderCurrency(item.price || item.unit_price || 0) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: renderCurrency(item.quantity * (item.price || item.unit_price || 0)) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-300", children: renderCurrency(quickViewItem.subtotal || quickViewItem.total) })
                ] }),
                quickViewItem.extras > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-600 uppercase", children: "Extras" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-bold text-amber-600", children: [
                    "+",
                    renderCurrency(quickViewItem.extras)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-slate-200 dark:border-slate-700 pl-6", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Paid" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600", children: renderCurrency(quickViewItem.paid || 0) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Balance" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: renderCurrency(quickViewItem.balance ?? (quickViewItem.total || 0) - (quickViewItem.paid || 0)) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-slate-200 dark:border-slate-700 pl-6", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-600 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-indigo-600", children: renderCurrency(quickViewItem.total) })
                ] })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            "Double-click row to view details • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono", children: "Esc" }),
            " to close"
          ] }) })
        ]
      }
    ) })
  ] });
}
export {
  PurchasesIndex as default
};
