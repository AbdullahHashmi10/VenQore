import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { S as StockModuleTabs } from "./StockModuleTabs-n32iv0yk.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { S as SmartCombobox } from "./SmartCombobox-D6m7UWTk.js";
import { Play, CheckCircle, Factory, Package, Plus, ChevronUp, ChevronDown, Edit } from "lucide-react";
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
function ProductionRunsIndex({ productionRuns = {}, stats = {}, filters = {} }) {
  const { store } = usePage().props;
  const [allRuns, setAllRuns] = useState(productionRuns.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(productionRuns.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (productionRuns.data && productionRuns.current_page === 1) {
      setAllRuns(productionRuns.data);
      setNextPageUrl(productionRuns.next_page_url);
    }
  }, [productionRuns]);
  const [searchTerm, setSearchTerm] = useState(typeof filters?.search === "string" ? filters.search : "");
  const [activeFilter, setActiveFilter] = useState(typeof filters?.filter === "string" ? filters.filter : "all");
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, {
        params: { search: searchTerm, filter: activeFilter },
        headers: { "Accept": "application/json" }
      });
      const newItems = response.data.data || [];
      setAllRuns((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error("Failed to load more runs:", error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl, searchTerm, activeFilter]);
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
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [tableColumns, setTableColumns] = useState([
    { key: "run_number", label: "Run #", width: "10%" },
    { key: "date", label: "Date", width: "12%" },
    { key: "product", label: "Product", width: "25%" },
    { key: "quantity", label: "Quantity", width: "12%" },
    { key: "status", label: "Status", width: "12%" },
    { key: "ingredients", label: "Ingredients", width: "12%" },
    { key: "cost", label: "Total Cost", width: "12%" },
    { key: "actions", label: "Actions", width: "5%", frozen: true }
  ]);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
  const applyServerFilters = (newParams) => {
    router.get(route("store.production.index", { store_slug: store?.slug }), {
      search: searchTerm,
      filter: activeFilter,
      ...newParams
    }, { preserveState: true, preserveScroll: true });
  };
  const handleSearch = (term) => {
    setSearchTerm(term);
  };
  const handleServerSearch = (item) => {
    const val = item ? item.run_number || item.product?.name : searchTerm;
    applyServerFilters({ search: val });
  };
  const applyFilter = (type) => {
    setActiveFilter(type);
    applyServerFilters({ filter: type });
  };
  const sortedData = (() => {
    let items = [...allRuns];
    return items.sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === "product") {
        valA = a.product?.name;
        valB = b.product?.name;
      }
      if (sortConfig.key === "date") {
        valA = a.created_at;
        valB = b.created_at;
      }
      if (sortConfig.key === "ingredients") {
        valA = a.ingredients_used;
        valB = b.ingredients_used;
      }
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  })();
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
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
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Production Runs", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Production Runs" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "production" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(Play, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Active Runs" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.in_progress || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Completed Today" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats.completed_today || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg", children: /* @__PURE__ */ jsx(Factory, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Runs" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.month_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Cost (Month)" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-indigo-600", children: formatCurrency(stats.month_cost) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Factory, { size: 20, className: "text-indigo-600" }),
            "Production ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Runs" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("all"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("today"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "today" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Today"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("active"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "active" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "In Progress"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("failed"),
              className: `px-2.5 py-1 text-[10px] font-bold uppercase rounded-full transition-all ${activeFilter === "failed" ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Failed"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-52", children: /* @__PURE__ */ jsx(
            SmartCombobox,
            {
              items: allRuns,
              value: searchTerm,
              onQueryChange: handleSearch,
              onSelect: handleServerSearch,
              onKeyDown: (e) => e.key === "Enter" && handleServerSearch(),
              placeholder: "Search run or product...",
              displayKey: "run_number",
              filterKey: "run_number",
              inputClassName: "py-1.5 text-xs h-9"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: /* @__PURE__ */ jsxs(Link, { href: route("store.production.create", { store_slug: store?.slug }), className: "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors", children: [
            /* @__PURE__ */ jsx(Plus, { size: 14 }),
            " New Run"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
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
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Factory, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No production runs found" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Start manufacturing by creating your first production run" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.production.create", { store_slug: store?.slug }),
                className: "px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 16 }),
                  " New Production Run"
                ]
              }
            )
          ] }) }) }) : sortedData.map((row) => /* @__PURE__ */ jsx(
            "tr",
            {
              onClick: () => router.visit(route("store.production.show", { store_slug: store?.slug, run: row.id })),
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${row.status === "in_progress" ? "bg-blue-50/30 dark:bg-blue-900/5" : ""}
                                        `,
              children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
                switch (col.key) {
                  case "run_number":
                    return /* @__PURE__ */ jsx("span", { className: "font-mono text-indigo-600 dark:text-indigo-400 font-semibold", children: row.run_number });
                  case "date":
                    return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                  case "product":
                    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: row.product?.name || "Unknown" }),
                        /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-mono", children: row.product?.sku })
                      ] })
                    ] });
                  case "quantity":
                    return /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
                      row.quantity,
                      " ",
                      row.product?.unit
                    ] });
                  case "status":
                    const statuses = {
                      pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
                      in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
                      completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
                      failed: { label: "Failed", color: "bg-red-100 text-red-700" }
                    };
                    const s = statuses[row.status] || statuses.pending;
                    return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${s.color}`, children: s.label });
                  case "ingredients":
                    return /* @__PURE__ */ jsxs("span", { className: "text-slate-500", children: [
                      row.ingredients_used || 0,
                      " items"
                    ] });
                  case "cost":
                    return /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 dark:text-white", children: formatCurrency(row.cost) });
                  case "actions":
                    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2", children: /* @__PURE__ */ jsx(
                      Link,
                      {
                        href: route("store.production.edit", { store_slug: store?.slug, run: row.id }),
                        className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors",
                        onClick: (e) => e.stopPropagation(),
                        children: /* @__PURE__ */ jsx(Edit, { size: 16 })
                      }
                    ) });
                  default:
                    return /* @__PURE__ */ jsx("span", { children: "-" });
                }
              })() }, `${row.id}-${col.key}`))
            },
            row.id
          )),
          /* @__PURE__ */ jsx("tr", { ref: observerTarget, className: "h-4", children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "text-center p-2", children: isLoading.current && /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "Loading more..." }) }) })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  ProductionRunsIndex as default
};
