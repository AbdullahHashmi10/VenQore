import { jsx, jsxs } from "react/jsx-runtime";
import "react";
import { usePage, Head, router } from "@inertiajs/react";
import { DollarSign, TrendingUp, Package } from "lucide-react";
import { M as MasterReport } from "./MasterReport-CaoE_ZJR.js";
import { R as ReportsLayout } from "./ReportsLayout-j-C8vueA.js";
import { f as formatCurrency, a as formatNumber } from "./format-B_ph0Qec.js";
import "recharts";
import "./OneGlanceLayout-C-94hBqK.js";
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
function StockValuation({ products = [], stats = {}, filters = {}, categories = [], warehouses = [] }) {
  const {
    store
  } = usePage().props;
  const reportStats = [
    {
      label: "Total Stock Value (Cost)",
      value: formatCurrency(stats.total_cost_value, store),
      icon: /* @__PURE__ */ jsx(DollarSign, { size: 18 }),
      type: "up"
    },
    {
      label: "Total Retail Value",
      value: formatCurrency(stats.total_retail_value, store),
      icon: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Potential Profit",
      value: formatCurrency(stats.potential_profit, store),
      icon: /* @__PURE__ */ jsx(DollarSign, { size: 18 }),
      type: "neutral"
    },
    {
      label: "Total Items",
      value: formatNumber(stats.total_items),
      icon: /* @__PURE__ */ jsx(Package, { size: 18 }),
      type: "neutral"
    }
  ];
  const columns = [
    {
      key: "name",
      label: "Product",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "font-medium text-slate-900 dark:text-white", children: row.name }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: row.sku })
      ] })
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row) => row.category?.name || "-"
    },
    {
      key: "remaining_qty",
      label: "Qty (FIFO)",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-semibold", children: formatNumber(row.stock_quantity) })
    },
    {
      key: "unit_cost",
      label: "FIFO Unit Cost",
      align: "right",
      render: (row) => formatCurrency(row.unit_cost, store)
    },
    {
      key: "sale_price",
      label: "Sale Price",
      align: "right",
      render: (row) => formatCurrency(row.sale_price, store)
    },
    {
      key: "stock_value",
      label: "Stock Value",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(row.stock_value, store) })
    },
    {
      key: "retail_value",
      label: "Retail Value",
      align: "right",
      sortable: true,
      render: (row) => /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-600 dark:text-slate-400", children: formatCurrency(row.retail_value, store) })
    }
  ];
  const filterDefs = [
    {
      key: "category_id",
      type: "select",
      label: "Category",
      options: categories.map((c) => ({ value: c.id, label: c.name }))
    },
    {
      key: "warehouse_id",
      type: "select",
      label: "Warehouse",
      options: warehouses.map((w) => ({ value: w.id, label: w.name }))
    }
  ];
  const handleFilterChange = (newValues) => {
    router.get(route("store.reports.stock-valuation", {
      store_slug: store.slug
    }), newValues, { preserveState: true, replace: true });
  };
  const handleExport = (type) => {
    console.log("StockValuation handleExport called with type:", type);
    console.log("Current products count:", products?.length);
    if (type === "print") {
      window.print();
      return;
    }
    if (type === "csv") {
      if (!products || products.length === 0) {
        alert("No data available to export.");
        return;
      }
      const csvRows = [];
      csvRows.push(["Product", "SKU", "Category", "Quantity", "FIFO Unit Cost", "Sale Price", "Stock Value (Cost)", "Retail Value"].join(","));
      products.forEach((row) => {
        csvRows.push([
          `"${row.name}"`,
          `"${row.sku}"`,
          `"${row.category?.name || ""}"`,
          row.stock_quantity,
          row.unit_cost,
          row.sale_price,
          row.stock_value,
          row.retail_value
        ].join(","));
      });
      console.log("Generated CSV rows:", csvRows.length);
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("hidden", "");
      a.setAttribute("href", url);
      a.setAttribute("download", `stock_valuation_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log("Download triggered.");
    }
  };
  return /* @__PURE__ */ jsxs(ReportsLayout, { title: "Stock Valuation", children: [
    /* @__PURE__ */ jsx(Head, { title: "Stock Valuation" }),
    /* @__PURE__ */ jsx("div", { className: "print:hidden", children: /* @__PURE__ */ jsx(
      MasterReport,
      {
        title: "Stock Valuation Report",
        stats: reportStats,
        columns,
        data: products,
        filters: filterDefs,
        filterValues: filters,
        onFilterChange: handleFilterChange,
        onExport: handleExport
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "hidden print:block p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10 border-b-2 border-slate-900 pb-6", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-black", children: store.name }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-600 uppercase tracking-widest mt-2", children: "Stock Valuation Report" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mt-1", children: [
          "Generated on ",
          (/* @__PURE__ */ new Date()).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-4 mb-10", children: reportStats.map((s, idx) => /* @__PURE__ */ jsxs("div", { className: "border p-4 rounded-xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase", children: s.label }),
        /* @__PURE__ */ jsx("p", { className: "text-xl font-black", children: s.value })
      ] }, idx)) }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b-2 border-slate-900", children: [
          /* @__PURE__ */ jsx("th", { className: "py-2 text-xs font-bold uppercase", children: "Product / SKU" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 text-xs font-bold uppercase text-right", children: "Qty" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 text-xs font-bold uppercase text-right", children: "Cost" }),
          /* @__PURE__ */ jsx("th", { className: "py-2 text-xs font-bold uppercase text-right", children: "Valuation" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y border-b", children: products.map((row, idx) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsxs("td", { className: "py-3", children: [
            /* @__PURE__ */ jsx("div", { className: "font-bold", children: row.name }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500", children: row.sku })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-bold", children: formatNumber(row.stock_quantity) }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: formatCurrency(row.unit_cost, store) }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-right font-black", children: formatCurrency(row.stock_value, store) })
        ] }, idx)) })
      ] })
    ] })
  ] });
}
export {
  StockValuation as default
};
