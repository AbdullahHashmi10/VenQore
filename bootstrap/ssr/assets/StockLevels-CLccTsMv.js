import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
import { usePage, Head } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { S as StockModuleTabs } from "./StockModuleTabs-CUSiTj2Q.js";
import { Package, TrendingUp, AlertTriangle, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-ulkv479L.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "use-debounce";
import "./SmartCombobox-D_cdCy9L.js";
function StockLevels({ products = [], warehouses = [], stats = {} }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const { props } = usePage();
  const store = props.store || {};
  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (activeFilter === "low") {
      result = result.filter((p) => {
        const stock = p.total_stock || 0;
        return stock > 0 && stock <= (p.min_stock_alert || 5);
      });
    } else if (activeFilter === "out") {
      result = result.filter((p) => (p.total_stock || 0) === 0);
    } else if (activeFilter === "normal") {
      result = result.filter((p) => (p.total_stock || 0) > (p.min_stock_alert || 5));
    }
    if (selectedWarehouse) {
      result = result.filter(
        (p) => p.stocks?.some((s) => s.warehouse_id == selectedWarehouse)
      );
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(term) || p.sku?.toLowerCase().includes(term) || p.category?.name?.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case "name":
          valA = a.name?.toLowerCase() || "";
          valB = b.name?.toLowerCase() || "";
          break;
        case "stock":
          valA = a.total_stock || 0;
          valB = b.total_stock || 0;
          break;
        case "value":
          valA = (a.total_stock || 0) * (a.cost_price || 0);
          valB = (b.total_stock || 0) * (b.cost_price || 0);
          break;
        default:
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
      }
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [products, activeFilter, selectedWarehouse, searchTerm, sortConfig]);
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Stock Levels", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Levels" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "levels" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Package, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Products" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-slate-900 dark:text-white", children: stats.total_products || products.length })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Stock Value" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-emerald-600", children: formatCurrency(stats.total_value, store) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Low Stock" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-amber-600", children: stats.low_stock_count || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg", children: /* @__PURE__ */ jsx(TrendingDown, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Out of Stock" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-black text-rose-600", children: stats.out_of_stock_count || 0 })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Stock ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Overview" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("all"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "All"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("low"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "low" ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Low Stock"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("out"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "out" ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "Out of Stock"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setActiveFilter("normal"),
              className: `px-2.5 py-1 text-2xs font-bold uppercase rounded-full transition-all ${activeFilter === "normal" ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"}`,
              children: "In Stock"
            }
          ),
          warehouses.length > 1 && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: selectedWarehouse,
                onChange: (e) => setSelectedWarehouse(e.target.value),
                className: "px-2 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "", children: "All Warehouses" }),
                  warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, children: w.name }, w.id))
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("div", { className: "w-64", children: /* @__PURE__ */ jsx(
          AsyncProductCombobox,
          {
            onSelect: (product) => {
              if (!product) {
                setSearchTerm("");
                return;
              }
              setSearchTerm(product.name);
            },
            placeholder: "Search products..."
          }
        ) }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("name"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Product ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "name" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Category" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("stock"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Total Stock ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "stock" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "Min Stock" }),
          /* @__PURE__ */ jsx("th", { className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider", children: "By Warehouse" }),
          /* @__PURE__ */ jsx(
            "th",
            {
              onClick: () => handleSort("value"),
              className: "p-3 text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800",
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                "Stock Value ",
                /* @__PURE__ */ jsx(SortIcon, { columnKey: "value" })
              ] })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredProducts.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "p-12", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Package, { size: 28, className: "text-slate-400" }) }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-slate-700 dark:text-slate-300 mb-1", children: "No products found" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Try adjusting your filters or search term" })
        ] }) }) }) : filteredProducts.map((row) => {
          const isLow = (row.total_stock || 0) <= (row.min_stock_alert || 0) && (row.total_stock || 0) > 0;
          const isOut = (row.total_stock || 0) === 0;
          return /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                                hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all
                                                ${isOut ? "bg-red-50/30 dark:bg-red-900/5 border-l-4 border-red-500" : isLow ? "bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-amber-500" : "border-l-4 border-transparent"}
                                            `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0", children: row.image_path ? /* @__PURE__ */ jsx("img", { src: `/storage/${row.image_path}`, alt: row.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Package, { size: 16, className: "text-slate-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm text-slate-800 dark:text-white", children: row.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-mono", children: row.sku || "No SKU" })
                  ] })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-600 dark:text-slate-300", children: row.category?.name || "Uncategorized" }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: `font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800 dark:text-white"}`, children: row.total_stock || 0 }),
                  isLow && /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-amber-500" }),
                  isOut && /* @__PURE__ */ jsx(AlertTriangle, { size: 14, className: "text-red-500" })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-500", children: row.min_stock_alert || 0 }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: row.stocks?.map((stock, idx) => /* @__PURE__ */ jsxs(
                  "span",
                  {
                    className: "px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded text-2xs font-medium",
                    title: stock.warehouse?.name,
                    children: [
                      stock.warehouse?.name?.substring(0, 3),
                      ": ",
                      stock.quantity
                    ]
                  },
                  idx
                )) }) }),
                /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm text-emerald-600", children: formatCurrency((row.total_stock || 0) * (row.cost_price || 0), store) }) })
              ]
            },
            row.id
          );
        }) })
      ] }) })
    ] })
  ] });
}
export {
  StockLevels as default
};
