import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { ChevronDown, FileText, CheckSquare, Clock, History, Plus, FileSpreadsheet, Printer, Search, ChevronUp, CornerUpRight, Mail, MessageCircle, MoreVertical, Eye, ShoppingCart, Copy, Trash2, Edit, X, RefreshCcw } from "lucide-react";
import { S as SellModuleTabs } from "./SellModuleTabs-C4il-xpk.js";
import { S as SmartCombobox } from "./SmartCombobox-D6m7UWTk.js";
import "axios";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "driver.js";
import "use-debounce";
function ProposalsList({ proposals = [], filters = {}, stats = {} }) {
  const { store } = usePage().props;
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
    { key: "party_name", label: "Customer", width: "18%" },
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
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-full lg:h-full bg-slate-50 dark:bg-slate-950 p-1 md:p-2 gap-1 lg:overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "proposals" }),
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
              "Proposal: ",
              stats?.total_count || sortedData.length
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
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
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 dark:text-slate-700", children: "|" }),
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600", children: [
              "Value: ",
              formatCurrency(stats?.total_value || 0, store)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0 ${isStatsExpanded ? "grid" : "hidden md:grid"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Proposals" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.total_count || sortedData.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckSquare, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Accepted" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats?.accepted_count || 0 })
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
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: formatCurrency(stats?.total_value || 0, store) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Proposals / ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Quotations" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveFilter("all");
                applyFilters({ filter: "all" });
              },
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
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
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
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
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "accepted" ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Accepted"
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
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2", children: [
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-bold hidden sm:inline", children: "New Proposal" })
                ]
              }
            ),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600", title: "Export", children: /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }) }),
            /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500", title: "Print", onClick: () => window.print(), children: /* @__PURE__ */ jsx(Printer, { size: 18 }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight", children: "Proposals" }),
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
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors",
                title: "New Proposal",
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
              placeholder: "Search proposals...",
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
              onClick: () => applyFilterType("pending"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilterType("accepted"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "accepted" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`,
              children: "Accepted"
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
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No proposals found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Create your first proposal to get started" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.proposals.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
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
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            border-l-4 border-transparent hover:border-indigo-400
                                            ${quickViewItem?.id === row.id ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                        `,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
                switch (col.key) {
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                  case "reference":
                    return /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.proposal_number || `PROP-${row.id}` });
                  case "party_name":
                    return /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: row.customer?.name || "Walk-in" }),
                      row.customer?.phone && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: row.customer.phone })
                    ] });
                  case "items":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold", children: row.items?.length || 0 });
                  case "amount":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.total, store) });
                  case "valid_until":
                    const isExpired = row.valid_until && new Date(row.valid_until) < /* @__PURE__ */ new Date();
                    return /* @__PURE__ */ jsx("span", { className: isExpired ? "text-red-500" : "text-slate-500", children: formatDate(row.valid_until) });
                  case "status":
                    const statusStyles = {
                      pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                      accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                      rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
                      expired: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400",
                      converted: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    };
                    return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${statusStyles[row.status] || "bg-slate-100 text-slate-700"}`, children: row.status || "pending" });
                  case "actions":
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2 relative", onClick: (e) => e.stopPropagation(), children: [
                      /* @__PURE__ */ jsx("a", { href: route("store.proposals.print", { store_slug: store?.slug, proposal: row.id }), target: "_blank", className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors", children: /* @__PURE__ */ jsx(Printer, { size: 16 }) }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveSharePopup(activeSharePopup === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeSharePopup === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(CornerUpRight, { size: 16 }) }),
                        activeSharePopup === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in zoom-in-95", children: [
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                            /* @__PURE__ */ jsx(Mail, { size: 14, className: "text-red-500" }),
                            " Email"
                          ] }),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm", children: [
                            /* @__PURE__ */ jsx(MessageCircle, { size: 14, className: "text-green-500" }),
                            " WhatsApp"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                        /* @__PURE__ */ jsx("button", { onClick: (e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                        }, className: `p-1.5 rounded-lg transition-colors ${activeActionMenu === row.id ? "text-indigo-600 bg-slate-100" : "text-slate-500 hover:bg-slate-100"}`, children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }),
                        activeActionMenu === row.id && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95", children: /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                          /* @__PURE__ */ jsxs(Link, { href: route("store.proposals.show", { store_slug: store?.slug, proposal: row.id }), className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                            /* @__PURE__ */ jsx(Eye, { size: 14 }),
                            " View"
                          ] }),
                          row.status !== "converted" && /* @__PURE__ */ jsxs("button", { onClick: () => handleConvertToSale(row.id), className: "w-full text-left px-3 py-2 hover:bg-emerald-50 rounded dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm text-emerald-600", children: [
                            /* @__PURE__ */ jsx(ShoppingCart, { size: 14 }),
                            " Convert to Sale"
                          ] }),
                          /* @__PURE__ */ jsxs("button", { className: "w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300", children: [
                            /* @__PURE__ */ jsx(Copy, { size: 14 }),
                            " Duplicate"
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
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
        /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2 px-0 py-1.5 bg-transparent", children: sortedData.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx(FileText, { size: 32, className: "mx-auto text-slate-400 mb-2" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-350", children: "No proposals found" })
        ] }) : sortedData.map((row) => {
          const isExpired = row.valid_until && new Date(row.valid_until) < /* @__PURE__ */ new Date();
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => handleRowClick(row),
              className: "bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 active:scale-[0.99] transition-transform cursor-pointer",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold", children: row.proposal_number || `PROP-${row.id}` }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 mt-0.5", children: formatDate(row.created_at) })
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                                ${row.status === "accepted" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : row.status === "converted" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : row.status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}
                                            `, children: row.status || "pending" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Customer" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-800 dark:text-white mt-0.5", children: row.customer?.name || "Walk-in" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider", children: "Total Value" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-slate-900 dark:text-white mt-0.5", children: formatCurrency(row.total, store) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs", children: [
                  /* @__PURE__ */ jsxs("div", { className: isExpired ? "text-red-500 font-bold" : "text-slate-500", children: [
                    "Valid Until: ",
                    formatDate(row.valid_until) || "No expiry"
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsx(
                      "a",
                      {
                        href: route("store.proposals.print", { store_slug: store?.slug, proposal: row.id }),
                        target: "_blank",
                        className: "p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-100 dark:border-slate-700",
                        children: /* @__PURE__ */ jsx(Printer, { size: 14 })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.proposals.show", { store_slug: store?.slug, proposal: row.id }),
                        className: "px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors",
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
    quickViewItem && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200", onClick: () => setQuickViewItem(null), children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "quick-view-modal w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
        onClick: (e) => e.stopPropagation(),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider", children: "Proposal Preview" }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-indigo-600", children: quickViewItem.proposal_number || `PROP-${quickViewItem.id}` })
              ] }),
              (() => {
                const statusStyles = {
                  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                };
                return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[quickViewItem.status] || "bg-slate-100 text-slate-700"}`, children: quickViewItem.status || "pending" });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: route("store.proposals.print", { store_slug: store?.slug, proposal: quickViewItem.id }),
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
                  href: route("store.proposals.show", { store_slug: store?.slug, proposal: quickViewItem.id }),
                  className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
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
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Date Created" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: formatDate(quickViewItem.created_at) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase mb-1", children: "Valid Until" }),
                /* @__PURE__ */ jsx("p", { className: `font-bold text-sm ${quickViewItem.valid_until && new Date(quickViewItem.valid_until) < /* @__PURE__ */ new Date() ? "text-red-600" : "text-slate-800 dark:text-white"}`, children: formatDate(quickViewItem.valid_until) || "No expiry" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800", children: [
                /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-indigo-600 uppercase mb-1", children: "Total" }),
                /* @__PURE__ */ jsx("p", { className: "font-black text-indigo-600 text-lg", children: formatCurrency(quickViewItem.total, store) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-600 dark:text-slate-300 uppercase", children: [
                "Items in this Proposal (",
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
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-slate-600 dark:text-slate-400", children: formatCurrency(item.price || item.unit_price || 0, store) }),
                  /* @__PURE__ */ jsx("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: formatCurrency(item.quantity * (item.price || item.unit_price || 0), store) })
                ] }, idx)) : /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-slate-400", children: "No items data available" }) }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 uppercase", children: "Subtotal" }),
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-300", children: formatCurrency(quickViewItem.subtotal || quickViewItem.total, store) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-right border-l border-slate-200 dark:border-slate-700 pl-8", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-600 uppercase font-bold", children: "Grand Total" }),
                  /* @__PURE__ */ jsx("p", { className: "font-black text-lg text-indigo-600", children: formatCurrency(quickViewItem.total, store) })
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
          /* @__PURE__ */ jsx("div", { className: "p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center shrink-0", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400", children: [
            "Double-click row to view/edit • Press ",
            /* @__PURE__ */ jsx("kbd", { className: "px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-mono", children: "Esc" }),
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
