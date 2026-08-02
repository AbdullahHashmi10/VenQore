import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { ChevronDown, ShoppingCart, Clock, CheckSquare, History, Search, FileSpreadsheet, Printer, Filter, Plus, ChevronUp, Edit, Eye, X, Package } from "lucide-react";
import { P as PurchaseModuleTabs } from "./PurchaseModuleTabs-CoD4w7PX.js";
import axios from "axios";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function PurchaseOrdersIndex({ orders = {}, stats = {} }) {
  const { store } = usePage().props;
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
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllOrders((prev) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const tableColumns = [
    { key: "date", label: "Date", width: "15%" },
    { key: "reference", label: "Reference No", width: "18%" },
    { key: "supplier", label: "Supplier", width: "22%" },
    { key: "items", label: "Items", width: "8%" },
    { key: "total", label: "Total", width: "12%" },
    { key: "status", label: "Status", width: "12%" },
    { key: "actions", label: "Actions", width: "13%" }
  ];
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".quick-view-modal")) return;
      setActiveActionMenu(null);
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
      router.visit(route("store.purchase-orders.show", row.id));
    } else {
      const timeout = setTimeout(() => {
        setQuickViewItem(row);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  }, [clickTimeout]);
  function resolveValue(item, key) {
    switch (key) {
      case "date":
        return item.order_date;
      case "reference":
        return item.reference_number;
      case "supplier":
        return item.supplier?.name || "Unknown Supplier";
      case "total":
        return parseFloat(item.total_amount || 0);
      case "status":
        return item.status;
      default:
        return item[key];
    }
  }
  const sortedOrders = useMemo(() => {
    const data = Array.isArray(allOrders) ? allOrders : [];
    return [...data].sort((a, b) => {
      let valA = resolveValue(a, sortConfig.key);
      let valB = resolveValue(b, sortConfig.key);
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [allOrders, sortConfig]);
  const applyFilters = (newParams) => {
    router.get(route("store.purchase-orders.index", { store_slug: store.slug }), {
      search: searchTerm,
      filter: activeFilter,
      ...newParams
    }, { preserveState: true, preserveScroll: true });
  };
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      applyFilters({ search: searchTerm });
    }
  };
  const handleFilterChange = (status) => {
    setActiveFilter(status);
    applyFilters({ filter: status });
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "-";
  const totalOrders = stats.total_orders || allOrders.length;
  const pendingOrders = stats.pending_orders || allOrders.filter((o) => o.status === "pending" || o.status === "ordered").length;
  const receivedOrders = stats.received_orders || allOrders.filter((o) => o.status === "received").length;
  const totalValue = stats.total_value || allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Pre-Purchases", activeMenu: "Purchase", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pre-Purchases" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(PurchaseModuleTabs, { activeTab: "pre-purchases" }),
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
            formatCurrency(totalValue, store)
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
          /* @__PURE__ */ jsxs("span", { className: "text-blue-600 dark:text-blue-400", children: [
            "Txns: ",
            totalOrders
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Orders" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: totalOrders })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Pending" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-amber-600", children: pendingOrders })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Received" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: receivedOrders })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(totalValue, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Purchase ",
            /* @__PURE__ */ jsx("span", { className: "text-purple-600", children: "Orders" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("ordered"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "ordered" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Ordered"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("received"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "received" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Received"
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
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search purchase orders...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none"
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
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Pre-Purchases" }),
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
                href: route("store.purchase-orders.create", { store_slug: store.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Purchase Order",
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
              placeholder: "Search purchase orders...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow outline-none text-slate-800 dark:text-white"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-slate-400 pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("ordered"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "ordered" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Ordered"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleFilterChange("received"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "received" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Received"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm bg-transparent md:bg-white md:dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: tableColumns.map((col) => /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => col.key !== "actions" && handleSort(col.key),
              className: "p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
              style: { width: col.width },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                col.label,
                col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" }))
              ] })
            },
            col.key
          )) }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedOrders.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No purchase orders found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Create your first purchase order to get started" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchase-orders.create", { store_slug: store.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Create Purchase Order"
                ]
              }
            )
          ] }) }) }) : sortedOrders.map((row) => /* @__PURE__ */ jsxs(
            "tr",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-purple-400
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-purple-500 ring-inset bg-purple-50 dark:bg-purple-900/20" : ""}
                                        `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.order_date) }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm", children: /* @__PURE__ */ jsx("span", { className: "font-mono text-purple-600 dark:text-purple-400 font-semibold", children: row.reference_number }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.supplier?.name || "Unknown Supplier" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsx("span", { className: "font-bold", children: row.items?.length || 0 }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-900 dark:text-white", children: formatCurrency(row.total_amount, store) }) }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm", children: (() => {
                  const statusStyles = {
                    received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                    ordered: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                    cancelled: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  };
                  return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[row.status] || "bg-slate-100 text-slate-700"}`, children: row.status });
                })() }),
                /* @__PURE__ */ jsx("td", { className: "p-4 text-sm", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                  row.status !== "received" && /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.purchase-orders.edit", row.id),
                      className: "p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-600 transition-colors",
                      children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Link,
                    {
                      href: route("store.purchase-orders.show", row.id),
                      className: "p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-indigo-600 transition-colors",
                      children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                    }
                  )
                ] }) })
              ]
            },
            row.id
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedOrders.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(ShoppingCart, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No purchase orders found" })
        ] }) : sortedOrders.map((row) => {
          const statusStyles = {
            received: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
            ordered: "bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-500/20",
            pending: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
            cancelled: "bg-red-100/50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-500/20"
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
                    row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-semibold", children: row.supplier.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block", children: row.reference_number || "-" }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400 font-semibold block mt-0.5", children: formatDate(row.order_date || row.created_at) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-200/30", children: "Pre-Purchase" }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[row.status] || "bg-slate-100 text-slate-700"}`, children: row.status })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase block tracking-wider", children: "Total" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-900 dark:text-white", children: formatCurrency(row.total_amount, store) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-bold uppercase block tracking-wider", children: "Items" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-black text-slate-700 dark:text-slate-350", children: row.items?.length || 0 })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", onClick: (e) => e.stopPropagation(), children: [
                    row.status !== "received" && /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.purchase-orders.edit", row.id),
                        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-amber-600 transition-colors",
                        title: "Edit",
                        children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.purchase-orders.show", row.id),
                        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors",
                        title: "View",
                        children: /* @__PURE__ */ jsx(Eye, { size: 16 })
                      }
                    )
                  ] })
                ] })
              ]
            },
            row.id
          );
        }) }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0", children: nextPageUrl ? "Loading..." : sortedOrders.length > 0 ? "End of list" : "" })
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
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Purchase Order" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-purple-600", children: quickViewItem.reference_number })
              ] }),
              (() => {
                const statusStyles = {
                  received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  ordered: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                };
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[quickViewItem.status] || "bg-slate-100 text-slate-700"}`, children: quickViewItem.status });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("button", { className: "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Printer, { size: 14 }),
                " Print"
              ] }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.purchase-orders.show", quickViewItem.id),
                  className: "px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Eye, { size: 14 }),
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
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Supplier" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewItem.supplier?.name || "Unknown" }),
                quickViewItem.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: quickViewItem.supplier.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Order Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewItem.order_date) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 p-3 rounded-xl border border-purple-200 dark:border-purple-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-purple-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-purple-600 text-lg", children: formatCurrency(quickViewItem.total_amount, store) })
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
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "Item Name" }),
                  /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-slate-400 uppercase", children: "Qty" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Rate" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: quickViewItem.items && quickViewItem.items.length > 0 ? quickViewItem.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-slate-400 font-mono text-xs", children: idx + 1 }),
                  /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: item.product?.name || item.name || "Unknown Item" }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: formatCurrency(item.price || item.unit_price || 0, store) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency(item.quantity * (item.price || item.unit_price || 0), store) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-purple-600 uppercase font-bold", children: "Grand Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-purple-600", children: formatCurrency(quickViewItem.total_amount, store) })
              ] }) }) })
            ] }),
            quickViewItem.status !== "received" && /* @__PURE__ */ jsx("div", { className: "mt-4 flex justify-center", children: /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchase-orders.receive", quickViewItem.id),
                method: "post",
                as: "button",
                className: "px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 w-full justify-center",
                children: [
                  /* @__PURE__ */ jsx(Package, { size: 16 }),
                  " Receive Stock"
                ]
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-400", children: [
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
  PurchaseOrdersIndex as default
};
