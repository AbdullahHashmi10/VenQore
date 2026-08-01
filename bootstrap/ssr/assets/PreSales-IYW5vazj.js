import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { u as useAlert, F as FormModal } from "../ssr.js";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { ChevronDown, ShoppingBag, CheckSquare, Clock, History, Search, Plus, ChevronUp, Printer, MoreVertical, Edit, ShoppingCart, Truck, XCircle, Trash2, X, CheckCircle2 } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-Uyl5BGtI.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
function PreOrders({ orders, filters: rawFilters, stats }) {
  const { store, flash } = usePage().props;
  const filters = rawFilters && !Array.isArray(rawFilters) ? rawFilters : {};
  const [conversionSuccessModal, setConversionSuccessModal] = useState({ show: false, saleId: null });
  useEffect(() => {
    if (flash?.print_sale_id) {
      setConversionSuccessModal({ show: true, saleId: flash.print_sale_id });
    }
  }, [flash]);
  const [allOrders, setAllOrders] = useState(orders.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(orders.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (orders.data && orders.current_page === 1) {
      setAllOrders(orders.data);
      setNextPageUrl(orders.next_page_url);
    }
  }, [orders]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, {
        params: {
          search: searchTerm,
          filter: activeFilter,
          from_date: dateRange.from,
          to_date: dateRange.to
        },
        headers: { "Accept": "application/json" }
      });
      const newItems = response.data.data;
      setAllOrders((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error("Failed to load more orders:", error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) {
        fetchNextPage();
      }
    }, { threshold: 0.1, rootMargin: "800px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [activeFilter, setActiveFilter] = useState(filters?.filter || "all");
  const [dateRange, setDateRange] = useState({
    from: filters?.from_date || "",
    to: filters?.to_date || ""
  });
  const { showConfirm } = useAlert();
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "12%" },
    { key: "order_number", label: "Order No", width: "15%" },
    { key: "party_name", label: "Party Name", width: "15%" },
    { key: "transaction", label: "Transaction", width: "10%" },
    { key: "total_amount", label: "Amount", width: "10%" },
    { key: "balance", label: "Balance", width: "10%" },
    { key: "due_date", label: "Due Date", width: "10%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "8%", frozen: true }
  ]);
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [activeSharePopup, setActiveSharePopup] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [debouncedSearch] = useMemo(() => {
    let timer;
    return [
      (val) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          applyServerFilters({ search: val });
        }, 400);
      }
    ];
  }, [activeFilter, dateRange]);
  useEffect(() => {
    if (searchTerm !== (filters?.search || "")) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && quickViewItem) setQuickViewItem(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [quickViewItem]);
  const handleRowClick = useCallback((row) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      router.visit(route("store.sales.orders.show", { store_slug: store?.slug, order: row.id }));
    } else {
      const timeout = setTimeout(() => {
        setQuickViewItem(row);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  }, [clickTimeout]);
  const applyServerFilters = (newParams) => {
    router.get(route("store.pre-sales.index", { store_slug: store?.slug }), {
      search: searchTerm,
      filter: activeFilter,
      from_date: dateRange.from,
      to_date: dateRange.to,
      ...newParams
    }, { preserveState: true, preserveScroll: true, replace: true });
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyServerFilters({ search: searchTerm });
    }
  };
  const applyFilterType = (type) => {
    setActiveFilter(type);
    applyServerFilters({ filter: type });
  };
  const sortedData = useMemo(() => {
    let items = [...allOrders];
    return items.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const valA = resolveValue(a, sortConfig.key);
      const valB = resolveValue(b, sortConfig.key);
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }, [allOrders, sortConfig]);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  function resolveValue(item, key) {
    switch (key) {
      case "date":
        return item.created_at;
      case "order_number":
        return item.order_number;
      case "party_name":
        return item.customer?.name || "Walk-in";
      case "total_amount":
        return parseFloat(item.total_amount);
      case "status":
        return item.status;
      default:
        return item[key];
    }
  }
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
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Pre-Orders", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pre-Orders" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "pre-sales" }),
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
              "Total: ",
              stats?.order_count || 0
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
              "Confirmed: ",
              stats?.confirmed_count || 0
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-amber-600", children: [
              "Pending: ",
              stats?.pending_count || 0
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600", children: [
              "Value: ",
              formatCurrency(stats?.total_orders || 0, store)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Orders" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.order_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Confirmed" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats?.confirmed_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Pending" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: stats?.pending_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(stats?.total_orders || 0, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Pre-",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Orders" })
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
              onClick: () => applyFilterType("confirmed"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "confirmed" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Confirmed"
            }
          )
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
                placeholder: "Search orders...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: /* @__PURE__ */ jsxs(Link, { href: route("store.pre-sales.create", { store_slug: store?.slug }), className: "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors", children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            " New Pre-Order"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: [
            "Pre-",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Orders" })
          ] }),
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
                href: route("store.pre-sales.create", { store_slug: store?.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Pre-Order",
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
              placeholder: "Search orders...",
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
              onClick: () => applyFilterType("confirmed"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "confirmed" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Confirmed"
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
          /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: [
            sortedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "text-slate-400" }) }),
              /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No pre-orders found" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Create your first pre-order to get started" }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.pre-sales.create", { store_slug: store?.slug }),
                  className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 16 }),
                    " Create Pre-Order"
                  ]
                }
              )
            ] }) }) }) : sortedData.map((row) => /* @__PURE__ */ jsx(
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
                      return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                    case "order_number":
                      return /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.order_number });
                    case "party_name":
                      return /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.customer?.name || "Walk-in" }),
                        row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.customer.phone })
                      ] });
                    case "transaction":
                      return /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded-md", children: "Pre-Order" });
                    case "total_amount":
                      return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.total_amount, store) });
                    case "balance":
                      const paid = parseFloat(row.paid_amount || 0);
                      const balance = parseFloat(row.total_amount) - paid;
                      if (balance > 1) return /* @__PURE__ */ jsx("span", { className: "text-red-500 font-bold", children: formatCurrency(balance, store) });
                      if (balance < -1) return /* @__PURE__ */ jsxs("span", { className: "text-blue-600 font-bold", title: "Overpaid Amount", children: [
                        "+",
                        formatCurrency(Math.abs(balance), store)
                      ] });
                      return /* @__PURE__ */ jsx("span", { className: "text-emerald-500 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full", children: "Settled" });
                    case "due_date":
                      return /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: row.due_date ? formatDate(row.due_date) : "-" });
                    case "status":
                      let status = row.status || "pending";
                      const statusStyles = {
                        confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                        pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                        cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                        converted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                        completed: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      };
                      return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[status] || "bg-slate-100 text-slate-700"}`, children: status === "completed" ? "converted" : status });
                    case "actions":
                      return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 relative", onClick: (e) => e.stopPropagation(), children: [
                        /* @__PURE__ */ jsx("a", { href: route("store.sales.print", { store_slug: store.slug, sale: row.id }), target: "_blank", className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                          /* @__PURE__ */ jsx("button", { onClick: (e) => {
                            e.stopPropagation();
                            setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                          }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                          activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                            /* @__PURE__ */ jsxs(Link, { href: route("store.sales.orders.show", { store_slug: store?.slug, order: row.id }), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                              /* @__PURE__ */ jsx(Edit, { size: 14 }),
                              " ",
                              row.status === "completed" || row.status === "converted" ? "View Details" : "View/Edit"
                            ] }),
                            row.status !== "completed" && row.status !== "converted" && /* @__PURE__ */ jsxs(Fragment, { children: [
                              /* @__PURE__ */ jsxs("button", { onClick: async () => {
                                try {
                                  const items = row.items || [];
                                  let isStockAvailable = true;
                                  for (const item of items) {
                                    const res = await axios.get(route("store.inventory.search", {
                                      store_slug: store.slug
                                    }), { params: { query: item.product?.sku || item.product?.name } });
                                    const prod = res.data?.find((p) => p.id === item.product_id);
                                    if (prod && (prod.available_stock || 0) < item.quantity) {
                                      isStockAvailable = false;
                                      break;
                                    }
                                  }
                                  if (isStockAvailable) {
                                    showConfirm?.({
                                      title: "Convert Sale?",
                                      message: "Convert this pre-order to a sale? Stock will be deducted.",
                                      type: "warning",
                                      confirmLabel: "Convert",
                                      onConfirm: () => router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: row.id }))
                                    });
                                  } else {
                                    showConfirm?.({
                                      title: "Stock Not Available",
                                      message: "Stock not available. Confirm backorder delivery or cancel?",
                                      type: "error",
                                      confirmLabel: "Confirm Backorder",
                                      onConfirm: () => router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: row.id }))
                                    });
                                  }
                                } catch (err) {
                                  router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: row.id }));
                                }
                              }, className: "w-full text-left px-3 py-2 hover:bg-emerald-50 rounded dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm text-emerald-600", children: [
                                /* @__PURE__ */ jsx(ShoppingCart, { size: 14 }),
                                " Convert To Sale"
                              ] }),
                              /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                                /* @__PURE__ */ jsx(Truck, { size: 14 }),
                                " Delivery Challan"
                              ] }),
                              /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                              /* @__PURE__ */ jsxs("button", { onClick: () => {
                                showConfirm?.({
                                  title: "Cancel Order?",
                                  message: "Are you sure you want to cancel this order?",
                                  type: "error",
                                  confirmLabel: "Cancel Order",
                                  onConfirm: () => router.post(route("store.sales-orders.cancel", { store_slug: store?.slug, salesOrder: row.id }))
                                });
                              }, className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600", children: [
                                /* @__PURE__ */ jsx(XCircle, { size: 14 }),
                                " Cancel Order"
                              ] }),
                              /* @__PURE__ */ jsxs("button", { onClick: () => {
                                showConfirm?.({ title: "Delete Pre-Sale?", message: "Are you sure you want to delete this order? It will be moved to the Recycle Bin.", type: "error", confirmLabel: "Delete", onConfirm: () => router.delete(route("store.pre-sales.destroy", { store_slug: store?.slug, order: row.id }), { onSuccess: () => setAllOrders((prev) => prev.filter((o) => o.id !== row.id)) }) });
                              }, className: "w-full text-left px-3 py-2 hover:bg-red-100 rounded dark:hover:bg-red-900/30 flex items-center gap-2 text-sm text-red-700 dark:text-red-400 font-bold", children: [
                                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                                " Delete"
                              ] })
                            ] })
                          ] }) })
                        ] })
                      ] });
                    default:
                      return /* @__PURE__ */ jsx("span", { children: "-" });
                  }
                })() }, `${row.id}-${col.key}`))
              },
              row.id
            )),
            /* @__PURE__ */ jsx("tr", { ref: observerTarget, className: "h-4", children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "text-center p-2", children: isLoading.current && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Loading more..." }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: [
          sortedData.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No pre-orders found" })
          ] }) : sortedData.map((row) => {
            const paid = parseFloat(row.paid_amount || 0);
            const balance = parseFloat(row.total_amount) - paid;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => handleRowClick(row),
                className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold", children: row.order_number }),
                      /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-0.5", children: formatDate(row.created_at) })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${row.status === "confirmed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : row.status === "converted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : row.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                                            `, children: row.status || "pending" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Customer" }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white mt-0.5", children: row.customer?.name || "Walk-in" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Value" }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-900 dark:text-white mt-0.5", children: formatCurrency(row.total_amount, store) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                    /* @__PURE__ */ jsx("div", { children: balance > 1 ? /* @__PURE__ */ jsxs("span", { className: "text-red-500 font-bold", children: [
                      "Due: ",
                      formatCurrency(balance, store)
                    ] }) : balance < -1 ? /* @__PURE__ */ jsxs("span", { className: "text-blue-600 font-bold", children: [
                      "Overpaid: ",
                      formatCurrency(Math.abs(balance), store)
                    ] }) : /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full", children: "Settled" }) }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
                      /* @__PURE__ */ jsx(
                        "a",
                        {
                          href: route("store.sales.print", { store_slug: store.slug, sale: row.id }),
                          target: "_blank",
                          className: "p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700",
                          children: /* @__PURE__ */ jsx(Printer, { size: 14 })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Link,
                        {
                          href: route("store.sales.orders.show", { store_slug: store?.slug, order: row.id }),
                          className: "px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors",
                          children: "View / Edit"
                        }
                      )
                    ] })
                  ] })
                ]
              },
              row.id
            );
          }),
          /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "py-4 text-center shrink-0", children: isLoading.current && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Loading more..." }) })
        ] })
      ] })
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
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Pre-Order Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-indigo-600", children: quickViewItem.order_number })
              ] }),
              (() => {
                const statusStyles = {
                  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                  converted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                };
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[quickViewItem.status] || "bg-slate-100 text-slate-700"}`, children: quickViewItem.status });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: route("store.sales-orders.print", { store_slug: store?.slug, salesOrder: quickViewItem.id }),
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
                  href: route("store.sales.orders.show", { store_slug: store?.slug, order: quickViewItem.id }),
                  className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { size: 14 }),
                    " Edit Order"
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
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Customer" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewItem.customer?.name || "Walk-in" }),
                quickViewItem.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: quickViewItem.customer.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Order Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewItem.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Due Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewItem.due_date) || "Not set" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-indigo-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-indigo-600 text-lg", children: formatCurrency(quickViewItem.total_amount, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-300 uppercase", children: [
                "Items in this Order (",
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
                  /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: item.product?.name || item.name || "Unknown Item" }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: item.quantity || item.quantity_requested }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: formatCurrency(item.price || item.unit_price || 0, store) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency((item.quantity || item.quantity_requested) * (item.price || item.unit_price || 0), store) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Paid" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600", children: formatCurrency(quickViewItem.paid_amount || 0, store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Balance" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-red-600", children: formatCurrency((quickViewItem.total_amount || 0) - (quickViewItem.paid_amount || 0), store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-slate-200 dark:border-slate-700 pl-8", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-600 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-indigo-600", children: formatCurrency(quickViewItem.total_amount, store) })
                ] })
              ] }) })
            ] }),
            quickViewItem.status !== "completed" && quickViewItem.status !== "converted" && quickViewItem.status !== "cancelled" && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-center gap-2", children: /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: async () => {
                  try {
                    const items = quickViewItem.items || [];
                    let isStockAvailable = true;
                    for (const item of items) {
                      const res = await axios.get(route("store.inventory.search", {
                        store_slug: store.slug
                      }), { params: { query: item.product?.sku || item.product?.name } });
                      const prod = res.data?.find((p) => p.id === item.product_id);
                      if (prod && (prod.available_stock || 0) < item.quantity) {
                        isStockAvailable = false;
                        break;
                      }
                    }
                    setQuickViewItem(null);
                    if (isStockAvailable) {
                      showConfirm?.({
                        title: "Convert to Sale?",
                        message: "Convert this pre-order to a sale? Stock will be deducted.",
                        type: "warning",
                        confirmLabel: "Convert",
                        onConfirm: () => router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: quickViewItem.id }))
                      });
                    } else {
                      showConfirm?.({
                        title: "Stock Not Available",
                        message: "Stock not available. Confirm backorder delivery or cancel?",
                        type: "error",
                        confirmLabel: "Confirm Backorder",
                        onConfirm: () => router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: quickViewItem.id }))
                      });
                    }
                  } catch (err) {
                    setQuickViewItem(null);
                    router.post(route("store.pre-sales.convert", { store_slug: store?.slug, order: quickViewItem.id }));
                  }
                },
                className: "px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }),
                  " Convert to Sale"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            "Double-click row to view/edit • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono", children: "Esc" }),
            " to close"
          ] }) })
        ]
      }
    ) }),
    conversionSuccessModal.show && /* @__PURE__ */ jsx(
      FormModal,
      {
        title: "Conversion Successful",
        onClose: () => setConversionSuccessModal({ show: false, saleId: null }),
        children: /* @__PURE__ */ jsxs("div", { className: "p-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 32 }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white mb-2", children: "Pre-Order Converted to Sale!" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-6", children: "The Pre-Order has been successfully converted into a tax invoice." }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-center", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setConversionSuccessModal({ show: false, saleId: null }),
                className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all",
                children: "Close"
              }
            ),
            /* @__PURE__ */ jsxs(
              "a",
              {
                href: route("store.sales.print", { store_slug: store?.slug, sale: conversionSuccessModal.saleId }),
                target: "_blank",
                rel: "noopener noreferrer",
                onClick: () => setConversionSuccessModal({ show: false, saleId: null }),
                className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all",
                children: [
                  /* @__PURE__ */ jsx(Printer, { size: 16 }),
                  " Print Invoice"
                ]
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
export {
  PreOrders as default
};
