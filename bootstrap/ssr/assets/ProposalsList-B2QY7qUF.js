import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { f as formatCurrency } from "./format-131Nyq79.js";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { ChevronDown, FileText, CheckSquare, Clock, History, Plus, FileSpreadsheet, Printer, Search, ChevronUp, CornerUpRight, Mail, MessageCircle, MoreVertical, Eye, ShoppingCart, Wrench, Copy, Trash2, Edit, X, RefreshCcw } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-C_2BbRa0.js";
import { S as SmartCombobox } from "./SmartCombobox-DfdFIseQ.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
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
import "use-debounce";
function ProposalsList({ proposals = [], filters = {}, stats = {} }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const resolveData = () => {
    if (!proposals) return [];
    if (Array.isArray(proposals)) return proposals;
    if (proposals.data && Array.isArray(proposals.data)) return proposals.data;
    return [];
  };
  const defaultData = resolveData();
  const [sortedData, setSortedData] = useState(defaultData);
  const safeFilters = filters && !Array.isArray(filters) ? filters : {};
  const [searchTerm, setSearchTerm] = useState(safeFilters.search || "");
  const [activeFilter, setActiveFilter] = useState(safeFilters.filter || "all");
  const [dateRange, setDateRange] = useState({
    from: safeFilters.from_date || "",
    to: safeFilters.to_date || ""
  });
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "12%" },
    { key: "reference", label: "Proposal No", width: "15%" },
    { key: "party_name", label: tt("Customer"), width: "18%" },
    { key: "items", label: "Items", width: "8%" },
    { key: "amount", label: "Amount", width: "12%" },
    { key: "valid_until", label: "Valid Until", width: "10%" },
    { key: "status", label: "Status", width: "10%" },
    { key: "actions", label: "Actions", width: "15%", frozen: true }
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
  useEffect(() => {
    setSortedData(defaultData);
  }, [proposals]);
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
      router.visit(route("store.proposals.show", { store_slug: store?.slug, proposal: row.id }));
    } else {
      const timeout = setTimeout(() => {
        setQuickViewItem(row);
        setClickTimeout(null);
      }, 250);
      setClickTimeout(timeout);
    }
  }, [clickTimeout]);
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term) {
      setSortedData(defaultData);
    } else {
      const lower = term.toLowerCase();
      const filtered = defaultData.filter(
        (item) => item.proposal_number?.toLowerCase().includes(lower) || item.customer?.name?.toLowerCase().includes(lower) || String(item.total).includes(lower)
      );
      setSortedData(filtered);
    }
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
      applyFilters({ from_date: newRange.from, to_date: newRange.to });
    }
  };
  const applyFilters = (newParams) => {
    router.get(route("store.proposals.index", { store_slug: store?.slug }), {
      search: searchTerm,
      filter: activeFilter,
      from_date: dateRange.from,
      to_date: dateRange.to,
      ...newParams
    }, { preserveState: true });
  };
  const applyFilterType = (type) => {
    setActiveFilter(type);
    applyFilters({ filter: type });
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...sortedData].sort((a, b) => {
      const valA = resolveValue(a, key);
      const valB = resolveValue(b, key);
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setSortedData(sorted);
  };
  function resolveValue(item, key) {
    switch (key) {
      case "date":
        return item.created_at;
      case "reference":
        return item.proposal_number;
      case "party_name":
        return item.customer?.name || "Walk-in";
      case "amount":
        return parseFloat(item.total || 0);
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
  const handleConvertToSale = async (id) => {
    if (await confirm("Convert this proposal to a sale?")) {
      router.post(route("store.proposals.convert", { store_slug: store?.slug, proposal: id }));
    }
  };
  const handleDelete = async (id) => {
    if (await confirm("Are you sure you want to delete this proposal?")) {
      router.delete(route("store.proposals.destroy", { store_slug: store?.slug, proposal: id }));
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Proposals", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Proposals" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-app p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "proposals" }),
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
              "Proposal: ",
              stats?.total_count || sortedData.length
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-emerald-600", children: [
              "Accepted: ",
              stats?.accepted_count || 0
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-amber-600", children: [
              "Pending: ",
              stats?.pending_count || 0
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-300 dark:text-ink-secondary", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600", children: [
              "Value: ",
              formatCurrency(stats?.total_value || 0, store)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Proposals" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: stats?.total_count || sortedData.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Accepted" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-emerald-600", children: stats?.accepted_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Pending" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-amber-600", children: stats?.pending_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface px-3 py-2 rounded-xl border border-line shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(History, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase", children: "Total Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-ink", children: formatCurrency(stats?.total_value || 0, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-bold text-ink uppercase tracking-tight shrink-0", children: [
            "Proposals / ",
            /* @__PURE__ */ jsx("span", { className: "text-brand-600", children: "Quotations" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-sunken mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                applyFilters({ filter: "all" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("pending");
                applyFilters({ filter: "pending" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-amber-500 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("accepted");
                applyFilters({ filter: "accepted" });
              },
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "accepted" ? "bg-emerald-500 text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
              children: "Accepted"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("custom"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "custom" ? "bg-gradient-brand text-white" : "bg-sunken text-ink-muted hover:bg-interactive-hover"}`,
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
                className: "px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500"
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
                className: "px-2 py-0.5 text-xs font-semibold bg-app border border-line dark:border-line rounded-md text-ink-secondary dark:text-ink focus:ring-1 focus:ring-brand-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-52", children: /* @__PURE__ */ jsx(
            SmartCombobox,
            {
              items: defaultData,
              value: searchTerm,
              onQueryChange: (val) => {
                setSearchTerm(val);
                if (!val) {
                  setSortedData(defaultData);
                } else {
                  const lower = val.toLowerCase();
                  const filtered = defaultData.filter(
                    (item) => (item.proposal_number?.toLowerCase() || "").includes(lower) || (item.customer?.name?.toLowerCase() || "").includes(lower)
                  );
                  setSortedData(filtered);
                }
              },
              onSelect: (item) => {
                setSearchTerm(item.proposal_number);
                setSortedData([item]);
              },
              placeholder: "Search...",
              displayKey: "proposal_number",
              filterKey: "proposal_number"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-line pl-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Proposal" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-surface px-3 py-2 rounded-xl border border-line shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-bold text-ink uppercase tracking-tight", children: "Proposals" }),
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
                children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 })
              }
            ),
            /* @__PURE__ */ jsx(
              Link,
              {
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "p-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors",
                title: "New Proposal",
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
              placeholder: "Search proposals...",
              className: "w-full pl-9 pr-4 py-1.5 text-sm bg-app border border-line rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
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
              onClick: () => applyFilterType("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("accepted"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "accepted" ? "bg-emerald-600 text-white" : "bg-sunken text-ink-muted"}`,
              children: "Accepted"
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
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: sortedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-sunken rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { size: 32, className: "text-ink-muted" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-ink-secondary mb-1", children: "No proposals found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mb-4", children: "Create your first proposal to get started" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " Create First Proposal"
                ]
              }
            )
          ] }) }) }) : sortedData.map((row) => /* @__PURE__ */ jsx(
            "tr",
            {
              onClick: () => handleRowClick(row),
              className: `
 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer
 border-l-4 border-transparent hover:border-brand-400
 ${quickViewItem?.id === row.id ? "ring-2 ring-brand-500 ring-inset bg-brand-50 dark:bg-brand-900/20" : ""}
`,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-ink-secondary", children: (() => {
                switch (col.key) {
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                  case "reference":
                    return /* @__PURE__ */ jsx("span", { className: "font-mono text-brand-600 dark:text-brand-400 font-semibold", children: row.proposal_number || `PROP-${row.id}` });
                  case "party_name":
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.customer?.name || "Walk-in" }),
                      row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: row.customer.phone })
                    ] });
                  case "items":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold", children: row.items?.length || 0 });
                  case "amount":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.total, store) });
                  case "valid_until":
                    const isExpired = row.valid_until && new Date(row.valid_until) < /* @__PURE__ */ new Date();
                    return /* @__PURE__ */ jsx("span", { className: isExpired ? "text-red-500" : "text-ink-muted", children: formatDate(row.valid_until) });
                  case "status":
                    const statusStyles = {
                      pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                      accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                      rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                      expired: "bg-neutral-100 text-ink-secondary dark:bg-neutral-500/20 dark:text-ink-muted",
                      converted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    };
                    return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[row.status] || "bg-sunken text-ink-secondary"}`, children: row.status || "pending" });
                  case "actions":
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 relative", onClick: (e) => e.stopPropagation(), children: [
                      /* @__PURE__ */ jsx("a", { href: route("store.proposals.print", { store_slug: store?.slug, proposal: row.id }), target: "_blank", className: "p-1.5 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted hover:text-brand-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveSharePopup(activeSharePopup === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? "text-brand-600 bg-sunken" : "text-ink-muted hover:bg-interactive-hover"}`, children: /* @__PURE__ */ jsx(CornerUpRight, { size: 16 }) }),
                        activeSharePopup === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-40 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95", children: [
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm", children: [
                            /* @__PURE__ */ jsx(Mail, { size: 14, className: "text-red-500" }),
                            " Email"
                          ] }),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm", children: [
                            /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-green-500" }),
                            " WhatsApp"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-brand-600 bg-sunken" : "text-ink-muted hover:bg-interactive-hover"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                        activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                          /* @__PURE__ */ jsxs(Link, { href: route("store.proposals.show", { store_slug: store?.slug, proposal: row.id }), className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary", children: [
                            /* @__PURE__ */ jsx(Eye, { size: 14 }),
                            " View"
                          ] }),
                          row.status !== "converted" && /* @__PURE__ */ jsxs("button", { onClick: () => handleConvertToSale(row.id), className: "w-full text-left px-3 py-2 hover:bg-emerald-50 rounded dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm text-emerald-600", children: [
                            /* @__PURE__ */ jsx(ShoppingCart, { size: 14 }),
                            " Convert to Sale"
                          ] }),
                          /* @__PURE__ */ jsxs(
                            Link,
                            {
                              href: route("store.service-jobs.create", {
                                store_slug: store?.slug,
                                party_id: row.customer_id || row.party_id,
                                title: `Work Order for Quote #${row.proposal_number || row.id}`,
                                estimated_total: row.total || ""
                              }),
                              className: "w-full text-left px-3 py-2 hover:bg-amber-50 rounded dark:hover:bg-amber-900/20 flex items-center gap-2 text-sm text-amber-600 font-medium",
                              children: [
                                /* @__PURE__ */ jsx(Wrench, { size: 14 }),
                                " ",
                                tt("Book as Service Job")
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary", children: [
                            /* @__PURE__ */ jsx(Copy, { size: 14 }),
                            " Duplicate"
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken my-1" }),
                          /* @__PURE__ */ jsxs("button", { onClick: () => handleDelete(row.id), className: "w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600", children: [
                            /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                            " Delete"
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
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedData.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-xl p-8 text-center border border-line", children: [
          /* @__PURE__ */ jsx(FileText, { size: 32, className: "mx-auto text-ink-muted mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary", children: "No proposals found" })
        ] }) : sortedData.map((row) => {
          const isExpired = row.valid_until && new Date(row.valid_until) < /* @__PURE__ */ new Date();
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleRowClick(row),
              className: "bg-surface p-4 rounded-xl border border-line shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-brand-600 dark:text-brand-400 font-bold", children: row.proposal_number || `PROP-${row.id}` }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: formatDate(row.created_at) })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider
 ${row.status === "accepted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : row.status === "converted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : row.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
`, children: row.status || "pending" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-line py-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: tt("Customer") }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink mt-0.5", children: row.customer?.name || "Walk-in" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Total Value" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink mt-0.5", children: formatCurrency(row.total, store) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                  /* @__PURE__ */ jsxs("div", { className: isExpired ? "text-red-500 font-bold" : "text-ink-muted", children: [
                    "Valid Until: ",
                    formatDate(row.valid_until) || "No expiry"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: route("store.proposals.print", { store_slug: store?.slug, proposal: row.id }),
                        target: "_blank",
                        className: "p-1.5 bg-app rounded-lg text-ink-muted hover:text-brand-600 transition-colors border border-line",
                        children: /* @__PURE__ */ jsx(Printer, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.proposals.show", { store_slug: store?.slug, proposal: row.id }),
                        className: "px-3 py-1.5 bg-app border border-line rounded-lg font-bold text-ink-secondary hover:bg-interactive-hover transition-colors",
                        children: "View"
                      }
                    )
                  ] })
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
        className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-line bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-800 dark:to-neutral-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-ink-muted uppercase tracking-wider", children: "Proposal Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-brand-600", children: quickViewItem.proposal_number || `PROP-${quickViewItem.id}` })
              ] }),
              (() => {
                const statusStyles = {
                  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                };
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${statusStyles[quickViewItem.status] || "bg-sunken text-ink-secondary"}`, children: quickViewItem.status || "pending" });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: route("store.proposals.print", { store_slug: store?.slug, proposal: quickViewItem.id }),
                  target: "_blank",
                  className: "px-3 py-1.5 bg-sunken text-ink-secondary text-xs font-bold rounded-lg hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Printer, { size: 14 }),
                    " Print"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("store.proposals.show", { store_slug: store?.slug, proposal: quickViewItem.id }),
                  className: "px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { size: 14 }),
                    " Edit Proposal"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuickViewItem(null),
                  className: "p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-ink-muted transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-3 mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: tt("Customer") }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm", children: quickViewItem.customer?.name || "Walk-in" }),
                quickViewItem.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: quickViewItem.customer.phone })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: "Date Created" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink text-sm", children: formatDate(quickViewItem.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-ink-muted uppercase mb-1", children: "Valid Until" }),
                /* @__PURE__ */ jsx("p", { className: `font-bold text-sm ${quickViewItem.valid_until && new Date(quickViewItem.valid_until) < /* @__PURE__ */ new Date() ? "text-red-600" : "text-ink"}`, children: formatDate(quickViewItem.valid_until) || "No expiry" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-brand-100 dark:bg-brand-900/30 p-3 rounded-xl border border-brand-200 dark:border-brand-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-brand-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-600 text-lg", children: formatCurrency(quickViewItem.total, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-line rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-app px-4 py-2 border-b border-line", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-ink-secondary uppercase", children: [
                "Items in this Proposal (",
                quickViewItem.items?.length || 0,
                ")"
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "max-h-[300px] overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-surface border-b border-line", children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-ink-muted uppercase", children: "#" }),
                  /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-ink-muted uppercase", children: "Item Name" }),
                  /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-ink-muted uppercase", children: "Qty" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-ink-muted uppercase", children: "Rate" }),
                  /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-ink-muted uppercase", children: "Total" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: quickViewItem.items && quickViewItem.items.length > 0 ? quickViewItem.items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-ink-muted font-mono text-xs", children: idx + 1 }),
                  /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-ink", children: item.product?.name || item.name || "Unknown Item" }),
                    item.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted font-mono", children: item.product.sku })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-ink-secondary", children: item.quantity }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-ink-secondary", children: formatCurrency(item.price || item.unit_price || 0, store) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-ink", children: formatCurrency(item.quantity * (item.price || item.unit_price || 0), store) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-ink-muted", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-app px-4 py-3 border-t border-line", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted uppercase", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary", children: formatCurrency(quickViewItem.subtotal || quickViewItem.total, store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-line pl-8", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-600 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-lg text-brand-600", children: formatCurrency(quickViewItem.total, store) })
                ] })
              ] }) })
            ] }),
            quickViewItem.status !== "converted" && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    setQuickViewItem(null);
                    handleConvertToSale(quickViewItem.id);
                  },
                  className: "px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(ShoppingCart, { size: 16 }),
                    " Convert to Sale"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                  },
                  className: "px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(RefreshCcw, { size: 16 }),
                    " Convert to Pre-Sale"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-line bg-app text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
            "Double-click row to view/edit • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-sunken rounded text-ink-secondary font-mono", children: "Esc" }),
            " to close"
          ] }) })
        ]
      }
    ) })
  ] });
}
export {
  ProposalsList as default
};
