import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage, Head, Link } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { S as SellModuleTabs } from "./SellModuleTabs-_fjGjxMs.js";
import { S as SmartCombobox } from "./SmartCombobox-D_cdCy9L.js";
import { FileText, Clock, ChevronUp, ChevronDown, MoreVertical } from "lucide-react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "use-debounce";
function BestPreSales({ presales = [], stats = {} }) {
  const {
    store
  } = usePage().props;
  const defaultData = presales?.data || presales || [];
  const [sortedData, setSortedData] = useState(defaultData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [tableColumns, setTableColumns] = useState([
    { key: "date", label: "Date", width: "15%" },
    { key: "reference", label: "Quote No", width: "20%" },
    { key: "customer", label: "Customer", width: "25%" },
    { key: "amount", label: "Amount", width: "15%" },
    { key: "status", label: "Status", width: "15%" },
    { key: "actions", label: "Actions", width: "10%", frozen: true }
  ]);
  useEffect(() => {
    setSortedData(defaultData);
  }, [presales]);
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term) {
      setSortedData(defaultData);
    } else {
      const lower = term.toLowerCase();
      const filtered = defaultData.filter(
        (item) => (item.reference_number?.toLowerCase() || "").includes(lower) || (item.customer?.name?.toLowerCase() || "").includes(lower)
      );
      setSortedData(filtered);
    }
  };
  const applyFilter = (type) => {
    setActiveFilter(type);
    if (type === "all") {
      setSortedData(defaultData);
    } else {
      setSortedData(defaultData.filter((item) => item.status === type));
    }
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    const sorted = [...sortedData].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (key === "date") {
        valA = a.created_at;
        valB = b.created_at;
      }
      if (key === "reference") {
        valA = a.reference_number;
        valB = b.reference_number;
      }
      if (key === "customer") {
        valA = a.customer?.name;
        valB = b.customer?.name;
      }
      if (key === "amount") {
        valA = parseFloat(a.total || 0);
        valB = parseFloat(b.total || 0);
      }
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setSortedData(sorted);
  };
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
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
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Pre-Sales History", activeMenu: "Sell", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pre-Sales / Quotations" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(SellModuleTabs, { activeTab: "presales" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Quotes" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats.total_count || defaultData.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(Clock, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Pending" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-blue-600", children: defaultData.filter((i) => i.status === "pending").length })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0 flex items-center gap-2", children: [
            "Pre-Sales ",
            /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: "Quotations" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("pending"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "pending" ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Pending"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => applyFilter("converted"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "converted" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Converted"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-52", children: /* @__PURE__ */ jsx(
            SmartCombobox,
            {
              items: defaultData,
              value: searchTerm,
              onQueryChange: handleSearch,
              onSelect: (item) => setSearchTerm(item.reference_number),
              placeholder: "Search quotes...",
              displayKey: "reference_number",
              filterKey: "reference_number",
              inputClassName: "py-1.5 text-xs h-9"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: /* @__PURE__ */ jsxs(Link, { href: route("store.presales.create", {
            store_slug: store.slug
          }), className: "px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors", children: [
            /* @__PURE__ */ jsx(FileText, { size: 14 }),
            " New Quote"
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
              col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-amber-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-amber-500" }))
            ] })
          },
          col.key
        )) }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(FileText, { size: 32, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No pre-sales found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Create your first quotation" }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.presales.create", {
                store_slug: store.slug
              }),
              className: "px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx(FileText, { size: 16 }),
                " New Quote"
              ]
            }
          )
        ] }) }) }) : sortedData.map((row) => /* @__PURE__ */ jsx(
          "tr",
          {
            onClick: () => {
            },
            className: "hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group cursor-pointer",
            children: tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
              switch (col.key) {
                case "date":
                  return /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatDate(row.created_at) });
                case "reference":
                  return /* @__PURE__ */ jsx("span", { className: "font-mono text-amber-600 dark:text-amber-400 font-semibold", children: row.reference_number || "---" });
                case "customer":
                  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xs font-bold text-slate-500", children: (row.customer?.name || "W").charAt(0) }),
                    /* @__PURE__ */ jsx("span", { children: row.customer?.name || "Walk-in" })
                  ] });
                case "amount":
                  return /* @__PURE__ */ jsx("span", { className: "font-bold", children: formatCurrency(row.total) });
                case "status":
                  const styles = {
                    pending: "bg-amber-100 text-amber-700",
                    converted: "bg-emerald-100 text-emerald-700"
                  };
                  return /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-md text-xs font-bold uppercase ${styles[row.status] || "bg-slate-100 text-slate-700"}`, children: row.status || "pending" });
                case "actions":
                  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2", children: /* @__PURE__ */ jsx("button", { className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400", children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 }) }) });
                default:
                  return /* @__PURE__ */ jsx("span", { children: "-" });
              }
            })() }, `${row.id}-${col.key}`))
          },
          row.id
        )) })
      ] }) })
    ] })
  ] });
}
export {
  BestPreSales as default
};
