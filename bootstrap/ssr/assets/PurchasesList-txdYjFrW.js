import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { b as useTerms, u as useTermText } from "./terms-DwYjlWsV.js";
import { ChevronDown, ShoppingBag, CheckSquare, Clock, History, Search, FileSpreadsheet, Printer, Filter, Plus, ChevronUp, MoreVertical, Eye, Edit, Trash2, X } from "lucide-react";
import axios from "axios";
import { P as PurchaseModuleTabs } from "./PurchaseModuleTabs-Cu1z0Kdx.js";
import { C as ConfirmModal } from "./ConfirmModal-DaQlI6mj.js";
import { P as PrintService } from "./PrintService-L_d7O0gK.js";
import { P as PrintButton } from "./PrintButton-DBeq4QSv.js";
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
import "react-dom/client";
import "./format-131Nyq79.js";
import "./PrintPreview-CmXEPl-w.js";
import "qrcode.react";
function PurchasesIndex({ purchases = {}, filters = {}, stats = {} }) {
  const { t } = useTerms();
  const tt = useTermText();
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
    { key: "supplier_name", label: tt("Supplier Name"), width: "20%" },
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
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(PurchaseModuleTabs, { activeTab: "purchases" }),
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
        !isStatsExpanded && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 items-end text-xs font-bold text-ink-secondary", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-brand-600 dark:text-brand-400", children: [
              "Purchase: ",
              renderCurrency(stats?.total_purchase || 0)
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
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
            /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-rose-600", children: [
              "Due: ",
              renderCurrency(stats?.total_due || 0)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Purchases" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: renderCurrency(stats?.total_purchase || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Paid Amount" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: renderCurrency(stats?.total_paid || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Unpaid (Due)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-rose-600", children: renderCurrency(stats?.total_due || 0) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: purchases?.total || sortedPurchases.length || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            t("purchase", "Purchase"),
            " ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600 dark:text-brand-400", children: "Transactions" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-line mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("today"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("month"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover"}`,
              children: "This Month"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:text-ink hover:bg-interactive-hover"}`,
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
                className: "px-2 py-0.5 text-xs font-semibold bg-sunken border border-line rounded-md text-ink focus:ring-1 focus:ring-brand-500"
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
                className: "px-2 py-0.5 text-xs font-semibold bg-sunken border border-line rounded-md text-ink focus:ring-1 focus:ring-brand-500"
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
                placeholder: tt("Search purchase #, supplier..."),
                className: "w-full pl-9 pr-4 py-2 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink placeholder:text-ink-muted"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 transition-colors", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-bold text-ink uppercase tracking-tight", children: "Purchase Transactions" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowMobileSearch(!showMobileSearch);
                  if (showMobileFilters) setShowMobileFilters(false);
                },
                className: `p-2 rounded-lg transition-colors ${showMobileSearch ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
                className: `p-2 rounded-lg transition-colors ${showMobileFilters ? "bg-brand-600 text-white shadow-sm" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
                title: "Filters",
                children: /* @__PURE__ */ jsx(Filter, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.purchases.create", { store_slug: store?.slug }),
                className: "p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors",
                title: "New Purchase",
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
              onChange: handleSearch,
              onKeyDown: handleServerSearch,
              placeholder: tt("Search purchase #, supplier..."),
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none text-ink placeholder:text-ink-muted"
            }
          ),
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-[65%] -translate-y-1/2 text-ink-muted pointer-events-none", size: 14 })
        ] }),
        showMobileFilters && /* @__PURE__ */ jsx("div", { className: "w-full mt-1 border-t border-line pt-2 flex flex-col gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("today"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("month"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "month" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Month"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto md:rounded-2xl md:border md:border-line md:shadow-sm bg-transparent md:bg-surface", children: [
        /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-sunken border-b border-line sticky top-0 z-10", children: tableColumns.map((col, index) => /* @__PURE__ */ jsx(
            "th",
            {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index),
              onDragOver: (e) => handleDragOver(e),
              onDrop: (e) => handleDrop(e, index),
              onClick: () => col.key !== "actions" && handleSort(col.key),
              className: `
                                            p-4 text-xs font-bold text-ink-muted uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-interactive-hover transition-colors
                                            ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-brand-500" : ""}
                                        `,
              style: { width: col.width },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                col.label,
                col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-brand-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-brand-500" }))
              ] })
            },
            col.key
          )) }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line bg-surface", children: sortedPurchases.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "text-ink-muted" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink-secondary mb-1", children: "No purchases found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-4", children: "Record your first purchase to get started" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.purchases.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2",
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
                                            hover:bg-interactive-hover transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-brand-500
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-brand-500 ring-inset bg-brand-50/30 dark:bg-brand-900/20" : ""}
                                        `,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-ink-secondary", children: (() => {
                switch (col.key) {
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.date || row.created_at) });
                  case "invoice_number":
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-mono text-brand-600 dark:text-brand-400 font-semibold", children: row.invoice_number || row.reference_number || "-" }),
                      vensynq_enabled && row.is_jit && row.approval_status === "draft" && /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wide", children: "JIT Draft" })
                    ] });
                  case "supplier_name":
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: row.supplier?.name || tt("Unknown Supplier") }),
                      row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: row.supplier.phone })
                    ] });
                  case "transaction":
                    return /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded-md", children: "Purchase" });
                  case "payment_method":
                    return /* @__PURE__ */ jsx("span", { className: "uppercase text-xs font-semibold", children: row.payment_method || "-" });
                  case "total":
                    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: renderCurrency(row.subtotal || row.total) }),
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
                      /* @__PURE__ */ jsxs("span", { className: "text-xs text-ink-muted", children: [
                        "Paid: ",
                        /* @__PURE__ */ jsx("span", { className: "text-emerald-600 font-semibold", children: renderCurrency(paid) })
                      ] }),
                      balance > 1 ? /* @__PURE__ */ jsxs("span", { className: "text-rose-600 font-bold", children: [
                        "Due: ",
                        renderCurrency(balance)
                      ] }) : /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full w-fit", children: "Settled" })
                    ] });
                  }
                  case "status": {
                    let paymentStatus = row.payment_status || "unpaid";
                    const isJitDraft2 = row.is_jit === 1 && row.approval_status === "draft" && vensynq_enabled;
                    const statusStyles = {
                      paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                      partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                      unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                    };
                    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-2xs font-bold uppercase w-fit ${statusStyles[paymentStatus] || "bg-sunken text-ink-secondary"}`, children: paymentStatus }),
                      isJitDraft2 && /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded-md text-2xs font-bold uppercase w-fit bg-amber-500/20 text-amber-500 border border-amber-500/30", children: "JIT Draft (Unapproved)" })
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
                      }, className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-brand-600 bg-interactive-hover" : "text-ink-muted hover:bg-interactive-hover"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                        activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                          /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.show", { store_slug: store?.slug, purchase: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary", children: [
                            /* @__PURE__ */ jsx(Eye, { size: 14 }),
                            " View Details"
                          ] }),
                          /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.edit", { store_slug: store?.slug, purchase: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary", children: [
                            /* @__PURE__ */ jsx(Edit, { size: 14 }),
                            " Edit Purchase"
                          ] }),
                          ["pending", "partial"].includes(row.workflow_status) && /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.receive", { store_slug: store?.slug, purchase: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-emerald-600", children: [
                            /* @__PURE__ */ jsx(CheckSquare, { size: 14 }),
                            " Receive Goods"
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "h-px bg-line my-1" }),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: (e) => {
                                e.stopPropagation();
                                handleDeleteClick(row.id);
                              },
                              className: "w-full text-left px-3 py-2 hover:bg-rose-500/10 rounded flex items-center gap-2 text-sm text-rose-600",
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
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedPurchases.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line", children: [
          /* @__PURE__ */ jsx(ShoppingBag, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No purchases found" })
        ] }) : sortedPurchases.map((row) => {
          const paid = parseFloat(row.paid || 0);
          const total = parseFloat(row.total || 0);
          const balance = row.balance ?? total - paid;
          let paymentStatus = row.payment_status || "unpaid";
          const isJitDraft = row.is_jit === 1 && row.approval_status === "draft" && vensynq_enabled;
          const statusStyles = {
            paid: "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20",
            partial: "bg-amber-100/50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-500/20",
            unpaid: "bg-rose-100/50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20"
          };
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleRowClick(row),
              className: `
                                            p-3 bg-surface rounded-xl border border-line shadow-sm flex flex-col gap-2 relative cursor-pointer hover:border-brand-500 transition-colors
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-brand-500 ring-inset bg-brand-50/20 dark:bg-brand-900/10" : ""}
                                        `,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-ink text-sm", children: row.supplier?.name || tt("Unknown Supplier") }),
                    row.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-semibold", children: row.supplier.phone })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold text-brand-600 dark:text-brand-400 block", children: row.invoice_number || row.reference_number || "-" }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-semibold block mt-0.5", children: formatDate(row.date || row.created_at) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold uppercase bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-0.5 rounded border border-orange-200/30", children: "Purchase" }),
                  isJitDraft && /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold bg-amber-50 border border-amber-200/50 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded uppercase tracking-wide", children: "JIT Draft" }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-3xs font-bold uppercase ${statusStyles[paymentStatus] || "bg-sunken text-ink-secondary"}`, children: paymentStatus })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-line pt-2 mt-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Total" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-ink", children: renderCurrency(total) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted font-bold uppercase block tracking-wider", children: "Balance" }),
                      balance > 1 ? /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-rose-600", children: renderCurrency(balance) }) : /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10", children: "Settled" })
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
                        className: "px-2 py-1 bg-amber-500 text-white text-2xs font-bold rounded flex items-center gap-1 shadow-sm",
                        title: "Approve JIT Auto-Draft",
                        children: "Approve"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => PrintService.quickPrint(row),
                        className: "p-1.5 hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors",
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
                          className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-brand-600 bg-interactive-hover" : "text-ink-muted hover:bg-interactive-hover"}`,
                          children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                        }
                      ),
                      activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 bottom-full mb-2 w-56 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                        /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.show", { store_slug: store?.slug, purchase: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary", children: [
                          /* @__PURE__ */ jsx(Eye, { size: 14 }),
                          " View Details"
                        ] }),
                        /* @__PURE__ */ jsxs(Link, { href: route("store.purchases.edit", { store_slug: store?.slug, purchase: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded flex items-center gap-2 text-sm text-ink-secondary", children: [
                          /* @__PURE__ */ jsx(Edit, { size: 14 }),
                          " Edit Purchase"
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "h-px bg-line my-1" }),
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              handleDeleteClick(row.id);
                            },
                            className: "w-full text-left px-3 py-2 hover:bg-rose-500/10 rounded flex items-center gap-2 text-sm text-rose-600",
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
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "mt-4 p-4 text-center text-ink-muted text-sm opacity-0 h-4", children: nextPageUrl ? "Loading..." : "" })
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
    quickViewItem && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-normal", onClick: () => setQuickViewItem(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-line bg-sunken shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Purchase Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-brand-600 dark:text-brand-400", children: quickViewItem.invoice_number || quickViewItem.reference_number })
              ] }),
              (() => {
                const statusStyles = {
                  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  partial: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  unpaid: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                };
                const ps = quickViewItem.payment_status || "unpaid";
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[ps] || "bg-sunken text-ink-secondary"}`, children: ps });
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
                  href: route("store.purchases.show", { store_slug: store?.slug, purchase: quickViewItem.id }),
                  className: "px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1",
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
                  className: "p-2 hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-3 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-sunken p-3 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: tt("Supplier") }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm", children: quickViewItem.supplier?.name || "Unknown" }),
                quickViewItem.supplier?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: quickViewItem.supplier.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-sunken p-3 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: "Date" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm", children: formatDate(quickViewItem.date || quickViewItem.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-sunken p-3 rounded-xl border border-line", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: "Payment" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm uppercase", children: quickViewItem.payment_method || "Cash" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-brand-500/10 p-3 rounded-xl border border-brand-500/20", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-brand-600 dark:text-brand-400 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-600 dark:text-brand-400 text-lg", children: renderCurrency(quickViewItem.total) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-line rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-sunken px-4 py-2 border-b border-line", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-ink uppercase", children: [
                "Items in this Purchase (",
                quickViewItem.items?.length || 0,
                ")"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-sunken border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-ink-muted uppercase", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-ink-muted uppercase", children: "Item Name" }),
                  /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-ink-muted uppercase", children: "Qty" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-ink-muted uppercase", children: "Rate" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-ink-muted uppercase", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line bg-surface", children: quickViewItem.items && quickViewItem.items.length > 0 ? quickViewItem.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover transition-colors", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-ink-muted font-mono text-xs", children: idx + 1 }),
                  /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: item.product?.name || item.name || "Unknown Item" }),
                    item.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-mono", children: item.product.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-ink", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-ink-secondary", children: renderCurrency(item.price || item.unit_price || 0) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-ink", children: renderCurrency(item.quantity * (item.price || item.unit_price || 0)) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-ink-muted", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-sunken px-4 py-3 border-t border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink", children: renderCurrency(quickViewItem.subtotal || quickViewItem.total) })
                ] }),
                quickViewItem.extras > 0 && /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-amber-600 uppercase", children: "Extras" }),
                  /* @__PURE__ */ jsxs("p", { className: "font-bold text-amber-600", children: [
                    "+",
                    renderCurrency(quickViewItem.extras)
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-line pl-6", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase", children: "Paid" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-600", children: renderCurrency(quickViewItem.paid || 0) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase", children: "Balance" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-rose-600", children: renderCurrency(quickViewItem.balance ?? (quickViewItem.total || 0) - (quickViewItem.paid || 0)) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-line pl-6", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-600 dark:text-brand-400 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-brand-600 dark:text-brand-400", children: renderCurrency(quickViewItem.total) })
                ] })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-line bg-sunken text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
            "Double-click row to view details • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-app rounded text-ink-secondary font-mono border border-line", children: "Esc" }),
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
