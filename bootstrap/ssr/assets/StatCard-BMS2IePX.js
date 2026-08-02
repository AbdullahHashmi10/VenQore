import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { Download, Filter, MoreHorizontal, Eye, Edit, Trash2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { S as SmartCombobox } from "./SmartCombobox-D_cdCy9L.js";
function DataTable({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  searchable = true,
  selectable = false,
  emptyMessage = "No data found",
  loading = false,
  actions = [],
  pageSize: initialPageSize = 10,
  onExport,
  title,
  subtitle,
  headerActions,
  disablePagination = false,
  emptyState
  // Custom empty state component
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(
      (item) => columns.some((col) => {
        const value = item[col.key];
        if (value === null || value === void 0) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === null || aVal === void 0) return 1;
      if (bVal === null || bVal === void 0) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);
  const paginatedData = useMemo(() => {
    if (disablePagination) return sortedData;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, disablePagination]);
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map((_, idx) => idx));
    }
  };
  const handleRowSelect = (idx) => {
    setSelectedRows(
      (prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "opacity-0 group-hover:opacity-30" });
    }
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" });
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden", children: [
    (title || searchable || headerActions) && /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        title && /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: subtitle })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        searchable && /* @__PURE__ */ jsx("div", { className: "w-48 md:w-64", children: /* @__PURE__ */ jsx(
          SmartCombobox,
          {
            items: data,
            value: searchTerm,
            onQueryChange: (val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            },
            onSelect: (item) => {
              const key = columns[0]?.key || "name";
              setSearchTerm(item[key]);
              setCurrentPage(1);
            },
            placeholder: "Search...",
            displayKey: columns[0]?.key || "name",
            filterKey: columns[0]?.key || "name"
          }
        ) }),
        onExport && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onExport,
            className: "p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
            title: "Export",
            children: /* @__PURE__ */ jsx(Download, { size: 18 })
          }
        ),
        headerActions
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50", children: [
        selectable && /* @__PURE__ */ jsx("th", { className: "w-12 px-4 py-3", children: /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: selectedRows.length === paginatedData.length && paginatedData.length > 0,
            onChange: handleSelectAll,
            className: "rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
          }
        ) }),
        columns.map((col) => /* @__PURE__ */ jsx(
          "th",
          {
            className: `px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.sortable !== false ? "cursor-pointer group" : ""}`,
            onClick: () => col.sortable !== false && handleSort(col.key),
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              col.label,
              col.sortable !== false && renderSortIcon(col.key)
            ] })
          },
          col.key
        )),
        (onEdit || onDelete || onView || actions.length > 0) && /* @__PURE__ */ jsx("th", { className: "w-20 px-4 py-3 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: loading ? (
        // Loading skeleton
        [...Array(5)].map((_, idx) => /* @__PURE__ */ jsxs("tr", { children: [
          selectable && /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" }) }),
          columns.map((col) => /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" }) }, col.key)),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx("div", { className: "h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-8 ml-auto" }) })
        ] }, idx))
      ) : paginatedData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
        "td",
        {
          colSpan: columns.length + (selectable ? 1 : 0) + 1,
          className: "px-4 py-12 text-center text-slate-500 dark:text-slate-400",
          children: emptyState ? emptyState : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx(Filter, { size: 24, className: "opacity-50" }),
            /* @__PURE__ */ jsx("span", { children: emptyMessage })
          ] })
        }
      ) }) : paginatedData.map((row, rowIdx) => /* @__PURE__ */ jsxs(
        "tr",
        {
          className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
          children: [
            selectable && /* @__PURE__ */ jsx("td", { className: "px-4 py-4", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: selectedRows.includes(rowIdx),
                onChange: () => handleRowSelect(rowIdx),
                className: "rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              }
            ) }),
            columns.map((col) => /* @__PURE__ */ jsx("td", { className: "px-4 py-4 text-sm text-slate-700 dark:text-slate-300", children: col.render ? col.render(row[col.key], row) : row[col.key] }, col.key)),
            (onEdit || onDelete || onView || actions.length > 0) && /* @__PURE__ */ jsxs("td", { className: "px-4 py-4 text-right relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setActiveDropdown(activeDropdown === rowIdx ? null : rowIdx),
                  className: "p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                  children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 16, className: "text-slate-500" })
                }
              ),
              activeDropdown === rowIdx && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "fixed inset-0 z-10",
                    onClick: () => setActiveDropdown(null)
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "absolute right-4 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-20 min-w-[140px]", children: [
                  onView && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        onView(row);
                        setActiveDropdown(null);
                      },
                      className: "w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2",
                      children: [
                        /* @__PURE__ */ jsx(Eye, { size: 14 }),
                        " View"
                      ]
                    }
                  ),
                  onEdit && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        onEdit(row);
                        setActiveDropdown(null);
                      },
                      className: "w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2",
                      children: [
                        /* @__PURE__ */ jsx(Edit, { size: 14 }),
                        " Edit"
                      ]
                    }
                  ),
                  actions.map((action, idx) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        action.onClick(row);
                        setActiveDropdown(null);
                      },
                      className: `w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${action.color || "text-slate-700 dark:text-slate-300"}`,
                      children: [
                        action.icon && /* @__PURE__ */ jsx(action.icon, { size: 14 }),
                        action.label
                      ]
                    },
                    idx
                  )),
                  onDelete && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => {
                          onDelete(row);
                          setActiveDropdown(null);
                        },
                        className: "w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2",
                        children: [
                          /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                          " Delete"
                        ]
                      }
                    )
                  ] })
                ] })
              ] })
            ] })
          ]
        },
        rowIdx
      )) })
    ] }) }),
    !disablePagination && !loading && sortedData.length > 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
        "Showing ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: (currentPage - 1) * pageSize + 1 }),
        " to ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: Math.min(currentPage * pageSize, sortedData.length) }),
        " of ",
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: sortedData.length }),
        " results"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "select",
          {
            value: pageSize,
            onChange: (e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            },
            className: "px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none",
            children: [10, 25, 50, 100].map((size) => /* @__PURE__ */ jsxs("option", { value: size, children: [
              size,
              " per page"
            ] }, size))
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setCurrentPage((p) => Math.max(1, p - 1)),
              disabled: currentPage === 1,
              className: "p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: /* @__PURE__ */ jsx(ChevronLeft, { size: 18 })
            }
          ),
          [...Array(Math.min(5, totalPages))].map((_, idx) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = idx + 1;
            } else if (currentPage <= 3) {
              pageNum = idx + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + idx;
            } else {
              pageNum = currentPage - 2 + idx;
            }
            return /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setCurrentPage(pageNum),
                className: `w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"}`,
                children: pageNum
              },
              idx
            );
          }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
              disabled: currentPage === totalPages,
              className: "p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
              children: /* @__PURE__ */ jsx(ChevronRight, { size: 18 })
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "indigo",
  trend,
  trendLabel,
  loading = false,
  onClick,
  className = ""
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    slate: "bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400"
  };
  const glowClasses = {
    indigo: "bg-indigo-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    red: "bg-red-500/10",
    purple: "bg-purple-500/10",
    blue: "bg-blue-500/10",
    slate: "bg-slate-500/10"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick,
      className: `
                bg-white dark:bg-slate-900 rounded-2xl p-6
                shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none
                border border-slate-100 dark:border-slate-800
                relative overflow-hidden group
                ${onClick ? "cursor-pointer hover:-translate-y-1" : ""}
                transition-all duration-300
                ${className}
            `,
      children: [
        /* @__PURE__ */ jsx("div", { className: `absolute -right-6 -top-6 w-24 h-24 ${glowClasses[iconColor]} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700` }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              Icon && /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${colorClasses[iconColor]} shadow-sm`, children: /* @__PURE__ */ jsx(Icon, { size: 20 }) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: title })
            ] }),
            trend !== void 0 && /* @__PURE__ */ jsxs("span", { className: `
                            text-2xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1
                            ${trend >= 0 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"}
                        `, children: [
              trend >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { size: 10 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 10 }),
              Math.abs(trend),
              "%"
            ] })
          ] }),
          loading ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" }),
            /* @__PURE__ */ jsx("div", { className: "h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-800 dark:text-white", children: value }),
            (subtitle || trendLabel) && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: subtitle || trendLabel })
          ] })
        ] })
      ]
    }
  );
}
function StatCardGrid({ children, columns = 4 }) {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
  };
  return /* @__PURE__ */ jsx("div", { className: `grid ${colClasses[columns]} gap-6`, children });
}
export {
  DataTable as D,
  StatCardGrid as S,
  StatCard as a
};
